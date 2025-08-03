// Real Airbyte OAuth Flow Implementation
class AirbyteOAuthManager {
  constructor(apiKey, workspaceId) {
    this.apiKey = apiKey
    this.workspaceId = workspaceId
    this.baseUrl = 'https://api.airbyte.com/v1'
  }

  // Step 1: Create OAuth consent URL via Airbyte
  async createConsentUrl(provider, redirectUri) {
    const sourceDefinitionIds = {
      'google-analytics': 'aea0b0b0-98da-4aa5-bf19-0c401b9f1a65',
      'shopify': '9da77001-af33-4bcd-be46-6252bf9342b9',
      'stripe': 'e094cb9a-26de-4645-8761-65c0c425d1de'
    }

    const response = await fetch(`${this.baseUrl}/sources/oAuth/consent_url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workspaceId: this.workspaceId,
        sourceDefinitionId: sourceDefinitionIds[provider],
        redirectUri: redirectUri,
        oAuthInputConfiguration: this.getProviderConfig(provider)
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`Airbyte OAuth consent URL failed: ${result.message}`)
    }

    return result.consentUrl // This is the Google OAuth URL
  }

  // Step 2: Complete OAuth after user authorization
  async completeOAuth(provider, authorizationCode, redirectUri) {
    const sourceDefinitionIds = {
      'google-analytics': 'aea0b0b0-98da-4aa5-bf19-0c401b9f1a65',
      'shopify': '9da77001-af33-4bcd-be46-6252bf9342b9',
      'stripe': 'e094cb9a-26de-4645-8761-65c0c425d1de'
    }

    const response = await fetch(`${this.baseUrl}/sources/oAuth/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workspaceId: this.workspaceId,
        sourceDefinitionId: sourceDefinitionIds[provider],
        authorizationCode: authorizationCode,
        redirectUri: redirectUri,
        oAuthInputConfiguration: this.getProviderConfig(provider)
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`Airbyte OAuth completion failed: ${result.message}`)
    }

    return result // Contains connection info
  }

  // Step 3: Create actual source connection
  async createSource(provider, connectionName, oauthResult) {
    const response = await fetch(`${this.baseUrl}/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workspaceId: this.workspaceId,
        name: connectionName,
        sourceDefinitionId: oauthResult.sourceDefinitionId,
        connectionConfiguration: {
          ...this.getProviderConfig(provider),
          ...oauthResult.connectionConfiguration // OAuth tokens stored here
        }
      })
    })

    const source = await response.json()
    return source
  }

  // Step 4: Set up sync to destination
  async createConnection(sourceId, destinationId) {
    const response = await fetch(`${this.baseUrl}/connections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceId: sourceId,
        destinationId: destinationId,
        status: 'active',
        syncCatalog: await this.discoverSchema(sourceId)
      })
    })

    return response.json()
  }

  // Helper: Get provider-specific configuration
  getProviderConfig(provider) {
    const configs = {
      'google-analytics': {
        start_date: '2023-01-01',
        view_id: '', // User will configure this
        custom_reports: '[]'
      },
      'shopify': {
        shop: '', // User's shop name
        start_date: '2023-01-01'
      },
      'stripe': {
        account_id: '',
        start_date: '2023-01-01',
        lookback_window_days: 7
      }
    }
    return configs[provider] || {}
  }

  // Helper: Discover data schema
  async discoverSchema(sourceId) {
    const response = await fetch(`${this.baseUrl}/sources/${sourceId}/discover_schema`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    })
    return response.json()
  }
}

// Usage Example:
async function handleGoogleAnalyticsConnection() {
  const airbyte = new AirbyteOAuthManager(
    process.env.AIRBYTE_API_KEY,
    process.env.AIRBYTE_WORKSPACE_ID
  )

  try {
    // Step 1: Get OAuth URL from Airbyte
    console.log('🔗 Creating OAuth consent URL...')
    const consentUrl = await airbyte.createConsentUrl(
      'google-analytics', 
      'http://localhost:7250/oauth-success'
    )
    
    console.log('🌐 Redirecting user to:', consentUrl)
    // User gets redirected to Google OAuth
    
    // Step 2: After user authorizes, your callback receives the code
    // This happens in your /oauth-success page
    const authCode = 'received_from_google_callback'
    
    console.log('✅ Completing OAuth with Airbyte...')
    const oauthResult = await airbyte.completeOAuth(
      'google-analytics',
      authCode,
      'http://localhost:7250/oauth-success'
    )
    
    // Step 3: Create the source connection
    console.log('📊 Creating source connection...')
    const source = await airbyte.createSource(
      'google-analytics',
      'User GA Account',
      oauthResult
    )
    
    console.log('🎉 Connection created:', source.sourceId)
    
    // Step 4: Airbyte will now sync data automatically
    // You can read the data from your destination (database, warehouse, etc.)
    
  } catch (error) {
    console.error('❌ OAuth flow failed:', error.message)
  }
}

module.exports = { AirbyteOAuthManager };