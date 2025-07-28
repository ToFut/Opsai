export interface WorkflowConfig {
    id: string;
    name: string;
    description: string;
    version: string;
    tenantId: string;
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    retryPolicy?: RetryPolicy;
    timeout?: number;
    enabled: boolean;
}
export interface WorkflowTrigger {
    type: 'api_call' | 'schedule' | 'event' | 'manual';
    endpoint?: string;
    method?: string;
    cron?: string;
    eventType?: string;
    conditions?: TriggerCondition[];
}
export interface TriggerCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'activity' | 'condition' | 'delay' | 'parallel' | 'sequential';
    activity?: string;
    config?: Record<string, any>;
    conditions?: StepCondition[];
    timeout?: number;
    retryPolicy?: RetryPolicy;
    next?: string | string[];
}
export interface StepCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
}
export interface RetryPolicy {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
    maxDelay: number;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    tenantId: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt: Date;
    completedAt?: Date;
    error?: string;
    input: any;
    output?: any;
    steps: ExecutionStep[];
    metadata?: Record<string, any>;
}
export interface ExecutionStep {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    input?: any;
    output?: any;
    duration?: number;
}
export interface Activity {
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
    timeout?: number;
    retryPolicy?: RetryPolicy;
}
export interface SchedulerConfig {
    id: string;
    name: string;
    cron: string;
    timezone?: string;
    enabled: boolean;
    workflowId: string;
    tenantId: string;
    lastRun?: Date;
    nextRun?: Date;
}
//# sourceMappingURL=index.d.ts.map