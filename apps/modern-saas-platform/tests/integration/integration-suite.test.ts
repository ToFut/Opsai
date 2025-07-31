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
    expect(report.totalIntegrations).toBe(4);
    expect(report.results).toHaveLength(4);
    
    // Log detailed results
    console.log('📊 Integration Test Report:');
    console.log(`✅ ${report.successfulIntegrations}/${report.totalIntegrations} integrations working`);
    
    report.results.forEach(result => {
      if (result.success) {
        console.log(`  ✅ ${result.integration}: All tests passed`);
      } else {
        console.log(`  ❌ ${result.integration}: ${result.error}`);
        
        Object.entries(result.tests).forEach(([testName, testResult]) => {
          if (testResult && !testResult.success) {
            console.log(`    ❌ ${testName}: ${testResult.error}`);
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
      'stripe_payments', 'sendgrid_email', 'slack_notifications', 'analytics_db'
    ];

    for (const integrationName of integrations) {
      // Check required environment variables exist
      const envPrefix = integrationName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const baseUrlVar = `${envPrefix}_BASE_URL`;
      
      if (!process.env[baseUrlVar]) {
        console.warn(`⚠️  Missing ${baseUrlVar} environment variable`);
      }
    }
  });
});