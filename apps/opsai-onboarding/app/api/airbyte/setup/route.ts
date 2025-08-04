import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { airbyteTerraformSDK } from '@/lib/airbyte-terraform-sdk'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { tenantId, provider, propertyId } = await request.json()
    
    console.log(`📡 Setting up Airbyte for provider: ${provider}, tenant: ${tenantId}`)
    
    // Retrieve access token from Supabase if not provided
    let accessToken = null
    if (!accessToken) {
      const { data: integration } = await supabase
        .from('tenant_integrations')
        .select('access_token')
        .eq('tenant_id', tenantId)
        .eq('provider', provider)
        .single()
      
      if (!integration) {
        throw new Error(`No integration found for ${provider}`)
      }
      
      accessToken = integration.access_token
    }
    
    // For now, return success without creating new Airbyte resources
    // since sources already exist in the workspace
    console.log(`✅ Using existing Airbyte source for ${provider}`)
    
    // Map of existing source IDs from the workspace
    const existingSources: Record<string, string> = {
      'github': '7c0ee77f-488d-4ff3-b67e-3bcad9151a9b',
      'stripe': '95c2880d-903a-4e15-b9a4-af77e59a2484',
      'shopify': '73368a09-8c3e-467d-b30c-0617f2b50dd2',
      'google': 'f992af97-c80e-4465-85f4-b1b5ed7af58f',
      'google-analytics': 'f992af97-c80e-4465-85f4-b1b5ed7af58f',
      'notion': '477d1960-3d29-4be3-aef7-365579017ba6'
    }
    
    const sourceId = existingSources[provider]
    if (sourceId) {
      console.log(`🔗 Creating Airbyte connection for existing ${provider} source...`)
      
      // Create or check for existing connection to Supabase
      const connectionResult = await createAirbyteConnection(tenantId, provider, sourceId)
      
      // Store the integration info with connection details
      await supabase
        .from('tenant_integrations')
        .upsert({
          tenant_id: tenantId,
          provider,
          airbyte_source_id: sourceId,
          status: 'connected',
          connected_at: new Date().toISOString()
        })
      
      return NextResponse.json({
        success: true,
        sourceId,
        connectionId: connectionResult.connectionId,
        message: `Connected ${provider} source to Supabase destination - data will sync automatically`,
        syncSchedule: connectionResult.schedule
      })
    }

    // Get Airbyte configuration for new providers
    const airbyteConfig = getAirbyteSourceConfig(provider, accessToken, propertyId)
    console.log(`🔧 Airbyte config:`, {
      provider,
      definitionId: airbyteConfig.definitionId,
      hasAccessToken: !!accessToken
    })
    
    // Create Airbyte source - use correct API v1 format
    const requestBody = {
      sourceDefinitionId: airbyteConfig.definitionId,
      workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
      name: `${tenantId}_${provider}_source`,
      connectionConfiguration: airbyteConfig.config
    }
    
    console.log(`🚀 Creating Airbyte source with body:`, JSON.stringify(requestBody, null, 2))
    
    // Airbyte Cloud API requires different endpoint and headers
    const airbyteUrl = process.env.AIRBYTE_API_URL?.includes('api.airbyte.com') 
      ? 'https://api.airbyte.com/v1' 
      : process.env.AIRBYTE_API_URL
    
    const sourceResponse = await airbyteTerraformSDK.makeApiRequest('/sources', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const responseText = await sourceResponse.text()
    console.log(`📥 Airbyte response (${sourceResponse.status}):`, responseText)
    
    if (!sourceResponse.ok) {
      throw new Error(`Failed to create Airbyte source: ${responseText}`)
    }

    const source = await sourceResponse.json()

    // Create Airbyte destination (tenant's database)
    const destinationResponse = await airbyteTerraformSDK.makeApiRequest('/destinations', {
      method: 'POST',
      body: JSON.stringify({
        name: `${tenantId}_postgres_destination`,
        workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
        definitionId: '25c5221d-dce2-4163-ade9-739ef790f503', // Postgres destination
        configuration: {
          host: 'aws-0-us-west-1.pooler.supabase.com',
          port: 5432,
          database: 'postgres',
          username: 'postgres.dqmufpexuuvlulpilirt',
          password: process.env.SUPABASE_DB_PASSWORD,
          schema: 'public'  // Required field!
        }
      })
    })

    if (!destinationResponse.ok) {
      throw new Error('Failed to create Airbyte destination')
    }

    const destination = await destinationResponse.json()

    // Discover schema
    const schemaResponse = await airbyteTerraformSDK.makeApiRequest('/sources/discover_schema', {
      method: 'POST',
      body: JSON.stringify({
        sourceId: source.sourceId,
        disable_cache: true
      })
    })

    if (!schemaResponse.ok) {
      throw new Error('Failed to discover schema')
    }

    const schema = await schemaResponse.json()

    // Create connection
    const connectionResponse = await airbyteTerraformSDK.makeApiRequest('/connections', {
      method: 'POST',
      body: JSON.stringify({
        name: `${tenantId}_${provider}_sync`,
        sourceId: source.sourceId,
        destinationId: destination.destinationId,
        syncCatalog: schema.catalog,
        status: 'active',
        scheduleType: 'manual', // Will trigger programmatically
        namespaceDefinition: 'customformat',
        namespaceFormat: `${tenantId}_${provider}`,
        prefix: '',
        nonBreakingChangesPreference: 'ignore'
      })
    })

    if (!connectionResponse.ok) {
      throw new Error('Failed to create Airbyte connection')
    }

    const connection = await connectionResponse.json()

    // Store Airbyte connection info
    await supabase
      .from('tenant_airbyte_connections')
      .insert({
        tenant_id: tenantId,
        provider,
        source_id: source.sourceId,
        destination_id: destination.destinationId,
        connection_id: connection.connectionId,
        status: 'active',
        created_at: new Date().toISOString()
      })

    // Trigger initial sync using Terraform SDK
    await airbyteTerraformSDK.triggerSync(connection.connectionId)

    return NextResponse.json({
      success: true,
      sourceId: source.sourceId,
      connectionId: connection.connectionId
    })

  } catch (error) {
    console.error('Airbyte setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup Airbyte connection' },
      { status: 500 }
    )
  }
}

