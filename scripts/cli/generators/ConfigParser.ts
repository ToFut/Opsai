import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

// Completely flexible configuration - no strict schema validation
// The CORE system should work with ANY valid YAML structure

export interface AppConfig {
  app: {
    name: string;
    displayName: string;
    description: string;
    version?: string;
    author?: string;
    license?: string;
  };
  database: {
    type: string;
    entities: Entity[];
  };
  integrations?: Integration[];
  workflows?: Workflow[];
  ui?: any; // Completely flexible UI structure
  deployment?: any; // Flexible deployment config
  features?: any; // Flexible features config
  api?: any; // Allow API definitions
  [key: string]: any; // Allow any additional properties
}

export interface Entity {
  name: string;
  displayName: string;
  description?: string;
  fields: Record<string, any>; // Completely flexible field definitions
  [key: string]: any; // Allow any additional properties
}

export interface Integration {
  name: string;
  type: string;
  config?: Record<string, any>;
  endpoints?: any[];
  [key: string]: any; // Allow any additional properties
}

export interface Workflow {
  name: string;
  displayName?: string;
  description?: string;
  trigger?: any;
  steps?: any[];
  [key: string]: any; // Allow any additional properties
}

export interface UIPage {
  name: string;
  path: string;
  title: string;
  [key: string]: any; // Allow any additional properties
}

export class ConfigParser {
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

      // Basic validation - only check essential required fields
      if (!rawConfig.app || !rawConfig.app.name) {
        throw new Error('Configuration must have app.name defined');
      }
      
      if (!rawConfig.database || !rawConfig.database.entities) {
        throw new Error('Configuration must have database.entities defined');
      }

      // Set defaults for missing fields to make it truly flexible
      const config: AppConfig = {
        app: {
          name: rawConfig.app.name,
          displayName: rawConfig.app.displayName || rawConfig.app.name,
          description: rawConfig.app.description || `${rawConfig.app.name} application`,
          version: rawConfig.app.version || '1.0.0',
          author: rawConfig.app.author || 'CORE Platform',
          license: rawConfig.app.license || 'MIT'
        },
        database: {
          type: rawConfig.database.type || 'postgresql',
          entities: rawConfig.database.entities || []
        },
        integrations: rawConfig.integrations || [],
        workflows: rawConfig.workflows || [],
        ui: rawConfig.ui || { theme: 'default', pages: [] },
        deployment: rawConfig.deployment || {},
        features: rawConfig.features || { authentication: true, multiTenancy: true },
        ...rawConfig // Include ALL other properties from the YAML
      };

      console.log(`✅ Configuration parsed successfully: ${config.app.name}`);
      console.log(`📊 Entities: ${config.database.entities.length}`);
      console.log(`🔌 Integrations: ${config.integrations?.length || 0}`);
      console.log(`⚡ Workflows: ${config.workflows?.length || 0}`);
      console.log(`🎨 UI Pages: ${config.ui?.pages?.length || 0}`);

      return config;
    } catch (error) {
      console.error('❌ Configuration parsing failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Very basic validation - just check that required core fields exist
    if (!config.app?.name) {
      errors.push('app.name is required');
    }

    if (!config.database?.entities || !Array.isArray(config.database.entities)) {
      errors.push('database.entities must be an array');
    }

    // Optional: Basic entity name validation
    if (config.database?.entities) {
      config.database.entities.forEach((entity, index) => {
        if (!entity.name) {
          errors.push(`Entity at index ${index} must have a name`);
        }
        if (!entity.fields) {
          errors.push(`Entity '${entity.name}' must have fields defined`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  generateSampleConfig(): AppConfig {
    return {
      app: {
        name: 'my-saas-app',
        displayName: 'My SaaS Application',
        description: 'A sample SaaS application generated by CORE Platform',
        version: '1.0.0',
        author: 'CORE Platform',
        license: 'MIT'
      },
      database: {
        type: 'postgresql',
        entities: [
          {
            name: 'user',
            displayName: 'Users',
            description: 'Application users',
            fields: {
              id: {
                type: 'string',
                required: true,
                unique: true,
                ui: { widget: 'input', label: 'ID' }
              },
              email: {
                type: 'string',
                required: true,
                unique: true,
                validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
                ui: { widget: 'input', label: 'Email', placeholder: 'user@example.com' }
              },
              name: {
                type: 'string',
                required: true,
                ui: { widget: 'input', label: 'Full Name' }
              },
              role: {
                type: 'string',
                required: true,
                default: 'user',
                validation: { enum: ['admin', 'user', 'viewer'] },
                ui: { 
                  widget: 'select', 
                  label: 'Role',
                  options: [
                    { label: 'Administrator', value: 'admin' },
                    { label: 'User', value: 'user' },
                    { label: 'Viewer', value: 'viewer' }
                  ]
                }
              },
              createdAt: {
                type: 'date',
                required: true,
                ui: { widget: 'date', label: 'Created At' }
              }
            },
            permissions: {
              create: ['admin'],
              read: ['admin', 'user'],
              update: ['admin', 'user'],
              delete: ['admin']
            }
          }
        ]
      },
      integrations: [
        {
          name: 'email-service',
          type: 'rest',
          config: {
            baseUrl: 'https://api.emailservice.com',
            timeout: 30000
          },
          endpoints: [
            {
              name: 'send-email',
              method: 'POST',
              path: '/v1/send',
              authentication: {
                type: 'api-key',
                config: { header: 'X-API-Key' }
              }
            }
          ]
        }
      ],
      workflows: [
        {
          name: 'user-onboarding',
          displayName: 'User Onboarding',
          description: 'Onboard new users with welcome email',
          trigger: {
            type: 'event',
            config: { event: 'user.created' }
          },
          steps: [
            {
              name: 'send-welcome-email',
              type: 'api-call',
              config: {
                integration: 'email-service',
                endpoint: 'send-email',
                template: 'welcome-email'
              },
              retry: { attempts: 3, delay: 5000 }
            }
          ]
        }
      ],
      ui: {
        theme: 'default',
        pages: [
          {
            name: 'users',
            path: '/users',
            title: 'Users',
            description: 'Manage application users',
            layout: 'list',
            components: [
              {
                type: 'table',
                config: {
                  entity: 'user',
                  columns: ['name', 'email', 'role', 'createdAt'],
                  actions: ['create', 'edit', 'delete']
                }
              }
            ],
            permissions: ['admin']
          }
        ]
      },
      features: {
        authentication: true,
        multiTenancy: true,
        fileUpload: false,
        notifications: true,
        analytics: false,
        cron: false
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