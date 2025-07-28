import { ConnectorConfig } from '../types';
export declare abstract class BaseConnector {
    protected config: ConnectorConfig;
    constructor(config: ConnectorConfig);
    /**
     * Initialize the connector
     */
    abstract initialize(): Promise<void>;
    /**
     * Test the connection
     */
    abstract testConnection(): Promise<boolean>;
    /**
     * Execute a request
     */
    abstract executeRequest(endpoint: string, method: string, data?: any): Promise<any>;
    /**
     * Get connector capabilities
     */
    getCapabilities(): string[];
    /**
     * Get connector version
     */
    getVersion(): string;
}
//# sourceMappingURL=base-connector.d.ts.map