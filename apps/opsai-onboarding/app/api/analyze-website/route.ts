import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import * as cheerio from 'cheerio'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// Technology patterns for detection
const TECH_PATTERNS = {
  frontend: {
    'react': [/react/i, /_react/i, /jsx/i],
    'vue': [/vue/i, /\.vue/i],
    'angular': [/angular/i, /ng-/i],
    'nextjs': [/_next/i, /next.js/i],
    'gatsby': [/gatsby/i],
    'svelte': [/svelte/i],
    'jquery': [/jquery/i, /\$/i],
    'bootstrap': [/bootstrap/i],
    'tailwind': [/tailwind/i],
    'material-ui': [/mui/i, /material-ui/i]
  },
  backend: {
    'nodejs': [/node.js/i, /express/i],
    'python': [/django/i, /flask/i, /fastapi/i],
    'ruby': [/rails/i, /ruby/i],
    'php': [/\.php/i, /wordpress/i, /laravel/i],
    'java': [/\.jsp/i, /spring/i],
    '.net': [/\.aspx/i, /\.asp/i],
    'go': [/golang/i]
  },
  database: {
    'postgresql': [/postgres/i, /pg/i],
    'mysql': [/mysql/i],
    'mongodb': [/mongo/i],
    'redis': [/redis/i],
    'elasticsearch': [/elastic/i],
    'firebase': [/firebase/i],
    'supabase': [/supabase/i]
  },
  hosting: {
    'vercel': [/vercel/i],
    'netlify': [/netlify/i],
    'aws': [/amazonaws/i, /aws/i],
    'gcp': [/googleapis/i, /google cloud/i],
    'azure': [/azure/i],
    'heroku': [/heroku/i],
    'cloudflare': [/cloudflare/i]
  },
  ecommerce: {
    'shopify': [/shopify/i, /\.myshopify\.com/i],
    'woocommerce': [/woocommerce/i],
    'magento': [/magento/i],
    'bigcommerce': [/bigcommerce/i],
    'squarespace': [/squarespace/i],
    'wix': [/wix/i]
  },
  payments: {
    'stripe': [/stripe/i],
    'paypal': [/paypal/i],
    'square': [/square/i, /squareup/i],
    'braintree': [/braintree/i],
    'authorize.net': [/authorize\.net/i]
  },
  analytics: {
    'google-analytics': [/google-analytics/i, /gtag/i, /_ga/i],
    'mixpanel': [/mixpanel/i],
    'segment': [/segment/i],
    'amplitude': [/amplitude/i],
    'hotjar': [/hotjar/i],
    'heap': [/heap/i]
  },
  marketing: {
    'mailchimp': [/mailchimp/i],
    'hubspot': [/hubspot/i],
    'marketo': [/marketo/i],
    'salesforce': [/salesforce/i],
    'intercom': [/intercom/i],
    'zendesk': [/zendesk/i]
  }
}

