import { AxiosRequestConfig } from 'axios';
import { BaseConnector } from './base-connector';
import { ConnectorConfig, RESTEndpoint } from '../types';
export declare class RESTConnector extends BaseConnector {
    private axiosInstance;
    private authentication?;
    private rateLimiter;
    constructor(config: ConnectorConfig);
    initialize(): Promise<void>;
    testConnection(): Promise<boolean>;
    executeRequest(endpoint: string, method: string, data?: any, options?: AxiosRequestConfig): Promise<any>;
    executeEndpoint(endpointConfig: RESTEndpoint, data?: any): Promise<any>;
    private setupInterceptors;
    private applyAuthentication;
    private refreshOAuth2Token;
    private checkRateLimit;
    private updateRateLimit;
    private handleAxiosError;
    dispose(): Promise<void>;
}
//# sourceMappingURL=rest-connector.d.ts.map