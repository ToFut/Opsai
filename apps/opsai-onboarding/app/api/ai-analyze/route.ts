import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

interface BusinessAnalysisRequest {
  websiteUrl: string
  websiteContent: string
  businessProfile: any
}

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, websiteContent, businessProfile }: BusinessAnalysisRequest = await request.json()

    if (!websiteContent || !businessProfile) {
      return NextResponse.json({ error: 'Website content and business profile are required' }, { status: 400 })
    }

    console.log(`🤖 Starting AI analysis for: ${websiteUrl}`)

    // Stage 1: Deep Business Intelligence Analysis
    const businessIntelligence = await analyzeBusinessWithAI(websiteContent, businessProfile, websiteUrl)

    return NextResponse.json({
      success: true,
      analysis: businessIntelligence,
      stage: 'business_analysis',
      nextStep: 'confirm_and_generate_yaml'
    })

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

async function analyzeBusinessWithAI(websiteContent: string, businessProfile: any, websiteUrl: string) {
  const analysisPrompt = `
You are an expert business analyst and software architect. Analyze this business website and provide comprehensive insights for building a custom business application.

WEBSITE URL: ${websiteUrl}
BUSINESS INFO: ${JSON.stringify(businessProfile, null, 2)}

WEBSITE CONTENT:
${websiteContent.substring(0, 8000)} // Limit content for token efficiency

Please provide a detailed analysis in the following JSON structure:

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
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using latest model for better analysis
      messages: [
        {
          role: "system",
          content: "You are an expert business analyst and software architect with 15+ years of experience building custom business applications. You understand both technical implementation and business strategy."
        },
        {
          role: "user", 
          content: analysisPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual analysis
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })

    const analysisResult = JSON.parse(response.choices[0].message.content || '{}')
    
    console.log('✅ AI Business Analysis completed')
    return analysisResult

  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to analyze business with AI')
  }
}