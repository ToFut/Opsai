import { prisma } from '../client';
import { DiscoveredSchema, DiscoveredTable, DiscoveredColumn, SchemaRelationship } from '@opsai/shared';
import { createSchemaValidator, ValidationResult } from '../validators/schema-validator';
import { createMigrationValidator, MigrationValidationResult } from '../validators/migration-validator';
import { discoveryContext } from '@opsai/core';

export interface SchemaAnalysisResult {
  recommendedSchema: PrismaSchemaModel[];
  migrations: SchemaMigration[];
  businessLogic: BusinessLogicRecommendations;
  dataValidation: ValidationRules[];
  indexRecommendations: IndexRecommendation[];
  optimizations: SchemaOptimization[];
  validation?: ValidationResult;
  migrationCompatibility?: MigrationValidationResult;
}

export interface PrismaSchemaModel {
  name: string;
  tableName: string;
  fields: PrismaField[];
  relations: PrismaRelation[];
  indexes: PrismaIndex[];
  constraints: PrismaConstraint[];
  metadata: {
    isCore: boolean;
    businessEntity: string;
    estimatedSize: 'small' | 'medium' | 'large';
    accessPattern: 'read-heavy' | 'write-heavy' | 'balanced';
  };
}

export interface PrismaField {
  name: string;
  type: string;
  isOptional: boolean;
  isUnique: boolean;
  isId: boolean;
  defaultValue?: string;
  validation?: string[];
  businessMeaning: string;
  searchable: boolean;
  indexed: boolean;
}

export interface PrismaRelation {
  name: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one';
  relatedModel: string;
  foreignKey?: string;
  relationName?: string;
  onDelete: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
  onUpdate: 'CASCADE' | 'RESTRICT';
}

export interface PrismaIndex {
  name: string;
  fields: string[];
  type: 'unique' | 'index' | 'fulltext';
  method?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface PrismaConstraint {
  name: string;
  type: 'check' | 'unique' | 'foreign_key';
  definition: string;
}

export interface SchemaMigration {
  id: string;
  name: string;
  description: string;
  sql: string;
  rollbackSql: string;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  estimatedTime: string;
}

export interface BusinessLogicRecommendations {
  validationRules: BusinessValidationRule[];
  automatedWorkflows: WorkflowRecommendation[];
  computedFields: ComputedField[];
  businessRules: BusinessRule[];
}

export interface BusinessValidationRule {
  field: string;
  rule: string;
  errorMessage: string;
  severity: 'error' | 'warning';
}

export interface WorkflowRecommendation {
  name: string;
  trigger: string;
  description: string;
  steps: string[];
  priority: number;
}

export interface ComputedField {
  name: string;
  type: string;
  calculation: string;
  dependencies: string[];
  updateTrigger: 'real-time' | 'batch' | 'on-demand';
}

export interface BusinessRule {
  name: string;
  condition: string;
  action: string;
  priority: number;
}

export interface ValidationRules {
  table: string;
  field: string;
  rules: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'format' | 'range' | 'custom';
  constraint: string;
  message: string;
}

export interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSizeImpact: string;
}

export interface SchemaOptimization {
  type: 'partitioning' | 'denormalization' | 'archiving' | 'compression';
  table: string;
  description: string;
  benefit: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedImprovement: string;
}

