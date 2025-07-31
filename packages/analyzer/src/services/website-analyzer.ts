import { chromium, Browser, Page } from 'playwright'
import * as cheerio from 'cheerio'
import { 
  WebsiteAnalysis, 
  BusinessProfile, 
  TechnologyStack,
  DiscoveredIntegration,
  InferredDataModel,
  UserJourney,
  AnalysisMetrics
} from '@opsai/shared'
import { OpenAI } from 'openai'
import PQueue from 'p-queue'
import { LRUCache } from 'lru-cache'
import { TechnologyDetector } from '../processors/technology-detector'
import { IntegrationDetector } from '../processors/integration-detector'
import { DataModelInferencer } from '../processors/data-model-inferencer'
import { UserJourneyAnalyzer } from '../processors/user-journey-analyzer'

export interface WebsiteAnalyzerConfig {
  // OpenAI
  openaiApiKey: string
  
  // Concurrency
  maxConcurrentAnalyses: number
  maxPagesPerAnalysis: number
  
  // Timeouts
  pageLoadTimeout: number
  analysisTimeout: number
  
  // Caching
  cacheEnabled: boolean
  cacheTTL: number
  maxCacheSize: number
  
  // Rate limiting
  rateLimitPerMinute: number
  
  // Resource limits
  maxMemoryPerAnalysis: number
}

export class WebsiteAnalyzer {
  private browser: Browser | null = null
  private openai: OpenAI
  private queue: PQueue
  private cache: LRUCache<string, WebsiteAnalysis>
  private config: WebsiteAnalyzerConfig
  
  // Processors
  private techDetector: TechnologyDetector
  private integrationDetector: IntegrationDetector
  private dataModelInferencer: DataModelInferencer
  private journeyAnalyzer: UserJourneyAnalyzer
  
