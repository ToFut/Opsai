import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class TenantManager {
  /**
   * Create a new tenant record for the onboarding session
   * Uses localStorage only - no database calls during onboarding
   */
  static async createTenant(businessProfile: {
    name: string
    industry: string
    type: string
    description?: string
    websiteUrl?: string
  }): Promise<string> {
    // Generate a unique tenant ID
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Store tenant info in localStorage (no database needed for onboarding)
    const tenantData = {
      tenantId,
      businessProfile: {
        ...businessProfile,
        size: 'small', // Default
        industry: businessProfile.industry || 'general',
        type: businessProfile.type || 'b2b'
      },
      createdAt: new Date().toISOString(),
      status: 'onboarding',
      source: 'localStorage',
      usage_limits: {
        max_connections: 5,
        max_syncs_per_day: 10,
        max_storage_gb: 10,
        max_api_calls_per_month: 10000
      }
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(`tenant_${tenantId}`, JSON.stringify(tenantData))
      console.log('✅ Tenant created in localStorage:', tenantId)
    }
    
    return tenantId
  }

  /**
   * Update tenant with additional information
   */
  static async updateTenant(tenantId: string, updates: {
    businessProfile?: any
    metadata?: any
    subscriptionTier?: string
  }): Promise<void> {
    try {
      const updateData: any = {}
      
      if (updates.businessProfile) {
        updateData.business_profile = updates.businessProfile
      }
      
      if (updates.metadata) {
        updateData.metadata = updates.metadata
      }
      
      if (updates.subscriptionTier) {
        updateData.subscription_tier = updates.subscriptionTier
      }

      const { error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('tenant_id', tenantId)

      if (error) {
        console.error('Error updating tenant:', error)
      }

      // Log the update
      await supabase
        .from('audit_logs')
        .insert({
          tenant_id: tenantId,
          action: 'tenant.updated',
          resource_type: 'tenant',
          resource_id: tenantId,
          metadata: { updates }
        })
    } catch (error) {
      console.error('Failed to update tenant:', error)
    }
  }

  /**
   * Track integration connection
   */
  static async trackIntegration(
    tenantId: string, 
    provider: string, 
    status: 'pending' | 'connected' | 'failed',
    configuration?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenant_integrations')
        .upsert({
          tenant_id: tenantId,
          provider: provider,
          status: status,
          connected_at: status === 'connected' ? new Date().toISOString() : null,
          configuration: configuration || {},
          features_enabled: getProviderFeatures(provider)
        })

      if (!error) {
        // Log the integration event
        await supabase
          .from('audit_logs')
          .insert({
            tenant_id: tenantId,
            action: `integration.${status}`,
            resource_type: 'integration',
            resource_id: provider,
            metadata: { provider, status }
          })
      }
    } catch (error) {
      console.error('Failed to track integration:', error)
    }
  }

  /**
   * Track generated app
   */
  static async trackGeneratedApp(
    tenantId: string,
    appInfo: {
      name: string
      type: string
      deploymentUrl?: string
      vercelProjectId?: string
      features: string[]
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenant_apps')
        .insert({
          tenant_id: tenantId,
          app_name: appInfo.name,
          app_type: appInfo.type,
          deployment_url: appInfo.deploymentUrl,
          vercel_project_id: appInfo.vercelProjectId,
          status: 'deployed',
          features: appInfo.features,
          database_schema: `tenant_${tenantId}`,
          deployed_at: new Date().toISOString()
        })

      if (!error) {
        await supabase
          .from('audit_logs')
          .insert({
            tenant_id: tenantId,
            action: 'app.deployed',
            resource_type: 'app',
            resource_id: appInfo.name,
            metadata: appInfo
          })
      }
    } catch (error) {
      console.error('Failed to track generated app:', error)
    }
  }
}

// Helper function to determine features enabled by a provider
function getProviderFeatures(provider: string): string[] {
  const featureMap: Record<string, string[]> = {
    'stripe': ['payments', 'subscriptions', 'invoicing', 'billing'],
    'shopify': ['ecommerce', 'inventory', 'orders', 'products'],
    'salesforce': ['crm', 'sales', 'contacts', 'opportunities'],
    'hubspot': ['crm', 'marketing', 'contacts', 'email'],
    'slack': ['notifications', 'team-communication', 'alerts'],
    'google-analytics': ['analytics', 'reporting', 'insights'],
    'mailchimp': ['email-marketing', 'campaigns', 'newsletters'],
    'quickbooks': ['accounting', 'invoicing', 'expenses'],
    'github': ['code-management', 'version-control', 'collaboration'],
    'jira': ['project-management', 'issue-tracking', 'workflows'],
    'zendesk': ['customer-support', 'ticketing', 'help-desk'],
    'postgres': ['database', 'data-storage', 'queries'],
    'mysql': ['database', 'data-storage', 'queries'],
    'mongodb': ['database', 'nosql', 'documents']
  }
  
  return featureMap[provider] || ['integration']
}