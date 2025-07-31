"use strict";
/**
 * CORE Platform Data Sync Service
 * Validates that API data flows correctly into the database
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSyncService = void 0;
const service_resolver_1 = require("../../../shared/src/services/service-resolver");
class DataSyncService {
    constructor(appConfig) {
        this.appConfig = appConfig;
        this.serviceResolver = new service_resolver_1.ServiceResolver(appConfig.services);
    }
    /**
     * Validate data sync for all integrations and entities
     */
    async validateDataSync() {
        console.log('🔄 CORE: Validating data sync flows...');
        const results = [];
        // Test each integration with each entity
        for (const integration of this.appConfig.services.integrations) {
            for (const entity of this.appConfig.database.entities) {
                console.log(`  📊 Testing ${integration.name} → ${entity.name}...`);
                const result = await this.validateEntitySync(integration, entity);
                results.push(result);
            }
        }
        const report = {
            timestamp: new Date().toISOString(),
            totalSyncs: results.length,
            successfulSyncs: results.filter(r => r.success).length,
            results,
            overallHealth: this.calculateOverallHealth(results)
        };
        console.log(`✅ CORE: Data sync validation completed`);
        console.log(`📈 Success rate: ${report.successfulSyncs}/${report.totalSyncs} sync paths working`);
        return report;
    }
    /**
     * Validate sync for a specific integration-entity pair
     */
    async validateEntitySync(integration, entity) {
        const startTime = Date.now();
        const result = {
            integration: integration.name,
            entity: entity.name,
            success: false,
            recordsFetched: 0,
            recordsStored: 0,
            validationErrors: [],
            duration: 0
        };
        try {
            // Step 1: Try to fetch data from the integration
            const fetchResult = await this.attemptDataFetch(integration, entity);
            result.recordsFetched = fetchResult.recordCount;
            if (!fetchResult.success) {
                result.validationErrors.push(`Data fetch failed: ${fetchResult.error}`);
                return result;
            }
            // Step 2: Validate the data structure
            const validationResult = this.validateDataStructure(fetchResult.data, entity);
            result.validationErrors.push(...validationResult.errors);
            // Step 3: Test database storage (dry run)
            const storageResult = await this.testDatabaseStorage(validationResult.transformedData, entity);
            result.recordsStored = storageResult.success ? 1 : 0;
            if (!storageResult.success) {
                result.validationErrors.push(`Storage test failed: ${storageResult.error}`);
            }
            result.success = result.validationErrors.length === 0;
        }
        catch (error) {
            result.validationErrors.push(error instanceof Error ? error.message : String(error));
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    /**
     * Attempt to fetch data from an integration for a specific entity
     */
    async attemptDataFetch(integration, entity) {
        try {
            // Get credentials
            const credentials = this.serviceResolver.resolveIntegrationCredentials(integration.name);
            // Create a test client
            const client = await this.createIntegrationClient(integration, credentials);
            // Try various endpoint patterns that might contain this entity's data
            const possibleEndpoints = this.generateEndpointPatterns(entity.name);
            for (const endpoint of possibleEndpoints) {
                try {
                    const data = await client.get(endpoint);
                    if (data) {
                        const recordCount = Array.isArray(data) ? data.length : (data.data && Array.isArray(data.data) ? data.data.length : 1);
                        return {
                            success: true,
                            data: data,
                            recordCount
                        };
                    }
                }
                catch (error) {
                    // Continue to next endpoint
                    continue;
                }
            }
            return {
                success: false,
                recordCount: 0,
                error: `No working endpoints found for ${entity.name} (tried: ${possibleEndpoints.join(', ')})`
            };
        }
        catch (error) {
            return {
                success: false,
                recordCount: 0,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Validate that fetched data matches expected entity structure
     */
    validateDataStructure(data, entity) {
        const errors = [];
        let transformedData = data;
        try {
            // Handle array vs single object
            const items = Array.isArray(data) ? data : (data.data || [data]);
            if (items.length === 0) {
                return {
                    valid: false,
                    errors: ['No data items to validate'],
                    transformedData: {}
                };
            }
            // Validate first item structure
            const firstItem = items[0];
            const entityFields = entity.fields || {};
            // Check for required fields
            Object.entries(entityFields).forEach(([fieldName, fieldConfig]) => {
                if (fieldConfig.required && (firstItem[fieldName] === undefined || firstItem[fieldName] === null)) {
                    errors.push(`Required field '${fieldName}' is missing from API data`);
                }
            });
            // Check for type mismatches
            Object.entries(entityFields).forEach(([fieldName, fieldConfig]) => {
                const value = firstItem[fieldName];
                if (value !== undefined && value !== null) {
                    const expectedType = this.mapFieldTypeToJSType(fieldConfig.type);
                    const actualType = typeof value;
                    if (expectedType !== 'any' && actualType !== expectedType) {
                        // Allow some type conversions
                        if (!(expectedType === 'number' && actualType === 'string' && !isNaN(Number(value))) &&
                            !(expectedType === 'object' && fieldConfig.type === 'datetime' && actualType === 'string')) {
                            errors.push(`Type mismatch for '${fieldName}': expected ${expectedType}, got ${actualType}`);
                        }
                    }
                }
            });
            // Transform data for storage
            transformedData = this.transformDataForStorage(firstItem, entity);
        }
        catch (error) {
            errors.push(`Data validation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        return {
            valid: errors.length === 0,
            errors,
            transformedData
        };
    }
    /**
     * Test database storage without actually storing
     */
    async testDatabaseStorage(data, entity) {
        try {
            // Simulate database constraints validation
            const requiredFields = Object.entries(entity.fields || {})
                .filter(([_, config]) => config.required)
                .map(([name, _]) => name);
            for (const field of requiredFields) {
                if (data[field] === undefined || data[field] === null) {
                    return {
                        success: false,
                        error: `Required field '${field}' would cause database constraint violation`
                    };
                }
            }
            // Check for field length constraints (simplified)
            Object.entries(entity.fields || {}).forEach(([fieldName, fieldConfig]) => {
                const value = data[fieldName];
                if (value && typeof value === 'string' && fieldConfig.validation?.max && value.length > fieldConfig.validation.max) {
                    return {
                        success: false,
                        error: `Field '${fieldName}' exceeds maximum length (${value.length} > ${fieldConfig.validation.max})`
                    };
                }
            });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Generate possible endpoint patterns for an entity
     */
    generateEndpointPatterns(entityName) {
        const lowerName = entityName.toLowerCase();
        const pluralName = lowerName.endsWith('s') ? lowerName : lowerName + 's';
        return [
            `/${pluralName}`,
            `/${lowerName}`,
            `/api/${pluralName}`,
            `/api/${lowerName}`,
            `/v1/${pluralName}`,
            `/v1/${lowerName}`,
            `/data/${pluralName}`,
            `/data/${lowerName}`
        ];
    }
    /**
     * Create a simple integration client for testing
     */
    async createIntegrationClient(integration, credentials) {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'CORE-Platform-DataSync/1.0'
        };
        // Add authentication headers
        if (credentials.api_key) {
            headers['Authorization'] = `Bearer ${credentials.api_key}`;
            headers['X-API-Key'] = credentials.api_key;
        }
        if (credentials.client_id && credentials.client_secret) {
            const basicAuth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');
            headers['Authorization'] = `Basic ${basicAuth}`;
        }
        return {
            get: async (path) => {
                const url = `${integration.baseUrl}${path}`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers,
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                }
                else {
                    return response.text();
                }
            }
        };
    }
    /**
     * Transform API data for database storage
     */
    transformDataForStorage(data, entity) {
        const transformed = { ...data };
        // Add required fields
        if (!transformed.id) {
            transformed.id = `sync-test-${Date.now()}`;
        }
        // Add tenant ID if multi-tenancy is enabled
        if (this.appConfig.features?.multiTenancy && !transformed.tenantId) {
            transformed.tenantId = 'sync-test-tenant';
        }
        // Transform field types
        Object.entries(entity.fields || {}).forEach(([fieldName, fieldConfig]) => {
            const value = transformed[fieldName];
            if (value !== undefined && value !== null) {
                transformed[fieldName] = this.transformFieldValue(value, fieldConfig.type);
            }
        });
        return transformed;
    }
    /**
     * Transform a field value to the expected database type
     */
    transformFieldValue(value, fieldType) {
        switch (fieldType) {
            case 'datetime':
            case 'date':
                return typeof value === 'string' ? new Date(value) : value;
            case 'number':
            case 'float':
            case 'decimal':
                return typeof value === 'string' ? parseFloat(value) : value;
            case 'integer':
            case 'int':
                return typeof value === 'string' ? parseInt(value, 10) : value;
            case 'boolean':
                return typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value);
            default:
                return value;
        }
    }
    /**
     * Map field type to JavaScript type for validation
     */
    mapFieldTypeToJSType(fieldType) {
        switch (fieldType) {
            case 'string':
            case 'text':
                return 'string';
            case 'number':
            case 'float':
            case 'decimal':
            case 'integer':
            case 'int':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'datetime':
            case 'date':
                return 'object'; // Date objects
            case 'json':
                return 'object';
            default:
                return 'any';
        }
    }
    /**
     * Calculate overall health based on sync results
     */
    calculateOverallHealth(results) {
        if (results.length === 0)
            return 'critical';
        const successRate = results.filter(r => r.success).length / results.length;
        if (successRate >= 0.9)
            return 'healthy';
        if (successRate >= 0.7)
            return 'warning';
        return 'critical';
    }
    /**
     * Generate recommendations based on sync results
     */
    generateRecommendations(report) {
        const recommendations = [];
        if (report.overallHealth === 'critical') {
            recommendations.push('🚨 Critical: Most data sync paths are failing. Check API credentials and network connectivity.');
        }
        else if (report.overallHealth === 'warning') {
            recommendations.push('⚠️  Warning: Some data sync paths are failing. Review integration configurations.');
        }
        // Group failures by type
        const authFailures = report.results.filter(r => r.validationErrors.some(e => e.includes('credentials') || e.includes('authentication')));
        if (authFailures.length > 0) {
            recommendations.push(`🔑 ${authFailures.length} sync(s) failing due to authentication issues`);
        }
        const structureFailures = report.results.filter(r => r.validationErrors.some(e => e.includes('Type mismatch') || e.includes('Required field')));
        if (structureFailures.length > 0) {
            recommendations.push(`📊 ${structureFailures.length} sync(s) failing due to data structure mismatches`);
        }
        if (recommendations.length === 0) {
            recommendations.push('✅ All data sync paths are working correctly!');
        }
        return recommendations;
    }
}
exports.DataSyncService = DataSyncService;
//# sourceMappingURL=data-sync-service.js.map