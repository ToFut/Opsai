/**
 * Airbyte OAuth Client using OAuth2 Client Credentials
 * Automatically generates and refreshes access tokens
 */

interface AirbyteToken {
  access_token: string
  token_type: string
  expires_in: number
  expires_at: number
}

class AirbyteOAuthClient {
  private static instance: AirbyteOAuthClient
  private token: AirbyteToken | null = null
  
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly apiUrl: string
  private readonly workspaceId: string
  
  constructor() {
    this.clientId = process.env.AIRBYTE_CLIENT_ID!
    this.clientSecret = process.env.AIRBYTE_CLIENT_SECRET!
    this.apiUrl = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
    this.workspaceId = process.env.AIRBYTE_WORKSPACE_ID!
    
    if (!this.clientId || !this.clientSecret || !this.workspaceId) {
      throw new Error('Missing Airbyte configuration. Set AIRBYTE_CLIENT_ID, AIRBYTE_CLIENT_SECRET, and AIRBYTE_WORKSPACE_ID')
    }
  }
  
  static getInstance(): AirbyteOAuthClient {
    if (!this.instance) {
      this.instance = new AirbyteOAuthClient()
    }
    return this.instance
  }
  
  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    // Check if token is valid and not expired
    if (this.token && this.token.expires_at > Date.now() + 60000) { // 1 minute buffer
      return this.token.access_token
    }
    
    console.log('🔄 Refreshing Airbyte access token via OAuth2 client credentials (ignoring static token)...')
    
