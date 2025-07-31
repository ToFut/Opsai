import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { 
  Tenant, 
  User, 
  Role, 
  TenantConfig, 
  TenantSettings, 
  TenantStatus,
  CreateTenantRequest,
  UpdateTenantRequest
} from './types'

export class TenantManager {
  private supabase: SupabaseClient
  private static instance: TenantManager

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  static getInstance(supabaseUrl?: string, supabaseKey?: string): TenantManager {
    if (!TenantManager.instance && supabaseUrl && supabaseKey) {
      TenantManager.instance = new TenantManager(supabaseUrl, supabaseKey)
    }
    return TenantManager.instance
  }

  // Tenant Management
  async createTenant(tenantData: CreateTenantRequest): Promise<Tenant> {
    const slug = tenantData.slug || this.generateSlug(tenantData.name)
    
    // Validate slug uniqueness
    const existingTenant = await this.getTenantBySlug(slug)
    if (existingTenant) {
      throw new Error(`Tenant with slug '${slug}' already exists`)
    }
    
    const defaultSettings: TenantSettings = {
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      dateFormat: 'YYYY-MM-DD',
      numberFormat: 'en-US',
      ...tenantData.settings
    }
    
    const defaultConfig: TenantConfig = {
      database: {
        isolation: 'row_level'
      },
      features: {
        maxUsers: 100,
        maxStorage: 1024 * 1024 * 1024, // 1GB
        enabledFeatures: ['auth', 'database', 'api']
      },
      integrations: {
        allowedProviders: ['rest', 'webhook'],
        maxConnections: 10
      },
      ...tenantData.config
    }
    const { data, error } = await this.supabase
      .from('tenants')
      .insert({
        name: tenantData.name,
        slug,
        config: defaultConfig,
        status: 'active' as TenantStatus,
        settings: defaultSettings
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create tenant: ${error.message}`)
    return data
  }

  async getTenant(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (error) throw new Error(`Failed to get tenant: ${error.message}`)
    return data
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw new Error(`Failed to get tenant by slug: ${error.message}`)
    return data
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await this.supabase
      .from('tenants')
      .update(updates)
      .eq('id', tenantId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update tenant: ${error.message}`)
    return data
  }

  async deleteTenant(tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId)

    if (error) throw new Error(`Failed to delete tenant: ${error.message}`)
  }

