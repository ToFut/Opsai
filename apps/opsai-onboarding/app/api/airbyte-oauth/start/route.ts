import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { provider, tenantId } = await request.json()
    
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }
    
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
      return NextResponse.json({
        error: 'Failed to get Airbyte token',
        details: tokenData
      }, { status: 500 })
    }
    
    // Source definition mapping
    const sourceDefinitionMap: Record<string, string> = {
      'github': 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
      'google': '71607ba1-c0ac-4799-8049-7f4b90dd50f7',
      'shopify': '9da77142-a95c-4f1a-8f4b-d4f0e5e4b1e3'
    }
    
    const sourceDefinitionId = sourceDefinitionMap[provider]
    if (!sourceDefinitionId) {
      return NextResponse.json({
        error: `Unknown provider: ${provider}`
      }, { status: 400 })
    }
    
    // For development, use a publicly accessible URL
    // In production, this should be your deployed domain
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https')
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/airbyte-oauth/callback`
      : 'https://example.com/oauth-callback' // Placeholder for development
    
    // Initiate OAuth with Airbyte
    const oauthResponse = await fetch('https://api.airbyte.com/v1/sources/initiateOAuth', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: `${provider}-oauth-${tenantId || 'default'}-${Date.now()}`,
        workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
        sourceDefinitionId,
        redirectUrl
      })
    })
    
    const oauthData = await oauthResponse.json()
    
    if (!oauthResponse.ok) {
      return NextResponse.json({
        error: 'Failed to initiate OAuth',
        status: oauthResponse.status,
        details: oauthData,
        suggestion: redirectUrl === 'https://example.com/oauth-callback' 
          ? 'For development, deploy to a public HTTPS URL or use ngrok'
          : 'Check your redirect URL configuration'
      }, { status: oauthResponse.status })
    }
    
    return NextResponse.json({
      success: true,
      authUrl: oauthData.consentUrl || oauthData.authUrl,
      provider,
      redirectUrl,
      oauthData
    })
    
  } catch (error) {
    console.error('OAuth start error:', error)
    return NextResponse.json({
      error: 'Failed to start OAuth',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}