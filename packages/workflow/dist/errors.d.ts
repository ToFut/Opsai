export declare class WorkflowError extends Error {
    code: string;
    details?: any;
    constructor(message: string, details?: any, code?: string);
}
export declare class ActivityError extends WorkflowError {
    constructor(message: string, details?: any);
}
export declare class WorkflowConfigurationError extends WorkflowError {
    constructor(message: string, details?: any);
}
export declare class WorkflowExecutionError extends WorkflowError {
    constructor(message: string, details?: any);
}
//# sourceMappingURL=errors.d.ts.map