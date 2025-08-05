import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Integration configurations with auth methods
const integrationConfigs = {
  // OAuth-based (user logs in)
  google: { authType: 'oauth2', requiresUserLogin: true },
  salesforce: { authType: 'oauth2', requiresUserLogin: true },
  shopify: { authType: 'oauth2', requiresUserLogin: true },
  stripe: { authType: 'oauth2', requiresUserLogin: true },
  hubspot: { authType: 'oauth2', requiresUserLogin: true },
  github: { authType: 'oauth2', requiresUserLogin: true },
  
  // API Key-based (user provides key)
  openai: { authType: 'api_key', requiresUserLogin: false },
  sendgrid: { authType: 'api_key', requiresUserLogin: false },
  twilio: { authType: 'api_key', requiresUserLogin: false },
  airtable: { authType: 'api_key', requiresUserLogin: false },
  monday: { authType: 'api_key', requiresUserLogin: false },
  clickup: { authType: 'api_key', requiresUserLogin: false },
  zendesk: { authType: 'api_key', requiresUserLogin: false },
  intercom: { authType: 'api_key', requiresUserLogin: false },
  mixpanel: { authType: 'api_key', requiresUserLogin: false },
  
  // Database connections (credentials-based)
  postgres: { authType: 'database', requiresUserLogin: false },
  mysql: { authType: 'database', requiresUserLogin: false },
  mongodb: { authType: 'database', requiresUserLogin: false },
  snowflake: { authType: 'database', requiresUserLogin: false },
  bigquery: { authType: 'service_account', requiresUserLogin: false },
  
  // Webhook-based (no auth needed)
  webhook: { authType: 'webhook', requiresUserLogin: false },
  
  // File-based
  s3: { authType: 'aws_credentials', requiresUserLogin: false },
  gcs: { authType: 'service_account', requiresUserLogin: false },
  
  // Platform APIs (using platform keys from .env)
  airbyte: { authType: 'platform', requiresUserLogin: false },
  temporal: { authType: 'platform', requiresUserLogin: false },
  supabase: { authType: 'platform', requiresUserLogin: false }
}

export async function POST(request: NextRequest) {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { provider, tenantId, credentials, authType } = await request.json()

    const config = integrationConfigs[provider as keyof typeof integrationConfigs]
    if (!config) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
    }

    // Handle different auth types
    switch (config.authType) {
      case 'oauth2':
        // Redirect to OAuth flow
        return NextResponse.json({
          action: 'oauth_redirect',
          authUrl: `/api/oauth/connect?provider=${provider}&tenant=${tenantId}`
        })

      case 'api_key':
        // Store API key directly
        await storeApiKeyCredentials(tenantId, provider, credentials)
        await setupAirbyteWithApiKey(tenantId, provider, credentials)
        return NextResponse.json({ success: true, action: 'connected' })

      case 'database':
        // Test database connection first
        const dbTest = await testDatabaseConnection(provider, credentials)
        if (!dbTest.success) {
          return NextResponse.json({ error: dbTest.error }, { status: 400 })
        }
        await storeDatabaseCredentials(tenantId, provider, credentials)
        await setupAirbyteWithDatabase(tenantId, provider, credentials)
        return NextResponse.json({ success: true, action: 'connected' })

      case 'webhook':
        // Generate webhook URL
        const webhookUrl = await generateWebhookUrl(tenantId, provider)
        return NextResponse.json({
          success: true,
          action: 'webhook_created',
          webhookUrl
        })

      case 'platform':
        // Use platform credentials from .env
        await setupPlatformIntegration(tenantId, provider)
        return NextResponse.json({ success: true, action: 'connected' })

      case 'service_account':
        // Store service account JSON
        await storeServiceAccount(tenantId, provider, credentials)
        await setupAirbyteWithServiceAccount(tenantId, provider, credentials)
        return NextResponse.json({ success: true, action: 'connected' })

      case 'aws_credentials':
        // Store AWS credentials
        await storeAWSCredentials(tenantId, provider, credentials)
        await setupAirbyteWithAWS(tenantId, provider, credentials)
        return NextResponse.json({ success: true, action: 'connected' })

      default:
        return NextResponse.json({ error: 'Unsupported auth type' }, { status: 400 })
    }

  } catch (error) {
    console.error('Integration connection error:', error)
    return NextResponse.json(
      { error: 'Failed to connect integration' },
      { status: 500 }
    )
  }
}

async function storeApiKeyCredentials(tenantId: string, provider: string, credentials: any) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase
    .from('tenant_integrations')
    .upsert({
      tenant_id: tenantId,
      provider,
      auth_type: 'api_key',
      credentials: await encryptCredentials({
        api_key: credentials.apiKey,
        ...credentials
      }),
      status: 'connected',
      connected_at: new Date().toISOString()
    })
}

