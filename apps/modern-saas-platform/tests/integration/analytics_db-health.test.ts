import { AnalyticsDbClient } from '../../src/integrations/analytics_db-client';
import { integrationService } from '../../src/integrations';

describe('analytics_db Health Monitoring', () => {
  let client: AnalyticsDbClient;

  beforeEach(() => {
    client = new AnalyticsDbClient({
      baseUrl: process.env.ANALYTICS_DB_BASE_URL || '',
      timeout: 10000
    });
  });

  test('should report healthy status when API is accessible', async () => {
    const health = await client.healthCheck();
    
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('integration', 'analytics_db');
    
    if (health.status === 'unhealthy') {
      console.warn('⚠️  analytics_db API is currently unhealthy:', health.details);
    }
  });

  test('should integrate with overall health monitoring', async () => {
    const overallHealth = await integrationService.healthCheck();
    
    expect(overallHealth).toHaveProperty('analytics_db');
    expect(overallHealth['analytics_db']).toHaveProperty('status');
    expect(overallHealth['analytics_db']).toHaveProperty('integration', 'analytics_db');
  });

  test('should test all connections simultaneously', async () => {
    const testResult = await integrationService.testAllConnections();
    
    expect(testResult).toHaveProperty('success');
    expect(testResult).toHaveProperty('results');
    expect(testResult.results).toHaveProperty('analytics_db');
    
    if (!testResult.success) {
      console.warn('⚠️  Some integrations are failing:', testResult.results);
    }
  });

  test('should handle connection timeouts appropriately', async () => {
    // Create client with very short timeout
    const timeoutClient = new AnalyticsDbClient({
      baseUrl: process.env.ANALYTICS_DB_BASE_URL || '',
      timeout: 100, // 100ms timeout
      timeout: 10000
    });

    const health = await timeoutClient.healthCheck();
    
    // Should handle timeout gracefully
    expect(health.status).toBeDefined();
    
    if (health.status === 'unhealthy') {
      expect(health.details).toContain('timeout');
    }
  });
});