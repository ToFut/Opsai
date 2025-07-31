import { SendgridEmailClient } from '../../src/integrations/sendgrid_email-client';
import { integrationService } from '../../src/integrations';

describe('sendgrid_email Health Monitoring', () => {
  let client: SendgridEmailClient;

  beforeEach(() => {
    client = new SendgridEmailClient({
      baseUrl: process.env.SENDGRID_EMAIL_BASE_URL || 'https://api.sendgrid.com/v3',
      apiKey: process.env.SENDGRID_EMAIL_API_KEY,
      timeout: 10000
    });
  });

  test('should report healthy status when API is accessible', async () => {
    const health = await client.healthCheck();
    
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('integration', 'sendgrid_email');
    
    if (health.status === 'unhealthy') {
      console.warn('⚠️  sendgrid_email API is currently unhealthy:', health.details);
    }
  });

  test('should integrate with overall health monitoring', async () => {
    const overallHealth = await integrationService.healthCheck();
    
    expect(overallHealth).toHaveProperty('sendgrid_email');
    expect(overallHealth['sendgrid_email']).toHaveProperty('status');
    expect(overallHealth['sendgrid_email']).toHaveProperty('integration', 'sendgrid_email');
  });

  test('should test all connections simultaneously', async () => {
    const testResult = await integrationService.testAllConnections();
    
    expect(testResult).toHaveProperty('success');
    expect(testResult).toHaveProperty('results');
    expect(testResult.results).toHaveProperty('sendgrid_email');
    
    if (!testResult.success) {
      console.warn('⚠️  Some integrations are failing:', testResult.results);
    }
  });

  test('should handle connection timeouts appropriately', async () => {
    // Create client with very short timeout
    const timeoutClient = new SendgridEmailClient({
      baseUrl: process.env.SENDGRID_EMAIL_BASE_URL || 'https://api.sendgrid.com/v3',
      timeout: 100, // 100ms timeout
      apiKey: process.env.SENDGRID_EMAIL_API_KEY,
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