"use strict";
/**
 * CORE Platform Service Resolution
 * Dynamically resolves services based on configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceResolver = void 0;
class ServiceResolver {
    constructor(config) {
        this.config = config;
    }
    /**
     * Resolve database connection URL
     */
    resolveDatabaseUrl() {
        const dbConfig = this.config.database;
        switch (dbConfig.provider) {
            case 'core-managed':
                // Core managed database with tenant isolation
                const coreDbUrl = process.env.CORE_DATABASE_URL || 'postgresql://localhost:5432/opsai_core';
                return `${coreDbUrl}?schema=${this.config.tenantId}`;
            case 'user-postgresql':
            case 'user-mysql':
            case 'user-sqlite':
                if (!dbConfig.url) {
                    throw new Error(`Database URL is required for ${dbConfig.provider}`);
                }
                return dbConfig.url;
            default:
                throw new Error(`Unsupported database provider: ${dbConfig.provider}`);
        }
    }
    /**
     * Resolve authentication service configuration
     */
    resolveAuthConfig() {
        const authConfig = this.config.auth;
        switch (authConfig.provider) {
            case 'core-supabase':
                return {
                    provider: 'core-supabase',
                    supabaseUrl: process.env.CORE_SUPABASE_URL,
                    supabaseAnonKey: process.env.CORE_SUPABASE_ANON_KEY,
                    supabaseServiceKey: process.env.CORE_SUPABASE_SERVICE_KEY,
                    jwtSecret: process.env.CORE_JWT_SECRET
                };
            case 'user-supabase':
                return {
                    provider: 'user-supabase',
                    supabaseUrl: authConfig.supabaseUrl,
                    supabaseAnonKey: authConfig.supabaseAnonKey,
                    supabaseServiceKey: authConfig.supabaseServiceKey,
                    jwtSecret: authConfig.jwtSecret
                };
            case 'auth0':
            case 'clerk':
            case 'custom':
                return authConfig;
            default:
                throw new Error(`Unsupported auth provider: ${authConfig.provider}`);
        }
    }
    /**
     * Resolve integration credentials
     */
    resolveIntegrationCredentials(integrationName) {
        const integration = this.config.integrations.find(i => i.name === integrationName);
        if (!integration) {
            throw new Error(`Integration '${integrationName}' not found in configuration`);
        }
        // If integration has credentials in config, use them directly
        if (integration.credentials && Object.keys(integration.credentials).length > 0) {
            console.log(`🔑 Using config credentials for ${integrationName}:`, Object.keys(integration.credentials));
            return integration.credentials;
        }
        // Fallback to mode-based resolution
        switch (integration.mode) {
            case 'core-managed':
                // Use CORE's shared API credentials
                return this.getCoreIntegrationCredentials(integrationName);
            case 'user-api-key':
                // Try to get from environment variables
                const envCredentials = this.getCoreIntegrationCredentials(integrationName);
                if (Object.keys(envCredentials).length > 0) {
                    return envCredentials;
                }
                console.warn(`No credentials found for integration '${integrationName}' in config or environment`);
                return {};
            default:
                throw new Error(`Unsupported integration mode: ${integration.mode}`);
        }
    }
    /**
     * Get Core's shared integration credentials
     */
    getCoreIntegrationCredentials(integrationName) {
        const envPrefix = `CORE_${integrationName.toUpperCase()}`;
        // Common credential patterns
        const credentials = {};
        // Try common credential environment variable patterns
        const possibleKeys = [
            'API_KEY', 'CLIENT_ID', 'CLIENT_SECRET', 'ACCESS_TOKEN',
            'BASE_URL', 'WEBHOOK_SECRET', 'PUBLIC_KEY', 'PRIVATE_KEY'
        ];
        possibleKeys.forEach(key => {
            const envVar = `${envPrefix}_${key}`;
            const value = process.env[envVar];
            if (value) {
                credentials[key.toLowerCase()] = value;
            }
        });
        return credentials;
    }
    /**
     * Resolve Redis configuration
     */
    resolveRedisUrl() {
        if (this.config.mode === 'shared') {
            return process.env.CORE_REDIS_URL || 'redis://localhost:6379';
        }
        else {
            return this.config.redis?.url || 'redis://localhost:6379';
        }
    }
    /**
     * Resolve Temporal configuration
     */
    resolveTemporalConfig() {
        if (this.config.mode === 'shared') {
            return {
                host: process.env.CORE_TEMPORAL_HOST || 'localhost:7233',
                namespace: `core_${this.config.tenantId}`
            };
        }
        else {
            return {
                host: this.config.temporal?.host || 'localhost:7233',
                namespace: this.config.temporal?.namespace || 'default'
            };
        }
    }
    /**
     * Generate environment variables for the generated application
     */
    generateEnvironmentVariables() {
        const envVars = {};
        // Database
        envVars.DATABASE_URL = this.resolveDatabaseUrl();
        // Auth
        const authConfig = this.resolveAuthConfig();
        if (authConfig.supabaseUrl) {
            envVars.SUPABASE_URL = authConfig.supabaseUrl;
            envVars.SUPABASE_ANON_KEY = authConfig.supabaseAnonKey || '';
        }
        if (authConfig.jwtSecret) {
            envVars.JWT_SECRET = authConfig.jwtSecret;
        }
        // Redis
        envVars.REDIS_URL = this.resolveRedisUrl();
        // Temporal
        const temporalConfig = this.resolveTemporalConfig();
        envVars.TEMPORAL_HOST = temporalConfig.host;
        envVars.TEMPORAL_NAMESPACE = temporalConfig.namespace;
        // Integrations
        this.config.integrations.forEach(integration => {
            try {
                const credentials = this.resolveIntegrationCredentials(integration.name);
                Object.entries(credentials).forEach(([key, value]) => {
                    const envVarName = `${integration.name.toUpperCase()}_${key.toUpperCase()}`;
                    envVars[envVarName] = value;
                });
            }
            catch (error) {
                // Integration credentials will be provided by user later
                console.warn(`Integration '${integration.name}' credentials not available during generation`);
            }
        });
        // Application metadata
        envVars.APP_NAME = this.config.tenantId;
        envVars.NODE_ENV = this.config.environment;
        return envVars;
    }
    /**
     * Generate environment template for user to fill in
     */
    generateEnvironmentTemplate() {
        const template = [];
        template.push('# CORE Generated Application Environment Configuration');
        template.push('# Generated on: ' + new Date().toISOString());
        template.push('');
        // Service mode explanation
        template.push(`# Service Mode: ${this.config.mode}`);
        template.push('# - shared: Uses CORE\'s managed infrastructure');
        template.push('# - byoi: Bring your own infrastructure');
        template.push('# - hybrid: Shared for dev, your own for production');
        template.push('');
        // Database configuration
        if (this.config.database.provider === 'core-managed') {
            template.push('# Database: Managed by CORE');
            template.push('# DATABASE_URL is automatically configured');
        }
        else {
            template.push('# Database: User-provided');
            template.push('DATABASE_URL="postgresql://user:password@host:5432/database"');
        }
        template.push('');
        // Auth configuration
        if (this.config.auth.provider === 'core-supabase') {
            template.push('# Authentication: Managed by CORE');
            template.push('# Supabase credentials are automatically configured');
        }
        else {
            template.push('# Authentication: User-provided');
            template.push('SUPABASE_URL="https://your-project.supabase.co"');
            template.push('SUPABASE_ANON_KEY="your-anon-key"');
            template.push('SUPABASE_SERVICE_KEY="your-service-key"');
        }
        template.push('JWT_SECRET="your-jwt-secret-key"');
        template.push('');
        // Integration credentials
        template.push('# Third-party Integration API Keys');
        template.push('# You must provide these credentials');
        this.config.integrations.forEach(integration => {
            if (integration.mode === 'user-api-key') {
                template.push(`# ${integration.name} Integration`);
                if (integration.credentials) {
                    Object.keys(integration.credentials).forEach(key => {
                        const envVarName = `${integration.name.toUpperCase()}_${key.toUpperCase()}`;
                        template.push(`${envVarName}="your-${integration.name}-${key}"`);
                    });
                }
                else {
                    template.push(`${integration.name.toUpperCase()}_API_KEY="your-${integration.name}-api-key"`);
                }
                template.push('');
            }
        });
        // Application configuration
        template.push('# Application Configuration');
        template.push(`APP_NAME="${this.config.tenantId}"`);
        template.push(`NODE_ENV="${this.config.environment}"`);
        template.push('PORT="3001"');
        return template.join('\n');
    }
}
exports.ServiceResolver = ServiceResolver;
//# sourceMappingURL=service-resolver.js.map