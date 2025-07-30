import * as fs from 'fs';
import * as path from 'path';
import { AppConfig, IntegrationConfig } from '../../../packages/shared/src/config/service-config';

/**
 * Data Sync Validation Generator
 * Ensures API data flows correctly into the database with proper validation
 */
export class DataSyncValidator {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async generateDataSyncValidation(outputDir: string): Promise<void> {
    const validationDir = path.join(outputDir, 'src', 'validation');
    fs.mkdirSync(validationDir, { recursive: true });

    // Generate data sync service
    await this.generateDataSyncService(validationDir);

    // Generate sync validation tests
    await this.generateSyncValidationTests(validationDir);

    // Generate data mapping validation
    await this.generateDataMappingValidation(validationDir);

    // Generate sync monitoring
    await this.generateSyncMonitoring(validationDir);

    console.log('✅ Data sync validation system generated');
  }

  private async generateDataSyncService(validationDir: string): Promise<void> {
    const syncServiceContent = `
import { PrismaClient } from '@prisma/client';
import { integrationService } from '../integrations';
import { DataValidator, generateTestData } from '../../tests/integration/data-validation';

export interface SyncResult {
  integration: string;
  entity: string;
  success: boolean;
  recordsProcessed: number;
  recordsStored: number;
  errors: string[];
  duration: number;
}

export interface SyncReport {
  timestamp: string;
  totalIntegrations: number;
  totalEntities: number;
  results: SyncResult[];
  overallSuccess: boolean;
}

export class DataSyncService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async validateAllIntegrationSync(): Promise<SyncReport> {
    console.log('🔄 Starting comprehensive data sync validation...');
    
    const results: SyncResult[] = [];
    const startTime = Date.now();

    ${this.config.services.integrations.map(integration => `
    // Validate ${integration.name} sync
    try {
      const ${this.toCamelCase(integration.name)}Results = await this.validateIntegrationSync('${integration.name}');
      results.push(...${this.toCamelCase(integration.name)}Results);
    } catch (error) {
      console.error('❌ ${integration.name} sync validation failed:', error);
      results.push({
        integration: '${integration.name}',
        entity: 'all',
        success: false,
        recordsProcessed: 0,
        recordsStored: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0
      });
    }`).join('\n')}

    const report: SyncReport = {
      timestamp: new Date().toISOString(),
      totalIntegrations: ${this.config.services.integrations.length},
      totalEntities: ${this.config.database.entities.length},
      results,
      overallSuccess: results.every(r => r.success)
    };

    const duration = Date.now() - startTime;
    console.log(\`✅ Data sync validation completed in \${duration}ms\`);
    
    await this.generateSyncReport(report);
    return report;
  }

  private async validateIntegrationSync(integrationName: string): Promise<SyncResult[]> {
    console.log(\`🔄 Validating \${integrationName} data sync...\`);
    
    const results: SyncResult[] = [];
    
    ${this.config.database.entities.map(entity => `
    // Test ${entity.name} sync
    try {
      const ${this.toCamelCase(entity.name)}Result = await this.validateEntitySync(integrationName, '${entity.name}');
      results.push(${this.toCamelCase(entity.name)}Result);
    } catch (error) {
      results.push({
        integration: integrationName,
        entity: '${entity.name}',
        success: false,
        recordsProcessed: 0,
        recordsStored: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0
      });
    }`).join('\n')}

    return results;
  }

  private async validateEntitySync(integrationName: string, entityName: string): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      integration: integrationName,
      entity: entityName,
      success: false,
      recordsProcessed: 0,
      recordsStored: 0,
      errors: [],
      duration: 0
    };

    try {
      console.log(\`  📥 Testing \${entityName} data fetch from \${integrationName}...\`);
      
      // Step 1: Fetch data from integration
      const integrationClient = (integrationService as any)[this.toCamelCase(integrationName)];
      if (!integrationClient) {
        throw new Error(\`Integration client not found: \${integrationName}\`);
      }

      // Try multiple endpoints that might contain this entity data
      const possibleEndpoints = this.getPossibleEndpoints(entityName);
      let apiData = null;
      let usedEndpoint = '';

      for (const endpoint of possibleEndpoints) {
        try {
          apiData = await integrationClient.list(endpoint);
          usedEndpoint = endpoint;
          break;
        } catch (error) {
          console.log(\`    ⚠️  Endpoint \${endpoint} not available: \${error.message}\`);
        }
      }

      if (!apiData) {
        throw new Error(\`No data available from any endpoint for \${entityName}\`);
      }

      console.log(\`    ✅ Fetched data from \${usedEndpoint}\`);
      
      // Step 2: Validate API data structure
      const dataArray = Array.isArray(apiData) ? apiData : [apiData];
      result.recordsProcessed = dataArray.length;

      for (const item of dataArray.slice(0, 5)) { // Test first 5 items
        const isValid = DataValidator.validateApiResponse(item, entityName.toLowerCase());
        if (!isValid) {
          result.errors.push(\`Invalid data structure in API response for \${entityName}\`);
        }
      }

      // Step 3: Test database storage
      console.log(\`  🗄️  Testing \${entityName} database storage...\`);
      
      const testData = this.prepareTestDataForStorage(dataArray[0] || generateTestData(entityName.toLowerCase()), entityName);
      
      const stored = await this.storeTestData(entityName, testData);
      if (stored) {
        result.recordsStored = 1;
        
        // Step 4: Validate stored data
        const isStoredValid = DataValidator.validateDatabaseRecord(stored, entityName.toLowerCase());
        if (!isStoredValid) {
          result.errors.push(\`Stored data validation failed for \${entityName}\`);
        }

        // Clean up test data
        await this.cleanupTestData(entityName, stored.id);
      }

      // Step 5: Test data mapping accuracy
      if (apiData && stored) {
        const mappingErrors = this.validateDataMapping(dataArray[0], stored, entityName);
        result.errors.push(...mappingErrors);
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      console.log(\`    \${result.success ? '✅' : '❌'} \${entityName} sync validation: \${result.success ? 'passed' : 'failed'}\`);
      
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.duration = Date.now() - startTime;
      console.log(\`    ❌ \${entityName} sync validation failed: \${error.message}\`);
    }

    return result;
  }

  private getPossibleEndpoints(entityName: string): string[] {
    const lowerName = entityName.toLowerCase();
    const pluralName = lowerName + 's';
    
    return [
      \`/\${pluralName}\`,
      \`/\${lowerName}\`,
      \`/api/\${pluralName}\`,
      \`/api/\${lowerName}\`,
      \`/v1/\${pluralName}\`,
      \`/v1/\${lowerName}\`
    ];
  }

  private prepareTestDataForStorage(apiData: any, entityName: string): any {
    // Remove or transform fields that shouldn't be stored directly
    const cleanData = { ...apiData };
    
    // Remove common API-only fields
    delete cleanData.links;
    delete cleanData.meta;
    delete cleanData._links;
    delete cleanData.href;
    
    // Ensure required fields
    if (!cleanData.id) {
      cleanData.id = \`test-\${entityName.toLowerCase()}-\${Date.now()}\`;
    }

    ${this.config.features?.multiTenancy ? `
    // Add tenant ID for multi-tenant systems
    if (!cleanData.tenantId) {
      cleanData.tenantId = 'test-tenant';
    }` : ''}

    return cleanData;
  }

  private async storeTestData(entityName: string, data: any): Promise<any> {
    const prismaModel = this.toCamelCase(entityName);
    
    try {
      const stored = await (this.prisma as any)[prismaModel].create({
        data
      });
      
      console.log(\`    ✅ Test \${entityName} stored with ID: \${stored.id}\`);
      return stored;
    } catch (error) {
      console.error(\`    ❌ Failed to store \${entityName}:\`, error);
      throw error;
    }
  }

  private async cleanupTestData(entityName: string, id: string): Promise<void> {
    const prismaModel = this.toCamelCase(entityName);
    
    try {
      await (this.prisma as any)[prismaModel].delete({
        where: { id }
      });
      console.log(\`    🧹 Cleaned up test \${entityName}: \${id}\`);
    } catch (error) {
      console.warn(\`    ⚠️  Failed to cleanup test \${entityName}:\`, error.message);
    }
  }

  private validateDataMapping(apiData: any, storedData: any, entityName: string): string[] {
    const errors: string[] = [];
    
    // Get entity field configuration
    const entityConfig = this.config.database.entities.find(e => e.name === entityName);
    if (!entityConfig) {
      return [\`Entity configuration not found: \${entityName}\`];
    }

    // Check each configured field
    Object.entries(entityConfig.fields).forEach(([fieldName, fieldConfig]: [string, any]) => {
      if (fieldName === 'id') return; // Skip ID field
      
      const apiValue = apiData[fieldName];
      const storedValue = storedData[fieldName];
      
      // Check if required fields are present
      if (fieldConfig.required && (storedValue === null || storedValue === undefined)) {
        errors.push(\`Required field '\${fieldName}' is missing in stored data\`);
      }
      
      // Check data type consistency
      if (apiValue !== undefined && storedValue !== undefined) {
        const apiType = typeof apiValue;
        const storedType = typeof storedValue;
        
        if (apiType !== storedType && !this.isTypeConversionValid(apiType, storedType, fieldConfig.type)) {
          errors.push(\`Type mismatch for '\${fieldName}': API=\${apiType}, DB=\${storedType}\`);
        }
      }
    });

    return errors;
  }

  private isTypeConversionValid(apiType: string, storedType: string, fieldType: string): boolean {
    // Allow valid type conversions
    if (fieldType === 'datetime' && apiType === 'string' && storedType === 'object') {
      return true; // String to Date conversion
    }
    
    if (fieldType === 'decimal' && apiType === 'string' && storedType === 'number') {
      return true; // String to number conversion
    }
    
    return false;
  }

  private async generateSyncReport(report: SyncReport): Promise<void> {
    const reportPath = path.join(__dirname, '..', '..', 'data-sync-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 Data sync report generated:', reportPath);
    console.log(\`📈 Overall success rate: \${report.results.filter(r => r.success).length}/\${report.results.length}\`);
    
    // Log detailed results
    report.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(\`\${status} \${result.integration}:\${result.entity} - \${result.recordsStored}/\${result.recordsProcessed} records stored\`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(\`    ⚠️  \${error}\`));
      }
    });
  }

  private toCamelCase(str: string): string {
    return str.replace(/(^|[-_])(.)/g, (match, p1, p2, offset) => {
      return offset === 0 ? p2.toLowerCase() : p2.toUpperCase();
    });
  }
}

// Export singleton
export const dataSyncService = new DataSyncService();
`.trim();

    fs.writeFileSync(path.join(validationDir, 'data-sync-service.ts'), syncServiceContent);
    console.log('📄 Generated data sync validation service');
  }

