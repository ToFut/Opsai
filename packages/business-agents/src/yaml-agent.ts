import { BaseAgent, AgentTask, AgentResult, AgentCapability, ExecutionPlan, AgentConfig } from '@opsai/agent-core'
import { Tool } from '@langchain/core/tools'
import { z } from 'zod'
import * as yaml from 'js-yaml'
import { v4 as uuidv4 } from 'uuid'

// YAML-specific schemas
export const YAMLGenerationRequestSchema = z.object({
  description: z.string(),
  appType: z.string().optional(),
  features: z.array(z.string()).optional(),
  constraints: z.record(z.any()).optional(),
  examples: z.array(z.any()).optional(),
})

export const YAMLValidationRequestSchema = z.object({
  yamlContent: z.string(),
  expectedSchema: z.record(z.any()).optional(),
  strict: z.boolean().default(false),
})

export const YAMLOptimizationRequestSchema = z.object({
  yamlContent: z.string(),
  goals: z.array(z.string()).optional(),
  context: z.record(z.any()).optional(),
})

export type YAMLGenerationRequest = z.infer<typeof YAMLGenerationRequestSchema>
export type YAMLValidationRequest = z.infer<typeof YAMLValidationRequestSchema>
export type YAMLOptimizationRequest = z.infer<typeof YAMLOptimizationRequestSchema>

export class YAMLIntelligenceAgent extends BaseAgent {
  private yamlTemplates: Map<string, any> = new Map()
  private successPatterns: Map<string, any> = new Map()

  constructor(config: AgentConfig) {
    super({
      ...config,
      name: 'YAML Intelligence Agent',
      description: 'Expert in YAML generation, validation, and optimization for business applications'
    })
  }

  protected initialize(): void {
    this.tools = this.createYAMLTools()
    this.loadSuccessPatterns()
  }

  public getCapabilities(): AgentCapability[] {
    return [
      {
        name: 'generate_yaml',
        description: 'Generate YAML configurations from natural language descriptions',
        complexity: 7
      },
      {
        name: 'validate_yaml',
        description: 'Validate and fix YAML configurations',
        complexity: 5
      },
      {
        name: 'optimize_yaml',
        description: 'Optimize YAML for performance and best practices',
        complexity: 8
      },
      {
        name: 'learn_patterns',
        description: 'Learn successful YAML patterns from deployments',
        complexity: 9
      },
      {
        name: 'suggest_improvements',
        description: 'Suggest improvements based on industry best practices',
        complexity: 6
      }
    ]
  }

  protected async createExecutionPlan(task: AgentTask): Promise<ExecutionPlan> {
    const steps = []

    switch (task.type) {
      case 'generate_yaml':
        steps.push(
          {
            id: uuidv4(),
            action: 'analyze_requirements',
            description: 'Analyze business requirements and extract key components',
            tool: 'requirement_analyzer',
            parameters: { description: task.objective }
          },
          {
            id: uuidv4(),
            action: 'identify_patterns',
            description: 'Identify successful patterns from memory',
            tool: 'pattern_matcher',
            parameters: { context: task.context }
          },
          {
            id: uuidv4(),
            action: 'generate_structure',
            description: 'Generate optimal YAML structure',
            tool: 'yaml_generator',
            parameters: { requirements: task.parameters }
          },
          {
            id: uuidv4(),
            action: 'validate_output',
            description: 'Validate generated YAML',
            tool: 'yaml_validator'
          }
        )
        break

      case 'validate_yaml':
        steps.push(
          {
            id: uuidv4(),
            action: 'parse_yaml',
            description: 'Parse and check YAML syntax',
            tool: 'yaml_parser'
          },
          {
            id: uuidv4(),
            action: 'validate_schema',
            description: 'Validate against schema requirements',
            tool: 'schema_validator'
          },
          {
            id: uuidv4(),
            action: 'suggest_fixes',
            description: 'Suggest fixes for any issues found',
            tool: 'error_fixer'
          }
        )
        break

      case 'optimize_yaml':
        steps.push(
          {
            id: uuidv4(),
            action: 'analyze_current',
            description: 'Analyze current YAML configuration',
            tool: 'yaml_analyzer'
          },
          {
            id: uuidv4(),
            action: 'identify_optimizations',
            description: 'Identify optimization opportunities',
            tool: 'optimization_finder'
          },
          {
            id: uuidv4(),
            action: 'apply_optimizations',
            description: 'Apply optimizations while preserving functionality',
            tool: 'yaml_optimizer'
          }
        )
        break

      default:
        steps.push({
          id: uuidv4(),
          action: 'general_yaml_task',
          description: 'Handle general YAML-related task',
          tool: 'yaml_processor'
        })
    }

    return {
      steps,
      estimatedDuration: steps.length * 2000, // 2 seconds per step
      requiredTools: steps.map(s => s.tool || '').filter(Boolean),
      riskLevel: 'low'
    }
  }

