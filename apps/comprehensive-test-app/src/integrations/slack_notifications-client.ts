import { BaseIntegrationClient, BaseIntegrationConfig } from './base-client';
import { ConfigurationError } from './errors';
import { AxiosRequestConfig } from 'axios';

export interface SlackNotificationsConfig extends BaseIntegrationConfig {
  
}

export class SlackNotificationsClient extends BaseIntegrationClient {
  private integrationConfig: SlackNotificationsConfig;

  constructor(config: SlackNotificationsConfig) {
    // Validate configuration
    SlackNotificationsClient.validateConfig(config);
    
    super(config, {
      
    });
    
    this.integrationConfig = config;
  }

  private static validateConfig(config: SlackNotificationsConfig): void {
    if (!config.baseUrl) {
      throw new ConfigurationError('baseUrl is required');
    }
    
    
  }

  protected addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig {
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
      integration: 'slack_notifications'
    };
  }
}

// Factory function for easy instantiation
export function createSlackNotificationsClient(): SlackNotificationsClient {
  const envPrefix = 'SLACK_NOTIFICATIONS';
  
  const config: SlackNotificationsConfig = {
    baseUrl: process.env[`${envPrefix}_BASE_URL`] || '',
    timeout: parseInt(process.env[`${envPrefix}_TIMEOUT`] || '30000'),
    
  };

  return new SlackNotificationsClient(config);
}

// Export singleton instance
export const slackNotificationsClient = createSlackNotificationsClient();