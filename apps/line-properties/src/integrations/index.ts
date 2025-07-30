// Auto-generated integration clients
export { GuestyApiClient } from './guesty_api';
export { EmailServiceClient } from './email_service';

// Simple placeholder exports for now
export const guestyApiClient = {
  getListings: async () => ({ listings: [] }),
  createReservation: async () => ({}),
  refreshToken: async () => ({})
};

export const emailServiceClient = {
  sendEmail: async () => ({})
};

// Re-export all clients as a single object
export const integrations = {
  guestyApi: guestyApiClient,
  emailService: emailServiceClient
};