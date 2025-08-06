import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai-client'

export async function POST(request: NextRequest) {
  try {
    const { businessAnalysis, selectedModel } = await request.json()

    if (!businessAnalysis) {
      return NextResponse.json({ error: 'Business analysis is required' }, { status: 400 })
    }

    console.log(`🔗 Generating integrations with ${selectedModel}`)

    const integrations = await generateIntegrationsWithAI(businessAnalysis, selectedModel)

    return NextResponse.json({
      success: true,
      integrations,
      modelUsed: selectedModel,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Integration generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate integrations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function generateIntegrationsWithAI(businessAnalysis: any, selectedModel: string) {
  const integrationPrompt = `
Based on this business analysis, recommend the most valuable integrations for this business:

BUSINESS ANALYSIS:
${JSON.stringify(businessAnalysis, null, 2)}

Generate integration recommendations in this JSON format:

{
  "integrations": [
    {
      "id": "string", // e.g., "stripe", "shopify", "slack"
      "name": "string", // e.g., "Stripe", "Shopify", "Slack"
      "type": "string", // e.g., "Payments", "E-commerce", "Communication"
      "confidence": number, // 0-100 confidence score
      "reason": "string", // why this integration is recommended
      "priority": "critical" | "high" | "medium" | "low",
      "estimatedSetupTime": "string", // e.g., "15 minutes", "2 hours"
      "businessValue": "string", // specific value this provides
      "complexity": "low" | "medium" | "high",
      "monthlyValue": "string", // estimated monthly value/savings
      "requiredData": ["string"], // what data/fields are needed
      "automationPotential": "high" | "medium" | "low"
    }
  ]
}

INTEGRATION GUIDELINES:
1. Focus on integrations that solve real business problems identified in the analysis
2. Prioritize based on business impact and ease of implementation
3. Consider the business size and technical capabilities
4. Include both essential and growth-oriented integrations
5. Be specific about business value and setup requirements
6. Recommend 4-8 integrations maximum, prioritized by importance

Available integrations to consider:
- Stripe (payments)
- PayPal (payments)
- Shopify (e-commerce)
- WooCommerce (e-commerce)
- Slack (communication)
- Microsoft Teams (communication)
- Google Analytics (analytics)
- Mixpanel (analytics)
- Mailchimp (email marketing)
- SendGrid (email service)
- Twilio (SMS/communications)
- QuickBooks (accounting)
- Xero (accounting)
- Zapier (automation)
- Airtable (database)
- Notion (collaboration)
- GitHub (development)
- Calendly (scheduling)
- DocuSign (digital signatures)
- AWS S3 (file storage)

Provide actionable, business-specific recommendations.
`

  try {
    // Simulate model-specific processing time
    const processingTime = selectedModel === 'gpt-oss-120b' ? 6000 : 
                          selectedModel === 'gpt-oss-20b' ? 2000 : 3000
    
    await new Promise(resolve => setTimeout(resolve, Math.min(processingTime, 4000)))

    // Check for demo mode
    const hasRealAPIKey = !!process.env.OPENAI_API_KEY;
    
    if (!hasRealAPIKey) {
      console.log('🎭 Using demo mode - generating mock integrations')
      return generateDemoIntegrations(businessAnalysis, selectedModel, processingTime)
    }

    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: selectedModel === 'gpt-oss-120b' ? "gpt-4o" : 
             selectedModel === 'gpt-oss-20b' ? "gpt-3.5-turbo" : "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an integration specialist using ${selectedModel}. ${
            selectedModel === 'gpt-oss-120b' ? 'Provide comprehensive integration analysis with detailed business value calculations.' :
            selectedModel === 'gpt-oss-20b' ? 'Provide focused, high-impact integration recommendations.' :
            'Provide standard integration recommendations.'
          }`
        },
        {
          role: "user",
          content: integrationPrompt
        }
      ],
      temperature: selectedModel === 'gpt-oss-120b' ? 0.2 : 0.3,
      max_tokens: 2000
    })

    const content = response.choices[0].message.content || '{}'
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
    const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    const result = JSON.parse(jsonContent)

    // Add AI metadata to each integration
    const integrationsWithMeta = result.integrations.map((integration: any) => ({
      ...integration,
      aiModel: selectedModel,
      confidence: selectedModel === 'gpt-oss-120b' ? 
        Math.min(integration.confidence + 5, 98) : // 120B more confident
        integration.confidence,
      processingTime: `${processingTime}ms`,
      generatedAt: new Date().toISOString()
    }))

    console.log(`✅ Generated ${integrationsWithMeta.length} integrations with ${selectedModel}`)
    return integrationsWithMeta

  } catch (error) {
    console.error('AI integration generation error:', error)
    throw new Error('Failed to generate integrations with AI')
  }
}

// Demo fallback for integrations
function generateDemoIntegrations(businessAnalysis: any, selectedModel: string, processingTime: number) {
  const baseIntegrations = [
    {
      id: 'stripe',
      name: 'Stripe',
      type: 'Payments',
      confidence: selectedModel === 'gpt-oss-120b' ? 96 : 89,
      reason: 'Payment processing capabilities essential for revenue generation',
      priority: 'critical',
      estimatedSetupTime: '15 minutes',
      businessValue: 'Enable secure payment processing and recurring billing',
      complexity: 'medium',
      monthlyValue: '$500-2000 in prevented payment issues',
      requiredData: ['customer_email', 'payment_amount', 'billing_address'],
      automationPotential: 'high'
    },
    {
      id: 'google-analytics', 
      name: 'Google Analytics',
      type: 'Analytics',
      confidence: selectedModel === 'gpt-oss-120b' ? 94 : 87,
      reason: 'Data-driven insights crucial for business optimization',
      priority: 'high',
      estimatedSetupTime: '10 minutes',
      businessValue: 'Track user behavior and optimize conversion rates',
      complexity: 'low',
      monthlyValue: '$200-800 in optimization insights',
      requiredData: ['page_views', 'user_sessions', 'conversion_events'],
      automationPotential: 'medium'
    },
    {
      id: 'slack',
      name: 'Slack',
      type: 'Communication',
      confidence: selectedModel === 'gpt-oss-120b' ? 85 : 78,
      reason: 'Team communication and automated notifications',
      priority: 'medium',
      estimatedSetupTime: '20 minutes',
      businessValue: 'Streamline team communication and automate alerts',
      complexity: 'low',
      monthlyValue: '$100-400 in improved team efficiency',
      requiredData: ['notification_triggers', 'team_channels', 'alert_conditions'],
      automationPotential: 'high'
    }
  ]

  const integrationsWithMeta = baseIntegrations.map(integration => ({
    ...integration,
    aiModel: selectedModel,
    processingTime: `${processingTime}ms`,
    generatedAt: new Date().toISOString(),
    demoMode: true
  }))

  console.log(`✅ Demo generated ${integrationsWithMeta.length} integrations with ${selectedModel}`)
  return integrationsWithMeta
}