import { NextRequest, NextResponse } from 'next/server'
import { AirbyteTokenManager } from '@/lib/airbyte-token-manager'

export async function POST(request: NextRequest) {
  try {
    const { sourceType, credentials } = await request.json()
    
    // Get fresh Airbyte token
    const tokenManager = AirbyteTokenManager.getInstance()
    const token = await tokenManager.getValidToken()
    
    // Map source types to Airbyte source definition IDs
    const sourceDefinitionMap: Record<string, string> = {
      'github': 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
      'google-sheets': '71607ba1-c0ac-4799-8049-7f4b90dd50f7',
      'shopify': '9da77142-a95c-4f1a-8f4b-d4f0e5e4b1e3',
      'stripe': 'e094cb9a-26de-4645-8761-65c0c425d1de',
      'postgres': 'decd338e-5647-4c0b-adf4-da0e75f5a750',
      'mysql': '435bb9a5-7887-4809-aa58-28c27df0d7ad'
    }
    
    const sourceDefinitionId = sourceDefinitionMap[sourceType]
    if (!sourceDefinitionId) {
      return NextResponse.json({
        error: `Unknown source type: ${sourceType}`
      }, { status: 400 })
    }
    
    // Create source configuration based on type
    let configuration: any = {}
    
    switch (sourceType) {
      case 'github':
        configuration = {
          credentials: {
            option_title: 'PAT Credentials',
            personal_access_token: credentials.token
          },
          repository: credentials.repository || '*/*',
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
        
      case 'mysql':
        configuration = {
          host: credentials.host,
          port: credentials.port || 3306,
          database: credentials.database,
          username: credentials.username,
          password: credentials.password,
          ssl_method: { ssl_method: 'preferred' }
        }
        break
        
      default:
        return NextResponse.json({
          error: 'Configuration not implemented for this source type'
        }, { status: 400 })
    }
    
    // Create the source
    const createResponse = await fetch('https://api.airbyte.com/v1/sources', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: `${sourceType}-${Date.now()}`,
        workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
        configuration: {
          sourceType: sourceDefinitionId,
          ...configuration
        }
      })
    })
    
    const responseText = await createResponse.text()
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw: responseText }
    }
    
    if (!createResponse.ok) {
      return NextResponse.json({
        error: 'Failed to create source',
        status: createResponse.status,
        details: responseData
      }, { status: createResponse.status })
    }
    
    // Test the connection
    const testResponse = await fetch(
      `https://api.airbyte.com/v1/sources/${responseData.sourceId}/check_connection`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )
    
    const testResult = await testResponse.json()
    
    return NextResponse.json({
      success: true,
      sourceId: responseData.sourceId,
      connectionTest: testResult,
      source: responseData
    })
    
  } catch (error) {
    console.error('Direct source creation error:', error)
    return NextResponse.json({
      error: 'Failed to create source',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}