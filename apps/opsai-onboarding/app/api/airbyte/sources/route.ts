import { NextRequest, NextResponse } from 'next/server'

// Fetch available Airbyte sources
export async function GET() {
  try {
    // Check if environment variables are configured
    if (!process.env.AIRBYTE_API_KEY || !process.env.AIRBYTE_WORKSPACE_ID) {
      console.error('❌ Airbyte API not configured')
      return NextResponse.json(
        { 
          error: 'Airbyte API not configured. Please set AIRBYTE_API_KEY and AIRBYTE_WORKSPACE_ID environment variables.',
          requiresSetup: true 
        },
        { status: 400 }
      )
    }

    console.log('🔗 Fetching Airbyte source definitions...')
    const response = await fetch(`${process.env.AIRBYTE_API_URL}/connector_definitions?workspaceId=${process.env.AIRBYTE_WORKSPACE_ID}&actorType=source&type=source`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Airbyte API failed (${response.status}):`, errorText)
      
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Airbyte API token expired or invalid. Please refresh your API key in Airbyte Cloud dashboard.',
            requiresTokenRefresh: true,
            status: response.status
          },
          { status: 401 }
        )
      }
      
      if (response.status === 403) {
        return NextResponse.json(
          { 
            error: 'Airbyte API access forbidden. Please ensure your API key has proper permissions for workspace access.',
            requiresPermissionFix: true,
            status: response.status,
            suggestions: [
              'Check that your API key has workspace access permissions',
              'Verify the workspace ID is correct',
              'Try regenerating the API key with full permissions'
            ]
          },
          { status: 403 }
        )
      }
      
      throw new Error(`Failed to fetch sources: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`✅ Retrieved ${data.data?.length || 0} Airbyte connectors`)
    
    // Filter and format sources - new API structure
    const sources = data.data
      .filter((source: any) => source.connectorDefinitionType === 'source')
      .map((source: any) => ({
        sourceDefinitionId: source.id,
        name: source.name,
        dockerRepository: source.dockerRepository,
        dockerImageTag: source.dockerImageTag,
        documentationUrl: source.documentationUrl,
        icon: source.icon,
        sourceType: source.sourceType || source.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        releaseStage: source.releaseStage || 'generally_available', // Default if not specified
        version: source.version
      }))
      .sort((a: any, b: any) => {
        // Sort by name alphabetically
        return a.name.localeCompare(b.name)
      })

    return NextResponse.json({ sources })
  } catch (error) {
    console.error('Error fetching Airbyte sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available sources' },
      { status: 500 }
    )
  }
}