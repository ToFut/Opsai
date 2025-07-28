export class WorkflowError extends Error {
  code: string;
  details?: any;

  constructor(message: string, details?: any, code: string = 'WORKFLOW_ERROR') {
    super(message);
    this.name = 'WorkflowError';
    this.code = code;
    this.details = details;
  }
}

export class ActivityError extends WorkflowError {
  constructor(message: string, details?: any) {
    super(message, details, 'ACTIVITY_ERROR');
    this.name = 'ActivityError';
  }
}

export class WorkflowConfigurationError extends WorkflowError {
  constructor(message: string, details?: any) {
    super(message, details, 'WORKFLOW_CONFIG_ERROR');
    this.name = 'WorkflowConfigurationError';
  }
}

export class WorkflowExecutionError extends WorkflowError {
  constructor(message: string, details?: any) {
    super(message, details, 'WORKFLOW_EXECUTION_ERROR');
    this.name = 'WorkflowExecutionError';
  }
}