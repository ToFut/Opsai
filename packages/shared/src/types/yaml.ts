import { z } from 'zod'

// Base field schema
export const FieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: z.enum(['string', 'number', 'integer', 'boolean', 'date', 'datetime', 'json', 'enum']),
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  description: z.string().optional(),
  defaultValue: z.any().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    enum: z.array(z.string()).optional()
  }).optional()
})

// Model schema
export const ModelSchema = z.object({
  name: z.string().min(1, 'Model name is required'),
  displayName: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(FieldSchema).min(1, 'At least one field is required'),
  relationships: z.array(z.object({
    type: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
    targetModel: z.string(),
    foreignKey: z.string().optional(),
    cascade: z.boolean().default(false)
  })).optional(),
  indexes: z.array(z.object({
    name: z.string(),
    fields: z.array(z.string()),
    unique: z.boolean().default(false)
  })).optional()
})

// Integration schema
export const IntegrationSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  provider: z.string().min(1, 'Provider is required'),
  type: z.enum(['rest', 'soap', 'webhook', 'database', 'file']),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional(),
  endpoints: z.array(z.object({
    name: z.string(),
    path: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    description: z.string().optional()
  })).optional()
})

// Workflow schema
export const WorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  steps: z.array(z.object({
    name: z.string(),
    type: z.enum(['http', 'database', 'email', 'slack', 'custom']),
    config: z.record(z.any()),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'regex']),
      value: z.any()
    })).optional()
  })).min(1, 'At least one step is required'),
  triggers: z.array(z.object({
    type: z.enum(['webhook', 'cron', 'manual', 'database']),
    config: z.record(z.any())
  })).optional()
})

// UI Component schema
export const UIComponentSchema = z.object({
  type: z.string().min(1, 'Component type is required'),
  dataSource: z.string().optional(),
  actions: z.array(z.string()).optional(),
  mode: z.enum(['view', 'edit', 'create']).optional(),
  config: z.record(z.any()).optional()
})

// UI Page schema
export const UIPageSchema = z.object({
  name: z.string().min(1, 'Page name is required'),
  path: z.string().min(1, 'Page path is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  components: z.array(UIComponentSchema).min(1, 'At least one component is required'),
  layout: z.enum(['default', 'dashboard', 'form', 'list', 'detail']).default('default'),
  permissions: z.array(z.string()).optional()
})

// Vertical schema
export const VerticalSchema = z.object({
  name: z.string().min(1, 'Vertical name is required'),
  description: z.string().optional(),
  industry: z.enum(['healthcare', 'ecommerce', 'real_estate', 'finance', 'education', 'manufacturing', 'general']).default('general'),
  version: z.string().default('1.0.0'),
  author: z.string().optional(),
  license: z.string().default('MIT')
})

// Business schema
export const BusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  type: z.string().optional(),
  description: z.string().optional(),
  domain: z.string().url().optional(),
  logo: z.string().url().optional(),
  branding: z.object({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    fontFamily: z.string().optional()
  }).optional()
})

// Database schema
export const DatabaseSchema = z.object({
  type: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb']).default('postgresql'),
  models: z.array(ModelSchema).min(1, 'At least one model is required'),
  migrations: z.boolean().default(true),
  seedData: z.boolean().default(false),
  backup: z.boolean().default(true)
})

// APIs schema
export const APIsSchema = z.object({
  integrations: z.array(IntegrationSchema).optional(),
  webhooks: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    events: z.array(z.string()),
    secret: z.string().optional()
  })).optional(),
  rateLimit: z.object({
    requests: z.number().positive(),
    window: z.number().positive() // in seconds
  }).optional()
})

// UI schema
export const UISchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  pages: z.array(UIPageSchema).min(1, 'At least one page is required'),
  navigation: z.object({
    type: z.enum(['sidebar', 'top', 'both']).default('sidebar'),
    items: z.array(z.object({
      name: z.string(),
      href: z.string(),
      icon: z.string().optional(),
      children: z.array(z.object({
        name: z.string(),
        href: z.string(),
        icon: z.string().optional()
      })).optional()
    })).optional()
  }).optional(),
  branding: z.object({
    logo: z.string().url().optional(),
    favicon: z.string().url().optional(),
    title: z.string().optional(),
    description: z.string().optional()
  }).optional()
})

// Main YAML configuration schema
export const YamlConfigSchema = z.object({
  vertical: VerticalSchema,
  business: BusinessSchema,
  database: DatabaseSchema,
  apis: APIsSchema.optional(),
  workflows: z.array(WorkflowSchema).optional(),
  ui: UISchema,
  deployment: z.object({
    platform: z.enum(['vercel', 'netlify', 'aws', 'gcp', 'azure']).default('vercel'),
    customDomain: z.string().optional(),
    environment: z.enum(['development', 'staging', 'production']).default('development'),
    autoDeploy: z.boolean().default(true)
  }).optional(),
  features: z.object({
    authentication: z.boolean().default(true),
    multiTenancy: z.boolean().default(true),
    fileUpload: z.boolean().default(false),
    realTimeUpdates: z.boolean().default(false),
    analytics: z.boolean().default(false),
    notifications: z.boolean().default(true)
  }).optional(),
  security: z.object({
    cors: z.boolean().default(true),
    rateLimit: z.boolean().default(true),
    auditLog: z.boolean().default(false),
    encryption: z.boolean().default(true)
  }).optional()
})

// Type exports
export type Field = z.infer<typeof FieldSchema>
export type Model = z.infer<typeof ModelSchema>
export type Integration = z.infer<typeof IntegrationSchema>
export type Workflow = z.infer<typeof WorkflowSchema>
export type UIComponent = z.infer<typeof UIComponentSchema>
export type UIPage = z.infer<typeof UIPageSchema>
export type Vertical = z.infer<typeof VerticalSchema>
export type Business = z.infer<typeof BusinessSchema>
export type Database = z.infer<typeof DatabaseSchema>
export type APIs = z.infer<typeof APIsSchema>
export type UI = z.infer<typeof UISchema>
export type YamlConfig = z.infer<typeof YamlConfigSchema>

// Validation functions
export const validateYamlConfig = (config: any): YamlConfig => {
  return YamlConfigSchema.parse(config)
}

export const validateYamlConfigSafe = (config: any): { success: boolean; data?: YamlConfig; errors?: string[] } => {
  try {
    const validated = YamlConfigSchema.parse(config)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }
    }
    return { success: false, errors: ['Unknown validation error'] }
  }
}

// Helper functions
export const getDefaultYamlConfig = (): YamlConfig => {
  return {
    vertical: {
      name: 'my-app',
      description: 'Generated application',
      industry: 'general'
    },
    business: {
      name: 'My Business',
      type: 'SaaS'
    },
    database: {
      type: 'postgresql',
      models: [
        {
          name: 'user',
          fields: [
            { name: 'id', type: 'string', required: true, unique: true },
            { name: 'email', type: 'string', required: true, unique: true },
            { name: 'name', type: 'string', required: true },
            { name: 'createdAt', type: 'datetime', required: true }
          ]
        }
      ]
    },
    ui: {
      theme: 'light',
      pages: [
        {
          name: 'dashboard',
          path: '/',
          components: [
            { type: 'stats_overview', dataSource: 'analytics' },
            { type: 'recent_activity', dataSource: 'activity_log' }
          ]
        }
      ]
    }
  }
} 