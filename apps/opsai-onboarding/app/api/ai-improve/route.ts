import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { message, appId, appContext, codeContext, collaborationMode, performanceMetrics, securityScore, codeQuality } = await request.json()

    // Get real data from integrations for AI analysis
    const realData = await getRealDataForAnalysis(appId)
    
    // Use real OpenAI API for intelligent analysis
    const aiResponse = await generateRealAIResponse(message, appContext, realData, codeContext)
    
    // Save the AI interaction to the database
    if (appId) {
      await supabase
        .from('customizations')
        .insert({
          application_id: appId,
          user_id: user.id,
          type: 'ai_improvement',
          description: message,
          status: 'completed',
          changes: aiResponse.codeChanges || [],
          requested_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
    }

    return NextResponse.json(aiResponse)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get real data from all integrations for AI analysis
async function getRealDataForAnalysis(appId: string) {
  try {
    // Fetch real data from Airbyte-synced tables
    const responses = await Promise.allSettled([
      fetch('/api/airbyte/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'customers', source: 'stripe', limit: 10 })
      }),
      fetch('/api/airbyte/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'products', source: 'shopify', limit: 10 })
      }),
      fetch('/api/airbyte/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'sessions', source: 'google_analytics', limit: 10 })
      })
    ])

    const realData: any = {
      stripe_customers: [],
      shopify_products: [],
      google_analytics: [],
      summary: {
        total_customers: 0,
        total_products: 0,
        total_sessions: 0,
        revenue_data: null
      }
    }

    // Process real data from responses
    for (let i = 0; i < responses.length; i++) {
      const result = responses[i]
      if (result.status === 'fulfilled' && result.value.ok) {
        const data = await result.value.json()
        
        switch (i) {
          case 0: // Stripe
            realData.stripe_customers = data.records || []
            realData.summary.total_customers = data.total || 0
            break
          case 1: // Shopify
            realData.shopify_products = data.records || []
            realData.summary.total_products = data.total || 0
            break
          case 2: // Google Analytics
            realData.google_analytics = data.records || []
            realData.summary.total_sessions = data.total || 0
            break
        }
      }
    }

    return realData
  } catch (error) {
    console.error('Failed to fetch real data for AI analysis:', error)
    return { error: 'Unable to fetch real integration data' }
  }
}

// Generate real AI response using OpenAI with actual business data
async function generateRealAIResponse(userInput: string, appContext: string, realData: any, codeContext?: string) {
  try {
    const systemPrompt = `You are an AI assistant that helps improve business applications. You have access to real business data from integrated services:

REAL BUSINESS DATA:
- Stripe Customers: ${realData.summary?.total_customers || 0} customers
- Shopify Products: ${realData.summary?.total_products || 0} products  
- Google Analytics: ${realData.summary?.total_sessions || 0} sessions
- Sample Customer Data: ${JSON.stringify(realData.stripe_customers?.slice(0, 2) || [])}
- Sample Product Data: ${JSON.stringify(realData.shopify_products?.slice(0, 2) || [])}

APPLICATION CONTEXT: ${appContext || 'Business application'}
CODE CONTEXT: ${codeContext || 'No code context provided'}

Provide specific, actionable recommendations based on the REAL data above. Focus on:
1. Data-driven insights from actual customer/product/analytics data
2. Concrete code improvements with real examples
3. Business optimization based on actual metrics
4. Integration enhancements using real data patterns

Be specific and reference the actual data numbers in your analysis.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput }
      ],
      max_tokens: 1500,
      temperature: 0.7
    })

    const aiMessage = completion.choices[0]?.message?.content || 'Unable to generate response'

    // Extract actionable suggestions from AI response
    const suggestions = extractSuggestions(aiMessage, realData)
    const codeChanges = generateCodeChanges(userInput, realData)

    return {
      message: aiMessage,
      suggestions,
      codeChanges,
      realDataInsights: {
        customersAnalyzed: realData.summary?.total_customers || 0,
        productsAnalyzed: realData.summary?.total_products || 0,
        sessionsAnalyzed: realData.summary?.total_sessions || 0,
        dataFreshness: new Date().toISOString()
      },
      type: 'ai_analysis'
    }
  } catch (error) {
    console.error('OpenAI API Error:', error)
    // Fallback to rule-based response if OpenAI fails
    return generateFallbackResponse(userInput, realData)
  }
}

// Extract actionable suggestions from AI response
function extractSuggestions(aiMessage: string, realData: any): string[] {
  const suggestions = []
  
  // Add suggestions based on real data
  if (realData.summary?.total_customers > 0) {
    suggestions.push(`Analyze ${realData.summary.total_customers} real customers for segmentation`)
  }
  
  if (realData.summary?.total_products > 0) {
    suggestions.push(`Optimize product catalog with ${realData.summary.total_products} products`)
  }
  
  if (realData.summary?.total_sessions > 0) {
    suggestions.push(`Improve user experience based on ${realData.summary.total_sessions} sessions`)
  }
  
  // Add general suggestions from AI message
  if (aiMessage.includes('dashboard')) {
    suggestions.push('Create custom analytics dashboard')
  }
  
  if (aiMessage.includes('automation')) {
    suggestions.push('Implement workflow automation')
  }
  
  return suggestions
}

// Generate specific code changes based on real data patterns
function generateCodeChanges(userInput: string, realData: any): any[] {
  const changes = []
  
  if (realData.stripe_customers?.length > 0) {
    changes.push({
      file: 'components/CustomerDashboard.tsx',
      type: 'enhancement',
      description: 'Add real customer data integration',
      code: `// Real customer data from Stripe
const { data: customers } = await stripeIntegration.getCustomers()
console.log('Loaded ${realData.summary?.total_customers} real customers')`
    })
  }
  
  if (realData.shopify_products?.length > 0) {
    changes.push({
      file: 'components/ProductCatalog.tsx', 
      type: 'enhancement',
      description: 'Display real product inventory',
      code: `// Real product data from Shopify
const { data: products } = await shopifyIntegration.getProducts()
console.log('Loaded ${realData.summary?.total_products} real products')`
    })
  }
  
  return changes
}

// Fallback response if OpenAI fails
function generateFallbackResponse(userInput: string, realData: any): any {
  const lowerInput = userInput.toLowerCase()
  
  let response = `Based on your real business data (${realData.summary?.total_customers || 0} customers, ${realData.summary?.total_products || 0} products), here are my recommendations:\n\n`
  
  if (lowerInput.includes('dashboard')) {
    response += "📊 I can create a real-time dashboard showing your actual customer and product data from Stripe and Shopify."
  } else if (lowerInput.includes('analytics')) {
    response += "📈 I can build analytics using your real Google Analytics data and customer information."
  } else {
    response += "🚀 I can help improve your app using the real data from your connected integrations."
  }

  return {
    message: response,
    suggestions: extractSuggestions(response, realData),
    codeChanges: generateCodeChanges(userInput, realData),
    realDataInsights: {
      customersAnalyzed: realData.summary?.total_customers || 0,
      productsAnalyzed: realData.summary?.total_products || 0,
      sessionsAnalyzed: realData.summary?.total_sessions || 0,
      dataFreshness: new Date().toISOString()
    },
    type: 'fallback_analysis'
  }
} 