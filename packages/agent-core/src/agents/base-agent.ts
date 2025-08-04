import { EventEmitter } from 'events'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { Tool } from '@langchain/core/tools'
import { BaseMessage, HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import Redis from 'redis'

// Schema definitions
export const AgentTaskSchema = z.object({
  id: z.string().default(() => uuidv4()),
  type: z.string(),
  objective: z.string(),
  parameters: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
  priority: z.number().min(1).max(10).default(5),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
})

export const AgentResultSchema = z.object({
  taskId: z.string(),
  success: z.boolean(),
  output: z.any(),
  reasoning: z.string().optional(),
  learnings: z.array(z.any()).optional(),
  suggestions: z.array(z.string()).optional(),
  metrics: z.record(z.number()).optional(),
  executionTime: z.number().optional(),
})

export const AgentCapabilitySchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.any()).optional(),
  outputSchema: z.record(z.any()).optional(),
  complexity: z.number().min(1).max(10).default(5),
})

export const ExecutionPlanSchema = z.object({
  steps: z.array(z.object({
    id: z.string(),
    action: z.string(),
    description: z.string(),
    tool: z.string().optional(),
    parameters: z.record(z.any()).optional(),
    expectedOutput: z.any().optional(),
    dependencies: z.array(z.string()).optional(),
  })),
  estimatedDuration: z.number().optional(),
  requiredTools: z.array(z.string()).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).default('medium'),
})

export type AgentTask = z.infer<typeof AgentTaskSchema>
export type AgentResult = z.infer<typeof AgentResultSchema>
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>
export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>

export interface AgentConfig {
  name: string
  description: string
  model?: 'openai' | 'anthropic'
  modelName?: string
  temperature?: number
  maxRetries?: number
  memorySize?: number
  redisClient?: Redis.RedisClientType
}

export interface AgentMemory {
  shortTerm: BaseMessage[]
  longTerm: any[]
  skills: Record<string, any>
  patterns: Record<string, any>
}

export abstract class BaseAgent extends EventEmitter {
  public readonly id: string
  public readonly name: string
  public readonly description: string
  protected llm: ChatOpenAI | ChatAnthropic
  protected tools: Tool[] = []
  protected capabilities: AgentCapability[] = []
  protected memory: AgentMemory
  protected redis?: Redis.RedisClientType
  protected performanceMetrics: Record<string, number> = {}
  protected config: AgentConfig

  constructor(config: AgentConfig) {
    super()
    this.id = uuidv4()
    this.name = config.name
    this.description = config.description
    this.config = config
    this.redis = config.redisClient

    // Initialize LLM
    if (config.model === 'anthropic') {
      this.llm = new ChatAnthropic({
        temperature: config.temperature || 0.7,
        modelName: config.modelName || 'claude-3-sonnet-20240229',
      })
    } else {
      this.llm = new ChatOpenAI({
        temperature: config.temperature || 0.7,
        modelName: config.modelName || 'gpt-4-turbo-preview',
      })
    }

    // Initialize memory
    this.memory = {
      shortTerm: [],
      longTerm: [],
      skills: {},
      patterns: {}
    }

    this.initialize()
  }

  protected abstract initialize(): void
  public abstract getCapabilities(): AgentCapability[]
  protected abstract createExecutionPlan(task: AgentTask): Promise<ExecutionPlan>
  protected abstract executeStep(step: ExecutionPlan['steps'][0], context: any): Promise<any>

  /**
   * Main task processing method
   */
  public async processTask(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now()
    
    try {
      // Validate task
      const validatedTask = AgentTaskSchema.parse(task)
      
      this.emit('task:start', validatedTask)
      
      // Load relevant memories
      await this.loadRelevantMemories(validatedTask)
      
      // Create execution plan
      const plan = await this.createExecutionPlan(validatedTask)
      this.emit('task:planned', { task: validatedTask, plan })
      
      // Execute the plan
      const result = await this.executePlan(plan, validatedTask)
      
      // Learn from execution
      await this.learn(validatedTask, result)
      
      // Update metrics
      const executionTime = Date.now() - startTime
      result.executionTime = executionTime
      this.updateMetrics(validatedTask, result)
      
      this.emit('task:completed', { task: validatedTask, result })
      
      return result
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorResult: AgentResult = {
        taskId: task.id,
        success: false,
        output: null,
        reasoning: `Execution failed: ${error.message}`,
        executionTime
      }
      
      this.emit('task:error', { task, error, result: errorResult })
      return errorResult
    }
  }

