import { z } from 'zod'

// Field validation schemas
const FieldValidationSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'date', 'datetime', 'json', 'array', 'enum']),
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  validation: z.string().optional(),
  defaultValue: z.any().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  enumValues: z.array(z.string()).optional(),
})

const UISchema = z.object({
  label: z.string(),
  widget: z.enum(['text', 'textarea', 'number', 'email', 'phone', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'radio', 'file', 'json-editor', 'rich-text', 'markdown']),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  validation: z.string().optional(),
  readonly: z.boolean().default(false),
  hidden: z.boolean().default(false),
})

const FieldSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'datetime', 'json', 'array', 'enum', 'uuid', 'email', 'phone', 'url']),
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  validation: z.string().optional(),
  ui: UISchema,
  description: z.string().optional(),
})

const RelationshipSchema = z.object({
  type: z.enum(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']),
  model: z.string(),
  foreignKey: z.string().optional(),
  cascade: z.boolean().default(false),
})

const IndexSchema = z.object({
  name: z.string(),
  fields: z.array(z.string()),
  unique: z.boolean().default(false),
})

const PermissionSchema = z.object({
  read: z.array(z.string()),
  write: z.array(z.string()),
  delete: z.array(z.string()),
  create: z.array(z.string()).optional(),
})

const ModelSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  fields: z.array(FieldSchema),
  relationships: z.array(z.union([z.string(), RelationshipSchema])).optional(),
  indexes: z.array(z.union([z.string(), IndexSchema])).optional(),
  permissions: PermissionSchema.optional(),
  softDelete: z.boolean().default(false),
  audit: z.boolean().default(false),
})

const DatabaseSchema = z.object({
  provider: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb']),
  models: z.array(ModelSchema),
  migrations: z.boolean().default(true),
  seed: z.boolean().default(false),
})

const BusinessSchema = z.object({
  name: z.string(),
  type: z.string(),
  website: z.string().url().optional(),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  settings: z.object({
    timezone: z.string().default('UTC'),
    currency: z.string().default('USD'),
    language: z.string().default('en'),
  }).optional(),
})

const VerticalSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string(),
  industry: z.string(),
  businessModel: z.string(),
})

const AuthProviderSchema = z.object({
  type: z.enum(['email', 'google', 'github', 'microsoft', 'sso', 'magic-link']),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional(),
})

const RoleSchema = z.object({
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
  inherits: z.array(z.string()).optional(),
})

const AuthSchema = z.object({
  providers: z.array(AuthProviderSchema),
  roles: z.array(RoleSchema),
  defaultRole: z.string(),
  sessionTimeout: z.number().default(3600),
  mfa: z.boolean().default(false),
})

const IntegrationSchema = z.object({
  name: z.string(),
  type: z.enum(['api', 'oauth', 'webhook', 'database']),
  provider: z.string(),
  config: z.record(z.any()),
  enabled: z.boolean().default(true),
  sync: z.boolean().default(false),
  webhooks: z.array(z.string()).optional(),
})

const DashboardSchema = z.object({
  name: z.string(),
  description: z.string(),
  layout: z.enum(['grid', 'flex', 'kanban', 'list']),
  widgets: z.array(z.object({
    type: z.enum(['chart', 'table', 'metric', 'form', 'list']),
    config: z.record(z.any()),
  })),
  permissions: z.array(z.string()).optional(),
})

const WorkflowSchema = z.object({
  name: z.string(),
  description: z.string(),
  trigger: z.enum(['manual', 'scheduled', 'webhook', 'condition']),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
    value: z.any(),
  })).optional(),
  actions: z.array(z.object({
    type: z.enum(['email', 'sms', 'webhook', 'database', 'notification']),
    config: z.record(z.any()),
  })),
  enabled: z.boolean().default(true),
})

const BillingSchema = z.object({
  provider: z.enum(['stripe', 'paddle', 'chargebee']).default('stripe'),
  plans: z.array(z.object({
    name: z.string(),
    price: z.number(),
    currency: z.string().default('USD'),
    interval: z.enum(['monthly', 'yearly']),
    limits: z.record(z.any()),
    features: z.array(z.string()),
  })),
  usage: z.boolean().default(false),
  trial: z.number().default(14),
})

const DeploymentSchema = z.object({
  provider: z.enum(['vercel', 'netlify', 'aws', 'gcp']).default('vercel'),
  domain: z.string().optional(),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  autoDeploy: z.boolean().default(true),
  rollback: z.boolean().default(true),
})

// Main YAML schema
export const YAMLSchema = z.object({
  vertical: VerticalSchema,
  business: BusinessSchema,
  database: DatabaseSchema,
  auth: AuthSchema.optional(),
  integrations: z.array(IntegrationSchema).optional(),
  dashboards: z.array(DashboardSchema).optional(),
  workflows: z.array(WorkflowSchema).optional(),
  billing: BillingSchema.optional(),
  deployment: DeploymentSchema.optional(),
  metadata: z.object({
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    version: z.string().optional(),
    author: z.string().optional(),
  }).optional(),
})

export type YAMLConfig = z.infer<typeof YAMLSchema>

// Validation functions
export const validateYAML = (yamlData: any): YAMLConfig => {
  return YAMLSchema.parse(yamlData)
}

export const validateYAMLWithErrors = (yamlData: any) => {
  return YAMLSchema.safeParse(yamlData)
} 