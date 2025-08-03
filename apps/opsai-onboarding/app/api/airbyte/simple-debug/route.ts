import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results: any[] = []
  
  // Test 1: Check environment variables
  results.push({
    test: 'Environment Variables',
    clientId: process.env.AIRBYTE_CLIENT_ID ? '✅ Set' : '❌ Missing',
    clientSecret: process.env.AIRBYTE_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
    workspaceId: process.env.AIRBYTE_WORKSPACE_ID || 'Not set',
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set'
  })
  
  // Test 2: Try to get token
  try {
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
        })
      }
    )
    
    const tokenData = await tokenResponse.json()
    
    if (tokenResponse.ok && tokenData.access_token) {
      results.push({
        test: 'Token Generation',
        status: '✅ Success',
        tokenPreview: tokenData.access_token.substring(0, 30) + '...',
        expiresIn: tokenData.expires_in + ' seconds'
      })
      
      // Test 3: Try a simple API call
      const apiResponse = await fetch('https://api.airbyte.com/v1/workspaces', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      })
      
      const apiData = await apiResponse.json()
      
      results.push({
        test: 'API Access',
        endpoint: '/v1/workspaces',
        status: apiResponse.status,
        success: apiResponse.ok,
        data: apiResponse.ok ? apiData : apiData.message || apiData.error || 'Failed'
      })
      
    } else {
      results.push({
        test: 'Token Generation',
        status: '❌ Failed',
        error: tokenData.error || tokenData.error_description || 'Unknown error'
      })
    }
  } catch (error) {
    results.push({
      test: 'Network/Token Error',
      status: '❌ Failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  // Recommendations
  const recommendations = []
  if (!process.env.AIRBYTE_CLIENT_ID || !process.env.AIRBYTE_CLIENT_SECRET) {
    recommendations.push('Add AIRBYTE_CLIENT_ID and AIRBYTE_CLIENT_SECRET to .env.local')
  }
  if (!results.some(r => r.test === 'Token Generation' && r.status === '✅ Success')) {
    recommendations.push('Check your Airbyte Cloud credentials are correct')
    recommendations.push('Regenerate API credentials in Airbyte Cloud settings')
  }
  
  return NextResponse.json({
    success: true,
    results,
    recommendations
  })
}