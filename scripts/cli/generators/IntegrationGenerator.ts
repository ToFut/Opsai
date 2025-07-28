import * as fs from 'fs';
import * as path from 'path';
import { AppConfig, Integration } from './ConfigParser';

export class IntegrationGenerator {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async generateIntegrations(outputDir: string): Promise<void> {
    if (!this.config.integrations || this.config.integrations.length === 0) {
      console.log('ℹ️  No integrations to generate');
      return;
    }

    const integrationsDir = path.join(outputDir, 'src', 'integrations');
    fs.mkdirSync(integrationsDir, { recursive: true });

    // Generate integration clients
    for (const integration of this.config.integrations) {
      await this.generateIntegrationClient(integrationsDir, integration);
    }

    // Generate integration index
    await this.generateIntegrationIndex(integrationsDir);

    console.log('✅ Integration clients generated');
  }

  private async generateIntegrationClient(integrationsDir: string, integration: Integration): Promise<void> {
    const clientContent = this.buildIntegrationClient(integration);
    const clientPath = path.join(integrationsDir, `${integration.name}.ts`);
    
    fs.writeFileSync(clientPath, clientContent);
    console.log(`📄 Generated integration client: ${integration.name}`);
  }

  private buildIntegrationClient(integration: Integration): string {
    const className = this.toPascalCase(integration.name);
    const clientName = `${className}Client`;

    // Build authentication logic based on config
    const authLogic = this.buildAuthenticationLogic(integration);
    
    // Build endpoint methods
    const endpointMethods = integration.endpoints?.map(endpoint => 
      this.buildEndpointMethod(endpoint, integration)
    ).join('\n\n') || '';

    return `
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ${className}Config {
  baseUrl: string;
  timeout?: number;
  ${this.buildConfigInterface(integration)}
}

export class ${clientName} {
  private client: AxiosInstance;
  private config: ${className}Config;

  constructor(config: ${className}Config) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => this.addAuthentication(config),
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  ${authLogic}

  ${endpointMethods}

  private addAuthentication(config: AxiosRequestConfig): AxiosRequestConfig {
    ${this.buildAuthenticationInjection(integration)}
    return config;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    ${this.buildAuthHeaders(integration)}
    return headers;
  }

  private handleError(error: any) {
    console.error(\`${className} API Error:\`, error.response?.data || error.message);
    throw new Error(\`${className} API request failed: \${error.response?.data?.message || error.message}\`);
  }
}

// Export singleton instance
export const ${this.toCamelCase(integration.name)}Client = new ${clientName}({
  baseUrl: process.env.${integration.name.toUpperCase().replace('-', '_')}_BASE_URL || '${integration.config?.baseUrl || ''}',
  ${this.buildClientConfig(integration)}
});
`.trim();
  }

  private buildConfigInterface(integration: Integration): string {
    const authConfig = integration.config?.authentication;
    if (!authConfig) return '';

    switch (authConfig.type) {
      case 'oauth2':
        return `
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;`;
      case 'api-key':
        return `
  apiKey?: string;`;
      case 'bearer':
        return `
  bearerToken?: string;`;
      default:
        return '';
    }
  }

  private buildAuthenticationLogic(integration: Integration): string {
    const authConfig = integration.config?.authentication;
    if (!authConfig) return '';

    switch (authConfig.type) {
      case 'oauth2':
        return `
  async refreshToken(): Promise<string> {
    try {
      const response = await axios.post(\`\${this.config.baseUrl}/oauth2/token\`, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId || process.env.${integration.name.toUpperCase().replace('-', '_')}_CLIENT_ID,
        client_secret: this.config.clientSecret || process.env.${integration.name.toUpperCase().replace('-', '_')}_CLIENT_SECRET,
        scope: 'open-api'
      });
      
      const accessToken = response.data.access_token;
      this.config.accessToken = accessToken;
      
      // Update client headers
      this.client.defaults.headers.common['Authorization'] = \`Bearer \${accessToken}\`;
      
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh OAuth2 token');
    }
  }

  async ensureValidToken(): Promise<void> {
    if (!this.config.accessToken) {
      await this.refreshToken();
    }
  }`;
      
      case 'api-key':
        return `
  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }`;
      
      default:
        return '';
    }
  }

