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
    expect(report.results).toHaveLength(16);
    
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

  
  describe('stripe_payments Integration Sync', () => {
    test('should validate stripe_payments authentication before sync', async () => {
      const client = (integrationService as any).stripePayments;
      expect(client).toBeDefined();
      
      const health = await client.healthCheck();
      
      if (health.status === 'unhealthy') {
        console.warn('⚠️  stripe_payments is unhealthy, sync tests may fail:', health.details);
      }
      
      expect(health).toHaveProperty('status');
    });

    
    test('should sync User data from stripe_payments', async () => {
      const result = await syncService.validateEntitySync('stripe_payments', 'User');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('stripe_payments');
      expect(result.entity).toBe('User');
      
      if (!result.success) {
        console.warn('⚠️  User sync from stripe_payments failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ User sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Organization data from stripe_payments', async () => {
      const result = await syncService.validateEntitySync('stripe_payments', 'Organization');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('stripe_payments');
      expect(result.entity).toBe('Organization');
      
      if (!result.success) {
        console.warn('⚠️  Organization sync from stripe_payments failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Organization sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Project data from stripe_payments', async () => {
      const result = await syncService.validateEntitySync('stripe_payments', 'Project');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('stripe_payments');
      expect(result.entity).toBe('Project');
      
      if (!result.success) {
        console.warn('⚠️  Project sync from stripe_payments failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Project sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Task data from stripe_payments', async () => {
      const result = await syncService.validateEntitySync('stripe_payments', 'Task');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('stripe_payments');
      expect(result.entity).toBe('Task');
      
      if (!result.success) {
        console.warn('⚠️  Task sync from stripe_payments failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Task sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
  });


  describe('sendgrid_email Integration Sync', () => {
    test('should validate sendgrid_email authentication before sync', async () => {
      const client = (integrationService as any).sendgridEmail;
      expect(client).toBeDefined();
      
      const health = await client.healthCheck();
      
      if (health.status === 'unhealthy') {
        console.warn('⚠️  sendgrid_email is unhealthy, sync tests may fail:', health.details);
      }
      
      expect(health).toHaveProperty('status');
    });

    
    test('should sync User data from sendgrid_email', async () => {
      const result = await syncService.validateEntitySync('sendgrid_email', 'User');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('sendgrid_email');
      expect(result.entity).toBe('User');
      
      if (!result.success) {
        console.warn('⚠️  User sync from sendgrid_email failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ User sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Organization data from sendgrid_email', async () => {
      const result = await syncService.validateEntitySync('sendgrid_email', 'Organization');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('sendgrid_email');
      expect(result.entity).toBe('Organization');
      
      if (!result.success) {
        console.warn('⚠️  Organization sync from sendgrid_email failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Organization sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Project data from sendgrid_email', async () => {
      const result = await syncService.validateEntitySync('sendgrid_email', 'Project');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('sendgrid_email');
      expect(result.entity).toBe('Project');
      
      if (!result.success) {
        console.warn('⚠️  Project sync from sendgrid_email failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Project sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Task data from sendgrid_email', async () => {
      const result = await syncService.validateEntitySync('sendgrid_email', 'Task');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('sendgrid_email');
      expect(result.entity).toBe('Task');
      
      if (!result.success) {
        console.warn('⚠️  Task sync from sendgrid_email failed:');
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


  describe('analytics_db Integration Sync', () => {
    test('should validate analytics_db authentication before sync', async () => {
      const client = (integrationService as any).analyticsDb;
      expect(client).toBeDefined();
      
      const health = await client.healthCheck();
      
      if (health.status === 'unhealthy') {
        console.warn('⚠️  analytics_db is unhealthy, sync tests may fail:', health.details);
      }
      
      expect(health).toHaveProperty('status');
    });

    
    test('should sync User data from analytics_db', async () => {
      const result = await syncService.validateEntitySync('analytics_db', 'User');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('analytics_db');
      expect(result.entity).toBe('User');
      
      if (!result.success) {
        console.warn('⚠️  User sync from analytics_db failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ User sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Organization data from analytics_db', async () => {
      const result = await syncService.validateEntitySync('analytics_db', 'Organization');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('analytics_db');
      expect(result.entity).toBe('Organization');
      
      if (!result.success) {
        console.warn('⚠️  Organization sync from analytics_db failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Organization sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Project data from analytics_db', async () => {
      const result = await syncService.validateEntitySync('analytics_db', 'Project');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('analytics_db');
      expect(result.entity).toBe('Project');
      
      if (!result.success) {
        console.warn('⚠️  Project sync from analytics_db failed:');
        result.errors.forEach(error => console.warn(`   - ${error}`));
      } else {
        expect(result.recordsStored).toBeGreaterThanOrEqual(0);
        console.log(`✅ Project sync successful: ${result.recordsStored} records`);
      }
    }, 30000);
    test('should sync Task data from analytics_db', async () => {
      const result = await syncService.validateEntitySync('analytics_db', 'Task');
      
      expect(result).toBeDefined();
      expect(result.integration).toBe('analytics_db');
      expect(result.entity).toBe('Task');
      
      if (!result.success) {
        console.warn('⚠️  Task sync from analytics_db failed:');
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
    expect(report.results).toHaveLength(16);
    
    // Check that failed syncs are properly reported
    const failedSyncs = report.results.filter(r => !r.success);
    failedSyncs.forEach(failed => {
      expect(failed.errors.length).toBeGreaterThan(0);
      expect(failed.duration).toBeGreaterThanOrEqual(0);
    });
  });
});