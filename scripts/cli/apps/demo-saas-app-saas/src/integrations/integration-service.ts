import { EmailServiceClient, emailServiceClient } from './email-service-client';

export interface IntegrationHealthStatus {
  [key: string]: {
    status: 'healthy' | 'unhealthy';
    details?: string;
    integration: string;
  };
}

export class IntegrationService {
  public readonly emailService: EmailServiceClient;

  constructor() {
    this.emailService = emailServiceClient;
  }

  async healthCheck(): Promise<IntegrationHealthStatus> {
    try {
      const emailServiceHealth = await this.emailService.healthCheck();

      return {
        'email-service': emailServiceHealth
      };
    } catch (error) {
      console.error('Integration health check failed:', error);
      throw error;
    }
  }

  async testAllConnections(): Promise<{ success: boolean; results: IntegrationHealthStatus }> {
    try {
      const results = await this.healthCheck();
      const allHealthy = Object.values(results).every(result => result.status === 'healthy');
      
      return {
        success: allHealthy,
        results
      };
    } catch (error) {
      return {
        success: false,
        results: {}
      };
    }
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();