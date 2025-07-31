import { v4 as uuidv4 } from 'uuid'
import { Logger } from '@opsai/shared'

export interface Tenant {
  id: string
  name: string
  slug: string
  status: 'active' | 'inactive' | 'suspended'
  settings: TenantSettings
  createdAt: Date
  updatedAt: Date
}

export interface TenantSettings {
  timezone: string
  currency: string
  language: string
  features: string[]
  limits: {
    users: number
    storage: number
    apiCalls: number
  }
}

export interface TenantConfig {
  name: string
  slug?: string
  settings?: Partial<TenantSettings>
}

export class TenantManager {
  private static instance: TenantManager
  private tenants: Map<string, Tenant> = new Map()
  private logger: Logger

  private constructor() {
    this.logger = new Logger('TenantManager')
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TenantManager {
    if (!TenantManager.instance) {
      TenantManager.instance = new TenantManager()
    }
    return TenantManager.instance
  }

  /**
   * Create a new tenant
   */
  async createTenant(config: TenantConfig): Promise<Tenant> {
    try {
      const id = uuidv4()
      const slug = config.slug || this.generateSlug(config.name)
      
      // Check if slug already exists
      if (this.getTenantBySlug(slug)) {
        throw new Error(`Tenant with slug '${slug}' already exists`)
      }

      const tenant: Tenant = {
        id,
        name: config.name,
        slug,
        status: 'active',
        settings: {
          timezone: 'UTC',
          currency: 'USD',
          language: 'en',
          features: ['basic'],
          limits: {
            users: 10,
            storage: 1024 * 1024 * 100, // 100MB
            apiCalls: 1000
          },
          ...config.settings
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.tenants.set(id, tenant)
      this.logger.info(`Created tenant: ${tenant.name} (${tenant.id})`)
      
      return tenant
    } catch (error) {
      this.logger.error('Failed to create tenant', error)
      throw error
    }
  }

  /**
   * Get tenant by ID
   */
  getTenant(id: string): Tenant | undefined {
    return this.tenants.get(id)
  }

  /**
   * Get tenant by slug
   */
  getTenantBySlug(slug: string): Tenant | undefined {
    return Array.from(this.tenants.values()).find(tenant => tenant.slug === slug)
  }

  /**
   * Update tenant
   */
  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    try {
      const tenant = this.getTenant(id)
      if (!tenant) {
        throw new Error(`Tenant not found: ${id}`)
      }

      const updatedTenant: Tenant = {
        ...tenant,
        ...updates,
        updatedAt: new Date()
      }

      this.tenants.set(id, updatedTenant)
      this.logger.info(`Updated tenant: ${updatedTenant.name} (${id})`)
      
      return updatedTenant
    } catch (error) {
      this.logger.error(`Failed to update tenant: ${id}`, error)
      throw error
    }
  }

  /**
   * Delete tenant
   */
  async deleteTenant(id: string): Promise<void> {
    try {
      const tenant = this.getTenant(id)
      if (!tenant) {
        throw new Error(`Tenant not found: ${id}`)
      }

      this.tenants.delete(id)
      this.logger.info(`Deleted tenant: ${tenant.name} (${id})`)
    } catch (error) {
      this.logger.error(`Failed to delete tenant: ${id}`, error)
      throw error
    }
  }

  /**
   * List all tenants
   */
  listTenants(): Tenant[] {
    return Array.from(this.tenants.values())
  }

  /**
   * Get tenant statistics
   */
  getTenantStats(): {
    total: number
    active: number
    inactive: number
    suspended: number
  } {
    const tenants = this.listTenants()
    return {
      total: tenants.length,
      active: tenants.filter(t => t.status === 'active').length,
      inactive: tenants.filter(t => t.status === 'inactive').length,
      suspended: tenants.filter(t => t.status === 'suspended').length
    }
  }

  /**
   * Setup tenant database schema
   */
  async setupTenantDatabase(tenantId: string, schema: any): Promise<void> {
    try {
      this.logger.info(`Setting up database for tenant: ${tenantId}`)
      // This would typically involve creating database schemas, tables, etc.
      // For now, we'll just log the action
    } catch (error) {
      this.logger.error(`Failed to setup database for tenant: ${tenantId}`, error)
      throw error
    }
  }

  /**
   * Enable row-level security
   */
  async enableRLS(tenantId: string): Promise<void> {
    try {
      this.logger.info(`Enabling RLS for tenant: ${tenantId}`)
      // This would typically involve setting up database policies
      // For now, we'll just log the action
    } catch (error) {
      this.logger.error(`Failed to enable RLS for tenant: ${tenantId}`, error)
      throw error
    }
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  /**
   * Validate tenant configuration
   */
  validateTenantConfig(config: TenantConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Tenant name is required')
    }

    if (config.name && config.name.length > 100) {
      errors.push('Tenant name must be less than 100 characters')
    }

    if (config.slug && !/^[a-z0-9-]+$/.test(config.slug)) {
      errors.push('Tenant slug must contain only lowercase letters, numbers, and hyphens')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
} 