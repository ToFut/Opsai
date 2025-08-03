import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get token first
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
      return NextResponse.json({ error: 'Failed to get token', details: tokenData })
    }
    
    const token = tokenData.access_token
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID
    
    // Use HTTPS redirect URL for production (Airbyte requires HTTPS)
    const redirectUrl = 'https://your-app.vercel.app/oauth-callback' // or ngrok URL
    
    // Test OAuth initiation with HTTPS URL
    const oauthResponse = await fetch('https://api.airbyte.com/v1/sources/initiateOAuth', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        workspaceId,
        sourceDefinitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e', // GitHub
        redirectUrl
      })
    })
    
    const oauthData = await oauthResponse.json()
    
    // Also test creating a direct source (non-OAuth)
    const directSourceResponse = await fetch('https://api.airbyte.com/v1/sources', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: `github-test-${Date.now()}`,
        workspaceId,
        configuration: {
          sourceType: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
          credentials: {
            option_title: 'PAT Credentials',
            personal_access_token: 'dummy-token-for-test'
          },
          repository: 'octocat/Hello-World',
          start_date: '2024-01-01T00:00:00Z'
        }
      })
    })
    
    const directSourceData = await directSourceResponse.json()
    
    return NextResponse.json({
      success: true,
      tests: [
        {
          name: 'OAuth with HTTPS redirect',
          endpoint: '/v1/sources/initiateOAuth',
          redirectUrl,
          status: oauthResponse.status,
          success: oauthResponse.ok,
          response: oauthData
        },
        {
          name: 'Direct source creation',
          endpoint: '/v1/sources',
          status: directSourceResponse.status,
          success: directSourceResponse.ok,
          response: directSourceData
        }
      ],
      recommendations: [
        oauthResponse.status === 422 ? '⚠️ OAuth requires HTTPS redirect URL' : '',
        oauthResponse.status === 403 ? '⚠️ OAuth endpoints may require additional permissions in Airbyte Cloud' : '',
        directSourceResponse.ok ? '✅ Direct source creation works - use API tokens instead of OAuth' : '',
        '💡 For development, use ngrok to get HTTPS URL: ngrok http 7250'
      ].filter(Boolean)
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}