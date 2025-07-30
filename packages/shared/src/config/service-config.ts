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
  
  // Core services configuration
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
  
  // Service configuration
  services: ServiceConfig;
  
  // Database schema
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
  
  // API definitions
  apis?: {
    integrations: IntegrationConfig[];
  };
  
  // Workflows
  workflows?: Array<{
    name: string;
    description: string;
    trigger: any;
    steps: any[];
  }>;
  
  // UI configuration
  ui?: {
    theme: any;
    pages: any[];
  };
  
  // Alert rules
  alerts?: {
    rules: any[];
  };
  
  // Deployment configuration
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
  
  // Feature flags
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
export const DEFAULT_SERVICE_CONFIGS: Record<ServiceMode, Partial<ServiceConfig>> = {
  shared: {
    mode: 'shared',
    database: {
      provider: 'core-managed'
    },
    auth: {
      provider: 'core-supabase'
    },
    storage: {
      provider: 'core-supabase'
    }
  },
  
  byoi: {
    mode: 'byoi',
    database: {
      provider: 'user-postgresql'
    },
    auth: {
      provider: 'user-supabase'
    },
    storage: {
      provider: 'user-s3'
    }
  },
  
  hybrid: {
    mode: 'hybrid',
    database: {
      provider: 'core-managed' // Development
    },
    auth: {
      provider: 'core-supabase' // Development
    },
    storage: {
      provider: 'core-supabase' // Development
    }
  }
};

/**
 * Validation functions for service configurations
 */
export class ServiceConfigValidator {
  static validate(config: ServiceConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate database configuration
    if (config.database.provider !== 'core-managed' && !config.database.url) {
      errors.push('Database URL is required for user-provided database');
    }
    
    // Validate auth configuration
    if (config.auth.provider === 'user-supabase') {
      if (!config.auth.supabaseUrl || !config.auth.supabaseAnonKey) {
        errors.push('Supabase URL and anon key are required for user-provided Supabase');
      }
    }
    
    // Validate integrations
    config.integrations.forEach((integration, index) => {
      if (integration.mode === 'user-api-key' && !integration.credentials) {
        // Allow integrations without credentials if they're expected to be provided via environment variables
        console.warn(`Integration '${integration.name}' will require credentials via environment variables`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}