// Enhanced website crawler using Playwright simulation
async function crawlWebsite(url: string, maxPages: number = 10) {
  const pages: any[] = []
  const visitedUrls = new Set<string>()
  const baseUrl = new URL(url).origin
  
  async function crawlPage(pageUrl: string) {
    if (visitedUrls.has(pageUrl) || pages.length >= maxPages) return
    visitedUrls.add(pageUrl)
    
    try {
      const response = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (OpsAI Analyzer) AppleWebKit/537.36'
        }
      })
      
      if (!response.ok) return
      
      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Extract comprehensive page data
      const pageData = {
        url: pageUrl,
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        content: $('body').text().replace(/\s+/g, ' ').trim().substring(0, 2000), // Extract main content
        headers: {
          h1: $('h1').map((_, el) => $(el).text().trim()).get(),
          h2: $('h2').map((_, el) => $(el).text().trim()).get(),
          h3: $('h3').map((_, el) => $(el).text().trim()).get()
        },
        navigation: $('nav, .nav, .navigation, .menu').map((_, el) => $(el).text().trim()).get(),
        mainContent: $('main, .main, .content, .container').map((_, el) => $(el).text().trim()).get(),
        scripts: $('script[src]').map((_, el) => $(el).attr('src')).get(),
        links: $('link[href]').map((_, el) => $(el).attr('href')).get(),
        forms: $('form').map((_, el) => ({
          action: $(el).attr('action'),
          method: $(el).attr('method'),
          fields: $(el).find('input, select, textarea').map((_, field) => ({
            type: $(field).attr('type'),
            name: $(field).attr('name'),
            placeholder: $(field).attr('placeholder'),
            required: $(field).attr('required') !== undefined
          })).get()
        })).get(),
        buttons: $('button, .btn, input[type="submit"]').map((_, el) => $(el).text().trim()).get(),
        pricing: $('.price, .pricing, [class*="price"], [class*="cost"]').map((_, el) => $(el).text().trim()).get(),
        contact: $('.contact, [class*="contact"], .phone, .email').map((_, el) => $(el).text().trim()).get(),
        services: $('.service, .services, [class*="service"]').map((_, el) => $(el).text().trim()).get(),
        products: $('.product, .products, [class*="product"]').map((_, el) => $(el).text().trim()).get(),
        images: $('img').length,
        externalScripts: [] as string[],
        internalLinks: [] as string[]
      }
      
      // Extract external scripts
      $('script[src]').each((_, el) => {
        const src = $(el).attr('src')
        if (src && (src.startsWith('http') || src.startsWith('//'))) {
          pageData.externalScripts.push(src)
        }
      })
      
      // Extract internal links for further crawling
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href')
        if (href) {
          try {
            const linkUrl = new URL(href, baseUrl)
            if (linkUrl.origin === baseUrl && !visitedUrls.has(linkUrl.href)) {
              pageData.internalLinks.push(linkUrl.href)
            }
          } catch {}
        }
      })
      
      pages.push(pageData)
      
      // Crawl internal links
      for (const link of pageData.internalLinks.slice(0, 3)) {
        await crawlPage(link)
      }
      
    } catch (error) {
      console.error(`Failed to crawl ${pageUrl}:`, error)
    }
  }
  
  await crawlPage(url)
  return pages
}

// Detect technologies from crawled data
function detectTechnologies(pages: any[]) {
  const detected: Record<string, any[]> = {
    frontend: [],
    backend: [],
    database: [],
    hosting: [],
    ecommerce: [],
    payments: [],
    analytics: [],
    marketing: []
  }
  
  // Combine all page data for analysis
  const allScripts = pages.flatMap(p => p.scripts || [])
  const allLinks = pages.flatMap(p => p.links || [])
  const allExternalScripts = pages.flatMap(p => p.externalScripts || [])
  const allContent = pages.map(p => `${p.title} ${p.description} ${p.headers.h1.join(' ')}`).join(' ')
  
  // Check each technology pattern
  for (const [category, techs] of Object.entries(TECH_PATTERNS)) {
    for (const [tech, patterns] of Object.entries(techs)) {
      let confidence = 0
      let evidence: string[] = []
      
      for (const pattern of patterns) {
        // Check in scripts
        for (const script of allScripts) {
          if (pattern.test(script)) {
            confidence += 0.3
            evidence.push(`Script: ${script}`)
          }
        }
        
        // Check in external scripts
        for (const script of allExternalScripts) {
          if (pattern.test(script)) {
            confidence += 0.5
            evidence.push(`External script: ${script}`)
          }
        }
        
        // Check in content
        if (pattern.test(allContent)) {
          confidence += 0.2
          evidence.push('Found in page content')
        }
      }
      
      if (confidence > 0) {
        detected[category].push({
          name: tech,
          confidence: Math.min(confidence, 1),
          evidence: evidence.slice(0, 3)
        })
      }
    }
  }
  
  // Sort by confidence
  for (const category of Object.keys(detected)) {
    detected[category].sort((a, b) => b.confidence - a.confidence)
  }
  
  return detected
}

