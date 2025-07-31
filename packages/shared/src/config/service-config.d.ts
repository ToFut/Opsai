/**
 * CORE Platform Service Configuration
 * Handles both shared infrastructure and BYOI (Bring Your Own Infrastructure) modes
 */
export type ServiceMode = 'shared' | 'byoi' | 'hybrid';
export type DatabaseProvider = 'core-managed' | 'user-postgresql' | 'user-mysql' | 'user-sqlite';
export type AuthProvider = 'core-supabase' | 'user-supabase' | 'auth0' | 'clerk' | 'custom';
export type StorageProvider = 'core-supabase' | 'user-s3' | 'user-gcs' | 'local';
export interface DatabaseConfig {
    provider: DatabaseProvider;
    url?: string;
    ssl?: boolean;
    pool?: {
        min: number;
        max: number;
    };
}
export interface AuthConfig {
    provider: AuthProvider;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    supabaseServiceKey?: string;
    jwtSecret?: string;
    customConfig?: Record<string, any>;
}
export interface StorageConfig {
    provider: StorageProvider;
    bucket?: string;
    region?: string;
    credentials?: {
        accessKeyId?: string;
        secretAccessKey?: string;
    };
}
export interface IntegrationConfig {
    name: string;
    mode: 'core-managed' | 'user-api-key';
    baseUrl?: string;
    credentials?: Record<string, string>;
    rateLimits?: {
        requestsPerMinute: number;
        burstLimit: number;
    };
}
export interface ServiceConfig {
    mode: ServiceMode;
    tenantId: string;
    environment: 'development' | 'staging' | 'production';
    database: DatabaseConfig;
    auth: AuthConfig;
    storage: StorageConfig;
    integrations: IntegrationConfig[];
    redis?: {
        url: string;
    };
    temporal?: {
        host: string;
        namespace: string;
    };
    monitoring?: {
        enabled: boolean;
        provider: 'core-managed' | 'datadog' | 'newrelic' | 'custom';
        apiKey?: string;
    };
}
export interface AppConfig {
    app: {
        name: string;
        displayName: string;
        description: string;
        version: string;
        author: string;
        license: string;
    };
    services: ServiceConfig;
    database: {
        type: string;
        entities: Array<{
            name: string;
            displayName: string;
            description?: string;
            fields: Record<string, any>;
            relationships?: Array<{
                type: string;
                model: string;
                foreignKey?: string;
            }>;
        }>;
    };
    apis?: {
        integrations: IntegrationConfig[];
    };
    workflows?: Array<{
        name: string;
        description: string;
        trigger: any;
        steps: any[];
    }>;
    ui?: {
        theme: any;
        pages: any[];
    };
    alerts?: {
        rules: any[];
    };
    deployment?: {
        platform: string;
        environment: string;
        resources: any;
        environmentVariables: Array<{
            name: string;
            value?: string;
            secret?: boolean;
        }>;
    };
    features?: {
        authentication: boolean;
        multiTenancy: boolean;
        fileUpload: boolean;
        notifications: boolean;
        analytics: boolean;
        workflows: boolean;
        alerts: boolean;
        integrations: boolean;
    };
}
/**
 * Default service configurations for different modes
 */
export declare const DEFAULT_SERVICE_CONFIGS: Record<ServiceMode, Partial<ServiceConfig>>;
/**
 * Validation functions for service configurations
 */
export declare class ServiceConfigValidator {
    static validate(config: ServiceConfig): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=service-config.d.ts.map