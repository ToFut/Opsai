import { prisma } from '@opsai/database'
import { CacheService } from '@opsai/performance'
import { SecurityService } from '@opsai/security'

export interface ApiEndpoint {
  path: string
  method: string
  summary: string
  description: string
  parameters: ApiParameter[]
  requestBody?: ApiRequestBody
  responses: ApiResponse[]
  tags: string[]
  deprecated: boolean
  rateLimit?: number
}

export interface ApiParameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required: boolean
  schema: any
  description: string
  example?: any
}

export interface ApiRequestBody {
  required: boolean
  content: Record<string, any>
  description: string
}

export interface ApiResponse {
  code: string
  description: string
  content?: Record<string, any>
  headers?: Record<string, any>
}

export interface ApiKey {
  id: string
  tenantId: string
  userId: string
  name: string
  key: string
  permissions: string[]
  rateLimit: number
  isActive: boolean
  lastUsed?: Date
  createdAt: Date
  expiresAt?: Date
}

export interface Webhook {
  id: string
  tenantId: string
  name: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  retryCount: number
  lastDelivery?: Date
  createdAt: Date
}

export interface SdkConfig {
  language: 'javascript' | 'python' | 'ruby' | 'go' | 'java' | 'csharp'
  version: string
  baseUrl: string
  authType: 'bearer' | 'api_key' | 'oauth2'
  features: string[]
}

export class DeveloperService {
  private cacheService: CacheService
  private securityService: SecurityService
  private apiEndpoints: Map<string, ApiEndpoint>

  constructor(cacheService: CacheService, securityService: SecurityService) {
    this.cacheService = cacheService
    this.securityService = securityService
    this.apiEndpoints = new Map()
    this.initializeApiEndpoints()
  }