  protected async executeStep(step: ExecutionPlan['steps'][0], context: any): Promise<any> {
    const tool = this.tools.find(t => t.name === step.tool)
    
    if (!tool) {
      return await this.executeStepWithLLM(step, context)
    }

    try {
      const result = await tool.call(JSON.stringify({
        ...step.parameters,
        context,
        step: step.action
      }))

      return JSON.parse(result)
    } catch (error) {
      console.warn(`Tool execution failed for ${step.tool}, falling back to LLM`)
      return await this.executeStepWithLLM(step, context)
    }
  }

  private async executeStepWithLLM(step: ExecutionPlan['steps'][0], context: any): Promise<any> {
    const prompt = this.createPromptForStep(step, context)
    
    const response = await this.llm.invoke([
      {
        role: 'system',
        content: `You are a YAML expert specializing in business application configurations. You understand all YAML formats and can generate, validate, and optimize configurations for any business need.`
      },
      {
        role: 'user',
        content: prompt
      }
    ])

    try {
      return JSON.parse(response.content as string)
    } catch {
      return { result: response.content, success: true }
    }
  }

  private createPromptForStep(step: ExecutionPlan['steps'][0], context: any): string {
    const basePrompt = `Execute step: ${step.action}
Description: ${step.description}
Parameters: ${JSON.stringify(step.parameters || {})}
Context: ${JSON.stringify(context)}`

    switch (step.action) {
      case 'analyze_requirements':
        return `${basePrompt}

Analyze these business requirements and extract:
1. Application type and purpose
2. Required features and components
3. Data models and relationships
4. Integration requirements
5. User roles and permissions
6. Business rules and constraints

Return structured analysis as JSON.`

      case 'identify_patterns':
        return `${basePrompt}

Based on successful patterns in my memory:
${JSON.stringify(Array.from(this.successPatterns.entries()))}

Identify the most relevant patterns for this use case and explain why they would be successful.`

      case 'generate_structure':
        return `${basePrompt}

Generate an optimal YAML configuration structure that includes:
1. Clear, descriptive naming
2. Proper nesting and organization
3. All required sections for the business needs
4. Best practices for maintainability
5. Comments explaining key decisions

Return valid YAML as a string.`

      case 'validate_output':
        return `${basePrompt}

Validate the generated YAML configuration:
1. Check syntax correctness
2. Verify all required fields are present
3. Ensure values are appropriate for their types
4. Check for potential issues or improvements
5. Confirm it meets the original requirements

Return validation results with any suggested fixes.`

      case 'optimize_yaml':
        return `${basePrompt}

Optimize this YAML configuration for:
1. Performance and efficiency
2. Maintainability and readability
3. Security best practices
4. Scalability considerations
5. Industry standards compliance

Return the optimized YAML with explanation of changes.`

      default:
        return basePrompt
    }
  }

