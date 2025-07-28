export class IntegrationError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'INTEGRATION_ERROR', details?: any) {
    super(message);
    this.name = 'IntegrationError';
    this.code = code;
    this.details = details;
  }
}

export class ConnectorError extends IntegrationError {
  constructor(message: string, code: string = 'CONNECTOR_ERROR', details?: any) {
    super(message, code, details);
    this.name = 'ConnectorError';
  }
}

export class AuthenticationError extends IntegrationError {
  constructor(message: string, details?: any) {
    super(message, 'AUTH_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends IntegrationError {
  retryAfter?: number;

  constructor(message: string, retryAfter?: number, details?: any) {
    super(message, 'RATE_LIMIT_ERROR', details);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends IntegrationError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}