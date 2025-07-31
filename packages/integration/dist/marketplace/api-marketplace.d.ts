export interface APIConnectorTemplate {
    id: string;
    name: string;
    provider: string;
    category: 'crm' | 'ecommerce' | 'hospitality' | 'finance' | 'marketing' | 'analytics' | 'communication';
    description: string;
    logo?: string;
    authentication: {
        type: 'api_key' | 'oauth2' | 'basic' | 'custom';
        oauth?: {
            authUrl: string;
            tokenUrl: string;
            scope: string[];
        };
    };
    baseUrl: string;
    documentation: string;
    features: string[];
    dataTypes: string[];
    syncFrequency?: string;
    setupTime?: string;
    pricing?: 'free' | 'freemium' | 'paid';
    quickSetup?: boolean;
}
export declare const API_MARKETPLACE: Record<string, APIConnectorTemplate>;
export declare class APIMarketplace {
    static getAllConnectors(): APIConnectorTemplate[];
    static getByCategory(category: APIConnectorTemplate['category']): APIConnectorTemplate[];
    static search(query: string): APIConnectorTemplate[];
    static getQuickSetupConnectors(): APIConnectorTemplate[];
    static generateIntegrationConfig(connectorId: string): any;
    private static generateDefaultEndpoints;
    private static generateDefaultTransformations;
    static oneClickSetup(connectorId: string, credentials: any): Promise<{
        success: boolean;
        connectionId?: string;
        error?: string;
    }>;
}
//# sourceMappingURL=api-marketplace.d.ts.map