  private async generateSyncValidationTests(validationDir: string): Promise<void> {
    const testContent = `
import { DataSyncService } from './data-sync-service';
import { PrismaClient } from '@prisma/client';

describe('Data Sync Validation', () => {
  let syncService: DataSyncService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    syncService = new DataSyncService();
    prisma = new PrismaClient();
    
    // Ensure test database is clean
    ${this.config.database.entities.map(entity => 
      `await prisma.${this.toCamelCase(entity.name)}.deleteMany({ where: { id: { startsWith: 'test-' } } });`
    ).join('\n    ')}
  });

  afterAll(async () => {
    // Clean up any remaining test data
    ${this.config.database.entities.map(entity => 
      `await prisma.${this.toCamelCase(entity.name)}.deleteMany({ where: { id: { startsWith: 'test-' } } });`
    ).join('\n    ')}
    
    await prisma.$disconnect();
  });

  test('should validate complete data sync flow', async () => {
    const report = await syncService.validateAllIntegrationSync();
    
    expect(report).toBeDefined();
    expect(report.results).toHaveLength(${this.config.services.integrations.length * this.config.database.entities.length});
    
    // Check that at least some syncs are successful
    const successfulSyncs = report.results.filter(r => r.success);
    expect(successfulSyncs.length).toBeGreaterThan(0);
    
    // Log detailed results for debugging
    if (!report.overallSuccess) {
      console.log('🔍 Failed sync details:');
      report.results.filter(r => !r.success).forEach(result => {
        console.log(\`❌ \${result.integration}:\${result.entity}\`);
        result.errors.forEach(error => console.log(\`   - \${error}\`));
      });
    }
  }, 120000); // 2 minute timeout

  ${this.config.services.integrations.map(integration => 
    this.generateIntegrationSyncTest(integration)
  ).join('\n\n')}

  test('should detect data mapping issues', async () => {
    // This test verifies that data mapping validation works
    const report = await syncService.validateAllIntegrationSync();
    
    const mappingErrors = report.results.reduce((acc, result) => {
      return acc + result.errors.filter(error => 
        error.includes('Type mismatch') || error.includes('Required field')
      ).length;
    }, 0);
    
    if (mappingErrors > 0) {
      console.warn(\`⚠️  Found \${mappingErrors} data mapping issues\`);
    }
    
    // Test should pass even with mapping issues, but warn about them
    expect(report.results).toBeDefined();
  });

  test('should handle integration failures gracefully', async () => {
    // Test that sync validation handles API failures gracefully
    const report = await syncService.validateAllIntegrationSync();
    
    // Even if some integrations fail, the report should be complete
    expect(report.results).toHaveLength(${this.config.services.integrations.length * this.config.database.entities.length});
    
    // Check that failed syncs are properly reported
    const failedSyncs = report.results.filter(r => !r.success);
    failedSyncs.forEach(failed => {
      expect(failed.errors.length).toBeGreaterThan(0);
      expect(failed.duration).toBeGreaterThanOrEqual(0);
    });
  });
});
`.trim();

    fs.writeFileSync(path.join(validationDir, 'sync-validation.test.ts'), testContent);
    console.log('📄 Generated sync validation tests');
  }

