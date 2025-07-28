import { APISchema, AuthConfig } from '@opsai/shared';

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'rest' | 'soap' | 'webhook' | 'database' | 'file';
  provider: string;
  baseUrl?: string;
  auth: AuthConfig;
  endpoints: EndpointConfig[];
  rateLimit?: RateLimitConfig;
  retryPolicy?: RetryPolicy;
  webhookConfig?: WebhookConfig;
  schedule?: ScheduleConfig;
  dataMapping?: DataMapping[];
  transformations?: TransformationRule[];
}

export interface EndpointConfig {
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  responseSchema?: APISchema;
  timeout?: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  burstSize: number;
  retryAfter?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: string[];
  headers?: Record<string, string>;
}

export interface ScheduleConfig {
  cron: string;
  timezone?: string;
  enabled: boolean;
}

export interface DataMapping {
  source: string;
  target: string;
  type: 'direct' | 'transform' | 'default';
  defaultValue?: any;
  transformRule?: string;
}

export interface TransformationRule {
  name: string;
  description: string;
  inputSchema: APISchema;
  outputSchema: APISchema;
  transformFunction: string;
  enabled: boolean;
}

export interface SyncJob {
  id: string;
  integrationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  recordsProcessed: number;
  recordsFailed: number;
  metadata?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  errors: string[];
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  id: string;
  integrationId: string;
  eventType: string;
  payload: any;
  receivedAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processed' | 'failed';
  error?: string;
}

export interface ConnectorConfig {
  name: string;
  version: string;
  capabilities: string[];
  configSchema?: APISchema;
  authSchema?: APISchema;
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  healthCheckEndpoint?: string;
  authentication?: RESTAuthentication;
  rateLimits?: RateLimitConfig;
}

export interface RESTEndpoint {
  name: string;
  path: string;
  method: string;
  headers?: Record<string, string>;
  timeout?: number;
  requestSchema?: any;
  responseSchema?: any;
}

export interface RESTAuthentication {
  type: 'api_key' | 'bearer' | 'basic' | 'oauth2' | 'custom';
  // API Key auth
  header?: string;
  value?: string;
  secretName?: string;
  // Bearer token auth
  token?: string;
  // Basic auth
  username?: string;
  password?: string;
  usernameSecret?: string;
  passwordSecret?: string;
  // OAuth2 auth
  clientId?: string;
  clientSecret?: string;
  clientIdSecret?: string;
  clientSecretSecret?: string;
  tokenUrl?: string;
  scope?: string;
  // Custom auth
  headers?: Record<string, string>;
} 