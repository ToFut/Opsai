import { BaseConnector } from './base-connector';
import { ConnectorConfig } from '../types';
export declare class SOAPConnector extends BaseConnector {
    constructor(config: ConnectorConfig);
    /**
     * Initialize SOAP connector
     */
    initialize(): Promise<void>;
    /**
     * Test SOAP connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Execute SOAP request
     */
    executeRequest(endpoint: string, _method: string, _data?: any): Promise<any>;
}
//# sourceMappingURL=soap-connector.d.ts.map