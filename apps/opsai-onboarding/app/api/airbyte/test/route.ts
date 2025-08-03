import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🧪 Testing Airbyte API connection...')
  
  const config = {
    apiUrl: process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1',
    apiKey: process.env.AIRBYTE_API_KEY,
    workspaceId: process.env.AIRBYTE_WORKSPACE_ID
  }

  console.log('Config:', {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey ? 'Set' : 'NOT SET',
    workspaceId: config.workspaceId || 'NOT SET'
  })

  if (!config.apiKey || !config.workspaceId) {
    return NextResponse.json({
      error: 'Missing Airbyte configuration',
      config: {
        apiKey: !!config.apiKey,
        workspaceId: !!config.workspaceId
      },
      instructions: 'Add AIRBYTE_API_KEY and AIRBYTE_WORKSPACE_ID to .env.local'
    }, { status: 400 })
  }

  try {
    // Test 1: Get workspace info
    console.log('📡 Calling Airbyte API...')
    const response = await fetch(`${config.apiUrl}/workspaces/${config.workspaceId}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json'
      }
    })

    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', errorText)
      return NextResponse.json({
        error: 'Airbyte API error',
        status: response.status,
        details: errorText
      }, { status: response.status })
    }

    const workspace = await response.json()

    // Test 2: List source definitions
    const sourcesResponse = await fetch(`${config.apiUrl}/source_definitions`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json'
      }
    })

    const sourcesData = await sourcesResponse.json()

    return NextResponse.json({
      success: true,
      workspace: {
        workspaceId: workspace.workspaceId,
        name: workspace.name
      },
      sourceDefinitions: {
        count: sourcesData.sourceDefinitions?.length || 0,
        sample: sourcesData.sourceDefinitions?.slice(0, 3).map((s: any) => s.name) || []
      }
    })

  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}