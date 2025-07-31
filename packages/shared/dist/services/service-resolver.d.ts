/**
 * CORE Platform Service Resolution
 * Dynamically resolves services based on configuration
 */
import { ServiceConfig, AuthConfig } from '../config/service-config';
export declare class ServiceResolver {
    private config;
    constructor(config: ServiceConfig);
    /**
     * Resolve database connection URL
     */
    resolveDatabaseUrl(): string;
    /**
     * Resolve authentication service configuration
     */
    resolveAuthConfig(): AuthConfig;
    /**
     * Resolve integration credentials
     */
    resolveIntegrationCredentials(integrationName: string): Record<string, string>;
    /**
     * Get Core's shared integration credentials
     */
    private getCoreIntegrationCredentials;
    /**
     * Resolve Redis configuration
     */
    resolveRedisUrl(): string;
    /**
     * Resolve Temporal configuration
     */
    resolveTemporalConfig(): {
        host: string;
        namespace: string;
    };
    /**
     * Generate environment variables for the generated application
     */
    generateEnvironmentVariables(): Record<string, string>;
    /**
     * Generate environment template for user to fill in
     */
    generateEnvironmentTemplate(): string;
}
//# sourceMappingURL=service-resolver.d.ts.map