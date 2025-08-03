import axios from 'axios'

export interface APISpecification {
  name: string
  baseUrl: string
  authentication: {
    type: 'oauth2' | 'api_key' | 'bearer' | 'basic'
    oauth2Config?: {
      authorizationUrl: string
      tokenUrl: string
      scopes?: string[]
      grantType?: 'authorization_code' | 'client_credentials'
    }
    apiKeyConfig?: {
      headerName?: string
      parameterName?: string
      location?: 'header' | 'query'
    }
  }
  endpoints: Array<{
    name: string
    path: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    paginated?: boolean
    paginationType?: 'offset' | 'page' | 'cursor'
    responseFormat?: 'json' | 'xml' | 'csv'
    dataPath?: string
    primaryKey?: string[]
  }>
  rateLimit?: {
    requestsPerSecond?: number
    requestsPerMinute?: number
  }
}

export interface ConnectorManifest {
  version: string
  type: 'DeclarativeSource'
  check: {
    type: 'CheckStream'
    stream_names: string[]
  }
  definitions: {
    streams: any
    base_requester: any
    authenticator?: any
    paginator?: any
  }
  streams: any[]
  spec: {
    type: 'Spec'
    connection_specification: any
  }
}

export class AirbyteAutoConnector {
  constructor(private config: any = {}) {}

  async createConnectorFromAPI(spec: APISpecification): Promise<{
    connectorId: string
    manifest: ConnectorManifest
  }> {
    const manifest = this.generateConnectorManifest(spec)
    const connectorId = await this.registerCustomConnector(spec.name, manifest)
    
    return {
      connectorId,
      manifest
    }
  }

  private generateConnectorManifest(spec: APISpecification): ConnectorManifest {
    return {
      version: '0.50.2',
      type: 'DeclarativeSource',
      check: {
        type: 'CheckStream',
        stream_names: spec.endpoints.length > 0 ? [spec.endpoints[0].name] : []
      },
      definitions: {
        streams: {},
        base_requester: this.generateRequester(spec),
        authenticator: this.generateAuthenticator(spec),
        paginator: this.generatePaginator(spec)
      },
      streams: this.generateStreams(spec),
      spec: this.generateSpec(spec)
    }
  }

  private generateRequester(spec: APISpecification): any {
    const requester: any = {
      type: 'HttpRequester',
      url_base: spec.baseUrl,
      http_method: 'GET',
      request_parameters: {},
      request_headers: {
        'Accept': 'application/json',
        'User-Agent': 'Airbyte'
      }
    }

    if (spec.rateLimit) {
      requester.request_rate_limiter = {
        type: 'FixedWindowRateLimiter',
        max_requests: spec.rateLimit.requestsPerMinute || 60,
        time_window: 60
      }
    }

    return requester
  }

  private generateAuthenticator(spec: APISpecification): any {
    switch (spec.authentication.type) {
      case 'oauth2':
        return {
          type: 'OAuthAuthenticator',
          client_id: '{{ config["client_id"] }}',
          client_secret: '{{ config["client_secret"] }}',
          refresh_token: '{{ config["refresh_token"] }}',
          token_refresh_endpoint: spec.authentication.oauth2Config?.tokenUrl,
          scopes: spec.authentication.oauth2Config?.scopes || []
        }

      case 'api_key':
        const apiKeyConfig = spec.authentication.apiKeyConfig || {}
        if (apiKeyConfig.location === 'header') {
          return {
            type: 'ApiKeyAuthenticator',
            api_token: '{{ config["api_key"] }}',
            header: apiKeyConfig.headerName || 'X-API-Key'
          }
        } else {
          return {
            type: 'ApiKeyAuthenticator',
            api_token: '{{ config["api_key"] }}',
            request_parameters: {
              [apiKeyConfig.parameterName || 'api_key']: '{{ config["api_key"] }}'
            }
          }
        }

      case 'bearer':
        return {
          type: 'BearerAuthenticator',
          api_token: '{{ config["api_token"] }}'
        }

      case 'basic':
        return {
          type: 'BasicHttpAuthenticator',
          username: '{{ config["username"] }}',
          password: '{{ config["password"] }}'
        }

      default:
        return null
    }
  }

