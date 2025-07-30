import * as fs from 'fs';
import * as path from 'path';
import { AppConfig, IntegrationConfig } from '../../../packages/shared/src/config/service-config';
import { ServiceResolver } from '../../../packages/shared/src/services/service-resolver';

/**
 * Enhanced Integration Generator
 * Generates high-quality integration clients with proper error handling and structure
 */
export class EnhancedIntegrationGenerator {
  private config: AppConfig;
  private serviceResolver: ServiceResolver;

  constructor(config: AppConfig) {
    this.config = config;
    this.serviceResolver = new ServiceResolver(config.services);
  }

  async generateIntegrations(outputDir: string): Promise<void> {
    if (!this.config.services.integrations || this.config.services.integrations.length === 0) {
      console.log('⏭️  No integrations to generate');
      return;
    }

    const integrationsDir = path.join(outputDir, 'src', 'integrations');
    fs.mkdirSync(integrationsDir, { recursive: true });

    // Generate base integration infrastructure
    await this.generateBaseInfrastructure(integrationsDir);

    // Generate individual integration clients
    for (const integration of this.config.services.integrations) {
      await this.generateIntegrationClient(integrationsDir, integration);
    }

    // Generate integration service
    await this.generateIntegrationService(integrationsDir);

    // Generate integration registry
    await this.generateIntegrationRegistry(integrationsDir);

    console.log('✅ Enhanced integration system generated');
  }

  private async generateBaseInfrastructure(integrationsDir: string): Promise<void> {
    // Generate base client interface
    await this.generateBaseClient(integrationsDir);
    
    // Generate error types
    await this.generateErrorTypes(integrationsDir);
    
    // Generate rate limiter
    await this.generateRateLimiter(integrationsDir);
    
    // Generate retry logic
    await this.generateRetryLogic(integrationsDir);
  }

  private async generateBaseClient(integrationsDir: string): Promise<void> {
    const baseClientContent = `
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { IntegrationError, RateLimitError, AuthenticationError } from './errors';
import { RateLimiter } from './rate-limiter';
import { RetryManager } from './retry-manager';
import { validateEnv } from '../../config/env-validation';

export interface BaseIntegrationConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  rateLimitRpm?: number;
  validateResponse?: boolean;
}

export interface IntegrationCredentials {
  [key: string]: string;
}

export abstract class BaseIntegrationClient {
  protected client: AxiosInstance;
  protected config: BaseIntegrationConfig;
  protected rateLimiter: RateLimiter;
  protected retryManager: RetryManager;
  protected credentials: IntegrationCredentials;

  constructor(config: BaseIntegrationConfig, credentials: IntegrationCredentials = {}) {
    this.config = config;
    this.credentials = credentials;
    
    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(config.rateLimitRpm || 60);
    
    // Initialize retry manager
    this.retryManager = new RetryManager(config.retries || 3);
    
    // Create axios instance
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': \`CORE-Platform/1.0 (\${process.env.APP_NAME || 'opsai-app'})\`
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Rate limiting
        await this.rateLimiter.acquire();
        
        // Add authentication
        config = this.addAuthentication(config);
        
        // Add request ID for tracing
        config.headers = {
          ...config.headers,
          'X-Request-ID': this.generateRequestId()
        };
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.config.validateResponse) {
          this.validateResponse(response);
        }
        return response;
      },
      (error) => this.handleError(error)
    );
  }

  protected abstract addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig;

  protected validateResponse(response: AxiosResponse): void {
    // Override in subclasses for custom validation
  }

  protected handleError(error: any): Promise<never> {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || error.message;
      
      switch (status) {
        case 401:
        case 403:
          throw new AuthenticationError(\`Authentication failed: \${message}\`);
        case 429:
          throw new RateLimitError(\`Rate limit exceeded: \${message}\`);
        default:
          throw new IntegrationError(\`API request failed (\${status}): \${message}\`);
      }
    } else if (error.request) {
      throw new IntegrationError(\`Network error: \${error.message}\`);
    } else {
      throw new IntegrationError(\`Request configuration error: \${error.message}\`);
    }
  }

  protected async makeRequest<T = any>(
    method: string,
    path: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    return this.retryManager.execute(async () => {
      const response = await this.client.request({
        method,
        url: path,
        data,
        params
      });
      
      return response.data;
    });
  }

  private generateRequestId(): string {
    return \`req_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      await this.makeRequest('GET', '/health');
      return { status: 'healthy' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
`.trim();

    fs.writeFileSync(path.join(integrationsDir, 'base-client.ts'), baseClientContent);
    console.log('📄 Generated base integration client');
  }

