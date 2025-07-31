import { YAMLConfig } from '@opsai/yaml-validator'

export interface Integration {
  id: string
  name: string
  type: 'api' | 'oauth' | 'webhook' | 'database'
  provider: string
  config: Record<string, any>
  enabled: boolean
  sync: boolean
  webhooks: string[]
  tenantId: string
  lastSyncAt?: Date
  status: 'active' | 'error' | 'disconnected'
  errorMessage?: string
}

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  authorizationUrl: string
  tokenUrl: string
}

export interface APIConfig {
  baseUrl: string
  apiKey?: string
  headers: Record<string, string>
  rateLimit: {
    requests: number
    window: number
  }
}

export interface WebhookConfig {
  url: string
  events: string[]
  secret?: string
  headers: Record<string, string>
}

export interface SyncJob {
  id: string
  integrationId: string
  type: 'full' | 'incremental'
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  recordsProcessed: number
  errorMessage?: string
}

export class IntegrationManager {
  private integrations: Map<string, Integration> = new Map()
  private oauthTokens: Map<string, any> = new Map()
  private syncQueue: SyncJob[] = []

  // Integration Management
  async createIntegration(integrationData: Omit<Integration, 'id'>): Promise<Integration> {
    const id = this.generateId()
    const integration: Integration = {
      id,
      ...integrationData,
      status: 'disconnected'
    }

    this.integrations.set(id, integration)
    
    // Initialize integration based on type
    await this.initializeIntegration(integration)
    
    return integration
  }

  async getIntegration(integrationId: string): Promise<Integration | null> {
    return this.integrations.get(integrationId) || null
  }

  async updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<Integration> {
    const integration = this.integrations.get(integrationId)
    if (!integration) throw new Error('Integration not found')

    const updatedIntegration = { ...integration, ...updates }
    this.integrations.set(integrationId, updatedIntegration)
    
    return updatedIntegration
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId)
    if (!integration) throw new Error('Integration not found')

    // Cleanup integration
    await this.cleanupIntegration(integration)
    