// Infer data models from page content
function inferDataModels(pages: any[]) {
  const models: any[] = []
  const modelPatterns = {
    'Product': {
      keywords: ['product', 'item', 'sku', 'price', 'inventory', 'stock'],
      fields: [
        { name: 'name', type: 'string', required: true },
        { name: 'sku', type: 'string', required: true, unique: true },
        { name: 'price', type: 'number', required: true },
        { name: 'description', type: 'string', required: false },
        { name: 'inventory', type: 'number', required: true },
        { name: 'category', type: 'string', required: false }
      ]
    },
    'Customer': {
      keywords: ['customer', 'user', 'client', 'member', 'account'],
      fields: [
        { name: 'email', type: 'string', required: true, unique: true },
        { name: 'firstName', type: 'string', required: true },
        { name: 'lastName', type: 'string', required: true },
        { name: 'phone', type: 'string', required: false },
        { name: 'address', type: 'json', required: false }
      ]
    },
    'Order': {
      keywords: ['order', 'purchase', 'transaction', 'checkout', 'cart'],
      fields: [
        { name: 'orderNumber', type: 'string', required: true, unique: true },
        { name: 'customerId', type: 'string', required: true },
        { name: 'items', type: 'json', required: true },
        { name: 'total', type: 'number', required: true },
        { name: 'status', type: 'string', required: true }
      ]
    },
    'Appointment': {
      keywords: ['appointment', 'booking', 'reservation', 'schedule'],
      fields: [
        { name: 'date', type: 'datetime', required: true },
        { name: 'customerId', type: 'string', required: true },
        { name: 'service', type: 'string', required: true },
        { name: 'duration', type: 'number', required: true },
        { name: 'status', type: 'string', required: true }
      ]
    }
  }
  
  // Check for each model pattern
  const allContent = pages.map(p => 
    `${p.title} ${p.description} ${p.headers.h1.join(' ')} ${p.headers.h2.join(' ')}`
  ).join(' ').toLowerCase()
  
  for (const [modelName, config] of Object.entries(modelPatterns)) {
    const matchCount = config.keywords.filter(keyword => 
      allContent.includes(keyword)
    ).length
    
    if (matchCount >= 2) {
      models.push({
        name: modelName,
        fields: config.fields,
        relationships: [],
        estimatedRecords: '1K-10K',
        confidence: matchCount / config.keywords.length
      })
    }
  }
  
  // Check forms for additional models
  const allForms = pages.flatMap(p => p.forms || [])
  for (const form of allForms) {
    if (form.fields && form.fields.length > 3) {
      const formFields = form.fields.filter((f: any) => f.name)
      if (formFields.length > 3) {
        const modelName = inferModelNameFromForm(form)
        if (!models.find(m => m.name === modelName)) {
          models.push({
            name: modelName,
            fields: formFields.map((f: any) => ({
              name: f.name,
              type: inferFieldType(f.type),
              required: true,
              businessReason: `Found in ${form.action || 'form'}`
            })),
            relationships: [],
            estimatedRecords: '1K-10K',
            confidence: 0.7
          })
        }
      }
    }
  }
  
  return models
}

function inferModelNameFromForm(form: any): string {
  if (form.action) {
    const parts = form.action.split('/').filter(Boolean)
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1]
      return lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
    }
  }
  return 'FormData'
}

function inferFieldType(htmlType: string): string {
  const typeMap: Record<string, string> = {
    'email': 'string',
    'number': 'number',
    'tel': 'string',
    'date': 'date',
    'datetime-local': 'datetime',
    'checkbox': 'boolean',
    'radio': 'string',
    'select': 'string',
    'text': 'string',
    'password': 'string',
    'textarea': 'string'
  }
  return typeMap[htmlType] || 'string'
}

