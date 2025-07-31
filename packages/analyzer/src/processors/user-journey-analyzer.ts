import { Page } from 'playwright'
import * as cheerio from 'cheerio'
import { OpenAI } from 'openai'
import { UserJourney, JourneyStep, ConversionPoint } from '@opsai/shared'

export class UserJourneyAnalyzer {
  private openai: OpenAI
  
  constructor(openai: OpenAI) {
    this.openai = openai
  }
  
  /**
   * Analyze user journeys on the website
   */
  async analyzeUserJourneys(
    url: string,
    html: string,
    $: cheerio.CheerioAPI,
    page: Page
  ): Promise<UserJourney[]> {
    const journeys: UserJourney[] = []
    
    // Identify key pages and actions
    const navigation = this.extractNavigation($)
    const forms = this.extractForms($)
    const ctas = this.extractCTAs($)
    
    // Analyze different journey types
    const [
      purchaseJourney,
      signupJourney,
      supportJourney,
      discoveryJourney
    ] = await Promise.all([
      this.analyzePurchaseJourney($, navigation, forms, ctas),
      this.analyzeSignupJourney($, navigation, forms, ctas),
      this.analyzeSupportJourney($, navigation, forms),
      this.analyzeDiscoveryJourney($, navigation)
    ])
    
    // Add non-null journeys
    if (purchaseJourney) journeys.push(purchaseJourney)
    if (signupJourney) journeys.push(signupJourney)
    if (supportJourney) journeys.push(supportJourney)
    if (discoveryJourney) journeys.push(discoveryJourney)
    
    // Enhance with AI analysis
    const enhancedJourneys = await this.enhanceJourneysWithAI(journeys, url)
    
    return enhancedJourneys
  }
  
  /**
   * Extract navigation structure
   */
  private extractNavigation($: cheerio.CheerioAPI): NavigationItem[] {
    const items: NavigationItem[] = []
    
    // Main navigation
    $('nav a, header a, .navigation a, .menu a').each((_, el) => {
      const $link = $(el)
      const text = $link.text().trim()
      const href = $link.attr('href')
      
      if (text && href && !href.startsWith('#')) {
        items.push({
          text,
          href,
          type: this.classifyNavigationItem(text, href)
        })
      }
    })
    
    // Footer navigation
    $('footer a').each((_, el) => {
      const $link = $(el)
      const text = $link.text().trim()
      const href = $link.attr('href')
      
      if (text && href && !href.startsWith('#')) {
        items.push({
          text,
          href,
          type: 'footer'
        })
      }
    })
    
    return items
  }
  
  /**
   * Extract forms
   */
  private extractForms($: cheerio.CheerioAPI): FormInfo[] {
    const forms: FormInfo[] = []
    
    $('form').each((_, el) => {
      const $form = $(el)
      const action = $form.attr('action') || ''
      const method = $form.attr('method') || 'get'
      const id = $form.attr('id') || ''
      const classes = $form.attr('class') || ''
      
      // Identify form type
      const type = this.classifyForm($form, action, id, classes)
      
      // Extract fields
      const fields = $form.find('input, select, textarea')
        .map((_, field) => {
          const $field = $(field)
          return {
            name: $field.attr('name') || '',
            type: $field.attr('type') || 'text',
            required: $field.attr('required') !== undefined
          }
        })
        .get()
        .filter(f => f.name && !f.name.includes('csrf'))
      
      forms.push({
        type,
        action,
        method,
        fields,
        submitText: $form.find('button[type="submit"], input[type="submit"]').text().trim()
      })
    })
    
    return forms
  }
  
  /**
   * Extract CTAs (Call to Actions)
   */
  private extractCTAs($: cheerio.CheerioAPI): CTAInfo[] {
    const ctas: CTAInfo[] = []
    
    // Button CTAs
    $('button, .button, .btn, a.cta, [class*="cta"]').each((_, el) => {
      const $el = $(el)
      const text = $el.text().trim()
      const href = $el.attr('href')
      const onclick = $el.attr('onclick')
      
      if (text && (href || onclick || $el.is('button'))) {
        ctas.push({
          text,
          type: this.classifyCTA(text),
          destination: href || 'javascript',
          prominence: this.calculateProminence($el)
        })
      }
    })
    
    return ctas
  }
  
