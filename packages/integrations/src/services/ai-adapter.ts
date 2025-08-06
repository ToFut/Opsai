/**
 * AI Adapter Service
 * Provides a unified interface for AI operations
 * Automatically selects between GPT-OSS and OpenAI based on:
 * - Task requirements
 * - Model availability
 * - Performance needs
 * - Cost optimization
 */

import { gptOSSManager } from './gpt-oss-manager'
import OpenAI from 'openai'

export interface AIAdapterConfig {
  preferLocalModels: boolean
  openAIApiKey?: string
  maxRetries: number
  timeout: number
}

export interface AITask {
  type: 'analyze' | 'generate' | 'improve' | 'chat'
  input: string
  context?: Record<string, any>
  constraints?: {
    maxTokens?: number
    temperature?: number
    responseFormat?: 'json' | 'text' | 'yaml'
  }
}

export class AIAdapter {
  private config: AIAdapterConfig
  private openai: OpenAI | null = null
  private metrics: Map<string, any> = new Map()

  constructor(config: Partial<AIAdapterConfig> = {}) {
    this.config = {
      preferLocalModels: true,
      maxRetries: 3,
      timeout: 60000,
      ...config
    }

    if (this.config.openAIApiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.openAIApiKey
      })
    }
  }

  /**
   * Main entry point for all AI tasks
   */
  async process(task: AITask): Promise<any> {
    const startTime = Date.now()
    
    try {
      // Determine best model for task
      const modelSelection = await this.selectModel(task)
      
      let result: any
      
      if (modelSelection.useLocal && this.config.preferLocalModels) {
        result = await this.processWithGPTOSS(task, modelSelection.modelSize)
      } else {
        result = await this.processWithOpenAI(task)
      }
      
      // Track metrics
      this.trackMetrics(task.type, modelSelection.provider, Date.now() - startTime)
      
      return result
      
    } catch (error) {
      console.error('AI processing failed:', error)
      
      // Retry with fallback
      if (this.config.preferLocalModels && this.openai) {
        console.log('Falling back to OpenAI...')
        return this.processWithOpenAI(task)
      }
      
      throw error
    }
  }

  /**
   * Intelligent model selection based on task
   */
  private async selectModel(task: AITask): Promise<{
    useLocal: boolean
    provider: 'gpt-oss' | 'openai'
    modelSize?: 'gpt-oss-20b' | 'gpt-oss-120b'
  }> {
    // Check if local models are available
    const status = gptOSSManager.getStatus()
    const hasLocalModels = status.models.some(m => m.loaded)
    
    // Task complexity analysis
    const complexity = this.analyzeTaskComplexity(task)
    
    // Decision logic
    if (!hasLocalModels || !this.config.preferLocalModels) {
      return { useLocal: false, provider: 'openai' }
    }
    
    // Select appropriate local model
    if (complexity === 'high' || task.type === 'generate') {
      return { 
        useLocal: true, 
        provider: 'gpt-oss',
        modelSize: 'gpt-oss-120b' // Use larger model for complex tasks
      }
    } else {
      return { 
        useLocal: true, 
        provider: 'gpt-oss',
        modelSize: 'gpt-oss-20b' // Use smaller model for simple tasks
      }
    }
  }

  /**
   * Process task with GPT-OSS models
   */
  private async processWithGPTOSS(
    task: AITask, 
    modelSize: 'gpt-oss-20b' | 'gpt-oss-120b'
  ): Promise<any> {
    // Ensure model is loaded
    await gptOSSManager.selectOptimalModel(
      this.analyzeTaskComplexity(task) === 'high' ? 'complex' : 'simple'
    )
    
    // Construct prompt
    const prompt = this.constructPrompt(task)
    
    // Run inference
    const response = await gptOSSManager.inference({
      prompt,
      maxTokens: task.constraints?.maxTokens || 2000,
      temperature: task.constraints?.temperature || 0.7,
      reasoningEffort: task.type === 'generate' ? 'high' : 'medium'
    })
    
    // Format response
    return this.formatResponse(response, task.constraints?.responseFormat)
  }

  /**
   * Process task with OpenAI API
   */
  private async processWithOpenAI(task: AITask): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured')
    }
    
    const prompt = this.constructPrompt(task)
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: this.getSystemPrompt(task.type) },
        { role: 'user', content: prompt }
      ],
      max_tokens: task.constraints?.maxTokens || 2000,
      temperature: task.constraints?.temperature || 0.7,
      response_format: task.constraints?.responseFormat === 'json' 
        ? { type: 'json_object' } 
        : undefined
    })
    
    const response = completion.choices[0].message.content || ''
    return this.formatResponse(response, task.constraints?.responseFormat)
  }

  /**
   * Construct optimized prompt for task
   */
  private constructPrompt(task: AITask): string {
    let prompt = task.input
    
    // Add context if provided
    if (task.context) {
      prompt += '\n\nContext:\n' + JSON.stringify(task.context, null, 2)
    }
    
    // Add format instructions
    if (task.constraints?.responseFormat) {
      const formatInstructions = {
        json: 'Respond with valid JSON only.',
        yaml: 'Respond with valid YAML only.',
        text: 'Provide a clear, structured text response.'
      }
      prompt += '\n\n' + formatInstructions[task.constraints.responseFormat]
    }
    
    return prompt
  }

  /**
   * Get system prompt based on task type
   */
  private getSystemPrompt(taskType: string): string {
    const prompts: Record<string, string> = {
      analyze: 'You are an expert analyst. Provide detailed, actionable insights.',
      generate: 'You are an expert developer. Generate high-quality, production-ready code.',
      improve: 'You are an optimization expert. Suggest practical improvements.',
      chat: 'You are a helpful AI assistant. Provide clear, accurate responses.'
    }
    return prompts[taskType] || prompts.chat
  }

  /**
   * Analyze task complexity
   */
  private analyzeTaskComplexity(task: AITask): 'low' | 'medium' | 'high' {
    const factors = [
      task.input.length > 5000 ? 2 : 0,
      task.context ? 1 : 0,
      task.type === 'generate' ? 2 : 0,
      task.constraints?.maxTokens && task.constraints.maxTokens > 4000 ? 1 : 0
    ]
    
    const score = factors.reduce((a, b) => a + b, 0)
    
    if (score >= 4) return 'high'
    if (score >= 2) return 'medium'
    return 'low'
  }

  /**
   * Format response based on requested format
   */
  private formatResponse(response: string, format?: string): any {
    if (!format || format === 'text') {
      return response
    }
    
    if (format === 'json') {
      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      } catch (e) {
        console.error('Failed to parse JSON:', e)
      }
    }
    
    if (format === 'yaml') {
      // Clean YAML formatting
      return response.replace(/```yaml\n?/g, '').replace(/```\n?/g, '')
    }
    
    return response
  }

  /**
   * Track metrics for monitoring
   */
  private trackMetrics(taskType: string, provider: string, duration: number) {
    const key = `${taskType}_${provider}`
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0
      })
    }
    
    const metric = this.metrics.get(key)
    metric.count++
    metric.totalDuration += duration
    metric.avgDuration = metric.totalDuration / metric.count
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  /**
   * Batch process multiple tasks
   */
  async batchProcess(tasks: AITask[]): Promise<any[]> {
    const results = []
    
    for (const task of tasks) {
      try {
        const result = await this.process(task)
        results.push({ success: true, result })
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    return results
  }
}

// Singleton instance
export const aiAdapter = new AIAdapter({
  preferLocalModels: process.env.USE_LOCAL_MODELS === 'true',
  openAIApiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 60000
})