import axios from 'axios'

export class AirbyteCloudService {
  private apiUrl = 'https://api.airbyte.com/v1'
  private apiKey: string
  private workspaceId: string

  constructor() {
    this.apiKey = process.env.AIRBYTE_API_KEY!
    this.workspaceId = process.env.AIRBYTE_WORKSPACE_ID!
  }

  /**
   * Create a source with OAuth authentication
   * Airbyte Cloud handles the OAuth flow automatically
   */
  async createOAuthSource(tenantId: string, provider: string) {
    try {
      // Step 1: Create the source configuration
      const sourceConfig = this.getSourceConfig(provider)
      
      const response = await axios.post(
        `${this.apiUrl}/sources`,
        {
          workspaceId: this.workspaceId,
          name: `${tenantId}_${provider}`,
          sourceDefinitionId: sourceConfig.definitionId,
          connectionConfiguration: {
            ...sourceConfig.baseConfig,
            // For OAuth sources, Airbyte will prompt for authentication
            credentials: {
              auth_type: 'OAuth2.0'
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const source = response.data

      // Step 2: Get OAuth consent URL from Airbyte
      const consentResponse = await axios.post(
        `${this.apiUrl}/sources/oauth/consent-url`,
        {
          workspaceId: this.workspaceId,
          sourceDefinitionId: sourceConfig.definitionId,
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/oauth/callback`,
          sourceId: source.sourceId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        sourceId: source.sourceId,
        consentUrl: consentResponse.data.consentUrl
      }

    } catch (error) {
      console.error('Failed to create OAuth source:', error)
      throw error
    }
  }

  /**
   * Complete OAuth flow after user authorization
   */
  async completeOAuthFlow(sourceId: string, authCode: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/sources/oauth/complete`,
        {
          workspaceId: this.workspaceId,
          sourceId: sourceId,
          authCode: authCode
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Failed to complete OAuth flow:', error)
      throw error
    }
  }

  /**
   * Create a source with API key authentication
   */
  async createApiKeySource(tenantId: string, provider: string, apiKey: string) {
    try {
      const sourceConfig = this.getSourceConfig(provider)
      
      const response = await axios.post(
        `${this.apiUrl}/sources`,
        {
          workspaceId: this.workspaceId,
          name: `${tenantId}_${provider}`,
          sourceDefinitionId: sourceConfig.definitionId,
          connectionConfiguration: {
            ...sourceConfig.baseConfig,
            api_key: apiKey // or whatever the field name is for this source
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Failed to create API key source:', error)
      throw error
    }
  }

  /**
   * Discover schema for a source
   */
  async discoverSchema(sourceId: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/sources/discover_schema`,
        {
          sourceId: sourceId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data.catalog
    } catch (error) {
      console.error('Failed to discover schema:', error)
      throw error
    }
  }

  /**
   * Create a connection between source and destination
   */
  async createConnection(sourceId: string, destinationId: string, catalog: any) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/connections`,
        {
          sourceId: sourceId,
          destinationId: destinationId,
          configurations: {
            syncCatalog: catalog,
            schedule: {
              scheduleType: 'manual' // or 'cron'
            },
            namespaceDefinition: 'source',
            prefix: '',
            nonBreakingSchemaUpdatesBehavior: 'ignore'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Failed to create connection:', error)
      throw error
    }
  }

  /**
   * Trigger a sync
   */
  async triggerSync(connectionId: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/jobs`,
        {
          connectionId: connectionId,
          jobType: 'sync'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Failed to trigger sync:', error)
      throw error
    }
  }

  private getSourceConfig(provider: string) {
    const configs: Record<string, any> = {
      google_sheets: {
        definitionId: '71607ba1-c0ac-4799-8049-7f4b90dd50f7',
        baseConfig: {
          spreadsheet_id: '{{will be set by user}}'
        }
      },
      salesforce: {
        definitionId: 'b117307c-14b6-41aa-9422-947e34922962',
        baseConfig: {
          is_sandbox: false,
          streams_criteria: [{ criteria: 'starts with', value: '' }]
        }
      },
      hubspot: {
        definitionId: '36c891d9-4bd9-43ac-bad2-10e12756272c',
        baseConfig: {
          start_date: '2020-01-01T00:00:00Z'
        }
      },
      shopify: {
        definitionId: '9da77001-af33-4bcd-be46-6252bf9342b9',
        baseConfig: {
          shop: '{{shop_name}}',
          start_date: '2020-01-01T00:00:00Z'
        }
      },
      stripe: {
        definitionId: 'e094cb9a-26de-4645-8761-65c0c425d1de',
        baseConfig: {
          start_date: '2020-01-01T00:00:00Z',
          lookback_window_days: 0
        }
      },
      github: {
        definitionId: 'ef69ef6e-aa7f-4af1-a01d-ef775033524e',
        baseConfig: {
          repositories: [],
          start_date: '2020-01-01T00:00:00Z'
        }
      },
      notion: {
        definitionId: 'decd338e-5647-4c0b-adf4-da0e75f5a750',
        baseConfig: {
          start_date: '2020-01-01T00:00:00Z'
        }
      },
      slack: {
        definitionId: 'c2281cee-86f9-4a86-bb48-d23286b4c7bd',
        baseConfig: {
          start_date: '2020-01-01T00:00:00Z',
          lookback_window: 7,
          join_channels: true
        }
      },
      airtable: {
        definitionId: '14c6e7ea-97ed-4f5e-a7b5-25e9a80b8212',
        baseConfig: {
          // API key will be provided by user
        }
      },
      postgres: {
        definitionId: 'decd338e-5647-4c0b-adf4-da0e75f5a750',
        baseConfig: {
          ssl_mode: { mode: 'prefer' },
          tunnel_method: { tunnel_method: 'NO_TUNNEL' },
          replication_method: { method: 'Standard' }
        }
      }
    }

    return configs[provider] || {
      definitionId: 'unknown',
      baseConfig: {}
    }
  }
}

// Helper function to check if a source requires OAuth
export function requiresOAuth(provider: string): boolean {
  const oauthProviders = [
    'google_sheets',
    'salesforce', 
    'hubspot',
    'shopify',
    'stripe',
    'github',
    'notion',
    'slack',
    'linkedin',
    'facebook',
    'instagram',
    'twitter',
    'microsoft_teams',
    'zoom'
  ]
  
  return oauthProviders.includes(provider)
}