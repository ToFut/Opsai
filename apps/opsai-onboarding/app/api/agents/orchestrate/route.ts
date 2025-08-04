import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { createClient } from 'redis'

// Initialize system components
let llm: ChatOpenAI | ChatAnthropic | null = null
let redisClient: any = null

function initializeLLM() {
  if (llm) return llm

  if (process.env.OPENAI_API_KEY) {
    llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
    })
  } else if (process.env.ANTHROPIC_API_KEY) {
    llm = new ChatAnthropic({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      modelName: 'claude-3-sonnet-20240229',
      temperature: 0.7,
    })
  }

  return llm
}

async function initializeRedis() {
  if (redisClient?.isOpen) return redisClient

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    })
    await redisClient.connect()
    console.log('✅ Redis connected for agent memory')
    return redisClient
  } catch (error) {
    console.warn('⚠️ Redis connection failed, continuing without memory:', error.message)
    return null
  }
}

// Agent system prompts
const AGENT_PROMPTS = {
  yaml_generator: `You are a YAML Generation Agent specialized in creating application configurations.
When given a natural language description, you create optimal YAML configurations that include:
- Business information and structure
- Required features and functionality
- Database schema with relationships
- API endpoints and authentication
- User interface components
- Integration requirements

Always generate complete, production-ready YAML that follows the OpsAI platform structure.`,

  app_builder: `You are an Application Builder Agent that designs complete applications.
When given a request, you provide:
1. Complete YAML configuration
2. Technology stack recommendations
3. Implementation architecture
4. Deployment strategy
5. Best practices and optimizations

Focus on creating scalable, maintainable solutions.`,

  orchestrator: `You are an Agent Orchestrator that coordinates multiple specialized agents.
Analyze the user's request and determine:
1. Which agents should be involved
2. What sequence to execute them
3. How to combine their outputs
4. What the final deliverable should be`
}

// Main agent processing function
async function processWithAgents(input: string, context: any = {}) {
  const llm = initializeLLM()
  const redis = await initializeRedis()
  
  if (!llm) {
    throw new Error('No LLM configured')
  }

  const startTime = Date.now()
  
  // Determine agent type based on input
  let agentType = 'orchestrator'
  let agentPrompt = AGENT_PROMPTS.orchestrator
  
  if (/yaml|config|configuration/i.test(input) && !/build|create|generate.*app/i.test(input)) {
    agentType = 'yaml_generator'
    agentPrompt = AGENT_PROMPTS.yaml_generator
  } else if (/build|create|generate|make.*app|application|system|platform/i.test(input)) {
    agentType = 'app_builder'
    agentPrompt = AGENT_PROMPTS.app_builder
  }

  // Store request in Redis if available
  if (redis) {
    const requestKey = `agent:request:${Date.now()}`
    await redis.setex(requestKey, 3600, JSON.stringify({
      input,
      context,
      agentType,
      timestamp: new Date().toISOString()
    }))
  }

  // Process with agent
  const messages = [
    new SystemMessage(agentPrompt),
    new HumanMessage(`User Request: ${input}\n\nContext: ${JSON.stringify(context, null, 2)}`)
  ]

  const response = await llm.invoke(messages)
  const result = response.content as string

  // Extract YAML if present
  const yamlMatch = result.match(/```yaml\n([\s\S]*?)\n```/)
  const yaml = yamlMatch ? yamlMatch[1] : null

  // Store result in Redis if available
  if (redis) {
    const resultKey = `agent:result:${Date.now()}`
    await redis.setex(resultKey, 3600, JSON.stringify({
      input,
      result,
      yaml,
      agentType,
      executionTime: Date.now() - startTime
    }))
  }

  return {
    output: result,
    yaml,
    agentType,
    executionTime: Date.now() - startTime,
    memoryEnabled: !!redis
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input, type = 'natural_language', context = {}, preferAgent = true } = body

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 })
    }

    console.log(`🚀 Processing with agent system: "${input.slice(0, 100)}..."`)

    const llm = initializeLLM()
    
    if (!llm) {
      return NextResponse.json({
        success: false,
        output: `⚠️ AI service not configured. Please set up OpenAI or Anthropic API keys.

To enable AI features:
1. Add to your .env.local file:
   OPENAI_API_KEY=your-openai-key
   OR
   ANTHROPIC_API_KEY=your-anthropic-key

2. Restart the development server`,
        executionPath: 'error',
        agentType: 'configuration_required'
      })
    }

    try {
      const result = await processWithAgents(input, context)
      
      return NextResponse.json({
        success: true,
        output: result.output,
        executionPath: 'agent',
        executionTime: result.executionTime,
        agentType: result.agentType,
        insights: [
          `Processed by ${result.agentType.replace('_', ' ')} agent`,
          `Execution time: ${result.executionTime}ms`,
          result.memoryEnabled ? 'Memory system enabled for learning' : 'Running without memory',
          result.yaml ? 'YAML configuration generated' : null
        ].filter(Boolean),
        metadata: {
          yaml: result.yaml,
          memoryEnabled: result.memoryEnabled
        }
      })
      
    } catch (error) {
      console.error('❌ Agent processing error:', error)
      
      // Simple fallback
      const response = await llm.invoke([
        new SystemMessage('You are an AI assistant for the OpsAI platform.'),
        new HumanMessage(input)
      ])
      
      return NextResponse.json({
        success: true,
        output: response.content,
        executionPath: 'direct_llm',
        agentType: 'general',
        insights: ['Processed with direct LLM']
      })
    }

  } catch (error) {
    console.error('❌ Request processing error:', error)
    
    return NextResponse.json({
      error: 'Failed to process request',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const llm = initializeLLM()
  const redis = await initializeRedis()
  
  // Get agent metrics from Redis if available
  let metrics = { totalRequests: 0, avgResponseTime: 0 }
  if (redis) {
    try {
      const keys = await redis.keys('agent:request:*')
      metrics.totalRequests = keys.length
    } catch (error) {
      console.warn('Could not fetch metrics:', error.message)
    }
  }
  
  return NextResponse.json({
    status: llm ? 'operational' : 'configuration_required',
    system: 'agent_system',
    configured: !!llm,
    memory: redis ? 'connected' : 'disconnected',
    model: llm ? (llm instanceof ChatOpenAI ? 'openai' : 'anthropic') : null,
    agents: {
      totalAgents: 3,
      available: [
        { name: 'orchestrator', status: llm ? 'ready' : 'unavailable' },
        { name: 'yaml_generator', status: llm ? 'ready' : 'unavailable' },
        { name: 'app_builder', status: llm ? 'ready' : 'unavailable' }
      ]
    },
    capabilities: [
      'Natural language to application generation',
      'YAML configuration creation',
      'Architecture design and planning',
      'Multi-agent coordination',
      redis ? 'Redis-backed memory and learning' : 'Memory system offline'
    ],
    metrics,
    examples: [
      'Build me a restaurant app with online ordering',
      'Create YAML config for an e-commerce platform',
      'Design architecture for a real-time chat app'
    ]
  })
}

// Cleanup
process.on('SIGTERM', async () => {
  if (redisClient?.isOpen) {
    await redisClient.quit()
  }
})