import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


// Popular API connectors with their configurations
const API_CONNECTOR_TEMPLATES = {
  // E-commerce APIs
  'shopify': {
    name: 'Shopify',
    sourceDefinitionId: '9da77001-af33-4bcd-be46-6252bf9342b9',
    requiresOAuth: true,
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/shopify',
    configTemplate: {
      shop: '{{ shop_name }}',
      credentials: {
        auth_method: 'oauth2.0',
        client_id: '{{ client_id }}',
        client_secret: '{{ client_secret }}',
        access_token: '{{ access_token }}'
      }
    }
  },
  'woocommerce': {
    name: 'WooCommerce',
    sourceDefinitionId: '2a2552ca-9181-4c74-b870-1f3e0f901d1d',
    requiresOAuth: false,
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/woocommerce',
    configTemplate: {
      shop: '{{ shop_url }}',
      api_key: '{{ consumer_key }}',
      api_secret: '{{ consumer_secret }}'
    }
  },
  
  // CRM APIs
  'salesforce': {
    name: 'Salesforce',
    sourceDefinitionId: 'b117307c-14b6-41aa-9422-947e34922962',
    requiresOAuth: true,
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/salesforce',
    configTemplate: {
      client_id: '{{ client_id }}',
      client_secret: '{{ client_secret }}',
      refresh_token: '{{ refresh_token }}',
      start_date: '2020-01-01T00:00:00Z',
      is_sandbox: false
    }
  },
  'hubspot': {
    name: 'HubSpot',
    sourceDefinitionId: '36c891d9-4bd9-43ac-bad2-10e12756272c',
    requiresOAuth: true,
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/hubspot',
    configTemplate: {
      start_date: '2020-01-01T00:00:00Z',
      credentials: {
        credentials_title: 'OAuth Credentials',
        client_id: '{{ client_id }}',
        client_secret: '{{ client_secret }}',
        refresh_token: '{{ refresh_token }}'
      }
    }
  },
  
  // Payment APIs
  'stripe': {
    name: 'Stripe',
    sourceDefinitionId: 'e094cb9a-26de-4645-8761-65c0c425d1de',
    requiresOAuth: false,
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/stripe',
    configTemplate: {
      client_secret: '{{ api_key }}',
      account_id: '{{ account_id }}',
      start_date: '2020-01-01T00:00:00Z'
    }
  },
  'square': {
    name: 'Square',
    sourceDefinitionId: '77225a51-cd15-4a13-af02-65816bd0ecf4',
    requiresOAuth: true,
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/square',
    configTemplate: {
      credentials: {
        auth_type: 'OAuth',
        client_id: '{{ client_id }}',
        client_secret: '{{ client_secret }}',
        refresh_token: '{{ refresh_token }}'
      },
      start_date: '2020-01-01T00:00:00Z',
      is_sandbox: false
    }
  },
  
  // Marketing APIs
  'mailchimp': {
    name: 'Mailchimp',
    sourceDefinitionId: 'b03a9f3e-22a5-11eb-adc1-0242ac120002',
    requiresOAuth: true,
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/mailchimp',
    configTemplate: {
      credentials: {
        auth_type: 'oauth2.0',
        client_id: '{{ client_id }}',
        client_secret: '{{ client_secret }}',
        access_token: '{{ access_token }}'
      }
    }
  },
  
  // Analytics APIs
  'google-analytics': {
    name: 'Google Analytics',
    sourceDefinitionId: 'eff3616a-f9c3-11eb-9a03-0242ac130003',
    requiresOAuth: true,
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/google-analytics-v4',
    configTemplate: {
      credentials: {
        auth_type: 'Service',
        credentials_json: '{{ service_account_json }}'
      },
      start_date: '2020-01-01',
      view_id: '{{ view_id }}',
      custom_reports_array: []
    }
  },
  
  // Communication APIs
  'slack': {
    name: 'Slack',
    sourceDefinitionId: 'c2281cee-86f9-4a86-bb48-d23286b4c7bd',
    requiresOAuth: true,
    documentationUrl: 'https://docs.airbyte.com/integrations/sources/slack',
    configTemplate: {
      start_date: '2020-01-01T00:00:00Z',
      lookback_window: 7,
      join_channels: true,
      credentials: {
        api_token: '{{ bot_token }}'
      }
    }
  },
  
  // Generic REST API
  'rest-api': {
    name: 'REST API',
    sourceDefinitionId: 'generic-rest-api',
    requiresOAuth: false,
    documentationUrl: 'https://docs.airbyte.com/connector-development/config-based/low-code-cdk-overview',
    configTemplate: {
      base_url: '{{ api_base_url }}',
      auth_method: 'api_key',
      api_key_header: 'X-API-Key',
      api_key_value: '{{ api_key }}'
    }
  }
}