  constructor(config: WebsiteAnalyzerConfig) {
    this.config = config
    
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    })
    
    // Initialize queue for concurrent processing
    this.queue = new PQueue({
      concurrency: config.maxConcurrentAnalyses,
      interval: 60000, // 1 minute
      intervalCap: config.rateLimitPerMinute
    })
    
    // Initialize cache
    this.cache = new LRUCache<string, WebsiteAnalysis>({
      max: config.maxCacheSize,
      ttl: config.cacheTTL * 1000, // Convert to ms
      updateAgeOnGet: true,
      updateAgeOnHas: true
    })
    
    // Initialize processors
    this.techDetector = new TechnologyDetector()
    this.integrationDetector = new IntegrationDetector()
    this.dataModelInferencer = new DataModelInferencer(this.openai)
    this.journeyAnalyzer = new UserJourneyAnalyzer(this.openai)
  }
  
  /**
   * Initialize browser instance
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          `--max-old-space-size=${this.config.maxMemoryPerAnalysis}`
        ]
      })
    }
  }
  
  /**
   * Analyze a website and return comprehensive analysis
   */
  async analyzeWebsite(url: string, userId: string): Promise<WebsiteAnalysis> {
    const analysisId = this.generateAnalysisId(url, userId)
    
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(analysisId)
      if (cached) {
        return cached
      }
    }
    
    // Queue the analysis
    return this.queue.add(async () => {
      const startTime = Date.now()
      const analysis = await this.performAnalysis(analysisId, url)
      
      // Cache the result
      if (this.config.cacheEnabled) {
        this.cache.set(analysisId, analysis)
      }
      
      // Update metrics
      analysis.metrics.analysisTime = Date.now() - startTime
      
      return analysis
    })
  }
  
  /**
   * Perform the actual website analysis
   */
  private async performAnalysis(id: string, url: string): Promise<WebsiteAnalysis> {
    await this.initialize()
    
    const analysis: WebsiteAnalysis = {
      id,
      url,
      timestamp: new Date(),
      status: 'analyzing',
      business: {} as BusinessProfile,
      technology: {} as TechnologyStack,
      integrations: [],
      dataModels: [],
      userJourneys: [],
      metrics: {
        analysisTime: 0,
        pagesAnalyzed: 0,
        apisDiscovered: 0,
        coverageScore: 0,
        confidenceScore: 0,
        memoryUsed: 0,
        apiCallsMade: 0
      },
      cacheKey: id,
      ttl: this.config.cacheTTL
    }
    
    const context = await this.browser!.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (OpsAI Analyzer) AppleWebKit/537.36'
    })
    
    try {
      // Create page with resource monitoring
      const page = await context.newPage()
      
      // Track API calls
      const apiCalls: string[] = []
      page.on('request', (request) => {
        const url = request.url()
        if (this.isApiCall(url)) {
          apiCalls.push(url)
        }
      })
      
      // Navigate to the website
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.config.pageLoadTimeout
      })
      
      // Wait for dynamic content
      await page.waitForTimeout(2000)
      
      // Get page content
      const html = await page.content()
      const $ = cheerio.load(html)
      
      // Parallel analysis tasks
      const [
        businessProfile,
        technology,
        integrations,
        dataModels,
        userJourneys
      ] = await Promise.all([
        this.analyzeBusinessProfile(url, html, $),
        this.techDetector.detectTechnologies(url, html, page),
        this.integrationDetector.detectIntegrations(url, html, apiCalls, $),
        this.dataModelInferencer.inferDataModels(url, html, $),
        this.journeyAnalyzer.analyzeUserJourneys(url, html, $, page)
      ])
      
      // Update analysis
      analysis.business = businessProfile
      analysis.technology = technology
      analysis.integrations = integrations
      analysis.dataModels = dataModels
      analysis.userJourneys = userJourneys
      
      // Crawl additional pages for better coverage
      const additionalPages = await this.discoverAdditionalPages($, url)
      const crawledPages = await this.crawlAdditionalPages(
        context,
        additionalPages.slice(0, this.config.maxPagesPerAnalysis - 1)
      )
      
      // Merge insights from additional pages
      for (const pageData of crawledPages) {
        // Merge integrations
        for (const integration of pageData.integrations) {
          if (!analysis.integrations.find(i => i.provider === integration.provider)) {
            analysis.integrations.push(integration)
          }
        }
        
        // Merge data models
        for (const model of pageData.dataModels) {
          if (!analysis.dataModels.find(m => m.name === model.name)) {
            analysis.dataModels.push(model)
          }
        }
      }
      
      // Calculate metrics
      analysis.metrics = {
        analysisTime: 0, // Will be set by caller
        pagesAnalyzed: 1 + crawledPages.length,
        apisDiscovered: apiCalls.length,
        coverageScore: this.calculateCoverageScore(analysis),
        confidenceScore: this.calculateConfidenceScore(analysis),
        memoryUsed: process.memoryUsage().heapUsed,
        apiCallsMade: apiCalls.length
      }
      
      analysis.status = 'completed'
      
    } catch (error) {
      analysis.status = 'failed'
      throw error
    } finally {
      await context.close()
    }
    
    return analysis
  }
  
  /**
   * Analyze business profile using AI
   */
  private async analyzeBusinessProfile(
    url: string,
    html: string,
    $: cheerio.CheerioAPI
  ): Promise<BusinessProfile> {
    // Extract text content
    const textContent = this.extractTextContent($)
    
    // Prepare prompt for AI
    const prompt = `
Analyze this website and provide a business profile in JSON format:
URL: ${url}

Website Content:
${textContent.slice(0, 3000)}

Provide analysis in this exact JSON format:
{
  "name": "Business name",
  "type": "ecommerce|saas|marketplace|service|content|other",
  "industry": "specific industry",
  "description": "brief description",
  "estimatedRevenue": "revenue range or null",
  "estimatedCustomers": number or null,
  "estimatedTransactions": number or null,
  "features": ["list", "of", "key", "features"],
  "confidenceScore": 0.0-1.0
}
`
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
      
      const result = JSON.parse(response.choices[0].message.content || '{}')
      return result as BusinessProfile
      
    } catch (error) {
      console.error('Failed to analyze business profile:', error)
      
      // Fallback analysis
      return {
        name: $('title').text() || 'Unknown',
        type: 'other',
        industry: 'unknown',
        description: $('meta[name="description"]').attr('content') || '',
        features: [],
        confidenceScore: 0.3
      }
    }
  }
  
  /**
   * Extract clean text content from page
   */
  private extractTextContent($: cheerio.CheerioAPI): string {
    // Remove scripts and styles
    $('script, style, noscript').remove()
    
    // Get text from important elements
    const importantText = [
      $('title').text(),
      $('meta[name="description"]').attr('content') || '',
      $('h1, h2, h3').text(),
      $('p').slice(0, 10).text(),
      $('.hero, .header, .about').text()
    ].join(' ')
    
    // Clean up
    return importantText
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 5000)
  }
  
  /**
   * Discover additional pages to crawl
   */
  private async discoverAdditionalPages(
    $: cheerio.CheerioAPI,
    baseUrl: string
  ): Promise<string[]> {
    const pages = new Set<string>()
    const baseHost = new URL(baseUrl).host
    
    // Find all internal links
    $('a[href]').each((_, elem) => {
      const href = $(elem).attr('href')
      if (href) {
        try {
          const url = new URL(href, baseUrl)
          if (url.host === baseHost && !url.pathname.includes('#')) {
            pages.add(url.toString())
          }
        } catch {}
      }
    })
    
    // Prioritize important pages
    const priorityPaths = [
      '/pricing', '/features', '/products', '/services',
      '/api', '/docs', '/documentation', '/developers',
      '/integrations', '/login', '/signup', '/dashboard'
    ]
    
    const prioritizedPages = Array.from(pages)
      .sort((a, b) => {
        const aPriority = priorityPaths.some(p => a.includes(p)) ? 0 : 1
        const bPriority = priorityPaths.some(p => b.includes(p)) ? 0 : 1
        return aPriority - bPriority
      })
    
    return prioritizedPages
  }
  
  /**
   * Crawl additional pages in parallel
   */
  private async crawlAdditionalPages(
    context: any,
    urls: string[]
  ): Promise<any[]> {
    const results = await Promise.allSettled(
      urls.map(url => this.crawlSinglePage(context, url))
    )
    
    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as any).value)
  }
  
  /**
   * Crawl a single page
   */
  private async crawlSinglePage(context: any, url: string): Promise<any> {
    const page = await context.newPage()
    
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      })
      
      const html = await page.content()
      const $ = cheerio.load(html)
      
      // Quick analysis
      const [integrations, dataModels] = await Promise.all([
        this.integrationDetector.detectIntegrationsQuick(url, html, $),
        this.dataModelInferencer.inferDataModelsQuick(url, html, $)
      ])
      
      return { integrations, dataModels }
      
    } catch (error) {
      return { integrations: [], dataModels: [] }
    } finally {
      await page.close()
    }
  }
  
  /**
   * Check if a URL is an API call
   */
  private isApiCall(url: string): boolean {
    const apiPatterns = [
      '/api/', '/v1/', '/v2/', '/graphql',
      '.json', 'ajax', 'rest', 'webhook'
    ]
    
    return apiPatterns.some(pattern => url.includes(pattern))
  }
  
  /**
   * Calculate coverage score
   */
  private calculateCoverageScore(analysis: WebsiteAnalysis): number {
    const factors = [
      analysis.business.confidenceScore,
      analysis.technology.frontend.length > 0 ? 1 : 0,
      analysis.integrations.length > 0 ? 1 : 0,
      analysis.dataModels.length > 0 ? 1 : 0,
      analysis.userJourneys.length > 0 ? 1 : 0,
      Math.min(analysis.metrics.pagesAnalyzed / 10, 1)
    ]
    
    return factors.reduce((a, b) => a + b, 0) / factors.length
  }
  
  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(analysis: WebsiteAnalysis): number {
    const businessConfidence = analysis.business.confidenceScore
    const techConfidence = this.calculateTechConfidence(analysis.technology)
    const integrationConfidence = this.calculateIntegrationConfidence(analysis.integrations)
    const modelConfidence = this.calculateModelConfidence(analysis.dataModels)
    
    return (businessConfidence + techConfidence + integrationConfidence + modelConfidence) / 4
  }
  
  private calculateTechConfidence(tech: TechnologyStack): number {
    const allTech = [
      ...tech.frontend,
      ...tech.backend,
      ...tech.database,
      ...tech.hosting
    ]
    
    if (allTech.length === 0) return 0
    
    const avgConfidence = allTech.reduce((sum, t) => sum + t.confidence, 0) / allTech.length
    return avgConfidence
  }
  
  private calculateIntegrationConfidence(integrations: DiscoveredIntegration[]): number {
    if (integrations.length === 0) return 0
    
    const requiredIntegrations = integrations.filter(i => i.priority === 'required')
    return requiredIntegrations.length > 0 ? 0.9 : 0.7
  }
  
  private calculateModelConfidence(models: InferredDataModel[]): number {
    if (models.length === 0) return 0
    
    const avgConfidence = models.reduce((sum, m) => sum + m.confidence, 0) / models.length
    return avgConfidence
  }
  
  /**
   * Generate unique analysis ID
   */
  private generateAnalysisId(url: string, userId: string): string {
    const timestamp = Date.now()
    const urlHash = Buffer.from(url).toString('base64').slice(0, 8)
    return `analysis_${userId}_${urlHash}_${timestamp}`
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
    
    this.cache.clear()
  }
}