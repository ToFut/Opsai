import { EventEmitter } from 'events'
import { BaseAgent, AgentTask, AgentResult } from '../agents/base-agent'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import Redis from 'redis'
import { ChatOpenAI } from '@langchain/openai'

// Schema definitions
export const OrchestrationRequestSchema = z.object({
  objective: z.string(),
  context: z.record(z.any()).optional(),
  priority: z.number().min(1).max(10).default(5),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  maxAgents: z.number().default(5),
  timeoutMs: z.number().default(300000), // 5 minutes
})

export const AgentCrewSchema = z.object({
  id: z.string(),
  agents: z.array(z.string()),
  objective: z.string(),
  strategy: z.enum(['sequential', 'parallel', 'hierarchical', 'collaborative']).default('sequential'),
  tasks: z.array(z.any()),
})

export type OrchestrationRequest = z.infer<typeof OrchestrationRequestSchema>
export type AgentCrew = z.infer<typeof AgentCrewSchema>

export interface OrchestrationResult {
  id: string
  success: boolean
  results: AgentResult[]
  insights: string[]
  executionTime: number
  agentsUsed: string[]
}

export interface AgentRegistration {
  agent: BaseAgent
  capabilities: string[]
  lastUsed: Date
  successRate: number
  avgExecutionTime: number
}

