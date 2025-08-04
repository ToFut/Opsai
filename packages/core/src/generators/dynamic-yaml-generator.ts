import { DiscoveredDataSource, DiscoveredSchema } from '@opsai/integration';
import { SchemaAnalysisResult, PrismaSchemaModel } from '@opsai/database/src/analyzers/schema-analyzer';
import { BusinessFlowAnalysis, BusinessFlow, APIEndpoint } from '../engines/business-flow-engine';
import * as yaml from 'js-yaml';

export interface DynamicYAMLConfig {
  tenantId: string;
  projectName: string;
  discoveredSources: DiscoveredDataSource[];
  schemaAnalysis: SchemaAnalysisResult;
  businessFlows: BusinessFlowAnalysis;
  customizations?: {
    theme?: ThemeConfig;
    features?: FeatureConfig;
    integrations?: IntegrationConfig;
    deployment?: DeploymentConfig;
  };
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  spacing: string;
}

export interface FeatureConfig {
  authentication: boolean;
  notifications: boolean;
  fileUploads: boolean;
  reporting: boolean;
  workflows: boolean;
  integrations: boolean;
}

export interface IntegrationConfig {
  enabled: string[];
  webhooks: WebhookConfig[];
  apiKeys: ApiKeyConfig[];
}

export interface WebhookConfig {
  name: string;
  url: string;
  events: string[];
  secret?: string;
}

export interface ApiKeyConfig {
  service: string;
  key: string;
  scopes: string[];
}

export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  domain?: string;
  ssl: boolean;
  scaling: {
    minInstances: number;
    maxInstances: number;
    targetCPU: number;
  };
}

export interface GeneratedYAMLStructure {
  vertical: VerticalConfig;
  database: DatabaseConfig;
  apis: APIConfig;
  workflows: WorkflowConfig;
  ui: UIConfig;
  integrations: IntegrationsConfig;
  alerts: AlertsConfig;
  deployment: DeploymentYAMLConfig;
  auth: AuthConfig;
}

export interface VerticalConfig {
  name: string;
  description: string;
  version: string;
  domain: string;
  businessEntities: string[];
  coreFeatures: string[];
}

export interface DatabaseConfig {
  models: ModelConfig[];
  relationships: RelationshipConfig[];
  indexes: IndexConfig[];
  migrations: MigrationConfig[];
}

export interface ModelConfig {
  name: string;
  tableName: string;
  description: string;
  fields: FieldConfig[];
  businessEntity: string;
  accessPatterns: string[];
}

export interface FieldConfig {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  indexed?: boolean;
  validation?: ValidationConfig[];
  businessMeaning: string;
  displayName: string;
}

export interface ValidationConfig {
  type: string;
  rule: string;
  message: string;
}

export interface RelationshipConfig {
  from: string;
  to: string;
  type: string;
  foreignKey: string;
  onDelete: string;
}

export interface IndexConfig {
  name: string;
  table: string;
  columns: string[];
  type: string;
  unique?: boolean;
}

export interface MigrationConfig {
  name: string;
  description: string;
  priority: string;
  sql: string;
}

export interface APIConfig {
  baseUrl: string;
  version: string;
  authentication: string[];
  rateLimit: RateLimitConfig;
  endpoints: EndpointConfig[];
  middleware: MiddlewareConfig[];
}

export interface RateLimitConfig {
  requests: number;
  window: string;
  skipAuth?: boolean;
}

export interface EndpointConfig {
  path: string;
  method: string;
  description: string;
  operationId: string;
  parameters?: ParameterConfig[];
  requestBody?: RequestBodyConfig;
  responses: ResponseConfig[];
  security: SecurityConfig[];
  businessFlow?: string;
}

export interface ParameterConfig {
  name: string;
  in: string;
  type: string;
  required: boolean;
  description: string;
}

export interface RequestBodyConfig {
  description: string;
  required: boolean;
  schema: any;
}

export interface ResponseConfig {
  status: number;
  description: string;
  schema?: any;
}

export interface SecurityConfig {
  type: string;
  scopes?: string[];
}

export interface MiddlewareConfig {
  name: string;
  type: string;
  config: any;
  order: number;
}

export interface WorkflowConfig {
  engine: string;
  workflows: WorkflowDefConfig[];
  activities: ActivityConfig[];
  schedules: ScheduleConfig[];
}

