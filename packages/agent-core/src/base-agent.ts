import { EventEmitter } from 'events'
import { Tool } from 'langchain/tools'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { ConversationBufferMemory } from 'langchain/memory'

export interface AgentTask {
  id: string
  type: string
  objective: string
  parameters?: Record<string, any>
  context?: Record<string, any>
  priority?: number
}

export interface AgentResult {
  taskId: string
  success: boolean
  output: any
  reasoning?: string
  learnings?: any[]
  suggestions?: string[]
  metrics?: Record<string, number>
}

export interface AgentCapability {
  name: string
  description: string
  inputSchema?: Record<string, any>
  outputSchema?: Record<string, any>
}

export interface AgentConfig {
  name: string
  description: string
  model?: ChatOpenAI
  temperature?: number
  maxRetries?: number
}

export abstract class BaseAgent extends EventEmitter {
  public readonly name: string
  public readonly description: string
  protected model: ChatOpenAI
  protected memory: ConversationBufferMemory
  protected tools: Tool[] = []
  protected capabilities: AgentCapability[] = []
  protected experienceLog: any[] = []
  protected performanceMetrics: Record<string, number> = {}

  constructor(config: AgentConfig) {
    super()
    this.name = config.name
    this.description = config.description
    this.model = config.model || new ChatOpenAI({
      temperature: config.temperature || 0.7,
      modelName: 'gpt-4-turbo-preview'
    })
    this.memory = new ConversationBufferMemory()
    this.initialize()
  }

  protected abstract initialize(): void

  public abstract getCapabilities(): AgentCapability[]

  public abstract plan(task: AgentTask): Promise<ExecutionPlan>

  public abstract execute(plan: ExecutionPlan): Promise<AgentResult>

  public async processTask(task: AgentTask): Promise<AgentResult> {
    this.emit('task:start', task)
    
    try {
      // Plan the task
      const plan = await this.plan(task)
      this.emit('task:planned', { task, plan })
      
      // Execute the plan
      const result = await this.execute(plan)
      this.emit('task:completed', { task, result })
      
      // Learn from the experience
      await this.learn(task, result)
      
      // Update metrics
      this.updateMetrics(task, result)
      
      return result
    } catch (error) {
      this.emit('task:error', { task, error })
      return {
        taskId: task.id,
        success: false,
        output: null,
        reasoning: `Error: ${error.message}`
      }
    }
  }

  protected async learn(task: AgentTask, result: AgentResult): Promise<void> {
    const experience = {
      task,
      result,
      timestamp: new Date(),
      success: result.success
    }
    
    this.experienceLog.push(experience)
    
    // Analyze patterns in successful/failed tasks
    if (this.experienceLog.length % 10 === 0) {
      await this.analyzeExperiences()
    }
  }

  protected async analyzeExperiences(): Promise<void> {
    const recentExperiences = this.experienceLog.slice(-50)
    const successRate = recentExperiences.filter(e => e.success).length / recentExperiences.length
    
    this.performanceMetrics.successRate = successRate
    
    // Identify patterns and adapt
    if (successRate < 0.8) {
      this.emit('performance:warning', {
        metric: 'successRate',
        value: successRate,
        threshold: 0.8
      })
    }
  }

  protected updateMetrics(task: AgentTask, result: AgentResult): void {
    // Update task completion metrics
    this.performanceMetrics.totalTasks = (this.performanceMetrics.totalTasks || 0) + 1
    if (result.success) {
      this.performanceMetrics.successfulTasks = (this.performanceMetrics.successfulTasks || 0) + 1
    }
    
    // Emit metrics update
    this.emit('metrics:updated', this.performanceMetrics)
  }

  public async collaborate(agents: BaseAgent[], objective: string): Promise<CollaborationResult> {
    // Enable agents to work together
    const collaborationPlan = await this.planCollaboration(agents, objective)
    return await this.executeCollaboration(collaborationPlan)
  }

  protected async planCollaboration(agents: BaseAgent[], objective: string): Promise<CollaborationPlan> {
    // Default collaboration planning
    return {
      objective,
      agents: agents.map(a => ({ name: a.name, role: 'contributor' })),
      workflow: 'sequential'
    }
  }

  protected async executeCollaboration(plan: CollaborationPlan): Promise<CollaborationResult> {
    // Default collaboration execution
    return {
      success: true,
      outputs: [],
      insights: []
    }
  }

  public getPerformanceMetrics(): Record<string, number> {
    return { ...this.performanceMetrics }
  }

  public async improveCapabilities(): Promise<void> {
    // Analyze performance and adapt
    const metrics = this.getPerformanceMetrics()
    
    if (metrics.successRate < 0.7) {
      // Adjust model parameters
      this.model = new ChatOpenAI({
        temperature: 0.5, // More focused responses
        modelName: 'gpt-4-turbo-preview'
      })
    }
  }

  public async shareKnowledge(recipient: BaseAgent): Promise<void> {
    // Share successful patterns with other agents
    const knowledge = {
      agent: this.name,
      experiences: this.experienceLog.filter(e => e.success).slice(-10),
      patterns: await this.extractPatterns()
    }
    
    await recipient.receiveKnowledge(knowledge)
  }

  public async receiveKnowledge(knowledge: any): Promise<void> {
    // Integrate knowledge from other agents
    this.emit('knowledge:received', knowledge)
  }

  protected async extractPatterns(): Promise<any[]> {
    // Extract successful patterns from experiences
    return []
  }
}

export interface ExecutionPlan {
  steps: PlanStep[]
  estimatedDuration?: number
  requiredTools?: string[]
  dependencies?: string[]
}

export interface PlanStep {
  id: string
  action: string
  description: string
  tool?: string
  parameters?: Record<string, any>
  expectedOutput?: any
}

export interface CollaborationPlan {
  objective: string
  agents: Array<{ name: string; role: string }>
  workflow: 'sequential' | 'parallel' | 'hierarchical'
  tasks?: AgentTask[]
}

export interface CollaborationResult {
  success: boolean
  outputs: any[]
  insights: string[]
  metrics?: Record<string, any>
}