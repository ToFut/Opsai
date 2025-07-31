import { Page } from 'playwright'
import * as cheerio from 'cheerio'
import { Technology, TechnologyStack } from '@opsai/shared'

interface TechSignature {
  name: string
  category: string
  patterns: {
    headers?: Record<string, RegExp>
    cookies?: Record<string, RegExp>
    html?: RegExp[]
    script?: RegExp[]
    meta?: Record<string, RegExp>
    url?: RegExp[]
  }
  confidence: {
    headers?: number
    cookies?: number
    html?: number
    script?: number
    meta?: number
    url?: number
  }
}

export class TechnologyDetector {
  private signatures: TechSignature[]
  
  constructor() {
    this.signatures = this.loadSignatures()
  }
  
  /**
   * Detect all technologies used on the website
   */
  async detectTechnologies(
    url: string,
    html: string,
    page: Page
  ): Promise<TechnologyStack> {
    const $ = cheerio.load(html)
    
    // Get page headers
    const response = await page.context().request.get(url)
    const headers = response.headers()
    
    // Detect technologies in parallel
    const detectedTech = await Promise.all([
      this.detectFromHeaders(headers),
      this.detectFromHTML(html, $),
      this.detectFromScripts($),
      this.detectFromMeta($),
      this.detectFromURL(url)
    ])
    
    // Flatten and deduplicate
    const allTech = detectedTech.flat()
    const uniqueTech = this.deduplicateTech(allTech)
    
    // Categorize technologies
    return this.categorizeTech(uniqueTech)
  }
  