export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, AgentRegistration> = new Map()
  private activeCrews: Map<string, AgentCrew> = new Map()
  private redis?: Redis.RedisClientType
  private strategist: ChatOpenAI
  
  constructor(redisClient?: Redis.RedisClientType) {
    super()
    this.redis = redisClient
    
    // Strategic planning LLM
    this.strategist = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.3, // More focused for planning
    })
  }

  /**
   * Register an agent with the orchestrator
   */
  public async registerAgent(agent: BaseAgent): Promise<void> {
    const capabilities = agent.getCapabilities().map(c => c.name)
    
    const registration: AgentRegistration = {
      agent,
      capabilities,
      lastUsed: new Date(),
      successRate: 1.0,
      avgExecutionTime: 5000
    }

    this.agents.set(agent.name, registration)
    
    // Set up event listeners
    agent.on('task:completed', (data) => {
      this.updateAgentMetrics(agent.name, data.result)
    })

    agent.on('task:error', (data) => {
      this.updateAgentMetrics(agent.name, data.result)
    })

    this.emit('agent:registered', { name: agent.name, capabilities })
    
    // Persist agent registry
    await this.persistAgentRegistry()
  }

  /**
   * Main orchestration method - handles any request intelligently
   */
  public async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now()
    const orchestrationId = uuidv4()
    
    try {
      // Validate request
      const validatedRequest = OrchestrationRequestSchema.parse(request)
      
      this.emit('orchestration:start', { id: orchestrationId, request: validatedRequest })
      
      // Analyze the request and determine strategy
      const strategy = await this.analyzeRequest(validatedRequest)
      
      // Select optimal agents for the task
      const selectedAgents = await this.selectAgents(strategy)
      
      // Create execution plan
      const crew = await this.createCrew(orchestrationId, selectedAgents, strategy)
      
      // Execute the crew
      const results = await this.executeCrew(crew)
      
      // Synthesize final result
      const finalResult = await this.synthesizeResults(results, strategy)
      
      const executionTime = Date.now() - startTime
      
      const orchestrationResult: OrchestrationResult = {
        id: orchestrationId,
        success: results.every(r => r.success),
        results,
        insights: finalResult.insights,
        executionTime,
        agentsUsed: selectedAgents.map(a => a.name)
      }

      this.emit('orchestration:completed', orchestrationResult)
      
      // Learn from this orchestration
      await this.learnFromOrchestration(validatedRequest, orchestrationResult)
      
      return orchestrationResult
      
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorResult: OrchestrationResult = {
        id: orchestrationId,
        success: false,
        results: [],
        insights: [`Orchestration failed: ${error.message}`],
        executionTime,
        agentsUsed: []
      }
      
      this.emit('orchestration:error', { id: orchestrationId, error, result: errorResult })
      return errorResult
    }
  }

  /**
   * Analyze request and determine optimal strategy
   */
  private async analyzeRequest(request: OrchestrationRequest): Promise<any> {
    const analysisPrompt = `
Analyze this business request and determine the optimal execution strategy:

Objective: ${request.objective}
Context: ${JSON.stringify(request.context || {})}

Available agent types:
${Array.from(this.agents.keys()).map(name => {
  const reg = this.agents.get(name)!
  return `- ${name}: ${reg.capabilities.join(', ')}`
}).join('\n')}

Determine:
1. What type of task this is (app_generation, business_analysis, integration_setup, etc.)
2. Which agents would be most effective
3. What execution strategy (sequential, parallel, collaborative)
4. What the key deliverables should be
5. Any risks or challenges

Respond in JSON format:
{
  "taskType": "string",
  "recommendedAgents": ["agent1", "agent2"],
  "strategy": "sequential|parallel|collaborative",
  "deliverables": ["deliverable1", "deliverable2"],
  "estimatedComplexity": 1-10,
  "risks": ["risk1", "risk2"]
}
`

    const response = await this.strategist.invoke([
      { role: 'system', content: 'You are a strategic AI that optimizes agent task allocation.' },
      { role: 'user', content: analysisPrompt }
    ])

    try {
      return JSON.parse(response.content as string)
    } catch (error) {
      // Fallback strategy
      return {
        taskType: 'general',
        recommendedAgents: Array.from(this.agents.keys()).slice(0, 3),
        strategy: 'sequential',
        deliverables: ['analysis', 'implementation'],
        estimatedComplexity: 5,
        risks: ['unknown_requirements']
      }
    }
  }

  /**
   * Select optimal agents based on strategy
   */
  private async selectAgents(strategy: any): Promise<BaseAgent[]> {
    const selectedAgents: BaseAgent[] = []
    
    for (const agentName of strategy.recommendedAgents) {
      const registration = this.agents.get(agentName)
      if (registration) {
        selectedAgents.push(registration.agent)
      }
    }

    // If no specific agents recommended, use best performing agents
    if (selectedAgents.length === 0) {
      const sortedAgents = Array.from(this.agents.values())
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 3)
      
      selectedAgents.push(...sortedAgents.map(reg => reg.agent))
    }

    return selectedAgents
  }

  /**
   * Create agent crew for execution
   */
  private async createCrew(id: string, agents: BaseAgent[], strategy: any): Promise<AgentCrew> {
    const tasks = await this.decomposeTasks(strategy)
    
    const crew: AgentCrew = {
      id,
      agents: agents.map(a => a.name),
      objective: strategy.objective || 'Execute business task',
      strategy: strategy.strategy || 'sequential',
      tasks
    }

    this.activeCrews.set(id, crew)
    return crew
  }

  /**
   * Decompose objective into specific tasks
   */
  private async decomposeTasks(strategy: any): Promise<AgentTask[]> {
    const tasks: AgentTask[] = []
    
    // Generate tasks based on deliverables
    for (let i = 0; i < strategy.deliverables.length; i++) {
      const deliverable = strategy.deliverables[i]
      
      tasks.push({
        id: uuidv4(),
        type: deliverable,
        objective: `Create ${deliverable} for: ${strategy.objective || 'the request'}`,
        parameters: {
          deliverable,
          complexity: strategy.estimatedComplexity,
          taskIndex: i,
          totalTasks: strategy.deliverables.length
        }
      })
    }

    return tasks
  }

  /**
   * Execute the agent crew
   */
  private async executeCrew(crew: AgentCrew): Promise<AgentResult[]> {
    const results: AgentResult[] = []
    
    this.emit('crew:start', crew)
    
    switch (crew.strategy) {
      case 'sequential':
        results.push(...await this.executeSequential(crew))
        break
      case 'parallel':
        results.push(...await this.executeParallel(crew))
        break
      case 'collaborative':
        results.push(...await this.executeCollaborative(crew))
        break
      default:
        results.push(...await this.executeSequential(crew))
    }

    this.emit('crew:completed', { crew, results })
    return results
  }

  /**
   * Execute tasks sequentially
   */
  private async executeSequential(crew: AgentCrew): Promise<AgentResult[]> {
    const results: AgentResult[] = []
    let context = {}

    for (let i = 0; i < crew.tasks.length; i++) {
      const task = crew.tasks[i]
      const agentName = crew.agents[i % crew.agents.length]
      const agent = this.agents.get(agentName)?.agent

      if (!agent) continue

      // Add context from previous tasks
      task.context = { ...task.context, previousResults: results, ...context }

      const result = await agent.processTask(task)
      results.push(result)

      // Update context for next task
      if (result.success) {
        context = { ...context, [`task_${i}_output`]: result.output }
      }

      this.emit('crew:task_completed', { crew, task, result, agent: agentName })
    }

    return results
  }

  /**
   * Execute tasks in parallel
   */
  private async executeParallel(crew: AgentCrew): Promise<AgentResult[]> {
    const promises = crew.tasks.map(async (task, index) => {
      const agentName = crew.agents[index % crew.agents.length]
      const agent = this.agents.get(agentName)?.agent

      if (!agent) {
        return {
          taskId: task.id,
          success: false,
          output: null,
          reasoning: 'Agent not found'
        }
      }

      return await agent.processTask(task)
    })

    const results = await Promise.all(promises)
    return results
  }

  /**
   * Execute tasks collaboratively
   */
  private async executeCollaborative(crew: AgentCrew): Promise<AgentResult[]> {
    const agents = crew.agents
      .map(name => this.agents.get(name)?.agent)
      .filter(Boolean) as BaseAgent[]

    if (agents.length === 0) return []

    // Use the first agent to coordinate collaboration
    const coordinator = agents[0]
    const collaborators = agents.slice(1)

    const collaborationResult = await coordinator.collaborate(
      collaborators, 
      crew.objective
    )

    return [{
      taskId: crew.id,
      success: true,
      output: collaborationResult,
      reasoning: 'Collaborative execution completed'
    }]
  }

  /**
   * Synthesize results from multiple agents
   */
  private async synthesizeResults(results: AgentResult[], strategy: any): Promise<any> {
    const successfulResults = results.filter(r => r.success)
    const insights: string[] = []

    // Generate insights
    insights.push(`Completed ${successfulResults.length}/${results.length} tasks successfully`)
    
    if (strategy.estimatedComplexity > 7) {
      insights.push('High complexity task completed')
    }

    const avgExecutionTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length
    insights.push(`Average execution time: ${Math.round(avgExecutionTime)}ms`)

    // Combine outputs intelligently
    const combinedOutput = successfulResults.map(r => r.output)

    return {
      insights,
      output: combinedOutput,
      summary: `Task completed with ${strategy.strategy} strategy`
    }
  }

  /**
   * Update agent performance metrics
   */
  private updateAgentMetrics(agentName: string, result: AgentResult): void {
    const registration = this.agents.get(agentName)
    if (!registration) return

    // Update success rate (using exponential moving average)
    const alpha = 0.1 // smoothing factor
    registration.successRate = (1 - alpha) * registration.successRate + alpha * (result.success ? 1 : 0)

    // Update average execution time
    if (result.executionTime) {
      registration.avgExecutionTime = (1 - alpha) * registration.avgExecutionTime + alpha * result.executionTime
    }

    registration.lastUsed = new Date()
  }

  /**
   * Learn from orchestration patterns
   */
  private async learnFromOrchestration(
    request: OrchestrationRequest, 
    result: OrchestrationResult
  ): Promise<void> {
    if (!this.redis) return

    try {
      const learningData = {
        objective: request.objective,
        agentsUsed: result.agentsUsed,
        success: result.success,
        executionTime: result.executionTime,
        timestamp: new Date().toISOString()
      }

      // Store orchestration pattern
      const patternKey = `orchestration:patterns:${Date.now()}`
      await this.redis.setex(patternKey, 86400 * 30, JSON.stringify(learningData)) // 30 days

      // Update success statistics
      const statsKey = 'orchestration:stats'
      const stats = await this.redis.get(statsKey)
      const currentStats = stats ? JSON.parse(stats) : { total: 0, successful: 0 }
      
      currentStats.total++
      if (result.success) currentStats.successful++
      
      await this.redis.setex(statsKey, 86400 * 365, JSON.stringify(currentStats)) // 1 year

    } catch (error) {
      console.warn('Failed to persist orchestration learning:', error)
    }
  }

  /**
   * Persist agent registry
   */
  private async persistAgentRegistry(): Promise<void> {
    if (!this.redis) return

    try {
      const registry = {}
      for (const [name, reg] of this.agents.entries()) {
        registry[name] = {
          capabilities: reg.capabilities,
          successRate: reg.successRate,
          avgExecutionTime: reg.avgExecutionTime,
          lastUsed: reg.lastUsed.toISOString()
        }
      }

      await this.redis.setex('agent:registry', 86400 * 7, JSON.stringify(registry)) // 7 days
    } catch (error) {
      console.warn('Failed to persist agent registry:', error)
    }
  }

  /**
   * Get orchestrator status
   */
  public getStatus(): any {
    const agentSummary = Array.from(this.agents.entries()).map(([name, reg]) => ({
      name,
      capabilities: reg.capabilities.length,
      successRate: Math.round(reg.successRate * 100),
      avgExecutionTime: Math.round(reg.avgExecutionTime),
      lastUsed: reg.lastUsed
    }))

    return {
      totalAgents: this.agents.size,
      activeCrews: this.activeCrews.size,
      agents: agentSummary
    }
  }

  /**
   * Get agent by name
   */
  public getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name)?.agent
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values()).map(reg => reg.agent)
  }

  /**
   * Remove agent
   */
  public async unregisterAgent(name: string): Promise<void> {
    this.agents.delete(name)
    await this.persistAgentRegistry()
    this.emit('agent:unregistered', { name })
  }
}