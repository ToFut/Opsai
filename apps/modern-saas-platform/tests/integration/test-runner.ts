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
    await this.prisma.organization.deleteMany({});
    await this.prisma.project.deleteMany({});
    await this.prisma.task.deleteMany({});
    
    console.log('🧹 Test database cleaned');
  }

  private async verifyEnvironmentVariables(): Promise<void> {
    const requiredVars = [
      'DATABASE_URL',
      'STRIPE_PAYMENTS_BASE_URL',
      'SENDGRID_EMAIL_BASE_URL', 'SENDGRID_EMAIL_API_KEY',
      'SLACK_NOTIFICATIONS_BASE_URL',
      'ANALYTICS_DB_BASE_URL'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables for testing: ${missing.join(', ')}`);
    }
  }

  async runAllTests(): Promise<IntegrationTestReport> {
    console.log('🚀 Starting comprehensive integration tests...');
    
    const results: IntegrationTestResult[] = [];
    
    
    // Test stripe_payments
    try {
      const stripePaymentsResult = await this.testStripePaymentsIntegration();
      results.push(stripePaymentsResult);
    } catch (error) {
      results.push({
        integration: 'stripe_payments',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tests: {}
      });
    }

    // Test sendgrid_email
    try {
      const sendgridEmailResult = await this.testSendgridEmailIntegration();
      results.push(sendgridEmailResult);
    } catch (error) {
      results.push({
        integration: 'sendgrid_email',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tests: {}
      });
    }

    // Test slack_notifications
    try {
      const slackNotificationsResult = await this.testSlackNotificationsIntegration();
      results.push(slackNotificationsResult);
    } catch (error) {
      results.push({
        integration: 'slack_notifications',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tests: {}
      });
    }

    // Test analytics_db
    try {
      const analyticsDbResult = await this.testAnalyticsDbIntegration();
      results.push(analyticsDbResult);
    } catch (error) {
      results.push({
        integration: 'analytics_db',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tests: {}
      });
    }

    const report: IntegrationTestReport = {
      timestamp: new Date().toISOString(),
      totalIntegrations: 4,
      successfulIntegrations: results.filter(r => r.success).length,
      results
    };

    await this.generateTestReport(report);
    
    return report;
  }

  
  private async testStripePaymentsIntegration(): Promise<IntegrationTestResult> {
    console.log('🧪 Testing stripe_payments integration...');
    
    const result: IntegrationTestResult = {
      integration: 'stripe_payments',
      success: false,
      tests: {}
    };

    try {
      // Test 1: Authentication
      console.log('  🔑 Testing authentication...');
      const authResult = await this.testAuthentication('stripe_payments');
      result.tests.authentication = authResult;
      
      if (!authResult.success) {
        throw new Error(`Authentication failed: ${authResult.error}`);
      }

      // Test 2: Data Fetching
      console.log('  📥 Testing data fetching...');
      const fetchResult = await this.testDataFetching('stripe_payments');
      result.tests.dataFetch = fetchResult;
      
      if (!fetchResult.success) {
        throw new Error(`Data fetching failed: ${fetchResult.error}`);
      }

      // Test 3: Database Storage
      console.log('  🗄️  Testing database storage...');
      const storeResult = await this.testDatabaseStorage('stripe_payments', fetchResult.data);
      result.tests.databaseStore = storeResult;
      
      if (!storeResult.success) {
        throw new Error(`Database storage failed: ${storeResult.error}`);
      }

      // Test 4: Data Validation
      console.log('  ✅ Testing data validation...');
      const validationResult = await this.testDataValidation('stripe_payments', storeResult.data);
      result.tests.dataValidation = validationResult;

      // Test 5: Health Check
      console.log('  💓 Testing health check...');
      const healthResult = await this.testHealthCheck('stripe_payments');
      result.tests.healthCheck = healthResult;

      result.success = true;
      console.log(`  ✅ ${integration.name} integration test passed`);
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ ${integration.name} integration test failed: ${result.error}`);
    }

    return result;
  }


  private async testSendgridEmailIntegration(): Promise<IntegrationTestResult> {
    console.log('🧪 Testing sendgrid_email integration...');
    
    const result: IntegrationTestResult = {
      integration: 'sendgrid_email',
      success: false,
      tests: {}
    };

    try {
      // Test 1: Authentication
      console.log('  🔑 Testing authentication...');
      const authResult = await this.testAuthentication('sendgrid_email');
      result.tests.authentication = authResult;
      
      if (!authResult.success) {
        throw new Error(`Authentication failed: ${authResult.error}`);
      }

      // Test 2: Data Fetching
      console.log('  📥 Testing data fetching...');
      const fetchResult = await this.testDataFetching('sendgrid_email');
      result.tests.dataFetch = fetchResult;
      
      if (!fetchResult.success) {
        throw new Error(`Data fetching failed: ${fetchResult.error}`);
      }

      // Test 3: Database Storage
      console.log('  🗄️  Testing database storage...');
      const storeResult = await this.testDatabaseStorage('sendgrid_email', fetchResult.data);
      result.tests.databaseStore = storeResult;
      
      if (!storeResult.success) {
        throw new Error(`Database storage failed: ${storeResult.error}`);
      }

      // Test 4: Data Validation
      console.log('  ✅ Testing data validation...');
      const validationResult = await this.testDataValidation('sendgrid_email', storeResult.data);
      result.tests.dataValidation = validationResult;

      // Test 5: Health Check
      console.log('  💓 Testing health check...');
      const healthResult = await this.testHealthCheck('sendgrid_email');
      result.tests.healthCheck = healthResult;

      result.success = true;
      console.log(`  ✅ ${integration.name} integration test passed`);
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ ${integration.name} integration test failed: ${result.error}`);
    }

    return result;
  }


  private async testSlackNotificationsIntegration(): Promise<IntegrationTestResult> {
    console.log('🧪 Testing slack_notifications integration...');
    
    const result: IntegrationTestResult = {
      integration: 'slack_notifications',
      success: false,
      tests: {}
    };

    try {
      // Test 1: Authentication
      console.log('  🔑 Testing authentication...');
      const authResult = await this.testAuthentication('slack_notifications');
      result.tests.authentication = authResult;
      
      if (!authResult.success) {
        throw new Error(`Authentication failed: ${authResult.error}`);
      }

      // Test 2: Data Fetching
      console.log('  📥 Testing data fetching...');
      const fetchResult = await this.testDataFetching('slack_notifications');
      result.tests.dataFetch = fetchResult;
      
      if (!fetchResult.success) {
        throw new Error(`Data fetching failed: ${fetchResult.error}`);
      }

      // Test 3: Database Storage
      console.log('  🗄️  Testing database storage...');
      const storeResult = await this.testDatabaseStorage('slack_notifications', fetchResult.data);
      result.tests.databaseStore = storeResult;
      
      if (!storeResult.success) {
        throw new Error(`Database storage failed: ${storeResult.error}`);
      }

      // Test 4: Data Validation
      console.log('  ✅ Testing data validation...');
      const validationResult = await this.testDataValidation('slack_notifications', storeResult.data);
      result.tests.dataValidation = validationResult;

      // Test 5: Health Check
      console.log('  💓 Testing health check...');
      const healthResult = await this.testHealthCheck('slack_notifications');
      result.tests.healthCheck = healthResult;

      result.success = true;
      console.log(`  ✅ ${integration.name} integration test passed`);
      
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ ${integration.name} integration test failed: ${result.error}`);
    }

    return result;
  }


  private async testAnalyticsDbIntegration(): Promise<IntegrationTestResult> {
    console.log('🧪 Testing analytics_db integration...');
    
    const result: IntegrationTestResult = {
      integration: 'analytics_db',
      success: false,
      tests: {}
    };

    try {
      // Test 1: Authentication
      console.log('  🔑 Testing authentication...');
      const authResult = await this.testAuthentication('analytics_db');
      result.tests.authentication = authResult;
      
      if (!authResult.success) {
        throw new Error(`Authentication failed: ${authResult.error}`);
      }

      // Test 2: Data Fetching
      console.log('  📥 Testing data fetching...');
      const fetchResult = await this.testDataFetching('analytics_db');
      result.tests.dataFetch = fetchResult;
      
      if (!fetchResult.success) {
        throw new Error(`Data fetching failed: ${fetchResult.error}`);
      }

      // Test 3: Database Storage
      console.log('  🗄️  Testing database storage...');
      const storeResult = await this.testDatabaseStorage('analytics_db', fetchResult.data);
      result.tests.databaseStore = storeResult;
      
      if (!storeResult.success) {
        throw new Error(`Database storage failed: ${storeResult.error}`);
      }

      // Test 4: Data Validation
      console.log('  ✅ Testing data validation...');
      const validationResult = await this.testDataValidation('analytics_db', storeResult.data);
      result.tests.dataValidation = validationResult;

      // Test 5: Health Check
      console.log('  💓 Testing health check...');
      const healthResult = await this.testHealthCheck('analytics_db');
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