export async function POST(request: NextRequest) {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const body = await request.json()
    const { 
      tenantId,
      sourceType,
      connectionName,
      credentials,
      customConfig
    } = body

    // Validate required fields
    if (!tenantId || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId and sourceType' },
        { status: 400 }
      )
    }

    // Get template for the source type
    const template = API_CONNECTOR_TEMPLATES[sourceType as keyof typeof API_CONNECTOR_TEMPLATES]
    
    if (!template) {
      return NextResponse.json(
        { 
          error: `Unknown source type: ${sourceType}`,
          availableTypes: Object.keys(API_CONNECTOR_TEMPLATES)
        },
        { status: 400 }
      )
    }

    console.log(`🔧 Setting up ${template.name} connector for tenant ${tenantId}`)

    // Check if Airbyte is configured
    const isAirbyteConfigured = !!(process.env.AIRBYTE_API_KEY && process.env.AIRBYTE_WORKSPACE_ID)

    if (!isAirbyteConfigured) {
      // Return setup instructions if Airbyte is not configured
      return NextResponse.json({
        requiresSetup: true,
        connector: {
          name: template.name,
          sourceType: sourceType,
          requiresOAuth: template.requiresOAuth,
          documentationUrl: template.documentationUrl
        },
        setupInstructions: [
          'Airbyte configuration required:',
          '1. Sign up for Airbyte Cloud at https://cloud.airbyte.com',
          '2. Get your API key from Settings → API Keys',
          '3. Set AIRBYTE_API_KEY and AIRBYTE_WORKSPACE_ID in your environment',
          '4. Restart your application',
          '',
          `For ${template.name} specific setup:`,
          `- Documentation: ${template.documentationUrl}`,
          template.requiresOAuth 
            ? '- OAuth setup required in provider dashboard'
            : '- API credentials required from provider'
        ],
        configTemplate: template.configTemplate
      })
    }

    // Prepare connection configuration
    const connectionConfig = customConfig || {}
    
    // Merge with template config and credentials
    if (template.configTemplate) {
      Object.assign(connectionConfig, template.configTemplate)
      
      // Replace template variables with actual credentials
      if (credentials) {
        const configStr = JSON.stringify(connectionConfig)
        const processedConfigStr = configStr.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
          return credentials[key] || match
        })
        Object.assign(connectionConfig, JSON.parse(processedConfigStr))
      }
    }

    // Create source in Airbyte
    try {
      const airbyteResponse = await fetch(`${process.env.AIRBYTE_API_URL}/sources/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
          name: connectionName || `${template.name} - ${tenantId}`,
          sourceDefinitionId: template.sourceDefinitionId,
          connectionConfiguration: connectionConfig
        })
      })

      if (!airbyteResponse.ok) {
        const error = await airbyteResponse.json()
        throw new Error(error.message || 'Failed to create source in Airbyte')
      }

      const source = await airbyteResponse.json()

      // Store source info in database
      await supabase
        .from('tenant_sources')
        .insert({
          tenant_id: tenantId,
          airbyte_source_id: source.sourceId,
          source_type: sourceType,
          name: connectionName || `${template.name} - ${tenantId}`,
          status: 'active',
          connection_config: {
            ...connectionConfig,
            // Don't store sensitive credentials
            ...(credentials ? Object.keys(credentials).reduce((acc, key) => ({
              ...acc,
              [key]: key.includes('secret') || key.includes('token') || key.includes('key') 
                ? '[REDACTED]' 
                : credentials[key]
            }), {}) : {})
          }
        })

      console.log(`✅ Successfully created ${template.name} source: ${source.sourceId}`)

      return NextResponse.json({
        success: true,
        source: {
          sourceId: source.sourceId,
          name: source.name,
          type: sourceType,
          status: 'active'
        },
        nextSteps: [
          'Test the connection',
          'Configure destination',
          'Set up sync schedule',
          'Select tables/streams to sync'
        ]
      })

    } catch (airbyteError) {
      console.error('Airbyte API error:', airbyteError)
      
      // If OAuth is required, provide OAuth setup instructions
      if (template.requiresOAuth) {
        return NextResponse.json({
          requiresOAuth: true,
          connector: {
            name: template.name,
            sourceType: sourceType,
            documentationUrl: template.documentationUrl
          },
          oauthSetupUrl: `/api/oauth/create-url?provider=${sourceType}&tenantId=${tenantId}`,
          message: 'OAuth authentication required. Please complete the OAuth flow first.'
        }, { status: 400 })
      }
      
      throw airbyteError
    }

  } catch (error) {
    console.error('❌ Error in auto-setup:', error)
    return NextResponse.json(
      { 
        error: 'Failed to set up connector',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to list available connector templates
export async function GET(request: NextRequest) {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const connectors = Object.entries(API_CONNECTOR_TEMPLATES).map(([key, template]) => ({
    sourceType: key,
    name: template.name,
    requiresOAuth: template.requiresOAuth,
    documentationUrl: template.documentationUrl,
    configFields: Object.keys(template.configTemplate)
  }))

  return NextResponse.json({
    connectors,
    count: connectors.length,
    categories: {
      ecommerce: ['shopify', 'woocommerce'],
      crm: ['salesforce', 'hubspot'],
      payments: ['stripe', 'square'],
      marketing: ['mailchimp'],
      analytics: ['google-analytics'],
      communication: ['slack'],
      generic: ['rest-api']
    }
  })
}