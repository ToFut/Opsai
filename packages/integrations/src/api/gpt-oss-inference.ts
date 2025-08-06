import { NextRequest, NextResponse } from 'next/server'
import { gptOSSManager } from '../services/gpt-oss-manager'

/**
 * Unified AI inference endpoint using GPT-OSS models
 * Replaces OpenAI API calls with local model inference
 */

interface AIRequest {
  task: 'analyze' | 'generate_yaml' | 'generate_code' | 'improve' | 'workflow'
  prompt: string
  context?: any
  complexity?: 'simple' | 'medium' | 'complex'
  useOpenAIFallback?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: AIRequest = await request.json()
    const { task, prompt, context, complexity = 'medium', useOpenAIFallback = true } = body

    // Select optimal model based on task
    const taskComplexity = getTaskComplexity(task, prompt)
    
    try {
      // Try GPT-OSS first
      const model = await gptOSSManager.selectOptimalModel(taskComplexity)
      
      // Construct enhanced prompt based on task
      const enhancedPrompt = constructTaskPrompt(task, prompt, context)
      
      // Run inference
      const response = await gptOSSManager.inference({
        prompt: enhancedPrompt,
        maxTokens: getMaxTokensForTask(task),
        temperature: getTemperatureForTask(task),
        reasoningEffort: taskComplexity === 'complex' ? 'high' : 'medium'
      })

      // Post-process response based on task
      const processedResponse = await postProcessResponse(task, response)

      return NextResponse.json({
        success: true,
        model: model.id,
        task,
        response: processedResponse,
        metadata: {
          inferenceTime: Date.now(),
          modelUsed: 'gpt-oss',
          complexity: taskComplexity
        }
      })

    } catch (gptError) {
      console.error('GPT-OSS inference failed:', gptError)
      
      // Fallback to OpenAI if enabled
      if (useOpenAIFallback) {
        return await fallbackToOpenAI(task, prompt, context)
      }
      
      throw gptError
    }

  } catch (error) {
    console.error('AI Inference error:', error)
    return NextResponse.json(
      { 
        error: 'AI inference failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getTaskComplexity(task: string, prompt: string): 'simple' | 'medium' | 'complex' {
  // Determine complexity based on task type and prompt length
  const promptLength = prompt.length
  
  switch (task) {
    case 'analyze':
      return promptLength > 5000 ? 'complex' : 'medium'
    case 'generate_yaml':
      return 'complex' // YAML generation requires high accuracy
    case 'generate_code':
      return 'complex' // Code generation needs maximum reasoning
    case 'improve':
      return 'medium'
    case 'workflow':
      return promptLength > 3000 ? 'complex' : 'medium'
    default:
      return 'medium'
  }
}

function constructTaskPrompt(task: string, basePrompt: string, context?: any): string {
  const systemPrompts: Record<string, string> = {
    analyze: `You are an expert business analyst. Analyze the following and provide comprehensive insights in JSON format.`,
    generate_yaml: `You are a YAML configuration expert. Generate a complete, valid YAML configuration following the OpsAI schema.`,
    generate_code: `You are an expert full-stack developer. Generate production-ready Next.js/TypeScript code.`,
    improve: `You are a code optimization expert. Analyze and improve the following code for performance, security, and maintainability.`,
    workflow: `You are a workflow automation expert. Design efficient business process automations.`
  }

  const systemPrompt = systemPrompts[task] || ''
  
  let enhancedPrompt = `${systemPrompt}\n\n${basePrompt}`
  
  // Add context if provided
  if (context) {
    enhancedPrompt += `\n\nContext:\n${JSON.stringify(context, null, 2)}`
  }
  
  // Add specific formatting instructions
  switch (task) {
    case 'analyze':
    case 'generate_yaml':
      enhancedPrompt += '\n\nProvide your response in valid JSON/YAML format only, no additional text.'
      break
    case 'generate_code':
      enhancedPrompt += '\n\nProvide clean, commented code with proper error handling.'
      break
  }
  
  return enhancedPrompt
}

function getMaxTokensForTask(task: string): number {
  const tokenLimits: Record<string, number> = {
    analyze: 3000,
    generate_yaml: 4000,
    generate_code: 8000,
    improve: 3000,
    workflow: 2000
  }
  return tokenLimits[task] || 2000
}

function getTemperatureForTask(task: string): number {
  const temperatures: Record<string, number> = {
    analyze: 0.3,      // Low creativity, high accuracy
    generate_yaml: 0.2, // Very low creativity, maximum consistency
    generate_code: 0.4, // Balanced
    improve: 0.5,      // Some creativity for improvements
    workflow: 0.4      // Balanced
  }
  return temperatures[task] || 0.5
}

async function postProcessResponse(task: string, response: string): Promise<any> {
  // Clean and validate response based on task
  let processed = response.trim()
  
  switch (task) {
    case 'analyze':
      // Extract JSON from response
      const jsonMatch = processed.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0])
        } catch (e) {
          console.error('Failed to parse JSON response:', e)
        }
      }
      break
      
    case 'generate_yaml':
      // Clean YAML formatting
      processed = processed.replace(/```yaml\n?/g, '').replace(/```\n?/g, '')
      return processed
      
    case 'generate_code':
      // Extract code blocks
      const codeBlocks = processed.match(/```[\s\S]*?```/g) || []
      return {
        code: codeBlocks.map(block => 
          block.replace(/```[a-z]*\n?/g, '').replace(/```\n?/g, '')
        ),
        explanation: processed.replace(/```[\s\S]*?```/g, '').trim()
      }
  }
  
  return processed
}

async function fallbackToOpenAI(task: string, prompt: string, context?: any) {
  const openai = await import('openai')
  const client = new openai.OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: constructTaskPrompt(task, '', context)
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: getTemperatureForTask(task),
    max_tokens: getMaxTokensForTask(task)
  })

  const response = completion.choices[0].message.content || ''
  const processedResponse = await postProcessResponse(task, response)

  return NextResponse.json({
    success: true,
    model: 'gpt-4o',
    task,
    response: processedResponse,
    metadata: {
      inferenceTime: Date.now(),
      modelUsed: 'openai-fallback',
      complexity: 'fallback'
    }
  })
}