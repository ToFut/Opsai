/**
 * Integration Builder
 * Converts user-selected integrations into actual working code
 */

interface Integration {
  id: string
  name: string
  type: string
  config: any
  apiKeys?: string[]
  webhooks?: string[]
  sdkPackage?: string
}

interface GeneratedIntegration {
  envVars: string[]
  dependencies: string[]
  apiRoutes: string[]
  components: string[]
  middleware: string[]
  webhooks: string[]
  configFiles: string[]
}

export class IntegrationBuilder {
  private integrations: Integration[] = []
  
  constructor(selectedIntegrations: string[], userChoices: any) {
    this.integrations = this.mapSelectionsToIntegrations(selectedIntegrations, userChoices)
  }

  /**
   * Generate complete integration code based on user selections
   */
  generateIntegrationCode(): GeneratedIntegration {
    let result: GeneratedIntegration = {
      envVars: [],
      dependencies: [],
      apiRoutes: [],
      components: [],
      middleware: [],
      webhooks: [],
      configFiles: []
    }

    this.integrations.forEach(integration => {
      const integrationCode = this.buildIntegrationCode(integration)
      
      result.envVars.push(...integrationCode.envVars)
      result.dependencies.push(...integrationCode.dependencies)
      result.apiRoutes.push(...integrationCode.apiRoutes)
      result.components.push(...integrationCode.components)
      result.middleware.push(...integrationCode.middleware)
      result.webhooks.push(...integrationCode.webhooks)
      result.configFiles.push(...integrationCode.configFiles)
    })

    return result
  }

  /**
   * Build specific integration based on type
   */
  private buildIntegrationCode(integration: Integration): GeneratedIntegration {
    switch (integration.id) {
      case 'stripe':
        return this.buildStripeIntegration(integration)
      case 'shopify':
        return this.buildShopifyIntegration(integration)
      case 'google-analytics':
        return this.buildAnalyticsIntegration(integration)
      case 'slack':
        return this.buildSlackIntegration(integration)
      case 'mailchimp':
        return this.buildMailchimpIntegration(integration)
      case 'quickbooks':
        return this.buildQuickBooksIntegration(integration)
      default:
        return this.buildGenericIntegration(integration)
    }
  }

  /**
   * Stripe Payment Integration
   */
  private buildStripeIntegration(integration: Integration): GeneratedIntegration {
    return {
      envVars: [
        'STRIPE_PUBLISHABLE_KEY=pk_test_...',
        'STRIPE_SECRET_KEY=sk_test_...',
        'STRIPE_WEBHOOK_SECRET=whsec_...'
      ],
      dependencies: [
        'stripe',
        '@stripe/stripe-js',
        '@stripe/react-stripe-js'
      ],
      apiRoutes: [
        this.generateStripeAPIRoute(),
        this.generateStripeWebhookRoute(),
        this.generatePaymentIntentRoute()
      ],
      components: [
        this.generateStripeCheckoutComponent(),
        this.generatePaymentFormComponent()
      ],
      middleware: [
        this.generateStripeMiddleware()
      ],
      webhooks: [
        this.generateStripeWebhookHandler()
      ],
      configFiles: [
        this.generateStripeConfig()
      ]
    }
  }

  /**
   * Shopify E-commerce Integration
   */
  private buildShopifyIntegration(integration: Integration): GeneratedIntegration {
    return {
      envVars: [
        'SHOPIFY_STORE_URL=your-store.myshopify.com',
        'SHOPIFY_ACCESS_TOKEN=shpat_...',
        'SHOPIFY_WEBHOOK_SECRET=...'
      ],
      dependencies: [
        '@shopify/shopify-api',
        '@shopify/polaris'
      ],
      apiRoutes: [
        this.generateShopifyAPIRoute(),
        this.generateShopifyWebhookRoute(),
        this.generateProductSyncRoute()
      ],
      components: [
        this.generateProductListComponent(),
        this.generateOrderManagementComponent()
      ],
      middleware: [
        this.generateShopifyAuthMiddleware()
      ],
      webhooks: [
        this.generateShopifyWebhookHandler()
      ],
      configFiles: [
        this.generateShopifyConfig()
      ]
    }
  }

  /**
   * Google Analytics Integration
   */
  private buildAnalyticsIntegration(integration: Integration): GeneratedIntegration {
    return {
      envVars: [
        'GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID',
        'GOOGLE_ANALYTICS_SECRET=...'
      ],
      dependencies: [
        'gtag',
        '@google-analytics/data'
      ],
      apiRoutes: [
        this.generateAnalyticsAPIRoute(),
        this.generateAnalyticsReportsRoute()
      ],
      components: [
        this.generateAnalyticsComponent(),
        this.generateAnalyticsDashboard()
      ],
      middleware: [
        this.generateAnalyticsMiddleware()
      ],
      webhooks: [],
      configFiles: [
        this.generateAnalyticsConfig()
      ]
    }
  }

  // Generate actual code strings for each integration type

