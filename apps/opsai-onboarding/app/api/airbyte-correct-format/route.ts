import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { testType } = await request.json()
    
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
    
    if (testType === 'oauth') {
      // Test OAuth with proper format
      const oauthPayload = {
        sourceDefinitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
        workspaceId,
        redirectUrl: 'https://example.com/oauth-callback'
      }
      
      const oauthResponse = await fetch('https://api.airbyte.com/v1/sources/initiateOAuth', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(oauthPayload)
      })
      
      const oauthData = await oauthResponse.json()
      
      return NextResponse.json({
        test: 'OAuth Initiation',
        payload: oauthPayload,
        status: oauthResponse.status,
        success: oauthResponse.ok,
        response: oauthData
      })
    }
    
    if (testType === 'source') {
      // Test source creation with minimal payload
      const sourcePayload = {
        name: `test-github-${Date.now()}`,
        workspaceId,
        sourceDefinitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
        configuration: {
          credentials: {
            option_title: 'PAT Credentials',
            personal_access_token: 'dummy_token_for_format_test'
          },
          repository: 'octocat/Hello-World',
          start_date: '2024-01-01T00:00:00Z'
        }
      }
      
      const sourceResponse = await fetch('https://api.airbyte.com/v1/sources', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(sourcePayload)
      })
      
      const sourceData = await sourceResponse.json()
      
      return NextResponse.json({
        test: 'Source Creation',
        payload: sourcePayload,
        status: sourceResponse.status,
        success: sourceResponse.ok,
        response: sourceData
      })
    }
    
    if (testType === 'check-existing') {
      // List existing sources to see the format
      const sourcesResponse = await fetch(
        `https://api.airbyte.com/v1/sources?workspaceId=${workspaceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      )
      
      const sourcesData = await sourcesResponse.json()
      
      return NextResponse.json({
        test: 'List Existing Sources',
        status: sourcesResponse.status,
        success: sourcesResponse.ok,
        response: sourcesData,
        message: `Found ${sourcesData.data?.length || 0} existing sources`
      })
    }
    
    return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}