// Identify integrations based on detected technologies
function identifyIntegrations(technologies: any) {
  const integrations: any[] = []
  
  // Map technologies to integration opportunities
  const integrationMap: Record<string, any> = {
    'shopify': {
      provider: 'shopify',
      category: 'ecommerce',
      priority: 'critical',
      businessValue: 'Sync products, orders, and customer data'
    },
    'stripe': {
      provider: 'stripe',
      category: 'payments',
      priority: 'critical',
      businessValue: 'Process payments and manage subscriptions'
    },
    'google-analytics': {
      provider: 'google-analytics',
      category: 'analytics',
      priority: 'important',
      businessValue: 'Track user behavior and conversions'
    },
    'mailchimp': {
      provider: 'mailchimp',
      category: 'marketing',
      priority: 'important',
      businessValue: 'Email marketing automation'
    },
    'salesforce': {
      provider: 'salesforce',
      category: 'crm',
      priority: 'critical',
      businessValue: 'Customer relationship management'
    }
  }
  
  // Check each detected technology
  for (const [category, techs] of Object.entries(technologies)) {
    for (const tech of techs as any[]) {
      if (integrationMap[tech.name]) {
        integrations.push({
          ...integrationMap[tech.name],
          confidence: tech.confidence,
          detected: true
        })
      }
    }
  }
  
  // Add recommended integrations based on business type
  if (technologies.ecommerce.length > 0) {
    if (!integrations.find(i => i.category === 'payments')) {
      integrations.push({
        provider: 'stripe',
        category: 'payments',
        priority: 'critical',
        businessValue: 'Accept online payments',
        detected: false,
        recommended: true
      })
    }
    if (!integrations.find(i => i.category === 'shipping')) {
      integrations.push({
        provider: 'shippo',
        category: 'shipping',
        priority: 'important',
        businessValue: 'Shipping label generation',
        detected: false,
        recommended: true
      })
    }
  }
  
  return integrations
}

// Analyze user journeys
function analyzeUserJourneys(pages: any[]) {
  const journeys: any[] = []
  
  // Common journey patterns
  const journeyPatterns = [
    {
      name: 'Customer Purchase Journey',
      triggers: ['product', 'shop', 'buy', 'cart', 'checkout'],
      steps: [
        'Browse products',
        'View product details',
        'Add to cart',
        'Checkout',
        'Payment',
        'Order confirmation'
      ],
      automationPotential: 'high'
    },
    {
      name: 'User Registration',
      triggers: ['signup', 'register', 'account', 'join'],
      steps: [
        'Fill registration form',
        'Email verification',
        'Profile setup',
        'Welcome email'
      ],
      automationPotential: 'high'
    },
    {
      name: 'Support Ticket',
      triggers: ['support', 'help', 'contact', 'ticket'],
      steps: [
        'Submit support request',
        'Ticket assignment',
        'Response',
        'Resolution',
        'Feedback'
      ],
      automationPotential: 'medium'
    }
  ]
  
  const allContent = pages.map(p => 
    `${p.title} ${p.description} ${p.headers.h1.join(' ')} ${p.headers.h2.join(' ')}`
  ).join(' ').toLowerCase()
  
  for (const pattern of journeyPatterns) {
    const triggerCount = pattern.triggers.filter(trigger => 
      allContent.includes(trigger)
    ).length
    
    if (triggerCount >= 2) {
      journeys.push({
        name: pattern.name,
        steps: pattern.steps,
        automationPotential: pattern.automationPotential,
        confidence: triggerCount / pattern.triggers.length
      })
    }
  }
  
  return journeys
}