    // Get new token using OAuth2 client credentials flow
    const tokenResponse = await fetch('https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'openid email profile'
      })
    })
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      throw new Error(`Failed to get Airbyte access token: ${tokenResponse.status} ${error}`)
    }
    
    const tokenData = await tokenResponse.json()
    
    this.token = {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_in: tokenData.expires_in,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    }
    
    console.log(`✅ Airbyte access token refreshed, expires in ${tokenData.expires_in} seconds`)
    return this.token.access_token
  }
  
  /**
   * Make authenticated API request to Airbyte
   */
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = await this.getAccessToken()
    
    return fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'OpsAI-Platform/1.0',
        ...options.headers
      }
    })
  }
  
  /**
   * Create OAuth consent URL for a provider
   */
  async createOAuthConsentUrl(
    sourceDefinitionId: string, 
    redirectUri: string, 
    oAuthInputConfiguration: any = {}
  ): Promise<string> {
    console.log(`🚀 Creating Airbyte OAuth consent URL for source: ${sourceDefinitionId}`)
    
    const requestBody = {
      workspaceId: this.workspaceId,
      sourceDefinitionId,
      redirectUrl: redirectUri, // Airbyte API expects 'redirectUrl' not 'redirectUri'
      oAuthInputConfiguration
    }
    
    console.log('📤 Airbyte OAuth request:', requestBody)
    
    const response = await this.apiRequest('/sources/initiateOAuth', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Airbyte OAuth consent URL failed (${response.status}):`, errorText)
      throw new Error(`Airbyte API error: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    console.log('✅ Airbyte OAuth consent URL created:', result)
    
    if (!result.consentUrl) {
      throw new Error('No consentUrl in Airbyte response')
    }
    
    return result.consentUrl
  }
  
  /**
   * Complete OAuth flow and get access token
   */
  async completeOAuth(
    sourceDefinitionId: string,
    redirectUri: string,
    queryParams: Record<string, string>,
    oAuthInputConfiguration: any = {}
  ): Promise<any> {
    console.log(`🔄 Completing Airbyte OAuth for source: ${sourceDefinitionId}`)
    
    const requestBody = {
      workspaceId: this.workspaceId,
      sourceDefinitionId,
      redirectUrl: redirectUri, // Airbyte API expects 'redirectUrl' not 'redirectUri'
      queryParams,
      oAuthInputConfiguration
    }
    
    console.log('📤 Airbyte OAuth completion request:', requestBody)
    
    const response = await this.apiRequest('/sources/completeOAuth', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Airbyte OAuth completion failed (${response.status}):`, errorText)
      throw new Error(`Airbyte OAuth completion failed: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    console.log('✅ Airbyte OAuth completed:', result)
    
    return result
  }
  
  /**
   * Create a source with OAuth credentials
   */
  async createSource(name: string, sourceDefinitionId: string, configuration: any): Promise<any> {
    console.log(`🔧 Creating Airbyte source: ${name}`)
    
    const requestBody = {
      workspaceId: this.workspaceId,
      name,
      sourceDefinitionId,
      configuration
    }
    
    const response = await this.apiRequest('/sources', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Airbyte source creation failed (${response.status}):`, errorText)
      throw new Error(`Failed to create Airbyte source: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    console.log('✅ Airbyte source created:', result)
    
    return result
  }
  
  /**
   * List available source definitions
   */
  async getSourceDefinitions(): Promise<any[]> {
    const response = await this.apiRequest('/source_definitions')
    
    if (!response.ok) {
      throw new Error(`Failed to get source definitions: ${response.status}`)
    }
    
    const result = await response.json()
    return result.sourceDefinitions || []
  }
}

// Export singleton instance
export const airbyteClient = AirbyteOAuthClient.getInstance()

// Provider to source definition mapping (verified Airbyte Cloud IDs)
export const AIRBYTE_SOURCE_DEFINITIONS: Record<string, string> = {
  'github': 'ef69ef6e-aa7f-4af1-a01d-ef775033524e', // GitHub
  'google': '3cc2ebd2-a319-477e-8dd5-4a2db3ac6e4c', // Google Analytics Data API
  'google-analytics': '3cc2ebd2-a319-477e-8dd5-4a2db3ac6e4c', // Same as Google
  'shopify': '9da77001-af33-4bcd-be46-6252bf9342b9', // Shopify
  'stripe': 'e094cb9a-26de-4645-8761-65c0c425d1de', // Stripe
  'salesforce': 'b117307c-14b6-41aa-9422-947e34922643', // Salesforce
  'hubspot': '36c891d9-4bd9-43ac-bad2-10e12756272c', // HubSpot
  'slack': '445831eb-78db-4b54-8c5c-3d4b4b2e5c6d', // Slack
  'mailchimp': 'b03a9f3e-22a5-11eb-adc1-0242ac120002', // Mailchimp
  'calendly': 'not-supported-by-airbyte' // Calendly will use direct OAuth
}

// OAuth input configurations for each provider
export function getProviderOAuthConfig(provider: string): Record<string, any> {
  const now = new Date()
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  const isoStartDate = startDate.toISOString().split('T')[0]
  
  const configs: Record<string, Record<string, any>> = {
    'github': {
      repositories: [], // Will be populated after OAuth
      start_date: `${isoStartDate}T00:00:00Z`
    },
    'google': {
      property_ids: [], // Will be populated after OAuth
      start_date: isoStartDate,
      custom_reports_array: []
    },
    'google-analytics': {
      property_ids: [],
      start_date: isoStartDate,
      custom_reports_array: []
    },
    'shopify': {
      start_date: isoStartDate,
      shop: '' // Will be provided during setup
    },
    'stripe': {
      start_date: isoStartDate,
      lookback_window_days: 7,
      slice_range: 365
    },
    'salesforce': {
      start_date: `${isoStartDate}T00:00:00Z`,
      is_sandbox: false,
      streams_criteria: []
    },
    'hubspot': {
      start_date: `${isoStartDate}T00:00:00Z`,
      credentials: {
        credentials_title: 'OAuth Credentials'
      }
    },
    'slack': {
      start_date: `${isoStartDate}T00:00:00Z`,
      lookback_window: 7,
      join_channels: true
    },
    'mailchimp': {
      start_date: `${isoStartDate}T00:00:00Z`
    }
  }
  
  return configs[provider.toLowerCase()] || {
    start_date: isoStartDate
  }
}