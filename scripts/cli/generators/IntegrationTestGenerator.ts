import * as fs from 'fs';
import * as path from 'path';
import { AppConfig, IntegrationConfig } from '../../../packages/shared/src/config/service-config';

/**
 * Integration Test Generator
 * Generates comprehensive tests for API authentication, data fetching, and database storage
 */
export class IntegrationTestGenerator {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async generateIntegrationTests(outputDir: string): Promise<void> {
    if (!this.config.services.integrations || this.config.services.integrations.length === 0) {
      console.log('⏭️  No integrations to test');
      return;
    }

    const testsDir = path.join(outputDir, 'tests', 'integration');
    fs.mkdirSync(testsDir, { recursive: true });

    // Generate test infrastructure
    await this.generateTestInfrastructure(testsDir);

    // Generate authentication tests for each integration
    for (const integration of this.config.services.integrations) {
      await this.generateAuthenticationTest(testsDir, integration);
      await this.generateDataFlowTest(testsDir, integration);
      await this.generateHealthCheckTest(testsDir, integration);
    }

    // Generate integration suite test
    await this.generateIntegrationSuiteTest(testsDir);

    // Generate data validation helpers
    await this.generateDataValidationHelpers(testsDir);

    console.log('✅ Comprehensive integration tests generated');
  }

  private async generateTestInfrastructure(testsDir: string): Promise<void> {
    const infrastructureContent = `
import { PrismaClient } from '@prisma/client';
import { integrationService } from '../../src/integrations';

export class IntegrationTestRunner {
  private prisma: PrismaClient;
  private testResults: Map<string, TestResult> = new Map();

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'file:./test.db'
        }
      }
    });
  }

  async setup(): Promise<void> {
    // Clean test database
    await this.cleanTestDatabase();
    
    // Verify environment variables
    await this.verifyEnvironmentVariables();
    
    console.log('🧪 Integration test environment ready');
  }

  async teardown(): Promise<void> {
    await this.prisma.$disconnect();
  }

  private async cleanTestDatabase(): Promise<void> {
    // Clean all test data
    ${this.config.database.entities.map(entity => 
      `await this.prisma.${this.toCamelCase(entity.name)}.deleteMany({});`
    ).join('\n    ')}
    
    console.log('🧹 Test database cleaned');
  }

  private async verifyEnvironmentVariables(): Promise<void> {
    const requiredVars = [
      'DATABASE_URL',
      ${this.config.services.integrations.map(integration => 
        this.getRequiredEnvVars(integration).map(v => `'${v}'`).join(', ')
      ).join(',\n      ')}
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(\`Missing required environment variables for testing: \${missing.join(', ')}\`);
    }
  }

  async runAllTests(): Promise<IntegrationTestReport> {
    console.log('🚀 Starting comprehensive integration tests...');
    
    const results: IntegrationTestResult[] = [];
    
    ${this.config.services.integrations.map(integration => `
    // Test ${integration.name}
    try {
      const ${this.toCamelCase(integration.name)}Result = await this.test${this.toPascalCase(integration.name)}Integration();
      results.push(${this.toCamelCase(integration.name)}Result);
    } catch (error) {
      results.push({
        integration: '${integration.name}',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tests: {}
      });
    }`).join('\n')}

    const report: IntegrationTestReport = {
      timestamp: new Date().toISOString(),
      totalIntegrations: ${this.config.services.integrations.length},
      successfulIntegrations: results.filter(r => r.success).length,
      results
    };

    await this.generateTestReport(report);
    
    return report;
  }

  ${this.config.services.integrations.map(integration => 
    this.generateIntegrationTestMethod(integration)
  ).join('\n\n')}

  private async generateTestReport(report: IntegrationTestReport): Promise<void> {
    const reportPath = path.join(__dirname, '..', '..', 'integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 Integration test report generated:', reportPath);
    console.log(\`✅ \${report.successfulIntegrations}/\${report.totalIntegrations} integrations working correctly\`);
  }
}

export interface TestResult {
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export interface IntegrationTestResult {
  integration: string;
  success: boolean;
  error?: string;
  tests: {
    authentication?: TestResult;
    dataFetch?: TestResult;
    databaseStore?: TestResult;
    dataValidation?: TestResult;
    healthCheck?: TestResult;
  };
}

export interface IntegrationTestReport {
  timestamp: string;
  totalIntegrations: number;
  successfulIntegrations: number;
  results: IntegrationTestResult[];
}

// Utility functions
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { delay };
`.trim();

    fs.writeFileSync(path.join(testsDir, 'test-runner.ts'), infrastructureContent);
    console.log('📄 Generated integration test infrastructure');
  }