  /**
   * Analyze purchase journey
   */
  private async analyzePurchaseJourney(
    $: cheerio.CheerioAPI,
    navigation: NavigationItem[],
    forms: FormInfo[],
    ctas: CTAInfo[]
  ): Promise<UserJourney | null> {
    // Check if this is an e-commerce site
    const hasEcommerce = 
      navigation.some(n => n.type === 'shop') ||
      forms.some(f => f.type === 'add-to-cart') ||
      ctas.some(c => c.type === 'purchase')
    
    if (!hasEcommerce) return null
    
    const steps: JourneyStep[] = [
      {
        order: 1,
        action: 'Browse Products',
        page: '/products or /shop',
        elements: ['product-grid', 'product-cards', 'filters'],
        dataOperations: ['fetch-products', 'apply-filters']
      },
      {
        order: 2,
        action: 'View Product Details',
        page: '/product/:id',
        elements: ['product-image', 'product-info', 'add-to-cart'],
        dataOperations: ['fetch-product-details', 'check-inventory']
      },
      {
        order: 3,
        action: 'Add to Cart',
        page: 'current',
        elements: ['add-to-cart-button', 'quantity-selector'],
        dataOperations: ['add-to-cart', 'update-cart-total']
      },
      {
        order: 4,
        action: 'View Cart',
        page: '/cart',
        elements: ['cart-items', 'cart-total', 'checkout-button'],
        dataOperations: ['fetch-cart', 'calculate-total']
      },
      {
        order: 5,
        action: 'Checkout',
        page: '/checkout',
        elements: ['shipping-form', 'payment-form', 'order-summary'],
        dataOperations: ['validate-address', 'process-payment', 'create-order']
      },
      {
        order: 6,
        action: 'Order Confirmation',
        page: '/order/confirmation',
        elements: ['order-number', 'order-details', 'tracking-info'],
        dataOperations: ['send-confirmation-email', 'update-inventory']
      }
    ]
    
    const conversions: ConversionPoint[] = [
      {
        name: 'Add to Cart',
        type: 'purchase',
        estimatedRate: 0.3
      },
      {
        name: 'Complete Purchase',
        type: 'purchase',
        estimatedRate: 0.1
      }
    ]
    
    return {
      name: 'Purchase Journey',
      description: 'Complete e-commerce purchase flow from browsing to order confirmation',
      steps,
      conversions,
      estimatedTraffic: 1000,
      priority: 'critical'
    }
  }
  
  /**
   * Analyze signup journey
   */
  private async analyzeSignupJourney(
    $: cheerio.CheerioAPI,
    navigation: NavigationItem[],
    forms: FormInfo[],
    ctas: CTAInfo[]
  ): Promise<UserJourney | null> {
    const hasSignup = 
      navigation.some(n => n.type === 'auth') ||
      forms.some(f => f.type === 'signup' || f.type === 'register') ||
      ctas.some(c => c.type === 'signup')
    
    if (!hasSignup) return null
    
    const steps: JourneyStep[] = [
      {
        order: 1,
        action: 'Land on Site',
        page: '/',
        elements: ['hero', 'value-proposition', 'signup-cta'],
        dataOperations: ['track-visit']
      },
      {
        order: 2,
        action: 'Click Signup',
        page: 'current',
        elements: ['signup-button', 'signup-link'],
        dataOperations: ['track-signup-intent']
      },
      {
        order: 3,
        action: 'Fill Signup Form',
        page: '/signup or /register',
        elements: ['email-input', 'password-input', 'name-input'],
        dataOperations: ['validate-email', 'check-existing-user']
      },
      {
        order: 4,
        action: 'Email Verification',
        page: '/verify-email',
        elements: ['verification-message', 'resend-link'],
        dataOperations: ['send-verification-email', 'track-email-sent']
      },
      {
        order: 5,
        action: 'Complete Profile',
        page: '/onboarding or /profile',
        elements: ['profile-form', 'preferences'],
        dataOperations: ['save-profile', 'trigger-welcome-flow']
      }
    ]
    
    const conversions: ConversionPoint[] = [
      {
        name: 'Start Signup',
        type: 'signup',
        estimatedRate: 0.2
      },
      {
        name: 'Complete Signup',
        type: 'signup',
        estimatedRate: 0.1
      },
      {
        name: 'Verify Email',
        type: 'signup',
        estimatedRate: 0.08
      }
    ]
    
    return {
      name: 'User Signup Journey',
      description: 'New user registration and onboarding flow',
      steps,
      conversions,
      estimatedTraffic: 500,
      priority: 'critical'
    }
  }
  
