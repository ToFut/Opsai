import { supabase } from './supabase'

export interface Tenant {
  id: string
  name: string
  industry: string
  type: string
  description?: string
  created_at: string
  updated_at: string
}

export interface CreateTenantData {
  name: string
  industry?: string
  type?: string
  description?: string
}

export class TenantManager {
  static async createTenant(data: CreateTenantData): Promise<string> {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        tenant_id: `tenant_${Date.now()}`,
        name: data.name,
        business_profile: {
          industry: data.industry || 'general',
          type: data.type || 'b2b',
          description: data.description
        }
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create tenant: ${error.message}`)
    }

    return tenant.id
  }

  static async getTenant(tenantId: string): Promise<Tenant | null> {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch tenant: ${error.message}`)
    }

    return tenant
  }

  static async updateTenant(tenantId: string, updates: Partial<CreateTenantData>): Promise<Tenant> {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        name: updates.name,
        business_profile: {
          industry: updates.industry,
          type: updates.type,
          description: updates.description
        }
      })
      .eq('id', tenantId)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update tenant: ${error.message}`)
    }

    return tenant
  }

  static async deleteTenant(tenantId: string): Promise<void> {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId)

    if (error) {
      throw new Error(`Failed to delete tenant: ${error.message}`)
    }
  }

  static async listTenants(): Promise<Tenant[]> {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to list tenants: ${error.message}`)
    }

    return tenants || []
  }
}

// Export a default instance for convenience
export const tenantManager = new TenantManager() 