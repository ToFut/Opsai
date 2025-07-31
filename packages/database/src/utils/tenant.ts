import { PrismaClient } from '@prisma/client'

export interface TenantConfig {
  id: string
  name: string
  slug: string
  databaseUrl: string
  settings: Record<string, any>
}

export class TenantManager {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async createTenant(config: Omit<TenantConfig, 'id'>): Promise<TenantConfig> {
    try {
      const tenant = await this.prisma.tenant.create({
        data: {
          name: config.name,
          slug: config.slug,
          domain: config.databaseUrl,
          settings: config.settings
        }
      })

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        databaseUrl: tenant.domain || '',
        settings: tenant.settings as Record<string, any>
      }
    } catch (error) {
      throw new Error(`Failed to create tenant: ${error}`)
    }
  }

  async getTenant(tenantId: string): Promise<TenantConfig | null> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      })

      if (!tenant) return null

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        databaseUrl: tenant.domain || '',
        settings: tenant.settings as Record<string, any>
      }
    } catch (error) {
      throw new Error(`Failed to get tenant: ${error}`)
    }
  }

  async getTenantBySlug(slug: string): Promise<TenantConfig | null> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug }
      })

      if (!tenant) return null

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        databaseUrl: tenant.domain || '',
        settings: tenant.settings as Record<string, any>
      }
    } catch (error) {
      throw new Error(`Failed to get tenant by slug: ${error}`)
    }
  }

  async updateTenant(tenantId: string, updates: Partial<TenantConfig>): Promise<TenantConfig> {
    try {
      const tenant = await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          name: updates.name,
          slug: updates.slug,
          domain: updates.databaseUrl,
          settings: updates.settings
        }
      })

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        databaseUrl: tenant.domain || '',
        settings: tenant.settings as Record<string, any>
      }
    } catch (error) {
      throw new Error(`Failed to update tenant: ${error}`)
    }
  }

  async deleteTenant(tenantId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete tenant data in reverse dependency order
        await tx.alertDelivery.deleteMany({ 
          where: { 
            alert: { 
              rule: { 
                tenantId 
              } 
            } 
          } 
        })
        
        await tx.alert.deleteMany({ 
          where: { 
            rule: { 
              tenantId 
            } 
          } 
        })
        
        await tx.alertRule.deleteMany({ where: { tenantId } })
        
        await tx.workflowExecution.deleteMany({ 
          where: { 
            workflow: { 
              tenantId 
            } 
          } 
        })
        
        await tx.workflow.deleteMany({ where: { tenantId } })
        
        await tx.syncJob.deleteMany({ 
          where: { 
            integration: { 
              tenantId 
            } 
          } 
        })
        
        await tx.integration.deleteMany({ where: { tenantId } })
        
        await tx.userRole.deleteMany({ where: { tenantId } })
        
        await tx.rolePermission.deleteMany({ 
          where: { 
            role: { 
              tenantId 
            } 
          } 
        })
        
        await tx.permission.deleteMany({ where: { tenantId } })
        
        await tx.role.deleteMany({ where: { tenantId } })
        
        await tx.auditLog.deleteMany({ where: { tenantId } })
        
        await tx.session.deleteMany({ where: { tenantId } })
        
        await tx.file.deleteMany({ where: { tenantId } })
        
        await tx.user.deleteMany({ where: { tenantId } })
        
        await tx.tenant.delete({ where: { id: tenantId } })
      })
    } catch (error) {
      throw new Error(`Failed to delete tenant: ${error}`)
    }
  }

  async listTenants(): Promise<TenantConfig[]> {
    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { isActive: true }
      })

      return tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        databaseUrl: tenant.domain || '',
        settings: tenant.settings as Record<string, any>
      }))
    } catch (error) {
      throw new Error(`Failed to list tenants: ${error}`)
    }
  }

  async updateTenantSettings(tenantId: string, settings: Record<string, any>): Promise<TenantConfig> {
    try {
      const tenant = await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { settings }
      })

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        databaseUrl: tenant.domain || '',
        settings: tenant.settings as Record<string, any>
      }
    } catch (error) {
      throw new Error(`Failed to update tenant settings: ${error}`)
    }
  }

  async getTenantStats(tenantId: string): Promise<{
    userCount: number
    fileCount: number
    workflowCount: number
    integrationCount: number
    alertCount: number
  }> {
    try {
      const [userCount, fileCount, workflowCount, integrationCount, alertCount] = await Promise.all([
        this.prisma.user.count({ where: { tenantId } }),
        this.prisma.file.count({ where: { tenantId } }),
        this.prisma.workflow.count({ where: { tenantId } }),
        this.prisma.integration.count({ where: { tenantId } }),
        this.prisma.alert.count({
          where: { 
            rule: { 
              tenantId 
            } 
          }
        })
      ])

      return {
        userCount,
        fileCount,
        workflowCount,
        integrationCount,
        alertCount
      }
    } catch (error) {
      throw new Error(`Failed to get tenant stats: ${error}`)
    }
  }
} 