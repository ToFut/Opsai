import { NextRequest, NextResponse } from 'next/server'
import { tokenManager } from '@/lib/airbyte-token-manager'

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
    const apiKey = await tokenManager.getValidToken()
    
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key' }, { status: 400 })
    }

    // Get PostgreSQL source definition to see required fields
    const postgresDefId = 'decd338e-5647-4c0b-adf4-da0e75f5a750'
    
    console.log('🔍 Fetching PostgreSQL source definition...')
    
    const response = await fetch(`${apiUrl}/source_definitions/${postgresDefId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({
        error: 'Failed to get source definition',
        status: response.status,
        details: error
      }, { status: response.status })
    }

    const definition = await response.json()
    
    // Extract connection specification
    const spec = definition.connectionSpecification || {}
    const properties = spec.properties || {}
    
    // Get required fields
    const required = spec.required || []
    
    // Build example configuration
    const exampleConfig: any = {}
    
    for (const [key, prop] of Object.entries(properties)) {
      const property = prop as any
      if (required.includes(key)) {
        // Set example values based on type
        if (property.type === 'string') {
          exampleConfig[key] = property.default || 'example-value'
        } else if (property.type === 'integer') {
          exampleConfig[key] = property.default || 5432
        } else if (property.type === 'array') {
          exampleConfig[key] = property.default || []
        } else if (property.type === 'object' && property.oneOf) {
          // Handle oneOf properties (like ssl_mode)
          exampleConfig[key] = property.oneOf[0].properties || {}
        }
      }
    }

    return NextResponse.json({
      sourceDefinitionId: postgresDefId,
      name: definition.name,
      dockerRepository: definition.dockerRepository,
      connectionSpecification: {
        required: required,
        properties: Object.keys(properties),
        exampleConfiguration: exampleConfig
      },
      fullSpec: spec
    })

  } catch (error) {
    console.error('Schema inspection failed:', error)
    return NextResponse.json({
      error: 'Failed to inspect schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}