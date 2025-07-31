// Base infrastructure
export { BaseIntegrationClient } from './base-client';
export { IntegrationError, AuthenticationError, RateLimitError, ValidationError, ConfigurationError } from './errors';
export { RateLimiter } from './rate-limiter';
export { RetryManager } from './retry-manager';

// Integration clients
export { EmailServiceClient, emailServiceClient, createEmailServiceClient } from './email_service-client';
export { SlackNotificationsClient, slackNotificationsClient, createSlackNotificationsClient } from './slack_notifications-client';

// Integration service
export { IntegrationService, integrationService, IntegrationHealthStatus } from './integration-service';

// Convenience exports
export const integrations = {
  emailService: emailServiceClient,
  slackNotifications: slackNotificationsClient
};