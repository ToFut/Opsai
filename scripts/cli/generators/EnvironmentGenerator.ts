import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '../../../packages/shared/src/config/service-config';
import { ServiceResolver } from '../../../packages/shared/src/services/service-resolver';

/**
 * Enhanced Environment Variable Generator
 * Creates proper .env files with service resolution and validation
 */
export class EnvironmentGenerator {
  private config: AppConfig;
  private serviceResolver: ServiceResolver;

  constructor(config: AppConfig) {
    this.config = config;
    this.serviceResolver = new ServiceResolver(config.services);
  }

  async generateEnvironmentFiles(outputDir: string): Promise<void> {
    console.log('⚙️  Generating environment configuration files...');

    // Generate .env.example template
    await this.generateEnvironmentTemplate(outputDir);
    
    // Generate .env file for development
    await this.generateEnvironmentFile(outputDir);
    
    // Generate environment-specific files
    await this.generateEnvironmentSpecificFiles(outputDir);
    
    // Generate environment validation
    await this.generateEnvironmentValidation(outputDir);

    console.log('✅ Environment configuration generated successfully');
  }

  private async generateEnvironmentTemplate(outputDir: string): Promise<void> {
    const templateContent = this.serviceResolver.generateEnvironmentTemplate();
    const templatePath = path.join(outputDir, '.env.example');
    
    fs.writeFileSync(templatePath, templateContent);
    console.log(`📄 Generated environment template: ${templatePath}`);
  }

  private async generateEnvironmentFile(outputDir: string): Promise<void> {
    const envVars = this.generateDevelopmentEnvironmentVariables();
    const envContent = this.buildEnvironmentFileContent(envVars);
    const envPath = path.join(outputDir, '.env');
    
    fs.writeFileSync(envPath, envContent);
    console.log(`📄 Generated development environment: ${envPath}`);
  }

  private async generateEnvironmentSpecificFiles(outputDir: string): Promise<void> {
    const environments = ['development', 'staging', 'production'];
    
    for (const env of environments) {
      const envVars = this.generateEnvironmentSpecificVariables(env);
      const envContent = this.buildEnvironmentFileContent(envVars);
      const envPath = path.join(outputDir, `.env.${env}`);
      
      fs.writeFileSync(envPath, envContent);
      console.log(`📄 Generated ${env} environment: ${envPath}`);
    }
  }

  private generateDevelopmentEnvironmentVariables(): Record<string, string> {
    const envVars: Record<string, string> = {};

    // Basic application configuration
    envVars.NODE_ENV = 'development';
    envVars.PORT = '3001';
    envVars.APP_NAME = this.config.app.name;
    
    // Database configuration
    envVars.DATABASE_URL = this.getDevelopmentDatabaseUrl();
    
    // Authentication configuration
    const authConfig = this.getAuthConfiguration();
    Object.assign(envVars, authConfig);
    
    // Redis configuration
    envVars.REDIS_URL = 'redis://localhost:6379';
    
    // Temporal configuration
    if (this.config.features?.workflows) {
      envVars.TEMPORAL_HOST = 'localhost:7233';
      envVars.TEMPORAL_NAMESPACE = `dev_${this.config.app.name}`;
    }

    // Integration placeholders
    this.config.services.integrations.forEach(integration => {
      if (integration.mode === 'user-api-key') {
        const envPrefix = integration.name.toUpperCase();
        envVars[`${envPrefix}_API_KEY`] = `your-${integration.name}-api-key`;
        
        if (integration.credentials) {
          Object.keys(integration.credentials).forEach(key => {
            const envVar = `${envPrefix}_${key.toUpperCase()}`;
            envVars[envVar] = `your-${integration.name}-${key}`;
          });
        }
      }
    });

    // Feature-specific environment variables
    if (this.config.features?.fileUpload) {
      envVars.UPLOAD_DIR = './uploads';
      envVars.MAX_FILE_SIZE = '10485760'; // 10MB
    }

    // Security
    envVars.JWT_SECRET = 'your-jwt-secret-change-in-production';
    
    return envVars;
  }

  private generateEnvironmentSpecificVariables(environment: string): Record<string, string> {
    const baseVars = this.generateDevelopmentEnvironmentVariables();
    
    // Override environment-specific values
    baseVars.NODE_ENV = environment;
    
    switch (environment) {
      case 'production':
        baseVars.PORT = '3000';
        baseVars.DATABASE_URL = this.getProductionDatabaseUrl();
        baseVars.REDIS_URL = this.getProductionRedisUrl();
        baseVars.JWT_SECRET = '${JWT_SECRET}'; // Should be set via secrets management
        
        if (this.config.features?.workflows) {
          baseVars.TEMPORAL_HOST = '${TEMPORAL_HOST}';
          baseVars.TEMPORAL_NAMESPACE = `prod_${this.config.app.name}`;
        }
        break;
        
      case 'staging':
        baseVars.PORT = '3000';
        baseVars.DATABASE_URL = this.getStagingDatabaseUrl();
        baseVars.REDIS_URL = this.getStagingRedisUrl();
        
        if (this.config.features?.workflows) {
          baseVars.TEMPORAL_HOST = '${STAGING_TEMPORAL_HOST}';
          baseVars.TEMPORAL_NAMESPACE = `staging_${this.config.app.name}`;
        }
        break;
    }
    
    return baseVars;
  }