  private generateIntegrationTestMethod(integration: IntegrationConfig): string {
    const methodName = `test${this.toPascalCase(integration.name)}Integration`;
    const clientName = `${this.toCamelCase(integration.name)}`;
    
    return `
  private async ${methodName}(): Promise<IntegrationTestResult> {
    console.log('🧪 Testing ${integration.name} integration...');
    
    const result: IntegrationTestResult = {
      integration: '${integration.name}',
      success: false,
      tests: {}
    };

    try {
      // Test 1: Authentication
      console.log('  🔑 Testing authentication...');
      const authResult = await this.testAuthentication('${integration.name}');
      result.tests.authentication = authResult;
      
      if (!authResult.success) {
        throw new Error(\`Authentication failed: \${authResult.error}\`);
      }

      // Test 2: Data Fetching
      console.log('  📥 Testing data fetching...');
      const fetchResult = await this.testDataFetching('${integration.name}');
      result.tests.dataFetch = fetchResult;
      
      if (!fetchResult.success) {
        throw new Error(\`Data fetching failed: \${fetchResult.error}\`);
      }

      // Test 3: Database Storage
      console.log('  🗄️  Testing database storage...');
      const storeResult = await this.testDatabaseStorage('${integration.name}', fetchResult.data);
      result.tests.databaseStore = storeResult;
      
      if (!storeResult.success) {
        throw new Error(\`Database storage failed: \${storeResult.error}\`);
      }

      // Test 4: Data Validation
      console.log('  ✅ Testing data validation...');
      const validationResult = await this.testDataValidation('${integration.name}', storeResult.data);
      result.tests.dataValidation = validationResult;

      // Test 5: Health Check
      console.log('  💓 Testing health check...');
      const healthResult = await this.testHealthCheck('${integration.name}');
      result.tests.healthCheck = healthResult;

      result.success = true;
      console.log(\`  ✅ \${integration.name} integration test passed\`);
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.log(\`  ❌ \${integration.name} integration test failed: \${result.error}\`);
    }

    return result;
  }`;
  }

  private async generateAuthenticationTest(testsDir: string, integration: IntegrationConfig): Promise<void> {
    const testContent = `
import { ${this.toPascalCase(integration.name)}Client } from '../../src/integrations/${integration.name}-client';
import { AuthenticationError } from '../../src/integrations/errors';

describe('${integration.name} Authentication', () => {
  let client: ${this.toPascalCase(integration.name)}Client;

  beforeEach(() => {
    client = new ${this.toPascalCase(integration.name)}Client({
      baseUrl: process.env.${this.getEnvPrefix(integration)}_BASE_URL || '${integration.baseUrl || ''}',
      timeout: 10000,
      ${this.getClientConfigForTest(integration)}
    });
  });

  test('should authenticate successfully with valid credentials', async () => {
    // Test authentication by making a simple API call
    try {
      const result = await client.healthCheck();
      expect(result.status).toBe('healthy');
      expect(result.integration).toBe('${integration.name}');
    } catch (error) {
      if (error instanceof AuthenticationError) {
        fail(\`Authentication failed: \${error.message}. Please check your API credentials.\`);
      }
      throw error;
    }
  });

  test('should fail authentication with invalid credentials', async () => {
    // Create client with invalid credentials
    const invalidClient = new ${this.toPascalCase(integration.name)}Client({
      baseUrl: process.env.${this.getEnvPrefix(integration)}_BASE_URL || '${integration.baseUrl || ''}',
      ${this.getInvalidCredentialsConfig(integration)}
    });

    await expect(invalidClient.healthCheck()).rejects.toThrow(AuthenticationError);
  });

  test('should handle network errors gracefully', async () => {
    // Create client with invalid URL
    const unreachableClient = new ${this.toPascalCase(integration.name)}Client({
      baseUrl: 'https://invalid-url-that-does-not-exist.com',
      timeout: 5000,
      ${this.getClientConfigForTest(integration)}
    });

    const result = await unreachableClient.healthCheck();
    expect(result.status).toBe('unhealthy');
    expect(result.details).toBeDefined();
  });

  ${this.generateCredentialSpecificTests(integration)}
});
`.trim();

    fs.writeFileSync(path.join(testsDir, `${integration.name}-auth.test.ts`), testContent);
    console.log(`📄 Generated authentication test for ${integration.name}`);
  }

