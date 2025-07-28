import { BaseActivity } from './base-activity';
interface HttpActivityInput {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    data?: any;
    params?: Record<string, any>;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    authentication?: {
        type: 'bearer' | 'basic' | 'api_key';
        token?: string;
        username?: string;
        password?: string;
        apiKey?: string;
        apiKeyHeader?: string;
    };
    validateStatus?: (status: number) => boolean;
}
export declare class HTTPActivity extends BaseActivity {
    execute(input: HttpActivityInput): Promise<any>;
    /**
     * Apply authentication to request config
     */
    private applyAuthentication;
    /**
     * Calculate request duration from response
     */
    private calculateDuration;
    /**
     * Sleep utility for retry delays
     */
    private sleep;
}
export {};
//# sourceMappingURL=http-activity.d.ts.map