  private generateStripeAPIRoute(): string {
    return `// app/api/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd' } = await request.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    })
  } catch (error) {
    console.error('Stripe payment error:', error)
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}`
  }

  private generateStripeWebhookRoute(): string {
    return `// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('Payment succeeded:', paymentIntent.id)
        
        // Update database
        // Send confirmation email
        // Trigger workflows
        break

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id)
        // Handle failed payment
        break

      default:
        console.log(\`Unhandled event type \${event.type}\`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 })
  }
}`
  }

  private generatePaymentIntentRoute(): string {
    return `// app/api/payment-intent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { items, customer } = await request.json()
    
    // Calculate total amount
    const amount = items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    )

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      customer: customer?.id,
      metadata: {
        items: JSON.stringify(items)
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}`
  }

  private generateStripeCheckoutComponent(): string {
    return `// components/StripeCheckout.tsx
'use client'

import { useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import PaymentForm from './PaymentForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function StripeCheckout({ amount, onSuccess }: {
  amount: number
  onSuccess: () => void
}) {
  const [clientSecret, setClientSecret] = useState('')

  const createPaymentIntent = async () => {
    const response = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    })
    
    const { clientSecret } = await response.json()
    setClientSecret(clientSecret)
  }

  return (
    <div className="stripe-checkout">
      {!clientSecret ? (
        <button onClick={createPaymentIntent} className="btn btn-primary">
          Pay $\{amount}
        </button>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm onSuccess={onSuccess} />
        </Elements>
      )}
    </div>
  )
}`
  }

  private generatePaymentFormComponent(): string {
    return `// components/PaymentForm.tsx
'use client'

import { useState } from 'react'
import {
  useStripe,
  useElements,
  PaymentElement
} from '@stripe/react-stripe-js'

export default function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: \`\${window.location.origin}/payment-success\`
      }
    })

    if (error) {
      setError(error.message || 'An error occurred')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />
      {error && <div className="error">{error}</div>}
      <button
        disabled={!stripe || loading}
        className="btn btn-primary mt-4"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  )
}`
  }

  private generateStripeMiddleware(): string {
    return `// middleware/stripe.ts
import { NextRequest } from 'next/server'

export function stripeMiddleware(request: NextRequest) {
  // Add CORS headers for Stripe
  const response = new Response()
  
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}`
  }

  private generateStripeWebhookHandler(): string {
    return `// lib/stripe-webhooks.ts
import { Stripe } from 'stripe'

export async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // Update order status
  // Send confirmation email
  // Update inventory
  // Trigger fulfillment workflow
  
  console.log('Payment successful:', paymentIntent.id)
  
  // Example: Update database
  // await updateOrderStatus(paymentIntent.metadata.orderId, 'paid')
  
  // Example: Send email
  // await sendConfirmationEmail(paymentIntent.receipt_email)
}

export async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  // Handle failed payment
  // Send failure notification
  // Update order status
  
  console.log('Payment failed:', paymentIntent.id)
}`
  }

  private generateStripeConfig(): string {
    return `// lib/stripe-config.ts
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  apiVersion: '2023-10-16' as const,
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px'
    }
  }
}`
  }

  // Similar implementations for other integrations...
  
  private buildSlackIntegration(integration: Integration): GeneratedIntegration {
    return {
      envVars: ['SLACK_BOT_TOKEN=xoxb-...', 'SLACK_SIGNING_SECRET=...'],
      dependencies: ['@slack/bolt'],
      apiRoutes: [this.generateSlackAPIRoute()],
      components: [this.generateSlackNotificationComponent()],
      middleware: [],
      webhooks: [this.generateSlackWebhookHandler()],
      configFiles: [this.generateSlackConfig()]
    }
  }

  private generateSlackAPIRoute(): string {
    return `// app/api/slack/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { WebClient } from '@slack/web-api'

const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

export async function POST(request: NextRequest) {
  try {
    const { channel, message } = await request.json()
    
    const result = await slack.chat.postMessage({
      channel,
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ]
    })

    return NextResponse.json({ success: true, timestamp: result.ts })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}`
  }

  private generateSlackNotificationComponent(): string {
    return `// components/SlackNotification.tsx
'use client'

import { useState } from 'react'

export default function SlackNotification() {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const sendNotification = async () => {
    setSending(true)
    try {
      await fetch('/api/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: '#general',
          message: message
        })
      })
      setMessage('')
    } catch (error) {
      console.error('Failed to send Slack message:', error)
    }
    setSending(false)
  }

  return (
    <div className="slack-notification">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message for Slack..."
        className="w-full p-2 border rounded"
      />
      <button
        onClick={sendNotification}
        disabled={sending || !message.trim()}
        className="btn btn-primary mt-2"
      >
        {sending ? 'Sending...' : 'Send to Slack'}
      </button>
    </div>
  )
}`
  }

