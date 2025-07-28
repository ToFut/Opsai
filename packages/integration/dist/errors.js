"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.RateLimitError = exports.AuthenticationError = exports.ConnectorError = exports.IntegrationError = void 0;
class IntegrationError extends Error {
    constructor(message, code = 'INTEGRATION_ERROR', details) {
        super(message);
        this.name = 'IntegrationError';
        this.code = code;
        this.details = details;
    }
}
exports.IntegrationError = IntegrationError;
class ConnectorError extends IntegrationError {
    constructor(message, code = 'CONNECTOR_ERROR', details) {
        super(message, code, details);
        this.name = 'ConnectorError';
    }
}
exports.ConnectorError = ConnectorError;
class AuthenticationError extends IntegrationError {
    constructor(message, details) {
        super(message, 'AUTH_ERROR', details);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class RateLimitError extends IntegrationError {
    constructor(message, retryAfter, details) {
        super(message, 'RATE_LIMIT_ERROR', details);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitError = RateLimitError;
class ValidationError extends IntegrationError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=errors.js.map