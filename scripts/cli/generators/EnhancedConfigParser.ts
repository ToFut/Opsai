import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AppConfig, ServiceConfig, DEFAULT_SERVICE_CONFIGS, ServiceConfigValidator } from '../../../packages/shared/src/config/service-config';

/**
 * Enhanced Configuration Parser
 * Supports flexible YAML formats and automatic conversion
 */
export class EnhancedConfigParser {
  
  async parseConfig(configPath: string): Promise<AppConfig> {
    try {
      if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not found: ${configPath}`);
      }

      const fileContent = fs.readFileSync(configPath, 'utf8');
      const extension = path.extname(configPath).toLowerCase();

      let rawConfig: any;

      switch (extension) {
        case '.yaml':
        case '.yml':
          rawConfig = yaml.load(fileContent);
          break;
        case '.json':
          rawConfig = JSON.parse(fileContent);
          break;
        default:
          throw new Error(`Unsupported configuration file format: ${extension}`);
      }

      // Transform and normalize the configuration
      const normalizedConfig = this.normalizeConfiguration(rawConfig);
      
      // Validate the configuration
      const validation = this.validateConfiguration(normalizedConfig);
      if (!validation.valid) {
        throw new Error(`Configuration validation failed:\n${validation.errors.join('\n')}`);
      }

      console.log(`✅ Configuration parsed successfully: ${normalizedConfig.app.name}`);
      console.log(`📊 Entities: ${normalizedConfig.database.entities.length}`);
      console.log(`🔌 Integrations: ${normalizedConfig.services.integrations.length}`);
      console.log(`⚡ Workflows: ${normalizedConfig.workflows?.length || 0}`);
      console.log(`🎨 UI Pages: ${normalizedConfig.ui?.pages?.length || 0}`);

      return normalizedConfig;
    } catch (error) {
      console.error('❌ Configuration parsing failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private normalizeConfiguration(rawConfig: any): AppConfig {
    // Normalize app configuration
    const app = {
      name: rawConfig.app?.name || rawConfig.vertical?.name || 'generated-app',
      displayName: rawConfig.app?.displayName || rawConfig.app?.name || 'Generated App',
      description: rawConfig.app?.description || rawConfig.vertical?.description || 'Generated application',
      version: rawConfig.app?.version || rawConfig.vertical?.version || '1.0.0',
      author: rawConfig.app?.author || 'CORE Platform',
      license: rawConfig.app?.license || 'MIT'
    };

    // Normalize service configuration
    const services = this.normalizeServiceConfiguration(rawConfig);

    // Normalize database configuration
    const database = this.normalizeDatabaseConfiguration(rawConfig);

    // Normalize integrations (from multiple possible locations)
    const integrations = this.normalizeIntegrations(rawConfig);
    services.integrations = integrations;

    // Normalize workflows
    const workflows = this.normalizeWorkflows(rawConfig);

    // Normalize UI configuration
    const ui = this.normalizeUIConfiguration(rawConfig);

    // Normalize alerts
    const alerts = this.normalizeAlerts(rawConfig);

    // Normalize deployment
    const deployment = this.normalizeDeployment(rawConfig);

    // Normalize features
    const features = this.normalizeFeatures(rawConfig);

    return {
      app,
      services,
      database,
      workflows,
      ui,
      alerts,
      deployment,
      features
    };
  }

  private normalizeServiceConfiguration(rawConfig: any): ServiceConfig {
    // Determine service mode
    const mode = rawConfig.services?.mode || rawConfig.infrastructure?.mode || 'shared';
    
    // Get default configuration for the mode
    const defaultConfig = DEFAULT_SERVICE_CONFIGS[mode as keyof typeof DEFAULT_SERVICE_CONFIGS];
    
    // Merge with user configuration
    const serviceConfig: ServiceConfig = {
      mode: mode as any,
      tenantId: rawConfig.app?.name || 'default-tenant',
      environment: rawConfig.services?.environment || 'development',
      
      database: {
        provider: rawConfig.infrastructure?.database?.provider || defaultConfig.database?.provider || 'core-managed',
        url: rawConfig.infrastructure?.database?.url,
        ssl: rawConfig.infrastructure?.database?.ssl,
        pool: rawConfig.infrastructure?.database?.pool
      },
      
      auth: {
        provider: rawConfig.infrastructure?.auth?.provider || defaultConfig.auth?.provider || 'core-supabase',
        supabaseUrl: rawConfig.infrastructure?.auth?.supabase_url,
        supabaseAnonKey: rawConfig.infrastructure?.auth?.supabase_anon_key,
        supabaseServiceKey: rawConfig.infrastructure?.auth?.supabase_service_key,
        jwtSecret: rawConfig.infrastructure?.auth?.jwt_secret,
        customConfig: rawConfig.infrastructure?.auth?.custom_config
      },
      
      storage: {
        provider: rawConfig.infrastructure?.storage?.provider || defaultConfig.storage?.provider || 'core-supabase',
        bucket: rawConfig.infrastructure?.storage?.bucket,
        region: rawConfig.infrastructure?.storage?.region,
        credentials: rawConfig.infrastructure?.storage?.credentials
      },
      
      integrations: [], // Will be populated later
      
      redis: rawConfig.infrastructure?.redis,
      temporal: rawConfig.infrastructure?.temporal,
      monitoring: rawConfig.infrastructure?.monitoring
    };

    return serviceConfig;
  }

  private normalizeDatabaseConfiguration(rawConfig: any): AppConfig['database'] {
    const dbConfig = rawConfig.database || {};
    
    // Handle both 'models' and 'entities' keys for backward compatibility
    let entities = dbConfig.entities || dbConfig.models || [];
    
    // Normalize entity structure
    entities = entities.map((entity: any) => this.normalizeEntity(entity));

    return {
      type: dbConfig.type || 'postgresql',
      entities
    };
  }

  private normalizeEntity(entity: any): any {
    const normalized = {
      name: entity.name,
      displayName: entity.displayName || entity.display_name || this.toDisplayName(entity.name),
      description: entity.description,
      fields: {},
      relationships: entity.relationships || entity.relations
    };

    // Handle both array and object field formats
    if (Array.isArray(entity.fields)) {
      // Convert array format to object format
      entity.fields.forEach((field: any) => {
        if (field.name) {
          const fieldName = field.name;
          const fieldConfig = { ...field };
          delete fieldConfig.name;
          normalized.fields[fieldName] = fieldConfig;
        }
      });
    } else if (typeof entity.fields === 'object') {
      // Already in object format
      normalized.fields = entity.fields;
    }

    return normalized;
  }

  private normalizeIntegrations(rawConfig: any): any[] {
    let integrations: any[] = [];

    // Check multiple possible locations for integrations
    if (rawConfig.integrations) {
      integrations = integrations.concat(rawConfig.integrations);
    }
    
    if (rawConfig.apis?.integrations) {
      integrations = integrations.concat(rawConfig.apis.integrations);
    }
    
    if (rawConfig.services?.integrations) {
      integrations = integrations.concat(rawConfig.services.integrations);
    }

    // Normalize integration structure
    return integrations.map(integration => ({
      name: integration.name,
      mode: integration.mode || 'user-api-key',
      baseUrl: integration.base_url || integration.baseUrl,
      credentials: this.normalizeIntegrationCredentials(integration),
      rateLimits: integration.rate_limits || integration.rateLimits
    }));
  }

  private normalizeIntegrationCredentials(integration: any): Record<string, string> | undefined {
    const credentials: Record<string, string> = {};
    
    // Handle different credential formats
    if (integration.authentication) {
      const auth = integration.authentication;
      
      // OAuth2 credentials
      if (auth.client_id) credentials.client_id = auth.client_id;
      if (auth.client_secret) credentials.client_secret = auth.client_secret;
      
      // API Key credentials
      if (auth.api_key) credentials.api_key = auth.api_key;
      if (auth.access_token) credentials.access_token = auth.access_token;
      
      // Handle secret_name pattern - used for environment variable references
      if (auth.secret_name) {
        credentials.api_key = auth.secret_name; // Use the actual secret name, don't transform
      }
      
      // Handle different API key patterns
      if (auth.type === 'api_key' && !credentials.api_key && !auth.secret_name) {
        // If it's an API key type but no key is provided, create a placeholder
        credentials.api_key = `\${${integration.name.toUpperCase()}_API_KEY}`;
      }
    }
    
    // Handle credentials object
    if (integration.credentials) {
      Object.assign(credentials, integration.credentials);
    }
    
    // Handle direct credential fields (fallback)
    if (integration.client_id) credentials.client_id = integration.client_id;
    if (integration.client_secret) credentials.client_secret = integration.client_secret;
    if (integration.api_key) credentials.api_key = integration.api_key;
    
    console.log(`🔍 Extracted credentials for ${integration.name}:`, Object.keys(credentials));
    
    return Object.keys(credentials).length > 0 ? credentials : undefined;
  }

  private normalizeWorkflows(rawConfig: any): any[] {
    if (!rawConfig.workflows) return [];
    
    return rawConfig.workflows.map((workflow: any) => ({
      name: workflow.name,
      description: workflow.description,
      trigger: workflow.trigger,
      steps: workflow.steps || []
    }));
  }

  private normalizeUIConfiguration(rawConfig: any): any {
    if (!rawConfig.ui) return { theme: {}, pages: [] };
    
    return {
      theme: rawConfig.ui.theme || {},
      pages: rawConfig.ui.pages || []
    };
  }

  private normalizeAlerts(rawConfig: any): any {
    if (!rawConfig.alerts) return { rules: [] };
    
    return {
      rules: rawConfig.alerts.rules || []
    };
  }

  private normalizeDeployment(rawConfig: any): any {
    if (!rawConfig.deployment) return {};
    
    return {
      platform: rawConfig.deployment.platform || 'docker',
      environment: rawConfig.deployment.environment || 'production',
      resources: rawConfig.deployment.resources || {},
      environmentVariables: rawConfig.deployment.environment_variables || rawConfig.deployment.environmentVariables || []
    };
  }

  private normalizeFeatures(rawConfig: any): any {
    const defaultFeatures = {
      authentication: true,
      multiTenancy: true,
      fileUpload: false,
      notifications: true,
      analytics: false,
      workflows: true,
      alerts: true,
      integrations: true
    };
    
    return {
      ...defaultFeatures,
      ...(rawConfig.features || {})
    };
  }

  private validateConfiguration(config: AppConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate app configuration
    if (!config.app.name) {
      errors.push('app.name is required');
    }

    // Validate service configuration
    const serviceValidation = ServiceConfigValidator.validate(config.services);
    if (!serviceValidation.valid) {
      errors.push(...serviceValidation.errors);
    }

    // Validate database configuration
    if (!Array.isArray(config.database.entities)) {
      errors.push('database.entities must be an array');
    } else {
      config.database.entities.forEach((entity, index) => {
        if (!entity.name) {
          errors.push(`Entity at index ${index} must have a name`);
        }
        if (!entity.fields || typeof entity.fields !== 'object') {
          errors.push(`Entity '${entity.name}' must have fields defined as an object`);
        }
      });
    }

    // Validate integrations
    config.services.integrations.forEach((integration, index) => {
      if (!integration.name) {
        errors.push(`Integration at index ${index} must have a name`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private toDisplayName(name: string): string {
    return name
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate a sample configuration for reference
   */
  generateSampleConfig(): AppConfig {
    return {
      app: {
        name: 'my-vertical-app',
        displayName: 'My Vertical Application',
        description: 'A sample vertical application generated by CORE Platform',
        version: '1.0.0',
        author: 'CORE Platform',
        license: 'MIT'
      },
      
      services: {
        mode: 'shared', // or 'byoi' or 'hybrid'
        tenantId: 'my-vertical-app',
        environment: 'development',
        
        database: {
          provider: 'core-managed' // Uses CORE's managed PostgreSQL
          // For BYOI: provider: 'user-postgresql', url: 'postgresql://...'
        },
        
        auth: {
          provider: 'core-supabase' // Uses CORE's managed Supabase
          // For BYOI: provider: 'user-supabase', supabaseUrl: '...', etc.
        },
        
        storage: {
          provider: 'core-supabase' // Uses CORE's managed storage
        },
        
        integrations: [
          {
            name: 'stripe',
            mode: 'user-api-key', // User must provide API keys
            credentials: {
              api_key: '${STRIPE_API_KEY}', // From user's environment
              webhook_secret: '${STRIPE_WEBHOOK_SECRET}'
            }
          }
        ]
      },
      
      database: {
        type: 'postgresql',
        entities: [
          {
            name: 'User',
            displayName: 'Users',
            description: 'Application users',
            fields: {
              id: {
                type: 'string',
                primary: true,
                unique: true
              },
              email: {
                type: 'string',
                required: true,
                unique: true,
                validation: {
                  pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
                }
              },
              name: {
                type: 'string',
                required: true
              },
              role: {
                type: 'string',
                default: 'user',
                validation: {
                  enum: ['admin', 'user', 'viewer']
                }
              }
            }
          }
        ]
      },
      
      workflows: [
        {
          name: 'user-onboarding',
          description: 'Onboard new users with welcome email',
          trigger: {
            type: 'event',
            event: 'user.created'
          },
          steps: [
            {
              name: 'send-welcome-email',
              activity: 'email_send',
              config: {
                template: 'welcome',
                to: '{{user.email}}'
              }
            }
          ]
        }
      ],
      
      ui: {
        theme: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b'
        },
        pages: [
          {
            name: 'dashboard',
            path: '/dashboard',
            title: 'Dashboard',
            components: [
              {
                type: 'stats_cards',
                dataSource: 'users'
              }
            ]
          }
        ]
      },
      
      alerts: {
        rules: [
          {
            name: 'new_user_registration',
            description: 'Alert when new user registers',
            conditions: [
              {
                field: 'event_type',
                operator: 'equals',
                value: 'user.created'
              }
            ],
            actions: [
              {
                type: 'email',
                to: 'admin@example.com',
                template: 'new_user_alert'
              }
            ]
          }
        ]
      },
      
      deployment: {
        platform: 'docker',
        environment: 'production',
        resources: {
          api: {
            cpu: '0.5',
            memory: '1Gi'
          }
        }
      },
      
      features: {
        authentication: true,
        multiTenancy: true,
        fileUpload: true,
        notifications: true,
        analytics: true,
        workflows: true,
        alerts: true,
        integrations: true
      }
    };
  }

  async saveConfig(config: AppConfig, outputPath: string): Promise<void> {
    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, yamlContent, 'utf8');
    console.log(`✅ Configuration saved to: ${outputPath}`);
  }
}