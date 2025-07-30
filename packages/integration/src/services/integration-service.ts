import { Queue, Worker, Job } from 'bullmq';
import { createClient } from 'redis';
import { prisma, withTenant } from '@opsai/database';
import { IntegrationConfig, SyncJob, SyncResult, ConnectorConfig } from '../types';
import { RESTConnector } from '../connectors/rest-connector';
import { SOAPConnector } from '../connectors/soap-connector';
import { WebhookConnector } from '../connectors/webhook-connector';
import { AirbyteConnector, createAirbyteConnector } from '../connectors/airbyte-connector';
import { BaseConnector } from '../connectors/base-connector';
import { IntegrationError } from '../errors';
import { DataProcessor } from '../processors/data-processor';

export class IntegrationService {
  private syncQueue: Queue;
  private syncWorker: Worker;
  private redisClient: any;
  private connectors: Map<string, BaseConnector> = new Map();
  private dataProcessor: DataProcessor;

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.syncQueue = new Queue('integration-sync', {
      connection: this.redisClient
    });

    this.syncWorker = new Worker('integration-sync', this.processSyncJob.bind(this), {
      connection: this.redisClient
    });

    this.dataProcessor = new DataProcessor();
  }

  /**
   * Create a new integration
   */
  async createIntegration(config: IntegrationConfig, tenantId: string): Promise<any> {
    const integration = await prisma.integration.create({
      data: {
        id: config.id,
        name: config.name,
        provider: config.provider,
        type: config.type,
        config: config as any,
        status: 'active',
        tenantId
      }
    });

    // Initialize connector
    await this.initializeConnector(integration.id, config);

    return integration;
  }

  /**
   * Get integration by ID
   */
  async getIntegration(id: string, tenantId?: string): Promise<any> {
    const whereClause = tenantId ? { id, tenantId } : { id };
    return prisma.integration.findUnique({
      where: whereClause
    });
  }

  /**
   * Update integration
   */
  async updateIntegration(
    id: string, 
    config: Partial<IntegrationConfig>, 
    tenantId: string
  ): Promise<void> {
    await prisma.integration.update({
      where: { id, tenantId },
      data: {
        config: config as any,
        updatedAt: new Date()
      }
    });

    // Reinitialize connector with new config
    const integration = await this.getIntegration(id, tenantId);
    if (integration) {
      await this.initializeConnector(id, integration.config as IntegrationConfig);
    }
  }

  /**
   * Delete integration
   */
  async deleteIntegration(id: string, tenantId: string): Promise<void> {
    // Remove connector
    const connector = this.connectors.get(id);
    if (connector) {
      await connector.dispose?.();
      this.connectors.delete(id);
    }

    // Delete from database
    await prisma.integration.delete({
      where: { id, tenantId }
    });
  }

  /**
   * List integrations for tenant
   */
  async listIntegrations(tenantId: string, filters?: {
    type?: string;
    provider?: string;
    status?: string;
  }): Promise<any[]> {
    const where: any = { tenantId };
    
    if (filters?.type) where.type = filters.type;
    if (filters?.provider) where.provider = filters.provider;
    if (filters?.status) where.status = filters.status;

    return prisma.integration.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Test integration connection
   */
  async testConnection(integrationId: string, tenantId: string): Promise<{
    success: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      const integration = await this.getIntegration(integrationId, tenantId);
      if (!integration) {
        return {
          success: false,
          error: 'Integration not found'
        };
      }

      const connector = this.connectors.get(integrationId);
      if (!connector) {
        await this.initializeConnector(integrationId, integration.config as IntegrationConfig);
        const newConnector = this.connectors.get(integrationId);
        if (!newConnector) {
          return {
            success: false,
            error: 'Failed to initialize connector'
          };
        }
      }

      const testResult = await connector!.testConnection();
      
      // Update integration status
      await prisma.integration.update({
        where: { id: integrationId, tenantId },
        data: {
          status: testResult ? 'active' : 'error'
        }
      });

      return {
        success: testResult,
        error: testResult ? undefined : 'Connection test failed'
      };
    } catch (error) {
      console.error('Integration test failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      };
    }
  }

  /**
   * Execute integration request
   */
  async executeRequest(
    integrationId: string,
    endpoint: string,
    method: string,
    data?: any,
    tenantId?: string
  ): Promise<any> {
    const connector = this.connectors.get(integrationId);
    if (!connector) {
      throw new IntegrationError('Connector not initialized');
    }

    try {
      const result = await connector.executeRequest(endpoint, method, data);
      
      // Log the request for audit purposes
      if (tenantId) {
        // TODO: Add integration log table to schema
        console.log('Integration request logged:', {
          integrationId,
          tenantId,
          endpoint,
          method,
          status: result.success ? 'success' : 'error'
        });
      }

      return result;
    } catch (error) {
      // Log the error
      if (tenantId) {
        console.error('Integration error logged:', {
          integrationId,
          tenantId,
          endpoint,
          method,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      throw error;
    }
  }

  /**
   * Create sync job
   */
  async createSyncJob(integrationId: string, tenantId: string, options?: {
    scheduledFor?: Date;
    metadata?: Record<string, any>;
  }): Promise<SyncJob> {
    const job = await prisma.syncJob.create({
      data: {
        integrationId,
        status: 'pending',
        recordsProcessed: 0,
        recordsFailed: 0,
        metadata: options?.metadata
      }
    });

    // Add to queue for processing
    await this.syncQueue.add('sync-integration', {
      jobId: job.id,
      integrationId,
      tenantId
    }, {
      delay: options?.scheduledFor ? 
        Math.max(0, options.scheduledFor.getTime() - Date.now()) : 0
    });

    return job as SyncJob;
  }

  /**
   * Update sync job status
   */
  async updateSyncJob(jobId: string, updates: Partial<SyncJob>): Promise<void> {
    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        ...updates,
        completedAt: updates.status === 'completed' ? new Date() : undefined
      }
    });
  }

  /**
   * Get sync job history
   */
  async getSyncJobHistory(
    integrationId: string, 
    tenantId: string,
    limit: number = 10
  ): Promise<SyncJob[]> {
    const jobs = await prisma.syncJob.findMany({
      where: { integrationId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return jobs as SyncJob[];
  }

  /**
   * Get integration metrics
   */
  async getIntegrationMetrics(integrationId: string, tenantId: string, timeRange?: {
    from: Date;
    to: Date;
  }): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    syncJobs: {
      total: number;
      completed: number;
      failed: number;
    };
  }> {
    const whereClause: any = { integrationId };
    
    if (timeRange) {
      whereClause.createdAt = {
        gte: timeRange.from,
        lte: timeRange.to
      };
    }

    const [logs, syncJobs] = await Promise.all([
      // TODO: Add integration log table to schema
      Promise.resolve([]), // Placeholder for logs
      prisma.syncJob.findMany({ 
        where: { 
          integrationId,
          ...(timeRange && {
            createdAt: {
              gte: timeRange.from,
              lte: timeRange.to
            }
          })
        }
      })
    ]);

    const totalRequests = logs.length;
    const successfulRequests = logs.filter((log: any) => log.status === 'success').length;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime = logs.reduce((acc: number, log: any) => acc + (log.duration || 0), 0) / totalRequests || 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      syncJobs: {
        total: syncJobs.length,
        completed: syncJobs.filter(job => job.status === 'completed').length,
        failed: syncJobs.filter(job => job.status === 'failed').length
      }
    };
  }

  /**
   * Initialize connector for integration
   */
  private async initializeConnector(integrationId: string, config: IntegrationConfig): Promise<void> {
    // Dispose existing connector if any
    const existingConnector = this.connectors.get(integrationId);
    if (existingConnector) {
      await existingConnector.dispose?.();
    }

    // Create connector config
    const connectorConfig: ConnectorConfig = {
      name: config.name,
      version: '1.0.0',
      capabilities: [],
      baseUrl: config.baseUrl,
      authentication: config.auth as any, // Type conversion needed
      rateLimits: config.rateLimit
    };

    // Create appropriate connector
    let connector: BaseConnector;
    
    switch (config.type) {
      case 'rest':
        connector = new RESTConnector(connectorConfig);
        break;
      case 'soap':
        connector = new SOAPConnector(connectorConfig);
        break;
      case 'webhook':
        connector = new WebhookConnector(connectorConfig);
        break;
      default:
        throw new IntegrationError(`Unsupported integration type: ${config.type}`);
    }

    // Initialize the connector
    await connector.initialize();
    
    // Store the connector
    this.connectors.set(integrationId, connector);
  }

  /**
   * Process sync job (called by BullMQ worker)
   */
  private async processSyncJob(job: Job): Promise<void> {
    const { jobId, integrationId, tenantId } = job.data;
    
    try {
      // Update job status to running
      await this.updateSyncJob(jobId, {
        status: 'running',
        startedAt: new Date()
      });

      // Get integration config
      const integration = await this.getIntegration(integrationId, tenantId);
      if (!integration) {
        throw new IntegrationError('Integration not found');
      }

      // Perform sync logic here
      const syncResult = await this.performSync(integrationId, integration.config, tenantId);

      // Update job with results
      await this.updateSyncJob(jobId, {
        status: syncResult.success ? 'completed' : 'failed',
        recordsProcessed: syncResult.recordsProcessed,
        recordsFailed: syncResult.recordsFailed,
        error: syncResult.success ? undefined : syncResult.errors.join(', '),
        metadata: syncResult.metadata
      });
    } catch (error) {
      console.error(`Sync job ${jobId} failed:`, error);
      
      await this.updateSyncJob(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Perform actual sync operation with Airbyte fallback
   */
  private async performSync(
    integrationId: string, 
    config: IntegrationConfig, 
    tenantId: string
  ): Promise<SyncResult> {
    const connector = this.connectors.get(integrationId);
    if (!connector) {
      throw new IntegrationError('Connector not initialized');
    }

    let recordsProcessed = 0;
    let recordsFailed = 0;
    const errors: string[] = [];
    let usedFallback = false;

    try {
      // First attempt: Use direct API integration
      const directResult = await this.performDirectSync(connector, config, tenantId);
      
      if (directResult.success) {
        return directResult;
      }

      // Direct sync failed - try Airbyte fallback if configured
      console.warn(`Direct sync failed for integration ${integrationId}, attempting Airbyte fallback...`);
      errors.push(...directResult.errors);
      
      const airbyteResult = await this.performAirbyteFallback(config, tenantId);
      if (airbyteResult.success) {
        usedFallback = true;
        return {
          ...airbyteResult,
          metadata: {
            ...airbyteResult.metadata,
            fallbackUsed: true,
            directSyncErrors: directResult.errors
          }
        };
      }

      // Both direct and fallback failed
      errors.push(...airbyteResult.errors);
      return {
        success: false,
        recordsProcessed: directResult.recordsProcessed + airbyteResult.recordsProcessed,
        recordsFailed: directResult.recordsFailed + airbyteResult.recordsFailed,
        errors,
        metadata: {
          syncedAt: new Date().toISOString(),
          tenantId,
          integrationId,
          fallbackAttempted: true,
          fallbackUsed: false
        }
      };

    } catch (error) {
      return {
        success: false,
        recordsProcessed,
        recordsFailed: recordsFailed + 1,
        errors: [...errors, error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Perform direct API sync (original implementation)
   */
  private async performDirectSync(
    connector: BaseConnector,
    config: IntegrationConfig,
    tenantId: string
  ): Promise<SyncResult> {
    let recordsProcessed = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      // Execute configured endpoints
      for (const endpoint of config.endpoints || []) {
        try {
          const result = await connector.executeRequest(
            endpoint.path,
            endpoint.method,
            endpoint.body
          );
          
          if (result.success) {
            recordsProcessed++;
            
            // Process data transformations if configured
            if (config.transformations) {
              await this.dataProcessor.processTransformations(
                result.data,
                config.transformations,
                tenantId
              );
            }
          } else {
            recordsFailed++;
            errors.push(`Endpoint ${endpoint.name}: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          recordsFailed++;
          errors.push(`Endpoint ${endpoint.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return {
        success: recordsFailed === 0,
        recordsProcessed,
        recordsFailed,
        errors,
        metadata: {
          syncedAt: new Date().toISOString(),
          tenantId,
          method: 'direct'
        }
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed,
        recordsFailed: recordsFailed + 1,
        errors: [...errors, error instanceof Error ? error.message : String(error)],
        metadata: {
          syncedAt: new Date().toISOString(),
          tenantId,
          method: 'direct'
        }
      };
    }
  }

  /**
   * Perform Airbyte fallback sync
   */
  private async performAirbyteFallback(
    config: IntegrationConfig,
    tenantId: string
  ): Promise<SyncResult> {
    try {
      // Check if Airbyte is configured
      if (!process.env.AIRBYTE_API_KEY && !process.env.AIRBYTE_CLIENT_ID) {
        return {
          success: false,
          recordsProcessed: 0,
          recordsFailed: 1,
          errors: ['Airbyte fallback not configured - missing credentials'],
          metadata: {
            syncedAt: new Date().toISOString(),
            tenantId,
            method: 'airbyte-fallback'
          }
        };
      }

      // Create Airbyte connector
      const airbyteConnector = createAirbyteConnector();
      await airbyteConnector.connect();

      // Map integration config to Airbyte source config
      const sourceConfig = this.mapConfigToAirbyteSource(config);
      
      // Execute Airbyte sync
      const airbyteResult = await airbyteConnector.execute('sync', {
        sourceConfig,
        schedule: 'manual', // Manual trigger
        streams: config.streams || undefined
      });

      await airbyteConnector.dispose();

      return {
        success: airbyteResult.success,
        recordsProcessed: airbyteResult.recordCount || 0,
        recordsFailed: airbyteResult.success ? 0 : 1,
        errors: airbyteResult.success ? [] : [airbyteResult.error || 'Airbyte sync failed'],
        metadata: {
          syncedAt: new Date().toISOString(),
          tenantId,
          method: 'airbyte-fallback',
          airbyteJobId: airbyteResult.metadata?.jobId,
          airbyteConnectionId: airbyteResult.metadata?.connectionId,
          duration: airbyteResult.duration,
          dataSize: airbyteResult.dataSize
        }
      };

    } catch (error) {
      console.error('Airbyte fallback failed:', error);
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 1,
        errors: [`Airbyte fallback error: ${error instanceof Error ? error.message : String(error)}`],
        metadata: {
          syncedAt: new Date().toISOString(),
          tenantId,
          method: 'airbyte-fallback'
        }
      };
    }
  }

  /**
   * Map integration config to Airbyte source configuration
   */
  private mapConfigToAirbyteSource(config: IntegrationConfig): any {
    // This method converts the generic integration config to Airbyte-specific source config
    const baseConfig = {
      name: `opsai-${config.name}`,
      workspaceId: process.env.AIRBYTE_WORKSPACE_ID
    };

    // Map based on integration type and provider
    switch (config.type?.toLowerCase()) {
      case 'rest':
        return {
          ...baseConfig,
          sourceType: 'source-http-request',
          configuration: {
            base_url: config.baseUrl || config.host,
            path: config.endpoints?.[0]?.path || '/',
            http_method: config.endpoints?.[0]?.method?.toUpperCase() || 'GET',
            headers: config.headers || {},
            request_options: {
              timeout: config.timeout || 30
            },
            authentication: this.mapAuthToAirbyte(config.authentication)
          }
        };

      case 'database':
        return this.mapDatabaseToAirbyte(config, baseConfig);

      case 'file':
        return {
          ...baseConfig,
          sourceType: 'source-file',
          configuration: {
            url: config.fileUrl || config.baseUrl,
            format: config.format || 'csv',
            provider: {
              storage: config.storage || 'HTTPS'
            }
          }
        };

      default:
        // Generic HTTP source
        return {
          ...baseConfig,
          sourceType: 'source-http-request',
          configuration: {
            base_url: config.baseUrl || config.host || 'https://api.example.com',
            path: '/',
            http_method: 'GET',
            authentication: this.mapAuthToAirbyte(config.authentication)
          }
        };
    }
  }

  private mapAuthToAirbyte(auth: any): any {
    if (!auth) return {};

    switch (auth.type?.toLowerCase()) {
      case 'api_key':
        return {
          type: 'api_key',
          api_key: auth.apiKey || auth.key,
          header: auth.header || 'Authorization'
        };

      case 'bearer_token':
      case 'bearer':
        return {
          type: 'bearer_token',
          token: auth.token
        };

      case 'basic':
        return {
          type: 'basic_auth',
          username: auth.username,
          password: auth.password
        };

      case 'oauth':
      case 'oauth2':
        return {
          type: 'oauth2',
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          token_url: auth.tokenUrl,
          scope: auth.scope
        };

      default:
        return {};
    }
  }

  private mapDatabaseToAirbyte(config: IntegrationConfig, baseConfig: any): any {
    const provider = config.provider?.toLowerCase();
    
    switch (provider) {
      case 'postgresql':
      case 'postgres':
        return {
          ...baseConfig,
          sourceType: 'source-postgres',
          configuration: {
            host: config.host,
            port: config.port || 5432,
            database: config.database,
            username: config.username,
            password: config.password,
            ssl: config.ssl || false,
            replication_method: 'Standard'
          }
        };

      case 'mysql':
        return {
          ...baseConfig,
          sourceType: 'source-mysql',
          configuration: {
            host: config.host,
            port: config.port || 3306,
            database: config.database,
            username: config.username,
            password: config.password,
            ssl: config.ssl || false,
            replication_method: 'STANDARD'
          }
        };

      case 'mongodb':
        return {
          ...baseConfig,
          sourceType: 'source-mongodb-v2',
          configuration: {
            connection_string: config.connectionString || 
              `mongodb://${config.username}:${config.password}@${config.host}:${config.port || 27017}/${config.database}`,
            database: config.database,
            auth_source: config.authSource || 'admin'
          }
        };

      default:
        throw new IntegrationError(`Unsupported database provider for Airbyte: ${provider}`);
    }
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    // Close all connectors
    for (const connector of this.connectors.values()) {
      await connector.dispose?.();
    }
    this.connectors.clear();

    // Close worker and queue
    await this.syncWorker.close();
    await this.syncQueue.close();
    
    // Close Redis connection
    await this.redisClient.quit();
  }
} 