import { IntegrationConfig, SyncJob } from '../types';
export declare class IntegrationService {
    private syncQueue;
    private syncWorker;
    private redisClient;
    private connectors;
    private dataProcessor;
    constructor();
    /**
     * Create a new integration
     */
    createIntegration(config: IntegrationConfig, tenantId: string): Promise<any>;
    /**
     * Get integration by ID
     */
    getIntegration(id: string, tenantId?: string): Promise<any>;
    /**
     * Update integration
     */
    updateIntegration(id: string, config: Partial<IntegrationConfig>, tenantId: string): Promise<void>;
    /**
     * Delete integration
     */
    deleteIntegration(id: string, tenantId: string): Promise<void>;
    /**
     * List integrations for tenant
     */
    listIntegrations(tenantId: string, filters?: {
        type?: string;
        provider?: string;
        status?: string;
    }): Promise<any[]>;
    /**
     * Test integration connection
     */
    testConnection(integrationId: string, tenantId: string): Promise<{
        success: boolean;
        error?: string;
        details?: any;
    }>;
    /**
     * Execute integration request
     */
    executeRequest(integrationId: string, endpoint: string, method: string, data?: any, tenantId?: string): Promise<any>;
    /**
     * Create sync job
     */
    createSyncJob(integrationId: string, tenantId: string, options?: {
        scheduledFor?: Date;
        metadata?: Record<string, any>;
    }): Promise<SyncJob>;
    /**
     * Update sync job status
     */
    updateSyncJob(jobId: string, updates: Partial<SyncJob>): Promise<void>;
    /**
     * Get sync job history
     */
    getSyncJobHistory(integrationId: string, tenantId: string, limit?: number): Promise<SyncJob[]>;
    /**
     * Get integration metrics
     */
    getIntegrationMetrics(integrationId: string, tenantId: string, timeRange?: {
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
    }>;
    /**
     * Initialize connector for integration
     */
    private initializeConnector;
    /**
     * Process sync job (called by BullMQ worker)
     */
    private processSyncJob;
    /**
     * Perform actual sync operation
     */
    private performSync;
    /**
     * Dispose resources
     */
    dispose(): Promise<void>;
}
//# sourceMappingURL=integration-service.d.ts.map