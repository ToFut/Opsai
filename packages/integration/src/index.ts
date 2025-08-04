// Integration services
export * from './services/integration-service';
export * from './services/sync-service';
export * from './services/webhook-service';
export * from './services/data-discovery-service';

// Connectors
export * from './connectors/base-connector';
export * from './connectors/rest-connector';
export * from './connectors/soap-connector';
export * from './connectors/webhook-connector';
export * from './connectors/airbyte-connector';

// Processors
export * from './processors/data-processor';
export * from './processors/transformation-processor';

// Authentication
export * from './auth/oauth-manager';
export * from './credentials/credential-manager';

// Types
export * from './types';

// Re-export shared discovery types from services
export { DataDiscoveryService } from './services/data-discovery-service';

// Don't re-export conflicting types - use them from @opsai/shared directly 