// Airbyte API v2 - Correct Implementation Based on Official Docs
// Reference: https://reference.airbyte.com/reference/

import { tokenManager } from './airbyte-token-manager'

interface InitiateOAuthRequest {
  redirectUrl: string
  sourceType: string
  workspaceId: string
  oAuthInputConfiguration?: Record<string, any>
}

interface InitiateOAuthResponse {
  consentUrl: string
}

interface CreateSourceRequest {
  configuration: Record<string, any>
  name: string
  workspaceId: string
  sourceType?: string
  secretId?: string
}

interface SourceResponse {
  sourceId: string
  name: string
  workspaceId: string
  configuration: Record<string, any>
  sourceType: string
}

export class AirbyteAPIv2 {
  private baseUrl: string
  private workspaceId: string

  constructor() {
    this.baseUrl = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
    this.workspaceId = process.env.AIRBYTE_WORKSPACE_ID || ''
  }

  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<T> {
    const token = await tokenManager.getValidToken()
    
    const url = `${this.baseUrl}${endpoint}`
    console.log(`🌐 Airbyte API: ${method} ${url}`)
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Airbyte-Integration/1.0'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const responseText = await response.text()
    console.log(`📡 Response ${response.status}:`, responseText.substring(0, 500))

    if (!response.ok) {
      let errorMessage = `API Error ${response.status}`
      let errorDetails = null
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.detail || errorData.message || errorMessage
        errorDetails = errorData
      } catch {
        errorMessage = responseText
      }
      
      console.error('❌ Airbyte API Error:', {
        status: response.status,
        endpoint: endpoint,
        message: errorMessage,
        details: errorDetails,
        body: body
      })
      
      throw new Error(errorMessage)
    }

    return responseText ? JSON.parse(responseText) : {} as T
  }

  // Step 1: Initiate OAuth Flow
  async initiateOAuth(params: InitiateOAuthRequest): Promise<InitiateOAuthResponse> {
    console.log('🔐 Initiating OAuth for:', params.sourceType)
    
    // Try different endpoint formats based on Airbyte docs
    const endpoints = [
      '/oauth/sources/oauth_consent_url',
      '/source_oauths/get_consent_url',
      '/sources/initiateOAuth'
    ]
    
    let lastError = null
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`)
        return await this.request<InitiateOAuthResponse>(
          endpoint,
          'POST',
          {
            sourceType: params.sourceType,
            workspaceId: params.workspaceId,
            redirectUrl: params.redirectUrl,
            oAuthInputConfiguration: params.oAuthInputConfiguration || {},
            // Also try with sourceDefinitionId
            sourceDefinitionId: this.getSourceDefinitionId(params.sourceType)
          }
        )
      } catch (error) {
        lastError = error
        console.log(`❌ Failed with ${endpoint}:`, error)
      }
    }
    
    throw lastError || new Error('All OAuth endpoints failed')
  }

  // Step 2: Create Source (with or without OAuth)
  async createSource(params: CreateSourceRequest): Promise<SourceResponse> {
    console.log('➕ Creating source:', params.name)
    
    const body: any = {
      name: params.name,
      workspaceId: params.workspaceId,
      configuration: params.configuration
    }

    // Add sourceType if provided
    if (params.sourceType) {
      body.sourceType = params.sourceType
    }

    // Add secretId if this is from OAuth flow
    if (params.secretId) {
      body.secretId = params.secretId
    }

    return this.request<SourceResponse>('/sources', 'POST', body)
  }

  // Helper: Create OAuth source (complete flow)
  async createOAuthSource(
    sourceType: string,
    name: string,
    redirectUrl: string,
    additionalConfig?: Record<string, any>
  ) {
    // Step 1: Initiate OAuth
    const oauthResponse = await this.initiateOAuth({
      sourceType,
      workspaceId: this.workspaceId,
      redirectUrl,
      oAuthInputConfiguration: this.getOAuthConfig(sourceType)
    })

    // Return consent URL for user to complete OAuth
    return {
      consentUrl: oauthResponse.consentUrl,
      instructions: 'Redirect user to consentUrl to complete OAuth'
    }
  }

  // Helper: Complete OAuth source creation after redirect
  async completeOAuthSource(
    sourceType: string,
    name: string,
    secretId: string,
    additionalConfig?: Record<string, any>
  ) {
    const configuration = {
      ...this.getDefaultConfig(sourceType),
      ...additionalConfig
    }

    return this.createSource({
      name,
      workspaceId: this.workspaceId,
      sourceType,
      secretId,
      configuration
    })
  }

  // Helper: Create non-OAuth source
  async createDirectSource(
    sourceType: string,
    name: string,
    configuration: Record<string, any>
  ) {
    const fullConfig = {
      ...this.getDefaultConfig(sourceType),
      ...configuration
    }

    return this.createSource({
      name,
      workspaceId: this.workspaceId,
      sourceType,
      configuration: fullConfig
    })
  }

  // Get OAuth configuration for different sources
  private getOAuthConfig(sourceType: string): Record<string, any> {
    switch (sourceType) {
      case 'github':
        return {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET
        }
      case 'google-sheets':
        return {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET
        }
      default:
        return {}
    }
  }

  // Get default configuration for sources
  private getDefaultConfig(sourceType: string): Record<string, any> {
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    
    switch (sourceType) {
      case 'postgres':
        return {
          host: 'localhost',
          port: 5432,
          database: 'postgres',
          schemas: ['public'],
          username: 'postgres',
          password: '',
          ssl_mode: { mode: 'prefer' },
          replication_method: { method: 'Standard' },
          tunnel_method: { tunnel_method: 'NO_TUNNEL' }
        }
      
      case 'github':
        return {
          start_date: oneYearAgo.toISOString().split('T')[0],
          repository: '',
          page_size_for_large_streams: 100,
          credentials: {
            option_title: 'OAuth Credentials'
          }
        }
      
      case 'shopify':
        return {
          shop: '',
          start_date: oneYearAgo.toISOString().split('T')[0],
          credentials: {
            auth_method: 'oauth2.0'
          }
        }
      
      default:
        return {
          start_date: oneYearAgo.toISOString().split('T')[0]
        }
    }
  }

  // List all sources in workspace
  async listSources() {
    return this.request<{ sources: SourceResponse[] }>(
      `/sources?workspaceId=${this.workspaceId}`
    )
  }

  // Get source by ID
  async getSource(sourceId: string) {
    return this.request<SourceResponse>(`/sources/${sourceId}`)
  }

  // Update source
  async updateSource(sourceId: string, configuration: Record<string, any>) {
    return this.request<SourceResponse>(
      `/sources/${sourceId}`,
      'PATCH',
      { configuration }
    )
  }

  // Delete source
  async deleteSource(sourceId: string) {
    return this.request(`/sources/${sourceId}`, 'DELETE')
  }

  // Helper to get source definition ID
  private getSourceDefinitionId(sourceType: string): string {
    const sourceDefinitions: Record<string, string> = {
      'postgres': 'decd338e-5647-4c0b-adf4-da0e75f5a750',
      'mysql': '435bb9a5-7887-4809-aa58-28c27df0d7ad',
      'github': 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
      'shopify': '9da77001-af33-4bcd-be46-6252bf9342b9',
      'stripe': 'e094cb9a-26de-4645-8761-65c0c425d1de',
      'google-sheets': '71607ba1-c0ac-4799-8049-7f4b90dd50f7',
      'google-analytics': 'eff3616a-f9c3-11eb-9a03-0242ac130003'
    }
    return sourceDefinitions[sourceType] || ''
  }
}

// Export singleton instance
export const airbyteAPI = new AirbyteAPIv2()