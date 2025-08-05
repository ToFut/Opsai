import { NextRequest, NextResponse } from 'next/server'
import { AirbyteTokenManager } from '@/lib/airbyte-token-manager'

export async function GET(request: NextRequest) {
  try {
    // Step 1: Get fresh token
    let token: string
    try {
      const tokenManager = AirbyteTokenManager.getInstance()
      token = await tokenManager.getValidToken()
    } catch (tokenError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get authentication token',
        details: tokenError instanceof Error ? tokenError.message : 'Token generation failed',
        recommendations: [
          '❌ Cannot obtain authentication token',
          '💡 Check AIRBYTE_CLIENT_ID and AIRBYTE_CLIENT_SECRET in .env.local',
          '💡 Verify credentials are correct in Airbyte Cloud'
        ]
      })
    }
    
    // Step 2: Test various endpoints
    const tests = []
    
    // Test 1: Check workspaces access
    const workspacesTest = await testEndpoint(
      'GET',
      'https://api.airbyte.com/v1/workspaces',
      token
    )
    tests.push({
      name: 'List Workspaces',
      endpoint: '/v1/workspaces',
      ...workspacesTest
    })
    
    // Test 2: Check specific workspace
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID
    if (workspaceId) {
      const workspaceTest = await testEndpoint(
        'GET',
        `https://api.airbyte.com/v1/workspaces/${workspaceId}`,
        token
      )
      tests.push({
        name: 'Get Specific Workspace',
        endpoint: `/v1/workspaces/${workspaceId}`,
        ...workspaceTest
      })
    }
    
    // Test 3: List source definitions
    const sourceDefsTest = await testEndpoint(
      'GET',
      'https://api.airbyte.com/v1/source_definitions',
      token,
      { workspaceId }
    )
    tests.push({
      name: 'List Source Definitions',
      endpoint: '/v1/source_definitions',
      ...sourceDefsTest
    })
    
    // Test 4: List destinations
    const destinationsTest = await testEndpoint(
      'GET',
      'https://api.airbyte.com/v1/destinations',
      token,
      { workspaceId }
    )
    tests.push({
      name: 'List Destinations',
      endpoint: '/v1/destinations',
      ...destinationsTest
    })
    
    // Test 5: Check OAuth endpoints
    const oauthTest = await testEndpoint(
      'POST',
      'https://api.airbyte.com/v1/sources/initiateOAuth',
      token,
      null,
      {
        workspaceId,
        sourceDefinitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/oauth-callback`
      }
    )
    tests.push({
      name: 'Test OAuth Initiation',
      endpoint: '/v1/sources/initiateOAuth',
      ...oauthTest
    })
    
    // Test 6: Alternative OAuth endpoints
    const altOAuthTest = await testEndpoint(
      'POST',
      'https://api.airbyte.com/v1/oauth/sources/oauth_consent_url',
      token,
      null,
      {
        workspaceId,
        sourceDefinitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/oauth-callback`
      }
    )
    tests.push({
      name: 'Alternative OAuth Endpoint',
      endpoint: '/v1/oauth/sources/oauth_consent_url',
      ...altOAuthTest
    })
    
    // Test 7: Check token info
    const tokenInfo = {
      token: token.substring(0, 20) + '...',
      clientId: process.env.AIRBYTE_CLIENT_ID,
      workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
      apiUrl: 'https://api.airbyte.com'
    }
    
    return NextResponse.json({
      success: true,
      tokenInfo,
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.success).length,
        failed: tests.filter(t => !t.success).length
      },
      recommendations: generateRecommendations(tests)
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to run debug tests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function testEndpoint(
  method: string,
  url: string,
  token: string,
  params?: Record<string, any>,
  body?: any
): Promise<{
  success: boolean
  status?: number
  error?: string
  response?: any
}> {
  try {
    // Build URL with params, filtering out undefined values
    let finalUrl = url
    if (params) {
      const validParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
      
      if (Object.keys(validParams).length > 0) {
        finalUrl = `${url}?${new URLSearchParams(validParams).toString()}`
      }
    }
      
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(finalUrl, options)
    const responseText = await response.text()
    
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }
    
    return {
      success: response.ok,
      status: response.status,
      error: !response.ok ? responseData?.message || responseData?.error || response.statusText : undefined,
      response: response.ok ? responseData : undefined
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

function generateRecommendations(tests: any[]): string[] {
  const recommendations = []
  
  const workspaceTest = tests.find(t => t.name === 'List Workspaces')
  if (!workspaceTest?.success) {
    recommendations.push('❌ Cannot access workspaces - check if your client credentials are valid')
    recommendations.push('💡 Try regenerating your API credentials in Airbyte Cloud')
  }
  
  const specificWorkspaceTest = tests.find(t => t.name === 'Get Specific Workspace')
  if (workspaceTest?.success && !specificWorkspaceTest?.success) {
    recommendations.push('❌ Cannot access the configured workspace - AIRBYTE_WORKSPACE_ID might be wrong')
    recommendations.push('💡 Check the workspaces list to find your correct workspace ID')
  }
  
  const oauthTests = tests.filter(t => t.name.includes('OAuth'))
  if (oauthTests.every(t => !t.success)) {
    recommendations.push('❌ OAuth endpoints are not accessible')
    recommendations.push('💡 OAuth might require additional setup in Airbyte Cloud')
    recommendations.push('💡 Consider using Airbyte OSS locally for easier development')
  }
  
  if (tests.every(t => t.status === 401)) {
    recommendations.push('🔐 All requests return 401 - authentication is failing')
    recommendations.push('💡 Verify AIRBYTE_CLIENT_ID and AIRBYTE_CLIENT_SECRET are correct')
  }
  
  if (tests.some(t => t.success)) {
    recommendations.push('✅ Some API endpoints are working - authentication is partially functional')
  }
  
  return recommendations
}