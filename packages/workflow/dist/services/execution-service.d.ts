import { WorkflowExecution } from '../types';
export declare class ExecutionService {
    /**
     * Execute a workflow
     */
    executeWorkflow(workflowId: string, input: any): Promise<WorkflowExecution>;
    /**
     * Get execution status
     */
    getExecutionStatus(executionId: string): Promise<WorkflowExecution | null>;
    /**
     * Cancel execution
     */
    cancelExecution(executionId: string): Promise<void>;
}
//# sourceMappingURL=execution-service.d.ts.map