  private generatePaginator(spec: APISpecification): any {
    const paginatedEndpoint = spec.endpoints.find(e => e.paginated)
    if (!paginatedEndpoint) return null

    switch (paginatedEndpoint.paginationType) {
      case 'offset':
        return {
          type: 'DefaultPaginator',
          page_token_option: {
            type: 'RequestOption',
            inject_into: 'request_parameter',
            field_name: 'offset'
          },
          page_size_option: {
            type: 'RequestOption',
            inject_into: 'request_parameter',
            field_name: 'limit'
          },
          pagination_strategy: {
            type: 'OffsetIncrement',
            page_size: 100
          }
        }

      case 'page':
        return {
          type: 'DefaultPaginator',
          page_token_option: {
            type: 'RequestOption',
            inject_into: 'request_parameter',
            field_name: 'page'
          },
          pagination_strategy: {
            type: 'PageIncrement',
            page_size: 100,
            start_from_page: 1
          }
        }

      case 'cursor':
        return {
          type: 'DefaultPaginator',
          page_token_option: {
            type: 'RequestOption',
            inject_into: 'request_parameter',
            field_name: 'cursor'
          },
          pagination_strategy: {
            type: 'CursorPagination',
            cursor_value: '{{ response.next_cursor }}'
          }
        }

      default:
        return null
    }
  }

  private generateStreams(spec: APISpecification): any[] {
    return spec.endpoints.map(endpoint => {
      const stream: any = {
        type: 'DeclarativeStream',
        name: endpoint.name,
        primary_key: endpoint.primaryKey || ['id'],
        retriever: {
          type: 'SimpleRetriever',
          requester: {
            $ref: '#/definitions/base_requester',
            path: endpoint.path,
            http_method: endpoint.method
          },
          record_selector: {
            type: 'RecordSelector',
            extractor: {
              type: 'DpathExtractor',
              field_path: endpoint.dataPath ? [endpoint.dataPath] : ['$']
            }
          }
        }
      }

      if (endpoint.paginated) {
        stream.retriever.paginator = {
          $ref: '#/definitions/paginator'
        }
      }

      if (this.generateAuthenticator(spec)) {
        stream.retriever.requester.authenticator = {
          $ref: '#/definitions/authenticator'
        }
      }

      return stream
    })
  }

  private generateSpec(spec: APISpecification): any {
    const connectionSpec: any = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: `${spec.name} Source Spec`,
      type: 'object',
      required: [],
      properties: {}
    }

    switch (spec.authentication.type) {
      case 'oauth2':
        connectionSpec.required.push('client_id', 'client_secret', 'refresh_token')
        connectionSpec.properties = {
          client_id: {
            type: 'string',
            title: 'Client ID',
            description: 'OAuth Client ID',
            airbyte_secret: true
          },
          client_secret: {
            type: 'string',
            title: 'Client Secret',
            description: 'OAuth Client Secret',
            airbyte_secret: true
          },
          refresh_token: {
            type: 'string',
            title: 'Refresh Token',
            description: 'OAuth Refresh Token',
            airbyte_secret: true
          }
        }
        break

      case 'api_key':
        connectionSpec.required.push('api_key')
        connectionSpec.properties = {
          api_key: {
            type: 'string',
            title: 'API Key',
            description: 'API Key for authentication',
            airbyte_secret: true
          }
        }
        break

      case 'bearer':
        connectionSpec.required.push('api_token')
        connectionSpec.properties = {
          api_token: {
            type: 'string',
            title: 'API Token',
            description: 'Bearer token for authentication',
            airbyte_secret: true
          }
        }
        break

      case 'basic':
        connectionSpec.required.push('username', 'password')
        connectionSpec.properties = {
          username: {
            type: 'string',
            title: 'Username',
            description: 'Username for basic authentication'
          },
          password: {
            type: 'string',
            title: 'Password',
            description: 'Password for basic authentication',
            airbyte_secret: true
          }
        }
        break
    }

