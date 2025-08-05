import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { tenantId, sourceType, name } = await request.json()

    // Get source definition
    const definitionResponse = await fetch(`${process.env.AIRBYTE_API_URL}/source_definitions/get`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceDefinitionId: getSourceDefinitionId(sourceType)
      })
    })

    const sourceDefinition = await definitionResponse.json()

    // Check if OAuth is required
    const requiresOAuth = checkIfOAuthRequired(sourceDefinition)

    if (requiresOAuth) {
      // Generate OAuth URL through Airbyte
      const oauthResponse = await fetch(`${process.env.AIRBYTE_API_URL}/source_oauth/get_consent_url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
          sourceDefinitionId: sourceDefinition.sourceDefinitionId,
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/airbyte/oauth/callback`,
          oAuthInputConfiguration: getOAuthConfig(sourceType)
        })
      })

      const oauthData = await oauthResponse.json()

      // Store OAuth state in Supabase
      await supabase
        .from('oauth_states')
        .insert({
          state_token: oauthData.state,
          tenant_id: tenantId,
          provider: sourceType,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/airbyte/oauth/callback`,
          metadata: { source_name: name },
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        })

      return NextResponse.json({
        requiresAuth: true,
        authUrl: oauthData.consentUrl,
        state: oauthData.state
      })
    } else {
      // Create source directly (for API key or database sources)
      const createResponse = await fetch(`${process.env.AIRBYTE_API_URL}/sources/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRBYTE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
          name: name,
          sourceDefinitionId: sourceDefinition.sourceDefinitionId,
          connectionConfiguration: getDefaultConfig(sourceType)
        })
      })

      const source = await createResponse.json()

      // Store source info in Supabase
      await supabase
        .from('tenant_sources')
        .insert({
          tenant_id: tenantId,
          airbyte_source_id: source.sourceId,
          source_type: sourceType,
          name: name,
          status: 'pending',
          connection_config: getDefaultConfig(sourceType)
        })

      return NextResponse.json({
        sourceId: source.sourceId,
        requiresAuth: false
      })
    }

  } catch (error) {
    console.error('Error creating source:', error)
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    )
  }
}

function getSourceDefinitionId(sourceType: string): string {
  // Map source types to Airbyte source definition IDs
  const sourceMap: Record<string, string> = {
    'postgres': 'decd338e-5647-4c0b-adf4-da0e75f5a750',
    'mysql': '435bb9a5-7887-4809-aa58-28c27df0d7ad',
    'mongodb': 'b2e713cd-cc36-4c0a-b5bd-b47cb8a0561e',
    'salesforce': 'b117307c-14b6-41aa-9422-947e34922962',
    'hubspot': '36c891d9-4bd9-43ac-bad2-10e12756272c',
    'shopify': '9da77001-af33-4bcd-be46-6252bf9342b9',
    'stripe': 'e094cb9a-26de-4645-8761-65c0c425d1de',
    'google-analytics': 'eff3616a-f9c3-11eb-9a03-0242ac130003',
    'google-sheets': '71607ba1-c0ac-4799-8049-7f4b90dd50f7',
    'slack': 'c2281cee-86f9-4a86-bb48-d23286b4c7bd',
    'notion': 'decd338e-5647-4c0b-adf4-da0e75f5a750',
    'airtable': '14c6e7ea-97ed-4f5e-a7b5-25e9a80b8212',
    'github': 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
    'jira': '68e63de2-bb83-4c7e-93fa-a8a9051e3993',
    'zendesk': '79c1aa37-dae3-42ae-b333-d1c105477715',
    'mailchimp': 'b03a9f3e-22a5-11eb-adc1-0242ac120002',
    'sendgrid': 'fbb5fbe2-16ad-4cf4-af7d-ff9d9c316c87',
    'mixpanel': '12928b32-bf0a-4f1e-8305-6ee559ad36f1',
    'amplitude': 'fa9f58c6-2329-4c1e-b23a-f81c5615a201',
    's3': '69589781-7828-43c5-9f63-8925b1c1ccc2',
    'bigquery': 'bfd1ddf8-ae8a-4620-b1d7-55597d2ba08c',
    'snowflake': 'e2d65910-8c8b-40a1-ae7d-ee2416b2bfa2',
    'redshift': 'e87ffa8e-a3b5-f69c-9076-6011339ac4df'
  }

  return sourceMap[sourceType] || 'unknown'
}

function checkIfOAuthRequired(sourceDefinition: any): boolean {
  // Check if source requires OAuth based on its specification
  const spec = sourceDefinition.connectionSpecification
  if (!spec || !spec.properties) return false

  // Look for OAuth-related fields in the spec
  const hasOAuthFields = Object.keys(spec.properties).some(key => 
    key.includes('credentials') || key.includes('auth_type') || key.includes('authentication')
  )

  // Check if it has OAuth in auth methods
  if (hasOAuthFields && spec.properties.credentials) {
    const credentialsSpec = spec.properties.credentials
    if (credentialsSpec.oneOf) {
      return credentialsSpec.oneOf.some((method: any) => 
        method.properties?.auth_type?.const === 'OAuth2.0' ||
        method.title?.includes('OAuth')
      )
    }
  }

  return false
}

function getOAuthConfig(sourceType: string): any {
  // Return OAuth configuration based on source type
  const configs: Record<string, any> = {
    'google-sheets': {
      client_id: process.env.AIRBYTE_GOOGLE_CLIENT_ID,
      client_secret: process.env.AIRBYTE_GOOGLE_CLIENT_SECRET
    },
    'salesforce': {
      client_id: process.env.AIRBYTE_SALESFORCE_CLIENT_ID,
      client_secret: process.env.AIRBYTE_SALESFORCE_CLIENT_SECRET
    },
    'hubspot': {
      client_id: process.env.AIRBYTE_HUBSPOT_CLIENT_ID,
      client_secret: process.env.AIRBYTE_HUBSPOT_CLIENT_SECRET
    },
    'slack': {
      client_id: process.env.AIRBYTE_SLACK_CLIENT_ID,
      client_secret: process.env.AIRBYTE_SLACK_CLIENT_SECRET
    }
  }

  return configs[sourceType] || {}
}

function getDefaultConfig(sourceType: string): any {
  // Return default configuration for non-OAuth sources
  const configs: Record<string, any> = {
    'postgres': {
      host: 'localhost',
      port: 5432,
      database: 'mydb',
      username: 'user',
      password: 'password',
      ssl_mode: { mode: 'prefer' },
      replication_method: { method: 'Standard' },
      tunnel_method: { tunnel_method: 'NO_TUNNEL' }
    },
    'mysql': {
      host: 'localhost',
      port: 3306,
      database: 'mydb',
      username: 'user',
      password: 'password',
      ssl_mode: { mode: 'preferred' },
      replication_method: { method: 'STANDARD' }
    },
    'airtable': {
      api_key: '',
      base_id: '',
      tables: []
    },
    's3': {
      dataset: 'my-bucket',
      path_pattern: '**/*.csv',
      provider: {
        bucket: 'my-bucket',
        aws_access_key_id: '',
        aws_secret_access_key: '',
        region_name: 'us-east-1'
      }
    }
  }

  return configs[sourceType] || {}
}