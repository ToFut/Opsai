"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseSeeder = void 0;
class DatabaseSeeder {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seedDatabase(seedData) {
        try {
            for (const tableData of seedData) {
                await this.seedTable(tableData.table, tableData.data);
            }
        }
        catch (error) {
            throw new Error(`Seeding failed: ${error}`);
        }
    }
    async seedTable(tableName, data) {
        try {
            // Use dynamic table access
            const table = this.prisma[tableName];
            if (!table) {
                throw new Error(`Table ${tableName} not found in Prisma client`);
            }
            for (const record of data) {
                await table.create({
                    data: record
                });
            }
        }
        catch (error) {
            throw new Error(`Failed to seed table ${tableName}: ${error}`);
        }
    }
    async clearTable(tableName) {
        try {
            const table = this.prisma[tableName];
            if (!table) {
                throw new Error(`Table ${tableName} not found in Prisma client`);
            }
            await table.deleteMany();
        }
        catch (error) {
            throw new Error(`Failed to clear table ${tableName}: ${error}`);
        }
    }
    async clearAllTables() {
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
            ];
            for (const tableName of tables) {
                await this.clearTable(tableName);
            }
        }
        catch (error) {
            throw new Error(`Failed to clear all tables: ${error}`);
        }
    }
}
exports.DatabaseSeeder = DatabaseSeeder;
//# sourceMappingURL=seed.js.map