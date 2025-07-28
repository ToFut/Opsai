"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseSeeder = void 0;
const client_1 = require("../client");
class DatabaseSeeder {
    /**
     * Seed database with test data
     */
    async seedDatabase(tenantId, data) {
        for (const seedItem of data) {
            await this.seedTable(tenantId, seedItem);
        }
    }
    /**
     * Seed a specific table
     */
    async seedTable(tenantId, seedData) {
        const { table, data } = seedData;
        // Add tenantId to all records
        const recordsWithTenant = data.map(record => ({
            ...record,
            tenantId
        }));
        // Use Prisma's createMany for better performance
        await client_1.prisma[table].createMany({
            data: recordsWithTenant,
            skipDuplicates: true
        });
    }
    /**
     * Seed with default test data
     */
    async seedDefaultData(tenantId) {
        const defaultData = [
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
    async clearTenantData(tenantId) {
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
            await client_1.prisma[table].deleteMany({
                where: { tenantId }
            });
        }
    }
}
exports.DatabaseSeeder = DatabaseSeeder;
//# sourceMappingURL=seed.js.map