  /**
   * Load technology signatures
   */
  private loadSignatures(): TechSignature[] {
    return [
      // Frontend frameworks
      {
        name: 'React',
        category: 'frontend',
        patterns: {
          html: [/data-react/, /_reactRoot/, /react-root/],
          script: [/react\.production\.min\.js/, /react\.development\.js/]
        },
        confidence: { html: 0.7, script: 0.9 }
      },
      {
        name: 'Next.js',
        category: 'frontend',
        patterns: {
          headers: { 'x-powered-by': /Next\.js/ },
          html: [/__next/, /_next\/static/],
          meta: { 'next-head-count': /.*/ }
        },
        confidence: { headers: 1.0, html: 0.9, meta: 0.8 }
      },
      {
        name: 'Vue.js',
        category: 'frontend',
        patterns: {
          html: [/v-cloak/, /v-for/, /v-if/],
          script: [/vue\.js/, /vue\.min\.js/]
        },
        confidence: { html: 0.6, script: 0.9 }
      },
      {
        name: 'Angular',
        category: 'frontend',
        patterns: {
          html: [/ng-app/, /ng-controller/, /\[ng/],
          script: [/angular\.js/, /angular\.min\.js/]
        },
        confidence: { html: 0.7, script: 0.9 }
      },
      
      // E-commerce platforms
      {
        name: 'Shopify',
        category: 'ecommerce',
        patterns: {
          headers: { 'x-shopify-stage': /.*/ },
          html: [/shopify\.com/, /myshopify\.com/, /Shopify\.shop/],
          script: [/cdn\.shopify\.com/],
          meta: { 'shopify-checkout-api-token': /.*/ }
        },
        confidence: { headers: 1.0, html: 0.8, script: 0.9, meta: 1.0 }
      },
      {
        name: 'WooCommerce',
        category: 'ecommerce',
        patterns: {
          html: [/woocommerce/, /wc-ajax/],
          script: [/woocommerce\.js/],
          meta: { 'generator': /WooCommerce/ }
        },
        confidence: { html: 0.8, script: 0.9, meta: 1.0 }
      },
      {
        name: 'Magento',
        category: 'ecommerce',
        patterns: {
          headers: { 'x-magento-vary': /.*/ },
          html: [/mage\//, /Magento_/],
          cookies: { 'frontend': /.*/ }
        },
        confidence: { headers: 1.0, html: 0.8, cookies: 0.7 }
      },
      
      // Payment providers
      {
        name: 'Stripe',
        category: 'payments',
        patterns: {
          script: [/js\.stripe\.com/, /checkout\.stripe\.com/],
          html: [/stripe-button/, /stripe-key/]
        },
        confidence: { script: 0.95, html: 0.8 }
      },
      {
        name: 'PayPal',
        category: 'payments',
        patterns: {
          script: [/paypal\.com\/sdk/, /paypalobjects\.com/],
          html: [/paypal-button/, /paypal-checkout/]
        },
        confidence: { script: 0.95, html: 0.8 }
      },
      {
        name: 'Square',
        category: 'payments',
        patterns: {
          script: [/squareup\.com/, /square-sandbox/],
          html: [/square-payment/, /sq-payment-form/]
        },
        confidence: { script: 0.95, html: 0.8 }
      },
      
      // Analytics
      {
        name: 'Google Analytics',
        category: 'analytics',
        patterns: {
          script: [/google-analytics\.com/, /googletagmanager\.com/, /gtag\/js/],
          html: [/ga\(/, /_gaq\.push/]
        },
        confidence: { script: 0.95, html: 0.8 }
      },
      {
        name: 'Segment',
        category: 'analytics',
        patterns: {
          script: [/cdn\.segment\.com/, /segment\.io/],
          html: [/analytics\.track/, /analytics\.identify/]
        },
        confidence: { script: 0.95, html: 0.8 }
      },
      {
        name: 'Mixpanel',
        category: 'analytics',
        patterns: {
          script: [/cdn\.mixpanel\.com/, /mixpanel\.com/],
          html: [/mixpanel\.track/, /mixpanel\.identify/]
        },
        confidence: { script: 0.95, html: 0.8 }
      },
      
      // Marketing/Email
      {
        name: 'Mailchimp',
        category: 'marketing',
        patterns: {
          script: [/mailchimp\.com/, /chimpstatic\.com/],
          html: [/mc-field-group/, /mailchimp-form/],
          url: [/list-manage\.com/]
        },
        confidence: { script: 0.9, html: 0.8, url: 0.95 }
      },
      {
        name: 'SendGrid',
        category: 'marketing',
        patterns: {
          headers: { 'x-mailer': /SendGrid/ },
          html: [/sendgrid\.net/]
        },
        confidence: { headers: 1.0, html: 0.7 }
      },
      {
        name: 'HubSpot',
        category: 'marketing',
        patterns: {
          script: [/js\.hs-scripts\.com/, /hubspot\.com/],
          html: [/hs-form/, /hubspot-form/]
        },
        confidence: { script: 0.95, html: 0.8 }
      },
      
      // Hosting/CDN
      {
        name: 'Vercel',
        category: 'hosting',
        patterns: {
          headers: { 'x-vercel-id': /.*/, 'server': /Vercel/ },
          url: [/\.vercel\.app/, /\.now\.sh/]
        },
        confidence: { headers: 1.0, url: 0.9 }
      },
      {
        name: 'Netlify',
        category: 'hosting',
        patterns: {
          headers: { 'x-nf-request-id': /.*/, 'server': /Netlify/ },
          url: [/\.netlify\.app/, /\.netlify\.com/]
        },
        confidence: { headers: 1.0, url: 0.9 }
      },
      {
        name: 'AWS',
        category: 'hosting',
        patterns: {
          headers: { 'x-amz-request-id': /.*/, 'server': /AmazonS3/ },
          url: [/amazonaws\.com/, /\.s3\./, /cloudfront\.net/]
        },
        confidence: { headers: 0.95, url: 0.9 }
      },
      {
        name: 'Cloudflare',
        category: 'hosting',
        patterns: {
          headers: { 'cf-ray': /.*/, 'server': /cloudflare/ },
          html: [/cloudflare-static/]
        },
        confidence: { headers: 1.0, html: 0.7 }
      },
      
      // Databases (if exposed)
      {
        name: 'MongoDB',
        category: 'database',
        patterns: {
          url: [/mongodb\.net/, /mongo/],
          script: [/mongodb-stitch/]
        },
        confidence: { url: 0.8, script: 0.9 }
      },
      {
        name: 'PostgreSQL',
        category: 'database',
        patterns: {
          headers: { 'x-database': /postgres/i }
        },
        confidence: { headers: 0.9 }
      },
      {
        name: 'Firebase',
        category: 'database',
        patterns: {
          script: [/firebase\.js/, /firebaseapp\.com/],
          html: [/firebase-auth/, /firebaseui/]
        },
        confidence: { script: 0.95, html: 0.8 }
      },
      
      // CMS
      {
        name: 'WordPress',
        category: 'cms',
        patterns: {
          html: [/wp-content/, /wp-includes/, /wp-json/],
          meta: { 'generator': /WordPress/ },
          headers: { 'x-powered-by': /WordPress/ }
        },
        confidence: { html: 0.9, meta: 1.0, headers: 1.0 }
      },
      {
        name: 'Contentful',
        category: 'cms',
        patterns: {
          script: [/contentful\.com/],
          url: [/cdn\.contentful\.com/]
        },
        confidence: { script: 0.9, url: 0.95 }
      },
      {
        name: 'Sanity',
        category: 'cms',
        patterns: {
          script: [/sanity\.io/],
          url: [/cdn\.sanity\.io/]
        },
        confidence: { script: 0.9, url: 0.95 }
      }
    ]
  }
  
  /**
   * Detect from HTTP headers
   */
  private async detectFromHeaders(headers: Record<string, string>): Promise<Technology[]> {
    const detected: Technology[] = []
    
    for (const signature of this.signatures) {
      if (!signature.patterns.headers) continue
      
      for (const [header, pattern] of Object.entries(signature.patterns.headers)) {
        const value = headers[header.toLowerCase()]
        if (value && pattern.test(value)) {
          detected.push({
            name: signature.name,
            category: signature.category,
            confidence: signature.confidence.headers || 0.8,
            detectionMethod: 'header'
          })
        }
      }
    }
    
    return detected
  }
  
  /**
   * Detect from HTML content
   */
  private async detectFromHTML(html: string, $: cheerio.CheerioAPI): Promise<Technology[]> {
    const detected: Technology[] = []
    
    for (const signature of this.signatures) {
      if (!signature.patterns.html) continue
      
      for (const pattern of signature.patterns.html) {
        if (pattern.test(html)) {
          detected.push({
            name: signature.name,
            category: signature.category,
            confidence: signature.confidence.html || 0.7,
            detectionMethod: 'dom'
          })
          break
        }
      }
    }
    
    return detected
  }
  
  /**
   * Detect from script tags
   */
  private async detectFromScripts($: cheerio.CheerioAPI): Promise<Technology[]> {
    const detected: Technology[] = []
    const scripts = $('script[src]').map((_, el) => $(el).attr('src')).get()
    
    for (const signature of this.signatures) {
      if (!signature.patterns.script) continue
      
      for (const pattern of signature.patterns.script) {
        if (scripts.some(src => src && pattern.test(src))) {
          detected.push({
            name: signature.name,
            category: signature.category,
            confidence: signature.confidence.script || 0.9,
            detectionMethod: 'script'
          })
          break
        }
      }
    }
    
    return detected
  }
  
  /**
   * Detect from meta tags
   */
  private async detectFromMeta($: cheerio.CheerioAPI): Promise<Technology[]> {
    const detected: Technology[] = []
    
    for (const signature of this.signatures) {
      if (!signature.patterns.meta) continue
      
      for (const [name, pattern] of Object.entries(signature.patterns.meta)) {
        const content = $(`meta[name="${name}"]`).attr('content') || 
                       $(`meta[property="${name}"]`).attr('content')
        
        if (content && pattern.test(content)) {
          detected.push({
            name: signature.name,
            category: signature.category,
            confidence: signature.confidence.meta || 0.8,
            detectionMethod: 'pattern'
          })
        }
      }
    }
    
    return detected
  }
  
  /**
   * Detect from URL patterns
   */
  private async detectFromURL(url: string): Promise<Technology[]> {
    const detected: Technology[] = []
    
    for (const signature of this.signatures) {
      if (!signature.patterns.url) continue
      
      for (const pattern of signature.patterns.url) {
        if (pattern.test(url)) {
          detected.push({
            name: signature.name,
            category: signature.category,
            confidence: signature.confidence.url || 0.8,
            detectionMethod: 'pattern'
          })
          break
        }
      }
    }
    
    return detected
  }
  
  /**
   * Deduplicate technologies, keeping highest confidence
   */
  private deduplicateTech(technologies: Technology[]): Technology[] {
    const techMap = new Map<string, Technology>()
    
    for (const tech of technologies) {
      const existing = techMap.get(tech.name)
      if (!existing || tech.confidence > existing.confidence) {
        techMap.set(tech.name, tech)
      }
    }
    
    return Array.from(techMap.values())
  }
  
  /**
   * Categorize technologies into stack
   */
  private categorizeTech(technologies: Technology[]): TechnologyStack {
    const stack: TechnologyStack = {
      frontend: [],
      backend: [],
      database: [],
      hosting: [],
      analytics: [],
      payments: [],
      marketing: [],
      stackType: 'traditional'
    }
    
    for (const tech of technologies) {
      switch (tech.category) {
        case 'frontend':
          stack.frontend.push(tech)
          break
        case 'backend':
          stack.backend.push(tech)
          break
        case 'database':
          stack.database.push(tech)
          break
        case 'hosting':
        case 'cdn':
          stack.hosting.push(tech)
          break
        case 'analytics':
          stack.analytics.push(tech)
          break
        case 'payments':
          stack.payments.push(tech)
          break
        case 'marketing':
        case 'email':
          stack.marketing.push(tech)
          break
        default:
          // Add to most relevant category
          if (['cms', 'ecommerce'].includes(tech.category)) {
            stack.backend.push(tech)
          }
      }
    }
    
    // Determine stack type
    stack.stackType = this.determineStackType(stack)
    
    return stack
  }
  
  /**
   * Determine overall stack type
   */
  private determineStackType(stack: TechnologyStack): 'jamstack' | 'traditional' | 'serverless' | 'hybrid' {
    const hasStaticHosting = stack.hosting.some(t => 
      ['Vercel', 'Netlify', 'Cloudflare Pages'].includes(t.name)
    )
    
    const hasServerlessBackend = stack.backend.some(t => 
      ['AWS Lambda', 'Vercel Functions', 'Netlify Functions'].includes(t.name)
    )
    
    const hasTraditionalBackend = stack.backend.some(t => 
      ['Express', 'Django', 'Rails', 'Laravel'].includes(t.name)
    )
    
    const hasStaticGenerator = stack.frontend.some(t => 
      ['Next.js', 'Gatsby', 'Hugo'].includes(t.name)
    )
    
    if (hasStaticGenerator && hasStaticHosting && !hasTraditionalBackend) {
      return 'jamstack'
    } else if (hasServerlessBackend && !hasTraditionalBackend) {
      return 'serverless'
    } else if (hasTraditionalBackend && hasServerlessBackend) {
      return 'hybrid'
    } else {
      return 'traditional'
    }
  }
}