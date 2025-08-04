import { EventEmitter } from 'events'
import { AgentOrchestrator, OrchestrationRequest } from '../orchestrator/agent-orchestrator'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

// Import existing OpsAI services (these would be your current services)
interface LegacyServices {
  yamlProcessor?: any
  appGenerator?: any
  integrationService?: any
  workflowEngine?: any
  uiGenerator?: any
}

// Schema definitions
export const HybridRequestSchema = z.object({
  input: z.string(),
  type: z.enum(['natural_language', 'yaml_config', 'api_request']).default('natural_language'),
  context: z.record(z.any()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  preferAgent: z.boolean().default(true),
  maxRetries: z.number().default(3),
})

export const ExecutionStrategySchema = z.object({
  useAgent: z.boolean(),
  fallbackToLegacy: z.boolean(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
})

export type HybridRequest = z.infer<typeof HybridRequestSchema>
export type ExecutionStrategy = z.infer<typeof ExecutionStrategySchema>

export interface HybridResult {
  id: string
  success: boolean
  output: any
  executionPath: 'agent' | 'legacy' | 'hybrid'
  executionTime: number
  strategy: ExecutionStrategy
  insights?: string[]
}

export interface CapabilityMapping {
  pattern: RegExp
  agentObjective: string
  legacyMethod: string
  confidence: number
}

export class HybridExecutor extends EventEmitter {
  private orchestrator: AgentOrchestrator
  private legacyServices: LegacyServices
  private capabilities: CapabilityMapping[] = []
  private performanceMetrics = new Map<string, any>()

  constructor(orchestrator: AgentOrchestrator, legacyServices: LegacyServices) {
    super()
    this.orchestrator = orchestrator
    this.legacyServices = legacyServices
    this.initializeCapabilityMappings()
  }

  /**
   * Main execution method - intelligently routes requests
   */
  async execute(request: HybridRequest): Promise<HybridResult> {
    const startTime = Date.now()
    const executionId = uuidv4()

    try {
      // Validate request
      const validatedRequest = HybridRequestSchema.parse(request)
      
      this.emit('execution:start', { id: executionId, request: validatedRequest })

      // Determine execution strategy
      const strategy = await this.determineStrategy(validatedRequest)
      
      this.emit('strategy:determined', { id: executionId, strategy })

      let result: HybridResult

      if (strategy.useAgent) {
        result = await this.executeWithAgent(executionId, validatedRequest, strategy)
      } else {
        result = await this.executeWithLegacy(executionId, validatedRequest, strategy)
      }

      // Update performance metrics
      this.updatePerformanceMetrics(validatedRequest, result)

      this.emit('execution:completed', result)
      return result

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorResult: HybridResult = {
        id: executionId,
        success: false,
        output: { error: error.message },
        executionPath: 'hybrid',
        executionTime,
        strategy: { useAgent: false, fallbackToLegacy: true, reason: 'execution_error', confidence: 0 }
      }

      this.emit('execution:error', { id: executionId, error, result: errorResult })
      return errorResult
    }
  }

  /**
   * Determine optimal execution strategy
   */
  private async determineStrategy(request: HybridRequest): Promise<ExecutionStrategy> {
    // Check if user explicitly prefers agents
    if (request.preferAgent === false) {
      return {
        useAgent: false,
        fallbackToLegacy: true,
        reason: 'user_preference',
        confidence: 1.0
      }
    }

    // Analyze request complexity and agent capability
    const capability = this.findBestCapability(request.input)
    
    if (!capability) {
      return {
        useAgent: false,
        fallbackToLegacy: true,
        reason: 'no_agent_capability',
        confidence: 0.1
      }
    }

    // Check agent performance history
    const agentPerformance = this.getAgentPerformance(capability.agentObjective)
    const legacyPerformance = this.getLegacyPerformance(capability.legacyMethod)

    // Decision logic
    if (agentPerformance.successRate > 0.8 && agentPerformance.avgTime < legacyPerformance.avgTime * 2) {
      return {
        useAgent: true,
        fallbackToLegacy: true,
        reason: 'agent_outperforms',
        confidence: capability.confidence * agentPerformance.successRate
      }
    }

    // Natural language requests strongly favor agents
    if (request.type === 'natural_language' && this.isNaturalLanguageRequest(request.input)) {
      return {
        useAgent: true,
        fallbackToLegacy: true,
        reason: 'natural_language_request',
        confidence: 0.9
      }
    }

    // Complex requests favor agents
    if (this.isComplexRequest(request.input)) {
      return {
        useAgent: true,
        fallbackToLegacy: true,
        reason: 'complex_request',
        confidence: 0.7
      }
    }

    // Default to legacy for simple, structured requests
    return {
      useAgent: false,
      fallbackToLegacy: false,
      reason: 'legacy_preferred',
      confidence: 0.8
    }
  }

  /**
   * Execute using agent system
   */
  private async executeWithAgent(
    id: string, 
    request: HybridRequest, 
    strategy: ExecutionStrategy
  ): Promise<HybridResult> {
    const startTime = Date.now()

    try {
      const orchestrationRequest: OrchestrationRequest = {
        objective: request.input,
        context: request.context,
        userId: request.userId,
        sessionId: request.sessionId
      }

      const result = await this.orchestrator.orchestrate(orchestrationRequest)
      
      const executionTime = Date.now() - startTime

      if (result.success) {
        return {
          id,
          success: true,
          output: result.results[0]?.output || result,
          executionPath: 'agent',
          executionTime,
          strategy,
          insights: result.insights
        }
      } else {
        // Agent failed, try fallback if allowed
        if (strategy.fallbackToLegacy) {
          this.emit('fallback:triggered', { id, reason: 'agent_failure' })
          return await this.executeWithLegacy(id, request, {
            ...strategy,
            useAgent: false,
            reason: 'agent_fallback'
          })
        }

        throw new Error('Agent execution failed and no fallback available')
      }

    } catch (error) {
      // Fallback to legacy if allowed
      if (strategy.fallbackToLegacy) {
        this.emit('fallback:triggered', { id, reason: 'agent_error', error: error.message })
        return await this.executeWithLegacy(id, request, {
          ...strategy,
          useAgent: false,
          reason: 'agent_error_fallback'
        })
      }

      throw error
    }
  }

  /**
   * Execute using legacy system
   */
  private async executeWithLegacy(
    id: string, 
    request: HybridRequest, 
    strategy: ExecutionStrategy
  ): Promise<HybridResult> {
    const startTime = Date.now()

    try {
      // Map request to legacy service call
      const capability = this.findBestCapability(request.input)
      let output

      if (capability) {
        output = await this.callLegacyService(capability.legacyMethod, request)
      } else {
        // Try to parse as YAML if no specific capability
        output = await this.tryYamlProcessing(request)
      }

      const executionTime = Date.now() - startTime

      return {
        id,
        success: true,
        output,
        executionPath: 'legacy',
        executionTime,
        strategy
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      
      return {
        id,
        success: false,
        output: { error: error.message },
        executionPath: 'legacy',
        executionTime,
        strategy
      }
    }
  }

  /**
   * Initialize capability mappings
   */
  private initializeCapabilityMappings(): void {
    this.capabilities = [
      {
        pattern: /(build|create|generate).*(app|application|system)/i,
        agentObjective: 'Generate a complete application based on requirements',
        legacyMethod: 'appGenerator',
        confidence: 0.9
      },
      {
        pattern: /(parse|process|validate).*(yaml|yml|config)/i,
        agentObjective: 'Process and validate YAML configuration',
        legacyMethod: 'yamlProcessor',
        confidence: 0.8
      },
      {
        pattern: /(connect|integrate|sync).*(api|service|system)/i,
        agentObjective: 'Set up integration with external service',
        legacyMethod: 'integrationService',
        confidence: 0.85
      },
      {
        pattern: /(design|create|build).*(ui|interface|component)/i,
        agentObjective: 'Generate user interface components',
        legacyMethod: 'uiGenerator',
        confidence: 0.8
      },
      {
        pattern: /(workflow|process|automation)/i,
        agentObjective: 'Create or optimize business workflow',
        legacyMethod: 'workflowEngine',
        confidence: 0.75
      },
      {
        pattern: /(restaurant|ecommerce|saas|marketplace)/i,
        agentObjective: 'Build industry-specific application',
        legacyMethod: 'appGenerator',
        confidence: 0.95
      }
    ]
  }

  /**
   * Find best capability match for request
   */
  private findBestCapability(input: string): CapabilityMapping | null {
    let bestMatch: CapabilityMapping | null = null
    let bestScore = 0

    for (const capability of this.capabilities) {
      if (capability.pattern.test(input)) {
        const score = capability.confidence
        if (score > bestScore) {
          bestScore = score
          bestMatch = capability
        }
      }
    }

    return bestMatch
  }

  /**
   * Call appropriate legacy service
   */
  private async callLegacyService(method: string, request: HybridRequest): Promise<any> {
    const service = this.legacyServices[method as keyof LegacyServices]
    
    if (!service) {
      throw new Error(`Legacy service ${method} not available`)
    }

    // Convert request to legacy format
    const legacyRequest = this.convertToLegacyFormat(request, method)
    
    // Call legacy service (these would be your actual method calls)
    switch (method) {
      case 'yamlProcessor':
        return await service.process(legacyRequest)
      case 'appGenerator':
        return await service.generate(legacyRequest)
      case 'integrationService':
        return await service.integrate(legacyRequest)
      case 'workflowEngine':
        return await service.execute(legacyRequest)
      case 'uiGenerator':
        return await service.generateUI(legacyRequest)
      default:
        throw new Error(`Unknown legacy method: ${method}`)
    }
  }

  /**
   * Convert hybrid request to legacy format
   */
  private convertToLegacyFormat(request: HybridRequest, method: string): any {
    // This would convert your agent request to whatever format your legacy services expect
    switch (method) {
      case 'yamlProcessor':
        return {
          yaml: request.input,
          context: request.context
        }
      case 'appGenerator':
        return {
          config: this.extractConfigFromNaturalLanguage(request.input),
          options: request.context
        }
      default:
        return {
          input: request.input,
          context: request.context
        }
    }
  }

  /**
   * Try YAML processing as fallback
   */
  private async tryYamlProcessing(request: HybridRequest): Promise<any> {
    if (this.legacyServices.yamlProcessor) {
      try {
        return await this.legacyServices.yamlProcessor.process(request.input)
      } catch (error) {
        // Not valid YAML, return structured error
        return {
          error: 'Unable to process request with available services',
          suggestion: 'Try rephrasing your request or provide YAML configuration'
        }
      }
    }

    throw new Error('No suitable service available for request')
  }

  /**
   * Extract config from natural language (simplified)
   */
  private extractConfigFromNaturalLanguage(input: string): any {
    // This is a simplified version - in reality, you'd use NLP or the agent system
    const config: any = {}

    // Extract app type
    if (/restaurant/i.test(input)) config.type = 'restaurant'
    else if (/ecommerce|shop|store/i.test(input)) config.type = 'ecommerce'
    else if (/saas|subscription/i.test(input)) config.type = 'saas'

    // Extract features
    if (/payment|checkout/i.test(input)) config.features = [...(config.features || []), 'payments']
    if (/user|auth|login/i.test(input)) config.features = [...(config.features || []), 'authentication']
    if (/dashboard|admin/i.test(input)) config.features = [...(config.features || []), 'dashboard']

    return config
  }

  /**
   * Check if request is natural language
   */
  private isNaturalLanguageRequest(input: string): boolean {
    // Simple heuristics
    const hasVerbs = /\b(build|create|make|generate|design|add|remove|update)\b/i.test(input)
    const hasArticles = /\b(a|an|the)\b/i.test(input)
    const hasConjunctions = /\b(and|or|but|with|for)\b/i.test(input)
    
    return hasVerbs && (hasArticles || hasConjunctions)
  }

  /**
   * Check if request is complex
   */
  private isComplexRequest(input: string): boolean {
    // Multiple requirements
    const multipleRequirements = (input.match(/\band\b/gi) || []).length > 2
    
    // Long description
    const longDescription = input.split(' ').length > 20
    
    // Industry-specific terms
    const industryTerms = /\b(analytics|dashboard|integration|workflow|automation|ai|machine learning)\b/i.test(input)
    
    return multipleRequirements || longDescription || industryTerms
  }

  /**
   * Get agent performance metrics
   */
  private getAgentPerformance(objective: string): any {
    const key = `agent:${objective}`
    return this.performanceMetrics.get(key) || {
      successRate: 0.7, // Default assumption
      avgTime: 10000,
      totalRuns: 0
    }
  }

  /**
   * Get legacy performance metrics
   */
  private getLegacyPerformance(method: string): any {
    const key = `legacy:${method}`
    return this.performanceMetrics.get(key) || {
      successRate: 0.9, // Legacy assumed stable
      avgTime: 5000,
      totalRuns: 100
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(request: HybridRequest, result: HybridResult): void {
    const key = result.executionPath === 'agent' ? 
      `agent:${request.input.slice(0, 50)}` : 
      `legacy:${result.strategy.reason}`

    const current = this.performanceMetrics.get(key) || {
      successRate: 0.5,
      avgTime: 0,
      totalRuns: 0
    }

    // Update with exponential moving average
    const alpha = 0.1
    current.successRate = (1 - alpha) * current.successRate + alpha * (result.success ? 1 : 0)
    current.avgTime = (1 - alpha) * current.avgTime + alpha * result.executionTime
    current.totalRuns++

    this.performanceMetrics.set(key, current)
  }

  /**
   * Get system status
   */
  public getStatus(): any {
    const agentStatus = this.orchestrator.getStatus()
    
    return {
      agentSystem: agentStatus,
      legacyServices: Object.keys(this.legacyServices),
      capabilities: this.capabilities.length,
      performanceMetrics: Object.fromEntries(this.performanceMetrics)
    }
  }

  /**
   * Force agent execution (for testing)
   */
  public async forceAgentExecution(request: HybridRequest): Promise<HybridResult> {
    return await this.executeWithAgent(uuidv4(), request, {
      useAgent: true,
      fallbackToLegacy: false,
      reason: 'forced',
      confidence: 1.0
    })
  }

  /**
   * Force legacy execution (for comparison)
   */
  public async forceLegacyExecution(request: HybridRequest): Promise<HybridResult> {
    return await this.executeWithLegacy(uuidv4(), request, {
      useAgent: false,
      fallbackToLegacy: false,
      reason: 'forced',
      confidence: 1.0
    })
  }
}