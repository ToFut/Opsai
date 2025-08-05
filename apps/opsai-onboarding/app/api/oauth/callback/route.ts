import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAirbyteClient, AIRBYTE_SOURCE_DEFINITIONS, getProviderOAuthConfig } from '@/lib/airbyte-oauth-client'

export async function GET(request: NextRequest) {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  console.log('🔐 OAuth callback received:', {
    hasCode: !!code,
    hasState: !!state,
    error,
    url: request.url
  })

  if (error) {
    const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/onboarding-v3?oauth=error&error=${error}`
    console.log(`❌ OAuth error, redirecting to: ${errorUrl}`)
    return NextResponse.redirect(errorUrl)
  }

  if (!code || !state) {
    const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/onboarding-v3?oauth=error&error=missing_params`
    console.log(`❌ Missing params, redirecting to: ${errorUrl}`)
    return NextResponse.redirect(errorUrl)
  }

  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const { tenantId, provider } = stateData
    
    console.log(`🔐 OAuth callback for ${provider}, tenant: ${tenantId}`)

    // Check if this is an Airbyte OAuth flow
    const isAirbyteFlow = stateData.airbyte === true
    let tokens: any
    
    if (isAirbyteFlow) {
      console.log(`🔄 Completing Airbyte OAuth for ${provider}`)
      try {
        const sourceDefinitionId = AIRBYTE_SOURCE_DEFINITIONS[provider.toLowerCase()]
        if (!sourceDefinitionId) {
          throw new Error(`No Airbyte source definition for ${provider}`)
        }
        
        const redirectUri = 'http://localhost:7250/api/oauth/callback'
        const oauthConfig = getProviderOAuthConfig(provider)
        
        // Complete OAuth with Airbyte
        const airbyteClient = getAirbyteClient()
        const result = await airbyteClient.completeOAuth(
          sourceDefinitionId,
          redirectUri,
          { code, state },
          oauthConfig
        )
        
        tokens = {
          access_token: result.access_token || 'airbyte-managed',
          refresh_token: result.refresh_token || 'airbyte-managed',
          expires_in: result.expires_in || 3600,
          scope: result.scope || 'airbyte-managed',
          token_type: result.token_type || 'Bearer',
          airbyte_source_id: result.sourceId,
          airbyte_managed: true
        }
        
        console.log(`✅ Airbyte OAuth completed for ${provider}`)
      } catch (airbyteError) {
        console.error(`❌ Airbyte OAuth completion failed for ${provider}:`, airbyteError)
        throw airbyteError
      }
    } else {
      // Exchange code for tokens using direct provider OAuth
      tokens = await exchangeCodeForTokens(provider, code)
    }

    // Store tokens - try Supabase first, fallback to temp storage
    try {
      await supabase
        .from('tenant_integrations')
        .upsert({
          tenant_id: tenantId,
          provider,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_in 
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null,
          scope: tokens.scope,
          token_type: tokens.token_type,
          raw_response: tokens,
          connected_at: new Date().toISOString(),
          status: 'connected'
        })
    } catch (error) {
      console.log('⚠️  Supabase not ready, using temp storage')
      const { tempStorage } = await import('@/lib/temp-storage')
      await tempStorage.saveIntegration({
        tenant_id: tenantId,
        provider,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_in 
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
        scope: tokens.scope,
        token_type: tokens.token_type,
        raw_response: tokens,
        connected_at: new Date().toISOString(),
        status: 'connected'
      })
    }

    // After successful connection, collect sample data and organize database
    console.log(`📊 Collecting sample data from ${provider}...`)
    try {
      await fetchInitialData(tenantId, provider, tokens.access_token)
      console.log(`✅ Sample data collected and saved to Supabase for ${provider}`)
      
      // Skip database organization for now (API doesn't exist)
      console.log(`⚠️ Skipping database organization - API not implemented yet`);
    } catch (error) {
      console.log(`⚠️ Data processing error:`, error);
    }

    // Check if this was opened as a popup or redirect
    const isPopup = stateData.popup === true
    
    if (isPopup) {
      // Popup flow - use postMessage
      console.log('🪟 Using popup flow with postMessage')
      return new Response(`
        <html>
          <head>
            <title>OAuth Success</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; }
              .success { color: #10b981; font-size: 48px; margin-bottom: 20px; }
              .spinner { border: 3px solid #f3f4f6; border-top: 3px solid #3b82f6; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="success">✓</div>
            <h2>Connection Successful!</h2>
            <div class="spinner"></div>
            <p>Closing window...</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">If this window doesn't close automatically, please close it manually.</p>
            
            <script>
              console.log('OAuth callback - popup mode for ${provider}');
              console.log('Window opener exists:', !!window.opener);
              console.log('Window opener closed:', window.opener?.closed);
              
              // Try multiple approaches to communicate back
              try {
                if (window.opener && !window.opener.closed) {
                  console.log('Sending postMessage to parent');
                  // Send message to parent window with consistent origin
                  const targetOrigin = 'http://localhost:7250';
                  window.opener.postMessage({
                    type: 'OAUTH_SUCCESS',
                    provider: '${provider}'
                  }, targetOrigin);
                  
                  // Also try wildcard as fallback for dev
                  setTimeout(() => {
                    window.opener.postMessage({
                      type: 'OAUTH_SUCCESS',
                      provider: '${provider}'
                    }, '*');
                  }, 100);
                }
                
                // Store in localStorage as backup
                localStorage.setItem('oauth_token_${provider}', 'success');
                
                // Close window after delay
                setTimeout(() => {
                  window.close();
                }, 1000);
              } catch (error) {
                console.error('Error in OAuth callback:', error);
                // Fallback redirect
                setTimeout(() => {
                  window.location.href = '${process.env.NEXT_PUBLIC_APP_URL}/onboarding-v3?oauth=success&provider=${provider}';
                }, 2000);
              }
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    } else {
      // Redirect flow - redirect back to the app
      console.log('🔄 Using redirect flow')
      const returnUrl = stateData.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/onboarding-v3`
      return NextResponse.redirect(`${returnUrl}?oauth=success&provider=${provider}`)
    }

  } catch (error) {
    console.error('OAuth callback error:', error)
    
    // Check if this was a popup or redirect from state (if available)
    let isPopup = false
    let provider = 'unknown'
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
        isPopup = stateData.popup === true
        provider = stateData.provider || 'unknown'
      }
    } catch (e) {
      // Ignore state parsing errors
    }
    
    if (isPopup) {
      return new Response(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_ERROR',
                  error: '${error}',
                  provider: '${provider}'
                }, '*');
                window.close();
              } else {
                window.location.href = '${process.env.NEXT_PUBLIC_APP_URL}/onboarding-v3?oauth=error&error=${encodeURIComponent(String(error))}';
              }
            </script>
            <p>Connection failed. This window will close automatically.</p>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/test-integrations?oauth=error&error=${encodeURIComponent(String(error))}`)
    }
  }
}

async function exchangeCodeForTokens(provider: string, code: string) {
  // Map provider aliases to actual OAuth providers
  const providerMapping: Record<string, string> = {
    'google-analytics': 'google',
    'google_analytics': 'google',
    'google-workspace': 'google',
    'stripe-connect': 'stripe'
  }
  
  const oauthProvider = providerMapping[provider] || provider

  const tokenEndpoints: Record<string, string> = {
    google: 'https://oauth2.googleapis.com/token',
    salesforce: 'https://login.salesforce.com/services/oauth2/token',
    stripe: 'https://connect.stripe.com/oauth/token',
    shopify: 'https://your-shop.myshopify.com/admin/oauth/access_token',
    quickbooks: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    hubspot: 'https://api.hubapi.com/oauth/v1/token',
    slack: 'https://slack.com/api/oauth.v2.access',
    github: 'https://github.com/login/oauth/access_token',
    notion: 'https://api.notion.com/v1/oauth/token',
    zoom: 'https://zoom.us/oauth/token',
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    xero: 'https://identity.xero.com/connect/token',
    square: 'https://connect.squareup.com/oauth2/token',
    mailchimp: 'https://login.mailchimp.com/oauth2/token',
    calendly: 'https://auth.calendly.com/oauth/token'
  }

  const endpoint = tokenEndpoints[oauthProvider]
  if (!endpoint) throw new Error('Unknown provider')

  // Use consistent redirect URI configured in OAuth providers
  const redirectUri = 'http://localhost:7250/api/oauth/callback'
    
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: process.env[`${oauthProvider.toUpperCase()}_CLIENT_ID`] || '',
    client_secret: process.env[`${oauthProvider.toUpperCase()}_CLIENT_SECRET`] || ''
  })

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`)
  }

  return response.json()
}

