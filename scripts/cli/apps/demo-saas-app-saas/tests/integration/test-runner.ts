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
    await this.prisma.user.deleteMany({});
    await this.prisma.project.deleteMany({});
    
    console.log('🧹 Test database cleaned');
  }

  private async verifyEnvironmentVariables(): Promise<void> {
    const requiredVars = [
      'DATABASE_URL',
      'EMAIL_SERVICE_BASE_URL'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for testing: ${missing.join(', ')}`);
    }
  }

  async runAllTests(): Promise<IntegrationTestReport> {
    console.log('🚀 Starting comprehensive integration tests...');
    
    const results: IntegrationTestResult[] = [];
    
    
    // Test email-service
    try {
      const emailServiceResult = await this.testEmailServiceIntegration();
      results.push(emailServiceResult);
    } catch (error) {
      results.push({
        integration: 'email-service',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tests: {}
      });
    }

    const report: IntegrationTestReport = {
      timestamp: new Date().toISOString(),
      totalIntegrations: 1,
      successfulIntegrations: results.filter(r => r.success).length,
      results
    };

    await this.generateTestReport(report);
    
    return report;
  }

  
  private async testEmailServiceIntegration(): Promise<IntegrationTestResult> {
    console.log('🧪 Testing email-service integration...');
    
    const result: IntegrationTestResult = {
      integration: 'email-service',
      success: false,
      tests: {}
    };

    try {
      // Test 1: Authentication
      console.log('  🔑 Testing authentication...');
      const authResult = await this.testAuthentication('email-service');
      result.tests.authentication = authResult;
      
      if (!authResult.success) {
        throw new Error(`Authentication failed: ${authResult.error}`);
      }

      // Test 2: Data Fetching
      console.log('  📥 Testing data fetching...');
      const fetchResult = await this.testDataFetching('email-service');
      result.tests.dataFetch = fetchResult;
      
      if (!fetchResult.success) {
        throw new Error(`Data fetching failed: ${fetchResult.error}`);
      }

      // Test 3: Database Storage
      console.log('  🗄️  Testing database storage...');
      const storeResult = await this.testDatabaseStorage('email-service', fetchResult.data);
      result.tests.databaseStore = storeResult;
      
      if (!storeResult.success) {
        throw new Error(`Database storage failed: ${storeResult.error}`);
      }

      // Test 4: Data Validation
      console.log('  ✅ Testing data validation...');
      const validationResult = await this.testDataValidation('email-service', storeResult.data);
      result.tests.dataValidation = validationResult;

      // Test 5: Health Check
      console.log('  💓 Testing health check...');
      const healthResult = await this.testHealthCheck('email-service');
      result.tests.healthCheck = healthResult;

      result.success = true;
      console.log(`  ✅ ${integration.name} integration test passed`);
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ ${integration.name} integration test failed: ${result.error}`);
    }

    return result;
  }

  private async generateTestReport(report: IntegrationTestReport): Promise<void> {
    const reportPath = path.join(__dirname, '..', '..', 'integration-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 Integration test report generated:', reportPath);
    console.log(`✅ ${report.successfulIntegrations}/${report.totalIntegrations} integrations working correctly`);
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