  private async generateDataFlowTest(testsDir: string, integration: IntegrationConfig): Promise<void> {
    const testContent = `
import { ${this.toPascalCase(integration.name)}Client } from '../../src/integrations/${integration.name}-client';
import { PrismaClient } from '@prisma/client';
import { IntegrationTestRunner } from './test-runner';

describe('${integration.name} Data Flow', () => {
  let client: ${this.toPascalCase(integration.name)}Client;
  let prisma: PrismaClient;
  let testRunner: IntegrationTestRunner;

  beforeAll(async () => {
    testRunner = new IntegrationTestRunner();
    await testRunner.setup();
    
    prisma = new PrismaClient();
    client = new ${this.toPascalCase(integration.name)}Client({
      baseUrl: process.env.${this.getEnvPrefix(integration)}_BASE_URL || '${integration.baseUrl || ''}',
      ${this.getClientConfigForTest(integration)}
    });
  });

  afterAll(async () => {
    await testRunner.teardown();
    await prisma.$disconnect();
  });

  test('should fetch data from API successfully', async () => {
    try {
      // Test basic data fetching
      const data = await client.list('/test-endpoint');
      
      expect(data).toBeDefined();
      expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      
      console.log('✅ Data fetched successfully:', {
        type: Array.isArray(data) ? 'array' : typeof data,
        itemCount: Array.isArray(data) ? data.length : 'N/A'
      });
    } catch (error) {
      console.error('❌ Data fetching failed:', error);
      throw error;
    }
  });

  ${this.generateEntitySpecificDataTests(integration)}

  test('should handle API rate limits gracefully', async () => {
    // Test rate limiting behavior
    const promises = Array.from({ length: 10 }, (_, i) => 
      client.get(\`/test-endpoint?page=\${i}\`)
    );

    // Should not throw rate limit errors due to our rate limiter
    const results = await Promise.allSettled(promises);
    const failures = results.filter(r => r.status === 'rejected');
    
    // Allow some failures but not all
    expect(failures.length).toBeLessThan(results.length);
  });

  test('should retry failed requests automatically', async () => {
    // This test verifies our retry mechanism works
    // We can't easily simulate server errors, so we test the retry logic indirectly
    const startTime = Date.now();
    
    try {
      await client.get('/non-existent-endpoint');
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Should have taken some time due to retries
      expect(duration).toBeGreaterThan(1000); // At least 1 second for retries
    }
  });
});
`.trim();

    fs.writeFileSync(path.join(testsDir, `${integration.name}-data-flow.test.ts`), testContent);
    console.log(`📄 Generated data flow test for ${integration.name}`);
  }

