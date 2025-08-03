import { NextRequest, NextResponse } from 'next/server'

// Use Airbyte's OAuth system instead of custom implementations
const AIRBYTE_API_URL = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
const AIRBYTE_API_KEY = process.env.AIRBYTE_API_KEY
const AIRBYTE_WORKSPACE_ID = process.env.AIRBYTE_WORKSPACE_ID
const AIRBYTE_CLIENT_ID = process.env.AIRBYTE_CLIENT_ID
const AIRBYTE_CLIENT_SECRET = process.env.AIRBYTE_CLIENT_SECRET

// Provider-specific OAuth URLs (fallback for direct provider OAuth)
const PROVIDER_OAUTH_URLS: Record<string, (redirectUri: string, state: string) => string> = {
  shopify: (redirectUri, state) => 
    `https://accounts.shopify.com/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=read_products,read_orders,read_customers&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code`,
  stripe: (redirectUri, state) =>
    `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.STRIPE_CLIENT_ID}&scope=read_only&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,
  google: (redirectUri, state) =>
    `https://accounts.google.com/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/analytics.readonly&response_type=code&state=${state}`,
  salesforce: (redirectUri, state) =>
    `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${process.env.SALESFORCE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,
  hubspot: (redirectUri, state) =>
    `https://app.hubspot.com/oauth/authorize?client_id=${process.env.HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=contacts&state=${state}`,
  slack: (redirectUri, state) =>
    `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=team:read,channels:read&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,
  mailchimp: (redirectUri, state) =>
    `https://login.mailchimp.com/oauth2/authorize?response_type=code&client_id=${process.env.MAILCHIMP_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,
  quickbooks: (redirectUri, state) =>
    `https://appcenter.intuit.com/connect/oauth2?client_id=${process.env.QUICKBOOKS_CLIENT_ID}&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&access_type=offline&state=${state}`,
  github: (redirectUri, state) =>
    `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user,read:org&state=${state}`
}

