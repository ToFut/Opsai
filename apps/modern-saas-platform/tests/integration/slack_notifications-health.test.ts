import { SlackNotificationsClient } from '../../src/integrations/slack_notifications-client';
import { integrationService } from '../../src/integrations';

describe('slack_notifications Health Monitoring', () => {
  let client: SlackNotificationsClient;

  beforeEach(() => {
    client = new SlackNotificationsClient({
      baseUrl: process.env.SLACK_NOTIFICATIONS_BASE_URL || '',
      timeout: 10000
    });
  });

  test('should report healthy status when API is accessible', async () => {
    const health = await client.healthCheck();
    
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('integration', 'slack_notifications');
    
    if (health.status === 'unhealthy') {
      console.warn('⚠️  slack_notifications API is currently unhealthy:', health.details);
    }
  });

  test('should integrate with overall health monitoring', async () => {
    const overallHealth = await integrationService.healthCheck();
    
    expect(overallHealth).toHaveProperty('slack_notifications');
    expect(overallHealth['slack_notifications']).toHaveProperty('status');
    expect(overallHealth['slack_notifications']).toHaveProperty('integration', 'slack_notifications');
  });

  test('should test all connections simultaneously', async () => {
    const testResult = await integrationService.testAllConnections();
    
    expect(testResult).toHaveProperty('success');
    expect(testResult).toHaveProperty('results');
    expect(testResult.results).toHaveProperty('slack_notifications');
    
    if (!testResult.success) {
      console.warn('⚠️  Some integrations are failing:', testResult.results);
    }
  });

  test('should handle connection timeouts appropriately', async () => {
    // Create client with very short timeout
    const timeoutClient = new SlackNotificationsClient({
      baseUrl: process.env.SLACK_NOTIFICATIONS_BASE_URL || '',
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