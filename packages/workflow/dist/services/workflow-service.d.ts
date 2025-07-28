import { WorkflowConfig, WorkflowExecution } from '../types';
export declare class WorkflowService {
    private temporalClient;
    private workflowQueue;
    private workflowWorker;
    private redisClient;
    private scheduledTasks;
    constructor();
    initialize(): Promise<void>;
    /**
     * Create a new workflow
     */
    createWorkflow(config: WorkflowConfig, tenantId: string): Promise<any>;
    /**
     * Get workflow by ID
     */
    getWorkflow(id: string, tenantId?: string): Promise<WorkflowConfig | null>;
    /**
     * Update workflow
     */
    updateWorkflow(id: string, config: Partial<WorkflowConfig>, tenantId: string): Promise<void>;
    /**
     * Delete workflow
     */
    deleteWorkflow(id: string, tenantId: string): Promise<void>;
    /**
     * List workflows for tenant
     */
    listWorkflows(tenantId: string, filters?: {
        status?: string;
        name?: string;
    }): Promise<WorkflowConfig[]>;
    /**
     * Execute workflow
     */
    executeWorkflow(workflowId: string, input: any, tenantId: string, options?: {
        runId?: string;
        taskQueue?: string;
        searchAttributes?: Record<string, any>;
    }): Promise<WorkflowExecution>;
    /**
     * Get workflow execution status
     */
    getWorkflowExecution(executionId: string, tenantId: string): Promise<WorkflowExecution | null>;
    /**
     * Cancel workflow execution
     */
    cancelWorkflowExecution(executionId: string, tenantId: string): Promise<void>;
    /**
     * List workflow executions
     */
    listWorkflowExecutions(tenantId: string, filters?: {
        workflowId?: string;
        status?: string;
        limit?: number;
    }): Promise<WorkflowExecution[]>;
    /**
     * Validate workflow configuration
     */
    private validateWorkflowConfig;
    /**
     * Setup workflow trigger
     */
    private setupTrigger;
    /**
     * Remove workflow triggers
     */
    private removeTriggers;
    /**
     * Map Temporal workflow status to our status
     */
    private mapTemporalStatus;
    /**
     * Process workflow job (called by BullMQ worker)
     */
    private processWorkflowJob;
    /**
     * Dispose resources
     */
    dispose(): Promise<void>;
}
//# sourceMappingURL=workflow-service.d.ts.map