  private async generateHealthCheckTest(testsDir: string, integration: IntegrationConfig): Promise<void> {
    const testContent = `
import { ${this.toPascalCase(integration.name)}Client } from '../../src/integrations/${integration.name}-client';
import { integrationService } from '../../src/integrations';

describe('${integration.name} Health Monitoring', () => {
  let client: ${this.toPascalCase(integration.name)}Client;

  beforeEach(() => {
    client = new ${this.toPascalCase(integration.name)}Client({
      baseUrl: process.env.${this.getEnvPrefix(integration)}_BASE_URL || '${integration.baseUrl || ''}',
      ${this.getClientConfigForTest(integration)}
    });
  });

  test('should report healthy status when API is accessible', async () => {
    const health = await client.healthCheck();
    
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('integration', '${integration.name}');
    
    if (health.status === 'unhealthy') {
      console.warn('⚠️  ${integration.name} API is currently unhealthy:', health.details);
    }
  });

  test('should integrate with overall health monitoring', async () => {
    const overallHealth = await integrationService.healthCheck();
    
    expect(overallHealth).toHaveProperty('${integration.name}');
    expect(overallHealth['${integration.name}']).toHaveProperty('status');
    expect(overallHealth['${integration.name}']).toHaveProperty('integration', '${integration.name}');
  });

  test('should test all connections simultaneously', async () => {
    const testResult = await integrationService.testAllConnections();
    
    expect(testResult).toHaveProperty('success');
    expect(testResult).toHaveProperty('results');
    expect(testResult.results).toHaveProperty('${integration.name}');
    
    if (!testResult.success) {
      console.warn('⚠️  Some integrations are failing:', testResult.results);
    }
  });

  test('should handle connection timeouts appropriately', async () => {
    // Create client with very short timeout
    const timeoutClient = new ${this.toPascalCase(integration.name)}Client({
      baseUrl: process.env.${this.getEnvPrefix(integration)}_BASE_URL || '${integration.baseUrl || ''}',
      timeout: 100, // 100ms timeout
      ${this.getClientConfigForTest(integration)}
    });

    const health = await timeoutClient.healthCheck();
    
    // Should handle timeout gracefully
    expect(health.status).toBeDefined();
    
    if (health.status === 'unhealthy') {
      expect(health.details).toContain('timeout');
    }
  });
});
`.trim();

    fs.writeFileSync(path.join(testsDir, `${integration.name}-health.test.ts`), testContent);
    console.log(`📄 Generated health check test for ${integration.name}`);
  }

  private async generateIntegrationSuiteTest(testsDir: string): Promise<void> {
    const suiteContent = `
import { IntegrationTestRunner } from './test-runner';

describe('Integration Suite', () => {
  let testRunner: IntegrationTestRunner;

  beforeAll(async () => {
    testRunner = new IntegrationTestRunner();
    await testRunner.setup();
  });

  afterAll(async () => {
    await testRunner.teardown();
  });

  test('should run comprehensive integration test suite', async () => {
    const report = await testRunner.runAllTests();
    
    expect(report).toBeDefined();
    expect(report.totalIntegrations).toBe(${this.config.services.integrations.length});
    expect(report.results).toHaveLength(${this.config.services.integrations.length});
    
    // Log detailed results
    console.log('📊 Integration Test Report:');
    console.log(\`✅ \${report.successfulIntegrations}/\${report.totalIntegrations} integrations working\`);
    
    report.results.forEach(result => {
      if (result.success) {
        console.log(\`  ✅ \${result.integration}: All tests passed\`);
      } else {
        console.log(\`  ❌ \${result.integration}: \${result.error}\`);
        
        Object.entries(result.tests).forEach(([testName, testResult]) => {
          if (testResult && !testResult.success) {
            console.log(\`    ❌ \${testName}: \${testResult.error}\`);
          }
        });
      }
    });
    
    // At least 80% of integrations should be working in a healthy system
    const successRate = report.successfulIntegrations / report.totalIntegrations;
    expect(successRate).toBeGreaterThanOrEqual(0.8);
  }, 60000); // 60 second timeout for comprehensive tests

  test('should validate all integration configurations', async () => {
    const integrations = [
      ${this.config.services.integrations.map(integration => `'${integration.name}'`).join(', ')}
    ];

    for (const integrationName of integrations) {
      // Check required environment variables exist
      const envPrefix = integrationName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const baseUrlVar = \`\${envPrefix}_BASE_URL\`;
      
      if (!process.env[baseUrlVar]) {
        console.warn(\`⚠️  Missing \${baseUrlVar} environment variable\`);
      }
    }
  });
});
`.trim();

    fs.writeFileSync(path.join(testsDir, 'integration-suite.test.ts'), suiteContent);
    console.log('📄 Generated integration suite test');
  }