  private buildEndpointMethod(endpoint: any, integration: Integration): string {
    const methodName = this.toCamelCase(endpoint.name);
    const httpMethod = endpoint.method?.toLowerCase() || 'get';
    
    const params = httpMethod === 'get' ? 'params?: Record<string, any>' : 'data?: any, params?: Record<string, any>';
    
    return `
  async ${methodName}(${params}): Promise<any> {
    ${integration.config?.authentication?.type === 'oauth2' ? 'await this.ensureValidToken();' : ''}
    
    try {
      const response = await this.client.${httpMethod}('${endpoint.path}'${httpMethod !== 'get' ? ', data' : ''}${params.includes('params') ? ', { params }' : ''});
      return response.data;
    } catch (error) {
      console.error(\`${methodName} failed:\`, error);
      throw error;
    }
  }`;
  }

  private buildAuthenticationInjection(integration: Integration): string {
    const authConfig = integration.config?.authentication;
    if (!authConfig) return 'return config;';

    switch (authConfig.type) {
      case 'oauth2':
        return `
    if (this.config.accessToken) {
      config.headers = { ...config.headers, Authorization: \`Bearer \${this.config.accessToken}\` };
    }`;
      
      case 'api-key':
        return `
    const apiKey = this.config.apiKey || process.env.${integration.name.toUpperCase().replace('-', '_')}_API_KEY;
    if (apiKey) {
      config.headers = { ...config.headers, 'X-API-Key': apiKey };
    }`;
      
      case 'bearer':
        return `
    const token = this.config.bearerToken || process.env.${integration.name.toUpperCase().replace('-', '_')}_TOKEN;
    if (token) {
      config.headers = { ...config.headers, Authorization: \`Bearer \${token}\` };
    }`;
      
      default:
        return 'return config;';
    }
  }

  private buildAuthHeaders(integration: Integration): string {
    const authConfig = integration.config?.authentication;
    if (!authConfig) return '';

    switch (authConfig.type) {
      case 'api-key':
        return `
    const apiKey = this.config.apiKey || process.env.${integration.name.toUpperCase().replace('-', '_')}_API_KEY;
    if (apiKey) headers['X-API-Key'] = apiKey;`;
      
      default:
        return '';
    }
  }

  private buildClientConfig(integration: Integration): string {
    const authConfig = integration.config?.authentication;
    if (!authConfig) return '';

    const envPrefix = integration.name.toUpperCase().replace('-', '_');
    
    switch (authConfig.type) {
      case 'oauth2':
        return `
  clientId: process.env.${envPrefix}_CLIENT_ID,
  clientSecret: process.env.${envPrefix}_CLIENT_SECRET,`;
      
      case 'api-key':
        return `
  apiKey: process.env.${envPrefix}_API_KEY,`;
      
      case 'bearer':
        return `
  bearerToken: process.env.${envPrefix}_TOKEN,`;
      
      default:
        return '';
    }
  }

  private async generateIntegrationIndex(integrationsDir: string): Promise<void> {
    const exports = this.config.integrations?.map(integration => {
      const clientName = `${this.toPascalCase(integration.name)}Client`;
      const instanceName = this.toCamelCase(integration.name) + 'Client';
      return `export { ${clientName}, ${instanceName} } from './${integration.name}';`;
    }).join('\n') || '';

    const indexContent = `
// Auto-generated integration clients
${exports}

// Re-export all clients as a single object
export const integrations = {
${this.config.integrations?.map(integration => 
  `  ${this.toCamelCase(integration.name)}: ${this.toCamelCase(integration.name)}Client`
).join(',\n') || ''}
};
`.trim();

    fs.writeFileSync(path.join(integrationsDir, 'index.ts'), indexContent);
  }

  private toPascalCase(str: string): string {
    return str.replace(/(^|[-_])(.)/g, (_, __, char) => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}