  private createYAMLTools(): Tool[] {
    const tools: Tool[] = []

    // Requirement Analyzer Tool
    tools.push(new Tool({
      name: 'requirement_analyzer',
      description: 'Analyze business requirements and extract key components',
      func: async (input: string) => {
        const params = JSON.parse(input)
        
        // Extract key information from description
        const analysis = {
          appType: this.extractAppType(params.description),
          features: this.extractFeatures(params.description),
          dataModels: this.extractDataModels(params.description),
          integrations: this.extractIntegrations(params.description),
          businessRules: this.extractBusinessRules(params.description)
        }

        return JSON.stringify(analysis)
      }
    }))

    // Pattern Matcher Tool
    tools.push(new Tool({
      name: 'pattern_matcher',
      description: 'Find relevant successful patterns from memory',
      func: async (input: string) => {
        const params = JSON.parse(input)
        const relevantPatterns = this.findRelevantPatterns(params.context)
        
        return JSON.stringify({ patterns: relevantPatterns })
      }
    }))

    // YAML Generator Tool
    tools.push(new Tool({
      name: 'yaml_generator',
      description: 'Generate YAML configuration from requirements',
      func: async (input: string) => {
        const params = JSON.parse(input)
        const yamlConfig = await this.generateYAMLFromRequirements(params.requirements)
        
        return JSON.stringify({ yaml: yamlConfig, success: true })
      }
    }))

    // YAML Validator Tool
    tools.push(new Tool({
      name: 'yaml_validator',
      description: 'Validate YAML syntax and structure',
      func: async (input: string) => {
        const params = JSON.parse(input)
        const validation = this.validateYAML(params.yaml || params.yamlContent)
        
        return JSON.stringify(validation)
      }
    }))

    // YAML Optimizer Tool
    tools.push(new Tool({
      name: 'yaml_optimizer',
      description: 'Optimize YAML for best practices',
      func: async (input: string) => {
        const params = JSON.parse(input)
        const optimized = await this.optimizeYAML(params.yaml || params.yamlContent)
        
        return JSON.stringify(optimized)
      }
    }))

    return tools
  }

  private extractAppType(description: string): string {
    const appTypes = [
      { pattern: /restaurant|food|dining|menu/i, type: 'restaurant' },
      { pattern: /ecommerce|shop|store|retail|product/i, type: 'ecommerce' },
      { pattern: /saas|subscription|software.*service/i, type: 'saas' },
      { pattern: /marketplace|platform|multi.*vendor/i, type: 'marketplace' },
      { pattern: /blog|content|cms/i, type: 'content' },
      { pattern: /portfolio|showcase|gallery/i, type: 'portfolio' },
      { pattern: /booking|appointment|reservation/i, type: 'booking' },
      { pattern: /real.*estate|property|listing/i, type: 'real_estate' },
      { pattern: /healthcare|medical|clinic/i, type: 'healthcare' },
      { pattern: /education|learning|course/i, type: 'education' }
    ]

    for (const { pattern, type } of appTypes) {
      if (pattern.test(description)) {
        return type
      }
    }

    return 'custom'
  }

  private extractFeatures(description: string): string[] {
    const features: string[] = []
    
    const featureMap = [
      { pattern: /auth|login|register|user.*account/i, feature: 'authentication' },
      { pattern: /payment|checkout|stripe|paypal/i, feature: 'payments' },
      { pattern: /admin|dashboard|management/i, feature: 'admin_panel' },
      { pattern: /search|filter|sort/i, feature: 'search' },
      { pattern: /email|notification|message/i, feature: 'notifications' },
      { pattern: /review|rating|comment/i, feature: 'reviews' },
      { pattern: /inventory|stock|product.*management/i, feature: 'inventory' },
      { pattern: /report|analytics|dashboard/i, feature: 'analytics' },
      { pattern: /mobile|responsive|app/i, feature: 'mobile_app' },
      { pattern: /api|integration|webhook/i, feature: 'api_integration' },
      { pattern: /chat|support|help/i, feature: 'customer_support' },
      { pattern: /social|share|connect/i, feature: 'social_features' }
    ]

    for (const { pattern, feature } of featureMap) {
      if (pattern.test(description)) {
        features.push(feature)
      }
    }

    return features
  }

