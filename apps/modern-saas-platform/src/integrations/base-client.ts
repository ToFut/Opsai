import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { IntegrationError, RateLimitError, AuthenticationError } from './errors';
import { RateLimiter } from './rate-limiter';
import { RetryManager } from './retry-manager';
import { validateEnv } from '../../config/env-validation';

export interface BaseIntegrationConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  rateLimitRpm?: number;
  validateResponse?: boolean;
}

export interface IntegrationCredentials {
  [key: string]: string;
}

export abstract class BaseIntegrationClient {
  protected client: AxiosInstance;
  protected config: BaseIntegrationConfig;
  protected rateLimiter: RateLimiter;
  protected retryManager: RetryManager;
  protected credentials: IntegrationCredentials;

  constructor(config: BaseIntegrationConfig, credentials: IntegrationCredentials = {}) {
    this.config = config;
    this.credentials = credentials;
    
    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(config.rateLimitRpm || 60);
    
    // Initialize retry manager
    this.retryManager = new RetryManager(config.retries || 3);
    
    // Create axios instance
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `CORE-Platform/1.0 (${process.env.APP_NAME || 'opsai-app'})`
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Rate limiting
        await this.rateLimiter.acquire();
        
        // Add authentication
        config = this.addAuthentication(config);
        
        // Add request ID for tracing
        config.headers = {
          ...config.headers,
          'X-Request-ID': this.generateRequestId()
        };
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.config.validateResponse) {
          this.validateResponse(response);
        }
        return response;
      },
      (error) => this.handleError(error)
    );
  }

  protected abstract addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig;

  protected validateResponse(response: AxiosResponse): void {
    // Override in subclasses for custom validation
  }

  protected handleError(error: any): Promise<never> {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || error.message;
      
      switch (status) {
        case 401:
        case 403:
          throw new AuthenticationError(`Authentication failed: ${message}`);
        case 429:
          throw new RateLimitError(`Rate limit exceeded: ${message}`);
        default:
          throw new IntegrationError(`API request failed (${status}): ${message}`);
      }
    } else if (error.request) {
      throw new IntegrationError(`Network error: ${error.message}`);
    } else {
      throw new IntegrationError(`Request configuration error: ${error.message}`);
    }
  }

  protected async makeRequest<T = any>(
    method: string,
    path: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    return this.retryManager.execute(async () => {
      const response = await this.client.request({
        method,
        url: path,
        data,
        params
      });
      
      return response.data;
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      await this.makeRequest('GET', '/health');
      return { status: 'healthy' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}