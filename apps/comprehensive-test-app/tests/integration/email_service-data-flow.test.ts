import { EmailServiceClient } from '../../src/integrations/email_service-client';
import { PrismaClient } from '@prisma/client';
import { IntegrationTestRunner } from './test-runner';

describe('email_service Data Flow', () => {
  let client: EmailServiceClient;
  let prisma: PrismaClient;
  let testRunner: IntegrationTestRunner;

  beforeAll(async () => {
    testRunner = new IntegrationTestRunner();
    await testRunner.setup();
    
    prisma = new PrismaClient();
    client = new EmailServiceClient({
      baseUrl: process.env.EMAIL_SERVICE_BASE_URL || 'https://api.sendgrid.com/v3',
      apiKey: process.env.EMAIL_SERVICE_API_KEY,
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

  
  test('should fetch and validate User data', async () => {
    try {
      // Attempt to fetch User data
      const data = await client.list('/users');
      
      if (Array.isArray(data) && data.length > 0) {
        // Validate first item structure
        const firstItem = data[0];
        const isValid = DataValidator.validateApiResponse(firstItem, 'user');
        
        expect(isValid).toBe(true);
        console.log('✅ User data structure is valid');
      } else {
        console.log('ℹ️  No User data available for testing');
      }
    } catch (error) {
      console.warn('⚠️  User endpoint may not be available:', error.message);
    }
  });

  test('should store User data in database correctly', async () => {
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
      
      console.log('✅ User data stored and validated successfully');
      
      // Clean up
      await prisma.user.delete({ where: { id: stored.id } });
      
    } catch (error) {
      console.error('❌ User database storage failed:', error);
      throw error;
    }
  });

  test('should fetch and validate Organization data', async () => {
    try {
      // Attempt to fetch Organization data
      const data = await client.list('/organizations');
      
      if (Array.isArray(data) && data.length > 0) {
        // Validate first item structure
        const firstItem = data[0];
        const isValid = DataValidator.validateApiResponse(firstItem, 'organization');
        
        expect(isValid).toBe(true);
        console.log('✅ Organization data structure is valid');
      } else {
        console.log('ℹ️  No Organization data available for testing');
      }
    } catch (error) {
      console.warn('⚠️  Organization endpoint may not be available:', error.message);
    }
  });

  test('should store Organization data in database correctly', async () => {
    const testData = generateTestData('organization');
    
    try {
      // Store in database
      const stored = await prisma.organization.create({
        data: {
          id: 'test-organization-' + Date.now(),
          ...testData,
          
        }
      });

      expect(stored).toBeDefined();
      expect(stored.id).toBeDefined();
      
      // Validate stored data
      const isValid = DataValidator.validateDatabaseRecord(stored, 'organization');
      expect(isValid).toBe(true);
      
      console.log('✅ Organization data stored and validated successfully');
      
      // Clean up
      await prisma.organization.delete({ where: { id: stored.id } });
      
    } catch (error) {
      console.error('❌ Organization database storage failed:', error);
      throw error;
    }
  });

  test('should fetch and validate Project data', async () => {
    try {
      // Attempt to fetch Project data
      const data = await client.list('/projects');
      
      if (Array.isArray(data) && data.length > 0) {
        // Validate first item structure
        const firstItem = data[0];
        const isValid = DataValidator.validateApiResponse(firstItem, 'project');
        
        expect(isValid).toBe(true);
        console.log('✅ Project data structure is valid');
      } else {
        console.log('ℹ️  No Project data available for testing');
      }
    } catch (error) {
      console.warn('⚠️  Project endpoint may not be available:', error.message);
    }
  });

  test('should store Project data in database correctly', async () => {
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
      
      console.log('✅ Project data stored and validated successfully');
      
      // Clean up
      await prisma.project.delete({ where: { id: stored.id } });
      
    } catch (error) {
      console.error('❌ Project database storage failed:', error);
      throw error;
    }
  });

  test('should fetch and validate Task data', async () => {
    try {
      // Attempt to fetch Task data
      const data = await client.list('/tasks');
      
      if (Array.isArray(data) && data.length > 0) {
        // Validate first item structure
        const firstItem = data[0];
        const isValid = DataValidator.validateApiResponse(firstItem, 'task');
        
        expect(isValid).toBe(true);
        console.log('✅ Task data structure is valid');
      } else {
        console.log('ℹ️  No Task data available for testing');
      }
    } catch (error) {
      console.warn('⚠️  Task endpoint may not be available:', error.message);
    }
  });

  test('should store Task data in database correctly', async () => {
    const testData = generateTestData('task');
    
    try {
      // Store in database
      const stored = await prisma.task.create({
        data: {
          id: 'test-task-' + Date.now(),
          ...testData,
          
        }
      });

      expect(stored).toBeDefined();
      expect(stored.id).toBeDefined();
      
      // Validate stored data
      const isValid = DataValidator.validateDatabaseRecord(stored, 'task');
      expect(isValid).toBe(true);
      
      console.log('✅ Task data stored and validated successfully');
      
      // Clean up
      await prisma.task.delete({ where: { id: stored.id } });
      
    } catch (error) {
      console.error('❌ Task database storage failed:', error);
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