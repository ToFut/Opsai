import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

// Initialize LLM
let llm: ChatOpenAI | ChatAnthropic | null = null

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

const YAML_GENERATION_PROMPT = `You are an expert at generating YAML configurations for business applications.
When given a natural language description, you create optimal YAML configurations that include:
- Business information and type
- Required features and functionality
- Database schema with relationships
- API endpoints
- User interface components
- Integration requirements

Generate a complete, production-ready YAML configuration based on the user's request.
The YAML should follow this structure:

\`\`\`yaml
business:
  name: "Business Name"
  type: "business_type"
  description: "Brief description"

features:
  - name: "Feature Name"
    description: "What it does"
    priority: high/medium/low

database:
  tables:
    - name: "table_name"
      fields:
        - name: "field_name"
          type: "data_type"
          required: true/false
      relationships:
        - type: "relationship_type"
          to: "related_table"

api:
  endpoints:
    - path: "/api/endpoint"
      method: "GET/POST/PUT/DELETE"
      description: "What it does"
      auth: true/false

ui:
  pages:
    - name: "Page Name"
      path: "/path"
      components:
        - type: "component_type"
          props: {}

integrations:
  - type: "integration_type"
    provider: "provider_name"
    features: []
\`\`\`

Make the YAML specific, detailed, and ready for immediate use.`

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 })
    }

    const llm = initializeLLM()
    if (!llm) {
      return NextResponse.json({ 
        error: 'No AI API key configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in environment variables.' 
      }, { status: 500 })
    }

    console.log('🤖 Generating YAML from:', input)

    const messages = [
      new SystemMessage(YAML_GENERATION_PROMPT),
      new HumanMessage(`Generate a complete YAML configuration for: ${input}`)
    ]

    const response = await llm.invoke(messages)
    const content = response.content as string

    // Extract YAML from response
    const yamlMatch = content.match(/```yaml\n([\s\S]*?)\n```/)
    const yamlContent = yamlMatch ? yamlMatch[1] : content

    return NextResponse.json({
      success: true,
      yaml: yamlContent,
      description: input,
      message: 'YAML configuration generated successfully'
    })

  } catch (error) {
    console.error('❌ YAML generation error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      yaml: null
    }, { status: 500 })
  }
}