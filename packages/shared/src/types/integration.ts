import { AuthConfig, EndpointConfig, RateLimitConfig, WebhookConfig, APISchema } from './api';

export interface Integration {
  id: string;
  name: string;
  provider: string;
  type: 'api' | 'webhook' | 'database' | 'file';
  config: IntegrationConfig;
  status: 'active' | 'inactive' | 'error';
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  baseUrl?: string;
  auth: AuthConfig;
  endpoints?: EndpointConfig[];
  rateLimits?: RateLimitConfig;
  webhooks?: WebhookConfig[];
  mappings?: FieldMapping[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
  defaultValue?: any;
}

export interface SyncJob {
  id: string;
  integrationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  errors: SyncError[];
  duration: number;
}

export interface SyncError {
  recordId?: string;
  field?: string;
  message: string;
  data?: any;
}

export interface Connector {
  name: string;
  version: string;
  capabilities: string[];
  configSchema: Record<string, any>;
  testConnection(config: any): Promise<boolean>;
  discoverSchema(config: any): Promise<APISchema>;
  syncData(config: any, lastSyncAt?: Date): Promise<SyncResult>;
}

export interface WebhookPayload {
  id: string;
  event: string;
  data: any;
  timestamp: Date;
  signature?: string;
  source: string;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

export interface ConnectionConfig {
  source: string;
  destination: string;
  config: Record<string, any>;
  schedule?: string;
  syncMode: 'full' | 'incremental';
} 