  /**
   * Execute the plan step by step
   */
  protected async executePlan(plan: ExecutionPlan, task: AgentTask): Promise<AgentResult> {
    const stepResults: any[] = []
    let context = { task, previousResults: [] }

    for (const step of plan.steps) {
      try {
        this.emit('step:start', { step, context })
        
        const stepResult = await this.executeStep(step, context)
        stepResults.push(stepResult)
        context.previousResults.push(stepResult)
        
        this.emit('step:completed', { step, result: stepResult })
      } catch (error) {
        this.emit('step:error', { step, error })
        
        // Decide whether to continue or fail
        if (step.dependencies?.length) {
          throw new Error(`Critical step failed: ${step.id}`)
        }
        
        stepResults.push({ error: error.message, step: step.id })
      }
    }

    // Synthesize final result
    const finalOutput = await this.synthesizeResults(stepResults, task)
    
    return {
      taskId: task.id,
      success: true,
      output: finalOutput,
      reasoning: `Completed ${plan.steps.length} steps successfully`,
      metrics: {
        stepsCompleted: stepResults.length,
        stepsSuccessful: stepResults.filter(r => !r.error).length
      }
    }
  }

  /**
   * Synthesize step results into final output
   */
  protected async synthesizeResults(stepResults: any[], task: AgentTask): Promise<any> {
    // Default implementation - can be overridden by specific agents
    return {
      steps: stepResults,
      summary: `Completed task: ${task.objective}`,
      data: stepResults[stepResults.length - 1]
    }
  }

  /**
   * Load relevant memories for the task
   */
  protected async loadRelevantMemories(task: AgentTask): Promise<void> {
    if (!this.redis) return

    try {
      // Load task-specific memories
      const memoryKey = `agent:${this.id}:memories:${task.type}`
      const memories = await this.redis.get(memoryKey)
      
      if (memories) {
        const parsedMemories = JSON.parse(memories)
        this.memory.longTerm.push(...parsedMemories)
      }

      // Load pattern memories
      const patternKey = `agent:${this.id}:patterns`
      const patterns = await this.redis.get(patternKey)
      
      if (patterns) {
        this.memory.patterns = JSON.parse(patterns)
      }
    } catch (error) {
      console.warn('Failed to load memories:', error)
    }
  }

  /**
   * Learn from task execution
   */
  protected async learn(task: AgentTask, result: AgentResult): Promise<void> {
    const experience = {
      task: task.type,
      objective: task.objective,
      success: result.success,
      executionTime: result.executionTime,
      reasoning: result.reasoning,
      timestamp: new Date().toISOString()
    }

    // Store in short-term memory
    this.memory.shortTerm.push(new AIMessage(JSON.stringify(experience)))

    // Keep only recent short-term memories
    if (this.memory.shortTerm.length > (this.config.memorySize || 100)) {
      this.memory.shortTerm = this.memory.shortTerm.slice(-50)
    }

    // Analyze and store patterns
    await this.analyzePatterns()

    // Persist to Redis
    if (this.redis) {
      try {
        const memoryKey = `agent:${this.id}:memories:${task.type}`
        const existingMemories = await this.redis.get(memoryKey)
        const memories = existingMemories ? JSON.parse(existingMemories) : []
        
        memories.push(experience)
        
        // Keep only recent memories per task type
        if (memories.length > 50) {
          memories.splice(0, memories.length - 50)
        }
        
        await this.redis.setex(memoryKey, 86400 * 7, JSON.stringify(memories)) // 7 days

        // Store patterns
        const patternKey = `agent:${this.id}:patterns`
        await this.redis.setex(patternKey, 86400 * 30, JSON.stringify(this.memory.patterns)) // 30 days
        
      } catch (error) {
        console.warn('Failed to persist memories:', error)
      }
    }
  }

  /**
   * Analyze patterns from experiences
   */
  protected async analyzePatterns(): Promise<void> {
    const recentExperiences = this.memory.shortTerm.slice(-20)
    if (recentExperiences.length < 10) return

    try {
      const experiences = recentExperiences.map(msg => JSON.parse(msg.content as string))
      
      // Success rate by task type
      const taskTypes = [...new Set(experiences.map(e => e.task))]
      for (const taskType of taskTypes) {
        const taskExperiences = experiences.filter(e => e.task === taskType)
        const successRate = taskExperiences.filter(e => e.success).length / taskExperiences.length
        
        this.memory.patterns[`${taskType}_success_rate`] = successRate
      }

      // Average execution time by task type
      for (const taskType of taskTypes) {
        const taskExperiences = experiences.filter(e => e.task === taskType && e.executionTime)
        if (taskExperiences.length > 0) {
          const avgTime = taskExperiences.reduce((sum, e) => sum + e.executionTime, 0) / taskExperiences.length
          this.memory.patterns[`${taskType}_avg_time`] = avgTime
        }
      }

      // Emit pattern updates
      this.emit('patterns:updated', this.memory.patterns)
      
    } catch (error) {
      console.warn('Pattern analysis failed:', error)
    }
  }