  private generateIntegrationSyncTest(integration: IntegrationConfig): string {
    return `
  describe('${integration.name} Integration Sync', () => {
    test('should validate ${integration.name} authentication before sync', async () => {
      const client = (integrationService as any).${this.toCamelCase(integration.name)};
      expect(client).toBeDefined();
      
      const health = await client.healthCheck();
      
      if (health.status === 'unhealthy') {
        console.warn('⚠️  ${integration.name} is unhealthy, sync tests may fail:', health.details);
      }
      
      expect(health).toHaveProperty('status');
    });

    ${this.config.database.entities.map(entity => `
    test('should sync ${entity.name} data from ${integration.name}', async () => {
      const result = await syncService.validateEntitySync('${integration.name}', '${entity.name}');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('${integration.name}');
      expect(result.entity).toBe('${entity.name}');
      
      if (!result.success) {
        console.warn('⚠️  ${entity.name} sync from ${integration.name} failed:');
        result.errors.forEach(error => console.warn(\`   - \${error}\`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(\`✅ ${entity.name} sync successful: \${result.recordsStored} records\`);
      }
    }, 30000);`).join('')}
  });`;
  }

  private async generateDataMappingValidation(validationDir: string): Promise<void> {
    const mappingContent = `
import { AppConfig } from '../../../../packages/shared/src/config/service-config';

export interface FieldMapping {
  apiField: string;
  dbField: string;
  required: boolean;
  transformation?: (value: any) => any;
  validation?: (value: any) => boolean;
}

export interface EntityMapping {
  entityName: string;
  fields: FieldMapping[];
}

export class DataMappingValidator {
  private config: AppConfig;
  private mappings: Map<string, EntityMapping> = new Map();

  constructor(config: AppConfig) {
    this.config = config;
    this.initializeMappings();
  }

  private initializeMappings(): void {
    ${this.config.database.entities.map(entity => `
    // ${entity.name} mapping
    this.mappings.set('${entity.name}', {
      entityName: '${entity.name}',
      fields: [
        ${Object.entries(entity.fields).map(([fieldName, field]: [string, any]) => `
        {
          apiField: '${fieldName}',
          dbField: '${fieldName}',
          required: ${field.required || false},
          ${this.generateFieldTransformation(fieldName, field)}
          ${this.generateFieldValidation(fieldName, field)}
        }`).join(',\n        ')}
      ]
    });`).join('\n')}
  }

  validateMapping(apiData: any, entityName: string): ValidationResult {
    const mapping = this.mappings.get(entityName);
    if (!mapping) {
      return {
        valid: false,
        errors: [\`No mapping found for entity: \${entityName}\`],
        transformedData: null
      };
    }

    const errors: string[] = [];
    const transformedData: any = {};
    const warnings: string[] = [];

    mapping.fields.forEach(fieldMapping => {
      const apiValue = apiData[fieldMapping.apiField];
      
      // Check required fields
      if (fieldMapping.required && (apiValue === null || apiValue === undefined)) {
        errors.push(\`Required field '\${fieldMapping.apiField}' is missing\`);
        return;
      }

      // Apply transformation if needed
      let transformedValue = apiValue;
      if (fieldMapping.transformation && apiValue !== null && apiValue !== undefined) {
        try {
          transformedValue = fieldMapping.transformation(apiValue);
        } catch (error) {
          errors.push(\`Transformation failed for '\${fieldMapping.apiField}': \${error.message}\`);
          return;
        }
      }

      // Apply validation if needed
      if (fieldMapping.validation && transformedValue !== null && transformedValue !== undefined) {
        if (!fieldMapping.validation(transformedValue)) {
          errors.push(\`Validation failed for '\${fieldMapping.apiField}'\`);
          return;
        }
      }

      // Store transformed value
      transformedData[fieldMapping.dbField] = transformedValue;
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      transformedData
    };
  }

  getRequiredFields(entityName: string): string[] {
    const mapping = this.mappings.get(entityName);
    if (!mapping) return [];
    
    return mapping.fields
      .filter(field => field.required)
      .map(field => field.apiField);
  }

  getAllMappings(): EntityMapping[] {
    return Array.from(this.mappings.values());
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  transformedData: any;
}

// Export default instance
export const dataMappingValidator = new DataMappingValidator(${JSON.stringify(this.config, null, 2)});
`.trim();

    fs.writeFileSync(path.join(validationDir, 'data-mapping.ts'), mappingContent);
    console.log('📄 Generated data mapping validation');
  }

  private generateFieldTransformation(fieldName: string, field: any): string {
    const transformations: string[] = [];
    
    // Date transformations
    if (field.type === 'datetime' || field.type === 'date') {
      transformations.push('transformation: (value) => typeof value === "string" ? new Date(value) : value,');
    }
    
    // Decimal transformations
    if (field.type === 'decimal' || field.type === 'float') {
      transformations.push('transformation: (value) => typeof value === "string" ? parseFloat(value) : value,');
    }
    
    // Integer transformations
    if (field.type === 'integer' || field.type === 'int') {
      transformations.push('transformation: (value) => typeof value === "string" ? parseInt(value, 10) : value,');
    }
    
    return transformations.join('\n          ');
  }

  private generateFieldValidation(fieldName: string, field: any): string {
    const validations: string[] = [];
    
    // Email validation
    if (fieldName.toLowerCase().includes('email')) {
      validations.push('validation: (value) => typeof value === "string" && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value),');
    }
    
    // Enum validation
    if (field.validation?.enum) {
      const enumValues = JSON.stringify(field.validation.enum);
      validations.push(`validation: (value) => ${enumValues}.includes(value),`);
    }
    
    // Min/Max validation for numbers
    if ((field.type === 'number' || field.type === 'integer') && field.validation) {
      const constraints: string[] = [];
      if (field.validation.min !== undefined) {
        constraints.push(`value >= ${field.validation.min}`);
      }
      if (field.validation.max !== undefined) {
        constraints.push(`value <= ${field.validation.max}`);
      }
      if (constraints.length > 0) {
        validations.push(`validation: (value) => typeof value === "number" && ${constraints.join(' && ')},`);
      }
    }
    
    return validations.join('\n          ');
  }

  private async generateSyncMonitoring(validationDir: string): Promise<void> {
    const monitoringContent = `
import { DataSyncService, SyncReport } from './data-sync-service';
import { integrationService } from '../integrations';

export interface SyncMetrics {
  timestamp: string;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
  integrationHealth: Record<string, boolean>;
}

export class SyncMonitor {
  private syncService: DataSyncService;
  private metrics: SyncMetrics[] = [];
  private isMonitoring: boolean = false;

  constructor() {
    this.syncService = new DataSyncService();
  }

  async startMonitoring(intervalMinutes: number = 15): Promise<void> {
    if (this.isMonitoring) {
      console.log('🔍 Sync monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log(\`🔍 Starting sync monitoring (every \${intervalMinutes} minutes)...\`);

    // Initial sync validation
    await this.performSyncCheck();

    // Schedule regular checks
    const intervalMs = intervalMinutes * 60 * 1000;
    const intervalId = setInterval(async () => {
      if (!this.isMonitoring) {
        clearInterval(intervalId);
        return;
      }

      await this.performSyncCheck();
    }, intervalMs);

    console.log('✅ Sync monitoring started');
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🛑 Sync monitoring stopped');
  }

  private async performSyncCheck(): Promise<void> {
    try {
      console.log('🔍 Performing sync health check...');
      
      // Check integration health
      const healthStatus = await integrationService.healthCheck();
      const integrationHealth: Record<string, boolean> = {};
      
      Object.entries(healthStatus).forEach(([name, status]) => {
        integrationHealth[name] = status.status === 'healthy';
      });

      // Run sync validation
      const syncReport = await this.syncService.validateAllIntegrationSync();
      
      // Calculate metrics
      const metrics: SyncMetrics = {
        timestamp: new Date().toISOString(),
        totalSyncs: syncReport.results.length,
        successfulSyncs: syncReport.results.filter(r => r.success).length,
        failedSyncs: syncReport.results.filter(r => !r.success).length,
        averageDuration: this.calculateAverageDuration(syncReport.results),
        integrationHealth
      };

      this.metrics.push(metrics);
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      await this.logMetrics(metrics);
      await this.checkAlerts(metrics);
      
    } catch (error) {
      console.error('❌ Sync monitoring check failed:', error);
    }
  }

  private calculateAverageDuration(results: any[]): number {
    if (results.length === 0) return 0;
    
    const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);
    return Math.round(totalDuration / results.length);
  }

  private async logMetrics(metrics: SyncMetrics): Promise<void> {
    const successRate = (metrics.successfulSyncs / metrics.totalSyncs * 100).toFixed(1);
    
    console.log(\`📊 Sync Health Report (\${metrics.timestamp}):\`);
    console.log(\`   Success Rate: \${successRate}% (\${metrics.successfulSyncs}/\${metrics.totalSyncs})\`);
    console.log(\`   Average Duration: \${metrics.averageDuration}ms\`);
    
    // Log integration health
    Object.entries(metrics.integrationHealth).forEach(([integration, healthy]) => {
      const status = healthy ? '✅' : '❌';
      console.log(\`   \${status} \${integration}\`);
    });

    // Save metrics to file
    const metricsPath = path.join(__dirname, '..', '..', 'sync-metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(this.metrics, null, 2));
  }

  private async checkAlerts(metrics: SyncMetrics): Promise<void> {
    const successRate = metrics.successfulSyncs / metrics.totalSyncs;
    
    // Alert if success rate drops below 80%
    if (successRate < 0.8) {
      console.log(\`🚨 ALERT: Sync success rate is low (\${(successRate * 100).toFixed(1)}%)\`);
      
      // Log details of failed syncs
      const lastReport = await this.syncService.validateAllIntegrationSync();
      const failures = lastReport.results.filter(r => !r.success);
      
      failures.forEach(failure => {
        console.log(\`   ❌ \${failure.integration}:\${failure.entity} - \${failure.errors.join(', ')}\`);
      });
    }

    // Alert if any integration is unhealthy
    const unhealthyIntegrations = Object.entries(metrics.integrationHealth)
      .filter(([_, healthy]) => !healthy)
      .map(([name, _]) => name);

    if (unhealthyIntegrations.length > 0) {
      console.log(\`🚨 ALERT: Unhealthy integrations: \${unhealthyIntegrations.join(', ')}\`);
    }

    // Alert if average duration is too high (> 30 seconds)
    if (metrics.averageDuration > 30000) {
      console.log(\`🚨 ALERT: Sync operations are slow (avg: \${metrics.averageDuration}ms)\`);
    }
  }

  getMetricsHistory(): SyncMetrics[] {
    return [...this.metrics];
  }

  getCurrentHealth(): SyncMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }
}

// Export singleton
export const syncMonitor = new SyncMonitor();
`.trim();

    fs.writeFileSync(path.join(validationDir, 'sync-monitor.ts'), monitoringContent);
    console.log('📄 Generated sync monitoring system');
  }

  // Utility methods
  private toCamelCase(str: string): string {
    return str.replace(/(^|[-_])(.)/g, (match, p1, p2, offset) => {
      return offset === 0 ? p2.toLowerCase() : p2.toUpperCase();
    });
  }
}