"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutionError = exports.WorkflowConfigurationError = exports.ActivityError = exports.WorkflowError = void 0;
class WorkflowError extends Error {
    constructor(message, details, code = 'WORKFLOW_ERROR') {
        super(message);
        this.name = 'WorkflowError';
        this.code = code;
        this.details = details;
    }
}
exports.WorkflowError = WorkflowError;
class ActivityError extends WorkflowError {
    constructor(message, details) {
        super(message, details, 'ACTIVITY_ERROR');
        this.name = 'ActivityError';
    }
}
exports.ActivityError = ActivityError;
class WorkflowConfigurationError extends WorkflowError {
    constructor(message, details) {
        super(message, details, 'WORKFLOW_CONFIG_ERROR');
        this.name = 'WorkflowConfigurationError';
    }
}
exports.WorkflowConfigurationError = WorkflowConfigurationError;
class WorkflowExecutionError extends WorkflowError {
    constructor(message, details) {
        super(message, details, 'WORKFLOW_EXECUTION_ERROR');
        this.name = 'WorkflowExecutionError';
    }
}
exports.WorkflowExecutionError = WorkflowExecutionError;
//# sourceMappingURL=errors.js.map