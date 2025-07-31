import { validateYamlConfigSafe, YamlConfig } from '@opsai/shared'

export interface YamlProcessorConfig {
  enableValidation: boolean
  enableCaching: boolean
  enableSecurity: boolean
  maxFileSize: number
  allowedExtensions: string[]
  templatePath: string
}

export interface ProcessingResult {
  success: boolean
  config?: YamlConfig
  errors?: string[]
  warnings?: string[]
  generatedFiles?: GeneratedFile[]
  metadata?: ProcessingMetadata
}

export interface GeneratedFile {
  path: string
  content: string
  type: 'code' | 'config' | 'template' | 'documentation'
  language?: string
  dependencies?: string[]
}

export interface ProcessingMetadata {
  processingTime: number
  fileSize: number
  complexity: number
  estimatedDeploymentTime: number
  resourceRequirements: ResourceRequirements
}

export interface ResourceRequirements {
  cpu: string
  memory: string
  storage: string
  database: string
  externalServices: string[]
}

export interface YamlTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  yamlContent: string
  complexity: 'simple' | 'medium' | 'complex'
  estimatedTime: number
  features: string[]
  preview?: string
}

export class YamlProcessor {
  private config: YamlProcessorConfig
  private templates: Map<string, YamlTemplate>

  constructor(config: YamlProcessorConfig) {
    this.config = config
    this.templates = new Map()
    this.initializeTemplates()
  }

  /**
   * Initialize built-in templates
   */
  private initializeTemplates(): void {
    // E-commerce template
    this.addTemplate({
      id: 'ecommerce-basic',
      name: 'Basic E-commerce',
      description: 'Simple e-commerce platform with products, orders, and payments',
      category: 'E-commerce',
      tags: ['shop', 'products', 'orders', 'payments'],
      complexity: 'medium',
      estimatedTime: 30,
      features: ['product-catalog', 'shopping-cart', 'order-management', 'payment-processing'],
      yamlContent: this.getEcommerceTemplate()
    })

    // CRM template
    this.addTemplate({
      id: 'crm-basic',
      name: 'Basic CRM',
      description: 'Customer relationship management system',
      category: 'CRM',
      tags: ['customers', 'leads', 'deals', 'contacts'],
      complexity: 'medium',
      estimatedTime: 25,
      features: ['contact-management', 'lead-tracking', 'deal-pipeline', 'reports'],
      yamlContent: this.getCrmTemplate()
    })

    // Restaurant template
    this.addTemplate({
      id: 'restaurant-basic',
      name: 'Restaurant Management',
      description: 'Restaurant management with menu, orders, and reservations',
      category: 'Hospitality',
      tags: ['restaurant', 'menu', 'orders', 'reservations'],
      complexity: 'medium',
      estimatedTime: 20,
      features: ['menu-management', 'order-system', 'reservations', 'inventory'],
      yamlContent: this.getRestaurantTemplate()
    })

    // SaaS template
    this.addTemplate({
      id: 'saas-basic',
      name: 'SaaS Platform',
      description: 'Multi-tenant SaaS platform with subscriptions',
      category: 'SaaS',
      tags: ['saas', 'subscriptions', 'multi-tenant', 'billing'],
      complexity: 'complex',
      estimatedTime: 45,
      features: ['multi-tenancy', 'subscription-management', 'billing', 'analytics'],
      yamlContent: this.getSaaSTemplate()
    })
  }

