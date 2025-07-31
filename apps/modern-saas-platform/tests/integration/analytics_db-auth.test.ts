import { AnalyticsDbClient } from '../../src/integrations/analytics_db-client';
import { AuthenticationError } from '../../src/integrations/errors';

describe('analytics_db Authentication', () => {
  let client: AnalyticsDbClient;

  beforeEach(() => {
    client = new AnalyticsDbClient({
      baseUrl: process.env.ANALYTICS_DB_BASE_URL || '',
      timeout: 10000,
      timeout: 10000
    });
  });

  test('should authenticate successfully with valid credentials', async () => {
    // Test authentication by making a simple API call
    try {
      const result = await client.healthCheck();
      expect(result.status).toBe('healthy');
      expect(result.integration).toBe('analytics_db');
    } catch (error) {
      if (error instanceof AuthenticationError) {
        fail(`Authentication failed: ${error.message}. Please check your API credentials.`);
      }
      throw error;
    }
  });

  test('should fail authentication with invalid credentials', async () => {
    // Create client with invalid credentials
    const invalidClient = new AnalyticsDbClient({
      baseUrl: process.env.ANALYTICS_DB_BASE_URL || '',
      timeout: 5000
    });

    await expect(invalidClient.healthCheck()).rejects.toThrow(AuthenticationError);
  });

  test('should handle network errors gracefully', async () => {
    // Create client with invalid URL
    const unreachableClient = new AnalyticsDbClient({
      baseUrl: 'https://invalid-url-that-does-not-exist.com',
      timeout: 5000,
      timeout: 10000
    });

    const result = await unreachableClient.healthCheck();
    expect(result.status).toBe('unhealthy');
    expect(result.details).toBeDefined();
  });

  
});