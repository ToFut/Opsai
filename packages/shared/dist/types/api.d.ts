export interface APIResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config?: any;
}
export interface APIError {
    message: string;
    code: string;
    status: number;
    details?: any;
}
export interface APIConfig {
    baseURL: string;
    timeout: number;
    headers: Record<string, string>;
    auth?: AuthConfig;
}
export interface AuthConfig {
    type: 'api_key' | 'oauth' | 'bearer' | 'basic';
    key?: string;
    secret?: string;
    token?: string;
    username?: string;
    password?: string;
}
export interface EndpointConfig {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    params?: Record<string, any>;
    body?: any;
    timeout?: number;
}
export interface RateLimitConfig {
    requestsPerMinute: number;
    burstLimit?: number;
    retryAfter?: number;
}
export interface WebhookConfig {
    url: string;
    secret?: string;
    events: string[];
    headers?: Record<string, string>;
}
export interface APISchema {
    endpoints: Record<string, EndpointConfig>;
    rateLimits?: RateLimitConfig;
    authType: string;
    webhookSupport: boolean;
    responseSchemas?: Record<string, any>;
}
//# sourceMappingURL=api.d.ts.map