  /**
   * Initialize API endpoints
   */
  private initializeApiEndpoints(): void {
    // Authentication endpoints
    this.addEndpoint({
      path: '/api/auth/login',
      method: 'POST',
      summary: 'User login',
      description: 'Authenticate user with email and password',
      parameters: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8 }
              },
              required: ['email', 'password']
            }
          }
        },
        description: 'Login credentials'
      },
      responses: [
        {
          code: '200',
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  user: { type: 'object' }
                }
              }
            }
          }
        },
        {
          code: '401',
          description: 'Invalid credentials'
        }
      ],
      tags: ['Authentication'],
      deprecated: false,
      rateLimit: 100
    })

    // User management endpoints
    this.addEndpoint({
      path: '/api/users',
      method: 'GET',
      summary: 'Get users',
      description: 'Retrieve list of users for the tenant',
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number'
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Number of items per page'
        }
      ],
      responses: [
        {
          code: '200',
          description: 'Users retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  users: { type: 'array', items: { type: 'object' } },
                  total: { type: 'integer' },
                  page: { type: 'integer' },
                  limit: { type: 'integer' }
                }
              }
            }
          }
        }
      ],
      tags: ['Users'],
      deprecated: false,
      rateLimit: 1000
    })

    // Dashboard endpoints
    this.addEndpoint({
      path: '/api/dashboards/{id}/data',
      method: 'GET',
      summary: 'Get dashboard data',
      description: 'Retrieve real-time data for a specific dashboard',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Dashboard ID'
        },
        {
          name: 'refresh',
          in: 'query',
          required: false,
          schema: { type: 'boolean', default: false },
          description: 'Force data refresh'
        }
      ],
      responses: [
        {
          code: '200',
          description: 'Dashboard data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'object' },
                  lastUpdated: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      ],
      tags: ['Dashboards'],
      deprecated: false,
      rateLimit: 500
    })
  }

  /**
   * Add API endpoint
   */
  private addEndpoint(endpoint: ApiEndpoint): void {
    const key = `${endpoint.method.toUpperCase()}:${endpoint.path}`
    this.apiEndpoints.set(key, endpoint)
  }

  /**
   * Generate OpenAPI specification
   */
  generateOpenAPISpec(baseUrl: string, version: string = '1.0.0'): any {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'OPSAI Platform API',
        description: 'Complete API for the OPSAI platform',
        version,
        contact: {
          name: 'OPSAI Support',
          email: 'support@opsai.com'
        }
      },
      servers: [
        {
          url: baseUrl,
          description: 'Production server'
        }
      ],
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          apiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        },
        {
          apiKeyAuth: []
        }
      ]
    }

    // Add paths
    for (const endpoint of this.apiEndpoints.values()) {
      const path = endpoint.path
      const method = endpoint.method.toLowerCase()

      if (!spec.paths[path]) {
        spec.paths[path] = {}
      }

      spec.paths[path][method] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        deprecated: endpoint.deprecated,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: this.formatResponses(endpoint.responses)
      }
    }

    return spec
  }

  /**
   * Format API responses
   */
  private formatResponses(responses: ApiResponse[]): Record<string, any> {
    const formatted: Record<string, any> = {}

    for (const response of responses) {
      formatted[response.code] = {
        description: response.description,
        content: response.content,
        headers: response.headers
      }
    }

    return formatted
  }

  /**
   * Generate SDK for specific language
   */
  async generateSDK(config: SdkConfig): Promise<{ code: string; filename: string }> {
    const cacheKey = `sdk:${config.language}:${config.version}`
    const cached = await this.cacheService.get<{ code: string; filename: string }>(cacheKey)
    
    if (cached) {
      return cached
    }

    let code = ''
    let filename = ''

    switch (config.language) {
      case 'javascript':
        const jsResult = this.generateJavaScriptSDK(config)
        code = jsResult.code
        filename = jsResult.filename
        break
      case 'python':
        const pyResult = this.generatePythonSDK(config)
        code = pyResult.code
        filename = pyResult.filename
        break
      case 'ruby':
        const rbResult = this.generateRubySDK(config)
        code = rbResult.code
        filename = rbResult.filename
        break
      case 'go':
        const goResult = this.generateGoSDK(config)
        code = goResult.code
        filename = goResult.filename
        break
      default:
        throw new Error(`Unsupported language: ${config.language}`)
    }

    const result = { code, filename }
    await this.cacheService.set(cacheKey, result, { ttl: 3600 }) // Cache for 1 hour

    return result
  }

  /**
   * Generate JavaScript SDK
   */
  private generateJavaScriptSDK(config: SdkConfig): { code: string; filename: string } {
    const code = `/**
 * OPSAI Platform SDK - JavaScript
 * Version: ${config.version}
 * Generated: ${new Date().toISOString()}
 */

class OpsaiSDK {
  constructor(config) {
    this.baseUrl = config.baseUrl || '${config.baseUrl}'
    this.apiKey = config.apiKey
    this.token = config.token
    this.timeout = config.timeout || 30000
  }

  async request(method, path, data = null, options = {}) {
    const url = \`\${this.baseUrl}\${path}\`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey
    } else if (this.token) {
      headers['Authorization'] = \`Bearer \${this.token}\`
    }

    const config = {
      method,
      headers,
      timeout: this.timeout,
      ...options
    }

    if (data) {
      config.body = JSON.stringify(data)
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(\`API request failed: \${response.status} \${response.statusText}\`)
    }

    return await response.json()
  }

  // Authentication
  async login(email, password) {
    return this.request('POST', '/api/auth/login', { email, password })
  }

  // Users
  async getUsers(page = 1, limit = 20) {
    return this.request('GET', \`/api/users?page=\${page}&limit=\${limit}\`)
  }

  // Dashboards
  async getDashboardData(id, refresh = false) {
    return this.request('GET', \`/api/dashboards/\${id}/data?refresh=\${refresh}\`)
  }
}

module.exports = OpsaiSDK
`

    return {
      code,
      filename: `opsai-sdk-${config.version}.js`
    }
  }

  /**
   * Generate Python SDK
   */
  private generatePythonSDK(config: SdkConfig): { code: string; filename: string } {
    const code = `"""
OPSAI Platform SDK - Python
Version: ${config.version}
Generated: ${new Date().toISOString()}
"""

import requests
import json
from typing import Optional, Dict, Any

class OpsaiSDK:
    def __init__(self, config: Dict[str, Any]):
        self.base_url = config.get('baseUrl', '${config.baseUrl}')
        self.api_key = config.get('apiKey')
        self.token = config.get('token')
        self.timeout = config.get('timeout', 30)
        
    def _request(self, method: str, path: str, data: Optional[Dict] = None, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        headers = {
            'Content-Type': 'application/json',
            **kwargs.get('headers', {})
        }
        
        if self.api_key:
            headers['X-API-Key'] = self.api_key
        elif self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=data,
            timeout=self.timeout,
            **kwargs
        )
        
        response.raise_for_status()
        return response.json()
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user with email and password"""
        return self._request('POST', '/api/auth/login', {'email': email, 'password': password})
    
    def get_users(self, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get users for the tenant"""
        return self._request('GET', f'/api/users?page={page}&limit={limit}')
    
    def get_dashboard_data(self, dashboard_id: str, refresh: bool = False) -> Dict[str, Any]:
        """Get dashboard data"""
        return self._request('GET', f'/api/dashboards/{dashboard_id}/data?refresh={refresh}')
`

    return {
      code,
      filename: `opsai_sdk_${config.version.replace('.', '_')}.py`
    }
  }

  /**
   * Generate Ruby SDK
   */
  private generateRubySDK(config: SdkConfig): { code: string; filename: string } {
    const code = `# OPSAI Platform SDK - Ruby
# Version: ${config.version}
# Generated: ${new Date().toISOString()}

require 'net/http'
require 'json'
require 'uri'

class OpsaiSDK
  def initialize(config)
    @base_url = config[:base_url] || config['base_url'] || '${config.baseUrl}'
    @api_key = config[:api_key] || config['api_key']
    @token = config[:token] || config['token']
    @timeout = config[:timeout] || config['timeout'] || 30
  end

  def request(method, path, data = nil, options = {})
    uri = URI("#{@base_url}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'
    http.open_timeout = @timeout
    http.read_timeout = @timeout

    request = case method.upcase
    when 'GET'
      Net::HTTP::Get.new(uri)
    when 'POST'
      Net::HTTP::Post.new(uri)
    when 'PUT'
      Net::HTTP::Put.new(uri)
    when 'DELETE'
      Net::HTTP::Delete.new(uri)
    end

    request['Content-Type'] = 'application/json'
    request['X-API-Key'] = @api_key if @api_key
    request['Authorization'] = "Bearer #{@token}" if @token

    request.body = data.to_json if data

    response = http.request(request)
    
    unless response.is_a?(Net::HTTPSuccess)
      raise "API request failed: #{response.code} #{response.message}"
    end

    JSON.parse(response.body)
  end

  def login(email, password)
    request('POST', '/api/auth/login', { email: email, password: password })
  end

  def get_users(page = 1, limit = 20)
    request('GET', "/api/users?page=#{page}&limit=#{limit}")
  end

  def get_dashboard_data(dashboard_id, refresh = false)
    request('GET', "/api/dashboards/#{dashboard_id}/data?refresh=#{refresh}")
  end
end
`

    return {
      code,
      filename: `opsai_sdk_${config.version.gsub('.', '_')}.rb`
    }
  }

  /**
   * Generate Go SDK
   */
  private generateGoSDK(config: SdkConfig): { code: string; filename: string } {
    const code = `// OPSAI Platform SDK - Go
// Version: ${config.version}
// Generated: ${new Date().toISOString()}

package opsai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Config struct {
	BaseURL string
	APIKey  string
	Token   string
	Timeout time.Duration
}

type OpsaiSDK struct {
	config Config
	client *http.Client
}

func NewSDK(config Config) *OpsaiSDK {
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}

	return &OpsaiSDK{
		config: config,
		client: &http.Client{
			Timeout: config.Timeout,
		},
	}
}

func (s *OpsaiSDK) request(method, path string, data interface{}) ([]byte, error) {
	url := s.config.BaseURL + path
	var body io.Reader

	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			return nil, err
		}
		body = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	if s.config.APIKey != "" {
		req.Header.Set("X-API-Key", s.config.APIKey)
	} else if s.config.Token != "" {
		req.Header.Set("Authorization", "Bearer "+s.config.Token)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("API request failed: %d %s", resp.StatusCode, resp.Status)
	}

	return io.ReadAll(resp.Body)
}

type LoginRequest struct {
	Email    string \`json:"email"\`
	Password string \`json:"password"\`
}

func (s *OpsaiSDK) Login(email, password string) (map[string]interface{}, error) {
	data := LoginRequest{Email: email, Password: password}
	resp, err := s.request("POST", "/api/auth/login", data)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	err = json.Unmarshal(resp, &result)
	return result, err
}

func (s *OpsaiSDK) GetUsers(page, limit int) (map[string]interface{}, error) {
	path := fmt.Sprintf("/api/users?page=%d&limit=%d", page, limit)
	resp, err := s.request("GET", path, nil)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	err = json.Unmarshal(resp, &result)
	return result, err
}

func (s *OpsaiSDK) GetDashboardData(dashboardID string, refresh bool) (map[string]interface{}, error) {
	path := fmt.Sprintf("/api/dashboards/%s/data?refresh=%t", dashboardID, refresh)
	resp, err := s.request("GET", path, nil)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	err = json.Unmarshal(resp, &result)
	return result, err
}
`

    return {
      code,
      filename: `opsai_sdk_${config.version.replace('.', '_')}.go`
    }
  }

  /**
   * Create API key
   */
  async createApiKey(
    tenantId: string,
    userId: string,
    name: string,
    permissions: string[],
    rateLimit: number = 1000,
    expiresAt?: Date
  ): Promise<ApiKey> {
    try {
      const key = this.securityService.generateApiKey()
      
      const apiKey = await prisma.apiKey.create({
        data: {
          tenantId,
          userId,
          name,
          key,
          permissions,
          rateLimit,
          isActive: true,
          expiresAt,
          createdAt: new Date()
        }
      })

      return apiKey
    } catch (error) {
      console.error('Create API key error:', error)
      throw new Error('Failed to create API key')
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(key: string): Promise<ApiKey | null> {
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          key,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })

      if (apiKey) {
        // Update last used
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsed: new Date() }
        })
      }

      return apiKey
    } catch (error) {
      console.error('Validate API key error:', error)
      return null
    }
  }

  /**
   * Create webhook
   */
  async createWebhook(
    tenantId: string,
    name: string,
    url: string,
    events: string[]
  ): Promise<Webhook> {
    try {
      const secret = this.securityService.generateSecureToken(32)
      
      const webhook = await prisma.webhook.create({
        data: {
          tenantId,
          name,
          url,
          events,
          secret,
          isActive: true,
          retryCount: 3,
          createdAt: new Date()
        }
      })

      return webhook
    } catch (error) {
      console.error('Create webhook error:', error)
      throw new Error('Failed to create webhook')
    }
  }

  /**
   * Get API usage statistics
   */
  async getApiUsageStats(tenantId: string, period: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    topEndpoints: Array<{ path: string; count: number }>
  }> {
    try {
      const startDate = this.getStartDate(period)
      
      const stats = await prisma.auditLog.groupBy({
        by: ['action', 'success'],
        where: {
          tenantId,
          timestamp: { gte: startDate }
        },
        _count: {
          id: true
        }
      })

      const totalRequests = stats.reduce((sum, stat) => sum + stat._count.id, 0)
      const successfulRequests = stats
        .filter(stat => stat.success)
        .reduce((sum, stat) => sum + stat._count.id, 0)
      const failedRequests = totalRequests - successfulRequests

      // Get top endpoints
      const topEndpoints = await prisma.auditLog.groupBy({
        by: ['resource'],
        where: {
          tenantId,
          timestamp: { gte: startDate }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      })

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: 0, // Would need to track response times
        topEndpoints: topEndpoints.map(endpoint => ({
          path: endpoint.resource,
          count: endpoint._count.id
        }))
      }
    } catch (error) {
      console.error('Get API usage stats error:', error)
      throw new Error('Failed to get API usage statistics')
    }
  }

  /**
   * Get start date for period
   */
  private getStartDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date()
    
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
  }
} 