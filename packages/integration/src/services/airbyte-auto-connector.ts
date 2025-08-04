import { AirbyteConnector } from '../connectors/airbyte-connector'
import { IntegrationError } from '../errors'
import axios from 'axios'

export interface APISpecification {
  name: string
  baseUrl: string
  authentication: {
    type: 'oauth2' | 'api_key' | 'basic' | 'bearer'
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
    dataPath?: string // JSONPath to data array in response
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
  private airbyteConnector: AirbyteConnector

  constructor(airbyteConfig: any) {
    this.airbyteConnector = new AirbyteConnector(airbyteConfig)
  }

  /**
   * Creates a custom Airbyte connector from an API specification
   */
  async createConnectorFromAPI(spec: APISpecification): Promise<{
    connectorId: string
    manifest: ConnectorManifest
  }> {
    try {
      // Generate connector manifest
      const manifest = this.generateConnectorManifest(spec)
      
      // Create the custom connector in Airbyte
      const connectorId = await this.registerCustomConnector(spec.name, manifest)
      
      return {
        connectorId,
        manifest
      }
    } catch (error) {
      throw new IntegrationError(
        `Failed to create auto-connector for ${spec.name}`,
        'AUTO_CONNECTOR_CREATION_FAILED',
        error
      )
    }
  }

  /**
   * Generates a Low-Code CDK YAML manifest from API specification
   */
  private generateConnectorManifest(spec: APISpecification): ConnectorManifest {
    const manifest: ConnectorManifest = {
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

    return manifest
  }

  /**
   * Generates the requester configuration
   */
  private generateRequester(spec: APISpecification): any {
    const requester = {
      type: 'HttpRequester',
      url_base: spec.baseUrl,
      http_method: 'GET',
      request_parameters: {},
      request_headers: {
        'Accept': 'application/json',
        'User-Agent': 'Airbyte'
      },
      request_body_json: {},
      request_options_provider: {
        request_parameters: {},
        request_headers: {},
        request_body_data: {},
        request_body_json: {}
      }
    }

    // Add rate limiting if specified
    if (spec.rateLimit) {
      requester.request_options_provider = {
        ...requester.request_options_provider,
        // request_rate_limiter: {
        //   type: 'FixedWindowRateLimiter',
        //   max_requests: spec.rateLimit.requestsPerMinute || 60,
        //   time_window: 60
        // }
      }
    }

    return requester
  }

  /**
   * Generates authenticator configuration based on auth type
   */
  private generateAuthenticator(spec: APISpecification): any {
    switch (spec.authentication.type) {
      case 'oauth2':
        return {
          type: 'OAuthAuthenticator',
          client_id: '{{ config["client_id"] }}',
          client_secret: '{{ config["client_secret"] }}',
          refresh_token: '{{ config["refresh_token"] }}',
          token_refresh_endpoint: spec.authentication.oauth2Config?.tokenUrl,
          scopes: spec.authentication.oauth2Config?.scopes || [],
          grant_type: spec.authentication.oauth2Config?.grantType || 'refresh_token',
          refresh_request_body: {},
          token_expiry_date_format: '%Y-%m-%dT%H:%M:%S.%fZ',
          expires_in_name: 'expires_in',
          access_token_name: 'access_token',
          token_expiry_date_name: 'expires_at'
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

  /**
   * Generates paginator configuration
   */
  private generatePaginator(spec: APISpecification): any {
    // Check if any endpoint has pagination
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
          page_size_option: {
            type: 'RequestOption',
            inject_into: 'request_parameter',
            field_name: 'per_page'
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
            cursor_value: '{{ response.next_cursor }}',
            stop_condition: '{{ not response.has_more }}'
          }
        }

      default:
        return null
    }
  }

  /**
   * Generates stream configurations
   */
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
              field_path: endpoint.dataPath ? [endpoint.dataPath] : ['data']
            }
          }
        }
      }

      // Add paginator if endpoint is paginated
      if (endpoint.paginated) {
        stream.retriever.paginator = {
          $ref: '#/definitions/paginator'
        }
      }

      // Add authenticator
      stream.retriever.requester.authenticator = {
        $ref: '#/definitions/authenticator'
      }

      return stream
    })
  }

  /**
   * Generates connector specification
   */
  private generateSpec(spec: APISpecification): any {
    const connectionSpec: any = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: `${spec.name} Source Spec`,
      type: 'object',
      required: [],
      properties: {}
    }

    // Add authentication fields based on type
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

  /**
   * Registers a custom connector with Airbyte
   */
  private async registerCustomConnector(name: string, manifest: ConnectorManifest): Promise<string> {
    try {
      // For Airbyte OSS/Self-Managed, we can use the API to create custom connectors
      // For Airbyte Cloud, this needs to be done through the UI or Terraform
      
      // Convert manifest to YAML string
      const yaml = require('js-yaml')
      const manifestYaml = yaml.dump(manifest)
      
      // Create custom source definition
      const response = await this.airbyteConnector.executeRequest('/source_definitions/create_custom', 'POST', {
        workspaceId: this.airbyteConnector['config'].workspaceId,
        sourceDefinition: {
          name: name,
          dockerRepository: 'airbyte/source-declarative-manifest',
          dockerImageTag: 'latest',
          documentationUrl: `https://docs.airbyte.com/integrations/sources/${name.toLowerCase()}`,
          icon: '',
          sourceType: 'custom',
          spec: manifest.spec.connection_specification
        },
        customSourceConfig: {
          manifest: manifestYaml
        }
      })
      
      return response.sourceDefinitionId
    } catch (error) {
      // Fallback: Save manifest locally for manual upload
      const fs = require('fs').promises
      const path = require('path')
      
      const manifestDir = path.join(process.cwd(), 'generated-connectors')
      await fs.mkdir(manifestDir, { recursive: true })
      
      const yaml = require('js-yaml')
      const manifestYaml = yaml.dump(manifest)
      const manifestPath = path.join(manifestDir, `${name.toLowerCase()}-connector.yaml`)
      
      await fs.writeFile(manifestPath, manifestYaml, 'utf-8')
      
      console.log(`Connector manifest saved to: ${manifestPath}`)
      console.log('Upload this manifest to Airbyte through the UI or use Terraform for deployment')
      
      // Return a placeholder ID
      return `custom_${name.toLowerCase()}_${Date.now()}`
    }
  }

  /**
   * Auto-discovers API endpoints and generates specification
   */
  async discoverAPIEndpoints(baseUrl: string, options?: {
    headers?: Record<string, string>
    openApiUrl?: string
  }): Promise<APISpecification> {
    try {
      // Try to find OpenAPI/Swagger documentation
      if (options?.openApiUrl) {
        return await this.parseOpenAPISpec(options.openApiUrl, baseUrl)
      }
      
      // Try common OpenAPI paths
      const commonPaths = ['/openapi.json', '/swagger.json', '/api-docs', '/v1/api-docs']
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
      
      // Fallback: Return basic specification template
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
      throw new IntegrationError(
        'Failed to discover API endpoints',
        'API_DISCOVERY_FAILED',
        error
      )
    }
  }

  /**
   * Parses OpenAPI/Swagger specification
   */
  private async parseOpenAPISpec(openApiUrl: string, baseUrl: string): Promise<APISpecification> {
    try {
      const response = await axios.get(openApiUrl)
      const spec = response.data
      
      // Extract authentication methods
      const authType = this.extractAuthType(spec)
      
      // Extract endpoints
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
    } catch (error) {
      throw new IntegrationError(
        'Failed to parse OpenAPI specification',
        'OPENAPI_PARSE_FAILED',
        error
      )
    }
  }

  /**
   * Extracts authentication type from OpenAPI spec
   */
  private extractAuthType(spec: any): APISpecification['authentication'] {
    const securitySchemes = spec.components?.securitySchemes || spec.securityDefinitions || {}
    
    // Check for OAuth2
    const oauth2Scheme = Object.values(securitySchemes).find((scheme: any) => 
      scheme.type === 'oauth2' || scheme.type === 'OAuth2'
    ) as any
    
    if (oauth2Scheme) {
      const flow = oauth2Scheme.flows?.authorizationCode || oauth2Scheme.flow
      return {
        type: 'oauth2',
        oauth2Config: {
          authorizationUrl: flow?.authorizationUrl || flow?.authUrl,
          tokenUrl: flow?.tokenUrl,
          scopes: Object.keys(flow?.scopes || {})
        }
      }
    }
    
    // Check for API key
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
    
    // Check for Bearer token
    const bearerScheme = Object.values(securitySchemes).find((scheme: any) => 
      scheme.type === 'http' && scheme.scheme === 'bearer'
    ) as any
    
    if (bearerScheme) {
      return {
        type: 'bearer'
      }
    }
    
    // Default to API key
    return {
      type: 'api_key',
      apiKeyConfig: {
        headerName: 'X-API-Key',
        location: 'header'
      }
    }
  }

  /**
   * Extracts endpoints from OpenAPI spec
   */
  private extractEndpoints(spec: any): APISpecification['endpoints'] {
    const endpoints: APISpecification['endpoints'] = []
    const paths = spec.paths || {}
    
    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'delete'].includes(method.toLowerCase())) {
          // Only include GET endpoints for data retrieval
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

  /**
   * Checks if an endpoint is paginated based on parameters
   */
  private checkIfPaginated(operation: any): boolean {
    const parameters = operation.parameters || []
    const paginationParams = ['page', 'offset', 'limit', 'cursor', 'pageSize', 'per_page']
    
    return parameters.some((param: any) => 
      paginationParams.includes(param.name?.toLowerCase())
    )
  }

  /**
   * Detects pagination type from operation parameters
   */
  private detectPaginationType(operation: any): 'offset' | 'page' | 'cursor' | undefined {
    const parameters = operation.parameters || []
    const paramNames = parameters.map((p: any) => p.name?.toLowerCase())
    
    if (paramNames.includes('cursor')) return 'cursor'
    if (paramNames.includes('page')) return 'page'
    if (paramNames.includes('offset')) return 'offset'
    
    return undefined
  }

  /**
   * Detects data path in response
   */
  private detectDataPath(operation: any): string {
    // Try to detect from response schema
    const responseSchema = operation.responses?.['200']?.content?.['application/json']?.schema
    
    if (responseSchema?.properties) {
      // Common data field names
      const dataFields = ['data', 'items', 'results', 'records', 'content']
      
      for (const field of dataFields) {
        if (responseSchema.properties[field]?.type === 'array') {
          return field
        }
      }
    }
    
    // Default to root level
    return '$'
  }
}

// Factory function
export function createAutoConnector(airbyteConfig?: any): AirbyteAutoConnector {
  return new AirbyteAutoConnector(airbyteConfig || {
    apiKey: process.env.AIRBYTE_API_KEY,
    workspaceId: process.env.AIRBYTE_WORKSPACE_ID,
    baseUrl: process.env.AIRBYTE_API_URL || 'https://api.airbyte.com/v1'
  })
}