  // User Management
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        email: userData.email,
        tenantId: userData.tenantId,
        role: userData.role,
        permissions: userData.permissions,
        status: userData.status
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create user: ${error.message}`)
    return data
  }

  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw new Error(`Failed to get user: ${error.message}`)
    return data
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('tenantId', tenantId)

    if (error) throw new Error(`Failed to get users: ${error.message}`)
    return data || []
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update user: ${error.message}`)
    return data
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) throw new Error(`Failed to delete user: ${error.message}`)
  }

  // Role Management
  async createRole(roleData: Omit<Role, 'id'>): Promise<Role> {
    const { data, error } = await this.supabase
      .from('roles')
      .insert({
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        tenantId: roleData.tenantId,
        isDefault: roleData.isDefault
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create role: ${error.message}`)
    return data
  }

  async getRolesByTenant(tenantId: string): Promise<Role[]> {
    const { data, error } = await this.supabase
      .from('roles')
      .select('*')
      .eq('tenantId', tenantId)

    if (error) throw new Error(`Failed to get roles: ${error.message}`)
    return data || []
  }

  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const { data, error } = await this.supabase
      .from('roles')
      .update(updates)
      .eq('id', roleId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update role: ${error.message}`)
    return data
  }

  async deleteRole(roleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('roles')
      .delete()
      .eq('id', roleId)

    if (error) throw new Error(`Failed to delete role: ${error.message}`)
  }

  // Permission Management
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    const user = await this.getUser(userId)
    if (!user) return false

    return user.permissions.includes(permission)
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.getUser(userId)
    if (!user) return []

    return user.permissions
  }

  // Tenant Isolation
  async getTenantDatabase(tenantId: string): Promise<string> {
    const tenant = await this.getTenant(tenantId)
    if (!tenant) throw new Error('Tenant not found')

    // Generate tenant-specific database schema name
    return `tenant_${tenant.slug}`
  }

  async setupTenantDatabase(tenantId: string, config: TenantConfig): Promise<void> {
    const tenant = await this.getTenant(tenantId)
    if (!tenant) throw new Error('Tenant not found')

    // Create tenant-specific schema
    const schemaName = await this.getTenantDatabase(tenantId)
    
    // Execute SQL to create schema and tables
    const { error } = await this.supabase.rpc('setup_tenant_schema', {
      schema_name: schemaName,
      config_json: JSON.stringify(config)
    })

    if (error) throw new Error(`Failed to setup tenant database: ${error.message}`)
  }

  // Row Level Security (RLS)
  async enableRLS(tenantId: string): Promise<void> {
    const schemaName = await this.getTenantDatabase(tenantId)
    
    // Enable RLS on all tables in tenant schema
    const { error } = await this.supabase.rpc('enable_tenant_rls', {
      schema_name: schemaName,
      tenant_id: tenantId
    })

    if (error) throw new Error(`Failed to enable RLS: ${error.message}`)
  }

  async createRLSPolicy(tenantId: string, tableName: string, policyName: string, policyDefinition: string): Promise<void> {
    const schemaName = await this.getTenantDatabase(tenantId)
    
    const { error } = await this.supabase.rpc('create_rls_policy', {
      schema_name: schemaName,
      table_name: tableName,
      policy_name: policyName,
      policy_definition: policyDefinition
    })

    if (error) throw new Error(`Failed to create RLS policy: ${error.message}`)
  }

  // Utility methods
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) + '-' + uuidv4().substring(0, 8)
  }

  // Tenant validation and limits
  async validateTenantLimits(tenantId: string): Promise<{
    valid: boolean
    violations: string[]
  }> {
    const tenant = await this.getTenant(tenantId)
    if (!tenant) {
      return {
        valid: false,
        violations: ['Tenant not found']
      }
    }

    const violations: string[] = []

    // Check user limits
    const userCount = await this.getUserCount(tenantId)
    const maxUsers = tenant.config.features?.maxUsers || 100
    if (userCount > maxUsers) {
      violations.push(`User limit exceeded: ${userCount}/${maxUsers}`)
    }

    // Check storage limits (placeholder - would need actual storage calculation)
    const maxStorage = tenant.config.features?.maxStorage || 1024 * 1024 * 1024
    // const currentStorage = await this.getStorageUsage(tenantId)

    return {
      valid: violations.length === 0,
      violations
    }
  }

  private async getUserCount(tenantId: string): Promise<number> {
    const users = await this.getUsersByTenant(tenantId)
    return users.length
  }

  // Tenant metrics
  async getTenantMetrics(tenantId: string): Promise<{
    users: {
      total: number
      active: number
      inactive: number
    }
    storage: {
      used: number
      available: number
      percentage: number
    }
    integrations: {
      total: number
      active: number
    }
  }> {
    const tenant = await this.getTenant(tenantId)
    if (!tenant) {
      throw new Error('Tenant not found')
    }

    const users = await this.getUsersByTenant(tenantId)
    const activeUsers = users.filter(u => u.status === 'active')
    const inactiveUsers = users.filter(u => u.status === 'inactive')

    const maxStorage = tenant.config.features?.maxStorage || 1024 * 1024 * 1024
    const usedStorage = 0 // Placeholder - would calculate actual usage

    return {
      users: {
        total: users.length,
        active: activeUsers.length,
        inactive: inactiveUsers.length
      },
      storage: {
        used: usedStorage,
        available: maxStorage - usedStorage,
        percentage: (usedStorage / maxStorage) * 100
      },
      integrations: {
        total: 0, // Would query integrations
        active: 0
      }
    }
  }

  // Bulk operations
  async bulkUpdateTenantStatus(tenantIds: string[], status: TenantStatus): Promise<void> {
    const { error } = await this.supabase
      .from('tenants')
      .update({ status, updatedAt: new Date() })
      .in('id', tenantIds)

    if (error) throw new Error(`Failed to bulk update tenant status: ${error.message}`)
  }

  async archiveTenant(tenantId: string): Promise<void> {
    // Set status to archived
    await this.updateTenant(tenantId, { status: 'archived' })
    
    // Deactivate all users
    const users = await this.getUsersByTenant(tenantId)
    for (const user of users) {
      await this.updateUser(user.id, { status: 'inactive' })
    }
  }

  async restoreTenant(tenantId: string): Promise<void> {
    // Set status to active
    await this.updateTenant(tenantId, { status: 'active' })
    
    // Note: Users remain inactive and need to be reactivated manually
  }
} 