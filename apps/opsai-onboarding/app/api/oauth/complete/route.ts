import { NextRequest, NextResponse } from 'next/server'
import { oauthFlow } from '@/lib/oauth-flow-complete'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase for token storage
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  try {
    // Handle OAuth callback
    const result = await oauthFlow.handleCallback(
      code || '',
      state || '',
      error || undefined
    )

    if (!result.success) {
      // Redirect to error page
      return NextResponse.redirect(
        new URL(
          `/oauth-error?error=${encodeURIComponent(result.error || 'Unknown error')}`,
          request.url
        )
      )
    }

    // Store tokens securely
    if (supabase && result.tokens) {
      const { error: dbError } = await supabase
        .from('oauth_tokens')
        .insert({
          provider: result.provider,
          access_token: result.tokens.access_token,
          refresh_token: result.tokens.refresh_token,
          expires_at: result.tokens.expires_in 
            ? new Date(Date.now() + result.tokens.expires_in * 1000).toISOString()
            : null,
          scope: result.tokens.scope,
          token_type: result.tokens.token_type,
          created_at: new Date().toISOString()
        })

      if (dbError) {
        console.error('Failed to store tokens:', dbError)
      }
    }

    // Create Airbyte source with tokens
    const sourceResult = await createAirbyteSource(
      result.provider!,
      result.tokens
    )

    // Redirect to success page
    const successUrl = new URL('/oauth-success', request.url)
    successUrl.searchParams.set('provider', result.provider!)
    successUrl.searchParams.set('source_id', sourceResult.sourceId || '')
    
    return NextResponse.redirect(successUrl)

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/oauth-error?error=${encodeURIComponent('OAuth process failed')}`,
        request.url
      )
    )
  }
}

// Create source in Airbyte with OAuth tokens
async function createAirbyteSource(provider: string, tokens: any) {
  try {
    // Get Airbyte token
    const tokenResponse = await fetch(
      'https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.AIRBYTE_CLIENT_ID || '',
          client_secret: process.env.AIRBYTE_CLIENT_SECRET || ''
        }).toString()
      }
    )
    
    const tokenData = await tokenResponse.json()
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error('Failed to get Airbyte token')
    }
    
    // Get source definition ID based on provider
    const sourceDefinitionMap: Record<string, string> = {
      'github': 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
      'google': '71607ba1-c0ac-4799-8049-7f4b90dd50f7',
      'shopify': '9da77142-a95c-4f1a-8f4b-d4f0e5e4b1e3'
    }
    
    const sourceDefinitionId = sourceDefinitionMap[provider]
    if (!sourceDefinitionId) {
      throw new Error(`Unknown provider: ${provider}`)
    }
    
    // Create configuration based on provider and tokens
    let configuration: any = {}
    
    switch (provider) {
      case 'github':
        configuration = {
          credentials: {
            option_title: 'OAuth Credentials',
            access_token: tokens.access_token
          },
          repository: '*/*', // All repositories
          start_date: '2024-01-01T00:00:00Z'
        }
        break
        
      case 'google':
        configuration = {
          credentials: {
            auth_type: 'Service',
            service_account_info: JSON.stringify({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token
            })
          }
        }
        break
        
      default:
        throw new Error(`Configuration not implemented for ${provider}`)
    }
    
    // Create the source in Airbyte
    const sourceResponse = await fetch('https://api.airbyte.com/v1/sources', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: `${provider}-oauth-${Date.now()}`,
        workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
        sourceDefinitionId,
        configuration
      })
    })
    
    const sourceData = await sourceResponse.json()
    
    if (!sourceResponse.ok) {
      console.error('Airbyte source creation failed:', sourceData)
      return {
        success: false,
        error: `Failed to create source: ${sourceData.message || 'Unknown error'}`
      }
    }
    
    return {
      sourceId: sourceData.sourceId,
      success: true,
      sourceData
    }
    
  } catch (error) {
    console.error('Failed to create Airbyte source:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create source'
    }
  }
}