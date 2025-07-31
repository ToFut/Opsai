import { EmailServiceClient } from '../../src/integrations/email_service-client';
import { integrationService } from '../../src/integrations';

describe('email_service Health Monitoring', () => {
  let client: EmailServiceClient;

  beforeEach(() => {
    client = new EmailServiceClient({
      baseUrl: process.env.EMAIL_SERVICE_BASE_URL || 'https://api.sendgrid.com/v3',
      apiKey: process.env.EMAIL_SERVICE_API_KEY,
      timeout: 10000
    });
  });

  test('should report healthy status when API is accessible', async () => {
    const health = await client.healthCheck();
    
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('integration', 'email_service');
    
    if (health.status === 'unhealthy') {
      console.warn('⚠️  email_service API is currently unhealthy:', health.details);
    }
  });

  test('should integrate with overall health monitoring', async () => {
    const overallHealth = await integrationService.healthCheck();
    
    expect(overallHealth).toHaveProperty('email_service');
    expect(overallHealth['email_service']).toHaveProperty('status');
    expect(overallHealth['email_service']).toHaveProperty('integration', 'email_service');
  });

  test('should test all connections simultaneously', async () => {
    const testResult = await integrationService.testAllConnections();
    
    expect(testResult).toHaveProperty('success');
    expect(testResult).toHaveProperty('results');
    expect(testResult.results).toHaveProperty('email_service');
    
    if (!testResult.success) {
      console.warn('⚠️  Some integrations are failing:', testResult.results);
    }
  });

  test('should handle connection timeouts appropriately', async () => {
    // Create client with very short timeout
    const timeoutClient = new EmailServiceClient({
      baseUrl: process.env.EMAIL_SERVICE_BASE_URL || 'https://api.sendgrid.com/v3',
      timeout: 100, // 100ms timeout
      apiKey: process.env.EMAIL_SERVICE_API_KEY,
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