import axios, { AxiosInstance } from 'axios';
import { BaseConnector } from './base-connector';
import { IntegrationConfig, SyncResult, ConnectorConfig } from '../types';
import { IntegrationError } from '../errors';

export interface AirbyteConnectorConfig extends ConnectorConfig {
  type: string;
  apiKey: string;
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  workspaceId?: string;
  retryConfig?: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number;
    maxDelay: number;
  };
}

export interface AirbyteSource {
  sourceId: string;
  name: string;
  sourceDefinitionId: string;
  workspaceId: string;
  connectionConfiguration: any;
}

export interface AirbyteDestination {
  destinationId: string;
  name: string;
  destinationDefinitionId: string;
  workspaceId: string;
  connectionConfiguration: any;
}

export interface AirbyteConnection {
  connectionId: string;
  name: string;
  sourceId: string;
  destinationId: string;
  status: 'active' | 'inactive' | 'deprecated';
  schedule?: {
    scheduleType: 'basic' | 'cron';
    basicSchedule?: {
      timeUnit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
      units: number;
    };
    cronExpression?: string;
  };
  syncCatalog: {
    streams: Array<{
      stream: {
        name: string;
        jsonSchema: any;
        supportedSyncModes: string[];
      };
      config: {
        syncMode: 'full_refresh' | 'incremental';
        destinationSyncMode: 'overwrite' | 'append' | 'append_dedup';
        selected: boolean;
      };
    }>;
  };
}

export interface AirbyteSyncJob {
  jobId: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  connectionId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  recordsSynced?: number;
  dataEmitted?: number;
  errorMessage?: string;
}

export class AirbyteConnector extends BaseConnector {
  private client: AxiosInstance;
  protected config: AirbyteConnectorConfig;
  private accessToken?: string;
  private tokenExpiresAt?: Date;
  public isConnected: boolean = false;

