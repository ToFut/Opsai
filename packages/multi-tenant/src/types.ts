export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  settings: TenantSettings
  config: TenantConfig
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  tenantId: string
  role: string
  permissions: string[]
  status: 'active' | 'inactive'
  createdAt: Date
  lastLoginAt?: Date
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  tenantId: string
  isDefault: boolean
}

export interface TenantConfig {
  database?: {
    isolation: 'schema' | 'database' | 'row_level'
    schemaPrefix?: string
  }
  features?: {
    maxUsers?: number
    maxStorage?: number
    enabledFeatures: string[]
  }
  integrations?: {
    allowedProviders: string[]
    maxConnections?: number
  }
  customization?: {
    theme?: {
      primaryColor?: string
      logo?: string
    }
    branding?: {
      companyName?: string
      domain?: string
    }
  }
}

export interface TenantSettings {
  timezone: string
  currency: string
  language: string
  dateFormat: string
  numberFormat: string
}

export type TenantStatus = 'active' | 'suspended' | 'pending' | 'archived'

export interface CreateTenantRequest {
  name: string
  slug?: string
  settings?: Partial<TenantSettings>
  config?: Partial<TenantConfig>
}

export interface UpdateTenantRequest {
  name?: string
  settings?: Partial<TenantSettings>
  config?: Partial<TenantConfig>
  status?: TenantStatus
}