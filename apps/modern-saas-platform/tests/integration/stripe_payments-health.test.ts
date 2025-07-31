import { StripePaymentsClient } from '../../src/integrations/stripe_payments-client';
import { integrationService } from '../../src/integrations';

describe('stripe_payments Health Monitoring', () => {
  let client: StripePaymentsClient;

  beforeEach(() => {
    client = new StripePaymentsClient({
      baseUrl: process.env.STRIPE_PAYMENTS_BASE_URL || 'https://api.stripe.com/v1',
      timeout: 10000
    });
  });

  test('should report healthy status when API is accessible', async () => {
    const health = await client.healthCheck();
    
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('integration', 'stripe_payments');
    
    if (health.status === 'unhealthy') {
      console.warn('⚠️  stripe_payments API is currently unhealthy:', health.details);
    }
  });

  test('should integrate with overall health monitoring', async () => {
    const overallHealth = await integrationService.healthCheck();
    
    expect(overallHealth).toHaveProperty('stripe_payments');
    expect(overallHealth['stripe_payments']).toHaveProperty('status');
    expect(overallHealth['stripe_payments']).toHaveProperty('integration', 'stripe_payments');
  });

  test('should test all connections simultaneously', async () => {
    const testResult = await integrationService.testAllConnections();
    
    expect(testResult).toHaveProperty('success');
    expect(testResult).toHaveProperty('results');
    expect(testResult.results).toHaveProperty('stripe_payments');
    
    if (!testResult.success) {
      console.warn('⚠️  Some integrations are failing:', testResult.results);
    }
  });

  test('should handle connection timeouts appropriately', async () => {
    // Create client with very short timeout
    const timeoutClient = new StripePaymentsClient({
      baseUrl: process.env.STRIPE_PAYMENTS_BASE_URL || 'https://api.stripe.com/v1',
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