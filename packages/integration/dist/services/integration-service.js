"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationService = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("redis");
const database_1 = require("@opsai/database");
const rest_connector_1 = require("../connectors/rest-connector");
const soap_connector_1 = require("../connectors/soap-connector");
const webhook_connector_1 = require("../connectors/webhook-connector");
const errors_1 = require("../errors");
const data_processor_1 = require("../processors/data-processor");
class IntegrationService {
    constructor() {
        this.connectors = new Map();
        this.redisClient = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        this.syncQueue = new bullmq_1.Queue('integration-sync', {
            connection: this.redisClient
        });
        this.syncWorker = new bullmq_1.Worker('integration-sync', this.processSyncJob.bind(this), {
            connection: this.redisClient
        });
        this.dataProcessor = new data_processor_1.DataProcessor();
    }
    /**
     * Create a new integration
     */
    async createIntegration(config, tenantId) {
        const integration = await database_1.prisma.integration.create({
            data: {
                id: config.id,
                name: config.name,
                provider: config.provider,
                type: config.type,
                config: config,
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
    async getIntegration(id, tenantId) {
        const whereClause = tenantId ? { id, tenantId } : { id };
        return database_1.prisma.integration.findUnique({
            where: whereClause
        });
    }
    /**
     * Update integration
     */
    async updateIntegration(id, config, tenantId) {
        await database_1.prisma.integration.update({
            where: { id, tenantId },
            data: {
                config: config,
                updatedAt: new Date()
            }
        });
        // Reinitialize connector with new config
        const integration = await this.getIntegration(id, tenantId);
        if (integration) {
            await this.initializeConnector(id, integration.config);
        }
    }
    /**
     * Delete integration
     */
    async deleteIntegration(id, tenantId) {
        // Remove connector
        const connector = this.connectors.get(id);
        if (connector) {
            await connector.dispose?.();
            this.connectors.delete(id);
        }
        // Delete from database
        await database_1.prisma.integration.delete({
            where: { id, tenantId }
        });
    }
    /**
     * List integrations for tenant
     */
    async listIntegrations(tenantId, filters) {
        const where = { tenantId };
        if (filters?.type)
            where.type = filters.type;
        if (filters?.provider)
            where.provider = filters.provider;
        if (filters?.status)
            where.status = filters.status;
        return database_1.prisma.integration.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Test integration connection
     */
    async testConnection(integrationId, tenantId) {
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
                await this.initializeConnector(integrationId, integration.config);
                const newConnector = this.connectors.get(integrationId);
                if (!newConnector) {
                    return {
                        success: false,
                        error: 'Failed to initialize connector'
                    };
                }
            }
            const testResult = await connector.testConnection();
            // Update integration status
            await database_1.prisma.integration.update({
                where: { id: integrationId, tenantId },
                data: {
                    status: testResult ? 'active' : 'error',
                    lastTestedAt: new Date()
                }
            });
            return {
                success: testResult,
                error: testResult ? undefined : 'Connection test failed'
            };
        }
        catch (error) {
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
    async executeRequest(integrationId, endpoint, method, data, tenantId) {
        const connector = this.connectors.get(integrationId);
        if (!connector) {
            throw new errors_1.IntegrationError('Connector not initialized');
        }
        try {
            const result = await connector.executeRequest(endpoint, method, data);
            // Log the request for audit purposes
            if (tenantId) {
                await database_1.prisma.integrationLog.create({
                    data: {
                        integrationId,
                        tenantId,
                        endpoint,
                        method,
                        requestData: data ? JSON.stringify(data) : null,
                        responseData: JSON.stringify(result),
                        status: result.success ? 'success' : 'error',
                        duration: 0 // TODO: Track actual duration
                    }
                });
            }
            return result;
        }
        catch (error) {
            // Log the error
            if (tenantId) {
                await database_1.prisma.integrationLog.create({
                    data: {
                        integrationId,
                        tenantId,
                        endpoint,
                        method,
                        requestData: data ? JSON.stringify(data) : null,
                        status: 'error',
                        error: error instanceof Error ? error.message : String(error),
                        duration: 0
                    }
                });
            }
            throw error;
        }
    }
    /**
     * Create sync job
     */
    async createSyncJob(integrationId, tenantId, options) {
        const job = await database_1.prisma.syncJob.create({
            data: {
                integrationId,
                tenantId,
                status: 'pending',
                recordsProcessed: 0,
                recordsFailed: 0,
                scheduledFor: options?.scheduledFor,
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
        return job;
    }
    /**
     * Update sync job status
     */
    async updateSyncJob(jobId, updates) {
        await database_1.prisma.syncJob.update({
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
    async getSyncJobHistory(integrationId, tenantId, limit = 10) {
        const jobs = await database_1.prisma.syncJob.findMany({
            where: { integrationId, tenantId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        return jobs;
    }
    /**
     * Get integration metrics
     */
    async getIntegrationMetrics(integrationId, tenantId, timeRange) {
        const whereClause = { integrationId, tenantId };
        if (timeRange) {
            whereClause.createdAt = {
                gte: timeRange.from,
                lte: timeRange.to
            };
        }
        const [logs, syncJobs] = await Promise.all([
            database_1.prisma.integrationLog.findMany({ where: whereClause }),
            database_1.prisma.syncJob.findMany({
                where: {
                    integrationId,
                    tenantId,
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
        const successfulRequests = logs.filter(log => log.status === 'success').length;
        const failedRequests = totalRequests - successfulRequests;
        const averageResponseTime = logs.reduce((acc, log) => acc + (log.duration || 0), 0) / totalRequests || 0;
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
    async initializeConnector(integrationId, config) {
        // Dispose existing connector if any
        const existingConnector = this.connectors.get(integrationId);
        if (existingConnector) {
            await existingConnector.dispose?.();
        }
        // Create connector config
        const connectorConfig = {
            name: config.name,
            version: '1.0.0',
            capabilities: [],
            baseUrl: config.baseUrl,
            authentication: config.auth, // Type conversion needed
            rateLimits: config.rateLimit
        };
        // Create appropriate connector
        let connector;
        switch (config.type) {
            case 'rest':
                connector = new rest_connector_1.RESTConnector(connectorConfig);
                break;
            case 'soap':
                connector = new soap_connector_1.SOAPConnector(connectorConfig);
                break;
            case 'webhook':
                connector = new webhook_connector_1.WebhookConnector(connectorConfig);
                break;
            default:
                throw new errors_1.IntegrationError(`Unsupported integration type: ${config.type}`);
        }
        // Initialize the connector
        await connector.initialize();
        // Store the connector
        this.connectors.set(integrationId, connector);
    }
    /**
     * Process sync job (called by BullMQ worker)
     */
    async processSyncJob(job) {
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
                throw new errors_1.IntegrationError('Integration not found');
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
        }
        catch (error) {
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
    async performSync(integrationId, config, tenantId) {
        // This is a simplified sync implementation
        // In a real scenario, this would be more complex
        const connector = this.connectors.get(integrationId);
        if (!connector) {
            throw new errors_1.IntegrationError('Connector not initialized');
        }
        let recordsProcessed = 0;
        let recordsFailed = 0;
        const errors = [];
        try {
            // Execute configured endpoints
            for (const endpoint of config.endpoints) {
                try {
                    const result = await connector.executeRequest(endpoint.path, endpoint.method, endpoint.body);
                    if (result.success) {
                        recordsProcessed++;
                        // Process data transformations if configured
                        if (config.transformations) {
                            await this.dataProcessor.processTransformations(result.data, config.transformations, tenantId);
                        }
                    }
                    else {
                        recordsFailed++;
                        errors.push(`Endpoint ${endpoint.name}: ${result.error || 'Unknown error'}`);
                    }
                }
                catch (error) {
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
        }
        catch (error) {
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
    async dispose() {
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
exports.IntegrationService = IntegrationService;
//# sourceMappingURL=integration-service.js.map