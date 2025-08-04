import { NextRequest, NextResponse } from 'next/server'
import { airbyteClient, AIRBYTE_SOURCE_DEFINITIONS, getProviderOAuthConfig } from '@/lib/airbyte-oauth-client'

// GET handler for OAuth redirect flow
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const provider = searchParams.get('provider')
  const state = searchParams.get('state')
  
  if (!provider || !state) {
    return NextResponse.json({ error: 'Provider and state required' }, { status: 400 })
  }
  
  try {
    // Decode state to get tenantId
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const { tenantId } = stateData
    
    // Call the same logic as POST
    return handleOAuthInit(provider, tenantId, state)
  } catch (error) {
    console.error('OAuth GET error:', error)
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
  }
}

// Shared OAuth initialization logic
async function handleOAuthInit(provider: string, tenantId: string, existingState?: string, shopDomain?: string) {
  // Map provider aliases to actual OAuth providers
  const providerMapping: Record<string, string> = {
      'google-analytics': 'google',
      'google_analytics': 'google',
      'google-workspace': 'google',
      'stripe-connect': 'stripe'
  }
  
  // Use mapped provider if available
  const oauthProvider = providerMapping[provider] || provider
  
  // First try Airbyte OAuth for supported providers
  const sourceDefinitionId = AIRBYTE_SOURCE_DEFINITIONS[oauthProvider]
  if (sourceDefinitionId && sourceDefinitionId !== 'not-supported-by-airbyte') {
    try {
      console.log(`🚀 Using Airbyte OAuth for ${provider}`)
      
      // Create state for Airbyte OAuth
      const state = existingState || Buffer.from(JSON.stringify({
        tenantId,
        provider,
        timestamp: Date.now(),
        popup: true,
        airbyte: true
      })).toString('base64')
      
      const redirectUri = process.env.AIRBYTE_REDIRECT_URL || process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/callback' || 'http://localhost:7250/api/oauth/callback'
      const oauthConfig = getProviderOAuthConfig(oauthProvider)
      
      // Add shop domain for Shopify
      if (oauthProvider === 'shopify' && shopDomain) {
        oauthConfig.shop = shopDomain
      }
      
      const consentUrl = await airbyteClient.createOAuthConsentUrl(
        sourceDefinitionId,
        redirectUri,
        oauthConfig
      )
      
      console.log(`✅ Airbyte OAuth URL created for ${provider}: ${consentUrl}`)
      
      return NextResponse.json({
        authUrl: consentUrl,
        state,
        source: 'airbyte'
      })
    } catch (airbyteError) {
      console.log(`ℹ️ Airbyte OAuth requires HTTPS. Using direct OAuth for ${provider} instead.`)
      // Continue to direct OAuth fallback
    }
  } else {
    console.log(`📝 ${provider} not supported by Airbyte, using direct OAuth`)
  }

  // Build OAuth URL based on provider
  const authUrls: Record<string, string> = {
      google: `https://accounts.google.com/o/oauth2/v2/auth`,
      salesforce: `https://login.salesforce.com/services/oauth2/authorize`,
      shopify: `https://${shopDomain || 'shop'}.myshopify.com/admin/oauth/authorize`,
      stripe: `https://connect.stripe.com/oauth/authorize`,
      quickbooks: `https://appcenter.intuit.com/connect/oauth2`,
      hubspot: `https://app.hubspot.com/oauth/authorize`,
      slack: `https://slack.com/oauth/v2/authorize`,
      github: `https://github.com/login/oauth/authorize`,
      notion: `https://api.notion.com/v1/oauth/authorize`,
      zoom: `https://zoom.us/oauth/authorize`,
      microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`,
      xero: `https://login.xero.com/identity/connect/authorize`,
      square: `https://connect.squareup.com/oauth2/authorize`,
      paypal: `https://www.paypal.com/connect`,
      mailchimp: `https://login.mailchimp.com/oauth2/authorize`,
      calendly: `https://auth.calendly.com/oauth/authorize`
  }

  const authUrl = authUrls[oauthProvider]
  if (!authUrl) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  // Use existing state or generate new one
  const state = existingState || Buffer.from(JSON.stringify({
    tenantId,
    provider,
    timestamp: Date.now(),
    popup: true
  })).toString('base64')

    // Provider-specific scopes
    const scopes: Record<string, string[]> = {
      google: ['email', 'profile'],
      'google-analytics': ['email', 'profile'], // Don't request Analytics scope to avoid verification
      salesforce: ['api', 'refresh_token', 'offline_access'],
      shopify: ['read_products', 'read_orders', 'read_customers', 'read_inventory', 'read_analytics'],
      stripe: ['read_write'],
      quickbooks: ['com.intuit.quickbooks.accounting', 'com.intuit.quickbooks.payment'],
      hubspot: ['crm.objects.contacts.read', 'crm.objects.companies.read', 'forms', 'timeline'],
      slack: ['channels:read', 'chat:write', 'users:read', 'team:read'],
      github: ['repo', 'user', 'read:org'],
      notion: ['read_content', 'read_user'],
      zoom: ['user:read', 'meeting:read', 'recording:read'],
      microsoft: ['User.Read', 'Calendars.Read', 'Mail.Read', 'Files.Read'],
      xero: ['accounting.transactions.read', 'accounting.contacts.read', 'accounting.settings.read'],
      square: ['MERCHANT_PROFILE_READ', 'PAYMENTS_READ', 'CUSTOMERS_READ', 'ITEMS_READ'],
      paypal: ['openid', 'email', 'https://uri.paypal.com/services/paypalattributes'],
      mailchimp: ['read'],
      calendly: ['default']
    }

    // Check if we have valid credentials
    const clientId = process.env[`${oauthProvider.toUpperCase()}_CLIENT_ID`]
    const clientSecret = process.env[`${oauthProvider.toUpperCase()}_CLIENT_SECRET`]
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: `OAuth not configured for ${provider}. Please add ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET to your environment variables.` 
      }, { status: 400 })
    }
    
    // Use consistent redirect URI configured in OAuth providers
    const redirectUri = process.env.AIRBYTE_REDIRECT_URL || process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/callback' || 'http://localhost:7250/api/oauth/callback'
    
    console.log(`🔗 OAuth redirect URI for ${provider}: ${redirectUri}`)
    
    // Build OAuth URL with parameters
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: (scopes[oauthProvider] || []).join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent'
    })
    
    // Note: popup detection is handled via the state parameter, not URL params

    // Provider-specific parameters
    if (oauthProvider === 'shopify' && shopDomain) {
    params.set('shop', shopDomain)
  }

  const fullAuthUrl = `${authUrl}?${params.toString()}`
  
  // For GET requests, redirect directly
  return NextResponse.redirect(fullAuthUrl)
}

// This endpoint initiates OAuth flow for any provider
export async function POST(request: NextRequest) {
  try {
    let { provider, tenantId, shopDomain, state: providedState } = await request.json()

    if (!provider || !tenantId) {
      return NextResponse.json({ error: 'Provider and tenant ID required' }, { status: 400 })
    }

    // For POST requests, we need to return the URL as JSON
    const result = await handleOAuthInit(provider, tenantId, providedState, shopDomain)
    
    // If it's a redirect response, extract the URL and return as JSON
    if (result.status === 307 || result.status === 302) {
      const authUrl = result.headers.get('Location')
      return NextResponse.json({
        authUrl,
        state: providedState || Buffer.from(JSON.stringify({
          tenantId,
          provider,
          timestamp: Date.now(),
          returnUrl: process.env.NEXT_PUBLIC_APP_URL + '/onboarding',
          popup: true
        })).toString('base64')
      })
    }
    
    return result
  } catch (error) {
    console.error('OAuth initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize OAuth flow' },
      { status: 500 }
    )
  }
}