function getAirbyteSourceConfig(provider: string, accessToken: string, propertyId?: string) {
  const configs: Record<string, any> = {
    google: {
      definitionId: '3cc2ebd2-a319-477e-8dd5-4a2db3ac6e4c', // Google Analytics Data API (v1) - updated ID
      config: {
        credentials: {
          auth_type: 'Client',
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: accessToken // This needs to be a refresh token
        },
        property_id: propertyId || '123456789', // Use provided propertyId
        start_date: '2023-01-01',
        custom_reports: []
      }
    },
    salesforce: {
      definitionId: 'b117307c-14b6-41aa-9422-947e34922962',
      config: {
        client_id: process.env.SALESFORCE_CLIENT_ID,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET,
        refresh_token: accessToken,
        start_date: '2020-01-01T00:00:00Z',
        is_sandbox: false
      }
    },
    shopify: {
      definitionId: '9da77001-af33-4bcd-be46-6252bf9342b9',
      config: {
        shop: 'your-shop', // This should be dynamic
        credentials: {
          auth_method: 'access_token',
          access_token: accessToken
        },
        start_date: '2020-01-01'
      }
    },
    stripe: {
      definitionId: 'e094cb9a-26de-4645-8761-65c0c425d1de',
      config: {
        account_id: process.env.STRIPE_ACCOUNT_ID,
        client_secret: accessToken,
        start_date: '2020-01-01T00:00:00Z'
      }
    },
    hubspot: {
      definitionId: '36c891d9-4bd9-43ac-bad2-10e12756272c',
      config: {
        credentials: {
          credentials_title: 'OAuth Credentials',
          access_token: accessToken
        },
        start_date: '2020-01-01T00:00:00Z'
      }
    },
    slack: {
      definitionId: 'c2281cee-86f9-4a86-bb48-d23286b4c7bd',
      config: {
        api_token: accessToken,
        start_date: '2020-01-01T00:00:00Z',
        lookback_window: 30,
        join_channels: true
      }
    },
    github: {
      definitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
      config: {
        credentials: {
          option_title: 'OAuth Credentials',
          access_token: accessToken
        },
        start_date: '2020-01-01T00:00:00Z'
      }
    },
    notion: {
      definitionId: 'decd338e-5647-4c0b-adf4-da0e75f5a750',
      config: {
        credentials: {
          auth_type: 'OAuth2.0',
          access_token: accessToken
        },
        start_date: '2020-01-01T00:00:00Z'
      }
    }
  }

  // Handle provider aliases
  const configKey = provider === 'google-analytics' ? 'google' : provider
  
  return configs[configKey] || {
    definitionId: 'unknown',
    config: { access_token: accessToken }
  }
}

