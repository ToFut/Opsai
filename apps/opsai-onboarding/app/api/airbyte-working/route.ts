import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { action, provider, credentials, useNgrok } = await request.json()
    
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
    
    if (action === 'oauth') {
      // OAuth flow - requires HTTPS redirect URL
      const redirectUrl = useNgrok 
        ? 'https://your-ngrok-url.ngrok.io/oauth-callback'
        : 'https://your-production-domain.com/oauth-callback'
      
      const oauthResponse = await fetch('https://api.airbyte.com/v1/sources/initiateOAuth', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: `oauth-${provider}-${Date.now()}`,
          workspaceId,
          sourceDefinitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e', // GitHub
          redirectUrl
        })
      })
      
      const oauthData = await oauthResponse.json()
      
      return NextResponse.json({
        success: oauthResponse.ok,
        status: oauthResponse.status,
        data: oauthData,
        redirectUrl,
        message: oauthResponse.ok 
          ? 'OAuth URL generated successfully'
          : 'OAuth initiation failed'
      })
    }
    
    if (action === 'direct') {
      // Direct source creation with API token
      let configuration: any = {}
      
      switch (provider) {
        case 'github':
          configuration = {
            credentials: {
              option_title: 'PAT Credentials',
              personal_access_token: credentials.token
            },
            repository: credentials.repository || 'octocat/Hello-World',
            start_date: '2024-01-01T00:00:00Z'
          }
          break
          
        case 'postgres':
          configuration = {
            host: credentials.host,
            port: credentials.port || 5432,
            database: credentials.database,
            username: credentials.username,
            password: credentials.password,
            ssl_mode: { mode: 'prefer' }
          }
          break
          
        default:
          return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
      }
      
      const sourceResponse = await fetch('https://api.airbyte.com/v1/sources', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: `${provider}-direct-${Date.now()}`,
          workspaceId,
          sourceDefinitionId: provider === 'github' 
            ? 'ef69ef6e-aa7f-4af1-a01d-ef775033524e'
            : 'decd338e-5647-4c0b-adf4-da0e75f5a750', // postgres
          configuration
        })
      })
      
      const sourceData = await sourceResponse.json()
      
      if (sourceResponse.ok) {
        // Test the connection
        const testResponse = await fetch(
          `https://api.airbyte.com/v1/sources/${sourceData.sourceId}/check_connection`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        )
        
        const testData = await testResponse.json()
        
        return NextResponse.json({
          success: true,
          sourceId: sourceData.sourceId,
          source: sourceData,
          connectionTest: testData,
          message: 'Source created successfully'
        })
      }
      
      return NextResponse.json({
        success: false,
        status: sourceResponse.status,
        error: sourceData,
        message: 'Source creation failed'
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}