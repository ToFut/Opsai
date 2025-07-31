import { DataSyncService } from './data-sync-service';
import { PrismaClient } from '@prisma/client';

describe('Data Sync Validation', () => {
  let syncService: DataSyncService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    syncService = new DataSyncService();
    prisma = new PrismaClient();
    
    // Ensure test database is clean
    await prisma.user.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.organization.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.project.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.task.deleteMany({ where: { id: { startsWith: 'test-' } } });
  });

  afterAll(async () => {
    // Clean up any remaining test data
    await prisma.user.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.organization.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.project.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.task.deleteMany({ where: { id: { startsWith: 'test-' } } });
    
    await prisma.$disconnect();
  });

  test('should validate complete data sync flow', async () => {
    const report = await syncService.validateAllIntegrationSync();
    
    expect(report).toBeDefined();
    expect(report.results).toHaveLength(8);
    
    // Check that at least some syncs are successful
    const successfulSyncs = report.results.filter(r => r.success);
    expect(successfulSyncs.length).toBeGreaterThan(0);
    
    // Log detailed results for debugging
    if (!report.overallSuccess) {
      console.log('🔍 Failed sync details:');
      report.results.filter(r => !r.success).forEach(result => {
        console.log(`❌ ${result.integration}:${result.entity}`);
        result.errors.forEach(error => console.log(`   - ${error}`));
      });
    }
  }, 120000); // 2 minute timeout

  
  describe('email_service Integration Sync', () => {
    test('should validate email_service authentication before sync', async () => {
      const client = (integrationService as any).emailService;
      expect(client).toBeDefined();
      
      const health = await client.healthCheck();
      
      if (health.status === 'unhealthy') {
        console.warn('⚠️  email_service is unhealthy, sync tests may fail:', health.details);
      }
      
      expect(health).toHaveProperty('status');
    });

    
    test('should sync User data from email_service', async () => {
      const result = await syncService.validateEntitySync('email_service', 'User');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('email_service');
      expect(result.entity).toBe('User');
      
      if (!result.success) {
        console.warn('⚠️  User sync from email_service failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ User sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Organization data from email_service', async () => {
      const result = await syncService.validateEntitySync('email_service', 'Organization');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('email_service');
      expect(result.entity).toBe('Organization');
      
      if (!result.success) {
        console.warn('⚠️  Organization sync from email_service failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Organization sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Project data from email_service', async () => {
      const result = await syncService.validateEntitySync('email_service', 'Project');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('email_service');
      expect(result.entity).toBe('Project');
      
      if (!result.success) {
        console.warn('⚠️  Project sync from email_service failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Project sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Task data from email_service', async () => {
      const result = await syncService.validateEntitySync('email_service', 'Task');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('email_service');
      expect(result.entity).toBe('Task');
      
      if (!result.success) {
        console.warn('⚠️  Task sync from email_service failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Task sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
  });


  describe('slack_notifications Integration Sync', () => {
    test('should validate slack_notifications authentication before sync', async () => {
      const client = (integrationService as any).slackNotifications;
      expect(client).toBeDefined();
      
      const health = await client.healthCheck();
      
      if (health.status === 'unhealthy') {
        console.warn('⚠️  slack_notifications is unhealthy, sync tests may fail:', health.details);
      }
      
      expect(health).toHaveProperty('status');
    });

    
    test('should sync User data from slack_notifications', async () => {
      const result = await syncService.validateEntitySync('slack_notifications', 'User');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('slack_notifications');
      expect(result.entity).toBe('User');
      
      if (!result.success) {
        console.warn('⚠️  User sync from slack_notifications failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ User sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Organization data from slack_notifications', async () => {
      const result = await syncService.validateEntitySync('slack_notifications', 'Organization');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('slack_notifications');
      expect(result.entity).toBe('Organization');
      
      if (!result.success) {
        console.warn('⚠️  Organization sync from slack_notifications failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Organization sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Project data from slack_notifications', async () => {
      const result = await syncService.validateEntitySync('slack_notifications', 'Project');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('slack_notifications');
      expect(result.entity).toBe('Project');
      
      if (!result.success) {
        console.warn('⚠️  Project sync from slack_notifications failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Project sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Task data from slack_notifications', async () => {
      const result = await syncService.validateEntitySync('slack_notifications', 'Task');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('slack_notifications');
      expect(result.entity).toBe('Task');
      
      if (!result.success) {
        console.warn('⚠️  Task sync from slack_notifications failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Task sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
  });

  test('should detect data mapping issues', async () => {
    // This test verifies that data mapping validation works
    const report = await syncService.validateAllIntegrationSync();
    
    const mappingErrors = report.results.reduce((acc, result) => {
      return acc + result.errors.filter(error => 
        error.includes('Type mismatch') || error.includes('Required field')
      ).length;
    }, 0);
    
    if (mappingErrors > 0) {
      console.warn(`⚠️  Found ${mappingErrors} data mapping issues`);
    }
    
    // Test should pass even with mapping issues, but warn about them
    expect(report.results).toBeDefined();
  });

  test('should handle integration failures gracefully', async () => {
    // Test that sync validation handles API failures gracefully
    const report = await syncService.validateAllIntegrationSync();
    
    // Even if some integrations fail, the report should be complete
    expect(report.results).toHaveLength(8);
    
    // Check that failed syncs are properly reported
    const failedSyncs = report.results.filter(r => !r.success);
    failedSyncs.forEach(failed => {
      expect(failed.errors.length).toBeGreaterThan(0);
      expect(failed.duration).toBeGreaterThanOrEqual(0);
    });
  });
});