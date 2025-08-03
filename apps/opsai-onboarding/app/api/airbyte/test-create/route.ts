import { NextRequest, NextResponse } from 'next/server'
import { tokenManager } from '@/lib/airbyte-token-manager'

export async function POST(request: NextRequest) {
  try {
    const { sourceType = 'postgres' } = await request.json()
    
    const apiUrl = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID
    
    // Get valid token
    const apiKey = await tokenManager.getValidToken()
    
    if (!apiKey || !workspaceId) {
      return NextResponse.json({
        error: 'Missing credentials',
        setup: 'Check AIRBYTE_CLIENT_ID, AIRBYTE_CLIENT_SECRET, and AIRBYTE_WORKSPACE_ID'
      }, { status: 400 })
    }

    // Test creating a simple Postgres source
    // Try minimal configuration first
    const requestBody = {
      sourceDefinitionId: 'decd338e-5647-4c0b-adf4-da0e75f5a750', // Postgres
      workspaceId: workspaceId,
      name: `test-${sourceType}-${Date.now()}`,
      configuration: {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: 'password'
      }
    }

    console.log('📤 Creating test source:', JSON.stringify(requestBody, null, 2))

    // Try both endpoints to see which works
    const endpoints = [
      `${apiUrl}/sources`,
      `${apiUrl}/workspaces/${workspaceId}/sources`
    ]
    
    let response
    let lastError
    
    for (const endpoint of endpoints) {
      console.log(`🔗 Trying endpoint: ${endpoint}`)
      
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        console.log(`✅ Success with endpoint: ${endpoint}`)
        break
      } else {
        lastError = await response.text()
        console.log(`❌ Failed with ${response.status}: ${lastError}`)
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json({
        error: 'API error',
        status: response?.status || 500,
        details: lastError || 'No response',
        request: requestBody,
        triedEndpoints: endpoints
      }, { status: response?.status || 500 })
    }

    const responseText = await response.text()
    console.log('📥 Response:', response.status, responseText)
    
    const data = JSON.parse(responseText)
    
    return NextResponse.json({
      success: true,
      sourceId: data.sourceId,
      source: data,
      message: 'Test source created successfully!'
    })

  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}