  private extractDataModels(description: string): string[] {
    const models: string[] = []
    
    const modelMap = [
      { pattern: /user|customer|account|profile/i, model: 'users' },
      { pattern: /product|item|listing/i, model: 'products' },
      { pattern: /order|purchase|transaction/i, model: 'orders' },
      { pattern: /category|tag|classification/i, model: 'categories' },
      { pattern: /review|rating|feedback/i, model: 'reviews' },
      { pattern: /payment|billing|invoice/i, model: 'payments' },
      { pattern: /inventory|stock|warehouse/i, model: 'inventory' },
      { pattern: /booking|appointment|reservation/i, model: 'bookings' },
      { pattern: /content|post|article|blog/i, model: 'content' },
      { pattern: /message|chat|communication/i, model: 'messages' }
    ]

    for (const { pattern, model } of modelMap) {
      if (pattern.test(description)) {
        models.push(model)
      }
    }

    return models
  }

  private extractIntegrations(description: string): string[] {
    const integrations: string[] = []
    
    const integrationMap = [
      { pattern: /stripe|payment.*processor/i, integration: 'stripe' },
      { pattern: /paypal/i, integration: 'paypal' },
      { pattern: /shopify/i, integration: 'shopify' },
      { pattern: /salesforce|crm/i, integration: 'salesforce' },
      { pattern: /mailchimp|email.*marketing/i, integration: 'mailchimp' },
      { pattern: /google.*analytics/i, integration: 'google_analytics' },
      { pattern: /facebook|social.*media/i, integration: 'social_media' },
      { pattern: /twilio|sms/i, integration: 'twilio' },
      { pattern: /slack|team.*communication/i, integration: 'slack' },
      { pattern: /quickbooks|accounting/i, integration: 'quickbooks' }
    ]

    for (const { pattern, integration } of integrationMap) {
      if (pattern.test(description)) {
        integrations.push(integration)
      }
    }

    return integrations
  }

  private extractBusinessRules(description: string): string[] {
    const rules: string[] = []
    
    // Extract business logic patterns
    if (/subscription|recurring|monthly/i.test(description)) {
      rules.push('recurring_billing')
    }
    if (/inventory.*track|stock.*management/i.test(description)) {
      rules.push('inventory_tracking')
    }
    if (/approval|workflow|process/i.test(description)) {
      rules.push('approval_workflow')
    }
    if (/role|permission|access.*control/i.test(description)) {
      rules.push('role_based_access')
    }
    if (/tax|vat|calculation/i.test(description)) {
      rules.push('tax_calculation')
    }

    return rules
  }

