import { StripePaymentsClient, stripePaymentsClient } from './stripe_payments-client';
import { SendgridEmailClient, sendgridEmailClient } from './sendgrid_email-client';
import { SlackNotificationsClient, slackNotificationsClient } from './slack_notifications-client';
import { AnalyticsDbClient, analyticsDbClient } from './analytics_db-client';

export interface IntegrationHealthStatus {
  [key: string]: {
    status: 'healthy' | 'unhealthy';
    details?: string;
    integration: string;
  };
}

export class IntegrationService {
  public readonly stripePayments: StripePaymentsClient;
  public readonly sendgridEmail: SendgridEmailClient;
  public readonly slackNotifications: SlackNotificationsClient;
  public readonly analyticsDb: AnalyticsDbClient;

  constructor() {
    this.stripePayments = stripePaymentsClient;
    this.sendgridEmail = sendgridEmailClient;
    this.slackNotifications = slackNotificationsClient;
    this.analyticsDb = analyticsDbClient;
  }

  async healthCheck(): Promise<IntegrationHealthStatus> {
    try {
      const stripePaymentsHealth = await this.stripePayments.healthCheck();
      const sendgridEmailHealth = await this.sendgridEmail.healthCheck();
      const slackNotificationsHealth = await this.slackNotifications.healthCheck();
      const analyticsDbHealth = await this.analyticsDb.healthCheck();

      return {
        'stripe_payments': stripePaymentsHealth,
        'sendgrid_email': sendgridEmailHealth,
        'slack_notifications': slackNotificationsHealth,
        'analytics_db': analyticsDbHealth
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