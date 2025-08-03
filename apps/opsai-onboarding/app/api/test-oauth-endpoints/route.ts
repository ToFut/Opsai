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
    
    // Test different OAuth endpoints
    const tests = []
    
    // 1. Test source definitions first (to get GitHub source definition ID)
    const sourceDefsResponse = await fetch(
      `https://api.airbyte.com/v1/source_definitions?workspaceId=${workspaceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    )
    const sourceDefsData = await sourceDefsResponse.json()
    
    tests.push({
      name: 'Source Definitions',
      endpoint: '/v1/source_definitions',
      status: sourceDefsResponse.status,
      success: sourceDefsResponse.ok,
      response: sourceDefsResponse.ok ? `Found ${sourceDefsData.data?.length || 0} definitions` : sourceDefsData
    })
    
    // Find GitHub source definition
    const githubDef = sourceDefsResponse.ok 
      ? sourceDefsData.data?.find((def: any) => def.name?.toLowerCase().includes('github'))
      : null
    
    if (githubDef) {
      tests.push({
        name: 'GitHub Source Found',
        sourceDefinitionId: githubDef.sourceDefinitionId,
        name: githubDef.name,
        documentationUrl: githubDef.documentationUrl
      })
    }
    
    // Use the correct GitHub source definition ID
    const githubSourceDefId = githubDef?.sourceDefinitionId || 'ef69ef6e-aa7f-4af1-a01d-ef775033524e'
    
    // 2. Test OAuth initiation endpoints
    const oauthEndpoints = [
      '/v1/sources/initiateOAuth',
      '/v1/oauth/sources/oauth_consent_url',
      '/v1/source_oauths/get_consent_url'
    ]
    
    for (const endpoint of oauthEndpoints) {
      const oauthResponse = await fetch(`https://api.airbyte.com${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          workspaceId,
          sourceDefinitionId: githubSourceDefId,
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7250'}/oauth-callback`
        })
      })
      
      const oauthData = await oauthResponse.json()
      
      tests.push({
        name: `OAuth Test: ${endpoint}`,
        endpoint,
        status: oauthResponse.status,
        success: oauthResponse.ok,
        response: oauthResponse.ok 
          ? { consentUrl: oauthData.consentUrl || oauthData.authUrl || 'URL found' }
          : oauthData
      })
    }
    
    // 3. Test workspace sources list
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
    
    tests.push({
      name: 'List Sources',
      endpoint: '/v1/sources',
      status: sourcesResponse.status,
      success: sourcesResponse.ok,
      response: sourcesResponse.ok ? `Found ${sourcesData.data?.length || 0} sources` : sourcesData
    })
    
    return NextResponse.json({
      success: true,
      workspaceId,
      githubSourceDefinitionId: githubSourceDefId,
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.success).length,
        failed: tests.filter(t => !t.success).length
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}