  private findRelevantPatterns(context: any): any[] {
    const patterns: any[] = []
    
    // Search through success patterns
    for (const [key, pattern] of this.successPatterns.entries()) {
      if (this.isPatternRelevant(pattern, context)) {
        patterns.push({
          name: key,
          pattern,
          relevanceScore: this.calculateRelevanceScore(pattern, context)
        })
      }
    }

    // Sort by relevance
    return patterns.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5)
  }

  private isPatternRelevant(pattern: any, context: any): boolean {
    // Simple relevance check - can be enhanced
    if (!pattern.appType || !context.appType) return true
    return pattern.appType === context.appType
  }

  private calculateRelevanceScore(pattern: any, context: any): number {
    let score = 0.5 // Base score
    
    // App type match
    if (pattern.appType === context.appType) score += 0.3
    
    // Feature overlap
    if (pattern.features && context.features) {
      const overlap = pattern.features.filter((f: string) => context.features.includes(f))
      score += (overlap.length / Math.max(pattern.features.length, context.features.length)) * 0.2
    }
    
    return Math.min(score, 1.0)
  }

  private async generateYAMLFromRequirements(requirements: any): Promise<string> {
    const yamlStructure = {
      app: {
        name: requirements.appName || 'My Application',
        type: requirements.appType || 'custom',
        description: requirements.description || ''
      },
      features: requirements.features || [],
      database: {
        type: 'postgresql',
        models: this.generateDataModels(requirements.dataModels || [])
      },
      integrations: this.generateIntegrations(requirements.integrations || []),
      ui: {
        components: this.generateUIComponents(requirements.features || []),
        theme: 'default'
      },
      deployment: {
        type: 'vercel',
        environment: 'production'
      }
    }

    return yaml.dump(yamlStructure, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    })
  }

  private generateDataModels(models: string[]): any {
    const modelDefinitions: any = {}
    
    for (const model of models) {
      switch (model) {
        case 'users':
          modelDefinitions.User = {
            fields: {
              id: { type: 'uuid', primary: true },
              email: { type: 'string', unique: true },
              name: { type: 'string' },
              createdAt: { type: 'datetime' },
              updatedAt: { type: 'datetime' }
            }
          }
          break
        case 'products':
          modelDefinitions.Product = {
            fields: {
              id: { type: 'uuid', primary: true },
              name: { type: 'string' },
              description: { type: 'text' },
              price: { type: 'decimal' },
              categoryId: { type: 'uuid', references: 'Category' },
              createdAt: { type: 'datetime' }
            }
          }
          break
        // Add more model templates
      }
    }
    
    return modelDefinitions
  }

  private generateIntegrations(integrations: string[]): any {
    const integrationConfigs: any = {}
    
    for (const integration of integrations) {
      switch (integration) {
        case 'stripe':
          integrationConfigs.stripe = {
            type: 'payment',
            config: {
              publishableKey: '${STRIPE_PUBLISHABLE_KEY}',
              secretKey: '${STRIPE_SECRET_KEY}'
            }
          }
          break
        case 'google_analytics':
          integrationConfigs.googleAnalytics = {
            type: 'analytics',
            config: {
              trackingId: '${GA_TRACKING_ID}'
            }
          }
          break
        // Add more integration templates
      }
    }
    
    return integrationConfigs
  }

  private generateUIComponents(features: string[]): any {
    const components: any = {}
    
    if (features.includes('authentication')) {
      components.LoginForm = {
        type: 'form',
        fields: ['email', 'password'],
        actions: ['login', 'register']
      }
    }
    
    if (features.includes('products')) {
      components.ProductList = {
        type: 'list',
        dataSource: 'products',
        features: ['search', 'filter', 'pagination']
      }
    }
    
    return components
  }

  private validateYAML(yamlContent: string): any {
    try {
      // Parse YAML
      const parsed = yaml.load(yamlContent)
      
      if (!parsed || typeof parsed !== 'object') {
        return {
          valid: false,
          errors: ['YAML content is not a valid object'],
          suggestions: ['Ensure YAML content is properly structured']
        }
      }

      // Validate structure
      const validation = this.validateYAMLStructure(parsed)
      
      return {
        valid: validation.errors.length === 0,
        errors: validation.errors,
        warnings: validation.warnings,
        suggestions: validation.suggestions,
        parsed
      }
      
    } catch (error) {
      return {
        valid: false,
        errors: [`YAML parsing error: ${error.message}`],
        suggestions: ['Check YAML syntax and formatting']
      }
    }
  }

  private validateYAMLStructure(parsed: any): any {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Required top-level fields
    if (!parsed.app) {
      errors.push('Missing required "app" section')
    } else {
      if (!parsed.app.name) warnings.push('App name not specified')
      if (!parsed.app.type) warnings.push('App type not specified')
    }

    // Database validation
    if (parsed.database) {
      if (!parsed.database.type) {
        warnings.push('Database type not specified')
      }
      if (parsed.database.models && typeof parsed.database.models !== 'object') {
        errors.push('Database models should be an object')
      }
    }

    // Features validation
    if (parsed.features && !Array.isArray(parsed.features)) {
      errors.push('Features should be an array')
    }

    // Generate suggestions
    if (parsed.features?.includes('payments') && !parsed.integrations?.stripe) {
      suggestions.push('Consider adding Stripe integration for payment features')
    }

    return { errors, warnings, suggestions }
  }

  private async optimizeYAML(yamlContent: string): Promise<any> {
    try {
      const parsed = yaml.load(yamlContent)
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid YAML content')
      }

      const optimized = this.applyOptimizations(parsed)
      const optimizedYAML = yaml.dump(optimized, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
      })

      return {
        success: true,
        original: yamlContent,
        optimized: optimizedYAML,
        improvements: this.getOptimizationImprovements(parsed, optimized)
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: ['Fix YAML syntax before optimization']
      }
    }
  }

  private applyOptimizations(config: any): any {
    const optimized = JSON.parse(JSON.stringify(config)) // Deep clone

    // Add missing best practices
    if (optimized.app && !optimized.app.version) {
      optimized.app.version = '1.0.0'
    }

    // Optimize database configuration
    if (optimized.database) {
      if (!optimized.database.indexes) {
        optimized.database.indexes = this.generateOptimalIndexes(optimized.database.models)
      }
      if (!optimized.database.constraints) {
        optimized.database.constraints = this.generateConstraints(optimized.database.models)
      }
    }

    // Add security defaults
    if (!optimized.security) {
      optimized.security = {
        authentication: true,
        cors: {
          enabled: true,
          origins: ['localhost:3000']
        },
        rateLimit: {
          enabled: true,
          maxRequests: 100,
          windowMs: 900000 // 15 minutes
        }
      }
    }

    // Add monitoring
    if (!optimized.monitoring) {
      optimized.monitoring = {
        logging: true,
        metrics: true,
        healthChecks: true
      }
    }

    return optimized
  }

  private generateOptimalIndexes(models: any): any {
    if (!models) return {}
    
    const indexes: any = {}
    
    for (const [modelName, model] of Object.entries(models)) {
      const modelIndexes: string[] = []
      
      if (model && typeof model === 'object' && model.fields) {
        // Add indexes for foreign keys
        for (const [fieldName, field] of Object.entries(model.fields)) {
          if (field && typeof field === 'object' && field.references) {
            modelIndexes.push(fieldName)
          }
          if (field && typeof field === 'object' && field.unique) {
            modelIndexes.push(fieldName)
          }
        }
      }
      
      if (modelIndexes.length > 0) {
        indexes[modelName] = modelIndexes
      }
    }
    
    return indexes
  }

  private generateConstraints(models: any): any {
    // Generate basic constraints for data integrity
    return {
      foreignKeys: true,
      uniqueConstraints: true,
      notNullConstraints: true
    }
  }

  private getOptimizationImprovements(original: any, optimized: any): string[] {
    const improvements: string[] = []
    
    if (!original.app?.version && optimized.app?.version) {
      improvements.push('Added version tracking for better deployment management')
    }
    
    if (!original.security && optimized.security) {
      improvements.push('Added security configuration with authentication and rate limiting')
    }
    
    if (!original.monitoring && optimized.monitoring) {
      improvements.push('Added monitoring and logging configuration')
    }
    
    if (!original.database?.indexes && optimized.database?.indexes) {
      improvements.push('Added database indexes for better query performance')
    }
    
    return improvements
  }

  private loadSuccessPatterns(): void {
    // Load common successful patterns
    this.successPatterns.set('restaurant_basic', {
      appType: 'restaurant',
      features: ['menu_management', 'ordering', 'payments', 'reservations'],
      successRate: 0.95,
      avgPerformance: 'excellent'
    })

    this.successPatterns.set('ecommerce_standard', {
      appType: 'ecommerce',
      features: ['product_catalog', 'shopping_cart', 'payments', 'user_accounts'],
      successRate: 0.92,
      avgPerformance: 'excellent'
    })

    this.successPatterns.set('saas_mvp', {
      appType: 'saas',
      features: ['authentication', 'dashboard', 'billing', 'api'],
      successRate: 0.88,
      avgPerformance: 'good'
    })
  }

  protected async synthesizeResults(stepResults: any[], task: AgentTask): Promise<any> {
    const finalResult = stepResults[stepResults.length - 1]
    
    return {
      taskType: task.type,
      success: stepResults.every(r => !r.error),
      output: finalResult,
      steps: stepResults.length,
      insights: this.generateInsights(stepResults, task)
    }
  }

  private generateInsights(stepResults: any[], task: AgentTask): string[] {
    const insights: string[] = []
    
    if (task.type === 'generate_yaml') {
      insights.push('YAML configuration generated with industry best practices')
      
      if (stepResults.some(r => r.patterns)) {
        insights.push('Applied successful patterns from similar applications')
      }
    }
    
    if (task.type === 'optimize_yaml') {
      const optimizations = stepResults.find(r => r.improvements)
      if (optimizations?.improvements?.length > 0) {
        insights.push(`Applied ${optimizations.improvements.length} optimizations`)
      }
    }
    
    return insights
  }
}