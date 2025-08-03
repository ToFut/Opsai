import { AirbyteConnector, AirbyteSource } from '../connectors/airbyte-connector';
import { IntegrationError } from '../errors';
import { prisma } from '@opsai/database';
import { discoveryContext } from '@opsai/core';
import { Logger } from '@opsai/shared';
import type { DiscoveredDataSource, DiscoveredSchema, DiscoveredTable, DiscoveredColumn, SchemaRelationship, TableIndex, BusinessEntity } from '@opsai/shared';

export interface DataDiscoveryConfig {
  airbyte: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    workspaceId?: string;
  };
  analysis: {
    maxSampleRows?: number;
    schemaInferenceThreshold?: number;
    relationshipDetectionEnabled?: boolean;
    businessPatternDetectionEnabled?: boolean;
  };
  retry?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
  };
  cache?: {
    enabled?: boolean;
    ttl?: number;
  };
}

export interface DiscoveredDataSource {
  id: string;
  name: string;
  type: string;
  connectionStatus: 'connected' | 'failed' | 'pending';
  schema: DiscoveredSchema;
  sampleData?: Record<string, any>[];
  metadata: {
    recordCount?: number;
    lastUpdated?: Date;
    syncFrequency?: string;
    dataFreshness?: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  };
}

export interface DiscoveredSchema {
  tables: DiscoveredTable[];
  relationships: SchemaRelationship[];
  businessContext: BusinessContext;
}

export interface DiscoveredTable {
  name: string;
  displayName: string;
  description?: string;
  columns: DiscoveredColumn[];
  primaryKey?: string[];
  indexes?: TableIndex[];
  estimatedRowCount?: number;
  businessEntity?: {
    type: string;
    confidence: number;
    suggestedName: string;
  };
}

export interface DiscoveredColumn {
  name: string;
  displayName: string;
  type: string;
  nullable: boolean;
  description?: string;
  sampleValues?: any[];
  uniqueValueCount?: number;
  nullPercentage?: number;
  businessMeaning?: {
    category: 'identifier' | 'name' | 'description' | 'amount' | 'date' | 'status' | 'metadata';
    confidence: number;
    suggestedLabel?: string;
  };
  validation?: {
    format?: string;
    pattern?: string;
    constraints?: string[];
  };
}

export interface SchemaRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  confidence: number;
}

export interface BusinessContext {
  domain: string;
  subDomain?: string;
  confidence: number;
  suggestedEntities: BusinessEntity[];
  suggestedWorkflows: BusinessWorkflow[];
}

export interface BusinessEntity {
  name: string;
  type: 'core' | 'lookup' | 'transaction' | 'audit';
  tables: string[];
  keyAttributes: string[];
  confidence: number;
}

export interface BusinessWorkflow {
  name: string;
  description: string;
  entities: string[];
  steps: WorkflowStep[];
  confidence: number;
}

export interface WorkflowStep {
  name: string;
  type: 'create' | 'read' | 'update' | 'delete' | 'process' | 'validate';
  entities: string[];
  conditions?: string[];
}