    return {
      type: 'Spec',
      connection_specification: connectionSpec
    }
  }

  private async registerCustomConnector(name: string, manifest: ConnectorManifest): Promise<string> {
    // For Airbyte Cloud, we generate the manifest but don't register via API
    // For OSS, this would make an API call to register the connector
    
    const connectorId = `custom_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`
    
    // Log the manifest for manual upload
    console.log(`Connector manifest generated for ${name}`)
    console.log('Upload this manifest to Airbyte through the UI or use Terraform')
    
    return connectorId
  }

  async discoverAPIEndpoints(baseUrl: string, options?: {
    headers?: Record<string, string>
    openApiUrl?: string
  }): Promise<APISpecification> {
    try {
      if (options?.openApiUrl) {
        return await this.parseOpenAPISpec(options.openApiUrl, baseUrl)
      }
      
      // Try common OpenAPI paths
      const commonPaths = ['/openapi.json', '/swagger.json', '/api-docs']
      for (const path of commonPaths) {
        try {
          const response = await axios.get(`${baseUrl}${path}`, {
            headers: options?.headers,
            timeout: 5000
          })
          
          if (response.data && (response.data.openapi || response.data.swagger)) {
            return await this.parseOpenAPISpec(`${baseUrl}${path}`, baseUrl)
          }
        } catch (error) {
          // Continue to next path
        }
      }
      
      // Return basic spec
      return {
        name: new URL(baseUrl).hostname.replace(/\./g, '_'),
        baseUrl: baseUrl,
        authentication: {
          type: 'api_key',
          apiKeyConfig: {
            headerName: 'X-API-Key',
            location: 'header'
          }
        },
        endpoints: [],
        rateLimit: {
          requestsPerMinute: 60
        }
      }
    } catch (error) {
      throw new Error('Failed to discover API endpoints')
    }
  }

  private async parseOpenAPISpec(openApiUrl: string, baseUrl: string): Promise<APISpecification> {
    const response = await axios.get(openApiUrl)
    const spec = response.data
    
    const authType = this.extractAuthType(spec)
    const endpoints = this.extractEndpoints(spec)
    
    return {
      name: spec.info?.title || new URL(baseUrl).hostname.replace(/\./g, '_'),
      baseUrl: baseUrl,
      authentication: authType,
      endpoints: endpoints,
      rateLimit: {
        requestsPerMinute: 60
      }
    }
  }

  private extractAuthType(spec: any): APISpecification['authentication'] {
    const securitySchemes = spec.components?.securitySchemes || spec.securityDefinitions || {}
    
    const oauth2Scheme = Object.values(securitySchemes).find((scheme: any) => 
      scheme.type === 'oauth2'
    ) as any
    
    if (oauth2Scheme) {
      const flow = oauth2Scheme.flows?.authorizationCode || oauth2Scheme.flow
      return {
        type: 'oauth2',
        oauth2Config: {
          authorizationUrl: flow?.authorizationUrl,
          tokenUrl: flow?.tokenUrl,
          scopes: Object.keys(flow?.scopes || {})
        }
      }
    }
    
    const apiKeyScheme = Object.values(securitySchemes).find((scheme: any) => 
      scheme.type === 'apiKey'
    ) as any
    
    if (apiKeyScheme) {
      return {
        type: 'api_key',
        apiKeyConfig: {
          headerName: apiKeyScheme.name,
          location: apiKeyScheme.in as 'header' | 'query'
        }
      }
    }
    
    const bearerScheme = Object.values(securitySchemes).find((scheme: any) => 
      scheme.type === 'http' && scheme.scheme === 'bearer'
    ) as any
    
    if (bearerScheme) {
      return {
        type: 'bearer'
      }
    }
    
    return {
      type: 'api_key',
      apiKeyConfig: {
        headerName: 'X-API-Key',
        location: 'header'
      }
    }
  }

  private extractEndpoints(spec: any): APISpecification['endpoints'] {
    const endpoints: APISpecification['endpoints'] = []
    const paths = spec.paths || {}
    
    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'delete'].includes(method.toLowerCase())) {
          if (method.toUpperCase() === 'GET') {
            endpoints.push({
              name: (operation as any).operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
              path: path,
              method: method.toUpperCase() as any,
              paginated: this.checkIfPaginated(operation),
              paginationType: this.detectPaginationType(operation),
              responseFormat: 'json',
              dataPath: this.detectDataPath(operation)
            })
          }
        }
      }
    }
    
    return endpoints
  }

  private checkIfPaginated(operation: any): boolean {
    const parameters = operation.parameters || []
    const paginationParams = ['page', 'offset', 'limit', 'cursor', 'pageSize', 'per_page']
    
    return parameters.some((param: any) => 
      paginationParams.includes(param.name?.toLowerCase())
    )
  }

  private detectPaginationType(operation: any): 'offset' | 'page' | 'cursor' | undefined {
    const parameters = operation.parameters || []
    const paramNames = parameters.map((p: any) => p.name?.toLowerCase())
    
    if (paramNames.includes('cursor')) return 'cursor'
    if (paramNames.includes('page')) return 'page'
    if (paramNames.includes('offset')) return 'offset'
    
    return undefined
  }

  private detectDataPath(operation: any): string {
    const responseSchema = operation.responses?.['200']?.content?.['application/json']?.schema
    
    if (responseSchema?.properties) {
      const dataFields = ['data', 'items', 'results', 'records', 'content']
      
      for (const field of dataFields) {
        if (responseSchema.properties[field]?.type === 'array') {
          return field
        }
      }
    }
    
    return '$'
  }
}

export function createAutoConnector(config?: any): AirbyteAutoConnector {
  return new AirbyteAutoConnector(config || {
    apiKey: process.env.AIRBYTE_API_KEY,
    workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
    baseUrl: process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
  })
}