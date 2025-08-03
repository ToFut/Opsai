import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

interface BusinessProfile {
  industry: string
  businessType: 'b2b' | 'b2c' | 'marketplace' | 'saas'
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  description?: string
  primaryGoals?: string[]
  existingTools?: string[]
}

interface IntegrationRecommendation {
  sourceType: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  reason: string
  useCases: string[]
  expectedValue: string
}

export async function POST(request: NextRequest) {
  try {
    const { businessProfile }: { businessProfile: BusinessProfile } = await request.json()

    if (!businessProfile) {
      return NextResponse.json(
        { error: 'Business profile is required' },
        { status: 400 }
      )
    }

    console.log('🤖 Generating AI recommendations for:', businessProfile)

    let recommendations: IntegrationRecommendation[] = []
    let aiRecommendations: string[] = []

    // Try OpenAI first for enhanced recommendations
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not configured, using rule-based recommendations')
    } else {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a data integration expert specializing in business intelligence and data-driven growth. Analyze business profiles and recommend the most impactful data integrations. Return detailed recommendations with reasoning.

              Available integrations: shopify, stripe, salesforce, hubspot, google-analytics, postgres, mysql, slack, notion, airtable, mailchimp, sendgrid, mixpanel, amplitude, zendesk, intercom, quickbooks, xero, github, asana, monday, jira, dropbox, google-drive, box, facebook-marketing, google-ads, linkedin-ads, twitter-ads, youtube-analytics, instagram-insights, tiktok-ads.

              Return JSON with this structure:
              {
                "recommendations": [
                  {
                    "sourceType": "string",
                    "priority": "critical|high|medium|low",
                    "reason": "why this integration is valuable",
                    "useCases": ["specific use case 1", "use case 2"],
                    "expectedValue": "concrete business value"
                  }
                ]
              }`
            },
            {
              role: 'user',
              content: `Analyze this business and recommend 5-8 most valuable data integrations:

              Business Profile:
              - Industry: ${businessProfile.industry}
              - Business Type: ${businessProfile.businessType}
              - Company Size: ${businessProfile.size}
              - Description: ${businessProfile.description || 'Not provided'}
              - Goals: ${businessProfile.primaryGoals?.join(', ') || 'Not specified'}
              - Existing Tools: ${businessProfile.existingTools?.join(', ') || 'Not specified'}

              Focus on integrations that will provide:
              1. Immediate business insights
              2. Operational efficiency gains  
              3. Customer understanding
              4. Revenue optimization
              5. Growth opportunities

              Prioritize based on likely impact and ease of implementation.`
            }
          ],
    
        })

        const aiResponse = JSON.parse(completion.choices[0].message.content || '{}')
        recommendations = aiResponse.recommendations || []
        aiRecommendations = recommendations.map(r => r.sourceType)
        
        console.log('✅ OpenAI generated recommendations:', aiRecommendations)
      } catch (aiError) {
        console.warn('⚠️ OpenAI recommendation failed, using smart fallback:', aiError)
      }
    }

    // If AI didn't work or wasn't configured, use smart rule-based recommendations
    if (recommendations.length === 0) {
      recommendations = generateSmartRecommendations(businessProfile)
      aiRecommendations = recommendations.map(r => r.sourceType)
      console.log('🧠 Smart rule-based recommendations:', aiRecommendations)
    }

    // Ensure we have fallback recommendations
    if (aiRecommendations.length === 0) {
      aiRecommendations = getFallbackRecommendations(businessProfile)
      console.log('🔄 Using fallback recommendations:', aiRecommendations)
    }

    // Sort by priority and limit to top 8
    const sortedRecommendations = recommendations
      .sort((a, b) => getPriorityScore(a.priority) - getPriorityScore(b.priority))
      .slice(0, 8)

    const topRecommendations = sortedRecommendations.map(r => r.sourceType)

    console.log(`✅ Final recommendations (${topRecommendations.length}):`, topRecommendations)

    return NextResponse.json({
      recommended: topRecommendations,
      recommendations: sortedRecommendations,
      reasoning: generateRecommendationReasoning(businessProfile, sortedRecommendations),
      source: process.env.OPENAI_API_KEY && recommendations.length > 0 ? 'ai-enhanced' : 'rule-based'
    })

  } catch (error) {
    console.error('❌ Error generating recommendations:', error)
    
    // Final fallback - use default business profile
    const defaultProfile: BusinessProfile = {
      industry: 'general',
      businessType: 'b2b',
      size: 'medium'
    }
    const fallback = getFallbackRecommendations(defaultProfile)
    console.log('🚨 Using emergency fallback:', fallback)
    
    return NextResponse.json({ 
      recommended: fallback,
      source: 'fallback',
      error: 'Using fallback recommendations due to system error'
    })
  }
}

function generateSmartRecommendations(profile: BusinessProfile): IntegrationRecommendation[] {
  const recommendations: IntegrationRecommendation[] = []
  
  // Industry-specific recommendations
  const industryRecs = getIndustryRecommendations(profile.industry)
  recommendations.push(...industryRecs)
  
  // Business type recommendations
  const businessTypeRecs = getBusinessTypeRecommendations(profile.businessType)
  recommendations.push(...businessTypeRecs)
  
  // Size-based recommendations
  const sizeRecs = getSizeBasedRecommendations(profile.size)
  recommendations.push(...sizeRecs)
  
  // Universal essentials
  const essentialRecs = getEssentialRecommendations()
  recommendations.push(...essentialRecs)
  
  // Remove duplicates and merge priorities
  const uniqueRecs = mergeDuplicateRecommendations(recommendations)
  
  return uniqueRecs
}

function getIndustryRecommendations(industry: string): IntegrationRecommendation[] {
  const industryMap: Record<string, IntegrationRecommendation[]> = {
    'ecommerce': [
      {
        sourceType: 'shopify',
        priority: 'critical',
        reason: 'E-commerce businesses need comprehensive order and customer data for growth',
        useCases: ['Order analytics', 'Customer segmentation', 'Inventory optimization', 'Revenue tracking'],
        expectedValue: 'Complete visibility into sales performance and customer lifetime value'
      },
      {
        sourceType: 'stripe',
        priority: 'critical',
        reason: 'Payment data is crucial for financial health and churn analysis',
        useCases: ['Revenue analytics', 'Payment success rates', 'Subscription metrics', 'Refund tracking'],
        expectedValue: '360° financial insights and payment optimization'
      },
      {
        sourceType: 'google-analytics',
        priority: 'high',
        reason: 'Understanding customer journey and conversion optimization',
        useCases: ['Traffic analysis', 'Conversion funnels', 'User behavior', 'Marketing attribution'],
        expectedValue: 'Data-driven marketing decisions and 15-30% conversion improvements'
      }
    ],
    'saas': [
      {
        sourceType: 'salesforce',
        priority: 'critical',
        reason: 'SaaS growth depends on customer success and sales pipeline optimization',
        useCases: ['Lead scoring', 'Customer health', 'Sales forecasting', 'Churn prediction'],
        expectedValue: 'Predictive customer success and 20-40% sales efficiency gains'
      },
      {
        sourceType: 'stripe',
        priority: 'critical',
        reason: 'Subscription metrics and MRR tracking are fundamental to SaaS success',
        useCases: ['MRR/ARR tracking', 'Churn analysis', 'Expansion revenue', 'Billing optimization'],
        expectedValue: 'Complete SaaS metrics dashboard and financial forecasting'
      },
      {
        sourceType: 'mixpanel',
        priority: 'high',
        reason: 'Product analytics drive feature adoption and user engagement',
        useCases: ['Feature usage', 'User engagement', 'Product metrics', 'A/B testing'],
        expectedValue: 'Product-led growth insights and improved user retention'
      }
    ],
    'healthcare': [
      {
        sourceType: 'postgres',
        priority: 'critical',
        reason: 'Healthcare requires secure, compliant data management for patient records',
        useCases: ['Patient data', 'Treatment outcomes', 'Compliance reporting', 'Clinical analytics'],
        expectedValue: 'HIPAA-compliant data infrastructure and better patient outcomes'
      },
      {
        sourceType: 'salesforce',
        priority: 'high',
        reason: 'Patient relationship management and care coordination',
        useCases: ['Patient engagement', 'Appointment management', 'Care team coordination', 'Outcome tracking'],
        expectedValue: 'Improved patient experience and coordinated care delivery'
      }
    ],
    'finance': [
      {
        sourceType: 'postgres',
        priority: 'critical',
        reason: 'Financial services need secure, auditable transaction data',
        useCases: ['Transaction records', 'Risk assessment', 'Compliance reporting', 'Customer profiles'],
        expectedValue: 'Regulatory compliance and risk management capabilities'
      },
      {
        sourceType: 'stripe',
        priority: 'high',
        reason: 'Payment processing and financial transaction analysis',
        useCases: ['Payment flows', 'Risk monitoring', 'Financial reporting', 'Fraud detection'],
        expectedValue: 'Real-time financial monitoring and fraud prevention'
      }
    ]
  }
  
  return industryMap[industry.toLowerCase()] || []
}

function getBusinessTypeRecommendations(businessType: string): IntegrationRecommendation[] {
  const typeMap: Record<string, IntegrationRecommendation[]> = {
    'b2b': [
      {
        sourceType: 'salesforce',
        priority: 'critical',
        reason: 'B2B sales cycles require sophisticated lead nurturing and account management',
        useCases: ['Account-based marketing', 'Deal pipeline', 'Lead scoring', 'Sales forecasting'],
        expectedValue: 'Shortened sales cycles and improved win rates'
      },
      {
        sourceType: 'hubspot',
        priority: 'high',
        reason: 'B2B marketing automation drives qualified lead generation',
        useCases: ['Lead nurturing', 'Content marketing', 'Email campaigns', 'Marketing qualification'],
        expectedValue: 'Higher quality leads and improved marketing ROI'
      }
    ],
    'b2c': [
      {
        sourceType: 'google-analytics',
        priority: 'critical',
        reason: 'B2C businesses must understand consumer behavior and optimize user experience',
        useCases: ['Customer journey', 'Product analytics', 'Marketing attribution', 'Conversion optimization'],
        expectedValue: 'Improved customer experience and higher conversion rates'
      },
      {
        sourceType: 'mailchimp',
        priority: 'high',
        reason: 'Direct consumer engagement through personalized marketing',
        useCases: ['Email marketing', 'Customer segmentation', 'Automated campaigns', 'Customer retention'],
        expectedValue: 'Increased customer lifetime value and repeat purchases'
      }
    ]
  }
  
  return typeMap[businessType] || []
}

function getSizeBasedRecommendations(size: string): IntegrationRecommendation[] {
  const sizeMap: Record<string, IntegrationRecommendation[]> = {
    'startup': [
      {
        sourceType: 'google-analytics',
        priority: 'high',
        reason: 'Startups need cost-effective analytics to validate product-market fit',
        useCases: ['User behavior', 'Feature adoption', 'Growth metrics', 'Market validation'],
        expectedValue: 'Data-driven product decisions and faster product-market fit'
      }
    ],
    'enterprise': [
      {
        sourceType: 'postgres',
        priority: 'critical',
        reason: 'Enterprise-scale data requires robust, scalable database infrastructure',
        useCases: ['Data warehousing', 'Business intelligence', 'Compliance', 'Integration hub'],
        expectedValue: 'Scalable data architecture supporting complex business needs'
      }
    ]
  }
  
  return sizeMap[size] || []
}

function getEssentialRecommendations(): IntegrationRecommendation[] {
  return [
    {
      sourceType: 'google-analytics',
      priority: 'high',
      reason: 'Essential for understanding digital presence and user behavior',
      useCases: ['Website performance', 'User acquisition', 'Content effectiveness', 'Marketing ROI'],
      expectedValue: 'Foundation for all digital marketing and product decisions'
    },
    {
      sourceType: 'slack',
      priority: 'medium',
      reason: 'Team communication data provides insights into collaboration patterns',
      useCases: ['Team productivity', 'Communication patterns', 'Project tracking', 'Knowledge sharing'],
      expectedValue: 'Improved team collaboration and knowledge management'
    }
  ]
}

function mergeDuplicateRecommendations(recommendations: IntegrationRecommendation[]): IntegrationRecommendation[] {
  const merged: { [key: string]: IntegrationRecommendation } = {}
  
  recommendations.forEach(rec => {
    if (merged[rec.sourceType]) {
      const existing = merged[rec.sourceType]
      const newPriority = getPriorityScore(rec.priority) < getPriorityScore(existing.priority) 
        ? rec.priority 
        : existing.priority
      
      merged[rec.sourceType] = {
        ...existing,
        priority: newPriority,
        useCases: Array.from(new Set([...existing.useCases, ...rec.useCases])),
        reason: rec.reason.length > existing.reason.length ? rec.reason : existing.reason
      }
    } else {
      merged[rec.sourceType] = rec
    }
  })
  
  return Object.values(merged)
}

function getPriorityScore(priority: string): number {
  const scores = { 'critical': 1, 'high': 2, 'medium': 3, 'low': 4 }
  return scores[priority as keyof typeof scores] || 5
}

function getFallbackRecommendations(profile: BusinessProfile): string[] {
  const industryDefaults: Record<string, string[]> = {
    'ecommerce': ['shopify', 'stripe', 'google-analytics', 'mailchimp'],
    'saas': ['salesforce', 'stripe', 'postgres', 'mixpanel', 'slack'],
    'retail': ['shopify', 'stripe', 'google-analytics', 'mailchimp'],
    'healthcare': ['postgres', 'salesforce', 'slack'],
    'finance': ['postgres', 'stripe', 'salesforce'],
    'nonprofit': ['salesforce', 'mailchimp', 'stripe'],
    'manufacturing': ['postgres', 'salesforce', 'slack'],
    'consulting': ['salesforce', 'slack', 'google-analytics'],
    'education': ['postgres', 'google-analytics', 'slack'],
    'real-estate': ['salesforce', 'mailchimp', 'google-analytics']
  }
  
  const businessTypeDefaults: Record<string, string[]> = {
    'b2b': ['salesforce', 'hubspot', 'postgres', 'slack'],
    'b2c': ['google-analytics', 'mailchimp', 'stripe', 'postgres'],
    'marketplace': ['stripe', 'postgres', 'google-analytics', 'mailchimp'],
    'saas': ['salesforce', 'stripe', 'mixpanel', 'postgres']
  }
  
  return industryDefaults[profile.industry?.toLowerCase()] || 
         businessTypeDefaults[profile.businessType] || 
         ['postgres', 'google-analytics', 'stripe', 'slack']
}

function generateRecommendationReasoning(profile: BusinessProfile, recommendations: IntegrationRecommendation[]): string {
  const criticalCount = recommendations.filter(r => r.priority === 'critical').length
  const highCount = recommendations.filter(r => r.priority === 'high').length
  
  const businessContext = profile.businessType === 'b2b' 
    ? 'customer relationship management and sales optimization' 
    : 'customer analytics and user experience optimization'
  
  const sizeContext = profile.size === 'startup' 
    ? 'rapid growth and product-market fit validation'
    : profile.size === 'enterprise'
    ? 'scalable data infrastructure and compliance'
    : 'operational efficiency and competitive advantage'
  
  return `Based on your ${profile.businessType} ${profile.industry} business (${profile.size} size), we identified ${criticalCount} critical and ${highCount} high-priority integrations. These recommendations focus on ${businessContext}, which are essential for ${sizeContext} in the ${profile.industry} industry. This integration strategy will provide immediate insights while building a foundation for long-term data-driven growth.`
}