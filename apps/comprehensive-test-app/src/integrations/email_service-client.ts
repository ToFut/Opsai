import { BaseIntegrationClient, BaseIntegrationConfig } from './base-client';
import { ConfigurationError } from './errors';
import { AxiosRequestConfig } from 'axios';

export interface EmailServiceConfig extends BaseIntegrationConfig {
  apiKey?: string;
  rateLimitRpm?: number;
}

export class EmailServiceClient extends BaseIntegrationClient {
  private integrationConfig: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    // Validate configuration
    EmailServiceClient.validateConfig(config);
    
    super(config, {
      api_key: config.apiKey || process.env.EMAIL_SERVICE_API_KEY
    });
    
    this.integrationConfig = config;
  }

  private static validateConfig(config: EmailServiceConfig): void {
    if (!config.baseUrl) {
      throw new ConfigurationError('baseUrl is required');
    }
    
    
    if (!config.apiKey && !process.env.EMAIL_SERVICE_API_KEY) {
      throw new ConfigurationError('api_key is required. Set config.apiKey or environment variable EMAIL_SERVICE_API_KEY');
    }
  }

  protected addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig {
    
    const apiKey = this.credentials.api_key;
    if (apiKey) {
      config.headers = { ...config.headers, 'X-API-Key': apiKey };
    }
    return config;
  }

  
  async get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
    return this.makeRequest<T>('GET', path, undefined, params);
  }


  async list<T = any[]>(path: string, params?: Record<string, any>): Promise<T> {
    return this.makeRequest<T>('GET', path, undefined, params);
  }


  async create<T = any>(path: string, data: any): Promise<T> {
    return this.makeRequest<T>('POST', path, data);
  }


  async update<T = any>(path: string, data: any): Promise<T> {
    return this.makeRequest<T>('PUT', path, data);
  }


  async delete<T = any>(path: string): Promise<T> {
    return this.makeRequest<T>('DELETE', path);
  }

  // Health check specific to this integration
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string; integration: string }> {
    const baseHealth = await super.healthCheck();
    return {
      ...baseHealth,
      integration: 'email_service'
    };
  }
}

// Factory function for easy instantiation
export function createEmailServiceClient(): EmailServiceClient {
  const envPrefix = 'EMAIL_SERVICE';
  
  const config: EmailServiceConfig = {
    baseUrl: process.env[`${envPrefix}_BASE_URL`] || 'https://api.sendgrid.com/v3',
    timeout: parseInt(process.env[`${envPrefix}_TIMEOUT`] || '30000'),
    rateLimitRpm: parseInt(process.env.EMAIL_SERVICE_RATE_LIMIT_RPM || '600'),
    apiKey: process.env.EMAIL_SERVICE_API_KEY
  };

  return new EmailServiceClient(config);
}

// Export singleton instance
export const emailServiceClient = createEmailServiceClient();