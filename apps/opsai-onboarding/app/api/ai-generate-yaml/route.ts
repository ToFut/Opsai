import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

interface YAMLGenerationRequest {
  businessAnalysis: any
  confirmedInsights: any
  businessProfile: any
  customizations?: any
}

export async function POST(request: NextRequest) {
  try {
    const { businessAnalysis, confirmedInsights, businessProfile, customizations }: YAMLGenerationRequest = await request.json()

    if (!businessAnalysis || !confirmedInsights) {
      return NextResponse.json({ error: 'Business analysis and confirmed insights are required' }, { status: 400 })
    }

    console.log(`🤖 Starting AI YAML generation for: ${businessProfile.businessName}`)

    // Stage 2: Generate Custom YAML Configuration
    const yamlConfig = await generateYAMLWithAI(businessAnalysis, confirmedInsights, businessProfile, customizations)

    return NextResponse.json({
      success: true,
      yaml: yamlConfig.yaml,
      config: yamlConfig.structured,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o',
        stage: 'yaml_generation'
      }
    })

  } catch (error) {
    console.error('AI YAML Generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate YAML configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to try parsing JSON with various cleanup strategies
async function tryParseJson(jsonString: string): Promise<any | null> {
  const strategies = [
    // Strategy 1: Parse as-is
    (str: string) => JSON.parse(str),
    
    // Strategy 2: Remove trailing commas
    (str: string) => JSON.parse(str.replace(/,(\s*[}\]])/g, '$1')),
    
    // Strategy 3: Quote unquoted keys and remove trailing commas
    (str: string) => JSON.parse(
      str.replace(/,(\s*[}\]])/g, '$1')
         .replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '"$1":')
    ),
    
    // Strategy 4: Fix common formatting issues
    (str: string) => {
      let cleaned = str
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '"$1":') // Quote keys
        .replace(/'/g, '"') // Replace single quotes
        .replace(/:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([,}\]])/g, ': "$1"$2') // Quote unquoted string values
      return JSON.parse(cleaned)
    },
    
    // Strategy 5: Try to fix truncated JSON by adding missing closing braces
    (str: string) => {
      let braceCount = 0
      let cleanStr = str.replace(/,(\s*[}\]])/g, '$1')
      
      for (const char of cleanStr) {
        if (char === '{') braceCount++
        else if (char === '}') braceCount--
      }
      
      // Add missing closing braces
      while (braceCount > 0) {
        cleanStr += '}'
        braceCount--
      }
      
      return JSON.parse(cleanStr)
    }
  ]
  
  for (const strategy of strategies) {
    try {
      const result = strategy(jsonString.trim())
      console.log('✅ JSON parsing strategy succeeded')
      return result
    } catch (e) {
      // Continue to next strategy
      continue
    }
  }
  
  console.log('❌ All JSON parsing strategies failed')
  return null
}

