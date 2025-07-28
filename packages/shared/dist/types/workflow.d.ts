export interface Workflow {
    id: string;
    name: string;
    version: string;
    description?: string;
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    timeout: number;
    retryPolicy?: RetryPolicy;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowTrigger {
    type: 'api_call' | 'schedule' | 'event' | 'manual';
    endpoint?: string;
    method?: string;
    schedule?: string;
    event?: string;
}
export interface WorkflowStep {
    name: string;
    activity: string;
    input: any;
    timeout?: number;
    retryPolicy?: RetryPolicy;
    condition?: string;
    onSuccess?: string[];
    onFailure?: string[];
}
export interface RetryPolicy {
    maxAttempts: number;
    backoff: 'linear' | 'exponential' | 'fixed';
    initialDelay: number;
    maxDelay: number;
}
export interface Activity {
    name: string;
    type: string;
    config: any;
    implementation: Function;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    input: any;
    output?: any;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
}
export interface WorkflowStatus {
    executionId: string;
    status: string;
    currentStep?: string;
    progress: number;
    result?: any;
    error?: string;
}
export interface BusinessProcess {
    name: string;
    description: string;
    steps: ProcessStep[];
    actors: string[];
    rules: ProcessRule[];
}
export interface ProcessStep {
    name: string;
    type: 'task' | 'decision' | 'approval' | 'notification';
    assignee?: string;
    duration?: number;
    dependencies: string[];
}
export interface ProcessRule {
    condition: string;
    action: string;
    priority: number;
}
//# sourceMappingURL=workflow.d.ts.map