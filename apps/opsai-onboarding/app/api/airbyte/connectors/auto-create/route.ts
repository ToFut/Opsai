import { NextRequest, NextResponse } from 'next/server'
import { createAutoConnector } from '../../../../../lib/airbyte-auto-connector'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tenantId, 
      apiUrl, 
      apiName,
      authType,
      authConfig,
      endpoints,
      openApiUrl,
      autoDiscover = false
    } = body

    // Validate required fields
    if (!tenantId || !apiUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId and apiUrl' },
        { status: 400 }
      )
    }

    // Initialize auto-connector
    const autoConnector = createAutoConnector({
      apiKey: process.env.AIRBYTE_API_KEY,
      workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
      baseUrl: process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
    })

    let apiSpec

    // Auto-discover API if requested
    if (autoDiscover) {
      console.log(`🔍 Auto-discovering API endpoints for ${apiUrl}`)
      apiSpec = await autoConnector.discoverAPIEndpoints(apiUrl, {
        openApiUrl: openApiUrl,
        headers: authConfig?.headers || {}
      })

      // Override with user-provided values if available
      if (apiName) apiSpec.name = apiName
      if (authType) {
        apiSpec.authentication = {
          type: authType,
          ...authConfig
        }
      }
      if (endpoints && endpoints.length > 0) {
        apiSpec.endpoints = endpoints
      }
    } else {
      // Build API spec from provided data
      apiSpec = {
        name: apiName || new URL(apiUrl).hostname.replace(/\./g, '_'),
        baseUrl: apiUrl,
        authentication: {
          type: authType || 'api_key',
          ...authConfig
        },
        endpoints: endpoints || [],
        rateLimit: {
          requestsPerMinute: 60
        }
      }
    }

    console.log('📋 Generated API Specification:', JSON.stringify(apiSpec, null, 2))

    // Create the custom connector
    const { connectorId, manifest } = await autoConnector.createConnectorFromAPI(apiSpec)

    console.log(`✅ Created custom connector: ${connectorId}`)

    // Store connector info in database
    const { data: connector, error: dbError } = await supabase
      .from('custom_connectors')
      .insert({
        tenant_id: tenantId,
        connector_id: connectorId,
        name: apiSpec.name,
        api_url: apiUrl,
        auth_type: apiSpec.authentication.type,
        manifest: manifest,
        api_spec: apiSpec,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Failed to store connector in database:', dbError)
      // Continue anyway - connector is created in Airbyte
    }

    // Return success response
    return NextResponse.json({
      success: true,
      connectorId,
      connector: {
        id: connectorId,
        name: apiSpec.name,
        apiUrl: apiUrl,
        authType: apiSpec.authentication.type,
        endpoints: apiSpec.endpoints.map(e => ({
          name: e.name,
          path: e.path,
          method: e.method
        })),
        manifest: manifest
      },
      message: `Successfully created custom connector for ${apiSpec.name}`,
      nextSteps: [
        'Use the connectorId to create a source instance',
        'Configure authentication credentials',
        'Test the connection',
        'Set up data sync schedules'
      ]
    })

  } catch (error) {
    console.error('❌ Error creating auto-connector:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create auto-connector',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check your API URL and authentication settings'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to list custom connectors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameter: tenantId' },
        { status: 400 }
      )
    }

    // Fetch custom connectors from database
    const { data: connectors, error } = await supabase
      .from('custom_connectors')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      connectors: connectors || [],
      count: connectors?.length || 0
    })

  } catch (error) {
    console.error('Error fetching custom connectors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom connectors' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove a custom connector
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const connectorId = searchParams.get('connectorId')
    const tenantId = searchParams.get('tenantId')

    if (!connectorId || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameters: connectorId and tenantId' },
        { status: 400 }
      )
    }

    // Delete from database
    const { error } = await supabase
      .from('custom_connectors')
      .delete()
      .eq('connector_id', connectorId)
      .eq('tenant_id', tenantId)

    if (error) {
      throw error
    }

    // Note: We don't delete from Airbyte as it might be used by other sources
    // The connector definition remains available in Airbyte

    return NextResponse.json({
      success: true,
      message: `Custom connector ${connectorId} removed successfully`
    })

  } catch (error) {
    console.error('Error deleting custom connector:', error)
    return NextResponse.json(
      { error: 'Failed to delete custom connector' },
      { status: 500 }
    )
  }
}