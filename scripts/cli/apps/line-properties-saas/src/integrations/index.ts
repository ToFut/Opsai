// Auto-generated integration clients
export { GuestyApiClient, guestyApiClient } from './guesty-api';
export { EmailServiceClient, emailServiceClient } from './email-service';

// Re-export all clients as a single object
export const integrations = {
  guestyApi: guestyApiClient,
  emailService: emailServiceClient
};