  /**
   * Analyze support journey
   */
  private async analyzeSupportJourney(
    $: cheerio.CheerioAPI,
    navigation: NavigationItem[],
    forms: FormInfo[]
  ): Promise<UserJourney | null> {
    const hasSupport = 
      navigation.some(n => n.type === 'support') ||
      forms.some(f => f.type === 'contact')
    
    if (!hasSupport) return null
    
    const steps: JourneyStep[] = [
      {
        order: 1,
        action: 'Encounter Issue',
        page: 'any',
        elements: ['help-link', 'support-button'],
        dataOperations: ['track-help-click']
      },
      {
        order: 2,
        action: 'Browse Help Center',
        page: '/help or /support',
        elements: ['search-bar', 'faq-list', 'category-nav'],
        dataOperations: ['search-articles', 'track-searches']
      },
      {
        order: 3,
        action: 'Contact Support',
        page: '/contact',
        elements: ['contact-form', 'chat-widget', 'phone-number'],
        dataOperations: ['create-ticket', 'start-chat-session']
      },
      {
        order: 4,
        action: 'Receive Response',
        page: 'email or chat',
        elements: ['ticket-response', 'chat-messages'],
        dataOperations: ['send-response', 'update-ticket-status']
      }
    ]
    
    const conversions: ConversionPoint[] = [
      {
        name: 'Contact Support',
        type: 'contact',
        estimatedRate: 0.05
      },
      {
        name: 'Resolve Issue',
        type: 'other',
        estimatedRate: 0.04
      }
    ]
    
    return {
      name: 'Support Journey',
      description: 'Customer support and help-seeking flow',
      steps,
      conversions,
      estimatedTraffic: 200,
      priority: 'important'
    }
  }
  
  /**
   * Analyze discovery journey
   */
  private async analyzeDiscoveryJourney(
    $: cheerio.CheerioAPI,
    navigation: NavigationItem[]
  ): Promise<UserJourney> {
    const steps: JourneyStep[] = [
      {
        order: 1,
        action: 'Land on Homepage',
        page: '/',
        elements: ['hero', 'navigation', 'featured-content'],
        dataOperations: ['track-landing', 'load-personalization']
      },
      {
        order: 2,
        action: 'Explore Features',
        page: '/features or /products',
        elements: ['feature-list', 'product-grid', 'comparison-table'],
        dataOperations: ['track-feature-views']
      },
      {
        order: 3,
        action: 'Read About Company',
        page: '/about',
        elements: ['company-info', 'team', 'values'],
        dataOperations: ['track-about-views']
      },
      {
        order: 4,
        action: 'Check Pricing',
        page: '/pricing',
        elements: ['pricing-table', 'plan-comparison', 'cta-buttons'],
        dataOperations: ['track-pricing-views', 'identify-interest-level']
      }
    ]
    
    const conversions: ConversionPoint[] = [
      {
        name: 'View Pricing',
        type: 'other',
        estimatedRate: 0.3
      },
      {
        name: 'Start Trial',
        type: 'signup',
        estimatedRate: 0.05
      }
    ]
    
    return {
      name: 'Discovery Journey',
      description: 'New visitor exploration and learning flow',
      steps,
      conversions,
      estimatedTraffic: 2000,
      priority: 'important'
    }
  }
  
