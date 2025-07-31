/**
 * CORE Platform Data Sync Service
 * Validates that API data flows correctly into the database
 */
import { AppConfig } from '../../../shared/src/config/service-config';
export interface DataSyncResult {
    integration: string;
    entity: string;
    success: boolean;
    recordsFetched: number;
    recordsStored: number;
    validationErrors: string[];
    duration: number;
}
export interface DataSyncReport {
    timestamp: string;
    totalSyncs: number;
    successfulSyncs: number;
    results: DataSyncResult[];
    overallHealth: 'healthy' | 'warning' | 'critical';
}
export declare class DataSyncService {
    private serviceResolver;
    private appConfig;
    constructor(appConfig: AppConfig);
    /**
     * Validate data sync for all integrations and entities
     */
    validateDataSync(): Promise<DataSyncReport>;
    /**
     * Validate sync for a specific integration-entity pair
     */
    private validateEntitySync;
    /**
     * Attempt to fetch data from an integration for a specific entity
     */
    private attemptDataFetch;
    /**
     * Validate that fetched data matches expected entity structure
     */
    private validateDataStructure;
    /**
     * Test database storage without actually storing
     */
    private testDatabaseStorage;
    /**
     * Generate possible endpoint patterns for an entity
     */
    private generateEndpointPatterns;
    /**
     * Create a simple integration client for testing
     */
    private createIntegrationClient;
    /**
     * Transform API data for database storage
     */
    private transformDataForStorage;
    /**
     * Transform a field value to the expected database type
     */
    private transformFieldValue;
    /**
     * Map field type to JavaScript type for validation
     */
    private mapFieldTypeToJSType;
    /**
     * Calculate overall health based on sync results
     */
    private calculateOverallHealth;
    /**
     * Generate recommendations based on sync results
     */
    generateRecommendations(report: DataSyncReport): string[];
}
//# sourceMappingURL=data-sync-service.d.ts.map