  private async generateErrorTypes(integrationsDir: string): Promise<void> {
    const errorTypesContent = `
export class IntegrationError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'IntegrationError';
    Object.setPrototypeOf(this, IntegrationError.prototype);
  }
}

export class AuthenticationError extends IntegrationError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class RateLimitError extends IntegrationError {
  constructor(message: string, public readonly retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class ValidationError extends IntegrationError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class ConfigurationError extends IntegrationError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}
`.trim();

    fs.writeFileSync(path.join(integrationsDir, 'errors.ts'), errorTypesContent);
    console.log('📄 Generated integration error types');
  }

  private async generateRateLimiter(integrationsDir: string): Promise<void> {
    const rateLimiterContent = `
export class RateLimiter {
  private requests: number[] = [];
  private requestsPerMinute: number;

  constructor(requestsPerMinute: number = 60) {
    this.requestsPerMinute = requestsPerMinute;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old requests
    this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);

    // Check if we can make a request
    if (this.requests.length >= this.requestsPerMinute) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = oldestRequest + 60000 - now;
      
      if (waitTime > 0) {
        await this.delay(waitTime);
        return this.acquire(); // Recursive call after waiting
      }
    }

    // Record this request
    this.requests.push(now);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);
    return Math.max(0, this.requestsPerMinute - recentRequests.length);
  }
}
`.trim();

    fs.writeFileSync(path.join(integrationsDir, 'rate-limiter.ts'), rateLimiterContent);
    console.log('📄 Generated rate limiter');
  }

  private async generateRetryLogic(integrationsDir: string): Promise<void> {
    const retryLogicContent = `
export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class RetryManager {
  private options: RetryOptions;

  constructor(maxRetries: number = 3) {
    this.options = {
      maxRetries,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.options.maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on the last attempt
        if (attempt > this.options.maxRetries) {
          break;
        }
        
        // Don't retry certain types of errors
        if (!this.shouldRetry(error)) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.options.baseDelay * Math.pow(this.options.backoffMultiplier, attempt - 1),
          this.options.maxDelay
        );
        
        console.warn(\`Retry attempt \${attempt}/\${this.options.maxRetries} after \${delay}ms delay. Error: \${lastError.message}\`);
        await this.delay(delay);
      }
    }
    
    throw lastError!;
  }

  private shouldRetry(error: any): boolean {
    // Don't retry authentication errors
    if (error.name === 'AuthenticationError') return false;
    
    // Don't retry validation errors
    if (error.name === 'ValidationError') return false;
    
    // Retry network errors and 5xx server errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    if (error.response?.status >= 500) return true;
    
    // Retry rate limit errors
    if (error.name === 'RateLimitError') return true;
    
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
`.trim();

    fs.writeFileSync(path.join(integrationsDir, 'retry-manager.ts'), retryLogicContent);
    console.log('📄 Generated retry manager');
  }

  private async generateIntegrationClient(integrationsDir: string, integration: IntegrationConfig): Promise<void> {
    const clientContent = this.buildEnhancedIntegrationClient(integration);
    const clientPath = path.join(integrationsDir, `${integration.name}-client.ts`);
    
    fs.writeFileSync(clientPath, clientContent);
    console.log(`📄 Generated ${integration.name} client`);
  }

  private buildEnhancedIntegrationClient(integration: IntegrationConfig): string {
    const className = this.toPascalCase(integration.name);
    const configInterfaceName = `${className}Config`;
    
    return `
import { BaseIntegrationClient, BaseIntegrationConfig } from './base-client';
import { ConfigurationError } from './errors';
import { AxiosRequestConfig } from 'axios';

export interface ${configInterfaceName} extends BaseIntegrationConfig {
  ${this.buildConfigFields(integration)}
}

export class ${className}Client extends BaseIntegrationClient {
  private integrationConfig: ${configInterfaceName};

  constructor(config: ${configInterfaceName}) {
    // Validate configuration
    ${className}Client.validateConfig(config);
    
    super(config, {
      ${this.buildCredentialsMapping(integration)}
    });
    
    this.integrationConfig = config;
  }

  private static validateConfig(config: ${configInterfaceName}): void {
    if (!config.baseUrl) {
      throw new ConfigurationError('baseUrl is required');
    }
    
    ${this.buildConfigValidation(integration)}
  }

  protected addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig {
    ${this.buildAuthenticationLogic(integration)}
    return config;
  }

  ${this.buildApiMethods(integration)}

  // Health check specific to this integration
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string; integration: string }> {
    const baseHealth = await super.healthCheck();
    return {
      ...baseHealth,
      integration: '${integration.name}'
    };
  }
}

// Factory function for easy instantiation
export function create${className}Client(): ${className}Client {
  const envPrefix = '${integration.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}';
  
  const config: ${configInterfaceName} = {
    baseUrl: process.env.\`\${envPrefix}_BASE_URL\` || '${integration.baseUrl || ''}',
    timeout: parseInt(process.env.\`\${envPrefix}_TIMEOUT\` || '30000'),
    ${this.buildEnvironmentConfig(integration)}
  };

  return new ${className}Client(config);
}

// Export singleton instance
export const ${this.toCamelCase(integration.name)}Client = create${className}Client();
`.trim();
  }