export interface WorkflowDefConfig {
  name: string;
  description: string;
  version: string;
  triggers: TriggerConfig[];
  steps: StepConfig[];
  errorHandling: ErrorHandlingConfig[];
}

export interface TriggerConfig {
  type: string;
  condition: string;
  schedule?: string;
}

export interface StepConfig {
  name: string;
  type: string;
  activity?: string;
  parameters?: any;
  timeout?: string;
  retries?: number;
  nextSteps: string[];
}

export interface ActivityConfig {
  name: string;
  type: string;
  implementation: string;
  parameters: any;
}

export interface ScheduleConfig {
  name: string;
  cron: string;
  workflow: string;
}

export interface ErrorHandlingConfig {
  errorType: string;
  action: string;
  retries?: number;
}

export interface UIConfig {
  framework: string;
  theme: UIThemeConfig;
  pages: PageConfig[];
  components: ComponentConfig[];
  routing: RoutingConfig;
  forms: FormConfig[];
}

export interface UIThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  spacing: Record<string, string>;
}

export interface PageConfig {
  name: string;
  path: string;
  title: string;
  description: string;
  layout: string;
  components: string[];
  permissions?: string[];
  businessFlow?: string;
}

export interface ComponentConfig {
  name: string;
  type: string;
  props: any;
  children?: string[];
  businessEntity?: string;
}

export interface RoutingConfig {
  basePath: string;
  routes: RouteConfig[];
  guards: GuardConfig[];
}

export interface RouteConfig {
  path: string;
  component: string;
  exact?: boolean;
  guards?: string[];
}

export interface GuardConfig {
  name: string;
  type: string;
  condition: string;
}

export interface FormConfig {
  name: string;
  entity: string;
  fields: FormFieldConfig[];
  validation: FormValidationConfig[];
  submission: FormSubmissionConfig;
}

export interface FormFieldConfig {
  name: string;
  type: string;
  label: string;
  required: boolean;
  validation?: string[];
  options?: string[];
}

export interface FormValidationConfig {
  field: string;
  rules: string[];
  message: string;
}

export interface FormSubmissionConfig {
  endpoint: string;
  method: string;
  successMessage: string;
  errorMessage: string;
}

export interface IntegrationsConfig {
  airbyte: AirbyteIntegrationConfig;
  webhooks: WebhookIntegrationConfig[];
  apis: ApiIntegrationConfig[];
  notifications: NotificationIntegrationConfig;
}

export interface AirbyteIntegrationConfig {
  enabled: boolean;
  sources: AirbyteSourceConfig[];
  destinations: AirbyteDestinationConfig[];
  connections: AirbyteConnectionConfig[];
}

export interface AirbyteSourceConfig {
  name: string;
  type: string;
  configuration: any;
  schedule?: string;
}

export interface AirbyteDestinationConfig {
  name: string;
  type: string;
  configuration: any;
}

export interface AirbyteConnectionConfig {
  name: string;
  source: string;
  destination: string;
  streams: string[];
  schedule: string;
}

export interface WebhookIntegrationConfig {
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  authentication?: any;
}

export interface ApiIntegrationConfig {
  name: string;
  baseUrl: string;
  authentication: any;
  endpoints: any[];
}

export interface NotificationIntegrationConfig {
  email: EmailNotificationConfig;
  sms?: SmsNotificationConfig;
  push?: PushNotificationConfig;
  slack?: SlackNotificationConfig;
}

export interface EmailNotificationConfig {
  provider: string;
  configuration: any;
  templates: EmailTemplateConfig[];
}

