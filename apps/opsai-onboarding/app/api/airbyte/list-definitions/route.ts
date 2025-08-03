import { NextRequest, NextResponse } from 'next/server'
import { tokenManager } from '@/lib/airbyte-token-manager'

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
    const workspaceId = process.env.AIRBYTE_WORKSPACE_ID
    const apiKey = await tokenManager.getValidToken()
    
    if (!apiKey || !workspaceId) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    console.log('📋 Listing source definitions...')

    // Try to list source definitions for the workspace
    const response = await fetch(`${apiUrl}/source_definition_specifications`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to list definitions:', error)
      
      // Try alternative endpoint
      const altResponse = await fetch(`${apiUrl}/workspaces/${workspaceId}/source_definitions`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      })
      
      if (altResponse.ok) {
        const data = await altResponse.json()
        return NextResponse.json({
          source: 'workspace-specific',
          definitions: data
        })
      }
      
      return NextResponse.json({
        error: 'Failed to list definitions',
        status: response.status,
        details: error
      }, { status: response.status })
    }

    const data = await response.json()
    
    // Find PostgreSQL
    const postgres = data.sourceDefinitionSpecifications?.find(
      (def: any) => def.sourceDefinitionId === 'decd338e-5647-4c0b-adf4-da0e75f5a750'
    )

    return NextResponse.json({
      totalDefinitions: data.sourceDefinitionSpecifications?.length || 0,
      postgresFound: !!postgres,
      postgresSpec: postgres,
      sampleDefinitions: data.sourceDefinitionSpecifications?.slice(0, 3).map((def: any) => ({
        id: def.sourceDefinitionId,
        name: def.documentationUrl
      }))
    })

  } catch (error) {
    console.error('List failed:', error)
    return NextResponse.json({
      error: 'List failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}