  private generateSlackWebhookHandler(): string {
    return `// lib/slack-webhooks.ts
export async function sendSlackNotification(event: string, data: any) {
  const webhook = process.env.SLACK_WEBHOOK_URL
  if (!webhook) return

  const message = formatSlackMessage(event, data)
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message,
      channel: '#notifications'
    })
  })
}

function formatSlackMessage(event: string, data: any): string {
  switch (event) {
    case 'payment_success':
      return \`💳 Payment received: $\${data.amount} from \${data.customer}\`
    case 'new_user':
      return \`👋 New user registered: \${data.email}\`
    case 'order_created':
      return \`🛍️ New order #\${data.orderId} - $\${data.total}\`
    default:
      return \`📢 Event: \${event}\`
  }
}`
  }

  private generateSlackConfig(): string {
    return `// lib/slack-config.ts
export const slackConfig = {
  botToken: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  channels: {
    general: '#general',
    notifications: '#notifications',
    alerts: '#alerts'
  }
}`
  }

  // Generic integration fallback
  private buildGenericIntegration(integration: Integration): GeneratedIntegration {
    return {
      envVars: [`${integration.id.toUpperCase()}_API_KEY=your_api_key`],
      dependencies: [integration.sdkPackage || `${integration.id}-sdk`],
      apiRoutes: [this.generateGenericAPIRoute(integration)],
      components: [this.generateGenericComponent(integration)],
      middleware: [],
      webhooks: [],
      configFiles: [this.generateGenericConfig(integration)]
    }
  }

  private generateGenericAPIRoute(integration: Integration): string {
    return `// app/api/${integration.id}/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // ${integration.name} API integration
    const response = await fetch(\`https://api.\${integration.id}.com/v1/endpoint\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.\${integration.id.toUpperCase()}_API_KEY}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}`
  }

  private generateGenericComponent(integration: Integration): string {
    return `// components/${integration.name}Integration.tsx
'use client'

import { useState } from 'react'

export default function ${integration.name}Integration() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/${integration.id}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      })
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('${integration.name} error:', error)
    }
    setLoading(false)
  }

  return (
    <div className="${integration.id}-integration">
      <h3>${integration.name} Integration</h3>
      <button onClick={handleAction} disabled={loading}>
        {loading ? 'Loading...' : 'Sync ${integration.name}'}
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}`
  }

  private generateGenericConfig(integration: Integration): string {
    return `// lib/${integration.id}-config.ts
export const ${integration.id}Config = {
  apiKey: process.env.${integration.id.toUpperCase()}_API_KEY!,
  baseUrl: 'https://api.${integration.id}.com',
  timeout: 10000,
  retries: 3
}`
  }

  private mapSelectionsToIntegrations(selections: string[], userChoices: any): Integration[] {
    // Map user selections to integration configurations
    return selections.map(id => {
      const integrationMap: { [key: string]: Integration } = {
        'stripe': {
          id: 'stripe',
          name: 'Stripe',
          type: 'payment',
          config: userChoices.stripe || {},
          sdkPackage: 'stripe'
        },
        'shopify': {
          id: 'shopify',
          name: 'Shopify',
          type: 'ecommerce',
          config: userChoices.shopify || {},
          sdkPackage: '@shopify/shopify-api'
        },
        'slack': {
          id: 'slack',
          name: 'Slack',
          type: 'communication',
          config: userChoices.slack || {},
          sdkPackage: '@slack/bolt'
        }
        // Add more integrations as needed
      }
      
      return integrationMap[id] || {
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        type: 'generic',
        config: {}
      }
    })
  }

  /**
   * Generate package.json dependencies
   */
  generatePackageJson(existingDependencies: any = {}): any {
    const integrationCode = this.generateIntegrationCode()
    
    const newDependencies = integrationCode.dependencies.reduce((acc, dep) => {
      acc[dep] = 'latest'
      return acc
    }, {} as any)

    return {
      ...existingDependencies,
      ...newDependencies
    }
  }

  /**
   * Generate .env template
   */
  generateEnvTemplate(): string {
    const integrationCode = this.generateIntegrationCode()
    
    return [
      '# Generated Environment Variables',
      '# Add your actual API keys and secrets',
      '',
      ...integrationCode.envVars,
      ''
    ].join('\n')
  }

  /**
   * Generate README for integrations
   */
  generateIntegrationReadme(): string {
    return `# Integration Setup

## Configured Integrations

${this.integrations.map(integration => `
### ${integration.name}
- Type: ${integration.type}
- Package: ${integration.sdkPackage || 'Custom implementation'}
- API Routes: /api/${integration.id}
- Components: ${integration.name}Integration

Setup:
1. Add API keys to .env.local
2. Configure webhooks (if applicable)
3. Test integration endpoints
`).join('\n')}

## Quick Start

1. Copy environment variables from .env.example
2. Install dependencies: \`npm install\`
3. Run development server: \`npm run dev\`
4. Test integrations at /api/[integration-name]

## Webhooks

${this.integrations.filter(i => ['stripe', 'shopify'].includes(i.id)).map(integration => `
- ${integration.name}: POST /api/${integration.id}/webhook
`).join('')}
`
  }
}

export default IntegrationBuilder