  /**
   * Enhance journeys with AI
   */
  private async enhanceJourneysWithAI(
    journeys: UserJourney[],
    url: string
  ): Promise<UserJourney[]> {
    if (journeys.length === 0) return journeys
    
    const prompt = `
Analyze these user journeys from ${url} and enhance them:

${JSON.stringify(journeys, null, 2)}

For each journey:
1. Refine the steps based on modern UX best practices
2. Add missing critical steps
3. Adjust conversion rate estimates based on industry standards
4. Identify optimization opportunities

Respond with enhanced journeys in the same JSON format.
`
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
      
      const enhanced = JSON.parse(response.choices[0].message.content || '[]')
      return Array.isArray(enhanced) ? enhanced : journeys
    } catch (error) {
      console.error('Failed to enhance journeys with AI:', error)
      return journeys
    }
  }
  
  /**
   * Helper methods
   */
  
  private classifyNavigationItem(text: string, href: string): string {
    const lowerText = text.toLowerCase()
    const lowerHref = href.toLowerCase()
    
    if (lowerText.includes('shop') || lowerText.includes('product') || lowerHref.includes('/shop')) {
      return 'shop'
    }
    if (lowerText.includes('login') || lowerText.includes('sign') || lowerHref.includes('/auth')) {
      return 'auth'
    }
    if (lowerText.includes('help') || lowerText.includes('support') || lowerHref.includes('/help')) {
      return 'support'
    }
    if (lowerText.includes('about') || lowerHref.includes('/about')) {
      return 'info'
    }
    if (lowerText.includes('contact') || lowerHref.includes('/contact')) {
      return 'contact'
    }
    
    return 'navigation'
  }
  
  private classifyForm(
    $form: cheerio.Cheerio,
    action: string,
    id: string,
    classes: string
  ): string {
    const formText = $form.text().toLowerCase()
    const allIdentifiers = (action + id + classes + formText).toLowerCase()
    
    if (allIdentifiers.includes('login') || allIdentifiers.includes('signin')) {
      return 'login'
    }
    if (allIdentifiers.includes('signup') || allIdentifiers.includes('register')) {
      return 'signup'
    }
    if (allIdentifiers.includes('contact') || allIdentifiers.includes('support')) {
      return 'contact'
    }
    if (allIdentifiers.includes('search')) {
      return 'search'
    }
    if (allIdentifiers.includes('newsletter') || allIdentifiers.includes('subscribe')) {
      return 'newsletter'
    }
    if (allIdentifiers.includes('cart') || allIdentifiers.includes('add')) {
      return 'add-to-cart'
    }
    if (allIdentifiers.includes('checkout') || allIdentifiers.includes('payment')) {
      return 'checkout'
    }
    
    return 'other'
  }
  
  private classifyCTA(text: string): string {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('buy') || lowerText.includes('purchase') || lowerText.includes('add to cart')) {
      return 'purchase'
    }
    if (lowerText.includes('sign up') || lowerText.includes('register') || lowerText.includes('start')) {
      return 'signup'
    }
    if (lowerText.includes('learn') || lowerText.includes('more')) {
      return 'info'
    }
    if (lowerText.includes('contact') || lowerText.includes('talk')) {
      return 'contact'
    }
    if (lowerText.includes('download') || lowerText.includes('get')) {
      return 'download'
    }
    
    return 'other'
  }
  
  private calculateProminence($el: cheerio.Cheerio): number {
    let score = 0.5
    
    // Size indicators
    if ($el.hasClass('large') || $el.hasClass('big') || $el.hasClass('hero')) {
      score += 0.2
    }
    
    // Color indicators
    if ($el.hasClass('primary') || $el.hasClass('cta') || $el.css('background-color')) {
      score += 0.1
    }
    
    // Position indicators
    const parent = $el.parent()
    if (parent.is('header') || parent.hasClass('hero')) {
      score += 0.2
    }
    
    return Math.min(score, 1)
  }
}

// Type definitions
interface NavigationItem {
  text: string
  href: string
  type: string
}

interface FormInfo {
  type: string
  action: string
  method: string
  fields: Array<{
    name: string
    type: string
    required: boolean
  }>
  submitText: string
}

interface CTAInfo {
  text: string
  type: string
  destination: string
  prominence: number
}