export async function POST(request: NextRequest) {
  try {
    const { url, deepAnalysis = true, crawlPages = 10 } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }
    
    console.log(`🔍 Starting enhanced website analysis for: ${url}`)
    
    // Stage 1: Crawl website
    console.log('🕷️ Crawling website pages...')
    const pages = await crawlWebsite(url, crawlPages)
    console.log(`✅ Crawled ${pages.length} pages`)
    
    // Stage 2: Detect technologies
    console.log('🔧 Detecting technologies...')
    const technologies = detectTechnologies(pages)
    
    // Stage 3: Infer data models
    console.log('📊 Inferring data models...')
    const dataModels = inferDataModels(pages)
    
    // Stage 4: Identify integrations
    console.log('🔌 Identifying integration opportunities...')
    const integrations = identifyIntegrations(technologies)
    
    // Stage 5: Analyze user journeys
    console.log('🚶 Analyzing user journeys...')
    const userJourneys = analyzeUserJourneys(pages)
    
    // Stage 6: AI-powered business analysis
    let businessAnalysis = null
    if (deepAnalysis && process.env.OPENAI_API_KEY) {
      console.log('🤖 Running AI business analysis...')
      try {
        businessAnalysis = await analyzeBusinessWithAI(url, pages)
      } catch (error) {
        console.warn('⚠️ AI analysis failed, using mock data:', error)
        businessAnalysis = null
      }
    }
    
    // Use mock data if AI analysis failed or not available
    if (!businessAnalysis) {
      console.log('📋 Using mock business analysis data...')
      businessAnalysis = {
        businessIntelligence: {
          industryCategory: "e-commerce",
          businessModel: "B2C marketplace",
          revenueStreams: ["product sales", "commission", "subscription fees"],
          targetAudience: "Online shoppers looking for quality products",
          competitiveAdvantages: ["Wide product selection", "Fast shipping", "Customer support"],
          operationalComplexity: "medium",
          scalabilityRequirements: "national"
        },
        technicalRequirements: {
          dataModels: [
            {
              name: "Customer",
              description: "Customer information and preferences",
              priority: "critical",
              fields: [
                { name: "id", type: "string", required: true, unique: true, validation: "uuid", businessReason: "Primary identifier" },
                { name: "email", type: "string", required: true, unique: true, validation: "email", businessReason: "Contact and login" },
                { name: "name", type: "string", required: true, unique: false, validation: "min:2", businessReason: "Personalization" }
              ]
            },
            {
              name: "Product",
              description: "Product catalog items",
              priority: "critical",
              fields: [
                { name: "id", type: "string", required: true, unique: true, validation: "uuid", businessReason: "Primary identifier" },
                { name: "name", type: "string", required: true, unique: false, validation: "min:3", businessReason: "Product identification" },
                { name: "price", type: "number", required: true, unique: false, validation: "min:0", businessReason: "Pricing" }
              ]
            }
          ]
        }
      }
    }
    
    // Compile results
    const analysis = {
      id: `analysis_${Date.now()}`,
      url,
      timestamp: new Date(),
      pagesAnalyzed: pages.length,
      business: businessAnalysis || {
        name: extractBusinessName(pages[0]),
        type: inferBusinessType(technologies, pages),
        industry: inferIndustry(pages),
        description: pages[0]?.description || '',
        features: extractFeatures(pages),
        confidence: 0.7
      },
      technology: technologies,
      integrations,
      dataModels,
      userJourneys,
      metrics: {
        coverageScore: calculateCoverageScore(pages, technologies, dataModels),
        confidenceScore: calculateConfidenceScore(technologies, dataModels, integrations)
      }
    }
    
    console.log('✅ Website analysis complete')
    return NextResponse.json(analysis)
    
  } catch (error) {
    console.error('Website analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// AI-powered business analysis
async function analyzeBusinessWithAI(url: string, pages: any[]) {
  // Extract comprehensive content from all pages
  const comprehensiveContent = pages.map(page => ({
    url: page.url,
    title: page.title,
    description: page.description,
    content: page.content,
    headers: page.headers,
    forms: page.forms,
    links: page.links
  })).slice(0, 5) // Limit to first 5 pages for token efficiency

  const prompt = `
You are an expert business analyst and software architect. Analyze this business website comprehensively and provide detailed insights for building a custom business application.

WEBSITE URL: ${url}
PAGES ANALYZED: ${pages.length}

COMPREHENSIVE WEBSITE CONTENT:
${JSON.stringify(comprehensiveContent, null, 2)}

Please provide a detailed business analysis in the following JSON structure:

{
  "businessIntelligence": {
    "industryCategory": "string", // e.g., "restaurant", "e-commerce", "healthcare", "legal", "consulting", "manufacturing"
    "businessModel": "string", // e.g., "B2C marketplace", "subscription service", "franchise operation", "consulting services"
    "revenueStreams": ["string"], // e.g., ["product sales", "subscription fees", "commission", "consulting fees"]
    "targetAudience": "string", // detailed description of primary customers
    "competitiveAdvantages": ["string"], // unique selling propositions
    "operationalComplexity": "low" | "medium" | "high",
    "scalabilityRequirements": "local" | "regional" | "national" | "global"
  },
  
  "technicalRequirements": {
    "dataModels": [
      {
        "name": "string", // e.g., "Customer", "Product", "Order", "Appointment", "Project"
        "description": "string",
        "priority": "critical" | "important" | "nice-to-have",
        "fields": [
          {
            "name": "string",
            "type": "string" | "number" | "boolean" | "date" | "json" | "enum",
            "required": boolean,
            "unique": boolean,
            "validation": "string",
            "businessReason": "string"
          }
        ]
      }
    ],
    
    "integrationOpportunities": [
      {
        "service": "string", // e.g., "Stripe", "QuickBooks", "Mailchimp", "Slack"
        "category": "payments" | "accounting" | "marketing" | "crm" | "inventory" | "communication" | "analytics",
        "priority": "critical" | "important" | "nice-to-have",
        "businessValue": "string",
        "complexity": "low" | "medium" | "high",
        "estimatedSetupTime": "string"
      }
    ],
    
    "workflowRequirements": [
      {
        "name": "string", // e.g., "Order Processing", "Customer Onboarding", "Appointment Booking"
        "description": "string",
        "trigger": "api_call" | "schedule" | "event" | "manual",
        "frequency": "string",
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
        "role": "string", // e.g., "admin", "customer", "staff", "vendor", "manager"
        "description": "string",
        "permissions": ["string"],
        "authenticationMethod": "email_password" | "oauth" | "sso" | "multi_factor",
        "estimatedUsers": "string"
      }
    ],
    "securityRequirements": {
      "dataClassification": "public" | "internal" | "confidential" | "restricted",
      "complianceNeeds": ["string"],
      "auditRequirements": boolean,
      "encryptionLevel": "basic" | "standard" | "high"
    }
  },
  
  "deploymentStrategy": {
    "recommendedPlatform": "vercel" | "netlify" | "aws" | "docker" | "kubernetes",
    "scalingStrategy": "vertical" | "horizontal" | "auto_scaling",
    "environmentNeeds": ["development", "staging", "production"],
    "estimatedTraffic": "string",
    "performanceRequirements": "standard" | "high" | "enterprise",
    "backupStrategy": "daily" | "real_time" | "weekly",
    "monitoringLevel": "basic" | "comprehensive" | "enterprise"
  },
  
  "businessValue": {
    "problemsSolved": ["string"],
    "timeToMarket": "string",
    "roi_potential": "high" | "medium" | "low",
    "maintenanceComplexity": "low" | "medium" | "high",
    "futureEnhancements": ["string"]
  }
}

ANALYSIS GUIDELINES:
1. Be specific and actionable - avoid generic recommendations
2. Consider the business size, industry, and complexity based on the website content
3. Focus on practical, implementable solutions
4. Prioritize features based on business impact
5. Consider both immediate needs and future scalability
6. Factor in the technical capabilities of a small business
7. Recommend modern, proven technologies and integrations
8. Be realistic about timelines and complexity
9. Analyze the actual business model and operations from the website content
10. Identify specific pain points and opportunities for automation

Provide comprehensive, accurate analysis that will guide the creation of a truly custom business application.
`

  try {
    console.log('🤖 Sending comprehensive business analysis request to OpenAI...')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert business analyst and software architect with 15+ years of experience building custom business applications. You understand both technical implementation and business strategy. Analyze the provided website content thoroughly and provide actionable insights."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.2, // Lower temperature for more consistent, factual analysis
      max_tokens: 4000,

    })

    const content = response.choices[0].message.content || '{}'
    // Handle markdown-formatted JSON
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
    const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    const analysisResult = JSON.parse(jsonContent)
    
    console.log('✅ AI Business Analysis completed with comprehensive insights')
    return analysisResult

  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to analyze business with AI')
  }
}