export interface EmailTemplateConfig {
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface SmsNotificationConfig {
  provider: string;
  configuration: any;
}

export interface PushNotificationConfig {
  provider: string;
  configuration: any;
}

export interface SlackNotificationConfig {
  webhookUrl: string;
  channels: string[];
}

export interface AlertsConfig {
  rules: AlertRuleConfig[];
  channels: AlertChannelConfig[];
  templates: AlertTemplateConfig[];
}

export interface AlertRuleConfig {
  name: string;
  description: string;
  condition: string;
  severity: string;
  channels: string[];
  throttle?: string;
}

export interface AlertChannelConfig {
  name: string;
  type: string;
  configuration: any;
}

export interface AlertTemplateConfig {
  name: string;
  title: string;
  body: string;
  variables: string[];
}

export interface DeploymentYAMLConfig {
  environment: string;
  platform: string;
  resources: ResourceConfig;
  scaling: ScalingConfig;
  networking: NetworkingConfig;
  monitoring: MonitoringConfig;
}

export interface ResourceConfig {
  api: {
    cpu: string;
    memory: string;
    replicas: number;
  };
  database: {
    size: string;
    backups: boolean;
  };
  redis: {
    memory: string;
  };
}

export interface ScalingConfig {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCPU: number;
  targetMemory: number;
}

export interface NetworkingConfig {
  domain?: string;
  ssl: boolean;
  cdn: boolean;
  loadBalancer: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  logs: boolean;
  alerts: boolean;
}

export interface AuthConfig {
  provider: string;
  configuration: any;
  features: AuthFeatureConfig;
  security: SecurityPolicyConfig;
}

export interface AuthFeatureConfig {
  registration: boolean;
  emailVerification: boolean;
  passwordReset: boolean;
  mfa: boolean;
  oauth: string[];
  magicLink: boolean;
}

export interface SecurityPolicyConfig {
  passwordPolicy: PasswordPolicyConfig;
  sessionPolicy: SessionPolicyConfig;
  rateLimiting: RateLimitPolicyConfig;
}

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  expiration?: number;
}

export interface SessionPolicyConfig {
  timeout: number;
  maxConcurrent: number;
  secure: boolean;
}

export interface RateLimitPolicyConfig {
  loginAttempts: number;
  lockoutDuration: number;
  apiRequests: number;
  apiWindow: string;
}

export class DynamicYAMLGenerator {
  private config: DynamicYAMLConfig;

  constructor(config: DynamicYAMLConfig) {
    this.config = config;
  }

  /**
   * Generate complete YAML configuration based on discovery results
   */
  async generateYAMLConfig(): Promise<{ yaml: string; structure: GeneratedYAMLStructure }> {
    const structure = await this.buildYAMLStructure();
    const yamlContent = this.convertToYAML(structure);

    return {
      yaml: yamlContent,
      structure
    };
  }

  /**
   * Build the complete YAML structure
   */
  private async buildYAMLStructure(): Promise<GeneratedYAMLStructure> {
    const primarySource = this.config.discoveredSources[0];
    const businessContext = primarySource.schema.businessContext;

    return {
      vertical: this.buildVerticalConfig(businessContext),
      database: this.buildDatabaseConfig(),
      apis: this.buildAPIConfig(),
      workflows: this.buildWorkflowConfig(),
      ui: this.buildUIConfig(),
      integrations: this.buildIntegrationsConfig(),
      alerts: this.buildAlertsConfig(),
      deployment: this.buildDeploymentConfig(),
      auth: this.buildAuthConfig()
    };
  }

  /**
   * Build vertical configuration
   */
  private buildVerticalConfig(businessContext: any): VerticalConfig {
    const entities = this.config.businessFlows.identifiedPatterns
      .flatMap(pattern => pattern.entities);

    const coreFeatures = this.config.businessFlows.identifiedPatterns
      .map(pattern => pattern.type);

    return {
      name: this.config.projectName,
      description: `${businessContext.domain} management system with ${entities.length} core entities`,
      version: '1.0.0',
      domain: businessContext.domain.toLowerCase().replace(/\s+/g, '-'),
      businessEntities: [...new Set(entities)],
      coreFeatures: [...new Set(coreFeatures)]
    };
  }

  /**
   * Build database configuration
   */
  private buildDatabaseConfig(): DatabaseConfig {
    const models = this.config.schemaAnalysis.recommendedSchema.map(model => 
      this.convertPrismaModelToConfig(model)
    );

    const relationships = this.extractRelationships();
    const indexes = this.extractIndexes();
    const migrations = this.config.schemaAnalysis.migrations.map(migration => ({
      name: migration.name,
      description: migration.description,
      priority: migration.priority,
      sql: migration.sql
    }));

    return {
      models,
      relationships,
      indexes,
      migrations
    };
  }