    this.integrations.delete(integrationId)
  }

  // OAuth Management
  async initiateOAuth(integrationId: string): Promise<string> {
    const integration = this.integrations.get(integrationId)
    if (!integration) throw new Error('Integration not found')
    if (integration.type !== 'oauth') throw new Error('Integration is not OAuth type')

    const oauthConfig = integration.config as OAuthConfig
    const state = this.generateId()
    
    // Store state for verification
    this.oauthTokens.set(state, { integrationId, timestamp: Date.now() })
    
    const authUrl = new URL(oauthConfig.authorizationUrl)
    authUrl.searchParams.set('client_id', oauthConfig.clientId)
    authUrl.searchParams.set('redirect_uri', oauthConfig.redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', oauthConfig.scopes.join(' '))
    authUrl.searchParams.set('state', state)
    
    return authUrl.toString()
  }

  async handleOAuthCallback(code: string, state: string): Promise<void> {
    const stateData = this.oauthTokens.get(state)
    if (!stateData) throw new Error('Invalid OAuth state')
    
    const integration = this.integrations.get(stateData.integrationId)
    if (!integration) throw new Error('Integration not found')

    const oauthConfig = integration.config as OAuthConfig
    
    // Exchange code for access token
    const tokenResponse = await fetch(oauthConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
        code,
        redirect_uri: oauthConfig.redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange OAuth code for token')
    }

    const tokenData = await tokenResponse.json()
    
    // Store token securely
    await this.storeOAuthToken(integration.id, tokenData)
    
    // Update integration status
    await this.updateIntegration(integration.id, { status: 'active' })
    
    // Cleanup state
    this.oauthTokens.delete(state)
  }

  private async storeOAuthToken(integrationId: string, tokenData: any): Promise<void> {
    // In production, encrypt and store in secure database
    this.oauthTokens.set(integrationId, {
      ...tokenData,
      expiresAt: Date.now() + (tokenData.expires_in * 1000)
    })
  }

  // API Integration
  async makeAPICall(integrationId: string, endpoint: string, options: RequestInit = {}): Promise<any> {
    const integration = this.integrations.get(integrationId)
    if (!integration) throw new Error('Integration not found')
    if (integration.type !== 'api') throw new Error('Integration is not API type')

    const apiConfig = integration.config as APIConfig
    
    // Add API key if present
    if (apiConfig.apiKey) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${apiConfig.apiKey}`
      }
    }

    // Add custom headers
    options.headers = {
      ...apiConfig.headers,
      ...options.headers
    }

    const url = `${apiConfig.baseUrl}${endpoint}`
    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Webhook Management
  async registerWebhook(integrationId: string, webhookConfig: WebhookConfig): Promise<void> {
    const integration = this.integrations.get(integrationId)
    if (!integration) throw new Error('Integration not found')

    // Register webhook with provider
    const webhookUrl = webhookConfig.url
    const events = webhookConfig.events
    
    // This would typically call the provider's webhook registration API
    console.log(`Registering webhook: ${webhookUrl} for events: ${events.join(', ')}`)
    
    // Update integration with webhook info
    await this.updateIntegration(integrationId, {
      webhooks: [...integration.webhooks, webhookUrl]
    })
  }

  async handleWebhook(integrationId: string, event: string, payload: any): Promise<void> {
    const integration = this.integrations.get(integrationId)
    if (!integration) throw new Error('Integration not found')

    // Process webhook based on event type
    switch (event) {
      case 'data.updated':
        await this.handleDataUpdate(integration, payload)
        break
      case 'data.created':
        await this.handleDataCreate(integration, payload)
        break
      case 'data.deleted':
        await this.handleDataDelete(integration, payload)
        break
      default:
        console.log(`Unhandled webhook event: ${event}`)
    }
  }

  // Data Synchronization
  async startSync(integrationId: string, type: 'full' | 'incremental' = 'incremental'): Promise<string> {
    const integration = this.integrations.get(integrationId)
    if (!integration) throw new Error('Integration not found')
    if (!integration.sync) throw new Error('Integration sync is disabled')

    const syncJob: SyncJob = {
      id: this.generateId(),
      integrationId,
      type,
      status: 'pending',
      startedAt: new Date(),
      recordsProcessed: 0
    }

    this.syncQueue.push(syncJob)
    
    // Start sync process
    this.processSyncJob(syncJob)
    
    return syncJob.id
  }

  async getSyncStatus(syncJobId: string): Promise<SyncJob | null> {
    return this.syncQueue.find(job => job.id === syncJobId) || null
  }

  private async processSyncJob(syncJob: SyncJob): Promise<void> {
    const integration = this.integrations.get(syncJob.integrationId)
    if (!integration) return

    try {
      syncJob.status = 'running'
      
      // Update integration status
      await this.updateIntegration(integration.id, { status: 'active' })
      
      // Perform sync based on provider
      switch (integration.provider) {
        case 'shopify':
          await this.syncShopify(integration, syncJob)
          break
        case 'quickbooks':
          await this.syncQuickBooks(integration, syncJob)
          break
        case 'salesforce':
          await this.syncSalesforce(integration, syncJob)
          break
        default:
          await this.syncGeneric(integration, syncJob)
      }
      
      syncJob.status = 'completed'
      syncJob.completedAt = new Date()
      
    } catch (error) {
      syncJob.status = 'failed'
      syncJob.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      syncJob.completedAt = new Date()
      
      // Update integration status
      await this.updateIntegration(integration.id, { 
        status: 'error',
        errorMessage: syncJob.errorMessage
      })
    }
  }

  // Provider-specific sync implementations
  private async syncShopify(integration: Integration, syncJob: SyncJob): Promise<void> {
    // Implement Shopify-specific sync logic
    console.log('Syncing Shopify data...')
    
    // Example: Sync products, orders, customers
    const products = await this.makeAPICall(integration.id, '/admin/api/2023-01/products.json')
    const orders = await this.makeAPICall(integration.id, '/admin/api/2023-01/orders.json')
    const customers = await this.makeAPICall(integration.id, '/admin/api/2023-01/customers.json')
    
    syncJob.recordsProcessed = products.products.length + orders.orders.length + customers.customers.length
  }

  private async syncQuickBooks(integration: Integration, syncJob: SyncJob): Promise<void> {
    // Implement QuickBooks-specific sync logic
    console.log('Syncing QuickBooks data...')
    
    // Example: Sync invoices, customers, items
    const invoices = await this.makeAPICall(integration.id, '/v3/company/reports/Invoice')
    const customers = await this.makeAPICall(integration.id, '/v3/company/query?query=SELECT * FROM Customer')
    const items = await this.makeAPICall(integration.id, '/v3/company/query?query=SELECT * FROM Item')
    
    syncJob.recordsProcessed = invoices.length + customers.length + items.length
  }

  private async syncSalesforce(integration: Integration, syncJob: SyncJob): Promise<void> {
    // Implement Salesforce-specific sync logic
    console.log('Syncing Salesforce data...')
    
    // Example: Sync accounts, contacts, opportunities
    const accounts = await this.makeAPICall(integration.id, '/services/data/v58.0/query?q=SELECT+Id,Name+FROM+Account')
    const contacts = await this.makeAPICall(integration.id, '/services/data/v58.0/query?q=SELECT+Id,Name+FROM+Contact')
    const opportunities = await this.makeAPICall(integration.id, '/services/data/v58.0/query?q=SELECT+Id,Name+FROM+Opportunity')
    
    syncJob.recordsProcessed = accounts.records.length + contacts.records.length + opportunities.records.length
  }

  private async syncGeneric(integration: Integration, syncJob: SyncJob): Promise<void> {
    // Generic sync implementation
    console.log('Syncing generic data...')
    
    // This would be customized based on the integration configuration
    syncJob.recordsProcessed = 0
  }

  // Webhook event handlers
  private async handleDataUpdate(integration: Integration, payload: any): Promise<void> {
    console.log(`Handling data update for ${integration.provider}:`, payload)
    // Implement data update logic
  }

  private async handleDataCreate(integration: Integration, payload: any): Promise<void> {
    console.log(`Handling data create for ${integration.provider}:`, payload)
    // Implement data create logic
  }

  private async handleDataDelete(integration: Integration, payload: any): Promise<void> {
    console.log(`Handling data delete for ${integration.provider}:`, payload)
    // Implement data delete logic
  }

  // Utility methods
  private async initializeIntegration(integration: Integration): Promise<void> {
    switch (integration.type) {
      case 'oauth':
        // Initialize OAuth flow
        break
      case 'api':
        // Test API connection
        break
      case 'webhook':
        // Setup webhook endpoints
        break
      case 'database':
        // Test database connection
        break
    }
  }

  private async cleanupIntegration(integration: Integration): Promise<void> {
    // Cleanup integration resources
    if (integration.type === 'oauth') {
      this.oauthTokens.delete(integration.id)
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
} 