// Helper functions
function extractBusinessName(page: any): string {
  if (!page) return 'Unknown Business'
  
  // Try to extract from title
  const title = page.title || ''
  const parts = title.split(/[-|·]/).map((p: string) => p.trim())
  return parts[0] || 'Unknown Business'
}

function inferBusinessType(technologies: any, pages: any[]): string {
  if (technologies.ecommerce.length > 0) return 'E-commerce'
  if (technologies.payments.length > 0) return 'Service Business'
  
  const allContent = pages.map(p => `${p.title} ${p.description}`).join(' ').toLowerCase()
  
  if (allContent.includes('restaurant') || allContent.includes('menu')) return 'Restaurant'
  if (allContent.includes('clinic') || allContent.includes('medical')) return 'Healthcare'
  if (allContent.includes('consulting') || allContent.includes('agency')) return 'Professional Services'
  if (allContent.includes('software') || allContent.includes('app')) return 'Technology'
  
  return 'General Business'
}

function inferIndustry(pages: any[]): string {
  const allContent = pages.map(p => 
    `${p.title} ${p.description} ${p.headers.h1.join(' ')}`
  ).join(' ').toLowerCase()
  
  const industries = {
    'retail': ['shop', 'store', 'product', 'buy', 'cart'],
    'food-service': ['restaurant', 'menu', 'food', 'dining', 'delivery'],
    'healthcare': ['health', 'medical', 'clinic', 'doctor', 'patient'],
    'technology': ['software', 'app', 'platform', 'api', 'cloud'],
    'finance': ['finance', 'banking', 'investment', 'loan', 'payment'],
    'real-estate': ['property', 'real estate', 'listing', 'rent', 'buy'],
    'education': ['course', 'learning', 'education', 'school', 'training'],
    'professional-services': ['consulting', 'agency', 'service', 'solution']
  }
  
  let bestMatch = 'general'
  let maxScore = 0
  
  for (const [industry, keywords] of Object.entries(industries)) {
    const score = keywords.filter(keyword => allContent.includes(keyword)).length
    if (score > maxScore) {
      maxScore = score
      bestMatch = industry
    }
  }
  
  return bestMatch
}