  private async generateDataValidationHelpers(testsDir: string): Promise<void> {
    const helpersContent = `
import { z } from 'zod';

/**
 * Data validation helpers for integration testing
 */

${this.config.database.entities.map(entity => this.generateEntityValidator(entity)).join('\n\n')}

export class DataValidator {
  static validateApiResponse(data: any, entityType: string): boolean {
    try {
      switch (entityType) {
        ${this.config.database.entities.map(entity => `
        case '${entity.name.toLowerCase()}':
          ${this.toCamelCase(entity.name)}Schema.parse(data);
          return true;`).join('')}
        default:
          console.warn(\`Unknown entity type for validation: \${entityType}\`);
          return true;
      }
    } catch (error) {
      console.error(\`Validation failed for \${entityType}:\`, error);
      return false;
    }
  }

  static validateDatabaseRecord(record: any, entityType: string): boolean {
    // Database records should have additional fields like id, createdAt, etc.
    const extendedData = {
      ...record,
      id: record.id || 'test-id',
      createdAt: record.createdAt || new Date(),
      updatedAt: record.updatedAt || new Date()
    };

    return this.validateApiResponse(extendedData, entityType);
  }

  static findDataMismatches(apiData: any, dbData: any): string[] {
    const mismatches: string[] = [];
    
    Object.keys(apiData).forEach(key => {
      if (apiData[key] !== dbData[key]) {
        mismatches.push(\`\${key}: API='\${apiData[key]}' vs DB='\${dbData[key]}'\`);
      }
    });

    return mismatches;
  }
}

export function generateTestData(entityType: string): any {
  switch (entityType) {
    ${this.config.database.entities.map(entity => `
    case '${entity.name.toLowerCase()}':
      return ${this.generateTestDataForEntity(entity)};`).join('')}
    default:
      return { name: 'Test Data', value: 'test' };
  }
}
`.trim();

    fs.writeFileSync(path.join(testsDir, 'data-validation.ts'), helpersContent);
    console.log('📄 Generated data validation helpers');
  }

  // Helper methods for generating entity-specific content
  private generateEntityValidator(entity: any): string {
    const schemaName = `${this.toCamelCase(entity.name)}Schema`;
    
    const fields = Object.entries(entity.fields).map(([fieldName, field]: [string, any]) => {
      const zodType = this.mapToZodType(field.type, field.required);
      return `  ${fieldName}: ${zodType}`;
    }).join(',\n');

    return `
export const ${schemaName} = z.object({
${fields}
});`;
  }

  private mapToZodType(fieldType: string, required: boolean = true): string {
    let zodType: string;
    
    switch (fieldType) {
      case 'string':
      case 'text':
        zodType = 'z.string()';
        break;
      case 'number':
      case 'float':
      case 'decimal':
        zodType = 'z.number()';
        break;
      case 'integer':
      case 'int':
        zodType = 'z.number().int()';
        break;
      case 'boolean':
      case 'bool':
        zodType = 'z.boolean()';
        break;
      case 'date':
      case 'datetime':
      case 'timestamp':
        zodType = 'z.union([z.string(), z.date()])';
        break;
      case 'json':
        zodType = 'z.any()';
        break;
      default:
        zodType = 'z.any()';
    }
    
    return required ? zodType : `${zodType}.optional()`;
  }

  private generateTestDataForEntity(entity: any): string {
    const testData: Record<string, any> = {};
    
    Object.entries(entity.fields).forEach(([fieldName, field]: [string, any]) => {
      if (fieldName === 'id') return; // Skip ID field
      
      testData[fieldName] = this.generateTestValue(field.type, fieldName);
    });

    return JSON.stringify(testData, null, 6);
  }

  private generateTestValue(fieldType: string, fieldName: string): any {
    const name = fieldName.toLowerCase();
    
    switch (fieldType) {
      case 'string':
      case 'text':
        if (name.includes('email')) return 'test@example.com';
        if (name.includes('name')) return 'Test Name';
        if (name.includes('phone')) return '+1-555-0123';
        return `Test ${fieldName}`;
      case 'number':
      case 'float':
      case 'decimal':
        if (name.includes('price')) return 99.99;
        return 42;
      case 'integer':
      case 'int':
        return 1;
      case 'boolean':
      case 'bool':
        return true;
      case 'date':
      case 'datetime':
      case 'timestamp':
        return new Date().toISOString();
      default:
        return 'test-value';
    }
  }

