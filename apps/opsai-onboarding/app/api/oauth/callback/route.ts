import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/oauth-error?error=${error}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/oauth-error?error=missing_params`
    )
  }

  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const { tenantId, provider } = stateData

    // Exchange code for tokens based on provider
    const tokens = await exchangeCodeForTokens(provider, code)

    // Store tokens in Supabase
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

    // After successful connection, fetch initial data
    await fetchInitialData(tenantId, provider, tokens.access_token)

    // Close the OAuth popup and notify parent window
    return new Response(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'oauth-success',
              provider: '${provider}'
            }, '${process.env.NEXT_PUBLIC_APP_URL}');
            window.close();
          </script>
          <p>Connection successful! This window will close automatically.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'oauth-error',
              error: '${error}'
            }, '${process.env.NEXT_PUBLIC_APP_URL}');
            window.close();
          </script>
          <p>Connection failed. This window will close automatically.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

async function exchangeCodeForTokens(provider: string, code: string) {
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
    mailchimp: 'https://login.mailchimp.com/oauth2/token'
  }

  const endpoint = tokenEndpoints[provider]
  if (!endpoint) throw new Error('Unknown provider')

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`,
    client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`] || '',
    client_secret: process.env[`${provider.toUpperCase()}_CLIENT_SECRET`] || ''
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
  // Fetch initial data from the connected service
  const dataEndpoints: Record<string, string> = {
    google: 'https://www.googleapis.com/oauth2/v1/userinfo',
    salesforce: 'https://login.salesforce.com/services/oauth2/userinfo',
    stripe: 'https://api.stripe.com/v1/account',
    shopify: 'https://your-shop.myshopify.com/admin/api/2024-01/shop.json',
    hubspot: 'https://api.hubapi.com/oauth/v1/access-tokens/' + accessToken,
    slack: 'https://slack.com/api/team.info',
    github: 'https://api.github.com/user',
    notion: 'https://api.notion.com/v1/users/me',
    zoom: 'https://api.zoom.us/v2/users/me',
    microsoft: 'https://graph.microsoft.com/v1.0/me',
    xero: 'https://api.xero.com/connections',
    square: 'https://connect.squareup.com/v2/merchants/me',
    mailchimp: 'https://login.mailchimp.com/oauth2/metadata'
  }

  const endpoint = dataEndpoints[provider]
  if (!endpoint) return

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      
      // Store initial data
      await supabase
        .from('tenant_integration_data')
        .insert({
          tenant_id: tenantId,
          provider,
          data_type: 'user_info',
          data: data,
          fetched_at: new Date().toISOString()
        })

      // Trigger Airbyte sync setup
      await setupAirbyteConnection(tenantId, provider, accessToken)
    }
  } catch (error) {
    console.error(`Failed to fetch initial data for ${provider}:`, error)
  }
}

async function setupAirbyteConnection(tenantId: string, provider: string, accessToken: string) {
  // Call internal API to setup Airbyte connection
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/airbyte/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        provider,
        accessToken
      })
    })
  } catch (error) {
    console.error('Failed to setup Airbyte connection:', error)
  }
}