export class DataDiscoveryService {
  private airbyteConnector: AirbyteConnector;
  private config: DataDiscoveryConfig;
  private logger: Logger;
  private retryAttempts: Map<string, number> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: DataDiscoveryConfig) {
    this.config = {
      ...config,
      retry: {
        maxAttempts: config.retry?.maxAttempts || 3,
        initialDelay: config.retry?.initialDelay || 1000,
        maxDelay: config.retry?.maxDelay || 30000,
        ...config.retry
      },
      cache: {
        enabled: config.cache?.enabled ?? true,
        ttl: config.cache?.ttl || 3600000, // 1 hour default
        ...config.cache
      }
    };
    
    this.logger = new Logger('DataDiscoveryService');
    
    this.airbyteConnector = new AirbyteConnector({
      name: 'discovery-airbyte',
      version: '1.0.0',
      type: 'airbyte',
      apiKey: config.airbyte.apiKey || '',
      clientId: config.airbyte.clientId || '',
      clientSecret: config.airbyte.clientSecret || '',
      workspaceId: config.airbyte.workspaceId,
      capabilities: ['discovery', 'sync', 'schema-detection']
    });
  }

  /**
   * Authenticate and test connection to data sources with retry logic
   */
  async authenticateDataSource(sourceConfig: {
    type: string;
    connectionConfig: any;
    credentials: any;
  }): Promise<{ success: boolean; error?: string; sourceId?: string }> {
    const operationId = `auth_${sourceConfig.type}_${Date.now()}`;
    
    try {
      // Update discovery context
      discoveryContext.updatePhase('authenticating', 10, `Authenticating ${sourceConfig.type} data source`);
      
      // Execute with retry logic
      const result = await this.executeWithRetry(operationId, async () => {
        await this.airbyteConnector.connect();

        this.logger.info(`Creating test source for ${sourceConfig.type}`);
        
        // Create a test source in Airbyte
        const source = await this.airbyteConnector.execute('create_source', {
          name: `test-${sourceConfig.type}-${Date.now()}`,
          sourceType: sourceConfig.type,
          configuration: {
            ...sourceConfig.connectionConfig,
            ...sourceConfig.credentials
          }
        });

        this.logger.info(`Testing connection for source ${source.sourceId}`);
        
        // Test the connection by discovering schema
        const schema = await this.airbyteConnector.execute('discover_schema', {
          sourceId: source.sourceId
        });

        return {
          success: true,
          sourceId: source.sourceId
        };
      });
      
      discoveryContext.updatePhase('authenticating', 20, `Successfully authenticated ${sourceConfig.type}`);
      return result;

    } catch (error: any) {
      this.logger.error(`Authentication failed for ${sourceConfig.type}:`, error);
      
      discoveryContext.addError({
        phase: 'authenticating',
        component: 'DataDiscoveryService',
        message: `Failed to authenticate ${sourceConfig.type}: ${error.message}`,
        details: error,
        recoverable: false
      });
      
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  }

  /**
   * Discover and analyze data structure from connected sources with caching and retry
   */
  async discoverDataStructure(sourceId: string): Promise<DiscoveredDataSource> {
    const cacheKey = `discovery_${sourceId}`;
    
    // Check cache first
    if (this.config.cache.enabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.logger.info(`Returning cached discovery data for source ${sourceId}`);
        return cached;
      }
    }
    
    const operationId = `discover_${sourceId}`;
    
    try {
      discoveryContext.updatePhase('discovering', 30, `Discovering data structure for source ${sourceId}`);
      
      // Execute with retry logic
      const result = await this.executeWithRetry(operationId, async () => {
        // Get source information
        this.logger.info(`Fetching source information for ${sourceId}`);
        const sources = await this.airbyteConnector.execute('list_sources', {
          workspaceId: this.config.airbyte.workspaceId
        });
        
        const source = sources.find((s: AirbyteSource) => s.sourceId === sourceId);
        if (!source) {
          throw new IntegrationError('Source not found', 'SOURCE_NOT_FOUND');
        }

        discoveryContext.updatePhase('discovering', 40, `Discovering schema for ${source.name}`);
        
        // Discover schema
        this.logger.info(`Discovering schema for source ${sourceId}`);
        const rawSchema = await this.airbyteConnector.execute('discover_schema', {
          sourceId
        });

        discoveryContext.updatePhase('discovering', 50, `Analyzing schema structure`);
        
        // Analyze schema and infer business context
        const analyzedSchema = await this.analyzeSchema(rawSchema);

        discoveryContext.updatePhase('discovering', 60, `Fetching sample data`);
        
        // Get sample data for analysis
        const sampleData = await this.getSampleData(sourceId, analyzedSchema);

        discoveryContext.updatePhase('discovering', 70, `Enhancing schema analysis with sample data`);
        
        // Enhance analysis with sample data
        const enhancedSchema = await this.enhanceSchemaWithSampleData(analyzedSchema, sampleData);

        const discoveredSource: DiscoveredDataSource = {
          id: sourceId,
          name: source.name,
          type: this.extractSourceType(source),
          connectionStatus: 'connected',
          metadata: {
            schema: enhancedSchema,
            sampleData: sampleData.slice(0, 10), // First 10 rows for preview
            recordCount: await this.estimateRecordCount(sourceId),
            lastUpdated: new Date(),
            syncFrequency: 'daily',
            dataFreshness: this.inferDataFreshness(enhancedSchema)
          }
        };
        
        // Add to discovery context
        discoveryContext.addDiscoveredSource(discoveredSource);
        
        return discoveredSource;
      });
      
      // Cache the result
      if (this.config.cache.enabled) {
        this.setInCache(cacheKey, result);
      }
      
      discoveryContext.updatePhase('discovering', 80, `Successfully discovered data structure for ${result.name}`);
      
      return result;

    } catch (error: any) {
      this.logger.error(`Failed to discover data structure for ${sourceId}:`, error);
      
      discoveryContext.addError({
        phase: 'discovering',
        component: 'DataDiscoveryService',
        message: `Failed to discover data structure: ${error.message}`,
        details: error,
        recoverable: error.code === 'SOURCE_NOT_FOUND' ? false : true
      });
      
      throw new IntegrationError(
        `Failed to discover data structure: ${error.message}`,
        'DISCOVERY_FAILED',
        error
      );
    }
  }

  /**
   * Analyze schema to infer business meaning and relationships
   */
  private async analyzeSchema(rawSchema: any): Promise<DiscoveredSchema> {
    const streams = rawSchema.catalog?.streams || [];
    const tables: DiscoveredTable[] = [];
    const relationships: SchemaRelationship[] = [];

    // Analyze each table/stream
    for (const stream of streams) {
      const table = await this.analyzeTable(stream);
      tables.push(table);
    }

    // Detect relationships between tables
    const detectedRelationships = await this.detectRelationships(tables);
    relationships.push(...detectedRelationships);

    // Infer business context
    const businessContext = await this.inferBusinessContext(tables, relationships);

    return {
      tables,
      relationships,
      businessContext
    };
  }

  /**
   * Analyze individual table structure and meaning
   */
  private async analyzeTable(stream: any): Promise<DiscoveredTable> {
    const schema = stream.stream.jsonSchema;
    const tableName = stream.stream.name;
    const columns: DiscoveredColumn[] = [];

    // Analyze each column
    const properties = schema.properties || {};
    for (const [columnName, columnDef] of Object.entries(properties)) {
      const column = await this.analyzeColumn(columnName, columnDef as any, tableName);
      columns.push(column);
    }

    // Infer business entity type
    const businessEntity = await this.inferTableBusinessType(tableName, columns);

    return {
      name: tableName,
      displayName: this.humanizeTableName(tableName),
      columns,
      primaryKey: this.inferPrimaryKey(columns),
      businessEntity
    };
  }

  /**
   * Analyze individual column
   */
  private async analyzeColumn(name: string, definition: any, tableName: string): Promise<DiscoveredColumn> {
    const type = this.mapDataType(definition.type);
    const nullable = !definition.required;

    // Infer business meaning from column name and type
    const businessMeaning = this.inferColumnBusinessMeaning(name, type, tableName);

    return {
      name,
      displayName: this.humanizeColumnName(name),
      type,
      nullable,
      businessMeaning,
      validation: this.inferValidationRules(name, type, definition)
    };
  }

  /**
   * Detect relationships between tables
   */
  private async detectRelationships(tables: DiscoveredTable[]): Promise<SchemaRelationship[]> {
    const relationships: SchemaRelationship[] = [];

    if (!this.config.analysis?.relationshipDetectionEnabled) {
      return relationships;
    }

    // Look for foreign key patterns
    for (const table of tables) {
      for (const column of table.columns) {
        // Look for columns that might be foreign keys
        if (this.isForeignKeyCandidate(column.name, column.type)) {
          const referencedTable = this.findReferencedTable(column.name, tables);
          if (referencedTable) {
            relationships.push({
              name: `${table.name}_${column.name}_to_${referencedTable.name}`,
              from: {
                table: table.name,
                column: column.name
              },
              to: {
                table: referencedTable.name,
                column: referencedTable.primaryKey?.[0] || 'id'
              },
              type: 'many-to-one',
              metadata: {
                confidence: 0.8
              }
            });
          }
        }
      }
    }

    return relationships;
  }

  /**
   * Infer business context from schema analysis
   */
  private async inferBusinessContext(tables: DiscoveredTable[], relationships: SchemaRelationship[]): Promise<BusinessContext> {
    const entities = this.extractBusinessEntities(tables);
    const workflows = this.inferBusinessWorkflows(entities, relationships);
    const domain = this.inferBusinessDomain(entities);

    return {
      domain: domain.name,
      subDomain: domain.subDomain,
      confidence: domain.confidence,
      suggestedEntities: entities,
      suggestedWorkflows: workflows
    };
  }

  /**
   * Get sample data for analysis with error handling
   */
  private async getSampleData(sourceId: string, schema: DiscoveredSchema): Promise<Record<string, any>[]> {
    const operationId = `sample_${sourceId}`;
    
    try {
      return await this.executeWithRetry(operationId, async () => {
        this.logger.info(`Fetching sample data for source ${sourceId}`);
        
        // This would typically involve setting up a temporary sync to get sample data
        // For now, we'll simulate with generated data based on schema
        const sampleData: Record<string, any>[] = [];
        
        // Generate sample data based on schema (simplified version)
        for (const table of schema.tables.slice(0, 3)) { // First 3 tables
          for (let i = 0; i < Math.min(this.config.analysis?.maxSampleRows || 100, 100); i++) {
            const row: Record<string, any> = {
              _table: table.name
            };
            
            for (const column of table.columns.slice(0, 10)) { // First 10 columns
              row[column.name] = this.generateSampleValue(column);
            }
            
            sampleData.push(row);
          }
        }
        
        return sampleData;
      }, { maxAttempts: 2 }); // Lower retry attempts for sample data
      
    } catch (error) {
      this.logger.warn('Failed to get sample data:', error);
      
      // Sample data failure is not critical, return empty array
      discoveryContext.addError({
        phase: 'discovering',
        component: 'DataDiscoveryService',
        message: 'Failed to fetch sample data, continuing with schema analysis only',
        details: error,
        recoverable: true
      });
      
      return [];
    }
  }

  /**
   * Enhance schema analysis with sample data insights
   */
  private async enhanceSchemaWithSampleData(
    schema: DiscoveredSchema, 
    sampleData: Record<string, any>[]
  ): Promise<DiscoveredSchema> {
    if (sampleData.length === 0) {
      return schema;
    }

    // Enhance column analysis with sample data statistics
    for (const table of schema.tables) {
      const tableData = sampleData.filter(row => this.belongsToTable(row, table.name));
      
      for (const column of table.columns) {
        if (tableData.length > 0) {
          column.sampleValues = this.extractSampleValues(tableData, column.name);
          column.uniqueValueCount = this.countUniqueValues(tableData, column.name);
          column.nullPercentage = this.calculateNullPercentage(tableData, column.name);
          
          // Enhance business meaning with sample data insights
          if (column.businessMeaning) {
            column.businessMeaning.confidence = this.adjustConfidenceWithSamples(
              column.businessMeaning.confidence,
              column.sampleValues
            );
          }
        }
      }
    }

    return schema;
  }

  // Helper methods for business logic inference

  private mapDataType(type: string | string[]): string {
    if (Array.isArray(type)) {
      type = type.find(t => t !== 'null') || 'string';
    }

    const mapping: Record<string, string> = {
      'string': 'VARCHAR',
      'integer': 'INTEGER',
      'number': 'DECIMAL',
      'boolean': 'BOOLEAN',
      'object': 'JSON',
      'array': 'JSON'
    };

    return mapping[type] || 'VARCHAR';
  }

  private humanizeTableName(name: string): string {
    return name
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private humanizeColumnName(name: string): string {
    return name
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private inferColumnBusinessMeaning(name: string, type: string, tableName: string): DiscoveredColumn['businessMeaning'] {
    const lowerName = name.toLowerCase();
    
    // Identifier patterns
    if (lowerName.includes('id') || lowerName === 'uuid' || lowerName === 'guid') {
      return { category: 'identifier', confidence: 0.9, suggestedLabel: 'ID' };
    }

    // Name patterns
    if (lowerName.includes('name') || lowerName.includes('title') || lowerName.includes('label')) {
      return { category: 'name', confidence: 0.8, suggestedLabel: 'Name' };
    }

    // Amount patterns
    if (lowerName.includes('amount') || lowerName.includes('price') || lowerName.includes('cost') || 
        lowerName.includes('total') || lowerName.includes('value')) {
      return { category: 'amount', confidence: 0.8, suggestedLabel: 'Amount' };
    }

    // Date patterns
    if (lowerName.includes('date') || lowerName.includes('time') || lowerName.includes('created') || 
        lowerName.includes('updated') || lowerName.includes('modified')) {
      return { category: 'date', confidence: 0.9, suggestedLabel: 'Date' };
    }

    // Status patterns  
    if (lowerName.includes('status') || lowerName.includes('state') || lowerName.includes('active')) {
      return { category: 'status', confidence: 0.8, suggestedLabel: 'Status' };
    }

    // Description patterns
    if (lowerName.includes('description') || lowerName.includes('comment') || lowerName.includes('note')) {
      return { category: 'description', confidence: 0.8, suggestedLabel: 'Description' };
    }

    return { category: 'metadata', confidence: 0.3 };
  }

  private inferTableBusinessType(tableName: string, columns: DiscoveredColumn[]): DiscoveredTable['businessEntity'] {
    const lowerName = tableName.toLowerCase();
    
    // Transaction entities
    if (lowerName.includes('order') || lowerName.includes('transaction') || lowerName.includes('payment') ||
        lowerName.includes('invoice') || lowerName.includes('booking')) {
      return { 
        type: 'transaction', 
        confidence: 0.9, 
        suggestedName: this.humanizeTableName(tableName) 
      };
    }

    // Core entities
    if (lowerName.includes('user') || lowerName.includes('customer') || lowerName.includes('client') ||
        lowerName.includes('product') || lowerName.includes('item') || lowerName.includes('account')) {
      return { 
        type: 'core', 
        confidence: 0.9, 
        suggestedName: this.humanizeTableName(tableName) 
      };
    }

    // Lookup entities
    if (lowerName.includes('category') || lowerName.includes('type') || lowerName.includes('status') ||
        lowerName.includes('config') || lowerName.includes('lookup')) {
      return { 
        type: 'lookup', 
        confidence: 0.8, 
        suggestedName: this.humanizeTableName(tableName) 
      };
    }

    // Audit entities
    if (lowerName.includes('log') || lowerName.includes('audit') || lowerName.includes('history') ||
        lowerName.includes('event')) {
      return { 
        type: 'audit', 
        confidence: 0.8, 
        suggestedName: this.humanizeTableName(tableName) 
      };
    }

    return { 
      type: 'core', 
      confidence: 0.5, 
      suggestedName: this.humanizeTableName(tableName) 
    };
  }

  private inferPrimaryKey(columns: DiscoveredColumn[]): string[] | undefined {
    // Look for common primary key patterns
    const pkCandidates = columns.filter(col => 
      col.name.toLowerCase() === 'id' || 
      col.name.toLowerCase().endsWith('_id') ||
      col.name.toLowerCase() === 'uuid' ||
      col.businessMeaning?.category === 'identifier'
    );

    if (pkCandidates.length > 0) {
      return [pkCandidates[0].name];
    }

    return undefined;
  }

  private isForeignKeyCandidate(columnName: string, type: string): boolean {
    const lowerName = columnName.toLowerCase();
    return lowerName.endsWith('_id') && lowerName !== 'id' && 
           (type === 'INTEGER' || type === 'VARCHAR');
  }

  private findReferencedTable(columnName: string, tables: DiscoveredTable[]): DiscoveredTable | null {
    const referencedTableName = columnName.toLowerCase().replace('_id', '');
    return tables.find(table => 
      table.name.toLowerCase() === referencedTableName ||
      table.name.toLowerCase() === referencedTableName + 's'
    ) || null;
  }

  private extractBusinessEntities(tables: DiscoveredTable[]): BusinessEntity[] {
    return tables.map(table => ({
      name: table.businessEntity?.suggestedName || table.displayName || table.name,
      type: (table.businessEntity?.type || 'core') as 'core' | 'lookup' | 'transaction' | 'audit',
      tables: [table.name],
      keyAttributes: table.columns
        .filter(col => col.businessMeaning?.category === 'name' || col.businessMeaning?.category === 'identifier')
        .map(col => col.name),
      confidence: table.businessEntity?.confidence || 0.5
    }));
  }

  private inferBusinessWorkflows(entities: BusinessEntity[], relationships: SchemaRelationship[]): BusinessWorkflow[] {
    // This is a simplified workflow inference - in practice, this would be much more sophisticated
    const workflows: BusinessWorkflow[] = [];

    // Look for common patterns
    const transactionEntities = entities.filter(e => e.type === 'transaction');
    const coreEntities = entities.filter(e => e.type === 'core');

    if (transactionEntities.length > 0 && coreEntities.length > 0) {
      workflows.push({
        name: 'Transaction Processing',
        description: 'Process transactions for core entities',
        entities: [...transactionEntities.map(e => e.name), ...coreEntities.map(e => e.name)],
        steps: [
          { name: 'Create Transaction', type: 'create', entities: transactionEntities.map(e => e.name) },
          { name: 'Validate Transaction', type: 'validate', entities: transactionEntities.map(e => e.name) },
          { name: 'Update Core Entity', type: 'update', entities: coreEntities.map(e => e.name) }
        ],
        confidence: 0.7
      });
    }

    return workflows;
  }

  private inferBusinessDomain(entities: BusinessEntity[]): { name: string; subDomain?: string; confidence: number } {
    const entityNames = entities.map(e => e.name.toLowerCase()).join(' ');

    // E-commerce patterns
    if (entityNames.includes('order') || entityNames.includes('product') || entityNames.includes('customer')) {
      return { name: 'E-commerce', confidence: 0.8 };
    }

    // CRM patterns
    if (entityNames.includes('lead') || entityNames.includes('contact') || entityNames.includes('opportunity')) {
      return { name: 'CRM', confidence: 0.8 };
    }

    // Healthcare patterns
    if (entityNames.includes('patient') || entityNames.includes('appointment') || entityNames.includes('treatment')) {
      return { name: 'Healthcare', confidence: 0.8 };
    }

    // Finance patterns
    if (entityNames.includes('account') || entityNames.includes('transaction') || entityNames.includes('payment')) {
      return { name: 'Finance', confidence: 0.7 };
    }

    return { name: 'General Business', confidence: 0.4 };
  }

  private inferValidationRules(name: string, type: string, definition: any): DiscoveredColumn['validation'] {
    const rules: DiscoveredColumn['validation'] = {};

    // Email validation
    if (name.toLowerCase().includes('email')) {
      rules.format = 'email';
      rules.pattern = '^[^@]+@[^@]+\\.[^@]+$';
    }

    // Phone validation
    if (name.toLowerCase().includes('phone')) {
      rules.format = 'phone';
    }

    // URL validation
    if (name.toLowerCase().includes('url') || name.toLowerCase().includes('website')) {
      rules.format = 'url';
    }

    return Object.keys(rules).length > 0 ? rules : undefined;
  }

  // Sample data analysis helpers
  private belongsToTable(row: Record<string, any>, tableName: string): boolean {
    // Simple heuristic - in practice this would be more sophisticated
    return true;
  }

  private extractSampleValues(data: Record<string, any>[], columnName: string): any[] {
    return data.map(row => row[columnName]).filter(val => val != null).slice(0, 5);
  }

  private countUniqueValues(data: Record<string, any>[], columnName: string): number {
    const values = data.map(row => row[columnName]).filter(val => val != null);
    return new Set(values).size;
  }

  private calculateNullPercentage(data: Record<string, any>[], columnName: string): number {
    const nullCount = data.filter(row => row[columnName] == null).length;
    return (nullCount / data.length) * 100;
  }

  private adjustConfidenceWithSamples(baseConfidence: number, sampleValues: any[]): number {
    // Adjust confidence based on sample data quality
    if (sampleValues.length === 0) return baseConfidence * 0.5;
    if (sampleValues.length >= 3) return Math.min(baseConfidence * 1.2, 1.0);
    return baseConfidence;
  }

  private extractSourceType(source: AirbyteSource): string {
    return source.sourceDefinitionId?.split('-')[0] || 'unknown';
  }

  private async estimateRecordCount(sourceId: string): Promise<number> {
    // This would involve running a count query or estimation - placeholder for now
    return 0;
  }

  private inferDataFreshness(schema: DiscoveredSchema): 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly' {
    // Look for timestamp columns to infer freshness
    const hasRealtimeColumns = schema.tables.some(table => 
      table.columns.some(col => 
        col.name.toLowerCase().includes('created') || 
        col.name.toLowerCase().includes('updated')
      )
    );

    return hasRealtimeColumns ? 'daily' : 'weekly';
  }

  /**
   * Save discovered data structure to database
   */
  async saveDiscoveredStructure(tenantId: string, discovery: DiscoveredDataSource): Promise<string> {
    const discoveryRecord = await prisma.discoverySession.create({
      data: {
        tenantId,
        projectName: `discovery_${discovery.name}`,
        discoveredSources: [discovery] as any,
        schemaAnalysis: discovery.metadata?.schema || {},
        businessFlows: {},
        yamlConfig: '',
        uiStructure: {},
        status: discovery.connectionStatus === 'connected' ? 'completed' : 'failed'
      }
    });

    return discoveryRecord.id;
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operationId: string,
    operation: () => Promise<T>,
    options?: { maxAttempts?: number }
  ): Promise<T> {
    const maxAttempts = options?.maxAttempts || this.config.retry.maxAttempts;
    const attempts = this.retryAttempts.get(operationId) || 0;
    
    try {
      const result = await operation();
      this.retryAttempts.delete(operationId);
      return result;
    } catch (error) {
      const nextAttempt = attempts + 1;
      this.retryAttempts.set(operationId, nextAttempt);
      
      if (nextAttempt >= maxAttempts) {
        this.retryAttempts.delete(operationId);
        throw error;
      }
      
      const delay = Math.min(
        this.config.retry.initialDelay * Math.pow(2, attempts),
        this.config.retry.maxDelay
      );
      
      this.logger.warn(
        `Operation ${operationId} failed (attempt ${nextAttempt}/${maxAttempts}), retrying in ${delay}ms`
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.executeWithRetry(operationId, operation, options);
    }
  }
  
  /**
   * Get data from cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.config.cache.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }
  
  /**
   * Set data in cache
   */
  private setInCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Generate sample value based on column definition
   */
  private generateSampleValue(column: DiscoveredColumn): any {
    switch (column.businessMeaning?.category) {
      case 'identifier':
        return `ID_${Math.random().toString(36).substr(2, 9)}`;
      case 'name':
        return `Sample ${column.displayName}`;
      case 'amount':
        return Math.floor(Math.random() * 10000) / 100;
      case 'date':
        return new Date().toISOString();
      case 'status':
        return ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)];
      default:
        return `sample_${column.name}`;
    }
  }
  
  /**
   * Clear cache for specific key or all cache
   */
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// Factory function
export function createDataDiscoveryService(config?: Partial<DataDiscoveryConfig>): DataDiscoveryService {
  const defaultConfig: DataDiscoveryConfig = {
    airbyte: {
      apiKey: process.env.AIRBYTE_API_KEY,
      clientId: process.env.AIRBYTE_CLIENT_ID,
      clientSecret: process.env.AIRBYTE_CLIENT_SECRET,
      workspaceId: process.env.AIRBYTE_WORKSPACE_ID
    },
    analysis: {
      maxSampleRows: 1000,
      schemaInferenceThreshold: 0.7,
      relationshipDetectionEnabled: true,
      businessPatternDetectionEnabled: true
    },
    retry: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000
    },
    cache: {
      enabled: true,
      ttl: 3600000 // 1 hour
    }
  };

  return new DataDiscoveryService({
    ...defaultConfig,
    ...config,
    airbyte: { ...defaultConfig.airbyte, ...config?.airbyte },
    analysis: { ...defaultConfig.analysis, ...config?.analysis },
    retry: { ...defaultConfig.retry, ...config?.retry },
    cache: { ...defaultConfig.cache, ...config?.cache }
  });
}