  private getDevelopmentDatabaseUrl(): string {
    const dbProvider = this.config.services.database.provider;
    
    switch (dbProvider) {
      case 'core-managed':
        return `postgresql://localhost:5432/dev_${this.config.app.name}`;
      case 'user-postgresql':
        return this.config.services.database.url || 'postgresql://localhost:5432/dev_database';
      case 'user-mysql':
        return this.config.services.database.url || 'mysql://localhost:3306/dev_database';
      case 'user-sqlite':
        return 'file:./dev.db';
      default:
        return 'file:./dev.db'; // Default to SQLite for development
    }
  }

  private getProductionDatabaseUrl(): string {
    const dbProvider = this.config.services.database.provider;
    
    switch (dbProvider) {
      case 'core-managed':
        return '${CORE_DATABASE_URL}';
      case 'user-postgresql':
        return '${DATABASE_URL}';
      case 'user-mysql':
        return '${DATABASE_URL}';
      case 'user-sqlite':
        return 'file:./production.db';
      default:
        return '${DATABASE_URL}';
    }
  }

  private getStagingDatabaseUrl(): string {
    const dbProvider = this.config.services.database.provider;
    
    switch (dbProvider) {
      case 'core-managed':
        return '${STAGING_DATABASE_URL}';
      default:
        return '${STAGING_DATABASE_URL}';
    }
  }

  private getProductionRedisUrl(): string {
    return this.config.services.mode === 'shared' 
      ? '${CORE_REDIS_URL}' 
      : '${REDIS_URL}';
  }

  private getStagingRedisUrl(): string {
    return this.config.services.mode === 'shared' 
      ? '${STAGING_REDIS_URL}' 
      : '${STAGING_REDIS_URL}';
  }

  private getAuthConfiguration(): Record<string, string> {
    const authConfig: Record<string, string> = {};
    const provider = this.config.services.auth.provider;
    
    switch (provider) {
      case 'core-supabase':
        authConfig.SUPABASE_URL = '${CORE_SUPABASE_URL}';
        authConfig.SUPABASE_ANON_KEY = '${CORE_SUPABASE_ANON_KEY}';
        authConfig.SUPABASE_SERVICE_KEY = '${CORE_SUPABASE_SERVICE_KEY}';
        break;
        
      case 'user-supabase':
        authConfig.SUPABASE_URL = 'https://your-project.supabase.co';
        authConfig.SUPABASE_ANON_KEY = 'your-supabase-anon-key';
        authConfig.SUPABASE_SERVICE_KEY = 'your-supabase-service-key';
        break;
        
      case 'auth0':
        authConfig.AUTH0_DOMAIN = 'your-domain.auth0.com';
        authConfig.AUTH0_CLIENT_ID = 'your-auth0-client-id';
        authConfig.AUTH0_CLIENT_SECRET = 'your-auth0-client-secret';
        break;
        
      case 'clerk':
        authConfig.CLERK_FRONTEND_API = 'your-clerk-frontend-api';
        authConfig.CLERK_API_KEY = 'your-clerk-api-key';
        break;
    }
    
    return authConfig;
  }

  private buildEnvironmentFileContent(envVars: Record<string, string>): string {
    const lines: string[] = [];
    
    lines.push(`# ${this.config.app.displayName} Environment Configuration`);
    lines.push(`# Generated on: ${new Date().toISOString()}`);
    lines.push(`# Service Mode: ${this.config.services.mode}`);
    lines.push('');
    
    // Group environment variables by category
    const categories = this.categorizeEnvironmentVariables(envVars);
    
    Object.entries(categories).forEach(([category, vars]) => {
      if (vars.length > 0) {
        lines.push(`# ${category}`);
        vars.forEach(([key, value]) => {
          lines.push(`${key}="${value}"`);
        });
        lines.push('');
      }
    });
    
    return lines.join('\n');
  }

