import { prisma } from '../client';
import { TenantConfig } from '@opsai/shared';

export class TenantManager {
  /**
   * Create a new tenant
   */
  async createTenant(config: TenantConfig): Promise<any> {
    return prisma.tenant.create({
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
  async getTenant(tenantId: string): Promise<any> {
    return prisma.tenant.findUnique({
      where: { id: tenantId }
    });
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<any> {
    return prisma.tenant.findUnique({
      where: { slug }
    });
  }

  /**
   * Update tenant settings
   */
  async updateTenant(tenantId: string, updates: Partial<any>): Promise<any> {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: updates
    });
  }

  /**
   * Delete tenant and all associated data
   */
  async deleteTenant(tenantId: string): Promise<void> {
    // Delete all tenant data in a transaction
    await prisma.$transaction(async (tx) => {
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
  async listTenants(): Promise<any[]> {
    return prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Enable/disable tenant
   */
  async setTenantStatus(tenantId: string, isActive: boolean): Promise<any> {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive }
    });
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(tenantId: string): Promise<any> {
    const [
      userCount,
      fileCount,
      workflowCount,
      integrationCount,
      alertCount
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.file.count({ where: { tenantId } }),
      prisma.workflow.count({ where: { tenantId } }),
      prisma.integration.count({ where: { tenantId } }),
      prisma.alert.count({ 
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
  isolateData(query: any, tenantId: string): any {
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
  async enableRLS(tableName: string): Promise<void> {
    // This would typically be done in a migration
    // For now, we'll just log the intention
    console.log(`Enabling RLS for table: ${tableName}`);
  }

  /**
   * Create RLS policies for tenant isolation
   */
  async createRLSPolicies(tableName: string, tenantId: string): Promise<void> {
    // This would create database-level policies
    // Implementation depends on the database system
    console.log(`Creating RLS policies for table: ${tableName}, tenant: ${tenantId}`);
  }
} 