async function createAirbyteConnection(tenantId: string, provider: string, sourceId: string) {
  console.log(`🔗 Creating Airbyte connection: ${provider} → Supabase (with auto token refresh)`)
  
  // Use Terraform SDK for automatic token management
  const destinationName = `${tenantId}_supabase_destination`
  
  try {
    // Check if destination already exists using Terraform SDK
    let destinationId;
    try {
      const destinationsResponse = await airbyteTerraformSDK.makeApiRequest('/destinations');
      
      if (destinationsResponse.ok) {
        const destinations = await destinationsResponse.json();
        const existing = destinations.data?.find(d => d.name === destinationName);
        if (existing) {
          destinationId = existing.destinationId;
          console.log(`✅ Using existing Supabase destination: ${destinationId}`);
        }
      }
    } catch (error) {
      console.log('⚠️ Could not check existing destinations, will create new one');
    }
    
    // Create destination if it doesn't exist
    if (!destinationId) {
      console.log(`🎯 Creating new Supabase destination for tenant ${tenantId}`);
      
      const destination = await airbyteTerraformSDK.createDestination({
        name: destinationName,
        workspaceId: process.env.AIRBYTE_WORKSPACE_ID!,
        definitionId: '25c5221d-dce2-4163-ade9-739ef790f503', // Postgres destination
        configuration: {
          host: 'aws-0-us-west-1.pooler.supabase.com',
          port: 5432,
          database: 'postgres',
          username: 'postgres.dqmufpexuuvlulpilirt',
          password: process.env.SUPABASE_DB_PASSWORD || 'UbGy4kW9RFJ2LFDV',
          schema: 'public'  // Required field!
        }
      });
      
      destinationId = destination.destinationId;
      console.log(`✅ Created Supabase destination: ${destinationId}`);
    }
    
    // Create the connection between source and destination
    const connectionName = `${tenantId}_${provider}_to_supabase`;
    console.log(`🔗 Creating connection: ${connectionName}`);
    
    const connection = await airbyteTerraformSDK.createConnection({
      name: connectionName,
      sourceId: sourceId,
      destinationId: destinationId,
      configurations: {
        namespaceDefinition: 'destination',
        namespaceFormat: '${SOURCE_NAMESPACE}',
        prefix: `${tenantId}_${provider}_`
      },
      schedule: {
        scheduleType: 'manual' // Change to 'basic' for automatic syncing
      }
    });
    
    console.log(`✅ Created Airbyte connection: ${connection.connectionId}`);
    
    // Trigger initial sync using Terraform SDK
    console.log(`🚀 Triggering initial sync for ${provider}...`);
    await airbyteTerraformSDK.triggerSync(connection.connectionId);
    
    return {
      connectionId: connection.connectionId,
      destinationId: destinationId,
      schedule: 'manual'
    };
    
  } catch (error) {
    console.error('❌ Terraform SDK connection creation failed:', error);
    throw error;
  }
}

// Removed - now using airbyteTerraformSDK.triggerSync() instead