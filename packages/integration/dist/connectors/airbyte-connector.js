"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirbyteConnector = void 0;
exports.createAirbyteConnector = createAirbyteConnector;
const axios_1 = __importDefault(require("axios"));
const base_connector_1 = require("./base-connector");
const errors_1 = require("../errors");
class AirbyteConnector extends base_connector_1.BaseConnector {
    constructor(config) {
        super(config);
        this.isConnected = false;
        this.config = config;
        this.client = axios_1.default.create({
            baseURL: config.baseUrl || 'https://api.airbyte.com/v1',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        // Add request interceptor for authentication
        this.client.interceptors.request.use(async (config) => {
            const token = await this.getAccessToken();
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
        // Add response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                // Token expired, clear it
                this.accessToken = undefined;
                this.tokenExpiresAt = undefined;
            }
            throw new errors_1.IntegrationError(`Airbyte API error: ${error.response?.data?.message || error.message}`, 'AIRBYTE_API_ERROR', error);
        });
    }
    async initialize() {
        await this.connect();
    }
    async executeRequest(endpoint, method, data) {
        const response = await this.client.request({
            method,
            url: endpoint,
            data
        });
        return response.data;
    }
    async connect() {
        try {
            await this.getAccessToken();
            // Test connection by fetching workspaces
            await this.getWorkspaces();
            this.isConnected = true;
        }
        catch (error) {
            this.isConnected = false;
            throw new errors_1.IntegrationError('Failed to connect to Airbyte', 'CONNECTION_FAILED', error);
        }
    }
    async disconnect() {
        this.accessToken = undefined;
        this.tokenExpiresAt = undefined;
        this.isConnected = false;
    }
    async getAccessToken() {
        // Check if we have a valid token
        if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
            return this.accessToken;
        }
        try {
            // Use API key if provided, otherwise use OAuth flow
            if (this.config.apiKey) {
                this.accessToken = this.config.apiKey;
                // Set expiration to 1 hour from now (API keys don't expire but we'll refresh periodically)
                this.tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
                return this.accessToken;
            }
            // OAuth 2.0 client credentials flow
            const response = await axios_1.default.post('https://cloud.airbyte.com/auth/realms/_airbyte-application-clients/protocol/openid-connect/token', {
                grant_type: 'client_credentials',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret
            }, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            this.accessToken = response.data.access_token;
            // Set expiration to 90% of actual expiration to ensure we refresh before it expires
            this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in * 900));
            return this.accessToken;
        }
        catch (error) {
            throw new errors_1.IntegrationError('Failed to obtain Airbyte access token', 'AUTH_FAILED', error);
        }
    }
    async execute(operation, data) {
        if (!this.isConnected) {
            await this.connect();
        }
        switch (operation) {
            case 'sync':
                return this.syncData(data);
            case 'create_source':
                return this.createSource(data);
            case 'create_destination':
                return this.createDestination(data);
            case 'create_connection':
                return this.createConnection(data);
            case 'trigger_sync':
                return this.triggerSync(data.connectionId);
            case 'get_sync_status':
                return this.getSyncStatus(data.jobId);
            case 'list_sources':
                return this.listSources(data.workspaceId);
            case 'list_destinations':
                return this.listDestinations(data.workspaceId);
            case 'list_connections':
                return this.listConnections(data.workspaceId);
            default:
                throw new errors_1.IntegrationError(`Unknown Airbyte operation: ${operation}`, 'UNKNOWN_OPERATION');
        }
    }
    async testConnection() {
        try {
            await this.connect();
            return true;
        }
        catch (error) {
            console.error('Airbyte connection test failed:', error);
            return false;
        }
    }
    // Core Airbyte API methods
    async getWorkspaces() {
        const response = await this.client.get('/workspaces');
        return response.data.data || [];
    }
    async listSources(workspaceId) {
        const params = workspaceId ? { workspaceId } : {};
        const response = await this.client.get('/sources', { params });
        return response.data.data || [];
    }
    async listDestinations(workspaceId) {
        const params = workspaceId ? { workspaceId } : {};
        const response = await this.client.get('/destinations', { params });
        return response.data.data || [];
    }
    async listConnections(workspaceId) {
        const params = workspaceId ? { workspaceId } : {};
        const response = await this.client.get('/connections', { params });
        return response.data.data || [];
    }
    async createSource(sourceConfig) {
        const response = await this.client.post('/sources', {
            name: sourceConfig.name,
            sourceType: sourceConfig.sourceType,
            workspaceId: sourceConfig.workspaceId || this.config.workspaceId,
            configuration: sourceConfig.configuration
        });
        return response.data;
    }
    async createDestination(destinationConfig) {
        const response = await this.client.post('/destinations', {
            name: destinationConfig.name,
            destinationType: destinationConfig.destinationType,
            workspaceId: destinationConfig.workspaceId || this.config.workspaceId,
            configuration: destinationConfig.configuration
        });
        return response.data;
    }
    async createConnection(connectionConfig) {
        const response = await this.client.post('/connections', connectionConfig);
        return response.data;
    }
    async triggerSync(connectionId) {
        const response = await this.client.post(`/connections/${connectionId}/jobs`, {
            jobType: 'sync'
        });
        return response.data;
    }
    async getSyncStatus(jobId) {
        const response = await this.client.get(`/jobs/${jobId}`);
        return response.data;
    }
    async syncData(syncConfig) {
        try {
            // Step 1: Create or find source
            let source = await this.findOrCreateSource(syncConfig.sourceConfig);
            // Step 2: Create or find destination (use internal database by default)
            let destination = await this.findOrCreateDestination(syncConfig.destinationConfig || this.getDefaultDestinationConfig());
            // Step 3: Create or find connection
            let connection = await this.findOrCreateConnection(source.sourceId, destination.destinationId, {
                schedule: this.mapSchedule(syncConfig.schedule),
                streams: syncConfig.streams
            });
            // Step 4: Trigger sync
            const job = await this.triggerSync(connection.connectionId);
            // Step 5: Wait for completion (with timeout)
            const completedJob = await this.waitForJobCompletion(job.jobId, 300000); // 5 minutes timeout
            return {
                success: completedJob.status === 'succeeded',
                recordsProcessed: completedJob.recordsSynced || 0,
                recordsFailed: completedJob.status === 'failed' ? 1 : 0,
                recordCount: completedJob.recordsSynced || 0,
                dataSize: completedJob.dataEmitted || 0,
                duration: completedJob.endedAt && completedJob.startedAt
                    ? new Date(completedJob.endedAt).getTime() - new Date(completedJob.startedAt).getTime()
                    : 0,
                metadata: {
                    jobId: job.jobId,
                    connectionId: connection.connectionId,
                    sourceId: source.sourceId,
                    destinationId: destination.destinationId
                },
                errors: completedJob.status === 'failed' ? [completedJob.errorMessage || 'Unknown error'] : []
            };
        }
        catch (error) {
            throw new errors_1.IntegrationError('Airbyte sync failed', 'SYNC_FAILED', error);
        }
    }
    async findOrCreateSource(sourceConfig) {
        // Try to find existing source by name
        const sources = await this.listSources(this.config.workspaceId);
        const existingSource = sources.find(s => s.name === sourceConfig.name);
        if (existingSource) {
            return existingSource;
        }
        // Create new source
        return this.createSource(sourceConfig);
    }
    async findOrCreateDestination(destinationConfig) {
        // Try to find existing destination by name
        const destinations = await this.listDestinations(this.config.workspaceId);
        const existingDestination = destinations.find(d => d.name === destinationConfig.name);
        if (existingDestination) {
            return existingDestination;
        }
        // Create new destination
        return this.createDestination(destinationConfig);
    }
    async findOrCreateConnection(sourceId, destinationId, options) {
        // Try to find existing connection
        const connections = await this.listConnections(this.config.workspaceId);
        const existingConnection = connections.find(c => c.sourceId === sourceId && c.destinationId === destinationId);
        if (existingConnection) {
            return existingConnection;
        }
        // Discover source schema
        const schema = await this.discoverSourceSchema(sourceId);
        // Create sync catalog from discovered schema
        const syncCatalog = this.createSyncCatalog(schema, options.streams);
        // Create new connection
        return this.createConnection({
            name: `sync-${sourceId}-${destinationId}`,
            sourceId,
            destinationId,
            schedule: options.schedule,
            syncCatalog
        });
    }
    async discoverSourceSchema(sourceId) {
        const response = await this.client.post(`/sources/${sourceId}/discover`);
        return response.data;
    }
    createSyncCatalog(schema, selectedStreams) {
        const streams = schema.catalog?.streams || [];
        return {
            streams: streams.map((stream) => ({
                stream: {
                    name: stream.stream.name,
                    jsonSchema: stream.stream.jsonSchema,
                    supportedSyncModes: stream.stream.supportedSyncModes || ['full_refresh']
                },
                config: {
                    syncMode: stream.stream.supportedSyncModes?.includes('incremental') ? 'incremental' : 'full_refresh',
                    destinationSyncMode: 'append_dedup',
                    selected: !selectedStreams || selectedStreams.includes(stream.stream.name)
                }
            }))
        };
    }
    mapSchedule(schedule) {
        switch (schedule) {
            case 'hourly':
                return {
                    scheduleType: 'basic',
                    basicSchedule: { timeUnit: 'hours', units: 1 }
                };
            case 'daily':
                return {
                    scheduleType: 'basic',
                    basicSchedule: { timeUnit: 'days', units: 1 }
                };
            case 'weekly':
                return {
                    scheduleType: 'basic',
                    basicSchedule: { timeUnit: 'weeks', units: 1 }
                };
            default:
                return undefined; // Manual sync
        }
    }
    getDefaultDestinationConfig() {
        // Default to PostgreSQL destination using current database
        return {
            name: 'opsai-database',
            destinationType: 'postgres',
            configuration: {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5432'),
                database: process.env.DB_NAME || 'opsai_core',
                username: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                schema: 'airbyte_synced'
            }
        };
    }
    async waitForJobCompletion(jobId, timeoutMs = 300000) {
        const startTime = Date.now();
        const pollInterval = 5000; // 5 seconds
        while (Date.now() - startTime < timeoutMs) {
            const job = await this.getSyncStatus(jobId);
            if (['succeeded', 'failed', 'cancelled'].includes(job.status)) {
                return job;
            }
            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        throw new errors_1.IntegrationError(`Airbyte sync job ${jobId} timed out after ${timeoutMs}ms`, 'SYNC_TIMEOUT');
    }
    async dispose() {
        await this.disconnect();
    }
}
exports.AirbyteConnector = AirbyteConnector;
// Factory function for easy instantiation
function createAirbyteConnector(config) {
    const airbyteConfig = {
        name: 'airbyte',
        version: '1.0.0',
        type: 'airbyte',
        apiKey: config?.apiKey || process.env.AIRBYTE_API_KEY || '',
        clientId: config?.clientId || process.env.AIRBYTE_CLIENT_ID || '',
        clientSecret: config?.clientSecret || process.env.AIRBYTE_CLIENT_SECRET || '',
        baseUrl: config?.baseUrl || process.env.AIRBYTE_BASE_URL || 'https://api.airbyte.com/v1',
        workspaceId: config?.workspaceId || process.env.AIRBYTE_WORKSPACE_ID,
        capabilities: config?.capabilities || ['discovery', 'sync', 'schema-detection'],
        retryConfig: {
            maxRetries: 3,
            initialDelay: 1000,
            backoffStrategy: 'exponential',
            maxDelay: 10000
        },
        ...config
    };
    return new AirbyteConnector(airbyteConfig);
}
//# sourceMappingURL=airbyte-connector.js.map