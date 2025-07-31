import { PrismaClient } from '@prisma/client';
export interface TenantConfig {
    id: string;
    name: string;
    slug: string;
    databaseUrl: string;
    settings: Record<string, any>;
}
export declare class TenantManager {
    private prisma;
    constructor(prisma: PrismaClient);
    createTenant(config: Omit<TenantConfig, 'id'>): Promise<TenantConfig>;
    getTenant(tenantId: string): Promise<TenantConfig | null>;
    getTenantBySlug(slug: string): Promise<TenantConfig | null>;
    updateTenant(tenantId: string, updates: Partial<TenantConfig>): Promise<TenantConfig>;
    deleteTenant(tenantId: string): Promise<void>;
    listTenants(): Promise<TenantConfig[]>;
    updateTenantSettings(tenantId: string, settings: Record<string, any>): Promise<TenantConfig>;
    getTenantStats(tenantId: string): Promise<{
        userCount: number;
        fileCount: number;
        workflowCount: number;
        integrationCount: number;
        alertCount: number;
    }>;
}
//# sourceMappingURL=tenant.d.ts.map