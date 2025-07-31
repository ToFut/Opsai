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
  
  // REST/SOAP specific properties
  host?: string;
  port?: number;
  timeout?: number;
  headers?: Record<string, string>;
  authentication?: RESTAuthentication;
  streams?: any[];
  
  // Database specific properties
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
  authSource?: string;
  
  // File specific properties
  fileUrl?: string;
  format?: string;
  storage?: any;
}

export interface EndpointConfig {
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  responseSchema?: APISchema;
  requestSchema?: APISchema;
  timeout?: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  initialDelay: number;
  maxDelay: number;
  retryableErrors?: string[];
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: string[];
  headers?: Record<string, string>;
  verifySignature?: boolean;
}

export interface ScheduleConfig {
  type: 'cron' | 'interval';
  expression: string;
  timezone?: string;
}

export interface DataMapping {
  source: string;
  target: string;
  transform?: string;
  type?: 'direct' | 'transform' | 'default';
  defaultValue?: any;
  transformRule?: string;
}

export interface TransformationRule {
  name: string;
  type: 'filter' | 'map' | 'aggregate' | 'sort';
  expression: string;
  options?: Record<string, any>;
  enabled?: boolean;
  inputSchema?: any;
  outputSchema?: any;
  transformFunction?: string;
}

export interface RESTAuthentication {
  type: 'basic' | 'bearer' | 'oauth2' | 'api_key' | 'custom';
  credentials: Record<string, string>;
  header?: string;
  value?: string;
  secretName?: string;
  token?: string;
  username?: string;
  password?: string;
  usernameSecret?: string;
  passwordSecret?: string;
  headers?: Record<string, string>;
  tokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
  clientIdSecret?: string;
  clientSecretSecret?: string;
  scope?: string;
}

export interface SyncJob {
  id: string;
  integrationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  recordsProcessed: number;
  recordsFailed: number;
  errors: string[];
  error?: string;
  metadata?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  recordCount: number;
  errors: string[];
  metadata?: Record<string, any>;
  dataSize?: number;
  duration?: number;
}

export interface WebhookEvent {
  id: string;
  integrationId: string;
  event: string;
  payload: any;
  receivedAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processed' | 'failed';
  error?: string;
  eventType?: string;
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
  params?: Record<string, any>;
  requestSchema?: APISchema;
  responseSchema?: APISchema;
  timeout?: number;
}

export interface AirbyteConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  apiVersion: string;
  retryConfig?: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number;
    maxDelay: number;
  };
} 