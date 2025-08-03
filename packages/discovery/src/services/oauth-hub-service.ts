import { createClient } from '@supabase/supabase-js'

export interface OAuthProvider {
  id: string
  name: string
  type: 'oauth2' | 'oauth1' | 'api_key'
  authUrl?: string
  tokenUrl?: string
  scopes: string[]
  requiredEnvVars: string[]
}

export class OAuthHubService {
  private supabase: any
  private providers = new Map<string, OAuthProvider>()

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.initializeProviders()
  }

  private initializeProviders() {
    // Define all supported OAuth providers
    const providers: OAuthProvider[] = [
      {
        id: 'google',
        name: 'Google Workspace',
        type: 'oauth2',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['email', 'profile', 'calendar', 'drive'],
        requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
      },
      {
        id: 'salesforce',
        name: 'Salesforce',
        type: 'oauth2',
        authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        scopes: ['api', 'refresh_token'],
        requiredEnvVars: ['SALESFORCE_CLIENT_ID', 'SALESFORCE_CLIENT_SECRET']
      },
      {
        id: 'shopify',
        name: 'Shopify',
        type: 'oauth2',
        authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
        tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
        scopes: ['read_products', 'read_orders', 'read_customers'],
        requiredEnvVars: ['SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET']
      },
      {
        id: 'stripe',
        name: 'Stripe',
        type: 'oauth2',
        authUrl: 'https://connect.stripe.com/oauth/authorize',
        tokenUrl: 'https://connect.stripe.com/oauth/token',
        scopes: ['read_write'],
        requiredEnvVars: ['STRIPE_CLIENT_ID', 'STRIPE_SECRET_KEY']
      },
      {
        id: 'quickbooks',
        name: 'QuickBooks',
        type: 'oauth2',
        authUrl: 'https://appcenter.intuit.com/connect/oauth2',
        tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        scopes: ['com.intuit.quickbooks.accounting'],
        requiredEnvVars: ['QUICKBOOKS_CLIENT_ID', 'QUICKBOOKS_CLIENT_SECRET']
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        type: 'oauth2',
        authUrl: 'https://app.hubspot.com/oauth/authorize',
        tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
        scopes: ['contacts', 'forms', 'tickets'],
        requiredEnvVars: ['HUBSPOT_CLIENT_ID', 'HUBSPOT_CLIENT_SECRET']
      }
    ]

    providers.forEach(p => this.providers.set(p.id, p))
  }

  async connectProvider(
    tenantId: string,
    providerId: string,
    credentials: Record<string, string>
  ) {
    const provider = this.providers.get(providerId)
    if (!provider) throw new Error(`Unknown provider: ${providerId}`)

    // Store encrypted credentials in Supabase
    const { data, error } = await this.supabase
      .from('tenant_integrations')
      .upsert({
        tenant_id: tenantId,
        provider_id: providerId,
        credentials: await this.encryptCredentials(credentials),
        status: 'connected',
        connected_at: new Date().toISOString()
      })

    if (error) throw error
    return data
  }

  async getConnectedProviders(tenantId: string) {
    const { data, error } = await this.supabase
      .from('tenant_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'connected')

    if (error) throw error
    return data
  }

  async initiateOAuthFlow(
    tenantId: string,
    providerId: string,
    redirectUri: string
  ) {
    const provider = this.providers.get(providerId)
    if (!provider || provider.type !== 'oauth2') {
      throw new Error('Invalid OAuth provider')
    }

    // Generate state token for security
    const state = await this.generateStateToken(tenantId, providerId)

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: process.env[provider.requiredEnvVars[0]]!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: provider.scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    })

    return {
      authUrl: `${provider.authUrl}?${params.toString()}`,
      state: state
    }
  }

  private async encryptCredentials(credentials: Record<string, string>) {
    // TODO: Implement proper encryption
    return JSON.stringify(credentials)
  }

  private async generateStateToken(tenantId: string, providerId: string) {
    const state = `${tenantId}:${providerId}:${Date.now()}`
    // Store state in Supabase for validation
    await this.supabase
      .from('oauth_states')
      .insert({
        state: state,
        tenant_id: tenantId,
        provider_id: providerId,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })
    return state
  }
}