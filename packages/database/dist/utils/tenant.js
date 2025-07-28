"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantManager = void 0;
const client_1 = require("../client");
class TenantManager {
    /**
     * Create a new tenant
     */
    async createTenant(config) {
        return client_1.prisma.tenant.create({
            data: {
                id: config.id,
                name: config.name,
                slug: config.slug,
                settings: config.settings || {}
            }
        });
    }
    /**
     * Get tenant by ID
     */
    async getTenant(tenantId) {
        return client_1.prisma.tenant.findUnique({
            where: { id: tenantId }
        });
    }
    /**
     * Get tenant by slug
     */
    async getTenantBySlug(slug) {
        return client_1.prisma.tenant.findUnique({
            where: { slug }
        });
    }
    /**
     * Update tenant settings
     */
    async updateTenant(tenantId, updates) {
        return client_1.prisma.tenant.update({
            where: { id: tenantId },
            data: updates
        });
    }
    /**
     * Delete tenant and all associated data
     */
    async deleteTenant(tenantId) {
        // Delete all tenant data in a transaction
        await client_1.prisma.$transaction(async (tx) => {
            // Delete in order to respect foreign key constraints
            await tx.auditLog.deleteMany({ where: { tenantId } });
            await tx.session.deleteMany({ where: { tenantId } });
            await tx.file.deleteMany({ where: { tenantId } });
            await tx.user.deleteMany({ where: { tenantId } });
            await tx.alertDelivery.deleteMany({
                where: {
                    alert: {
                        rule: { tenantId }
                    }
                }
            });
            await tx.alert.deleteMany({
                where: {
                    rule: { tenantId }
                }
            });
            await tx.alertRule.deleteMany({ where: { tenantId } });
            await tx.workflowExecution.deleteMany({
                where: {
                    workflow: { tenantId }
                }
            });
            await tx.workflow.deleteMany({ where: { tenantId } });
            await tx.syncJob.deleteMany({
                where: {
                    integration: { tenantId }
                }
            });
            await tx.integration.deleteMany({ where: { tenantId } });
            // Finally delete the tenant
            await tx.tenant.delete({ where: { id: tenantId } });
        });
    }
    /**
     * List all tenants
     */
    async listTenants() {
        return client_1.prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Enable/disable tenant
     */
    async setTenantStatus(tenantId, isActive) {
        return client_1.prisma.tenant.update({
            where: { id: tenantId },
            data: { isActive }
        });
    }
    /**
     * Get tenant statistics
     */
    async getTenantStats(tenantId) {
        const [userCount, fileCount, workflowCount, integrationCount, alertCount] = await Promise.all([
            client_1.prisma.user.count({ where: { tenantId } }),
            client_1.prisma.file.count({ where: { tenantId } }),
            client_1.prisma.workflow.count({ where: { tenantId } }),
            client_1.prisma.integration.count({ where: { tenantId } }),
            client_1.prisma.alert.count({
                where: {
                    rule: { tenantId }
                }
            })
        ]);
        return {
            userCount,
            fileCount,
            workflowCount,
            integrationCount,
            alertCount
        };
    }
    /**
     * Isolate data for a specific tenant in queries
     */
    isolateData(query, tenantId) {
        return {
            ...query,
            where: {
                ...query.where,
                tenantId
            }
        };
    }
    /**
     * Enable Row Level Security for a table
     */
    async enableRLS(tableName) {
        // This would typically be done in a migration
        // For now, we'll just log the intention
        console.log(`Enabling RLS for table: ${tableName}`);
    }
    /**
     * Create RLS policies for tenant isolation
     */
    async createRLSPolicies(tableName, tenantId) {
        // This would create database-level policies
        // Implementation depends on the database system
        console.log(`Creating RLS policies for table: ${tableName}, tenant: ${tenantId}`);
    }
}
exports.TenantManager = TenantManager;
//# sourceMappingURL=tenant.js.map