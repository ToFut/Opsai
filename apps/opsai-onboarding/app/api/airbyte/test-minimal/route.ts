import { NextRequest, NextResponse } from 'next/server'
import { tokenManager } from '@/lib/airbyte-token-manager'

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID
    const apiKey = await tokenManager.getValidToken()
    
    if (!apiKey || !workspaceId) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    // Create the absolute minimum request
    const requestBody = {
      sourceDefinitionId: 'decd338e-5647-4c0b-adf4-da0e75f5a750',
      connectionConfiguration: {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: 'password',
        schemas: ['public'],
        ssl_mode: {
          mode: 'prefer'
        },
        replication_method: {
          method: 'Standard'
        },
        tunnel_method: {
          tunnel_method: 'NO_TUNNEL'
        }
      },
      workspaceId: workspaceId,
      name: `postgres-test-${Date.now()}`
    }

    console.log('🚀 Minimal test request:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${apiUrl}/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Airbyte-Client/1.0'
      },
      body: JSON.stringify(requestBody)
    })

    const responseText = await response.text()
    console.log(`📥 Response ${response.status}:`, responseText)

    if (!response.ok) {
      // Try to understand the error better
      let errorDetails
      try {
        errorDetails = JSON.parse(responseText)
      } catch {
        errorDetails = responseText
      }

      return NextResponse.json({
        error: 'Failed to create source',
        status: response.status,
        details: errorDetails,
        request: {
          endpoint: `${apiUrl}/sources`,
          body: requestBody
        }
      }, { status: response.status })
    }

    const data = JSON.parse(responseText)
    return NextResponse.json({
      success: true,
      source: data
    })

  } catch (error) {
    console.error('Test failed:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}