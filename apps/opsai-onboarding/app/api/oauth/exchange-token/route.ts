import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

// Use Airbyte's OAuth system
const AIRBYTE_API_URL = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
const AIRBYTE_API_KEY = process.env.AIRBYTE_API_KEY
const AIRBYTE_WORKSPACE_ID = process.env.AIRBYTE_WORKSPACE_ID

export async function POST(request: NextRequest) {
  try {
    const { code, provider, tenantId, redirectUri } = await request.json()

    if (!code || !provider || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check if Airbyte API is configured - no demo mode
    if (!AIRBYTE_API_KEY || !AIRBYTE_WORKSPACE_ID) {
      console.error('❌ Airbyte API not configured')
      return NextResponse.json(
        { 
          error: 'Airbyte API not configured. Please set AIRBYTE_API_KEY and AIRBYTE_WORKSPACE_ID environment variables.',
          requiresSetup: true 
        },
        { status: 400 }
      )
    }

    try {
      // Get source definition ID for provider
      const AIRBYTE_SOURCE_DEFINITIONS: Record<string, string> = {
        'google-analytics': '3cc2ebd2-a319-477e-8dd5-4a2db3ac6e4c',
        'google_analytics': '3cc2ebd2-a319-477e-8dd5-4a2db3ac6e4c',
        'shopify': '9da77001-af33-4bcd-be46-6252bf9342b9',
        'stripe': 'e094cb9a-26de-4645-8761-65c0c425d1de',
        'salesforce': 'b117307c-14b6-41aa-9422-947e34922643',
        'hubspot': '36c891d9-4bd9-43ac-bad2-10e12756272c',
        'facebook-marketing': '9da77001-af33-4bcd-be46-6252bf9342b9',
        'google-ads': 'a0bb7e1d-ca9a-4e37-9c9f-9c6f0dc5f8c3',
        'slack': '445831eb-78db-4b54-8c5c-3d4b4b2e5c6d',
        'mailchimp': 'b03a9f3e-22a5-11eb-adc1-0242ac120002',
        'github': 'ef69ef6e-aa7f-4af1-a01d-ef775033524e'
      }
      
      const sourceDefinitionId = AIRBYTE_SOURCE_DEFINITIONS[provider.toLowerCase().replace('_', '-')]

      if (!sourceDefinitionId) {
        console.error(`❌ No source definition ID for provider: ${provider}`)
        return NextResponse.json(
          { error: `Source definition not found for ${provider}` },
          { status: 400 }
        )
      }

      console.log(`🔄 Completing OAuth for ${provider} with code: ${code.substring(0, 20)}...`)
      
      // Use Airbyte's OAuth completion endpoint
      const oauthConfig = getProviderOAuthConfig(provider)
      const requestBody = {
        workspaceId: AIRBYTE_WORKSPACE_ID,
        sourceDefinitionId: sourceDefinitionId,
        authorizationCode: code,
        redirectUri: redirectUri || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7250'}/oauth-success`,
        oAuthInputConfiguration: oauthConfig
      }
      
      console.log(`📤 Sending OAuth completion request:`, {
        ...requestBody,
        authorizationCode: code.substring(0, 20) + '...'
      })

      const completeOAuthResponse = await fetch(`${AIRBYTE_API_URL}/sources/oAuth/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRBYTE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'OpsAI-Platform/1.0'
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log(`📡 OAuth completion response status: ${completeOAuthResponse.status}`)

      if (!completeOAuthResponse.ok) {
        const error = await completeOAuthResponse.json()
        console.error(`❌ Airbyte OAuth completion failed:`, error)
        return NextResponse.json(
          { error: `OAuth completion failed: ${error.message || 'Unknown error'}` },
          { status: 400 }
        )
      }

      const oauthResult = await completeOAuthResponse.json()

      console.log('✅ OAuth completion successful')
      
      // Create source with OAuth credentials
      const sourceName = `${provider}-${tenantId}-${Date.now()}`
      const sourceConfig = {
        ...oauthConfig,
        ...oauthResult
      }
      
      console.log(`📊 Creating Airbyte source: ${sourceName}`)
      
      const createSourceResponse = await fetch(`${AIRBYTE_API_URL}/sources`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRBYTE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'OpsAI-Platform/1.0'
        },
        body: JSON.stringify({
          workspaceId: AIRBYTE_WORKSPACE_ID,
          name: sourceName,
          sourceDefinitionId: sourceDefinitionId,
          connectionConfiguration: sourceConfig
        })
      })
      
      console.log(`📡 Source creation response status: ${createSourceResponse.status}`)

      if (!createSourceResponse.ok) {
        const error = await createSourceResponse.json()
        console.error('❌ Failed to create Airbyte source:', error)
        return NextResponse.json(
          { error: `Failed to create source: ${error.message || 'Unknown error'}` },
          { status: 400 }
        )
      }

      const source = await createSourceResponse.json()

      // Test the connection
      const testResponse = await fetch(`${AIRBYTE_API_URL}/sources/check_connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRBYTE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceId: source.sourceId
        })
      })

      const testResult = await testResponse.json()

      if (testResult.status !== 'succeeded') {
        console.error('❌ Airbyte connection test failed:', testResult)
        return NextResponse.json(
          { error: `Connection test failed: ${testResult.message || 'Unknown error'}` },
          { status: 400 }
        )
      }

      // Create connection record
      const connection = {
        sourceId: source.sourceId,
        sourceName: provider,
        status: 'connected' as const,
        lastSync: new Date(),
        recordsExtracted: 0 // Will be updated after first sync
      }

      // Store in database if Supabase is configured
      if (supabase) {
        try {
          await supabase!
            .from('tenant_airbyte_connections')
            .insert({
              tenant_id: tenantId,
              source_id: source.sourceId,
              source_name: provider,
              source_type: provider,
              connection_config: {
                airbyte_source_id: source.sourceId,
                oauth_completed: true,
                status: 'connected',
                created_at: new Date().toISOString()
              },
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        } catch (dbError) {
          console.warn('⚠️ Failed to store connection in database:', dbError)
          // Continue without storing in DB
        }
      }

      return NextResponse.json({
        success: true,
        provider,
        accountName: `${provider} Account`,
        connection,
        airbyte: true
      })

    } catch (airbyteError) {
      console.error('❌ Airbyte OAuth process failed:', airbyteError)
      return NextResponse.json(
        { error: `Airbyte OAuth process failed: ${airbyteError instanceof Error ? airbyteError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('OAuth token exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get provider-specific OAuth configuration
function getProviderOAuthConfig(provider: string): Record<string, any> {
  const now = new Date()
  const startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  const isoStartDate = startDate.toISOString().split('T')[0]
  
  const providerConfigs: Record<string, Record<string, any>> = {
    'google-analytics': {
      property_ids: [],
      start_date: isoStartDate,
      custom_reports_array: []
    },
    'google_analytics': {
      property_ids: [], 
      start_date: isoStartDate,
      custom_reports_array: []
    },
    'shopify': {
      start_date: isoStartDate,
      shop: ''
    },
    'stripe': {
      start_date: isoStartDate,
      lookback_window_days: 7,
      slice_range: 365
    },
    'salesforce': {
      start_date: `${isoStartDate}T00:00:00Z`,
      is_sandbox: false,
      streams_criteria: []
    },
    'hubspot': {
      start_date: `${isoStartDate}T00:00:00Z`,
      credentials: {
        credentials_title: 'OAuth Credentials'
      }
    },
    'facebook-marketing': {
      start_date: isoStartDate,
      end_date: now.toISOString().split('T')[0],
      account_ids: [],
      include_deleted: false
    },
    'google-ads': {
      start_date: isoStartDate,
      end_date: now.toISOString().split('T')[0],
      customer_id: '',
      conversion_window_days: 14
    },
    'slack': {
      start_date: `${isoStartDate}T00:00:00Z`,
      lookback_window: 7,
      join_channels: true
    },
    'mailchimp': {
      start_date: `${isoStartDate}T00:00:00Z`
    },
    'github': {
      start_date: `${isoStartDate}T00:00:00Z`,
      repositories: [],
      page_size_for_large_streams: 100
    }
  }

  return providerConfigs[provider.toLowerCase()] || {
    start_date: isoStartDate
  }
}

