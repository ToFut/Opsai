// Base infrastructure
export { BaseIntegrationClient } from './base-client';
export { IntegrationError, AuthenticationError, RateLimitError, ValidationError, ConfigurationError } from './errors';
export { RateLimiter } from './rate-limiter';
export { RetryManager } from './retry-manager';

// Integration clients
export { StripePaymentsClient, stripePaymentsClient, createStripePaymentsClient } from './stripe_payments-client';
export { SendgridEmailClient, sendgridEmailClient, createSendgridEmailClient } from './sendgrid_email-client';
export { SlackNotificationsClient, slackNotificationsClient, createSlackNotificationsClient } from './slack_notifications-client';
export { AnalyticsDbClient, analyticsDbClient, createAnalyticsDbClient } from './analytics_db-client';

// Integration service
export { IntegrationService, integrationService, IntegrationHealthStatus } from './integration-service';

// Convenience exports
export const integrations = {
  stripePayments: stripePaymentsClient,
  sendgridEmail: sendgridEmailClient,
  slackNotifications: slackNotificationsClient,
  analyticsDb: analyticsDbClient
};