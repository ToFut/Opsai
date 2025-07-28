import { SeedData } from '@opsai/shared';
export declare class DatabaseSeeder {
    /**
     * Seed database with test data
     */
    seedDatabase(tenantId: string, data: SeedData[]): Promise<void>;
    /**
     * Seed a specific table
     */
    private seedTable;
    /**
     * Seed with default test data
     */
    seedDefaultData(tenantId: string): Promise<void>;
    /**
     * Clear all data for a tenant
     */
    clearTenantData(tenantId: string): Promise<void>;
}
//# sourceMappingURL=seed.d.ts.map