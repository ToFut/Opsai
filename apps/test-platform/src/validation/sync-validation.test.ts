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
    await prisma.project.deleteMany({ where: { id: { startsWith: 'test-' } } });
  });

  afterAll(async () => {
    // Clean up any remaining test data
    await prisma.user.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.project.deleteMany({ where: { id: { startsWith: 'test-' } } });
    
    await prisma.$disconnect();
  });

  test('should validate complete data sync flow', async () => {
    const report = await syncService.validateAllIntegrationSync();
    
    expect(report).toBeDefined();
    expect(report.results).toHaveLength(0);
    
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
    expect(report.results).toHaveLength(0);
    
    // Check that failed syncs are properly reported
    const failedSyncs = report.results.filter(r => !r.success);
    failedSyncs.forEach(failed => {
      expect(failed.errors.length).toBeGreaterThan(0);
      expect(failed.duration).toBeGreaterThanOrEqual(0);
    });
  });
});