  private buildConfigFields(integration: IntegrationConfig): string {
    const fields: string[] = [];
    
    if (integration.credentials) {
      Object.keys(integration.credentials).forEach(key => {
        const fieldName = this.toCamelCase(key);
        fields.push(`${fieldName}?: string;`);
      });
    }
    
    if (integration.rateLimits) {
      fields.push('rateLimitRpm?: number;');
    }
    
    return fields.join('\n  ');
  }

  private buildCredentialsMapping(integration: IntegrationConfig): string {
    if (!integration.credentials) return '';
    
    return Object.keys(integration.credentials).map(key => {
      const envKey = `${integration.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${key.toUpperCase()}`;
      return `${key}: config.${this.toCamelCase(key)} || process.env.${envKey}`;
    }).join(',\n      ');
  }

  private buildConfigValidation(integration: IntegrationConfig): string {
    if (!integration.credentials) return '';
    
    const validations = Object.keys(integration.credentials).map(key => {
      const fieldName = this.toCamelCase(key);
      const envKey = `${integration.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${key.toUpperCase()}`;
      
      return `
    if (!config.${fieldName} && !process.env.${envKey}) {
      throw new ConfigurationError('${key} is required. Set config.${fieldName} or environment variable ${envKey}');
    }`;
    });
    
    return validations.join('\n');
  }

  private buildAuthenticationLogic(integration: IntegrationConfig): string {
    if (!integration.credentials) {
      return 'return config;';
    }
    
    const credentialKeys = Object.keys(integration.credentials);
    
    // Common authentication patterns
    if (credentialKeys.includes('api_key')) {
      return `
    const apiKey = this.credentials.api_key;
    if (apiKey) {
      config.headers = { ...config.headers, 'X-API-Key': apiKey };
    }`;
    }
    
    if (credentialKeys.includes('access_token')) {
      return `
    const accessToken = this.credentials.access_token;
    if (accessToken) {
      config.headers = { ...config.headers, 'Authorization': \`Bearer \${accessToken}\` };
    }`;
    }
    
    if (credentialKeys.includes('client_id') && credentialKeys.includes('client_secret')) {
      return `
    const clientId = this.credentials.client_id;
    const clientSecret = this.credentials.client_secret;
    if (clientId && clientSecret) {
      const basicAuth = Buffer.from(\`\${clientId}:\${clientSecret}\`).toString('base64');
      config.headers = { ...config.headers, 'Authorization': \`Basic \${basicAuth}\` };
    }`;
    }
    
    // Generic credential injection
    return `
    // Add credentials as headers
    ${credentialKeys.map(key => `
    if (this.credentials.${key}) {
      config.headers = { ...config.headers, 'X-${this.toHeaderCase(key)}': this.credentials.${key} };
    }`).join('\n')}`;
  }

  private buildApiMethods(integration: IntegrationConfig): string {
    // Generate common CRUD methods
    const methods = [
      this.buildGetMethod(),
      this.buildListMethod(),
      this.buildCreateMethod(),
      this.buildUpdateMethod(),
      this.buildDeleteMethod()
    ];
    
    return methods.join('\n\n');
  }

  private buildGetMethod(): string {
    return `
  async get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
    return this.makeRequest<T>('GET', path, undefined, params);
  }`;
  }

  private buildListMethod(): string {
    return `
  async list<T = any[]>(path: string, params?: Record<string, any>): Promise<T> {
    return this.makeRequest<T>('GET', path, undefined, params);
  }`;
  }

  private buildCreateMethod(): string {
    return `
  async create<T = any>(path: string, data: any): Promise<T> {
    return this.makeRequest<T>('POST', path, data);
  }`;
  }

  private buildUpdateMethod(): string {
    return `
  async update<T = any>(path: string, data: any): Promise<T> {
    return this.makeRequest<T>('PUT', path, data);
  }`;
  }

  private buildDeleteMethod(): string {
    return `
  async delete<T = any>(path: string): Promise<T> {
    return this.makeRequest<T>('DELETE', path);
  }`;
  }