  /**
   * Process YAML configuration
   */
  async processYaml(
    yamlContent: string,
    _tenantId?: string,
    options?: {
      validate?: boolean
      generateCode?: boolean
      createDeployment?: boolean
      customTemplates?: string[]
    }
  ): Promise<ProcessingResult> {
    const startTime = Date.now()
    const result: ProcessingResult = {
      success: false,
      errors: [],
      warnings: [],
      generatedFiles: [],
      metadata: {
        processingTime: 0,
        fileSize: yamlContent.length,
        complexity: 0,
        estimatedDeploymentTime: 0,
        resourceRequirements: {
          cpu: '1',
          memory: '1Gi',
          storage: '10Gi',
          database: 'postgresql',
          externalServices: []
        }
      }
    }

    try {
      // Security validation (simplified)
      if (this.config.enableSecurity) {
        // Basic security check - look for suspicious patterns
        const suspiciousPatterns = [/eval\s*\(/i, /exec\s*\(/i, /system\s*\(/i, /__import__/i]
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(yamlContent)) {
            result.errors?.push('Suspicious content detected')
            return result
          }
        }
      }

      // Parse YAML
      const yaml = await import('js-yaml')
      const parsedConfig = yaml.load(yamlContent)

      // Validate against schema
      if (options?.validate !== false && this.config.enableValidation) {
        const validation = validateYamlConfigSafe(parsedConfig)
        if (!validation.success) {
          result.errors?.push(...validation.errors!)
          return result
        }
        result.config = validation.data!
      } else {
        result.config = parsedConfig as YamlConfig
      }

      // Generate code if requested
      if (options?.generateCode !== false) {
        const generatedFiles = await this.generateApplicationCode(result.config!, options?.customTemplates)
        result.generatedFiles = generatedFiles
      }

      // Calculate metadata
      result.metadata!.processingTime = Date.now() - startTime
      result.metadata!.complexity = this.calculateComplexity(result.config!)
      result.metadata!.estimatedDeploymentTime = this.estimateDeploymentTime(result.config!)
      result.metadata!.resourceRequirements = this.calculateResourceRequirements(result.config!)

      // Note: Caching removed for simplified version

      result.success = true
      return result

    } catch (error) {
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error occurred')
      return result
    }
  }

  /**
   * Generate application code from YAML config
   */
  private async generateApplicationCode(
    config: YamlConfig,
    _customTemplates?: string[]
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = []

    // Generate database schema
    files.push(...await this.generateDatabaseSchema(config))

    // Generate API routes
    files.push(...await this.generateApiRoutes(config))

    // Generate UI components
    files.push(...await this.generateUIComponents(config))

    // Generate workflows
    files.push(...await this.generateWorkflows(config))

    // Generate deployment config
    files.push(...await this.generateDeploymentConfig(config))

    // Generate documentation
    files.push(...await this.generateDocumentation(config))

    return files
  }

  /**
   * Generate database schema
   */
  private async generateDatabaseSchema(config: YamlConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = []

    // Generate Prisma schema
    const prismaSchema = this.generatePrismaSchema(config)
    files.push({
      path: 'prisma/schema.prisma',
      content: prismaSchema,
      type: 'config',
      language: 'prisma',
      dependencies: ['@prisma/client']
    })

    // Generate database migrations
    const migrations = this.generateMigrations(config)
    files.push({
      path: 'prisma/migrations/init/migration.sql',
      content: migrations,
      type: 'config',
      language: 'sql'
    })

    return files
  }

  /**
   * Generate Prisma schema
   */
  private generatePrismaSchema(config: YamlConfig): string {
    let schema = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`

    // Add models from YAML
    if (config.database?.models) {
      for (const model of config.database.models) {
        if (!model.name) continue
        
        schema += `model ${model.name} {\n`
        
        // Add fields
        if (model.fields) {
          for (const field of model.fields) {
            if (!field.name || !field.type) continue
            schema += `  ${field.name} ${this.mapFieldType(field.type)}`
            if (field.required) schema += ` @db.${field.type}`
            if (field.unique) schema += ` @unique`
            if (field.description) schema += ` // ${field.description}`
            schema += '\n'
          }
        }

        schema += '}\n\n'
      }
    }

    return schema
  }

  /**
   * Generate API routes
   */
  private async generateApiRoutes(config: YamlConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = []

    // Generate API routes for each model
    if (config.database?.models) {
      for (const model of config.database.models) {
        if (!model.name) continue
        const routeContent = this.generateModelRoutes(model)
        files.push({
          path: `src/api/routes/${model.name.toLowerCase()}.ts`,
          content: routeContent,
          type: 'code',
          language: 'typescript',
          dependencies: ['@opsai/database', '@opsai/auth', 'express']
        })
      }
    }

    // Generate main API file
    const mainApiContent = this.generateMainApiFile(config)
    files.push({
      path: 'src/api/server.ts',
      content: mainApiContent,
      type: 'code',
      language: 'typescript',
      dependencies: ['express', 'cors', 'helmet', '@opsai/auth']
    })

    return files
  }

  /**
   * Generate UI components
   */
  private async generateUIComponents(config: YamlConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = []

    // Generate dashboard components (simplified - always generate)
    const dashboardContent = this.generateDashboardComponent(config)
    files.push({
      path: 'src/components/Dashboard.tsx',
      content: dashboardContent,
      type: 'code',
      language: 'typescript',
      dependencies: ['react', 'chart.js', '@opsai/ui']
    })

    // Generate form components
    if (config.database?.models) {
      for (const model of config.database.models) {
        if (!model.name) continue
        const formContent = this.generateFormComponent(model)
        files.push({
          path: `src/components/forms/${model.name}Form.tsx`,
          content: formContent,
          type: 'code',
          language: 'typescript',
          dependencies: ['react', 'react-hook-form', '@opsai/ui']
        })
      }
    }

    return files
  }

  /**
   * Generate workflows
   */
  private async generateWorkflows(config: YamlConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = []

    if (config.workflows) {
      for (const workflow of config.workflows) {
        if (!workflow.name) continue
        const workflowContent = this.generateWorkflowCode(workflow)
        files.push({
          path: `src/workflows/${workflow.name.toLowerCase()}.ts`,
          content: workflowContent,
          type: 'code',
          language: 'typescript',
          dependencies: ['@opsai/workflow', '@opsai/database']
        })
      }
    }

    return files
  }

  /**
   * Generate deployment configuration
   */
  private async generateDeploymentConfig(config: YamlConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = []

    // Generate Docker configuration
    const dockerfile = this.generateDockerfile(config)
    files.push({
      path: 'Dockerfile',
      content: dockerfile,
      type: 'config',
      language: 'dockerfile'
    })

    // Generate docker-compose
    const dockerCompose = this.generateDockerCompose(config)
    files.push({
      path: 'docker-compose.yml',
      content: dockerCompose,
      type: 'config',
      language: 'yaml'
    })

    // Generate deployment scripts
    const deployScript = this.generateDeployScript(config)
    files.push({
      path: 'deploy.sh',
      content: deployScript,
      type: 'config',
      language: 'bash'
    })

    return files
  }

  /**
   * Generate documentation
   */
  private async generateDocumentation(config: YamlConfig): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = []

    // Generate README
    const readme = this.generateReadme(config)
    files.push({
      path: 'README.md',
      content: readme,
      type: 'documentation',
      language: 'markdown'
    })

    // Generate API documentation
    const apiDocs = this.generateApiDocs(config)
    files.push({
      path: 'docs/api.md',
      content: apiDocs,
      type: 'documentation',
      language: 'markdown'
    })

    return files
  }

  /**
   * Helper methods for code generation
   */
  private mapFieldType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'String',
      number: 'Int',
      integer: 'Int',
      boolean: 'Boolean',
      date: 'DateTime',
      datetime: 'DateTime',
      json: 'Json',
      enum: 'String'
    }
    return typeMap[type] || 'String'
  }


  private generateMigrations(config: YamlConfig): string {
    // Implementation would generate SQL migrations
    return `-- Generated migrations for ${config.business?.name || 'Application'}`
  }

  private generateModelRoutes(model: any): string {
    return `// Generated routes for ${model.name}`
  }

  private generateMainApiFile(config: YamlConfig): string {
    return `// Generated main API file for ${config.business?.name || 'Application'}`
  }

  private generateDashboardComponent(config: YamlConfig): string {
    return `// Generated dashboard component for ${config.business?.name || 'Application'}`
  }

  private generateFormComponent(model: { name?: string }): string {
    return `// Generated form component for ${model.name}`
  }

  private generateWorkflowCode(workflow: any): string {
    return `// Generated workflow code for ${workflow.name}`
  }

  private generateDockerfile(config: YamlConfig): string {
    return `# Generated Dockerfile for ${config.business?.name || 'Application'}`
  }

  private generateDockerCompose(config: YamlConfig): string {
    return `# Generated docker-compose for ${config.business?.name || 'Application'}`
  }

  private generateDeployScript(config: YamlConfig): string {
    return `#!/bin/bash\n# Generated deploy script for ${config.business?.name || 'Application'}`
  }

  private generateReadme(config: YamlConfig): string {
    return `# ${config.business?.name || 'Application'}\n\n${config.business?.description || 'Generated application'}`
  }

  private generateApiDocs(config: YamlConfig): string {
    return `# API Documentation\n\nGenerated API docs for ${config.business?.name || 'Application'}`
  }

  /**
   * Template methods
   */
  private getEcommerceTemplate(): string {
    return `vertical:
  name: "E-commerce"
  description: "Online retail platform"
  industry: "retail"

business:
  name: "MyStore"
  description: "Online store for electronics"
  domain: "mystore.com"

database:
  models:
    - name: "Product"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "name"
          type: "string"
          required: true
        - name: "price"
          type: "number"
          required: true
        - name: "description"
          type: "string"
        - name: "category"
          type: "string"
          required: true
        - name: "stock"
          type: "integer"
          required: true
        - name: "imageUrl"
          type: "string"
      relations:
        - name: "orderItems"
          type: "hasMany"
          fields: ["id"]
          references: ["productId"]

    - name: "Order"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "customerId"
          type: "string"
          required: true
        - name: "status"
          type: "string"
          required: true
        - name: "total"
          type: "number"
          required: true
        - name: "createdAt"
          type: "datetime"
          required: true

    - name: "Customer"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "email"
          type: "string"
          required: true
          unique: true
        - name: "name"
          type: "string"
          required: true
        - name: "phone"
          type: "string"

ui:
  theme:
    primary: "#3B82F6"
    secondary: "#6B7280"
  dashboard:
    widgets:
      - type: "chart"
        title: "Sales Overview"
        data: "orders.total"
      - type: "table"
        title: "Recent Orders"
        data: "orders"
      - type: "metric"
        title: "Total Revenue"
        data: "orders.total"

deployment:
  platform: "vercel"
  environment: "production"
  autoDeploy: true

features:
  authentication: true
  multiTenancy: false
  fileUpload: true
  realTimeUpdates: true
  analytics: true
  notifications: true`
  }

  private getCrmTemplate(): string {
    return `vertical:
  name: "CRM"
  description: "Customer Relationship Management"
  industry: "business"

business:
  name: "SalesPro"
  description: "Sales and customer management platform"
  domain: "salespro.com"

database:
  models:
    - name: "Contact"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "firstName"
          type: "string"
          required: true
        - name: "lastName"
          type: "string"
          required: true
        - name: "email"
          type: "string"
          required: true
        - name: "phone"
          type: "string"
        - name: "company"
          type: "string"

    - name: "Lead"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "contactId"
          type: "string"
          required: true
        - name: "source"
          type: "string"
          required: true
        - name: "status"
          type: "string"
          required: true
        - name: "value"
          type: "number"

    - name: "Deal"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "leadId"
          type: "string"
          required: true
        - name: "amount"
          type: "number"
          required: true
        - name: "stage"
          type: "string"
          required: true
        - name: "closeDate"
          type: "date"

ui:
  theme:
    primary: "#10B981"
    secondary: "#6B7280"
  dashboard:
    widgets:
      - type: "chart"
        title: "Sales Pipeline"
        data: "deals.stage"
      - type: "table"
        title: "Recent Leads"
        data: "leads"
      - type: "metric"
        title: "Total Pipeline Value"
        data: "deals.amount"

deployment:
  platform: "vercel"
  environment: "production"
  autoDeploy: true

features:
  authentication: true
  multiTenancy: true
  fileUpload: false
  realTimeUpdates: true
  analytics: true
  notifications: true`
  }

  private getRestaurantTemplate(): string {
    return `vertical:
  name: "Restaurant"
  description: "Restaurant Management System"
  industry: "hospitality"

business:
  name: "TastyBites"
  description: "Restaurant management and ordering system"
  domain: "tastybites.com"

database:
  models:
    - name: "MenuItem"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "name"
          type: "string"
          required: true
        - name: "description"
          type: "string"
        - name: "price"
          type: "number"
          required: true
        - name: "category"
          type: "string"
          required: true
        - name: "imageUrl"
          type: "string"
        - name: "available"
          type: "boolean"
          required: true

    - name: "Order"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "customerName"
          type: "string"
          required: true
        - name: "items"
          type: "json"
          required: true
        - name: "total"
          type: "number"
          required: true
        - name: "status"
          type: "string"
          required: true
        - name: "createdAt"
          type: "datetime"
          required: true

    - name: "Reservation"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "customerName"
          type: "string"
          required: true
        - name: "email"
          type: "string"
          required: true
        - name: "phone"
          type: "string"
          required: true
        - name: "date"
          type: "date"
          required: true
        - name: "time"
          type: "string"
          required: true
        - name: "guests"
          type: "integer"
          required: true

ui:
  theme:
    primary: "#F59E0B"
    secondary: "#6B7280"
  dashboard:
    widgets:
      - type: "chart"
        title: "Daily Orders"
        data: "orders.createdAt"
      - type: "table"
        title: "Today's Reservations"
        data: "reservations"
      - type: "metric"
        title: "Total Revenue"
        data: "orders.total"

deployment:
  platform: "vercel"
  environment: "production"
  autoDeploy: true

features:
  authentication: true
  multiTenancy: false
  fileUpload: true
  realTimeUpdates: true
  analytics: true
  notifications: true`
  }

  private getSaaSTemplate(): string {
    return `vertical:
  name: "SaaS"
  description: "Software as a Service Platform"
  industry: "technology"

business:
  name: "CloudApp"
  description: "Multi-tenant SaaS platform"
  domain: "cloudapp.com"

database:
  models:
    - name: "Tenant"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "name"
          type: "string"
          required: true
        - name: "domain"
          type: "string"
          required: true
          unique: true
        - name: "plan"
          type: "string"
          required: true
        - name: "status"
          type: "string"
          required: true

    - name: "User"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "tenantId"
          type: "string"
          required: true
        - name: "email"
          type: "string"
          required: true
        - name: "role"
          type: "string"
          required: true
        - name: "status"
          type: "string"
          required: true

    - name: "Subscription"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "tenantId"
          type: "string"
          required: true
        - name: "planId"
          type: "string"
          required: true
        - name: "status"
          type: "string"
          required: true
        - name: "currentPeriodStart"
          type: "datetime"
          required: true
        - name: "currentPeriodEnd"
          type: "datetime"
          required: true

ui:
  theme:
    primary: "#8B5CF6"
    secondary: "#6B7280"
  dashboard:
    widgets:
      - type: "chart"
        title: "Tenant Growth"
        data: "tenants.createdAt"
      - type: "table"
        title: "Active Subscriptions"
        data: "subscriptions"
      - type: "metric"
        title: "Monthly Recurring Revenue"
        data: "subscriptions.amount"

deployment:
  platform: "vercel"
  environment: "production"
  autoDeploy: true

features:
  authentication: true
  multiTenancy: true
  fileUpload: true
  realTimeUpdates: true
  analytics: true
  notifications: true`
  }

  /**
   * Utility methods
   */
  private addTemplate(template: YamlTemplate): void {
    this.templates.set(template.id, template)
  }

  private calculateComplexity(config: YamlConfig): number {
    let complexity = 1

    // Add complexity based on number of models
    if (config.database?.models) {
      complexity += config.database.models.length * 2
    }

    // Add complexity based on features
    if (config.features) {
      if (config.features.multiTenancy) complexity += 3
      if (config.features.fileUpload) complexity += 2
      if (config.features.realTimeUpdates) complexity += 2
      if (config.features.analytics) complexity += 2
    }

    // Add complexity based on workflows
    if (config.workflows) {
      complexity += config.workflows.length * 1.5
    }

    return Math.min(complexity, 10) // Cap at 10
  }

  private estimateDeploymentTime(config: YamlConfig): number {
    const complexity = this.calculateComplexity(config)
    return Math.ceil(complexity * 5) // 5 minutes per complexity point
  }

  private calculateResourceRequirements(config: YamlConfig): ResourceRequirements {
    const complexity = this.calculateComplexity(config)
    
    return {
      cpu: complexity <= 3 ? '0.5' : complexity <= 6 ? '1' : '2',
      memory: complexity <= 3 ? '512Mi' : complexity <= 6 ? '1Gi' : '2Gi',
      storage: complexity <= 3 ? '5Gi' : complexity <= 6 ? '10Gi' : '20Gi',
      database: 'postgresql',
      externalServices: config.features?.fileUpload ? ['storage'] : []
    }
  }


  /**
   * Public methods
   */
  async getTemplates(category?: string): Promise<YamlTemplate[]> {
    const templates = Array.from(this.templates.values())
    if (category) {
      return templates.filter(t => t.category === category)
    }
    return templates
  }

  async getTemplate(id: string): Promise<YamlTemplate | null> {
    return this.templates.get(id) || null
  }

  async addCustomTemplate(template: YamlTemplate): Promise<void> {
    this.addTemplate(template)
  }

  async validateYaml(yamlContent: string): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const yaml = await import('js-yaml')
      const parsed = yaml.load(yamlContent)
      const validation = validateYamlConfigSafe(parsed)
      return {
        valid: validation.success,
        ...(validation.errors && { errors: validation.errors })
      }
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
} 