  private categorizeEnvironmentVariables(envVars: Record<string, string>): Record<string, [string, string][]> {
    const categories: Record<string, [string, string][]> = {
      'Application': [],
      'Database': [],
      'Authentication': [],
      'Cache & Queues': [],
      'Workflows': [],
      'File Storage': [],
      'Third-party Integrations': [],
      'Security': [],
      'Other': []
    };

    Object.entries(envVars).forEach(([key, value]) => {
      if (key.includes('APP_') || key === 'NODE_ENV' || key === 'PORT') {
        categories['Application'].push([key, value]);
      } else if (key.includes('DATABASE_')) {
        categories['Database'].push([key, value]);
      } else if (key.includes('SUPABASE_') || key.includes('AUTH0_') || key.includes('CLERK_') || key.includes('JWT_')) {
        categories['Authentication'].push([key, value]);
      } else if (key.includes('REDIS_') || key.includes('QUEUE_')) {
        categories['Cache & Queues'].push([key, value]);
      } else if (key.includes('TEMPORAL_')) {
        categories['Workflows'].push([key, value]);
      } else if (key.includes('UPLOAD_') || key.includes('S3_') || key.includes('STORAGE_')) {
        categories['File Storage'].push([key, value]);
      } else if (this.isIntegrationVariable(key)) {
        categories['Third-party Integrations'].push([key, value]);
      } else if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD')) {
        categories['Security'].push([key, value]);
      } else {
        categories['Other'].push([key, value]);
      }
    });

    return categories;
  }

  private isIntegrationVariable(key: string): boolean {
    return this.config.services.integrations.some(integration => 
      key.startsWith(integration.name.toUpperCase())
    );
  }

  private async generateEnvironmentValidation(outputDir: string): Promise<void> {
    const validationContent = this.buildEnvironmentValidation();
    const validationPath = path.join(outputDir, 'src', 'config', 'env-validation.ts');
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(validationPath), { recursive: true });
    
    fs.writeFileSync(validationPath, validationContent);
    console.log(`📄 Generated environment validation: ${validationPath}`);
  }

  private buildEnvironmentValidation(): string {
    return `
import { z } from 'zod';

/**
 * Environment variable validation schema
 * Generated by CORE Platform
 */
export const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default(3001),
  APP_NAME: z.string().min(1),

  // Database
  DATABASE_URL: z.string().url(),

  ${this.config.features?.authentication ? `
  // Authentication
  ${this.getAuthValidationSchema()}
  ` : ''}

  // Cache & Queues
  REDIS_URL: z.string().url().optional(),

  ${this.config.features?.workflows ? `
  // Workflows  
  TEMPORAL_HOST: z.string().optional(),
  TEMPORAL_NAMESPACE: z.string().optional(),
  ` : ''}

  ${this.config.features?.fileUpload ? `
  // File Upload
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).default(10485760),
  ` : ''}

  // Security
  JWT_SECRET: z.string().min(32),

  ${this.getIntegrationValidationSchema()}
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Check if all required environment variables are set
 */
export function checkRequiredEnvVars(): void {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    ${this.getRequiredEnvVarsList()}
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(\`  - \${key}\`));
    console.error('\\n💡 Copy .env.example to .env and fill in the values');
    process.exit(1);
  }
}
`.trim();
  }

  private getAuthValidationSchema(): string {
    const provider = this.config.services.auth.provider;
    
    switch (provider) {
      case 'core-supabase':
      case 'user-supabase':
        return `
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),`;
      
      case 'auth0':
        return `
  AUTH0_DOMAIN: z.string().min(1),
  AUTH0_CLIENT_ID: z.string().min(1),
  AUTH0_CLIENT_SECRET: z.string().min(1),`;
      
      case 'clerk':
        return `
  CLERK_FRONTEND_API: z.string().min(1),
  CLERK_API_KEY: z.string().min(1),`;
      
      default:
        return '';
    }
  }

  private getIntegrationValidationSchema(): string {
    if (this.config.services.integrations.length === 0) {
      return '';
    }

    const integrationSchemas = this.config.services.integrations
      .filter(integration => integration.mode === 'user-api-key')
      .map(integration => {
        const envPrefix = integration.name.toUpperCase();
        const keys = integration.credentials 
          ? Object.keys(integration.credentials)
          : ['API_KEY'];
        
        return keys.map(key => 
          `  ${envPrefix}_${key.toUpperCase()}: z.string().min(1),`
        ).join('\n');
      });

    return `
  // Third-party Integrations
${integrationSchemas.join('\n')}`;
  }

  private getRequiredEnvVarsList(): string {
    const required: string[] = [];
    
    if (this.config.features?.authentication) {
      const provider = this.config.services.auth.provider;
      switch (provider) {
        case 'core-supabase':
        case 'user-supabase':
          required.push("'SUPABASE_URL'", "'SUPABASE_ANON_KEY'");
          break;
        case 'auth0':
          required.push("'AUTH0_DOMAIN'", "'AUTH0_CLIENT_ID'", "'AUTH0_CLIENT_SECRET'");
          break;
        case 'clerk':
          required.push("'CLERK_FRONTEND_API'", "'CLERK_API_KEY'");
          break;
      }
    }

    this.config.services.integrations
      .filter(integration => integration.mode === 'user-api-key')
      .forEach(integration => {
        const envPrefix = integration.name.toUpperCase();
        required.push(`'${envPrefix}_API_KEY'`);
      });

    return required.join(',\n    ');
  }
}