import { PrismaClient } from '@prisma/client'

export interface SeedData {
  table: string
  data: Record<string, any>[]
}

export class DatabaseSeeder {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async seedDatabase(seedData: SeedData[]): Promise<void> {
    try {
      for (const tableData of seedData) {
        await this.seedTable(tableData.table, tableData.data)
      }
    } catch (error) {
      throw new Error(`Seeding failed: ${error}`)
    }
  }

  private async seedTable(tableName: string, data: Record<string, any>[]): Promise<void> {
    try {
      // Use dynamic table access
      const table = (this.prisma as any)[tableName]
      if (!table) {
        throw new Error(`Table ${tableName} not found in Prisma client`)
      }

      for (const record of data) {
        await table.create({
          data: record
        })
      }
    } catch (error) {
      throw new Error(`Failed to seed table ${tableName}: ${error}`)
    }
  }

  async clearTable(tableName: string): Promise<void> {
    try {
      const table = (this.prisma as any)[tableName]
      if (!table) {
        throw new Error(`Table ${tableName} not found in Prisma client`)
      }

      await table.deleteMany()
    } catch (error) {
      throw new Error(`Failed to clear table ${tableName}: ${error}`)
    }
  }

  async clearAllTables(): Promise<void> {
    try {
      // Clear tables in reverse dependency order
      const tables = [
        'alertDelivery',
        'alert',
        'alertRule',
        'workflowExecution',
        'workflow',
        'syncJob',
        'integration',
        'userRole',
        'rolePermission',
        'permission',
        'role',
        'auditLog',
        'file',
        'session',
        'user',
        'tenant'
      ]

      for (const tableName of tables) {
        await this.clearTable(tableName)
      }
    } catch (error) {
      throw new Error(`Failed to clear all tables: ${error}`)
    }
  }
} 