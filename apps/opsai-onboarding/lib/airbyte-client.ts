// Comprehensive Airbyte API Client
// Based on Airbyte API Reference: https://reference.airbyte.com

import { tokenManager, isTokenExpired } from './airbyte-token-manager'

export class AirbyteClient {
  private apiUrl: string
  private workspaceId: string

  constructor() {
    this.apiUrl = process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
    this.workspaceId = process.env.AIRBYTE_WORKSPACE_ID || ''
    
    console.log('🔧 AirbyteClient initialized:')
    console.log('  API URL:', this.apiUrl)
    console.log('  Workspace ID:', this.workspaceId)
    
    // Check if static token is expired
    const staticToken = process.env.AIRBYTE_API_KEY
    if (staticToken && isTokenExpired(staticToken)) {
      console.warn('⚠️ Static Airbyte API token is expired!')
    }
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    console.log(`📡 Airbyte API Request: ${method} ${endpoint}`)
    
    // Get valid token (will auto-refresh if needed)
    const apiKey = await tokenManager.getValidToken()
    
    if (!apiKey) {
      throw new Error('Unable to get valid Airbyte API token')
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    console.log(`📡 Response status: ${response.status}`)

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ Airbyte API error: ${response.status} - ${error}`)
      
      if (response.status === 401) {
        // Try to refresh token once
        console.log('🔄 Token might be expired, attempting refresh...')
        const newToken = await tokenManager.refreshToken()
        
        if (newToken) {
          // Retry request with new token
          const retryResponse = await fetch(`${this.apiUrl}${endpoint}`, {
            method,
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: body ? JSON.stringify(body) : undefined
          })
          
          if (retryResponse.ok) {
            return retryResponse.json()
          }
        }
        
        throw new Error('Airbyte authentication failed. Check AIRBYTE_CLIENT_ID and AIRBYTE_CLIENT_SECRET in .env.local')
      }
      
      throw new Error(`Airbyte API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // 1. SOURCE MANAGEMENT
  async listSourceDefinitions() {
    return this.request('/source_definitions')
  }

  async createSource(name: string, sourceDefinitionId: string, connectionConfiguration: any) {
    // Airbyte API expects 'configuration' not 'connectionConfiguration'
    return this.request('/sources', 'POST', {
      workspaceId: this.workspaceId,
      name,
      sourceDefinitionId,
      configuration: connectionConfiguration  // Changed from connectionConfiguration
    })
  }

  async getSource(sourceId: string) {
    return this.request(`/sources/${sourceId}`)
  }

  async discoverSourceSchema(sourceId: string) {
    return this.request('/sources/discover_schema', 'POST', {
      sourceId
    })
  }

  // 2. DESTINATION MANAGEMENT
  async listDestinationDefinitions() {
    return this.request('/destination_definitions')
  }

  async createDestination(name: string, destinationDefinitionId: string, connectionConfiguration: any) {
    // Airbyte API expects 'configuration' not 'connectionConfiguration'
    return this.request('/destinations', 'POST', {
      workspaceId: this.workspaceId,
      name,
      destinationDefinitionId,
      configuration: connectionConfiguration  // Changed from connectionConfiguration
    })
  }

  async getDestination(destinationId: string) {
    return this.request(`/destinations/${destinationId}`)
  }

  // 3. CONNECTION MANAGEMENT
  async createConnection(sourceId: string, destinationId: string, streams: any[], name?: string) {
    // First, discover the source schema
    const schema = await this.discoverSourceSchema(sourceId)
    
    // Configure streams based on discovered schema
    const configuredCatalog = {
      streams: schema.catalog.streams.map((stream: any) => {
        const userStream = streams.find(s => s.name === stream.stream.name)
        return {
          stream: stream.stream,
          config: {
            syncMode: userStream?.syncMode || 'full_refresh',
            destinationSyncMode: userStream?.destinationSyncMode || 'overwrite',
            selected: userStream?.selected !== false,
            primaryKey: userStream?.primaryKey || [],
            cursorField: userStream?.cursorField || []
          }
        }
      })
    }

    return this.request('/connections', 'POST', {
      sourceId,
      destinationId,
      name: name || `${sourceId}-to-${destinationId}`,
      namespaceDefinition: 'source',
      syncCatalog: configuredCatalog,
      status: 'active',
      scheduleType: 'manual'  // Removed nested schedule object
    })
  }

  async getConnection(connectionId: string) {
    return this.request(`/connections/${connectionId}`)
  }

  async triggerSync(connectionId: string) {
    return this.request('/jobs', 'POST', {
      connectionId,
      jobType: 'sync'
    })
  }

  async getJobStatus(jobId: string) {
    return this.request(`/jobs/${jobId}`)
  }

  async getConnectionBySourceId(sourceId: string) {
    const connections = await this.request('/connections')
    const connection = connections.data?.find((conn: any) => conn.sourceId === sourceId)
    return connection || null
  }

  // 4. OAUTH MANAGEMENT
  async initiateOAuth(sourceDefinitionId: string, redirectUrl: string, oAuthInputConfiguration?: any) {
    // Airbyte OAuth endpoint is 'initiate_oauth' not 'get_consent_url'
    return this.request('/initiate_oauth', 'POST', {
      workspaceId: this.workspaceId,
      sourceDefinitionId,
      redirectUrl,
      oAuthInputConfiguration: oAuthInputConfiguration || {}
    })
  }

  async completeOAuth(sourceDefinitionId: string, redirectUrl: string, queryParams: any) {
    return this.request('/source_oauths/complete_oauth', 'POST', {
      workspaceId: this.workspaceId,
      sourceDefinitionId,
      redirectUrl,
      queryParams
    })
  }

  // 5. COMMON SOURCE CONFIGURATIONS
  static getSourceConfig(sourceType: string, credentials?: any) {
    const configs: Record<string, any> = {
      postgres: {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        schemas: ['public'],
        username: 'postgres',
        password: '',
        ssl_mode: { mode: 'prefer' },
        replication_method: { method: 'Standard' },
        tunnel_method: { tunnel_method: 'NO_TUNNEL' }
      },
      mysql: {
        host: 'localhost',
        port: 3306,
        database: 'mysql',
        username: 'root',
        password: '',
        ssl_mode: { mode: 'preferred' },
        replication_method: { method: 'STANDARD' }
      },
      github: {
        start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        credentials: credentials || {
          option_title: 'OAuth Credentials',
          access_token: ''
        },
        repositories: [],
        page_size_for_large_streams: 100
      },
      shopify: {
        start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        shop: '',
        credentials: credentials || {
          auth_method: 'oauth2.0',
          access_token: ''
        }
      },
      stripe: {
        account_id: '',
        client_secret: '',
        start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lookback_window_days: 7,
        slice_range: 365
      }
    }

    return configs[sourceType] || {}
  }

  // 6. COMMON DESTINATION CONFIGURATIONS
  static getDestinationConfig(destinationType: string) {
    const configs: Record<string, any> = {
      postgres: {
        host: 'localhost',
        port: 5432,
        database: 'destination_db',
        schema: 'public',
        username: 'postgres',
        password: '',
        ssl_mode: { mode: 'prefer' },
        tunnel_method: { tunnel_method: 'NO_TUNNEL' }
      },
      bigquery: {
        project_id: '',
        dataset_id: 'airbyte_sync',
        dataset_location: 'US',
        credentials_json: '',
        transformation_priority: 'interactive',
        big_query_client_buffer_size_mb: 15
      },
      snowflake: {
        host: '',
        role: '',
        warehouse: '',
        database: '',
        schema: 'PUBLIC',
        username: '',
        password: '',
        jdbc_url_params: ''
      },
      s3: {
        access_key_id: '',
        secret_access_key: '',
        s3_bucket_name: '',
        s3_bucket_path: 'airbyte',
        s3_bucket_region: 'us-east-1',
        format: {
          format_type: 'JSONL',
          compression: {
            compression_type: 'GZIP'
          }
        }
      }
    }

    return configs[destinationType] || {}
  }
}

// Export singleton instance
export const airbyteClient = new AirbyteClient()