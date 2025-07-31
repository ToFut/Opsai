import * as cheerio from 'cheerio'
import { DiscoveredIntegration } from '@opsai/shared'

interface IntegrationPattern {
  provider: string
  type: 'payment' | 'crm' | 'email' | 'analytics' | 'ecommerce' | 'social' | 'other'
  authType: 'oauth2' | 'oauth1' | 'apikey' | 'basic'
  patterns: {
    api?: RegExp[]
    dom?: RegExp[]
    script?: RegExp[]
    meta?: RegExp[]
  }
  endpoints: string[]
  scopes?: string[]
  dataTypes: string[]
}

export class IntegrationDetector {
  private patterns: IntegrationPattern[]
  
  constructor() {
    this.patterns = this.loadIntegrationPatterns()
  }
  
  /**
   * Detect all integrations from website analysis
   */
  async detectIntegrations(
    url: string,
    html: string,
    apiCalls: string[],
    $: cheerio.CheerioAPI
  ): Promise<DiscoveredIntegration[]> {
    const integrations: DiscoveredIntegration[] = []
    
    // Check each integration pattern
    for (const pattern of this.patterns) {
      const detected = await this.checkIntegration(pattern, url, html, apiCalls, $)
      if (detected) {
        integrations.push(detected)
      }
    }
    
    // Sort by priority
    return integrations.sort((a, b) => {
      const priorityOrder = { required: 0, recommended: 1, optional: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
  
  /**
   * Quick integration detection for additional pages
   */
  async detectIntegrationsQuick(
    url: string,
    html: string,
    $: cheerio.CheerioAPI
  ): Promise<DiscoveredIntegration[]> {
    const integrations: DiscoveredIntegration[] = []
    
    // Quick DOM-based detection only
    for (const pattern of this.patterns) {
      if (pattern.patterns.dom) {
        for (const domPattern of pattern.patterns.dom) {
          if (domPattern.test(html)) {
            integrations.push(this.createIntegration(pattern, 'dom'))
            break
          }
        }
      }
    }
    
    return integrations
  }
  
  /**
   * Load integration patterns
   */
  private loadIntegrationPatterns(): IntegrationPattern[] {
    return [
      // E-commerce
      {
        provider: 'shopify',
        type: 'ecommerce',
        authType: 'oauth2',
        patterns: {
          api: [/myshopify\.com\/admin\/api/, /shopify\.com\/api/],
          dom: [/Shopify\.shop/, /shopify-section/],
          script: [/cdn\.shopify\.com/]
        },
        endpoints: [
          '/admin/api/products',
          '/admin/api/orders',
          '/admin/api/customers',
          '/admin/api/inventory'
        ],
        scopes: [
          'read_products',
          'write_products',
          'read_orders',
          'read_customers',
          'read_inventory'
        ],
        dataTypes: ['products', 'orders', 'customers', 'inventory', 'collections']
      },
      
      // Payments
      {
        provider: 'stripe',
        type: 'payment',
        authType: 'oauth2',
        patterns: {
          api: [/api\.stripe\.com/, /checkout\.stripe\.com/],
          dom: [/stripe-button/, /data-stripe/],
          script: [/js\.stripe\.com/]
        },
        endpoints: [
          '/v1/charges',
          '/v1/customers',
          '/v1/subscriptions',
          '/v1/payment_intents'
        ],
        scopes: [
          'read_write'
        ],
        dataTypes: ['payments', 'customers', 'subscriptions', 'invoices']
      },
      {
        provider: 'paypal',
        type: 'payment',
        authType: 'oauth2',
        patterns: {
          api: [/api\.paypal\.com/, /api-m\.paypal\.com/],
          dom: [/paypal-button/, /paypal-checkout/],
          script: [/paypalobjects\.com/]
        },
        endpoints: [
          '/v2/checkout/orders',
          '/v1/payments/payment',
          '/v1/billing/subscriptions'
        ],
        scopes: [
          'openid',
          'profile',
          'email',
          'https://uri.paypal.com/services/payments/futurepayments'
        ],
        dataTypes: ['payments', 'orders', 'subscriptions']
      },
      {
        provider: 'square',
        type: 'payment',
        authType: 'oauth2',
        patterns: {
          api: [/connect\.squareup\.com/, /square-sandbox/],
          dom: [/square-payment/, /sq-payment-form/],
          script: [/squareup\.com/]
        },
        endpoints: [
          '/v2/payments',
          '/v2/customers',
          '/v2/orders',
          '/v2/catalog'
        ],
        scopes: [
          'PAYMENTS_READ',
          'PAYMENTS_WRITE',
          'CUSTOMERS_READ',
          'ORDERS_READ'
        ],
        dataTypes: ['payments', 'customers', 'orders', 'catalog']
      },
      
      // CRM
      {
        provider: 'salesforce',
        type: 'crm',
        authType: 'oauth2',
        patterns: {
          api: [/salesforce\.com/, /force\.com/, /my\.salesforce/],
          dom: [/salesforce/, /sforce/],
          script: [/force\.com/]
        },
        endpoints: [
          '/services/data/vXX.X/sobjects',
          '/services/data/vXX.X/query',
          '/services/data/vXX.X/composite'
        ],
        scopes: [
          'api',
          'refresh_token',
          'offline_access'
        ],
        dataTypes: ['accounts', 'contacts', 'opportunities', 'leads', 'cases']
      },
      {
        provider: 'hubspot',
        type: 'crm',
        authType: 'oauth2',
        patterns: {
          api: [/api\.hubapi\.com/, /api\.hubspot\.com/],
          dom: [/hs-form/, /hubspot-form/],
          script: [/js\.hs-scripts\.com/]
        },
        endpoints: [
          '/crm/v3/objects/contacts',
          '/crm/v3/objects/companies',
          '/crm/v3/objects/deals',
          '/marketing/v3/forms'
        ],
        scopes: [
          'crm.objects.contacts.read',
          'crm.objects.companies.read',
          'crm.objects.deals.read'
        ],
        dataTypes: ['contacts', 'companies', 'deals', 'forms', 'emails']
      },
      
      // Email/Marketing
      {
        provider: 'mailchimp',
        type: 'email',
        authType: 'oauth2',
        patterns: {
          api: [/api\.mailchimp\.com/, /us\d+\.api\.mailchimp\.com/],
          dom: [/mc-field-group/, /mailchimp-form/],
          script: [/chimpstatic\.com/]
        },
        endpoints: [
          '/3.0/lists',
          '/3.0/campaigns',
          '/3.0/automations',
          '/3.0/reports'
        ],
        scopes: [],
        dataTypes: ['lists', 'subscribers', 'campaigns', 'automations']
      },
      {
        provider: 'sendgrid',
        type: 'email',
        authType: 'apikey',
        patterns: {
          api: [/api\.sendgrid\.com/, /sendgrid\.com\/api/],
          dom: [/sendgrid/],
          meta: [/sendgrid/]
        },
        endpoints: [
          '/v3/mail/send',
          '/v3/contacts',
          '/v3/marketing/lists',
          '/v3/stats'
        ],
        dataTypes: ['emails', 'contacts', 'lists', 'statistics']
      },
      {
        provider: 'twilio',
        type: 'email',
        authType: 'basic',
        patterns: {
          api: [/api\.twilio\.com/, /twilio\.com\/api/],
          dom: [/twilio/]
        },
        endpoints: [
          '/2010-04-01/Accounts',
          '/2010-04-01/Messages',
          '/v1/Services'
        ],
        dataTypes: ['messages', 'calls', 'notifications']
      },
      
      // Analytics
      {
        provider: 'google_analytics',
        type: 'analytics',
        authType: 'oauth2',
        patterns: {
          api: [/google-analytics\.com/, /analytics\.google\.com/],
          dom: [/google-analytics/, /gtag\(/, /_gaq/],
          script: [/googletagmanager\.com/, /google-analytics\.com/]
        },
        endpoints: [
          '/v4/reports:batchGet',
          '/v3/data/ga',
          '/v3/management/accounts'
        ],
        scopes: [
          'https://www.googleapis.com/auth/analytics.readonly'
        ],
        dataTypes: ['pageviews', 'events', 'conversions', 'audiences']
      },
      {
        provider: 'segment',
        type: 'analytics',
        authType: 'apikey',
        patterns: {
          api: [/api\.segment\.io/, /tracking\.segment\.io/],
          dom: [/analytics\.track/, /analytics\.identify/],
          script: [/cdn\.segment\.com/]
        },
        endpoints: [
          '/v1/track',
          '/v1/identify',
          '/v1/page',
          '/v1/batch'
        ],
        dataTypes: ['events', 'users', 'pageviews']
      },
      {
        provider: 'mixpanel',
        type: 'analytics',
        authType: 'apikey',
        patterns: {
          api: [/api\.mixpanel\.com/, /mixpanel\.com\/api/],
          dom: [/mixpanel\.track/, /mixpanel\.identify/],
          script: [/cdn\.mixpanel\.com/]
        },
        endpoints: [
          '/track',
          '/engage',
          '/import',
          '/export'
        ],
        dataTypes: ['events', 'users', 'cohorts', 'funnels']
      },
      
      // Social
      {
        provider: 'facebook',
        type: 'social',
        authType: 'oauth2',
        patterns: {
          api: [/graph\.facebook\.com/, /facebook\.com\/tr/],
          dom: [/fb-like/, /fb-share/, /facebook-pixel/],
          script: [/connect\.facebook\.net/]
        },
        endpoints: [
          '/me',
          '/me/accounts',
          '/act_/insights',
          '/page-id/feed'
        ],
        scopes: [
          'email',
          'public_profile',
          'pages_read_engagement',
          'ads_read'
        ],
        dataTypes: ['profile', 'pages', 'ads', 'insights']
      },
      {
        provider: 'twitter',
        type: 'social',
        authType: 'oauth2',
        patterns: {
          api: [/api\.twitter\.com/, /twitter\.com\/i\/api/],
          dom: [/twitter-share/, /twitter-timeline/],
          script: [/platform\.twitter\.com/]
        },
        endpoints: [
          '/2/tweets',
          '/2/users',
          '/2/spaces'
        ],
        scopes: [
          'tweet.read',
          'users.read',
          'offline.access'
        ],
        dataTypes: ['tweets', 'users', 'analytics']
      },
      
      // Other integrations
      {
        provider: 'zendesk',
        type: 'other',
        authType: 'oauth2',
        patterns: {
          api: [/zendesk\.com\/api/, /\w+\.zendesk\.com/],
          dom: [/zendesk/, /zopim/],
          script: [/assets\.zendesk\.com/]
        },
        endpoints: [
          '/api/v2/tickets',
          '/api/v2/users',
          '/api/v2/organizations'
        ],
        scopes: [
          'read',
          'write'
        ],
        dataTypes: ['tickets', 'users', 'organizations']
      },
      {
        provider: 'intercom',
        type: 'other',
        authType: 'oauth2',
        patterns: {
          api: [/api\.intercom\.io/, /intercom\.io\/api/],
          dom: [/intercom-launcher/, /intercom-messenger/],
          script: [/widget\.intercom\.io/]
        },
        endpoints: [
          '/contacts',
          '/conversations',
          '/companies',
          '/data_attributes'
        ],
        scopes: [],
        dataTypes: ['contacts', 'conversations', 'companies']
      },
      {
        provider: 'slack',
        type: 'other',
        authType: 'oauth2',
        patterns: {
          api: [/slack\.com\/api/, /hooks\.slack\.com/],
          dom: [/slack-button/, /slack-widget/]
        },
        endpoints: [
          '/api/chat.postMessage',
          '/api/users.list',
          '/api/channels.list'
        ],
        scopes: [
          'chat:write',
          'users:read',
          'channels:read'
        ],
        dataTypes: ['messages', 'users', 'channels']
      }
    ]
  }
  
  /**
   * Check if an integration is present
   */
  private async checkIntegration(
    pattern: IntegrationPattern,
    url: string,
    html: string,
    apiCalls: string[],
    $: cheerio.CheerioAPI
  ): Promise<DiscoveredIntegration | null> {
    let detected = false
    let detectionMethod = ''
    const detectedEndpoints: string[] = []
    
    // Check API calls
    if (pattern.patterns.api) {
      for (const apiPattern of pattern.patterns.api) {
        const matchingCalls = apiCalls.filter(call => apiPattern.test(call))
        if (matchingCalls.length > 0) {
          detected = true
          detectionMethod = 'api'
          
          // Extract endpoints from API calls
          for (const call of matchingCalls) {
            try {
              const urlObj = new URL(call)
              detectedEndpoints.push(urlObj.pathname)
            } catch {}
          }
          break
        }
      }
    }
    
    // Check DOM patterns
    if (!detected && pattern.patterns.dom) {
      for (const domPattern of pattern.patterns.dom) {
        if (domPattern.test(html)) {
          detected = true
          detectionMethod = 'dom'
          break
        }
      }
    }
    
    // Check script sources
    if (!detected && pattern.patterns.script) {
      const scripts = $('script[src]').map((_, el) => $(el).attr('src')).get()
      for (const scriptPattern of pattern.patterns.script) {
        if (scripts.some(src => src && scriptPattern.test(src))) {
          detected = true
          detectionMethod = 'script'
          break
        }
      }
    }
    
    if (!detected) {
      return null
    }
    
    return this.createIntegration(pattern, detectionMethod, detectedEndpoints)
  }
  
  /**
   * Create integration object
   */
  private createIntegration(
    pattern: IntegrationPattern,
    detectionMethod: string,
    detectedEndpoints: string[] = []
  ): DiscoveredIntegration {
    // Determine priority based on type and detection method
    let priority: 'required' | 'recommended' | 'optional' = 'optional'
    
    if (pattern.type === 'payment' || pattern.type === 'ecommerce') {
      priority = 'required'
    } else if (pattern.type === 'crm' || pattern.type === 'email') {
      priority = 'recommended'
    }
    
    // If detected via API calls, it's likely required
    if (detectionMethod === 'api') {
      priority = 'required'
    }
    
    return {
      id: `integration_${pattern.provider}_${Date.now()}`,
      provider: pattern.provider,
      type: pattern.type,
      authType: pattern.authType,
      scopes: pattern.scopes,
      detectedEndpoints: detectedEndpoints.length > 0 ? detectedEndpoints : pattern.endpoints,
      estimatedApiCalls: detectedEndpoints.length * 100, // Rough estimate
      dataTypes: pattern.dataTypes,
      priority
    }
  }
}