  /**
   * Update performance metrics
   */
  protected updateMetrics(task: AgentTask, result: AgentResult): void {
    // Update basic metrics
    this.performanceMetrics.totalTasks = (this.performanceMetrics.totalTasks || 0) + 1
    
    if (result.success) {
      this.performanceMetrics.successfulTasks = (this.performanceMetrics.successfulTasks || 0) + 1
    }

    // Calculate success rate
    this.performanceMetrics.successRate = this.performanceMetrics.successfulTasks / this.performanceMetrics.totalTasks

    // Update execution time metrics
    if (result.executionTime) {
      this.performanceMetrics.totalExecutionTime = (this.performanceMetrics.totalExecutionTime || 0) + result.executionTime
      this.performanceMetrics.avgExecutionTime = this.performanceMetrics.totalExecutionTime / this.performanceMetrics.totalTasks
    }

    // Emit metrics update
    this.emit('metrics:updated', this.performanceMetrics)
  }

  /**
   * Collaborate with other agents
   */
  public async collaborate(agents: BaseAgent[], objective: string): Promise<any> {
    const collaborationId = uuidv4()
    
    this.emit('collaboration:start', { id: collaborationId, agents: agents.map(a => a.name), objective })

    try {
      // Plan collaboration
      const plan = await this.planCollaboration(agents, objective)
      
      // Execute collaboration
      const result = await this.executeCollaboration(plan, agents)
      
      this.emit('collaboration:completed', { id: collaborationId, result })
      
      return result
    } catch (error) {
      this.emit('collaboration:error', { id: collaborationId, error })
      throw error
    }
  }

  protected async planCollaboration(agents: BaseAgent[], objective: string): Promise<any> {
    // Default collaboration planning - can be overridden
    return {
      objective,
      agents: agents.map(a => ({ 
        id: a.id, 
        name: a.name, 
        role: 'contributor',
        capabilities: a.getCapabilities()
      })),
      workflow: 'sequential'
    }
  }

  protected async executeCollaboration(plan: any, agents: BaseAgent[]): Promise<any> {
    // Default collaboration execution - can be overridden
    const results = []
    
    for (const agent of agents) {
      const task: AgentTask = {
        id: uuidv4(),
        type: 'collaboration',
        objective: plan.objective,
        context: { plan, previousResults: results }
      }
      
      const result = await agent.processTask(task)
      results.push({ agent: agent.name, result })
    }
    
    return {
      success: true,
      outputs: results,
      insights: [`Collaborated with ${agents.length} agents`]
    }
  }

  /**
   * Improve capabilities based on performance
   */
  public async improveCapabilities(): Promise<void> {
    const metrics = this.getPerformanceMetrics()
    
    // Adjust model parameters based on performance
    if (metrics.successRate < 0.7) {
      // Lower temperature for more focused responses
      const currentTemp = this.llm instanceof ChatOpenAI ? 
        (this.llm as any).temperature : 
        (this.llm as any).temperature
        
      const newTemp = Math.max(0.1, (currentTemp || 0.7) - 0.1)
      
      if (this.llm instanceof ChatOpenAI) {
        this.llm = new ChatOpenAI({
          ...(this.llm as any),
          temperature: newTemp
        })
      } else {
        this.llm = new ChatAnthropic({
          ...(this.llm as any),
          temperature: newTemp
        })
      }
      
      this.emit('capability:improved', { 
        type: 'temperature_adjustment', 
        oldValue: currentTemp, 
        newValue: newTemp 
      })
    }

    // Auto-retry logic improvement
    if (metrics.avgExecutionTime > 30000) { // 30 seconds
      this.config.maxRetries = Math.max(1, (this.config.maxRetries || 3) - 1)
      this.emit('capability:improved', { 
        type: 'retry_optimization', 
        newRetries: this.config.maxRetries 
      })
    }
  }

  /**
   * Share knowledge with another agent
   */
  public async shareKnowledge(recipient: BaseAgent): Promise<void> {
    const knowledge = {
      agent: this.name,
      patterns: this.memory.patterns,
      skills: this.memory.skills,
      recentExperiences: this.memory.shortTerm.slice(-10).map(msg => JSON.parse(msg.content as string)),
      timestamp: new Date().toISOString()
    }
    
    await recipient.receiveKnowledge(knowledge)
    this.emit('knowledge:shared', { recipient: recipient.name, knowledge })
  }

  /**
   * Receive knowledge from another agent
   */
  public async receiveKnowledge(knowledge: any): Promise<void> {
    // Integrate useful patterns
    Object.keys(knowledge.patterns).forEach(key => {
      if (!this.memory.patterns[key] || knowledge.patterns[key] > this.memory.patterns[key]) {
        this.memory.patterns[key] = knowledge.patterns[key]
      }
    })

    // Learn from experiences
    knowledge.recentExperiences?.forEach((exp: any) => {
      this.memory.longTerm.push(exp)
    })

    this.emit('knowledge:received', { from: knowledge.agent, knowledge })
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): Record<string, number> {
    return { ...this.performanceMetrics }
  }

  /**
   * Get agent status
   */
  public getStatus(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      capabilities: this.getCapabilities(),
      metrics: this.performanceMetrics,
      memorySize: this.memory.shortTerm.length,
      patterns: Object.keys(this.memory.patterns).length
    }
  }
}