async function setupAirbyteWithApiKey(tenantId: string, provider: string, credentials: any) {
  const airbyteConfigs = {
    sendgrid: {
      sourceDefinitionId: 'fbb5fbe2-16ad-4cf4-af7d-ff9d9c316c87',
      connectionConfiguration: {
        apikey: credentials.apiKey,
        start_time: '2020-01-01T00:00:00Z'
      }
    },
    airtable: {
      sourceDefinitionId: '14c6e7ea-97ed-4f5e-a7b5-25e9a80b8212',
      connectionConfiguration: {
        api_key: credentials.apiKey,
        base_id: credentials.baseId,
        tables: credentials.tables || []
      }
    },
    monday: {
      sourceDefinitionId: '80a54ea2-9959-4040-aac1-eee42423ec9b',
      connectionConfiguration: {
        api_token: credentials.apiKey,
        start_date: '2020-01-01T00:00:00Z'
      }
    },
    zendesk: {
      sourceDefinitionId: '79c1aa37-dae3-42ae-b333-d1c105477715',
      connectionConfiguration: {
        subdomain: credentials.subdomain,
        credentials: {
          credentials: 'api_token',
          email: credentials.email,
          api_token: credentials.apiKey
        },
        start_date: '2020-01-01T00:00:00Z'
      }
    }
  }

  const config = airbyteConfigs[provider as keyof typeof airbyteConfigs]
  if (!config) return

  // Create Airbyte source
  await createAirbyteSource(tenantId, provider, config)
}

async function storeDatabaseCredentials(tenantId: string, provider: string, credentials: any) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase
    .from('tenant_integrations')
    .upsert({
      tenant_id: tenantId,
      provider,
      auth_type: 'database',
      credentials: await encryptCredentials({
        host: credentials.host,
        port: credentials.port,
        database: credentials.database,
        username: credentials.username,
        password: credentials.password,
        ssl: credentials.ssl || false
      }),
      status: 'connected',
      connected_at: new Date().toISOString()
    })
}

async function setupAirbyteWithDatabase(tenantId: string, provider: string, credentials: any) {
  const airbyteConfigs = {
    postgres: {
      sourceDefinitionId: 'decd338e-5647-4c0b-adf4-da0e75f5a750',
      connectionConfiguration: {
        host: credentials.host,
        port: credentials.port || 5432,
        database: credentials.database,
        username: credentials.username,
        password: credentials.password,
        ssl_mode: { mode: credentials.ssl ? 'require' : 'prefer' },
        replication_method: { method: 'Standard' }
      }
    },
    mysql: {
      sourceDefinitionId: '435bb9a5-7887-4809-aa58-28c27df0d7ad',
      connectionConfiguration: {
        host: credentials.host,
        port: credentials.port || 3306,
        database: credentials.database,
        username: credentials.username,
        password: credentials.password,
        ssl_mode: { mode: credentials.ssl ? 'required' : 'preferred' },
        replication_method: { method: 'STANDARD' }
      }
    },
    mongodb: {
      sourceDefinitionId: 'b2e713cd-cc36-4c0a-b5bd-b47cb8a0561e',
      connectionConfiguration: {
        instance_type: { instance: 'standalone' },
        host: credentials.host,
        port: credentials.port || 27017,
        database: credentials.database,
        user: credentials.username,
        password: credentials.password,
        auth_source: 'admin'
      }
    }
  }

  const config = airbyteConfigs[provider as keyof typeof airbyteConfigs]
  if (!config) return

  await createAirbyteSource(tenantId, provider, config)
}

async function testDatabaseConnection(provider: string, credentials: any): Promise<{ success: boolean; error?: string }> {
  // Implement database connection testing
  // This would actually try to connect to the database
  return { success: true }
}