  constructor(config: AirbyteConnectorConfig) {
    super(config);
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.airbyte.com/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear it
          this.accessToken = undefined;
          this.tokenExpiresAt = undefined;
        }
        throw new IntegrationError(
          `Airbyte API error: ${error.response?.data?.message || error.message}`,
          'AIRBYTE_API_ERROR',
          error
        );
      }
    );
  }

  async initialize(): Promise<void> {
    await this.connect();
  }

  async executeRequest(endpoint: string, method: string, data?: any): Promise<any> {
    const response = await this.client.request({
      method,
      url: endpoint,
      data
    });
    return response.data;
  }

  async connect(): Promise<void> {
    try {
      await this.getAccessToken();
      // Test connection by fetching workspaces
      await this.getWorkspaces();
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      throw new IntegrationError(
        'Failed to connect to Airbyte',
        'CONNECTION_FAILED',
        error
      );
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = undefined;
    this.tokenExpiresAt = undefined;
    this.isConnected = false;
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      // Use API key if provided, otherwise use OAuth flow
      if (this.config.apiKey) {
        this.accessToken = this.config.apiKey;
        // Set expiration to 1 hour from now (API keys don't expire but we'll refresh periodically)
        this.tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
        return this.accessToken;
      }

      // OAuth 2.0 client credentials flow
      const response = await axios.post('https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token', {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      this.accessToken = response.data.access_token;
      // Set expiration to 90% of actual expiration to ensure we refresh before it expires
      this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in * 900));

      return this.accessToken;
    } catch (error) {
      throw new IntegrationError(
        'Failed to obtain Airbyte access token',
        'AUTH_FAILED',
        error
      );
    }
  }

  async execute(operation: string, data: any): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }

    switch (operation) {
      case 'sync':
        return this.syncData(data);
      case 'create_source':
        return this.createSource(data);
      case 'create_destination':
        return this.createDestination(data);
      case 'create_connection':
        return this.createConnection(data);
      case 'trigger_sync':
        return this.triggerSync(data.connectionId);
      case 'get_sync_status':
        return this.getSyncStatus(data.jobId);
      case 'list_sources':
        return this.listSources(data.workspaceId);
      case 'list_destinations':
        return this.listDestinations(data.workspaceId);
      case 'list_connections':
        return this.listConnections(data.workspaceId);
      default:
        throw new IntegrationError(
          `Unknown Airbyte operation: ${operation}`,
          'UNKNOWN_OPERATION'
        );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      return true;
    } catch (error) {
      console.error('Airbyte connection test failed:', error);
      return false;
    }
  }

  // Core Airbyte API methods

  private async getWorkspaces(): Promise<any[]> {
    const response = await this.client.get('/workspaces');
    return response.data.data || [];
  }

  private async listSources(workspaceId?: string): Promise<AirbyteSource[]> {
    const params = workspaceId ? { workspaceId } : {};
    const response = await this.client.get('/sources', { params });
    return response.data.data || [];
  }

  private async listDestinations(workspaceId?: string): Promise<AirbyteDestination[]> {
    const params = workspaceId ? { workspaceId } : {};
    const response = await this.client.get('/destinations', { params });
    return response.data.data || [];
  }

  private async listConnections(workspaceId?: string): Promise<AirbyteConnection[]> {
    const params = workspaceId ? { workspaceId } : {};
    const response = await this.client.get('/connections', { params });
    return response.data.data || [];
  }

  private async createSource(sourceConfig: {
    name: string;
    sourceType: string;
    workspaceId?: string;
    configuration: any;
  }): Promise<AirbyteSource> {
    const response = await this.client.post('/sources', {
      name: sourceConfig.name,
      sourceType: sourceConfig.sourceType,
      workspaceId: sourceConfig.workspaceId || this.config.workspaceId,
      configuration: sourceConfig.configuration
    });

    return response.data;
  }

  private async createDestination(destinationConfig: {
    name: string;
    destinationType: string;
    workspaceId?: string;
    configuration: any;
  }): Promise<AirbyteDestination> {
    const response = await this.client.post('/destinations', {
      name: destinationConfig.name,
      destinationType: destinationConfig.destinationType,
      workspaceId: destinationConfig.workspaceId || this.config.workspaceId,
      configuration: destinationConfig.configuration
    });

    return response.data;
  }

  private async createConnection(connectionConfig: {
    name: string;
    sourceId: string;
    destinationId: string;
    schedule?: AirbyteConnection['schedule'];
    syncCatalog: AirbyteConnection['syncCatalog'];
  }): Promise<AirbyteConnection> {
    const response = await this.client.post('/connections', connectionConfig);
    return response.data;
  }

  private async triggerSync(connectionId: string): Promise<AirbyteSyncJob> {
    const response = await this.client.post(`/connections/${connectionId}/jobs`, {
      jobType: 'sync'
    });

    return response.data;
  }

  private async getSyncStatus(jobId: string): Promise<AirbyteSyncJob> {
    const response = await this.client.get(`/jobs/${jobId}`);
    return response.data;
  }

  private async syncData(syncConfig: {
    sourceConfig: any;
    destinationConfig?: any;
    schedule?: 'manual' | 'hourly' | 'daily' | 'weekly';
    streams?: string[];
  }): Promise<SyncResult> {
    try {
      // Step 1: Create or find source
      let source = await this.findOrCreateSource(syncConfig.sourceConfig);

      // Step 2: Create or find destination (use internal database by default)
      let destination = await this.findOrCreateDestination(
        syncConfig.destinationConfig || this.getDefaultDestinationConfig()
      );

      // Step 3: Create or find connection
      let connection = await this.findOrCreateConnection(source.sourceId, destination.destinationId, {
        schedule: this.mapSchedule(syncConfig.schedule),
        streams: syncConfig.streams
      });

      // Step 4: Trigger sync
      const job = await this.triggerSync(connection.connectionId);

      // Step 5: Wait for completion (with timeout)
      const completedJob = await this.waitForJobCompletion(job.jobId, 300000); // 5 minutes timeout

      return {
        success: completedJob.status === 'succeeded',
        recordsProcessed: completedJob.recordsSynced || 0,
        recordsFailed: completedJob.status === 'failed' ? 1 : 0,
        recordCount: completedJob.recordsSynced || 0,
        dataSize: completedJob.dataEmitted || 0,
        duration: completedJob.endedAt && completedJob.startedAt 
          ? new Date(completedJob.endedAt).getTime() - new Date(completedJob.startedAt).getTime()
          : 0,
        metadata: {
          jobId: job.jobId,
          connectionId: connection.connectionId,
          sourceId: source.sourceId,
          destinationId: destination.destinationId
        },
        errors: completedJob.status === 'failed' ? [completedJob.errorMessage || 'Unknown error'] : []
      };

    } catch (error) {
      throw new IntegrationError(
        'Airbyte sync failed',
        'SYNC_FAILED',
        error
      );
    }
  }

  private async findOrCreateSource(sourceConfig: any): Promise<AirbyteSource> {
    // Try to find existing source by name
    const sources = await this.listSources(this.config.workspaceId);
    const existingSource = sources.find(s => s.name === sourceConfig.name);
    
    if (existingSource) {
      return existingSource;
    }

    // Create new source
    return this.createSource(sourceConfig);
  }

  private async findOrCreateDestination(destinationConfig: any): Promise<AirbyteDestination> {
    // Try to find existing destination by name
    const destinations = await this.listDestinations(this.config.workspaceId);
    const existingDestination = destinations.find(d => d.name === destinationConfig.name);
    
    if (existingDestination) {
      return existingDestination;
    }

    // Create new destination
    return this.createDestination(destinationConfig);
  }

  private async findOrCreateConnection(
    sourceId: string, 
    destinationId: string, 
    options: { schedule?: any; streams?: string[] }
  ): Promise<AirbyteConnection> {
    // Try to find existing connection
    const connections = await this.listConnections(this.config.workspaceId);
    const existingConnection = connections.find(c => 
      c.sourceId === sourceId && c.destinationId === destinationId
    );
    
    if (existingConnection) {
      return existingConnection;
    }

    // Discover source schema
    const schema = await this.discoverSourceSchema(sourceId);
    
    // Create sync catalog from discovered schema
    const syncCatalog = this.createSyncCatalog(schema, options.streams);

    // Create new connection
    return this.createConnection({
      name: `sync-${sourceId}-${destinationId}`,
      sourceId,
      destinationId,
      schedule: options.schedule,
      syncCatalog
    });
  }

  private async discoverSourceSchema(sourceId: string): Promise<any> {
    const response = await this.client.post(`/sources/${sourceId}/discover`);
    return response.data;
  }

  private createSyncCatalog(schema: any, selectedStreams?: string[]): AirbyteConnection['syncCatalog'] {
    const streams = schema.catalog?.streams || [];
    
    return {
      streams: streams.map((stream: any) => ({
        stream: {
          name: stream.stream.name,
          jsonSchema: stream.stream.jsonSchema,
          supportedSyncModes: stream.stream.supportedSyncModes || ['full_refresh']
        },
        config: {
          syncMode: stream.stream.supportedSyncModes?.includes('incremental') ? 'incremental' : 'full_refresh',
          destinationSyncMode: 'append_dedup',
          selected: !selectedStreams || selectedStreams.includes(stream.stream.name)
        }
      }))
    };
  }

  private mapSchedule(schedule?: string): AirbyteConnection['schedule'] {
    switch (schedule) {
      case 'hourly':
        return {
          scheduleType: 'basic',
          basicSchedule: { timeUnit: 'hours', units: 1 }
        };
      case 'daily':
        return {
          scheduleType: 'basic',
          basicSchedule: { timeUnit: 'days', units: 1 }
        };
      case 'weekly':
        return {
          scheduleType: 'basic',
          basicSchedule: { timeUnit: 'weeks', units: 1 }
        };
      default:
        return undefined; // Manual sync
    }
  }

  private getDefaultDestinationConfig(): any {
    // Default to PostgreSQL destination using current database
    return {
      name: 'opsai-database',
      destinationType: 'postgres',
      configuration: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'opsai_core',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        schema: 'airbyte_synced'
      }
    };
  }

  private async waitForJobCompletion(jobId: string, timeoutMs: number = 300000): Promise<AirbyteSyncJob> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < timeoutMs) {
      const job = await this.getSyncStatus(jobId);
      
      if (['succeeded', 'failed', 'cancelled'].includes(job.status)) {
        return job;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new IntegrationError(
      `Airbyte sync job ${jobId} timed out after ${timeoutMs}ms`,
      'SYNC_TIMEOUT'
    );
  }

  async dispose(): Promise<void> {
    await this.disconnect();
  }
}

// Factory function for easy instantiation
export function createAirbyteConnector(config?: Partial<AirbyteConnectorConfig>): AirbyteConnector {
  const airbyteConfig: AirbyteConnectorConfig = {
    name: 'airbyte',
    version: '1.0.0',
    type: 'airbyte',
    apiKey: config?.apiKey || process.env.AIRBYTE_API_KEY || '',
    clientId: config?.clientId || process.env.AIRBYTE_CLIENT_ID || '',
    clientSecret: config?.clientSecret || process.env.AIRBYTE_CLIENT_SECRET || '',
    baseUrl: config?.baseUrl || process.env.AIRBYTE_BASE_URL || 'https://api.airbyte.com/v1',
    workspaceId: config?.workspaceId || process.env.AIRBYTE_WORKSPACE_ID,
    capabilities: config?.capabilities || ['discovery', 'sync', 'schema-detection'],
    retryConfig: {
      maxRetries: 3,
      initialDelay: 1000,
      backoffStrategy: 'exponential',
      maxDelay: 10000
    },
    ...config
  };

  return new AirbyteConnector(airbyteConfig);
}