async function fetchInitialData(tenantId: string, provider: string, accessToken: string) {
  console.log(`📊 Fetching sample data for ${provider}...`)
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  try {
    // Import the sample data fetcher
    const sampleDataResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/providers/sample-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        accessToken,
        tenantId
      })
    })
    
    if (sampleDataResponse.ok) {
      const { sampleData, analysis } = await sampleDataResponse.json()
      console.log(`✅ Collected sample data for ${provider}:`, {
        recordCount: sampleData.recordCount,
        entities: Object.keys(sampleData.entities || {})
      })
      
      // Store sample data - try Supabase first, fallback to temp storage
      try {
        await supabase
          .from('tenant_sample_data')
          .upsert({
            tenant_id: tenantId,
            provider,
            sample_data: sampleData,
            collected_at: new Date().toISOString()
          })
        console.log(`✅ Sample data saved to Supabase for ${provider}`)
      } catch (error) {
        console.log('⚠️  Supabase not ready, using temp storage for sample data')
        const { tempStorage } = await import('@/lib/temp-storage')
        await tempStorage.saveSampleData({
          tenant_id: tenantId,
          provider,
          sample_data: sampleData,
          data_analysis: analysis,
          collected_at: new Date().toISOString()
        })
      }
      
      // Setup Airbyte connection asynchronously (don't block OAuth completion)
      console.log(`🚀 Setting up Airbyte connection for ${provider}...`)
      setupAirbyteConnection(tenantId, provider, accessToken)
        .then(() => {
          console.log(`✅ Airbyte connection setup successful for ${provider}`)
        })
        .catch((err) => {
          console.log(`⚠️ Airbyte setup failed for ${provider}, but sample data was collected:`, err)
        })
    }
  } catch (error) {
    console.error(`Failed to fetch sample data for ${provider}:`, error)
  }
}

async function setupAirbyteConnection(tenantId: string, provider: string, accessToken: string) {
  // Call internal API to setup Airbyte connection
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/airbyte/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        provider,
        accessToken
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Airbyte setup failed: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    console.log(`📊 Airbyte setup result:`, result)
    
  } catch (error) {
    console.error('Failed to setup Airbyte connection:', error)
    throw error
  }
}