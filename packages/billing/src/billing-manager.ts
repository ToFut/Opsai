import Stripe from 'stripe'

export interface BillingPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  limits: {
    users: number
    storage: number
    apiCalls: number
    integrations: number
    customDomains: number
  }
  features: string[]
  stripePriceId?: string
}

export interface Subscription {
  id: string
  tenantId: string
  planId: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
  stripeSubscriptionId?: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Usage {
  id: string
  tenantId: string
  metric: string
  value: number
  timestamp: Date
  period: 'daily' | 'monthly' | 'yearly'
}

export interface Invoice {
  id: string
  tenantId: string
  subscriptionId: string
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  stripeInvoiceId?: string
  dueDate: Date
  paidAt?: Date
  createdAt: Date
}

export class BillingManager {
  private stripe: Stripe
  private plans: Map<string, BillingPlan> = new Map()
  private subscriptions: Map<string, Subscription> = new Map()
  private usage: Map<string, Usage[]> = new Map()

  constructor(stripeSecretKey: string) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    })
  }

  // Plan Management
  async createPlan(planData: Omit<BillingPlan, 'id'>): Promise<BillingPlan> {
    const plan: BillingPlan = {
      id: this.generateId(),
      ...planData
    }

    // Create Stripe price
    const stripePrice = await this.stripe.prices.create({
      unit_amount: plan.price * 100, // Convert to cents
      currency: plan.currency,
      recurring: {
        interval: plan.interval
      },
      product_data: {
        name: plan.name,
        description: `Plan: ${plan.name}`,
        metadata: {
          planId: plan.id,
          limits: JSON.stringify(plan.limits),
          features: JSON.stringify(plan.features)
        }
      }
    })

    plan.stripePriceId = stripePrice.id
    this.plans.set(plan.id, plan)

    return plan
  }

  async getPlan(planId: string): Promise<BillingPlan | null> {
    return this.plans.get(planId) || null
  }

  async getPlans(): Promise<BillingPlan[]> {
    return Array.from(this.plans.values())
  }

  async updatePlan(planId: string, updates: Partial<BillingPlan>): Promise<BillingPlan> {
    const plan = this.plans.get(planId)
    if (!plan) throw new Error('Plan not found')

    const updatedPlan = { ...plan, ...updates }
    this.plans.set(planId, updatedPlan)

    return updatedPlan
  }

  // Subscription Management
  async createSubscription(tenantId: string, planId: string, customerEmail: string): Promise<Subscription> {
    const plan = this.plans.get(planId)
    if (!plan) throw new Error('Plan not found')

    // Create or get Stripe customer
    const customer = await this.getOrCreateStripeCustomer(tenantId, customerEmail)

    // Create Stripe subscription
    const stripeSubscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.stripePriceId }],
      trial_period_days: 14,
      metadata: {
        tenantId,
        planId
      }
    })

    const subscription: Subscription = {
      id: this.generateId(),
      tenantId,
      planId,
      status: stripeSubscription.status as Subscription['status'],
      stripeSubscriptionId: stripeSubscription.id,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.subscriptions.set(subscription.id, subscription)
    return subscription
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    return this.subscriptions.get(subscriptionId) || null
  }

  async getSubscriptionByTenant(tenantId: string): Promise<Subscription | null> {
    return Array.from(this.subscriptions.values()).find(s => s.tenantId === tenantId) || null
  }

  async updateSubscription(subscriptionId: string, planId: string): Promise<Subscription> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) throw new Error('Subscription not found')

    const plan = this.plans.get(planId)
    if (!plan) throw new Error('Plan not found')

    // Update Stripe subscription
    const stripeSubscription = await this.stripe.subscriptions.update(subscription.stripeSubscriptionId!, {
      items: [{ id: subscription.stripeSubscriptionId, price: plan.stripePriceId }],
      proration_behavior: 'create_prorations'
    })

    const updatedSubscription: Subscription = {
      ...subscription,
      planId,
      status: stripeSubscription.status as Subscription['status'],
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      updatedAt: new Date()
    }

    this.subscriptions.set(subscriptionId, updatedSubscription)
    return updatedSubscription
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) throw new Error('Subscription not found')

    // Cancel Stripe subscription
    const stripeSubscription = await this.stripe.subscriptions.update(subscription.stripeSubscriptionId!, {
      cancel_at_period_end: cancelAtPeriodEnd
    })

    const updatedSubscription: Subscription = {
      ...subscription,
      status: stripeSubscription.status as Subscription['status'],
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      updatedAt: new Date()
    }

    this.subscriptions.set(subscriptionId, updatedSubscription)
    return updatedSubscription
  }

  // Usage Tracking
  async trackUsage(tenantId: string, metric: string, value: number): Promise<void> {
    const usage: Usage = {
      id: this.generateId(),
      tenantId,
      metric,
      value,
      timestamp: new Date(),
      period: 'daily'
    }

    if (!this.usage.has(tenantId)) {
      this.usage.set(tenantId, [])
    }

    this.usage.get(tenantId)!.push(usage)
  }

  async getUsage(tenantId: string, metric: string, period: 'daily' | 'monthly' | 'yearly' = 'monthly'): Promise<number> {
    const tenantUsage = this.usage.get(tenantId) || []
    
    const now = new Date()
    const startDate = this.getPeriodStartDate(now, period)
    
    return tenantUsage
      .filter(u => u.metric === metric && u.timestamp >= startDate)
      .reduce((sum, u) => sum + u.value, 0)
  }

  async checkUsageLimits(tenantId: string): Promise<{ exceeded: boolean; limits: Record<string, { current: number; limit: number }> }> {
    const subscription = await this.getSubscriptionByTenant(tenantId)
    if (!subscription) {
      throw new Error('No active subscription found')
    }

    const plan = this.plans.get(subscription.planId)
    if (!plan) {
      throw new Error('Plan not found')
    }

    const limits = plan.limits
    const currentUsage = {
      users: await this.getUsage(tenantId, 'users'),
      storage: await this.getUsage(tenantId, 'storage'),
      apiCalls: await this.getUsage(tenantId, 'api_calls'),
      integrations: await this.getUsage(tenantId, 'integrations'),
      customDomains: await this.getUsage(tenantId, 'custom_domains')
    }

    const exceeded = Object.entries(limits).some(([key, limit]) => currentUsage[key as keyof typeof currentUsage] > limit)

    return {
      exceeded,
      limits: Object.entries(limits).reduce((acc, [key, limit]) => {
        acc[key] = {
          current: currentUsage[key as keyof typeof currentUsage],
          limit
        }
        return acc
      }, {} as Record<string, { current: number; limit: number }>)
    }
  }

  // Invoice Management
  async createInvoice(subscriptionId: string, amount: number, currency: string = 'usd'): Promise<Invoice> {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) throw new Error('Subscription not found')

    // Create Stripe invoice
    const stripeInvoice = await this.stripe.invoices.create({
      customer: subscription.stripeSubscriptionId,
      subscription: subscription.stripeSubscriptionId,
      amount: amount * 100, // Convert to cents
      currency,
      metadata: {
        tenantId: subscription.tenantId,
        subscriptionId
      }
    })

    const invoice: Invoice = {
      id: this.generateId(),
      tenantId: subscription.tenantId,
      subscriptionId,
      amount,
      currency,
      status: stripeInvoice.status as Invoice['status'],
      stripeInvoiceId: stripeInvoice.id,
      dueDate: new Date(stripeInvoice.due_date! * 1000),
      createdAt: new Date()
    }

    return invoice
  }

  async getInvoices(tenantId: string): Promise<Invoice[]> {
    // In a real implementation, this would query a database
    return []
  }

  // Payment Processing
  async processPayment(invoiceId: string, paymentMethodId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Process payment through Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: 1000, // Amount in cents
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        metadata: {
          invoiceId
        }
      })

      if (paymentIntent.status === 'succeeded') {
        return { success: true }
      } else {
        return { success: false, error: 'Payment failed' }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment processing failed' 
      }
    }
  }

  // Webhook Handling
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`Unhandled Stripe event: ${event.type}`)
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log(`Payment succeeded for invoice: ${invoice.id}`)
    // Update invoice status and trigger any post-payment actions
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log(`Payment failed for invoice: ${invoice.id}`)
    // Handle failed payment (send notifications, update subscription status, etc.)
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log(`Subscription updated: ${subscription.id}`)
    // Update local subscription data
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log(`Subscription deleted: ${subscription.id}`)
    // Handle subscription cancellation
  }

  // Utility Methods
  private async getOrCreateStripeCustomer(tenantId: string, email: string): Promise<Stripe.Customer> {
    // Check if customer already exists
    const existingCustomers = await this.stripe.customers.list({
      email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0]
    }

    // Create new customer
    return await this.stripe.customers.create({
      email,
      metadata: {
        tenantId
      }
    })
  }

  private getPeriodStartDate(date: Date, period: 'daily' | 'monthly' | 'yearly'): Date {
    const startDate = new Date(date)
    
    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'monthly':
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'yearly':
        startDate.setMonth(0, 1)
        startDate.setHours(0, 0, 0, 0)
        break
    }
    
    return startDate
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
} 