import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, useAI = true } = await request.json()

    if (!websiteUrl || !isValidUrl(websiteUrl)) {
      return NextResponse.json({ error: 'Valid website URL is required' }, { status: 400 })
    }

    // Scrape website content
    const websiteContent = await scrapeWebsite(websiteUrl)
    
    if (!websiteContent) {
      return NextResponse.json({ error: 'Could not analyze website' }, { status: 400 })
    }

    let analysis

    if (useAI && process.env.OPENAI_API_KEY) {
      console.log('🤖 Using direct OpenAI analysis')
      
      // Send website URL directly to OpenAI for analysis
      const openaiAnalysisResponse = await fetch(`${request.nextUrl.origin}/api/ai-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: websiteUrl
        })
      })

      if (openaiAnalysisResponse.ok) {
        const aiResult = await openaiAnalysisResponse.json()
        analysis = {
          ...aiResult,
          analysisType: 'ai_powered',
          nextStep: 'review_insights'
        }
        console.log('✅ OpenAI analysis successful, analysis type set to:', analysis.analysisType)
      } else {
        console.warn('OpenAI analysis failed, falling back to pattern matching')
        analysis = {
          ...performPatternAnalysis(websiteContent, websiteUrl),
          analysisType: 'pattern_matching'
        }
      }
    } else {
      console.log('📋 Using pattern matching analysis')
      // Fallback to pattern matching
      analysis = {
        ...performPatternAnalysis(websiteContent, websiteUrl),
        analysisType: 'pattern_matching'
      }
    }

    return NextResponse.json(analysis)

  } catch (error) {
    console.error('Website discovery error:', error)
    return NextResponse.json({ 
      error: 'Failed to discover systems',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function scrapeWebsite(url: string): Promise<string | null> {
  try {
    // Add protocol if missing
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'OPSAI-Bot/1.0 (+https://opsai.com/bot)'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    
    // Simple HTML parsing without external dependencies
    const titleMatch = html.match(/<title[^>]*>([^<]+)</i)
    const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i)
    const title = titleMatch ? titleMatch[1] : ''
    const description = descMatch ? descMatch[1] : ''
    
    // Extract first 2000 characters of body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, '').substring(0, 2000) : ''

    return JSON.stringify({
      title,
      description,
      bodyText,
      url: fullUrl
    })

  } catch (error) {
    console.error('Website scraping error:', error)
    return null
  }
}

async function analyzeWebsiteContent(content: string, url: string) {
  return performPatternAnalysis(content, url)
}

function performPatternAnalysis(content: string, url: string) {
  const contentLower = content.toLowerCase()
  const urlLower = url.toLowerCase()
  
  // Business type detection
  let businessType = 'General Business'
  let industry = 'general'
  let detectedSystems: string[] = []
  
  // Industry detection patterns
  if (contentLower.includes('restaurant') || contentLower.includes('menu') || contentLower.includes('food') || contentLower.includes('cafe') || contentLower.includes('dining')) {
    businessType = 'Restaurant/Cafe'
    industry = 'food-service'
    detectedSystems = ['square', 'toast', 'doordash', 'uber-eats', 'opentable', 'restaurant365', 'resy']
  } else if (contentLower.includes('shop') || contentLower.includes('store') || contentLower.includes('buy') || contentLower.includes('product')) {
    businessType = 'Retail Store'
    industry = 'retail'
    detectedSystems = ['shopify', 'woocommerce', 'square', 'mailchimp', 'stripe', 'netsuite']
  } else if (contentLower.includes('law') || contentLower.includes('attorney') || contentLower.includes('legal')) {
    businessType = 'Law Firm'
    industry = 'legal'
    detectedSystems = ['quickbooks', 'salesforce', 'calendly', 'zoom', 'notion', 'docusign']
  } else if (contentLower.includes('health') || contentLower.includes('medical') || contentLower.includes('doctor')) {
    businessType = 'Healthcare Practice'
    industry = 'healthcare'
    detectedSystems = ['salesforce', 'stripe', 'calendly', 'zoom', 'notion', 'workday']
  } else if (contentLower.includes('tech') || contentLower.includes('software') || contentLower.includes('startup') || contentLower.includes('saas')) {
    businessType = 'Technology Company'
    industry = 'technology'
    detectedSystems = ['salesforce', 'slack', 'jira', 'notion', 'asana', 'zoom']
  } else if (contentLower.includes('consult') || contentLower.includes('service') || contentLower.includes('agency')) {
    businessType = 'Consulting/Services'
    industry = 'professional-services'
    detectedSystems = ['salesforce', 'hubspot', 'calendly', 'zoom', 'notion', 'quickbooks']
  } else if (contentLower.includes('finance') || contentLower.includes('accounting') || contentLower.includes('bank')) {
    businessType = 'Financial Services'
    industry = 'finance'
    detectedSystems = ['netsuite', 'quickbooks', 'salesforce', 'workday', 'oracle', 'sap']
  } else if (contentLower.includes('manufact') || contentLower.includes('industrial') || contentLower.includes('production')) {
    businessType = 'Manufacturing'
    industry = 'manufacturing'
    detectedSystems = ['netsuite', 'sap', 'oracle', 'workday', 'salesforce', 'monday']
  }

  // Technology detection from URL and content
  if (contentLower.includes('shopify') || urlLower.includes('shopify')) detectedSystems.push('shopify')
  if (contentLower.includes('wordpress') || contentLower.includes('wp-')) detectedSystems.push('wordpress')
  if (contentLower.includes('stripe')) detectedSystems.push('stripe')
  if (contentLower.includes('paypal')) detectedSystems.push('paypal')
  if (contentLower.includes('square')) detectedSystems.push('square')
  if (contentLower.includes('mailchimp')) detectedSystems.push('mailchimp')
  if (contentLower.includes('google-analytics') || contentLower.includes('gtag')) detectedSystems.push('google-analytics')

  // Add common systems based on business type
  const commonSystems = ['quickbooks', 'google-workspace', 'salesforce', 'slack', 'zoom', 'notion']
  detectedSystems.push(...commonSystems)

  return {
    businessType,
    industry,
    detectedSystems: Array.from(new Set(detectedSystems)), // Remove duplicates
    recommendations: [
      'Consolidate all payment processing through a single dashboard',
      'Unify customer data across all platforms',
      'Automate reporting and analytics',
      'Streamline workflow between systems',
      'Create centralized business intelligence hub'
    ],
    integrationOpportunities: [
      'Real-time data synchronization across all platforms',
      'Automated customer communication workflows',
      'Unified reporting dashboard with live metrics',
      'Cross-platform analytics and insights',
      'Automated inventory and booking management'
    ]
  }
}

function isValidUrl(string: string): boolean {
  try {
    // Allow URLs with or without protocol
    const url = string.startsWith('http') ? string : `https://${string}`
    new URL(url)
    return true
  } catch {
    return false
  }
}

function extractBusinessName(websiteContent: string, websiteUrl: string): string {
  try {
    const content = JSON.parse(websiteContent)
    
    // Try to extract from title first
    if (content.title && content.title !== 'Untitled') {
      return content.title.replace(/\s*-\s*.*$/, '').trim() // Remove taglines
    }
    
    // Try to extract from URL
    const domain = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).hostname
    const domainParts = domain.replace('www.', '').split('.')
    if (domainParts.length > 0) {
      return domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1)
    }
    
    return 'Business Name'
  } catch {
    return 'Business Name'
  }
}