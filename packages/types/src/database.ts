// Database schema types for OpsAI multi-tenant platform

export interface Tenant {
  id: string
  tenant_id: string
  name: string
  created_at: string
  updated_at: string
  status: 'active' | 'suspended' | 'deleted'
  metadata: Record<string, any>
  business_profile: BusinessProfile
  subscription_tier: 'free' | 'starter' | 'pro' | 'enterprise'
  usage_limits: UsageLimits
}

export interface BusinessProfile {
  industry: string
  size: 'small' | 'medium' | 'large' | 'enterprise'
  type: 'b2b' | 'b2c' | 'b2b2c' | 'marketplace'
  description?: string
  vertical?: string
  target_market?: string
}

export interface UsageLimits {
  max_connections: number
  max_syncs_per_day: number
  max_storage_gb?: number
  max_api_calls_per_month?: number
}

export interface TenantIntegration {
  id: string
  tenant_id: string
  provider: string
  status: 'pending' | 'connected' | 'failed' | 'disconnected'
  connected_at?: string
  last_sync_at?: string
  configuration: Record<string, any>
  features_enabled: string[]
  created_at: string
  updated_at: string
}

export interface TenantSource {
  id: string
  tenant_id: string
  airbyte_source_id: string
  source_type: string
  name: string
  status: 'pending' | 'active' | 'failed' | 'deleted'
  connection_config: Record<string, any>
  discovered_schema: AirbyteSchema
  sample_data: Record<string, any>
  last_test_at?: string
  last_test_status?: 'success' | 'failed'
  created_at: string
  updated_at: string
}

export interface AirbyteSchema {
  streams: Array<{
    name: string
    json_schema: Record<string, any>
    supported_sync_modes: string[]
    source_defined_cursor?: boolean
    default_cursor_field?: string[]
  }>
}

export interface TenantAirbyteConnection {
  id: string
  tenant_id: string
  source_id: string
  airbyte_connection_id?: string
  destination_id?: string
  status: 'pending' | 'active' | 'paused' | 'failed'
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'weekly'
  last_sync_at?: string
  next_sync_at?: string
  sync_stats: SyncStats
  created_at: string
  updated_at: string
}

export interface SyncStats {
  records_synced: number
  bytes_synced: number
  errors: number
  last_error?: string
  sync_duration_seconds?: number
}

export interface OAuthState {
  id: string
  state_token: string
  tenant_id: string
  provider: string
  redirect_uri: string
  metadata: Record<string, any>
  expires_at: string
  used: boolean
  created_at: string
}

export interface TenantApp {
  id: string
  tenant_id: string
  app_name: string
  app_type?: string
  deployment_url?: string
  vercel_project_id?: string
  github_repo?: string
  status: 'generating' | 'deployed' | 'failed' | 'updating'
  features: string[]
  database_schema?: string
  environment_vars: Record<string, string>
  created_at: string
  updated_at: string
  deployed_at?: string
}

export interface TenantWorkflow {
  id: string
  tenant_id: string
  workflow_name: string
  workflow_type?: string
  enabled: boolean
  configuration: Record<string, any>
  schedule?: string
  last_run_at?: string
  next_run_at?: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  tenant_id?: string
  action: string
  actor_id?: string
  resource_type?: string
  resource_id?: string
  metadata: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Helper types for API responses
export interface TenantWithIntegrations extends Tenant {
  integrations: TenantIntegration[]
  sources: TenantSource[]
  apps: TenantApp[]
}

export interface IntegrationWithSource extends TenantIntegration {
  source?: TenantSource
  connection?: TenantAirbyteConnection
}

// Database query helpers
export type TenantStatus = Tenant['status']
export type SubscriptionTier = Tenant['subscription_tier']
export type IntegrationStatus = TenantIntegration['status']
export type SourceStatus = TenantSource['status']
export type ConnectionStatus = TenantAirbyteConnection['status']
export type AppStatus = TenantApp['status']
export type SyncFrequency = TenantAirbyteConnection['sync_frequency']

// Audit log action types
export type AuditAction = 
  | 'tenant.created'
  | 'tenant.updated'
  | 'tenant.deleted'
  | 'integration.connected'
  | 'integration.disconnected'
  | 'integration.failed'
  | 'source.created'
  | 'source.tested'
  | 'source.deleted'
  | 'connection.created'
  | 'connection.synced'
  | 'connection.failed'
  | 'app.generated'
  | 'app.deployed'
  | 'app.failed'
  | 'workflow.created'
  | 'workflow.executed'
  | 'workflow.failed'