async function generateWebhookUrl(tenantId: string, provider: string): Promise<string> {
  const webhookId = `${tenantId}_${provider}_${Date.now()}`
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase
    .from('tenant_webhooks')
    .insert({
      tenant_id: tenantId,
      provider,
      webhook_id: webhookId,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/${webhookId}`,
      status: 'active',
      created_at: new Date().toISOString()
    })

  return `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/${webhookId}`
}

async function setupPlatformIntegration(tenantId: string, provider: string) {
  // Use platform credentials from .env
  const platformConfigs = {
    airbyte: {
      url: process.env.AIRBYTE_API_URL,
      apiKey: process.env.AIRBYTE_API_KEY
    },
    temporal: {
      host: process.env.TEMPORAL_HOST,
      namespace: process.env.TEMPORAL_NAMESPACE
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase
    .from('tenant_integrations')
    .upsert({
      tenant_id: tenantId,
      provider,
      auth_type: 'platform',
      status: 'connected',
      connected_at: new Date().toISOString()
    })
}

async function storeServiceAccount(tenantId: string, provider: string, credentials: any) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase
    .from('tenant_integrations')
    .upsert({
      tenant_id: tenantId,
      provider,
      auth_type: 'service_account',
      credentials: await encryptCredentials({
        serviceAccount: credentials.serviceAccountJson
      }),
      status: 'connected',
      connected_at: new Date().toISOString()
    })
}

async function setupAirbyteWithServiceAccount(tenantId: string, provider: string, credentials: any) {
  if (provider === 'bigquery') {
    await createAirbyteSource(tenantId, provider, {
      sourceDefinitionId: 'bfd1ddf8-ae8a-4620-b1d7-55597d2ba08c',
      connectionConfiguration: {
        credentials_json: credentials.serviceAccountJson,
        project_id: JSON.parse(credentials.serviceAccountJson).project_id,
        dataset_id: credentials.datasetId || 'public'
      }
    })
  }
}

async function storeAWSCredentials(tenantId: string, provider: string, credentials: any) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase
    .from('tenant_integrations')
    .upsert({
      tenant_id: tenantId,
      provider,
      auth_type: 'aws_credentials',
      credentials: await encryptCredentials({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: credentials.region || 'us-east-1'
      }),
      status: 'connected',
      connected_at: new Date().toISOString()
    })
}

async function setupAirbyteWithAWS(tenantId: string, provider: string, credentials: any) {
  if (provider === 's3') {
    await createAirbyteSource(tenantId, provider, {
      sourceDefinitionId: '69589781-7828-43c5-9f63-8925b1c1ccc2',
      connectionConfiguration: {
        dataset: credentials.bucket,
        path_pattern: credentials.pathPattern || '**/*.csv',
        provider: {
          bucket: credentials.bucket,
          aws_access_key_id: credentials.accessKeyId,
          aws_secret_access_key: credentials.secretAccessKey,
          region_name: credentials.region || 'us-east-1'
        }
      }
    })
  }
}

async function createAirbyteSource(tenantId: string, provider: string, config: any) {
  try {
    const response = await fetch(`${process.env.AIRBYTE_API_URL}/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${tenantId}_${provider}_source`,
        sourceDefinitionId: config.sourceDefinitionId,
        connectionConfiguration: config.connectionConfiguration
      })
    })

    if (response.ok) {
      const source = await response.json()
      // Continue with destination and connection setup...
      await setupAirbyteConnection(tenantId, provider, source.sourceId)
    }
  } catch (error) {
    console.error('Failed to create Airbyte source:', error)
  }
}

async function setupAirbyteConnection(tenantId: string, provider: string, sourceId: string) {
  // Similar to the previous implementation
  // Create destination and connection
}

async function encryptCredentials(credentials: any): Promise<string> {
  // TODO: Implement proper encryption
  // For now, just stringify
  return JSON.stringify(credentials)
}

// Export integration configs for UI
export async function GET() {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return NextResponse.json({
    integrations: Object.entries(integrationConfigs).map(([key, config]) => ({
      id: key,
      ...config,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      category: getIntegrationCategory(key)
    }))
  })
}

function getIntegrationCategory(provider: string): string {
  const categories: Record<string, string[]> = {
    'CRM & Sales': ['salesforce', 'hubspot', 'pipedrive', 'zoho'],
    'E-commerce': ['shopify', 'woocommerce', 'magento', 'bigcommerce'],
    'Payments': ['stripe', 'paypal', 'square', 'braintree'],
    'Marketing': ['mailchimp', 'sendgrid', 'activecampaign', 'klaviyo'],
    'Support': ['zendesk', 'intercom', 'freshdesk', 'helpscout'],
    'Analytics': ['mixpanel', 'amplitude', 'segment', 'google_analytics'],
    'Productivity': ['monday', 'clickup', 'asana', 'trello', 'notion'],
    'Communication': ['slack', 'discord', 'twilio', 'zoom'],
    'Development': ['github', 'gitlab', 'bitbucket', 'jira'],
    'Databases': ['postgres', 'mysql', 'mongodb', 'redis', 'snowflake'],
    'Cloud Storage': ['s3', 'gcs', 'dropbox', 'box'],
    'Platform': ['airbyte', 'temporal', 'supabase']
  }

  for (const [category, providers] of Object.entries(categories)) {
    if (providers.includes(provider)) {
      return category
    }
  }
  return 'Other'
}