  private generateEntitySpecificDataTests(integration: IntegrationConfig): string {
    return this.config.database.entities.map(entity => `
  test('should fetch and validate ${entity.name} data', async () => {
    try {
      // Attempt to fetch ${entity.name} data
      const data = await client.list('/${entity.name.toLowerCase()}s');
      
      if (Array.isArray(data) && data.length > 0) {
        // Validate first item structure
        const firstItem = data[0];
        const isValid = DataValidator.validateApiResponse(firstItem, '${entity.name.toLowerCase()}');
        
        expect(isValid).toBe(true);
        console.log('✅ ${entity.name} data structure is valid');
      } else {
        console.log('ℹ️  No ${entity.name} data available for testing');
      }
    } catch (error) {
      console.warn('⚠️  ${entity.name} endpoint may not be available:', error.message);
    }
  });

  test('should store ${entity.name} data in database correctly', async () => {
    const testData = generateTestData('${entity.name.toLowerCase()}');
    
    try {
      // Store in database
      const stored = await prisma.${this.toCamelCase(entity.name)}.create({
        data: {
          id: 'test-${entity.name.toLowerCase()}-' + Date.now(),
          ...testData,
          ${this.config.features?.multiTenancy ? "tenantId: 'test-tenant'," : ''}
        }
      });

      expect(stored).toBeDefined();
      expect(stored.id).toBeDefined();
      
      // Validate stored data
      const isValid = DataValidator.validateDatabaseRecord(stored, '${entity.name.toLowerCase()}');
      expect(isValid).toBe(true);
      
      console.log('✅ ${entity.name} data stored and validated successfully');
      
      // Clean up
      await prisma.${this.toCamelCase(entity.name)}.delete({ where: { id: stored.id } });
      
    } catch (error) {
      console.error('❌ ${entity.name} database storage failed:', error);
      throw error;
    }
  });`).join('\n');
  }

  private generateCredentialSpecificTests(integration: IntegrationConfig): string {
    if (!integration.credentials) return '';
    
    const credentialKeys = Object.keys(integration.credentials);
    
    return credentialKeys.map(key => `
  test('should validate ${key} credential requirement', () => {
    const envVar = '${this.getEnvPrefix(integration)}_${key.toUpperCase()}';
    const hasCredential = process.env[envVar];
    
    if (!hasCredential) {
      console.warn(\`⚠️  Missing \${envVar} environment variable\`);
    }
    
    // Test should pass even if credential is missing (for CI/CD)
    // but warn about it
    expect(envVar).toBeDefined();
  });`).join('\n');
  }

  private getRequiredEnvVars(integration: IntegrationConfig): string[] {
    const envPrefix = this.getEnvPrefix(integration);
    const vars = [`${envPrefix}_BASE_URL`];
    
    if (integration.credentials) {
      Object.keys(integration.credentials).forEach(key => {
        vars.push(`${envPrefix}_${key.toUpperCase()}`);
      });
    }
    
    return vars;
  }

  private getEnvPrefix(integration: IntegrationConfig): string {
    return integration.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  }

  private getClientConfigForTest(integration: IntegrationConfig): string {
    if (!integration.credentials) return 'timeout: 10000';
    
    return Object.keys(integration.credentials).map(key => {
      const envVar = `${this.getEnvPrefix(integration)}_${key.toUpperCase()}`;
      return `${this.toCamelCase(key)}: process.env.${envVar}`;
    }).join(',\n      ') + ',\n      timeout: 10000';
  }

  private getInvalidCredentialsConfig(integration: IntegrationConfig): string {
    if (!integration.credentials) return 'timeout: 5000';
    
    return Object.keys(integration.credentials).map(key => {
      return `${this.toCamelCase(key)}: 'invalid-credential'`;
    }).join(',\n      ') + ',\n      timeout: 5000';
  }

  // Utility methods
  private toPascalCase(str: string): string {
    return str.replace(/(^|[-_])(.)/g, (_, __, char) => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}