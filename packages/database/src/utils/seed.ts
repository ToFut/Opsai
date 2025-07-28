import { prisma } from '../client';
import { SeedData } from '@opsai/shared';

export class DatabaseSeeder {
  /**
   * Seed database with test data
   */
  async seedDatabase(tenantId: string, data: SeedData[]): Promise<void> {
    for (const seedItem of data) {
      await this.seedTable(tenantId, seedItem);
    }
  }

  /**
   * Seed a specific table
   */
  private async seedTable(tenantId: string, seedData: SeedData): Promise<void> {
    const { table, data } = seedData;

    // Add tenantId to all records
    const recordsWithTenant = data.map(record => ({
      ...record,
      tenantId
    }));

    // Use Prisma's createMany for better performance
    await (prisma as any)[table].createMany({
      data: recordsWithTenant,
      skipDuplicates: true
    });
  }

  /**
   * Seed with default test data
   */
  async seedDefaultData(tenantId: string): Promise<void> {
    const defaultData: SeedData[] = [
      {
        table: 'users',
        data: [
          {
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            isActive: true
          },
          {
            email: 'user@example.com',
            firstName: 'Regular',
            lastName: 'User',
            role: 'user',
            isActive: true
          }
        ]
      }
    ];

    await this.seedDatabase(tenantId, defaultData);
  }

  /**
   * Clear all data for a tenant
   */
  async clearTenantData(tenantId: string): Promise<void> {
    const tables = [
      'auditLogs',
      'sessions',
      'files',
      'users',
      'alertDeliveries',
      'alerts',
      'alertRules',
      'workflowExecutions',
      'workflows',
      'syncJobs',
      'integrations'
    ];

    for (const table of tables) {
      await (prisma as any)[table].deleteMany({
        where: { tenantId }
      });
    }
  }
} 