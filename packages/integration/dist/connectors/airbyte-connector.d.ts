import { BaseConnector } from './base-connector';
import { ConnectorConfig } from '../types';
export interface AirbyteConfig extends ConnectorConfig {
    apiKey: string;
    clientId: string;
    clientSecret: string;
    baseUrl?: string;
    workspaceId?: string;
}
export interface AirbyteSource {
    sourceId: string;
    name: string;
    sourceDefinitionId: string;
    workspaceId: string;
    connectionConfiguration: any;
}
export interface AirbyteDestination {
    destinationId: string;
    name: string;
    destinationDefinitionId: string;
    workspaceId: string;
    connectionConfiguration: any;
}
export interface AirbyteConnection {
    connectionId: string;
    name: string;
    sourceId: string;
    destinationId: string;
    status: 'active' | 'inactive' | 'deprecated';
    schedule?: {
        scheduleType: 'basic' | 'cron';
        basicSchedule?: {
            timeUnit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
            units: number;
        };
        cronExpression?: string;
    };
    syncCatalog: {
        streams: Array<{
            stream: {
                name: string;
                jsonSchema: any;
                supportedSyncModes: string[];
            };
            config: {
                syncMode: 'full_refresh' | 'incremental';
                destinationSyncMode: 'overwrite' | 'append' | 'append_dedup';
                selected: boolean;
            };
        }>;
    };
}
export interface AirbyteSyncJob {
    jobId: string;
    status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
    connectionId: string;
    createdAt: string;
    updatedAt: string;
    startedAt?: string;
    endedAt?: string;
    recordsSynced?: number;
    dataEmitted?: number;
    errorMessage?: string;
}
export declare class AirbyteConnector extends BaseConnector {
    private client;
    private config;
    private accessToken?;
    private tokenExpiresAt?;
    constructor(config: AirbyteConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private getAccessToken;
    execute(operation: string, data: any): Promise<any>;
    testConnection(): Promise<boolean>;
    private getWorkspaces;
    private listSources;
    private listDestinations;
    private listConnections;
    private createSource;
    private createDestination;
    private createConnection;
    private triggerSync;
    private getSyncStatus;
    private syncData;
    private findOrCreateSource;
    private findOrCreateDestination;
    private findOrCreateConnection;
    private discoverSourceSchema;
    private createSyncCatalog;
    private mapSchedule;
    private getDefaultDestinationConfig;
    private waitForJobCompletion;
    dispose(): Promise<void>;
}
export declare function createAirbyteConnector(config?: Partial<AirbyteConfig>): AirbyteConnector;
//# sourceMappingURL=airbyte-connector.d.ts.map