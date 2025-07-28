import { TenantConfig } from '@opsai/shared';
export declare class TenantManager {
    /**
     * Create a new tenant
     */
    createTenant(config: TenantConfig): Promise<any>;
    /**
     * Get tenant by ID
     */
    getTenant(tenantId: string): Promise<any>;
    /**
     * Get tenant by slug
     */
    getTenantBySlug(slug: string): Promise<any>;
    /**
     * Update tenant settings
     */
    updateTenant(tenantId: string, updates: Partial<any>): Promise<any>;
    /**
     * Delete tenant and all associated data
     */
    deleteTenant(tenantId: string): Promise<void>;
    /**
     * List all tenants
     */
    listTenants(): Promise<any[]>;
    /**
     * Enable/disable tenant
     */
    setTenantStatus(tenantId: string, isActive: boolean): Promise<any>;
    /**
     * Get tenant statistics
     */
    getTenantStats(tenantId: string): Promise<any>;
    /**
     * Isolate data for a specific tenant in queries
     */
    isolateData(query: any, tenantId: string): any;
    /**
     * Enable Row Level Security for a table
     */
    enableRLS(tableName: string): Promise<void>;
    /**
     * Create RLS policies for tenant isolation
     */
    createRLSPolicies(tableName: string, tenantId: string): Promise<void>;
}
//# sourceMappingURL=tenant.d.ts.map