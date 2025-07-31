import { NextRequest, NextResponse } from 'next/server'
import { oauthManager } from '@/lib/oauth-providers'
import { credentialManager } from '@/lib/credential-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  // Get the session ID from state parameter
  const sessionId = searchParams.get('session_id')
  
  if (error) {
    // Redirect back to onboarding with error
    return NextResponse.redirect(
      new URL(`/onboarding?error=${error}&provider=${provider}`, request.url)
    )
  }
  
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/onboarding?error=missing_parameters', request.url)
    )
  }
  
  try {
    // Exchange code for tokens
    const tokens = await oauthManager.exchangeCodeForToken(provider, code, state)
    
    // Store credentials securely
    const credentialId = await credentialManager.storeCredentials(
      provider,
      'oauth',
      {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope
      },
      {
        sessionId,
        connectedAt: new Date().toISOString()
      }
    )
    
    // Test the connection by making a simple API call
    const testResult = await testProviderConnection(provider, tokens.accessToken)
    
    // Store additional provider-specific data
    if (testResult.accountInfo) {
      await credentialManager.updateCredential(credentialId, {
        metadata: {
          ...testResult.accountInfo,
          verified: true
        }
      })
    }
    
    // Redirect back to home page with success
    return NextResponse.redirect(
      new URL(
        `/?success=true&provider=${provider}&account=${testResult.accountInfo?.name || provider}`,
        request.url
      )
    )
    
  } catch (error) {
    console.error(`OAuth callback error for ${provider}:`, error)
    
    return NextResponse.redirect(
      new URL(
        `/?error=oauth_failed&provider=${provider}`,
        request.url
      )
    )
  }
}

// Test the connection and get account info
async function testProviderConnection(provider: string, accessToken: string) {
  const testEndpoints: Record<string, { url: string; headers: any }> = {
    quickbooks: {
      url: 'https://api.intuit.com/v3/company/companyinfo',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    },
    square: {
      url: 'https://connect.squareup.com/v2/merchants',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Square-Version': '2024-01-18'
      }
    },
    stripe: {
      url: 'https://api.stripe.com/v1/account',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    },
    shopify: {
      url: 'https://myshopify.com/admin/api/2024-01/shop.json',
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    },
    hubspot: {
      url: 'https://api.hubapi.com/account-info/v3/details',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    },
    salesforce: {
      url: 'https://login.salesforce.com/services/oauth2/userinfo',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    },
    'google-workspace': {
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    },
    'microsoft-365': {
      url: 'https://graph.microsoft.com/v1.0/me',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  }
  
  const endpoint = testEndpoints[provider]
  if (!endpoint) {
    return { success: true, accountInfo: null }
  }
  
  try {
    const response = await fetch(endpoint.url, {
      headers: endpoint.headers
    })
    
    if (response.ok) {
      const data = await response.json()
      
      // Extract account name based on provider
      let accountName = 'Connected Account'
      switch (provider) {
        case 'quickbooks':
          accountName = data.CompanyInfo?.CompanyName || accountName
          break
        case 'square':
          accountName = data.merchant?.[0]?.business_name || accountName
          break
        case 'stripe':
          accountName = data.business_profile?.name || data.email || accountName
          break
        case 'shopify':
          accountName = data.shop?.name || accountName
          break
        case 'hubspot':
          accountName = data.portalId || accountName
          break
        case 'salesforce':
          accountName = data.organization_id || accountName
          break
        case 'google-workspace':
          accountName = data.email || accountName
          break
        case 'microsoft-365':
          accountName = data.displayName || data.mail || accountName
          break
      }
      
      return {
        success: true,
        accountInfo: {
          name: accountName,
          provider,
          data
        }
      }
    }
    
    return { success: false, accountInfo: null }
    
  } catch (error) {
    console.error(`Failed to test ${provider} connection:`, error)
    return { success: false, accountInfo: null }
  }
}