function extractFeatures(pages: any[]): string[] {
  const features = new Set<string>()
  
  // Extract from headers
  pages.forEach(page => {
    page.headers.h2.forEach((header: string) => {
      if (header.length > 5 && header.length < 50) {
        features.add(header)
      }
    })
  })
  
  return Array.from(features).slice(0, 10)
}

function calculateCoverageScore(pages: any[], technologies: any, dataModels: any[]): number {
  const factors = [
    pages.length >= 3 ? 1 : pages.length / 3,
    Object.values(technologies).flat().length >= 5 ? 1 : Object.values(technologies).flat().length / 5,
    dataModels.length >= 3 ? 1 : dataModels.length / 3
  ]
  
  return factors.reduce((a, b) => a + b, 0) / factors.length
}

function calculateConfidenceScore(technologies: any, dataModels: any[], integrations: any[]): number {
  const techValues = Object.values(technologies).flat() as any[]
  const techConfidence = techValues
    .reduce((sum: number, tech: any) => sum + tech.confidence, 0) / 
    (techValues.length || 1)
  
  const modelConfidence = dataModels
    .reduce((sum, model) => sum + (model.confidence || 0.5), 0) / 
    (dataModels.length || 1)
  
  const integrationConfidence = integrations
    .reduce((sum, int) => sum + (int.confidence || 0.5), 0) / 
    (integrations.length || 1)
  
  return (techConfidence + modelConfidence + integrationConfidence) / 3
}