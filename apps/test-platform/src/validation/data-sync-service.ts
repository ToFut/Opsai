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

    

    const report: SyncReport = {
      timestamp: new Date().toISOString(),
      totalIntegrations: 0,
      totalEntities: 2,
      results,
      overallSuccess: results.every(r => r.success)
    };

    const duration = Date.now() - startTime;
    console.log(`✅ Data sync validation completed in ${duration}ms`);
    
    await this.generateSyncReport(report);
    return report;
  }

  private async validateIntegrationSync(integrationName: string): Promise<SyncResult[]> {
    console.log(`🔄 Validating ${integrationName} data sync...`);
    
    const results: SyncResult[] = [];
    
    
    // Test User sync
    try {
      const userResult = await this.validateEntitySync(integrationName, 'User');
      results.push(userResult);
    } catch (error) {
      results.push({
        integration: integrationName,
        entity: 'User',
        success: false,
        recordsProcessed: 0,
        recordsStored: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0
      });
    }

    // Test Project sync
    try {
      const projectResult = await this.validateEntitySync(integrationName, 'Project');
      results.push(projectResult);
    } catch (error) {
      results.push({
        integration: integrationName,
        entity: 'Project',
        success: false,
        recordsProcessed: 0,
        recordsStored: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        duration: 0
      });
    }

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
      console.log(`  📥 Testing ${entityName} data fetch from ${integrationName}...`);
      
      // Step 1: Fetch data from integration
      const integrationClient = (integrationService as any)[this.toCamelCase(integrationName)];
      if (!integrationClient) {
        throw new Error(`Integration client not found: ${integrationName}`);
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
          console.log(`    ⚠️  Endpoint ${endpoint} not available: ${error.message}`);
        }
      }

      if (!apiData) {
        throw new Error(`No data available from any endpoint for ${entityName}`);
      }

      console.log(`    ✅ Fetched data from ${usedEndpoint}`);
      
      // Step 2: Validate API data structure
      const dataArray = Array.isArray(apiData) ? apiData : [apiData];
      result.recordsProcessed = dataArray.length;

      for (const item of dataArray.slice(0, 5)) { // Test first 5 items
        const isValid = DataValidator.validateApiResponse(item, entityName.toLowerCase());
        if (!isValid) {
          result.errors.push(`Invalid data structure in API response for ${entityName}`);
        }
      }

      // Step 3: Test database storage
      console.log(`  🗄️  Testing ${entityName} database storage...`);
      
      const testData = this.prepareTestDataForStorage(dataArray[0] || generateTestData(entityName.toLowerCase()), entityName);
      
      const stored = await this.storeTestData(entityName, testData);
      if (stored) {
        result.recordsStored = 1;
        
        // Step 4: Validate stored data
        const isStoredValid = DataValidator.validateDatabaseRecord(stored, entityName.toLowerCase());
        if (!isStoredValid) {
          result.errors.push(`Stored data validation failed for ${entityName}`);
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

      console.log(`    ${result.success ? '✅' : '❌'} ${entityName} sync validation: ${result.success ? 'passed' : 'failed'}`);
      
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.duration = Date.now() - startTime;
      console.log(`    ❌ ${entityName} sync validation failed: ${error.message}`);
    }

    return result;
  }

  private getPossibleEndpoints(entityName: string): string[] {
    const lowerName = entityName.toLowerCase();
    const pluralName = lowerName + 's';
    
    return [
      `/${pluralName}`,
      `/${lowerName}`,
      `/api/${pluralName}`,
      `/api/${lowerName}`,
      `/v1/${pluralName}`,
      `/v1/${lowerName}`
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
      cleanData.id = `test-${entityName.toLowerCase()}-${Date.now()}`;
    }

    

    return cleanData;
  }

  private async storeTestData(entityName: string, data: any): Promise<any> {
    const prismaModel = this.toCamelCase(entityName);
    
    try {
      const stored = await (this.prisma as any)[prismaModel].create({
        data
      });
      
      console.log(`    ✅ Test ${entityName} stored with ID: ${stored.id}`);
      return stored;
    } catch (error) {
      console.error(`    ❌ Failed to store ${entityName}:`, error);
      throw error;
    }
  }

  private async cleanupTestData(entityName: string, id: string): Promise<void> {
    const prismaModel = this.toCamelCase(entityName);
    
    try {
      await (this.prisma as any)[prismaModel].delete({
        where: { id }
      });
      console.log(`    🧹 Cleaned up test ${entityName}: ${id}`);
    } catch (error) {
      console.warn(`    ⚠️  Failed to cleanup test ${entityName}:`, error.message);
    }
  }

  private validateDataMapping(apiData: any, storedData: any, entityName: string): string[] {
    const errors: string[] = [];
    
    // Get entity field configuration
    const entityConfig = this.config.database.entities.find(e => e.name === entityName);
    if (!entityConfig) {
      return [`Entity configuration not found: ${entityName}`];
    }

    // Check each configured field
    Object.entries(entityConfig.fields).forEach(([fieldName, fieldConfig]: [string, any]) => {
      if (fieldName === 'id') return; // Skip ID field
      
      const apiValue = apiData[fieldName];
      const storedValue = storedData[fieldName];
      
      // Check if required fields are present
      if (fieldConfig.required && (storedValue === null || storedValue === undefined)) {
        errors.push(`Required field '${fieldName}' is missing in stored data`);
      }
      
      // Check data type consistency
      if (apiValue !== undefined && storedValue !== undefined) {
        const apiType = typeof apiValue;
        const storedType = typeof storedValue;
        
        if (apiType !== storedType && !this.isTypeConversionValid(apiType, storedType, fieldConfig.type)) {
          errors.push(`Type mismatch for '${fieldName}': API=${apiType}, DB=${storedType}`);
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
    console.log(`📈 Overall success rate: ${report.results.filter(r => r.success).length}/${report.results.length}`);
    
    // Log detailed results
    report.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.integration}:${result.entity} - ${result.recordsStored}/${result.recordsProcessed} records stored`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`    ⚠️  ${error}`));
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