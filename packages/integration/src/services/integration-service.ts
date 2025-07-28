import { Queue, Worker, Job } from 'bullmq';
import { createClient } from 'redis';
import { prisma, withTenant } from '@opsai/database';
import { IntegrationConfig, SyncJob, SyncResult, ConnectorConfig } from '../types';
import { RESTConnector } from '../connectors/rest-connector';
import { SOAPConnector } from '../connectors/soap-connector';
import { WebhookConnector } from '../connectors/webhook-connector';
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
   * Perform actual sync operation
   */
  private async performSync(
    integrationId: string, 
    config: IntegrationConfig, 
    tenantId: string
  ): Promise<SyncResult> {
    // This is a simplified sync implementation
    // In a real scenario, this would be more complex
    
    const connector = this.connectors.get(integrationId);
    if (!connector) {
      throw new IntegrationError('Connector not initialized');
    }

    let recordsProcessed = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      // Execute configured endpoints
      for (const endpoint of config.endpoints) {
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
          integrationId
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