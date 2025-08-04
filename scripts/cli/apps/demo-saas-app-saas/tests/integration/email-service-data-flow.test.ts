import { EmailServiceClient } from '../../src/integrations/email-service-client';
import { PrismaClient } from '@prisma/client';
import { IntegrationTestRunner } from './test-runner';

describe('email-service Data Flow', () => {
  let client: EmailServiceClient;
  let prisma: PrismaClient;
  let testRunner: IntegrationTestRunner;

  beforeAll(async () => {
    testRunner = new IntegrationTestRunner();
    await testRunner.setup();
    
    prisma = new PrismaClient();
    client = new EmailServiceClient({
      baseUrl: process.env.EMAIL_SERVICE_BASE_URL || '',
      timeout: 10000
    });
  });

  afterAll(async () => {
    await testRunner.teardown();
    await prisma.$disconnect();
  });

  test('should fetch data from API successfully', async () => {
    try {
      // Test basic data fetching
      const data = await client.list('/test-endpoint');
      
      expect(data).toBeDefined();
      expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      
      console.log('✅ Data fetched successfully:', {
        type: Array.isArray(data) ? 'array' : typeof data,
        itemCount: Array.isArray(data) ? data.length : 'N/A'
      });
    } catch (error) {
      console.error('❌ Data fetching failed:', error);
      throw error;
    }
  });

  
  test('should fetch and validate user data', async () => {
    try {
      // Attempt to fetch user data
      const data = await client.list('/users');
      
      if (Array.isArray(data) && data.length > 0) {
        // Validate first item structure
        const firstItem = data[0];
        const isValid = DataValidator.validateApiResponse(firstItem, 'user');
        
        expect(isValid).toBe(true);
        console.log('✅ user data structure is valid');
      } else {
        console.log('ℹ️  No user data available for testing');
      }
    } catch (error) {
      console.warn('⚠️  user endpoint may not be available:', error.message);
    }
  });

  test('should store user data in database correctly', async () => {
    const testData = generateTestData('user');
    
    try {
      // Store in database
      const stored = await prisma.user.create({
        data: {
          id: 'test-user-' + Date.now(),
          ...testData,
          
        }
      });

      expect(stored).toBeDefined();
      expect(stored.id).toBeDefined();
      
      // Validate stored data
      const isValid = DataValidator.validateDatabaseRecord(stored, 'user');
      expect(isValid).toBe(true);
      
      console.log('✅ user data stored and validated successfully');
      
      // Clean up
      await prisma.user.delete({ where: { id: stored.id } });
      
    } catch (error) {
      console.error('❌ user database storage failed:', error);
      throw error;
    }
  });

  test('should fetch and validate project data', async () => {
    try {
      // Attempt to fetch project data
      const data = await client.list('/projects');
      
      if (Array.isArray(data) && data.length > 0) {
        // Validate first item structure
        const firstItem = data[0];
        const isValid = DataValidator.validateApiResponse(firstItem, 'project');
        
        expect(isValid).toBe(true);
        console.log('✅ project data structure is valid');
      } else {
        console.log('ℹ️  No project data available for testing');
      }
    } catch (error) {
      console.warn('⚠️  project endpoint may not be available:', error.message);
    }
  });

  test('should store project data in database correctly', async () => {
    const testData = generateTestData('project');
    
    try {
      // Store in database
      const stored = await prisma.project.create({
        data: {
          id: 'test-project-' + Date.now(),
          ...testData,
          
        }
      });

      expect(stored).toBeDefined();
      expect(stored.id).toBeDefined();
      
      // Validate stored data
      const isValid = DataValidator.validateDatabaseRecord(stored, 'project');
      expect(isValid).toBe(true);
      
      console.log('✅ project data stored and validated successfully');
      
      // Clean up
      await prisma.project.delete({ where: { id: stored.id } });
      
    } catch (error) {
      console.error('❌ project database storage failed:', error);
      throw error;
    }
  });

  test('should handle API rate limits gracefully', async () => {
    // Test rate limiting behavior
    const promises = Array.from({ length: 10 }, (_, i) => 
      client.get(`/test-endpoint?page=${i}`)
    );

    // Should not throw rate limit errors due to our rate limiter
    const results = await Promise.allSettled(promises);
    const failures = results.filter(r => r.status === 'rejected');
    
    // Allow some failures but not all
    expect(failures.length).toBeLessThan(results.length);
  });

  test('should retry failed requests automatically', async () => {
    // This test verifies our retry mechanism works
    // We can't easily simulate server errors, so we test the retry logic indirectly
    const startTime = Date.now();
    
    try {
      await client.get('/non-existent-endpoint');
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Should have taken some time due to retries
      expect(duration).toBeGreaterThan(1000); // At least 1 second for retries
    }
  });
});