export class SchemaAnalyzer {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Analyze discovered schema and generate recommendations
   */
  async analyzeDiscoveredSchema(discoveredSchema: DiscoveredSchema): Promise<SchemaAnalysisResult> {
    discoveryContext.updatePhase('analyzing', 10, 'Converting discovered schema to Prisma models');
    
    // Step 1: Convert discovered schema to Prisma models
    const recommendedSchema = await this.convertToPrismaSchema(discoveredSchema);

    discoveryContext.updatePhase('analyzing', 20, 'Validating schema structure');
    
    // Step 2: Validate the generated schema
    const schemaValidator = createSchemaValidator({ strict: true });
    const validation = await schemaValidator.validateSchema(recommendedSchema);
    
    if (!validation.valid) {
      console.warn(`Schema validation found ${validation.errors.length} errors and ${validation.warnings.length} warnings`);
    }

    discoveryContext.updatePhase('analyzing', 30, 'Generating migration scripts');
    
    // Step 3: Generate migration scripts
    const migrations = await this.generateMigrations(recommendedSchema);

    discoveryContext.updatePhase('analyzing', 40, 'Checking migration compatibility');
    
    // Step 4: Check migration compatibility if existing schema exists
    let migrationCompatibility: MigrationValidationResult | undefined;
    const existingSchema = await this.getExistingSchema();
    if (existingSchema) {
      const migrationValidator = createMigrationValidator();
      migrationCompatibility = await migrationValidator.validateMigration(existingSchema, recommendedSchema);
      
      if (!migrationCompatibility.safe) {
        console.warn(`Migration has ${migrationCompatibility.breakingChanges.length} breaking changes`);
      }
    }

    discoveryContext.updatePhase('analyzing', 50, 'Analyzing business logic patterns');
    
    // Step 5: Analyze business logic patterns
    const businessLogic = await this.analyzeBusinessLogic(discoveredSchema, recommendedSchema);

    discoveryContext.updatePhase('analyzing', 60, 'Generating validation rules');
    
    // Step 6: Generate validation rules
    const dataValidation = await this.generateValidationRules(recommendedSchema);

    discoveryContext.updatePhase('analyzing', 70, 'Recommending indexes');
    
    // Step 7: Recommend indexes
    const indexRecommendations = await this.recommendIndexes(recommendedSchema, discoveredSchema);

    discoveryContext.updatePhase('analyzing', 80, 'Suggesting optimizations');
    
    // Step 8: Suggest optimizations
    const optimizations = await this.suggestOptimizations(recommendedSchema, discoveredSchema);

    discoveryContext.updatePhase('analyzing', 90, 'Finalizing schema analysis');
    
    return {
      recommendedSchema,
      migrations,
      businessLogic,
      dataValidation,
      indexRecommendations,
      optimizations,
      validation,
      migrationCompatibility
    };
  }

  /**
   * Convert discovered schema to Prisma schema models
   */
  private async convertToPrismaSchema(discoveredSchema: DiscoveredSchema): Promise<PrismaSchemaModel[]> {
    const models: PrismaSchemaModel[] = [];

    for (const table of discoveredSchema.tables) {
      const model = await this.convertTableToPrismaModel(table, discoveredSchema);
      models.push(model);
    }

    // Add tenant isolation to all models
    models.forEach(model => {
      if (!model.fields.find(f => f.name === 'tenantId')) {
        model.fields.push({
          name: 'tenantId',
          type: 'String',
          isOptional: false,
          isUnique: false,
          isId: false,
          businessMeaning: 'tenant_isolation',
          searchable: true,
          indexed: true
        });
      }

      // Add standard audit fields
      this.addAuditFields(model);
    });

    return models;
  }

  /**
   * Convert individual table to Prisma model
   */
  private async convertTableToPrismaModel(
    table: DiscoveredTable, 
    schema: DiscoveredSchema
  ): Promise<PrismaSchemaModel> {
    // Convert fields
    const fields: PrismaField[] = [];
    
    for (const column of table.columns) {
      const field = this.convertColumnToPrismaField(column);
      fields.push(field);
    }

    // Add ID field if not present
    if (!fields.find(f => f.isId)) {
      fields.unshift({
        name: 'id',
        type: 'String',
        isOptional: false,
        isUnique: true,
        isId: true,
        defaultValue: 'cuid()',
        businessMeaning: 'primary_identifier',
        searchable: false,
        indexed: true
      });
    }

    // Convert relations
    const relations = this.convertRelations(table, schema);

    // Generate indexes
    const indexes = this.generateTableIndexes(table, fields);

    // Generate constraints
    const constraints = this.generateTableConstraints(table, fields);

    return {
      name: this.toPascalCase(table.name),
      tableName: table.name,
      fields,
      relations,
      indexes,
      constraints,
      metadata: {
        isCore: table.businessEntity?.type === 'core',
        businessEntity: table.businessEntity?.suggestedName || table.displayName,
        estimatedSize: this.estimateTableSize(table),
        accessPattern: this.inferAccessPattern(table)
      }
    };
  }

  /**
   * Convert column to Prisma field
   */
  private convertColumnToPrismaField(column: DiscoveredColumn): PrismaField {
    const prismaType = this.mapToPrismaType(column.type);
    const validation = this.generateFieldValidation(column);

    return {
      name: this.toCamelCase(column.name),
      type: prismaType,
      isOptional: column.nullable,
      isUnique: this.shouldBeUnique(column),
      isId: column.businessMeaning?.category === 'identifier' && column.name.toLowerCase() === 'id',
      validation,
      businessMeaning: column.businessMeaning?.category || 'data',
      searchable: this.shouldBeSearchable(column),
      indexed: this.shouldBeIndexed(column)
    };
  }

