import { EmailServiceClient, emailServiceClient } from './email_service-client';
import { SlackNotificationsClient, slackNotificationsClient } from './slack_notifications-client';

export interface IntegrationHealthStatus {
  [key: string]: {
    status: 'healthy' | 'unhealthy';
    details?: string;
    integration: string;
  };
}

export class IntegrationService {
  public readonly emailService: EmailServiceClient;
  public readonly slackNotifications: SlackNotificationsClient;

  constructor() {
    this.emailService = emailServiceClient;
    this.slackNotifications = slackNotificationsClient;
  }

  async healthCheck(): Promise<IntegrationHealthStatus> {
    try {
      const emailServiceHealth = await this.emailService.healthCheck();
      const slackNotificationsHealth = await this.slackNotifications.healthCheck();

      return {
        'email_service': emailServiceHealth,
        'slack_notifications': slackNotificationsHealth
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