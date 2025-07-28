export declare class IntegrationError extends Error {
    code: string;
    details?: any;
    constructor(message: string, code?: string, details?: any);
}
export declare class ConnectorError extends IntegrationError {
    constructor(message: string, code?: string, details?: any);
}
export declare class AuthenticationError extends IntegrationError {
    constructor(message: string, details?: any);
}
export declare class RateLimitError extends IntegrationError {
    retryAfter?: number;
    constructor(message: string, retryAfter?: number, details?: any);
}
export declare class ValidationError extends IntegrationError {
    constructor(message: string, details?: any);
}
//# sourceMappingURL=errors.d.ts.map