async function generateYAMLWithAI(businessAnalysis: any, confirmedInsights: any, businessProfile: any, customizations: any = {}) {
  const yamlPrompt = `
You are an expert software architect. Generate a HIGHLY CUSTOMIZED YAML configuration for this specific business.

BUSINESS INTELLIGENCE:
- Name: ${businessProfile.businessName}
- Industry: ${confirmedInsights.businessIntelligence?.industryCategory || businessProfile.businessType}
- Business Model: ${confirmedInsights.businessIntelligence?.businessModel || 'General Business'}
- Revenue Streams: ${JSON.stringify(confirmedInsights.businessIntelligence?.revenueStreams || [])}
- Target Audience: ${confirmedInsights.businessIntelligence?.targetAudience || 'General customers'}
- Competitive Advantages: ${JSON.stringify(confirmedInsights.businessIntelligence?.competitiveAdvantages || [])}
- Operational Complexity: ${confirmedInsights.businessIntelligence?.operationalComplexity || 'medium'}
- Scale Requirements: ${confirmedInsights.businessIntelligence?.scalabilityRequirements || 'regional'}

DETAILED DATA MODELS (use these EXACTLY):
${JSON.stringify(confirmedInsights.technicalRequirements?.dataModels || [], null, 2)}

SPECIFIC INTEGRATIONS NEEDED:
${JSON.stringify(confirmedInsights.technicalRequirements?.integrationOpportunities || [], null, 2)}

USER ROLES & PERMISSIONS:
${JSON.stringify(confirmedInsights.userManagement?.userTypes || [], null, 2)}

WORKFLOW REQUIREMENTS:
${JSON.stringify(confirmedInsights.technicalRequirements?.workflowRequirements || [], null, 2)}

CRITICAL UI/UX FEATURES:
${JSON.stringify(confirmedInsights.uiuxRecommendations?.criticalFeatures || [], null, 2)}

COMPLIANCE & SECURITY NEEDS:
${JSON.stringify(confirmedInsights.userManagement?.securityRequirements || {}, null, 2)}

Generate a complete YAML configuration that includes:

1. **Vertical Definition** - Business-specific application metadata
2. **Database Schema** - Complete data models with relationships, validation, and indexes
3. **API Integrations** - Real third-party services with authentication and endpoints
4. **Workflows** - Automated business processes with triggers and steps
5. **User Management** - Role-based access control and authentication
6. **UI Configuration** - Pages, components, and user experiences
7. **Alerts & Notifications** - Business-critical alerts and communication
8. **Deployment Settings** - Production-ready deployment configuration
9. **Security Configuration** - Data protection and compliance settings
10. **Performance Optimization** - Caching, scaling, and monitoring

YAML STRUCTURE REQUIREMENTS:

\`\`\`yaml
# Business Application Configuration
vertical:
  name: [kebab-case-name]
  description: [specific business description]
  version: "1.0.0"
  industry: [specific industry]
  businessModel: [confirmed business model]

business:
  name: [business name]
  type: [business type]
  website: [website URL]
  contact:
    email: [contact email]
    phone: [phone if available]
  settings:
    timezone: [appropriate timezone]
    currency: [business currency]
    language: "en"

database:
  provider: "postgresql"
  models: [generate specific models based on analysis]
    - name: [ModelName]
      displayName: [Human readable name]
      description: [business purpose]
      fields:
        - name: [field_name]
          type: [appropriate type]
          required: [boolean]
          unique: [boolean if needed]
          validation: [specific validation rules]
          ui:
            label: [user-friendly label]
            widget: [appropriate UI widget]
            [additional UI config]
      relationships: [define foreign keys and relations]
      indexes: [performance indexes]
      permissions: [role-based field access]

apis:
  integrations: [specific to business needs]
    - name: [integration_name]
      type: "rest" | "soap" | "webhook"
      provider: [actual service provider]
      baseUrl: [real API URL]
      authentication:
        type: [oauth2|api_key|basic]
        [auth configuration]
      endpoints: [actual API endpoints]
      rateLimits: [real rate limits]
      errorHandling: [retry policies]

workflows: [business-specific automation]
  - name: [workflow_name]
    description: [business purpose]
    trigger:
      type: [api_call|schedule|event]
      [trigger configuration]
    steps: [detailed workflow steps]
    errorHandling: [failure scenarios]
    monitoring: [success metrics]

authentication:
  providers: [appropriate auth methods]
  roles: [specific user roles]
  permissions: [granular permissions]
  security:
    passwordPolicy: [strong policies]
    sessionManagement: [secure sessions]
    auditLogging: [compliance logging]

ui:
  theme:
    primaryColor: [brand appropriate]
    secondaryColor: [complementary]
    layout: [appropriate layout style]
  pages: [business-specific pages]
    - name: [page_name]
      path: [URL path]
      layout: [page layout]
      components: [specific components]
      permissions: [access control]

alerts:
  channels: [appropriate channels]
  rules: [business-critical alerts]
    - name: [alert_name]
      description: [business context]
      conditions: [specific conditions]
      actions: [notification actions]
      severity: [appropriate level]

deployment:
  platform: [recommended platform]
  environment: "production"
  resources:
    api: [appropriate sizing]
    database: [appropriate sizing]
    storage: [if needed]
  domains: [custom domain]
  ssl: true
  monitoring: [comprehensive monitoring]
  backup:
    frequency: [appropriate frequency]
    retention: [appropriate retention]

features: [enable relevant features]
  authentication: true
  workflows: true
  integrations: true
  fileUpload: [if needed]
  notifications: true
  analytics: true
  multiTenancy: [if needed]
  audit: [if compliance needed]

security:
  encryption:
    atRest: true
    inTransit: true
  compliance: [relevant standards]
  dataRetention: [appropriate policies]
  accessLogging: true

performance:
  caching:
    strategy: [appropriate strategy]
    ttl: [appropriate TTL]
  scaling:
    type: [horizontal|vertical]
    triggers: [scaling metrics]
  monitoring:
    metrics: [key performance indicators]
    alerting: [performance alerts]
\`\`\`

CRITICAL GENERATION GUIDELINES:
1. **USE THE EXACT DATA PROVIDED**: Transform the specific data models, integrations, workflows, and user roles provided above into the YAML - do not create generic examples
2. **INDUSTRY-SPECIFIC CUSTOMIZATION**: Generate configurations that are uniquely suited to this industry and business model
3. **BUSINESS-SPECIFIC FEATURES**: Include features and workflows that directly address this business's revenue streams and operational needs
4. **EXACT DATA MODEL IMPLEMENTATION**: Use the provided data models with their exact field definitions, relationships, and business purposes
5. **REAL INTEGRATION MAPPING**: Configure the specific third-party services identified for this business with appropriate endpoints and authentication
6. **ROLE-BASED CUSTOMIZATION**: Implement the exact user roles and permissions structure identified for this business
7. **WORKFLOW AUTOMATION**: Create workflows that automate the specific business processes identified in the analysis
8. **COMPLIANCE ALIGNMENT**: Address the specific regulatory and compliance requirements for this industry
9. **SCALABILITY MATCHING**: Design for the specific scale requirements (local/regional/national/global) identified
10. **COMPETITIVE ADVANTAGE SUPPORT**: Include features that support the business's identified competitive advantages

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON object
- NO markdown code blocks (no backticks)
- NO explanations or comments
- NO additional text before or after the JSON

Return a JSON object with this exact structure:
{
  "yaml": "# The complete YAML configuration as a string here\nvertical:\n  name: example\n  ...",
  "structured": {
    "vertical": { "name": "example", ... },
    "database": { ... },
    "apis": { ... }
  }
}

IMPORTANT: This YAML must be UNIQUELY CUSTOMIZED for ${businessProfile.businessName} in the ${confirmedInsights.businessIntelligence?.industryCategory || businessProfile.businessType} industry. 
Do NOT generate generic templates - use the specific business intelligence, data models, integrations, and workflows provided above.

Start your response with { and end with } - nothing else.
`

  try {
    console.log('🤖 Sending YAML generation request to OpenAI...')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert software architect specializing in business application configuration. You have deep expertise in YAML, database design, API integrations, workflow automation, and modern web application architecture. You generate production-ready configurations that solve real business problems. CRITICAL: Return ONLY valid JSON with no markdown formatting, no code blocks, no explanations - just the raw JSON object exactly as specified in the prompt."
        },
        {
          role: "user",
          content: yamlPrompt
        }
      ],
      temperature: 0.2, // Lower temperature for consistent, structured output
      max_tokens: 4000
    })

    const responseContent = response.choices[0].message.content || '{}'
    let yamlResult
    
    console.log('Raw OpenAI response length:', responseContent.length)
    console.log('First 500 chars of response:', responseContent.substring(0, 500))
    
    // Strategy 1: Check for markdown code blocks FIRST (most common from OpenAI)
    console.log('🔍 Checking for markdown code blocks first...')
    
    // Check for markdown code blocks
    const codeBlockMatches = [
      responseContent.match(/```json\s*\n?([\s\S]*?)\n?```/),
      responseContent.match(/```\s*\n?([\s\S]*?)\n?```/),
    ]
    
    for (const codeBlockMatch of codeBlockMatches) {
      if (codeBlockMatch) {
        console.log('📝 Found markdown code block, extracting content...')
        let extractedContent = codeBlockMatch[1].trim()
        console.log('Extracted content length:', extractedContent.length)
        
        if (await tryParseJson(extractedContent)) {
          yamlResult = await tryParseJson(extractedContent)
          console.log('✅ Successfully parsed JSON from code block')
          break
        }
      }
    }
    
    // Strategy 2: Try raw JSON parsing (in case OpenAI returns pure JSON)
    if (!yamlResult) {
      console.log('🔄 Code blocks failed, trying raw JSON parsing...')
      try {
        yamlResult = JSON.parse(responseContent)
        console.log('✅ Successfully parsed raw JSON response')
      } catch (rawParseError) {
        console.log('❌ Raw JSON parsing failed, trying JSON object extraction...')
      }
    }
    
    // Strategy 3: If no code block or raw JSON worked, try to find JSON objects
    if (!yamlResult) {
      console.log('📄 Raw JSON failed, trying JSON object extraction...')
      
      // Find the most complete JSON object by looking for balanced braces
      const jsonCandidates = []
      let braceCount = 0
      let startIndex = -1
      
      for (let i = 0; i < responseContent.length; i++) {
        const char = responseContent[i]
        if (char === '{') {
          if (braceCount === 0) startIndex = i
          braceCount++
        } else if (char === '}') {
          braceCount--
          if (braceCount === 0 && startIndex !== -1) {
            jsonCandidates.push(responseContent.substring(startIndex, i + 1))
          }
        }
      }
      
      // Try parsing each candidate, starting with the longest
      jsonCandidates.sort((a, b) => b.length - a.length)
      console.log(`Found ${jsonCandidates.length} JSON candidates`)
      
      for (const candidate of jsonCandidates) {
        const parsed = await tryParseJson(candidate)
        if (parsed) {
          yamlResult = parsed
          console.log('✅ Successfully parsed JSON candidate')
          break
        }
      }
    }
    
    // Strategy 4: Last resort - use fallback generation
    if (!yamlResult) {
      console.log('🔧 All parsing strategies failed, using fallback generation...')
      console.log('Full response for debugging:', responseContent.substring(0, 2000))
      throw new Error('Could not extract valid JSON from OpenAI response. Will use fallback generation.')
    }
    
    console.log('✅ AI YAML Generation completed');
    return yamlResult;

  } catch (error) {
    console.error('OpenAI YAML Generation error:', error);
    throw new Error('Failed to generate YAML with AI');
  }
}