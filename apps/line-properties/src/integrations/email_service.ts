import { IntegrationService, createAirbyteConnector, RESTConnector } from '@opsai/integration';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface EmailServiceConfig {
  baseUrl: string;
  timeout?: number;
  
}

export class EmailServiceClient {
  private client: AxiosInstance;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => this.addAuthentication(config),
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  

  
  async sendEmail(data?: any, params?: Record<string, any>): Promise<any> {
    
    
    try {
      const response = await this.client.post('/emails', data, { params });
      return response.data;
    } catch (error) {
      console.error(`sendEmail failed:`, error);
      throw error;
    }
  }

  private addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig {
    return config;
    return config;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    return headers;
  }

  private handleError(error: any) {
    console.error(`EmailService API Error:`, error.response?.data || error.message);
    throw new Error(`EmailService API request failed: ${error.response?.data?.message || error.message}`);
  }
}

// Export singleton instance
export const emailServiceClient = new EmailServiceClient({
  baseUrl: process.env.EMAIL_SERVICE_BASE_URL || '',
  
});