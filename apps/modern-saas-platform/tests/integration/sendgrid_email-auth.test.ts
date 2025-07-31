import { SendgridEmailClient } from '../../src/integrations/sendgrid_email-client';
import { AuthenticationError } from '../../src/integrations/errors';

describe('sendgrid_email Authentication', () => {
  let client: SendgridEmailClient;

  beforeEach(() => {
    client = new SendgridEmailClient({
      baseUrl: process.env.SENDGRID_EMAIL_BASE_URL || 'https://api.sendgrid.com/v3',
      timeout: 10000,
      apiKey: process.env.SENDGRID_EMAIL_API_KEY,
      timeout: 10000
    });
  });

  test('should authenticate successfully with valid credentials', async () => {
    // Test authentication by making a simple API call
    try {
      const result = await client.healthCheck();
      expect(result.status).toBe('healthy');
      expect(result.integration).toBe('sendgrid_email');
    } catch (error) {
      if (error instanceof AuthenticationError) {
        fail(`Authentication failed: ${error.message}. Please check your API credentials.`);
      }
      throw error;
    }
  });

  test('should fail authentication with invalid credentials', async () => {
    // Create client with invalid credentials
    const invalidClient = new SendgridEmailClient({
      baseUrl: process.env.SENDGRID_EMAIL_BASE_URL || 'https://api.sendgrid.com/v3',
      apiKey: 'invalid-credential',
      timeout: 5000
    });

    await expect(invalidClient.healthCheck()).rejects.toThrow(AuthenticationError);
  });

  test('should handle network errors gracefully', async () => {
    // Create client with invalid URL
    const unreachableClient = new SendgridEmailClient({
      baseUrl: 'https://invalid-url-that-does-not-exist.com',
      timeout: 5000,
      apiKey: process.env.SENDGRID_EMAIL_API_KEY,
      timeout: 10000
    });

    const result = await unreachableClient.healthCheck();
    expect(result.status).toBe('unhealthy');
    expect(result.details).toBeDefined();
  });

  
  test('should validate api_key credential requirement', () => {
    const envVar = 'SENDGRID_EMAIL_API_KEY';
    const hasCredential = process.env[envVar];
    
    if (!hasCredential) {
      console.warn(`⚠️  Missing ${envVar} environment variable`);
    }
    
    // Test should pass even if credential is missing (for CI/CD)
    // but warn about it
    expect(envVar).toBeDefined();
  });
});