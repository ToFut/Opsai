import { NextRequest, NextResponse } from 'next/server'
import { tokenManager } from '@/lib/airbyte-token-manager'

export async function GET(request: NextRequest) {
  try {
    const token = await tokenManager.getValidToken()
    const baseUrl = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID
    
    console.log('🔍 Debug Info:')
    console.log('Base URL:', baseUrl)
    console.log('Workspace ID:', workspaceId)
    console.log('Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN')
    
    // Test basic API access
    const testEndpoints = [
      `/workspaces/${workspaceId}`,
      '/source_definitions',
      '/sources'
    ]
    
    const results: any[] = []
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
        
        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        })
      } catch (error) {
        results.push({
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      config: {
        baseUrl,
        workspaceId,
        hasToken: !!token
      },
      endpointTests: results,
      possibleIssues: [
        'Token might be expired - check /api/airbyte/refresh-token',
        'Workspace ID might not match the token',
        'API endpoint format might have changed'
      ]
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}