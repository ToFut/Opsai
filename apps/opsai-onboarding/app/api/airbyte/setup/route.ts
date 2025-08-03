import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { tenantId, provider, accessToken } = await request.json()

    // Get Airbyte configuration for the provider
    const airbyteConfig = getAirbyteSourceConfig(provider, accessToken)
    
    // Create Airbyte source
    const sourceResponse = await fetch(`${process.env.AIRBYTE_API_URL}/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${tenantId}_${provider}_source`,
        sourceDefinitionId: airbyteConfig.definitionId,
        connectionConfiguration: airbyteConfig.config
      })
    })

    if (!sourceResponse.ok) {
      throw new Error('Failed to create Airbyte source')
    }

    const source = await sourceResponse.json()

    // Create Airbyte destination (tenant's database)
    const destinationResponse = await fetch(`${process.env.AIRBYTE_API_URL}/destinations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${tenantId}_postgres_destination`,
        destinationDefinitionId: '25c5221d-dce2-4163-ade9-739ef790f503', // Postgres destination
        connectionConfiguration: {
          host: process.env.DATABASE_HOST || 'localhost',
          port: 5432,
          database: process.env.DATABASE_NAME || 'opsai_core',
          schema: `tenant_${tenantId}`,
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD,
          ssl_mode: { mode: 'require' }
        }
      })
    })

    if (!destinationResponse.ok) {
      throw new Error('Failed to create Airbyte destination')
    }

    const destination = await destinationResponse.json()

    // Discover schema
    const schemaResponse = await fetch(`${process.env.AIRBYTE_API_URL}/sources/discover_schema`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json'
      },
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
    const connectionResponse = await fetch(`${process.env.AIRBYTE_API_URL}/connections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json'
      },
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

    // Trigger initial sync
    await triggerSync(connection.connectionId)

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

function getAirbyteSourceConfig(provider: string, accessToken: string) {
  const configs: Record<string, any> = {
    google: {
      definitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e', // Google Sheets
      config: {
        credentials: {
          auth_type: 'oauth2',
          access_token: accessToken
        }
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

  return configs[provider] || {
    definitionId: 'unknown',
    config: { access_token: accessToken }
  }
}

async function triggerSync(connectionId: string) {
  try {
    await fetch(`${process.env.AIRBYTE_API_URL}/connections/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ connectionId })
    })
  } catch (error) {
    console.error('Failed to trigger sync:', error)
  }
}