  /**
   * Build API configuration
   */
  private buildAPIConfig(): APIConfig {
    const endpoints = this.config.businessFlows.apiEndpoints.map(endpoint => 
      this.convertAPIEndpointToConfig(endpoint)
    );

    return {
      baseUrl: `/api/v1`,
      version: '1.0',
      authentication: ['bearer', 'api_key'],
      rateLimit: {
        requests: 1000,
        window: '15m'
      },
      endpoints,
      middleware: [
        { name: 'cors', type: 'cors', config: { origin: true }, order: 1 },
        { name: 'auth', type: 'authentication', config: {}, order: 2 },
        { name: 'rateLimit', type: 'rate-limit', config: {}, order: 3 },
        { name: 'tenant', type: 'tenant-isolation', config: {}, order: 4 }
      ]
    };
  }

  /**
   * Build workflow configuration
   */
  private buildWorkflowConfig(): WorkflowConfig {
    const workflows = this.config.businessFlows.recommendedFlows.map(flow => 
      this.convertBusinessFlowToConfig(flow)
    );

    return {
      engine: 'temporal',
      workflows,
      activities: this.extractActivities(),
      schedules: this.extractSchedules()
    };
  }

  /**
   * Build UI configuration
   */
  private buildUIConfig(): UIConfig {
    const pages = this.generatePagesFromFlows();
    const components = this.generateComponentsFromEntities();
    const forms = this.generateFormsFromEntities();

    return {
      framework: 'next.js',
      theme: {
        primaryColor: this.config.customizations?.theme?.primaryColor || '#3b82f6',
        secondaryColor: this.config.customizations?.theme?.secondaryColor || '#64748b',
        fontFamily: this.config.customizations?.theme?.fontFamily || 'Inter, sans-serif',
        borderRadius: this.config.customizations?.theme?.borderRadius || '8px',
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
          xl: '32px'
        }
      },
      pages,
      components,
      routing: {
        basePath: '/',
        routes: pages.map(page => ({
          path: page.path,
          component: page.name,
          exact: true,
          guards: page.permissions ? ['auth'] : []
        })),
        guards: [
          { name: 'auth', type: 'authentication', condition: 'user.isAuthenticated' },
          { name: 'admin', type: 'role', condition: 'user.role === "admin"' }
        ]
      },
      forms
    };
  }

  /**
   * Build integrations configuration
   */
  private buildIntegrationsConfig(): IntegrationsConfig {
    const airbyteConfig = this.buildAirbyteConfig();
    const webhooks = this.generateWebhooks();
    const apis = this.generateAPIIntegrations();
    const notifications = this.buildNotificationConfig();

    return {
      airbyte: airbyteConfig,
      webhooks,
      apis,
      notifications
    };
  }

  /**
   * Build alerts configuration
   */
  private buildAlertsConfig(): AlertsConfig {
    const rules = this.generateAlertRules();
    const channels = this.generateAlertChannels();
    const templates = this.generateAlertTemplates();

    return {
      rules,
      channels,
      templates
    };
  }

  /**
   * Build deployment configuration
   */
  private buildDeploymentConfig(): DeploymentYAMLConfig {
    const env = this.config.customizations?.deployment?.environment || 'development';

    return {
      environment: env,
      platform: 'vercel',
      resources: {
        api: {
          cpu: '0.5',
          memory: '1Gi',
          replicas: env === 'production' ? 2 : 1
        },
        database: {
          size: env === 'production' ? '20GB' : '5GB',
          backups: env === 'production'
        },
        redis: {
          memory: '512Mi'
        }
      },
      scaling: {
        enabled: env === 'production',
        minReplicas: 1,
        maxReplicas: env === 'production' ? 10 : 3,
        targetCPU: 70,
        targetMemory: 80
      },
      networking: {
        ...(this.config.customizations?.deployment?.domain && { 
          domain: this.config.customizations.deployment.domain 
        }),
        ssl: this.config.customizations?.deployment?.ssl ?? true,
        cdn: true,
        loadBalancer: env === 'production'
      },
      monitoring: {
        enabled: true,
        metrics: ['http_requests', 'database_queries', 'error_rate', 'response_time'],
        logs: true,
        alerts: env === 'production'
      }
    };
  }

  /**
   * Build authentication configuration
   */
  private buildAuthConfig(): AuthConfig {
    return {
      provider: 'supabase',
      configuration: {
        url: '${SUPABASE_URL}',
        anonKey: '${SUPABASE_ANON_KEY}',
        serviceRoleKey: '${SUPABASE_SERVICE_ROLE_KEY}'
      },
      features: {
        registration: true,
        emailVerification: true,
        passwordReset: true,
        mfa: false,
        oauth: ['google', 'github'],
        magicLink: true
      },
      security: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: false
        },
        sessionPolicy: {
          timeout: 86400, // 24 hours
          maxConcurrent: 5,
          secure: true
        },
        rateLimiting: {
          loginAttempts: 5,
          lockoutDuration: 900, // 15 minutes
          apiRequests: 1000,
          apiWindow: '15m'
        }
      }
    };
  }

  /**
   * Convert Prisma model to YAML config
   */
  private convertPrismaModelToConfig(model: PrismaSchemaModel): ModelConfig {
    const fields = model.fields.map(field => ({
      name: field.name,
      type: field.type,
      required: !field.isOptional,
      unique: field.isUnique,
      indexed: field.indexed,
      validation: field.validation?.map(rule => ({
        type: rule.startsWith('@') ? rule.slice(1) : 'custom',
        rule: rule,
        message: `Invalid ${field.name}`
      })),
      businessMeaning: field.businessMeaning,
      displayName: this.humanizeFieldName(field.name)
    }));

    return {
      name: model.name,
      tableName: model.tableName,
      description: `${model.metadata.businessEntity} entity`,
      fields,
      businessEntity: model.metadata.businessEntity,
      accessPatterns: [model.metadata.accessPattern]
    };
  }

  /**
   * Convert API endpoint to config
   */
  private convertAPIEndpointToConfig(endpoint: APIEndpoint): EndpointConfig {
    return {
      path: endpoint.path,
      method: endpoint.method,
      description: endpoint.description,
      operationId: `${endpoint.method.toLowerCase()}${endpoint.path.replace(/[^a-zA-Z0-9]/g, '')}`,
      parameters: endpoint.parameters?.map(param => ({
        name: param.name,
        in: param.in,
        type: param.type,
        required: param.required,
        description: param.description
      })),
      requestBody: endpoint.requestBody ? {
        description: endpoint.requestBody.description,
        required: endpoint.requestBody.required,
        schema: endpoint.requestBody.schema
      } : undefined,
      responses: endpoint.responses.map(response => ({
        status: response.statusCode,
        description: response.description,
        schema: response.schema
      })),
      security: endpoint.security.map(sec => ({
        type: sec.type,
        ...(sec.scopes && { scopes: sec.scopes })
      })),
      businessFlow: endpoint.businessFlow
    };
  }

  /**
   * Convert business flow to workflow config
   */
  private convertBusinessFlowToConfig(flow: BusinessFlow): WorkflowDefConfig {
    return {
      name: flow.name,
      description: flow.description,
      version: '1.0',
      triggers: flow.triggers.map(trigger => ({
        type: trigger.type,
        condition: trigger.condition,
        ...(trigger.type === 'scheduled' && { schedule: trigger.condition })
      })),
      steps: flow.steps.map(step => ({
        name: step.name,
        type: step.type,
        ...(step.type === 'system_process' && step.operation && { activity: step.operation }),
        parameters: step.inputs.reduce((acc, input) => {
          acc[input.name] = input.type;
          return acc;
        }, {} as any),
        timeout: '30s',
        retries: 3,
        nextSteps: step.nextSteps
      })),
      errorHandling: flow.errorHandling.map(error => ({
        errorType: error.errorType,
        action: error.action,
        ...(error.maxRetries !== undefined && { retries: error.maxRetries })
      }))
    };
  }

  /**
   * Generate pages from business flows
   */
  private generatePagesFromFlows(): PageConfig[] {
    const pages: PageConfig[] = [
      {
        name: 'Dashboard',
        path: '/',
        title: 'Dashboard',
        description: 'Main dashboard with key metrics',
        layout: 'default',
        components: ['StatsOverview', 'RecentActivity', 'QuickActions']
      }
    ];

    // Generate entity pages
    const entities = [...new Set(this.config.businessFlows.recommendedFlows
      .map(flow => flow.steps.find(step => step.entity)?.entity)
      .filter((entity): entity is string => Boolean(entity)))];

    for (const entity of entities) {
      const entityLower = entity.toLowerCase();
      const entityPlural = `${entityLower}s`;

      pages.push(
        {
          name: `${entity}List`,
          path: `/${entityPlural}`,
          title: `${entity} Management`,
          description: `Manage ${entity.toLowerCase()} records`,
          layout: 'default',
          components: [`${entity}Table`, 'FilterPanel', 'SearchBar'],
          permissions: [`${entityLower}:read`],
          businessFlow: `list_${entityLower}`
        },
        {
          name: `${entity}Create`,
          path: `/${entityPlural}/new`,
          title: `Create ${entity}`,
          description: `Create a new ${entity.toLowerCase()}`,
          layout: 'default',
          components: [`${entity}Form`],
          permissions: [`${entityLower}:create`],
          businessFlow: `create_${entityLower}`
        },
        {
          name: `${entity}Edit`,
          path: `/${entityPlural}/:id/edit`,
          title: `Edit ${entity}`,
          description: `Edit ${entity.toLowerCase()} details`,
          layout: 'default',
          components: [`${entity}Form`],
          permissions: [`${entityLower}:update`],
          businessFlow: `update_${entityLower}`
        }
      );
    }

    return pages;
  }

  /**
   * Generate components from entities
   */
  private generateComponentsFromEntities(): ComponentConfig[] {
    const components: ComponentConfig[] = [];
    const entities = this.config.schemaAnalysis.recommendedSchema;

    for (const entity of entities) {
      // Table component
      components.push({
        name: `${entity.name}Table`,
        type: 'data-table',
        props: {
          columns: entity.fields
            .filter(field => !['createdAt', 'updatedAt', 'tenantId'].includes(field.name))
            .slice(0, 6) // Show first 6 columns
            .map(field => ({
              key: field.name,
              title: this.humanizeFieldName(field.name),
              type: field.type.toLowerCase(),
              sortable: true,
              searchable: field.searchable
            })),
          actions: ['view', 'edit', 'delete'],
          pagination: true,
          search: true,
          filters: true
        },
        businessEntity: entity.name
      });

      // Form component
      components.push({
        name: `${entity.name}Form`,
        type: 'form',
        props: {
          fields: entity.fields
            .filter(field => !['id', 'createdAt', 'updatedAt', 'tenantId'].includes(field.name))
            .map(field => ({
              name: field.name,
              type: this.mapFieldTypeToInput(field.type),
              label: this.humanizeFieldName(field.name),
              required: !field.isOptional,
              validation: field.validation || []
            })),
          submitText: 'Save',
          cancelText: 'Cancel'
        },
        businessEntity: entity.name
      });
    }

    return components;
  }

  /**
   * Generate forms from entities
   */
  private generateFormsFromEntities(): FormConfig[] {
    return this.config.schemaAnalysis.recommendedSchema.map(entity => ({
      name: `${entity.name}Form`,
      entity: entity.name,
      fields: entity.fields
        .filter(field => !['id', 'createdAt', 'updatedAt', 'tenantId'].includes(field.name))
        .map(field => ({
          name: field.name,
          type: this.mapFieldTypeToInput(field.type),
          label: this.humanizeFieldName(field.name),
          required: !field.isOptional,
          validation: field.validation || [],
          options: field.businessMeaning === 'status' ? ['active', 'inactive'] : undefined
        })),
      validation: entity.fields
        .filter(field => !field.isOptional)
        .map(field => ({
          field: field.name,
          rules: ['required'],
          message: `${this.humanizeFieldName(field.name)} is required`
        })),
      submission: {
        endpoint: `/api/${entity.tableName}`,
        method: 'POST',
        successMessage: `${entity.name} saved successfully`,
        errorMessage: `Failed to save ${entity.name}`
      }
    }));
  }

  /**
   * Build Airbyte configuration
   */
  private buildAirbyteConfig(): AirbyteIntegrationConfig {
    const sources = this.config.discoveredSources.map(source => ({
      name: source.name,
      type: source.type,
      configuration: {
        // This would be populated based on the actual source configuration
      },
      schedule: 'daily'
    }));

    return {
      enabled: true,
      sources,
      destinations: [
        {
          name: 'opsai-database',
          type: 'postgres',
          configuration: {
            host: '${DB_HOST}',
            port: '${DB_PORT}',
            database: '${DB_NAME}',
            username: '${DB_USER}',
            password: '${DB_PASSWORD}',
            schema: 'airbyte_synced'
          }
        }
      ],
      connections: sources.map(source => ({
        name: `${source.name}-sync`,
        source: source.name,
        destination: 'opsai-database',
        streams: ['*'],
        schedule: 'daily'
      }))
    };
  }

  /**
   * Convert structure to YAML string
   */
  private convertToYAML(structure: GeneratedYAMLStructure): string {
    return yaml.dump(structure, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false
    });
  }

  // Helper methods
  private extractRelationships(): RelationshipConfig[] {
    return this.config.schemaAnalysis.recommendedSchema.flatMap(model =>
      model.relations.map(relation => ({
        from: model.name,
        to: relation.relatedModel,
        type: relation.type,
        foreignKey: relation.foreignKey || `${relation.relatedModel.toLowerCase()}Id`,
        onDelete: relation.onDelete
      }))
    );
  }

  private extractIndexes(): IndexConfig[] {
    return this.config.schemaAnalysis.recommendedSchema.flatMap(model =>
      model.indexes.map(index => ({
        name: index.name,
        table: model.tableName,
        columns: index.fields,
        type: index.type,
        unique: index.type === 'unique'
      }))
    );
  }

  private extractActivities(): ActivityConfig[] {
    return [
      {
        name: 'validateData',
        type: 'system',
        implementation: 'validation-service',
        parameters: {}
      },
      {
        name: 'saveToDatabase',
        type: 'system',
        implementation: 'database-service',
        parameters: {}
      },
      {
        name: 'sendNotification',
        type: 'system',
        implementation: 'notification-service',
        parameters: {}
      }
    ];
  }

  private extractSchedules(): ScheduleConfig[] {
    return [
      {
        name: 'daily-sync',
        cron: '0 2 * * *', // 2 AM daily
        workflow: 'data-sync'
      }
    ];
  }

  private generateWebhooks(): WebhookIntegrationConfig[] {
    return [
      {
        name: 'stripe-webhook',
        url: '/api/webhooks/stripe',
        events: ['payment.succeeded', 'payment.failed'],
        headers: { 'Content-Type': 'application/json' }
      }
    ];
  }

  private generateAPIIntegrations(): ApiIntegrationConfig[] {
    return [];
  }

  private buildNotificationConfig(): NotificationIntegrationConfig {
    return {
      email: {
        provider: 'sendgrid',
        configuration: {
          apiKey: '${SENDGRID_API_KEY}',
          fromEmail: '${FROM_EMAIL}'
        },
        templates: [
          {
            name: 'welcome',
            subject: 'Welcome to {{projectName}}',
            body: 'Welcome {{userName}}!',
            variables: ['projectName', 'userName']
          }
        ]
      }
    };
  }

  private generateAlertRules(): AlertRuleConfig[] {
    return [
      {
        name: 'high-error-rate',
        description: 'Alert when error rate exceeds threshold',
        condition: 'error_rate > 5%',
        severity: 'critical',
        channels: ['email', 'slack']
      }
    ];
  }

  private generateAlertChannels(): AlertChannelConfig[] {
    return [
      {
        name: 'email',
        type: 'email',
        configuration: {
          recipients: ['admin@example.com']
        }
      }
    ];
  }

  private generateAlertTemplates(): AlertTemplateConfig[] {
    return [
      {
        name: 'error-alert',
        title: 'Alert: {{alertName}}',
        body: 'Alert triggered: {{description}}',
        variables: ['alertName', 'description']
      }
    ];
  }

  private humanizeFieldName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private mapFieldTypeToInput(fieldType: string): string {
    const mapping: Record<string, string> = {
      'String': 'text',
      'Int': 'number',
      'BigInt': 'number',
      'Float': 'number',
      'Decimal': 'number',
      'Boolean': 'checkbox',
      'DateTime': 'datetime-local',
      'Json': 'textarea'
    };

    return mapping[fieldType] || 'text';
  }
}

// Factory function
export function createDynamicYAMLGenerator(config: DynamicYAMLConfig): DynamicYAMLGenerator {
  return new DynamicYAMLGenerator(config);
}