export async function POST(request: NextRequest) {
  try {
    const { provider, tenantId, redirectUri } = await request.json()

    if (!provider || !tenantId || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log(`🔗 Creating OAuth URL for ${provider}, tenant: ${tenantId}`)
    
    // MOCK MODE for testing - Remove this in production
    if (process.env.ENABLE_MOCK_OAUTH === 'true') {
      console.log('🎭 Mock OAuth mode enabled')
      const mockOAuthUrl = `${redirectUri}?code=mock_${provider}_${Date.now()}&state=${Buffer.from(JSON.stringify({ provider, tenantId })).toString('base64')}`
      return NextResponse.json({ 
        oauthUrl: mockOAuthUrl, 
        source: 'mock',
        warning: 'This is a mock OAuth flow for testing only'
      })
    }

    // Create state parameter for security
    const state = Buffer.from(JSON.stringify({
      tenantId,
      provider,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7)
    })).toString('base64')

    // First try Airbyte API if configured
    if (AIRBYTE_API_KEY && AIRBYTE_WORKSPACE_ID) {
      try {
        console.log('🚀 Attempting Airbyte OAuth URL creation...')
        console.log(`🔑 AIRBYTE_API_KEY: ${AIRBYTE_API_KEY ? `${AIRBYTE_API_KEY.substring(0, 20)}...` : 'NOT SET'}`)
        console.log(`🏢 AIRBYTE_WORKSPACE_ID: ${AIRBYTE_WORKSPACE_ID}`)
        console.log(`🌐 AIRBYTE_API_URL: ${AIRBYTE_API_URL}`)
        
        const airbyteOAuthUrl = await createAirbyteOAuthUrl(provider, tenantId, redirectUri, state)
        if (airbyteOAuthUrl) {
          console.log('✅ Airbyte OAuth URL created successfully')
          return NextResponse.json({ oauthUrl: airbyteOAuthUrl, source: 'airbyte' })
        }
      } catch (airbyteError) {
        console.log('⚠️ Airbyte OAuth failed, trying fallback:', airbyteError)
      }
    } else {
      console.log('❌ Airbyte not configured:')
      console.log(`   AIRBYTE_API_KEY: ${AIRBYTE_API_KEY ? 'SET' : 'NOT SET'}`)
      console.log(`   AIRBYTE_WORKSPACE_ID: ${AIRBYTE_WORKSPACE_ID ? 'SET' : 'NOT SET'}`)
    }


    // Check if we have OAuth client credentials for direct provider OAuth
    const hasClientCredentials = checkProviderCredentials(provider)
    
    if (hasClientCredentials) {
      // Use direct provider OAuth URLs
      const providerOAuthUrl = PROVIDER_OAUTH_URLS[provider.toLowerCase()]
      if (providerOAuthUrl) {
        const oauthUrl = providerOAuthUrl(redirectUri, state)
        console.log(`✅ Direct ${provider} OAuth URL created`)
        return NextResponse.json({ oauthUrl, source: 'direct' })
      }
    } else {
      console.log(`⚠️ No OAuth credentials configured for ${provider}`)
    }

    // No demo mode - only real integrations
    console.log(`❌ No OAuth credentials available for ${provider}`)
    console.log('⚠️ Please configure AIRBYTE_API_KEY and AIRBYTE_WORKSPACE_ID for real integrations')
    console.log('⚠️ Or configure provider OAuth credentials (GOOGLE_CLIENT_ID, SHOPIFY_CLIENT_ID, etc.)')
    
    // Provider-specific setup instructions
    const getSetupInstructions = (provider: string): string[] => {
      const baseInstructions = [
        'Set AIRBYTE_API_KEY in environment variables',
        'Set AIRBYTE_WORKSPACE_ID in environment variables'
      ]
      
      const providerInstructions: Record<string, string[]> = {
        'google-analytics': [
          ...baseInstructions,
          'Or set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for Google OAuth',
          'Enable Google Analytics Reporting API in Google Cloud Console',
          'Configure OAuth consent screen with analytics.readonly scope'
        ],
        'shopify': [
          ...baseInstructions,
          'Or set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET for Shopify OAuth',
          'Create a Shopify Partner account and app'
        ],
        'stripe': [
          ...baseInstructions,
          'Or set STRIPE_CLIENT_ID and STRIPE_CLIENT_SECRET for Stripe Connect',
          'Enable Stripe Connect in your Stripe dashboard'
        ]
      }
      
      return providerInstructions[provider.toLowerCase()] || [
        ...baseInstructions,
        `Or set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET for direct OAuth`
      ]
    }
    
    return NextResponse.json(
      { 
        error: `OAuth not configured for ${provider}. ${provider === 'google-analytics' ? 'Google Analytics requires OAuth setup in Google Cloud Console.' : 'Please configure OAuth credentials.'}`,
        provider,
        requiresSetup: true,
        setupInstructions: getSetupInstructions(provider)
      },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Error creating OAuth URL:', error)
    return NextResponse.json(
      { error: 'Failed to create OAuth URL' },
      { status: 500 }
    )
  }
}

// Try to create OAuth URL using Airbyte
async function createAirbyteOAuthUrl(provider: string, tenantId: string, redirectUri: string, state: string): Promise<string | null> {
  try {
    console.log(`🚀 Attempting Airbyte OAuth for ${provider}`)
    
    // Real Airbyte Cloud source definition IDs (verified from Airbyte docs)
    const AIRBYTE_SOURCE_DEFINITIONS: Record<string, string> = {
      'google-analytics': '3cc2ebd2-a319-477e-8dd5-4a2db3ac6e4c', // Google Analytics 4 
      'google_analytics': '3cc2ebd2-a319-477e-8dd5-4a2db3ac6e4c',
      'shopify': '9da77001-af33-4bcd-be46-6252bf9342b9',
      'stripe': 'e094cb9a-26de-4645-8761-65c0c425d1de',
      'salesforce': 'b117307c-14b6-41aa-9422-947e34922643',
      'hubspot': '36c891d9-4bd9-43ac-bad2-10e12756272c',
      'facebook-marketing': '9da77001-af33-4bcd-be46-6252bf9342b9',
      'google-ads': 'a0bb7e1d-ca9a-4e37-9c9f-9c6f0dc5f8c3',
      'slack': '445831eb-78db-4b54-8c5c-3d4b4b2e5c6d',
      'mailchimp': 'b03a9f3e-22a5-11eb-adc1-0242ac120002'
    }

    const sourceDefinitionId = AIRBYTE_SOURCE_DEFINITIONS[provider.toLowerCase().replace('_', '-')]
    if (!sourceDefinitionId) {
      console.log(`⚠️ No Airbyte source definition found for ${provider}`)
      throw new Error(`Unsupported provider: ${provider}`)
    }

    console.log(`📋 Using Airbyte source definition: ${sourceDefinitionId} for ${provider}`)

    // Prepare OAuth input configuration
    const oauthInputConfig = getProviderOAuthConfig(provider)
    console.log(`⚙️ OAuth config for ${provider}:`, oauthInputConfig)

    // Create OAuth consent URL using Airbyte API
    const requestBody = {
      workspaceId: AIRBYTE_WORKSPACE_ID,
      sourceDefinitionId: sourceDefinitionId,
      redirectUri: redirectUri,
      oAuthInputConfiguration: oauthInputConfig
    }

    console.log(`📤 Sending Airbyte OAuth request:`, requestBody)

    const consentResponse = await fetch(`${AIRBYTE_API_URL}/sources/oAuth/consent_url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'OpsAI-Platform/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    console.log(`📡 Airbyte consent response:`)
    console.log(`   Status: ${consentResponse.status}`)
    console.log(`   Headers:`, Object.fromEntries(consentResponse.headers.entries()))

    const responseText = await consentResponse.text()
    console.log(`📄 Raw response:`, responseText)

    if (!consentResponse.ok) {
      console.error(`❌ Airbyte consent URL failed (${consentResponse.status}):`, responseText)
      
      // Try to parse error details
      let errorDetails = responseText
      try {
        const errorJson = JSON.parse(responseText)
        errorDetails = errorJson.message || errorJson.detail || errorJson.error || responseText
      } catch (e) {
        // Use raw text if not JSON
      }
      
      throw new Error(`Airbyte API error: ${errorDetails}`)
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      throw new Error(`Invalid JSON response from Airbyte: ${responseText}`)
    }
    
    console.log(`✅ Airbyte consent URL response:`, result)
    
    if (result.consentUrl) {
      console.log(`🔗 Generated OAuth URL: ${result.consentUrl}`)
      return result.consentUrl
    } else {
      console.log(`⚠️ No consentUrl in response:`, result)
      return null
    }

  } catch (error) {
    console.error('❌ Airbyte OAuth URL creation error:', error)
    return null
  }
}

// Get provider-specific OAuth configuration for Airbyte
function getProviderOAuthConfig(provider: string): Record<string, any> {
  const now = new Date()
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  const isoStartDate = startDate.toISOString().split('T')[0]
  
  const providerConfigs: Record<string, Record<string, any>> = {
    'google-analytics': {
      property_ids: [], // Will be configured after OAuth
      start_date: isoStartDate,
      custom_reports_array: []
    },
    'google_analytics': {
      property_ids: [], 
      start_date: isoStartDate,
      custom_reports_array: []
    },
    'shopify': {
      start_date: isoStartDate,
      shop: '' // Will be provided during setup or extracted from OAuth
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
    'facebook-marketing': {
      start_date: isoStartDate,
      end_date: now.toISOString().split('T')[0],
      account_ids: [], // Will be populated after OAuth
      include_deleted: false
    },
    'google-ads': {
      start_date: isoStartDate,
      end_date: now.toISOString().split('T')[0],
      customer_id: '', // Will be configured after OAuth
      conversion_window_days: 14
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

  return providerConfigs[provider.toLowerCase()] || {
    start_date: isoStartDate
  }
}

// Check if we have OAuth client credentials for a provider
function checkProviderCredentials(provider: string): boolean {
  const credentials: Record<string, () => boolean> = {
    shopify: () => !!process.env.SHOPIFY_CLIENT_ID,
    stripe: () => !!process.env.STRIPE_CLIENT_ID,
    google: () => !!process.env.GOOGLE_CLIENT_ID,
    'google-analytics': () => !!process.env.GOOGLE_CLIENT_ID,
    salesforce: () => !!process.env.SALESFORCE_CLIENT_ID,
    hubspot: () => !!process.env.HUBSPOT_CLIENT_ID,
    slack: () => !!process.env.SLACK_CLIENT_ID,
    mailchimp: () => !!process.env.MAILCHIMP_CLIENT_ID,
    quickbooks: () => !!process.env.QUICKBOOKS_CLIENT_ID,
    github: () => !!process.env.GITHUB_CLIENT_ID
  }
  
  const checkFn = credentials[provider.toLowerCase()]
  return checkFn ? checkFn() : false
}