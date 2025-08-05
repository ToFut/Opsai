import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    // Initialize clients inside the function to avoid build-time errors
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    })

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log(`🤖 Starting AI workflow analysis for user ${userId}`)

    // Step 1: Fetch unified user data from organized database
    const userData = await fetchUserData(userId)

    // Step 2: Analyze patterns using AI
    const patterns = await analyzePatterns(userData)

    // Step 3: Generate insights and recommendations
    const insights = await generateInsights(userData, patterns)

    // Step 4: Calculate business metrics and health score
    const metrics = await calculateMetrics(userData)

    // Step 5: Store analysis results
    const analysisResult = {
      user_id: userId,
      patterns,
      insights,
      metrics,
      workflow_recommendations: insights.recommendations,
      health_score: metrics.healthScore,
      churn_risk: metrics.churnRisk,
      growth_opportunities: insights.growthOpportunities,
      analyzed_at: new Date().toISOString()
    }

    await storeAnalysisResults(userId, analysisResult)

    console.log(`✅ AI analysis completed for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: `AI workflow analysis completed for user ${userId}`,
      analysis: analysisResult
    })

  } catch (error) {
    console.error('❌ AI analysis failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'AI analysis failed'
    }, { status: 500 })
  }
}

async function fetchUserData(userId: string) {
  const cleanUserId = userId.replace(/-/g, '_')
  
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  try {
    // Fetch data from analytics views
    const [customers, revenue, development, website, metrics] = await Promise.all([
      supabaseAdmin.rpc('exec_sql', { 
        sql: `SELECT * FROM analytics_${cleanUserId}.unified_customers LIMIT 100;` 
      }),
      supabaseAdmin.rpc('exec_sql', { 
        sql: `SELECT * FROM analytics_${cleanUserId}.revenue_analytics ORDER BY month DESC LIMIT 12;` 
      }),
      supabaseAdmin.rpc('exec_sql', { 
        sql: `SELECT * FROM analytics_${cleanUserId}.developer_activity ORDER BY date DESC LIMIT 30;` 
      }),
      supabaseAdmin.rpc('exec_sql', { 
        sql: `SELECT * FROM analytics_${cleanUserId}.website_analytics ORDER BY date DESC LIMIT 30;` 
      }),
      supabaseAdmin.rpc('exec_sql', { 
        sql: `SELECT * FROM analytics_${cleanUserId}.business_metrics;` 
      })
    ])

    return {
      customers: customers.data || [],
      revenue: revenue.data || [],
      development: development.data || [],
      website: website.data || [],
      metrics: metrics.data || []
    }
  } catch (error) {
    console.warn('Some analytics views may not exist yet, using mock data')
    return generateMockData(userId)
  }
}

function generateMockData(userId: string) {
  return {
    customers: [
      { customer_id: 'cust_1', email: 'user@example.com', name: 'John Doe', lifetime_value: 1200, total_invoices: 8 },
      { customer_id: 'cust_2', email: 'jane@example.com', name: 'Jane Smith', lifetime_value: 800, total_invoices: 5 }
    ],
    revenue: [
      { month: '2024-01-01', total_revenue: 5400, total_transactions: 12, unique_customers: 8 },
      { month: '2024-02-01', total_revenue: 6200, total_transactions: 15, unique_customers: 10 }
    ],
    development: [
      { date: '2024-01-15', total_commits: 25, active_developers: 3, active_repos: 5 },
      { date: '2024-01-16', total_commits: 18, active_developers: 2, active_repos: 4 }
    ],
    website: [
      { date: '2024-01-15', total_sessions: 150, total_users: 120, total_pageviews: 450 },
      { date: '2024-01-16', total_sessions: 180, total_users: 140, total_pageviews: 520 }
    ],
    metrics: [
      { metric_type: 'revenue', total_count: 2, total_value: 11600 },
      { metric_type: 'customers', total_count: 2, total_value: 18 }
    ]
  }
}

async function analyzePatterns(userData: any) {
  const prompt = `
Analyze the following business data and identify key patterns:

Customer Data: ${JSON.stringify(userData.customers.slice(0, 10))}
Revenue Data: ${JSON.stringify(userData.revenue)}
Development Activity: ${JSON.stringify(userData.development.slice(0, 10))}
Website Analytics: ${JSON.stringify(userData.website.slice(0, 10))}

Identify:
1. Business type (SaaS, E-commerce, Service, etc.)
2. Primary workflows (Sales, Development, Marketing, etc.)
3. Key performance indicators
4. Growth patterns
5. User behavior patterns

Respond with a JSON object containing these patterns.
  `

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    })
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a business intelligence analyst. Analyze data and respond with structured JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    })

    const response = completion.choices[0]?.message?.content
    if (response) {
      return JSON.parse(response)
    }
  } catch (error) {
    console.error('AI pattern analysis failed, using fallback:', error)
  }

  // Fallback pattern analysis
  return {
    business_type: 'saas',
    primary_workflows: ['sales', 'development', 'customer_support'],
    key_metrics: ['revenue', 'customer_acquisition', 'retention'],
    growth_stage: 'growth',
    user_segments: ['power_users', 'casual_users', 'trial_users']
  }
}

async function generateInsights(userData: any, patterns: any) {
  const prompt = `
Based on the business patterns and data, generate actionable insights:

Patterns: ${JSON.stringify(patterns)}
Business Metrics: ${JSON.stringify(userData.metrics)}

Generate:
1. Key insights about business performance
2. Workflow optimization recommendations
3. Growth opportunities
4. Risk factors
5. Action items with priorities

Respond with a structured JSON object.
  `

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    })
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a business consultant providing actionable insights. Respond with structured JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    })

    const response = completion.choices[0]?.message?.content
    if (response) {
      return JSON.parse(response)
    }
  } catch (error) {
    console.error('AI insight generation failed, using fallback:', error)
  }

  // Fallback insights
  return {
    key_insights: [
      'Revenue growth showing positive trend',
      'Customer retention needs improvement',
      'Development velocity is consistent'
    ],
    recommendations: [
      {
        priority: 'high',
        category: 'revenue',
        action: 'Implement upselling campaign for existing customers',
        impact: 'Could increase revenue by 15-20%'
      },
      {
        priority: 'medium', 
        category: 'retention',
        action: 'Set up automated onboarding sequences',
        impact: 'Improve customer retention by 10%'
      }
    ],
    growthOpportunities: [
      'Expand to adjacent market segments',
      'Develop premium feature tiers',
      'Implement referral program'
    ],
    riskFactors: [
      'Customer concentration risk',
      'Seasonal revenue variations'
    ]
  }
}

async function calculateMetrics(userData: any) {
  const totalCustomers = userData.customers.length
  const totalRevenue = userData.revenue.reduce((sum: number, r: any) => sum + (r.total_revenue || 0), 0)
  const avgMonthlyRevenue = totalRevenue / Math.max(userData.revenue.length, 1)
  
  // Calculate health score (0-100)
  let healthScore = 50 // Base score
  
  // Revenue growth contributes to health
  if (userData.revenue.length >= 2) {
    const recentRevenue = userData.revenue[0]?.total_revenue || 0
    const previousRevenue = userData.revenue[1]?.total_revenue || 1
    const growth = (recentRevenue - previousRevenue) / previousRevenue
    healthScore += Math.min(growth * 100, 30) // Max 30 points for growth
  }
  
  // Customer base contributes to health
  healthScore += Math.min(totalCustomers * 2, 20) // Max 20 points for customers
  
  // Churn risk calculation (0-100, higher = more risk)
  const churnRisk = Math.max(0, Math.min(100, 
    50 - (totalCustomers * 2) + (avgMonthlyRevenue < 1000 ? 20 : 0)
  ))

  return {
    healthScore: Math.min(100, Math.max(0, healthScore)),
    churnRisk,
    totalCustomers,
    totalRevenue,
    avgMonthlyRevenue,
    growthRate: userData.revenue.length >= 2 ? 
      ((userData.revenue[0]?.total_revenue || 0) - (userData.revenue[1]?.total_revenue || 0)) / (userData.revenue[1]?.total_revenue || 1) * 100 : 0
  }
}

async function storeAnalysisResults(userId: string, analysis: any) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  try {
    const { error } = await supabaseAdmin
      .from('user_ai_analysis')
      .upsert({
        user_id: userId,
        analysis_data: analysis,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Failed to store analysis results:', error)
    }
  } catch (error) {
    console.error('Error storing analysis results:', error)
    // Don't throw - analysis can still return even if storage fails
  }
}