  /**
   * Convert relationships
   */
  private convertRelations(table: DiscoveredTable, schema: DiscoveredSchema): PrismaRelation[] {
    const relations: PrismaRelation[] = [];
    
    // Find relationships involving this table
    const tableRelations = schema.relationships.filter(rel => 
      rel.fromTable === table.name || rel.toTable === table.name
    );

    for (const rel of tableRelations) {
      if (rel.fromTable === table.name) {
        // This table has a foreign key
        relations.push({
          name: this.toCamelCase(rel.toTable),
          type: 'many-to-one',
          relatedModel: this.toPascalCase(rel.toTable),
          foreignKey: this.toCamelCase(rel.fromColumn),
          onDelete: this.inferOnDeleteAction(rel),
          onUpdate: 'CASCADE'
        });
      } else {
        // This table is referenced by another table
        relations.push({
          name: this.toCamelCase(rel.fromTable) + 's',
          type: 'one-to-many',
          relatedModel: this.toPascalCase(rel.fromTable),
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      }
    }

    return relations;
  }

  /**
   * Generate migrations for the schema
   */
  private async generateMigrations(models: PrismaSchemaModel[]): Promise<SchemaMigration[]> {
    const migrations: SchemaMigration[] = [];

    // Create tables migration
    const createTablesMigration = this.generateCreateTablesMigration(models);
    migrations.push(createTablesMigration);

    // Create indexes migration
    const createIndexesMigration = this.generateCreateIndexesMigration(models);
    migrations.push(createIndexesMigration);

    // Create constraints migration
    const createConstraintsMigration = this.generateCreateConstraintsMigration(models);
    migrations.push(createConstraintsMigration);

    // RLS policies migration
    const rlsMigration = this.generateRLSMigration(models);
    migrations.push(rlsMigration);

    return migrations;
  }

  /**
   * Analyze business logic patterns
   */
  private async analyzeBusinessLogic(
    discoveredSchema: DiscoveredSchema, 
    prismaModels: PrismaSchemaModel[]
  ): Promise<BusinessLogicRecommendations> {
    const validationRules = this.generateBusinessValidationRules(prismaModels);
    const automatedWorkflows = this.generateWorkflowRecommendations(discoveredSchema);
    const computedFields = this.generateComputedFields(prismaModels);
    const businessRules = this.generateBusinessRules(discoveredSchema);

    return {
      validationRules,
      automatedWorkflows,
      computedFields,
      businessRules
    };
  }

  /**
   * Generate Prisma schema file content
   */
  generatePrismaSchemaFile(models: PrismaSchemaModel[]): string {
    let schema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

    // Generate models
    for (const model of models) {
      schema += this.generateModelDefinition(model);
      schema += '\n\n';
    }

    return schema;
  }

  /**
   * Generate individual model definition
   */
  private generateModelDefinition(model: PrismaSchemaModel): string {
    let definition = `model ${model.name} {\n`;

    // Add fields
    for (const field of model.fields) {
      definition += this.generateFieldDefinition(field);
    }

    // Add relations
    for (const relation of model.relations) {
      definition += this.generateRelationDefinition(relation);
    }

    // Add indexes
    if (model.indexes.length > 0) {
      definition += '\n';
      for (const index of model.indexes) {
        definition += this.generateIndexDefinition(index);
      }
    }

    // Add table name mapping if different
    if (model.tableName !== this.toSnakeCase(model.name)) {
      definition += `\n  @@map("${model.tableName}")\n`;
    }

    definition += '}';

    return definition;
  }

  /**
   * Generate field definition
   */
  private generateFieldDefinition(field: PrismaField): string {
    let definition = `  ${field.name} ${field.type}`;

    if (field.isId) definition += ' @id';
    if (field.isUnique) definition += ' @unique';
    if (field.defaultValue) definition += ` @default(${field.defaultValue})`;
    if (!field.isOptional && !field.isId) definition += '';
    if (field.isOptional) definition += '?';

    definition += '\n';

    return definition;
  }

  /**
   * Generate relation definition
   */
  private generateRelationDefinition(relation: PrismaRelation): string {
    let definition = `  ${relation.name} `;
    
    if (relation.type === 'one-to-many') {
      definition += `${relation.relatedModel}[]`;
    } else {
      definition += `${relation.relatedModel}`;
      if (relation.type === 'many-to-one') {
        definition += '?';
      }
    }

    if (relation.foreignKey) {
      definition += ` @relation(fields: [${relation.foreignKey}], references: [id])`;
    }

    definition += '\n';

    return definition;
  }

  /**
   * Generate index definition
   */
  private generateIndexDefinition(index: PrismaIndex): string {
    if (index.type === 'unique') {
      return `  @@unique([${index.fields.join(', ')}])\n`;
    } else {
      return `  @@index([${index.fields.join(', ')}])\n`;
    }
  }

  // Helper methods for conversion and analysis

  private mapToPrismaType(sqlType: string): string {
    const mapping: Record<string, string> = {
      'VARCHAR': 'String',
      'TEXT': 'String',
      'INTEGER': 'Int',
      'BIGINT': 'BigInt',
      'DECIMAL': 'Decimal',
      'FLOAT': 'Float',
      'BOOLEAN': 'Boolean',
      'DATE': 'DateTime',
      'TIMESTAMP': 'DateTime',
      'JSON': 'Json',
      'UUID': 'String'
    };

    return mapping[sqlType] || 'String';
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  private shouldBeUnique(column: DiscoveredColumn): boolean {
    const uniquePatterns = ['email', 'username', 'code', 'slug'];
    return uniquePatterns.some(pattern => 
      column.name.toLowerCase().includes(pattern)
    ) || column.uniqueValueCount === column.sampleValues?.length;
  }

  private shouldBeSearchable(column: DiscoveredColumn): boolean {
    const searchableCategories = ['name', 'description'];
    return searchableCategories.includes(column.businessMeaning?.category || '');
  }

  private shouldBeIndexed(column: DiscoveredColumn): boolean {
    const indexableCategories = ['identifier', 'status', 'date'];
    return indexableCategories.includes(column.businessMeaning?.category || '') ||
           column.name.toLowerCase().includes('id') ||
           column.name.toLowerCase().includes('status');
  }

  private estimateTableSize(table: DiscoveredTable): 'small' | 'medium' | 'large' {
    const columnCount = table.columns.length;
    const estimatedRows = table.estimatedRowCount || 0;

    if (columnCount > 20 || estimatedRows > 1000000) return 'large';
    if (columnCount > 10 || estimatedRows > 10000) return 'medium';
    return 'small';
  }

  private inferAccessPattern(table: DiscoveredTable): 'read-heavy' | 'write-heavy' | 'balanced' {
    // Simple heuristic based on table type
    if (table.businessEntity?.type === 'audit') return 'write-heavy';
    if (table.businessEntity?.type === 'lookup') return 'read-heavy';
    return 'balanced';
  }

  private inferOnDeleteAction(relation: SchemaRelationship): 'CASCADE' | 'SET_NULL' | 'RESTRICT' {
    // Conservative approach - use RESTRICT for most cases
    return 'RESTRICT';
  }

  private addAuditFields(model: PrismaSchemaModel): void {
    const standardFields = [
      {
        name: 'createdAt',
        type: 'DateTime',
        isOptional: false,
        isUnique: false,
        isId: false,
        defaultValue: 'now()',
        businessMeaning: 'audit',
        searchable: false,
        indexed: true
      },
      {
        name: 'updatedAt',
        type: 'DateTime',
        isOptional: false,
        isUnique: false,
        isId: false,
        defaultValue: 'now()',
        businessMeaning: 'audit',
        searchable: false,
        indexed: false
      }
    ];

    for (const field of standardFields) {
      if (!model.fields.find(f => f.name === field.name)) {
        model.fields.push(field);
      }
    }
  }

  private generateFieldValidation(column: DiscoveredColumn): string[] {
    const validation: string[] = [];

    if (column.validation?.format === 'email') {
      validation.push('@email');
    }
    
    if (column.validation?.pattern) {
      validation.push(`@matches(${column.validation.pattern})`);
    }

    return validation;
  }

  private generateTableIndexes(table: DiscoveredTable, fields: PrismaField[]): PrismaIndex[] {
    const indexes: PrismaIndex[] = [];

    // Tenant isolation index
    indexes.push({
      name: `idx_${table.name}_tenant`,
      fields: ['tenantId'],
      type: 'index'
    });

    // Status fields
    const statusFields = fields.filter(f => f.businessMeaning === 'status');
    for (const field of statusFields) {
      indexes.push({
        name: `idx_${table.name}_${field.name}`,
        fields: [field.name],
        type: 'index'
      });
    }

    return indexes;
  }

  private generateTableConstraints(table: DiscoveredTable, fields: PrismaField[]): PrismaConstraint[] {
    // This would generate CHECK constraints, etc.
    return [];
  }

  private generateCreateTablesMigration(models: PrismaSchemaModel[]): SchemaMigration {
    const sql = models.map(model => this.generateCreateTableSQL(model)).join('\n\n');
    
    return {
      id: `create_tables_${Date.now()}`,
      name: 'Create Tables',
      description: 'Create all tables from discovered schema',
      sql,
      rollbackSql: models.map(model => `DROP TABLE IF EXISTS "${model.tableName}" CASCADE;`).join('\n'),
      priority: 'high',
      dependencies: [],
      estimatedTime: '2-5 minutes'
    };
  }

  private generateCreateTableSQL(model: PrismaSchemaModel): string {
    // This would generate actual SQL - simplified for brevity
    return `-- Create table ${model.tableName}\n-- (SQL generation would be implemented here)`;
  }

  private generateCreateIndexesMigration(models: PrismaSchemaModel[]): SchemaMigration {
    return {
      id: `create_indexes_${Date.now()}`,
      name: 'Create Indexes',
      description: 'Create performance indexes', 
      sql: '-- Index creation SQL',
      rollbackSql: '-- Index removal SQL',
      priority: 'medium',
      dependencies: [`create_tables_${Date.now()}`],
      estimatedTime: '1-3 minutes'
    };
  }

  private generateCreateConstraintsMigration(models: PrismaSchemaModel[]): SchemaMigration {
    return {
      id: `create_constraints_${Date.now()}`,
      name: 'Create Constraints',
      description: 'Create data integrity constraints',
      sql: '-- Constraint creation SQL',
      rollbackSql: '-- Constraint removal SQL', 
      priority: 'medium',
      dependencies: [`create_tables_${Date.now()}`],
      estimatedTime: '1-2 minutes'
    };
  }

  private generateRLSMigration(models: PrismaSchemaModel[]): SchemaMigration {
    return {
      id: `create_rls_${Date.now()}`,
      name: 'Create RLS Policies',
      description: 'Create row-level security policies for tenant isolation',
      sql: '-- RLS policy creation SQL',
      rollbackSql: '-- RLS policy removal SQL',
      priority: 'high',
      dependencies: [`create_tables_${Date.now()}`],
      estimatedTime: '1-2 minutes'
    };
  }

  private generateBusinessValidationRules(models: PrismaSchemaModel[]): BusinessValidationRule[] {
    // Generate validation rules based on business meaning
    return [];
  }

  private generateWorkflowRecommendations(schema: DiscoveredSchema): WorkflowRecommendation[] {
    return schema.businessContext.suggestedWorkflows.map(workflow => ({
      name: workflow.name,
      trigger: 'manual',
      description: workflow.description,
      steps: workflow.steps.map(step => step.name),
      priority: workflow.confidence * 10
    }));
  }

  private generateComputedFields(models: PrismaSchemaModel[]): ComputedField[] {
    // Generate computed fields based on patterns
    return [];
  }

  private generateBusinessRules(schema: DiscoveredSchema): BusinessRule[] {
    // Generate business rules from patterns
    return [];
  }

  private generateValidationRules(models: PrismaSchemaModel[]): ValidationRules[] {
    // Generate validation rules for each field
    return [];
  }

  private recommendIndexes(models: PrismaSchemaModel[], schema: DiscoveredSchema): IndexRecommendation[] {
    // Recommend additional indexes based on usage patterns
    return [];
  }

  private suggestOptimizations(models: PrismaSchemaModel[], schema: DiscoveredSchema): SchemaOptimization[] {
    // Suggest optimizations based on schema analysis
    return [];
  }

  /**
   * Get existing schema from database if it exists
   */
  private async getExistingSchema(): Promise<PrismaSchemaModel[] | null> {
    try {
      // Check if we have an existing schema stored
      const existingSchemaRecord = await prisma.schemaVersion.findFirst({
        where: {
          tenantId: this.tenantId,
          status: 'active'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (existingSchemaRecord && existingSchemaRecord.schema) {
        return existingSchemaRecord.schema as unknown as PrismaSchemaModel[];
      }

      return null;
    } catch (error) {
      console.warn('Could not retrieve existing schema:', error);
      return null;
    }
  }
}

// Factory function
export function createSchemaAnalyzer(tenantId: string): SchemaAnalyzer {
  return new SchemaAnalyzer(tenantId);
}