import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get fresh token using client credentials
    const tokenResponse = await fetch('https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AIRBYTE_CLIENT_ID || '',
        client_secret: process.env.AIRBYTE_CLIENT_SECRET || '',
        scope: 'openid email profile'
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to get token')
    }

    const tokenData = await tokenResponse.json()
    const freshToken = tokenData.access_token

    console.log('✅ Got fresh token')

    // Now test creating a simple PostgreSQL source
    const createResponse = await fetch('https://api.airbyte.com/v1/sources', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${freshToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
        name: `test-postgres-direct-${Date.now()}`,
        sourceDefinitionId: 'decd338e-5647-4c0b-adf4-da0e75f5a750',
        connectionConfiguration: {
          host: 'test.example.com',
          port: 5432,
          database: 'testdb',
          username: 'testuser',
          password: 'testpass',
          schemas: ['public'],
          ssl_mode: { mode: 'prefer' },
          replication_method: { method: 'Standard' },
          tunnel_method: { tunnel_method: 'NO_TUNNEL' }
        }
      })
    })

    const responseText = await createResponse.text()
    console.log('Response:', createResponse.status, responseText)

    return NextResponse.json({
      tokenObtained: true,
      createStatus: createResponse.status,
      createResponse: responseText,
      success: createResponse.ok
    })

  } catch (error) {
    console.error('Direct test failed:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}