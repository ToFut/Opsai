import { IntegrationService, createAirbyteConnector, RESTConnector } from '@opsai/integration';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface GuestyApiConfig {
  baseUrl: string;
  timeout?: number;
  
}

export class GuestyApiClient {
  private client: AxiosInstance;
  private config: GuestyApiConfig;

  constructor(config: GuestyApiConfig) {
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

  

  
  async getListings(params?: Record<string, any>): Promise<any> {
    
    
    try {
      const response = await this.client.get('/listings', { params });
      return response.data;
    } catch (error) {
      console.error(`getListings failed:`, error);
      throw error;
    }
  }


  async createReservation(data?: any, params?: Record<string, any>): Promise<any> {
    
    
    try {
      const response = await this.client.post('/reservations', data, { params });
      return response.data;
    } catch (error) {
      console.error(`createReservation failed:`, error);
      throw error;
    }
  }


  async refreshToken(data?: any, params?: Record<string, any>): Promise<any> {
    
    
    try {
      const response = await this.client.post('/oauth2/token', data, { params });
      return response.data;
    } catch (error) {
      console.error(`refreshToken failed:`, error);
      throw error;
    }
  }

  private addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig {
    const apiKey = process.env.GUESTY_API_KEY;
    if (apiKey && config.headers) {
      config.headers['Authorization'] = `Bearer ${apiKey}`;
    }
    return config;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const apiKey = process.env.GUESTY_API_KEY;
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    return headers;
  }

  private handleError(error: any) {
    console.error(`GuestyApi API Error:`, error.response?.data || error.message);
    throw new Error(`GuestyApi API request failed: ${error.response?.data?.message || error.message}`);
  }
}

// Export singleton instance
export const guestyApiClient = new GuestyApiClient({
  baseUrl: process.env.GUESTY_API_BASE_URL || '',
  
});