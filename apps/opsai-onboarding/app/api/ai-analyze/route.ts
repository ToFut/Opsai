import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai-client'

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl } = await request.json()

    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 })
    }

    console.log(`🤖 Starting direct OpenAI analysis for: ${websiteUrl}`)

    // Direct OpenAI analysis - let OpenAI do its own research
    const analysis = await analyzeBusinessWithAI(websiteUrl)

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('AI Analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze business',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function analyzeBusinessWithAI(websiteUrl: string) {
  const analysisPrompt = `
You are an expert business analyst and software architect. Analyze this business website and provide comprehensive insights for building a custom business application.

WEBSITE URL: ${websiteUrl}

Please research this website and provide a detailed analysis in the following JSON structure:

{
  "businessIntelligence": {
    "industryCategory": "string", // e.g., "restaurant", "e-commerce", "healthcare", "legal", etc.
    "businessModel": "string", // e.g., "B2C marketplace", "subscription service", "franchise operation"
    "revenueStreams": ["string"], // e.g., ["product sales", "subscription fees", "commission"]
    "targetAudience": "string", // detailed description of primary customers
    "competitiveAdvantages": ["string"], // unique selling propositions
    "operationalComplexity": "low" | "medium" | "high",
    "scalabilityRequirements": "local" | "regional" | "national" | "global"
  },
  
  "technicalRequirements": {
    "dataModels": [
      {
        "name": "string", // e.g., "Customer", "Product", "Order"
        "description": "string",
        "priority": "critical" | "important" | "nice-to-have",
        "relationships": ["string"], // relationships to other models
        "estimatedRecords": "string", // e.g., "1K-10K", "10K-100K", "100K+"
        "fields": [
          {
            "name": "string",
            "type": "string" | "number" | "boolean" | "date" | "json" | "enum",
            "required": boolean,
            "unique": boolean,
            "validation": "string", // validation rules
            "businessReason": "string" // why this field is needed
          }
        ]
      }
    ],
    
    "integrationOpportunities": [
      {
        "service": "string", // e.g., "Stripe", "QuickBooks", "Mailchimp"
        "category": "payments" | "accounting" | "marketing" | "crm" | "inventory" | "communication" | "analytics",
        "priority": "critical" | "important" | "nice-to-have",
        "businessValue": "string", // what business value this provides
        "complexity": "low" | "medium" | "high",
        "estimatedSetupTime": "string", // e.g., "1-2 hours", "1-2 days"
      }
    ],
    
    "workflowRequirements": [
      {
        "name": "string", // e.g., "Order Processing", "Customer Onboarding"
        "description": "string",
        "trigger": "api_call" | "schedule" | "event" | "manual",
        "frequency": "string", // e.g., "real-time", "daily", "weekly"
        "complexity": "low" | "medium" | "high",
        "businessImpact": "high" | "medium" | "low",
        "steps": [
          {
            "name": "string",
            "type": "validation" | "data_transformation" | "api_call" | "notification" | "calculation",
            "description": "string",
            "automationPotential": "high" | "medium" | "low"
          }
        ]
      }
    ]
  },
  
  "userManagement": {
    "userTypes": [
      {
        "role": "string", // e.g., "admin", "customer", "staff", "vendor"
        "description": "string",
        "permissions": ["string"], // e.g., ["read_products", "manage_orders"]
        "authenticationMethod": "email_password" | "oauth" | "sso" | "multi_factor",
        "estimatedUsers": "string" // e.g., "10-50", "50-500", "500+"
      }
    ],
    "securityRequirements": {
      "dataClassification": "public" | "internal" | "confidential" | "restricted",
      "complianceNeeds": ["string"], // e.g., ["GDPR", "HIPAA", "SOX"]
      "auditRequirements": boolean,
      "encryptionLevel": "basic" | "standard" | "high"
    }
  },
  
  "uiuxRecommendations": {
    "primaryUserJourney": "string", // most important user flow
    "criticalFeatures": ["string"], // must-have features for MVP
    "designComplexity": "simple" | "moderate" | "complex",
    "mobileRequirements": "responsive" | "mobile_first" | "native_app",
    "dashboardNeeds": {
      "executiveDashboard": boolean,
      "operationalDashboard": boolean,
      "customerDashboard": boolean,
      "keyMetrics": ["string"] // important KPIs to track
    }
  },
  
  "deploymentStrategy": {
    "recommendedPlatform": "vercel" | "netlify" | "aws" | "docker" | "kubernetes",
    "scalingStrategy": "vertical" | "horizontal" | "auto_scaling",
    "environmentNeeds": ["development", "staging", "production"],
    "estimatedTraffic": "string", // e.g., "< 1K visits/month", "1K-10K visits/month"
    "performanceRequirements": "standard" | "high" | "enterprise",
    "backupStrategy": "daily" | "real_time" | "weekly",
    "monitoringLevel": "basic" | "comprehensive" | "enterprise"
  },
  
  "businessValue": {
    "problemsSolved": ["string"], // key business problems this app will solve
    "timeToMarket": "string", // estimated development time
    "roi_potential": "high" | "medium" | "low",
    "maintenanceComplexity": "low" | "medium" | "high",
    "futureEnhancements": ["string"] // potential future features
  },
  
  "riskAssessment": {
    "technicalRisks": ["string"],
    "businessRisks": ["string"],
    "mitigationStrategies": ["string"]
  }
}

ANALYSIS GUIDELINES:
1. Be specific and actionable - avoid generic recommendations
2. Consider the business size, industry, and complexity
3. Focus on practical, implementable solutions
4. Prioritize features based on business impact
5. Consider both immediate needs and future scalability
6. Factor in the technical capabilities of a small business
7. Recommend modern, proven technologies and integrations
8. Be realistic about timelines and complexity

Provide comprehensive, accurate analysis that will guide the creation of a truly custom business application.
`

  try {
    console.log('🤖 Sending business analysis request to OpenAI...')
    
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using latest model for better analysis
      messages: [
        {
          role: "system",
          content: "You are an expert business analyst and software architect with 15+ years of experience building custom business applications. You can research websites and provide comprehensive business analysis. Analyze the provided website URL thoroughly and provide actionable insights."
        },
        {
          role: "user", 
          content: analysisPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual analysis
      max_tokens: 4000,

    })

    const content = response.choices[0].message.content || '{}'
    // Handle markdown-formatted JSON
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
    const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    const analysisResult = JSON.parse(jsonContent)
    
    console.log('✅ AI Business Analysis completed')
    return analysisResult

  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to analyze business with AI')
  }
}