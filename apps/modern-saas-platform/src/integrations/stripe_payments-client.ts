import { BaseIntegrationClient, BaseIntegrationConfig } from './base-client';
import { ConfigurationError } from './errors';
import { AxiosRequestConfig } from 'axios';

export interface StripePaymentsConfig extends BaseIntegrationConfig {
  rateLimitRpm?: number;
}

export class StripePaymentsClient extends BaseIntegrationClient {
  private integrationConfig: StripePaymentsConfig;

  constructor(config: StripePaymentsConfig) {
    // Validate configuration
    StripePaymentsClient.validateConfig(config);
    
    super(config, {
      
    });
    
    this.integrationConfig = config;
  }

  private static validateConfig(config: StripePaymentsConfig): void {
    if (!config.baseUrl) {
      throw new ConfigurationError('baseUrl is required');
    }
    
    
  }

  protected addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig {
    return config;
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
      integration: 'stripe_payments'
    };
  }
}

// Factory function for easy instantiation
export function createStripePaymentsClient(): StripePaymentsClient {
  const envPrefix = 'STRIPE_PAYMENTS';
  
  const config: StripePaymentsConfig = {
    baseUrl: process.env.`${envPrefix}_BASE_URL` || 'https://api.stripe.com/v1',
    timeout: parseInt(process.env.`${envPrefix}_TIMEOUT` || '30000'),
    rateLimitRpm: parseInt(process.env.STRIPE_PAYMENTS_RATE_LIMIT_RPM || '100')
  };

  return new StripePaymentsClient(config);
}

// Export singleton instance
export const stripePaymentsClient = createStripePaymentsClient();