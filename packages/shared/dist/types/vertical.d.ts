import { AuthConfig, EndpointConfig, RateLimitConfig } from './api';
import { WorkflowTrigger, RetryPolicy } from './workflow';
import { AlertCondition, AlertAction } from './alerts';
export interface VerticalConfig {
    name: string;
    description: string;
    version: string;
    database: VerticalDatabaseConfig;
    apis: VerticalAPIConfig[];
    workflows: WorkflowConfig[];
    ui: UIConfig;
    alerts: AlertConfig[];
    deployment: DeploymentConfig;
}
export interface VerticalDatabaseConfig {
    models: ModelConfig[];
    migrations: MigrationConfig;
    seedData?: SeedDataConfig;
}
export interface ModelConfig {
    name: string;
    fields: FieldConfig[];
    relationships?: RelationshipConfig[];
    indexes?: IndexConfig[];
}
export interface FieldConfig {
    name: string;
    type: string;
    required: boolean;
    unique?: boolean;
    defaultValue?: any;
    validation?: ValidationConfig;
}
export interface RelationshipConfig {
    type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
    model: string;
    foreignKey: string;
    onDelete?: 'cascade' | 'setNull' | 'restrict';
    onUpdate?: 'cascade' | 'setNull' | 'restrict';
}
export interface IndexConfig {
    name: string;
    fields: string[];
    type?: 'unique' | 'fulltext' | 'spatial';
}
export interface ValidationConfig {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
}
export interface VerticalAPIConfig {
    name: string;
    type: 'rest' | 'graphql' | 'grpc';
    baseUrl: string;
    authentication: AuthConfig;
    endpoints: EndpointConfig[];
    rateLimits?: RateLimitConfig;
}
export interface WorkflowConfig {
    name: string;
    description: string;
    trigger: WorkflowTrigger;
    steps: WorkflowStepConfig[];
    timeout: number;
    retryPolicy?: RetryPolicy;
}
export interface WorkflowStepConfig {
    name: string;
    activity: string;
    config: Record<string, any>;
    timeout?: number;
    retryPolicy?: RetryPolicy;
}
export interface UIConfig {
    theme: ThemeConfig;
    pages: PageConfig[];
    components?: ComponentConfig[];
}
export interface ThemeConfig {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    customCSS?: string;
}
export interface PageConfig {
    name: string;
    path: string;
    components: ComponentConfig[];
    layout?: string;
    permissions?: string[];
}
export interface ComponentConfig {
    type: string;
    props: Record<string, any>;
    dataSource?: string;
    children?: ComponentConfig[];
}
export interface AlertConfig {
    name: string;
    description: string;
    conditions: AlertCondition[];
    actions: AlertAction[];
    cooldown: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export interface DeploymentConfig {
    environment: 'development' | 'staging' | 'production';
    resources: ResourceConfig;
    environmentVariables: EnvironmentVariable[];
    secrets: SecretConfig[];
}
export interface ResourceConfig {
    api: {
        cpu: string;
        memory: string;
        replicas: number;
    };
    database: {
        instanceType: string;
        storage: string;
    };
    redis: {
        memory: string;
    };
}
export interface EnvironmentVariable {
    name: string;
    value?: string;
    secret?: boolean;
    required: boolean;
}
export interface SecretConfig {
    name: string;
    description: string;
    type: 'api_key' | 'oauth' | 'database' | 'custom';
}
export interface MigrationConfig {
    autoGenerate: boolean;
    namingConvention: string;
}
export interface SeedDataConfig {
    tables: SeedTableConfig[];
}
export interface SeedTableConfig {
    table: string;
    data: Record<string, any>[];
    clearFirst?: boolean;
}
//# sourceMappingURL=vertical.d.ts.map