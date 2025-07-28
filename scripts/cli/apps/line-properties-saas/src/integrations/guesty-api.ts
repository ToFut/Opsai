import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface GuestyApiConfig {
  baseUrl: string;
  timeout?: number;
  
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
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

  
  async refreshToken(): Promise<string> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/oauth2/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId || process.env.GUESTY_API_CLIENT_ID,
        client_secret: this.config.clientSecret || process.env.GUESTY_API_CLIENT_SECRET,
        scope: 'open-api'
      });
      
      const accessToken = response.data.access_token;
      this.config.accessToken = accessToken;
      
      // Update client headers
      this.client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh OAuth2 token');
    }
  }

  async ensureValidToken(): Promise<void> {
    if (!this.config.accessToken) {
      await this.refreshToken();
    }
  }

  
  async getListings(params?: Record<string, any>): Promise<any> {
    await this.ensureValidToken();
    
    try {
      const response = await this.client.get('/listings', { params });
      return response.data;
    } catch (error) {
      console.error(`getListings failed:`, error);
      throw error;
    }
  }


  async createReservation(data?: any, params?: Record<string, any>): Promise<any> {
    await this.ensureValidToken();
    
    try {
      const response = await this.client.post('/reservations', data, { params });
      return response.data;
    } catch (error) {
      console.error(`createReservation failed:`, error);
      throw error;
    }
  }


  async refreshToken(data?: any, params?: Record<string, any>): Promise<any> {
    await this.ensureValidToken();
    
    try {
      const response = await this.client.post('/oauth2/token', data, { params });
      return response.data;
    } catch (error) {
      console.error(`refreshToken failed:`, error);
      throw error;
    }
  }

  private addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig {
    
    if (this.config.accessToken) {
      config.headers = { ...config.headers, Authorization: `Bearer ${this.config.accessToken}` };
    }
    return config;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    return headers;
  }

  private handleError(error: any) {
    console.error(`GuestyApi API Error:`, error.response?.data || error.message);
    throw new Error(`GuestyApi API request failed: ${error.response?.data?.message || error.message}`);
  }
}

// Export singleton instance
export const guestyApiClient = new GuestyApiClient({
  baseUrl: process.env.GUESTY_API_BASE_URL || 'https://open-api.guesty.com/v1',
  
  clientId: process.env.GUESTY_API_CLIENT_ID,
  clientSecret: process.env.GUESTY_API_CLIENT_SECRET,
});