  private buildEnvironmentConfig(integration: IntegrationConfig): string {
    const configs: string[] = [];
    
    if (integration.rateLimits) {
      const envKey = `${integration.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_RATE_LIMIT_RPM`;
      configs.push(`rateLimitRpm: parseInt(process.env.${envKey} || '${integration.rateLimits.requestsPerMinute || 60}')`);
    }
    
    if (integration.credentials) {
      Object.keys(integration.credentials).forEach(key => {
        const fieldName = this.toCamelCase(key);
        const envKey = `${integration.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${key.toUpperCase()}`;
        configs.push(`${fieldName}: process.env.${envKey}`);
      });
    }
    
    return configs.join(',\n    ');
  }

  private async generateIntegrationService(integrationsDir: string): Promise<void> {
    const serviceContent = this.buildIntegrationService();
    const servicePath = path.join(integrationsDir, 'integration-service.ts');
    
    fs.writeFileSync(servicePath, serviceContent);
    console.log('📄 Generated integration service');
  }

  private buildIntegrationService(): string {
    const imports = this.config.services.integrations.map(integration => {
      const className = this.toPascalCase(integration.name);
      return `import { ${className}Client, ${this.toCamelCase(integration.name)}Client } from './${integration.name}-client';`;
    }).join('\n');

    const clientProperties = this.config.services.integrations.map(integration => {
      const propertyName = this.toCamelCase(integration.name);
      const className = this.toPascalCase(integration.name);
      return `public readonly ${propertyName}: ${className}Client;`;
    }).join('\n  ');

    const clientInitialization = this.config.services.integrations.map(integration => {
      const propertyName = this.toCamelCase(integration.name);
      const instanceName = `${propertyName}Client`;
      return `this.${propertyName} = ${instanceName};`;
    }).join('\n    ');

    const healthChecks = this.config.services.integrations.map(integration => {
      const propertyName = this.toCamelCase(integration.name);
      return `const ${propertyName}Health = await this.${propertyName}.healthCheck();`;
    }).join('\n      ');

    const healthResults = this.config.services.integrations.map(integration => {
      const propertyName = this.toCamelCase(integration.name);
      return `'${integration.name}': ${propertyName}Health`;
    }).join(',\n        ');

    return `
${imports}

export interface IntegrationHealthStatus {
  [key: string]: {
    status: 'healthy' | 'unhealthy';
    details?: string;
    integration: string;
  };
}

export class IntegrationService {
  ${clientProperties}

  constructor() {
    ${clientInitialization}
  }

  async healthCheck(): Promise<IntegrationHealthStatus> {
    try {
      ${healthChecks}

      return {
        ${healthResults}
      };
    } catch (error) {
      console.error('Integration health check failed:', error);
      throw error;
    }
  }

  async testAllConnections(): Promise<{ success: boolean; results: IntegrationHealthStatus }> {
    try {
      const results = await this.healthCheck();
      const allHealthy = Object.values(results).every(result => result.status === 'healthy');
      
      return {
        success: allHealthy,
        results
      };
    } catch (error) {
      return {
        success: false,
        results: {}
      };
    }
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();
`.trim();
  }

  private async generateIntegrationRegistry(integrationsDir: string): Promise<void> {
    const registryContent = this.buildIntegrationRegistry();
    const registryPath = path.join(integrationsDir, 'index.ts');
    
    fs.writeFileSync(registryPath, registryContent);
    console.log('📄 Generated integration registry');
  }

  private buildIntegrationRegistry(): string {
    const exports = this.config.services.integrations.map(integration => {
      const className = this.toPascalCase(integration.name);
      const instanceName = this.toCamelCase(integration.name) + 'Client';
      const factoryName = `create${className}Client`;
      
      return `export { ${className}Client, ${instanceName}, ${factoryName} } from './${integration.name}-client';`;
    }).join('\n');

    return `
// Base infrastructure
export { BaseIntegrationClient } from './base-client';
export { IntegrationError, AuthenticationError, RateLimitError, ValidationError, ConfigurationError } from './errors';
export { RateLimiter } from './rate-limiter';
export { RetryManager } from './retry-manager';

// Integration clients
${exports}

// Integration service
export { IntegrationService, integrationService, IntegrationHealthStatus } from './integration-service';

// Convenience exports
export const integrations = {
${this.config.services.integrations.map(integration => {
  const propertyName = this.toCamelCase(integration.name);
  const instanceName = `${propertyName}Client`;
  return `  ${propertyName}: ${instanceName}`;
}).join(',\n')}
};
`.trim();
  }

  // Utility methods
  private toPascalCase(str: string): string {
    return str.replace(/(^|[-_])(.)/g, (_, __, char) => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toHeaderCase(str: string): string {
    return str.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('-');
  }
}