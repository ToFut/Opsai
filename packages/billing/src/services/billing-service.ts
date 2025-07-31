import Stripe from 'stripe'
import { prisma } from '@opsai/database'

export interface BillingPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  limits: {
    users: number
    storage: number // in GB
    apiCalls: number
    integrations: number
    workflows: number
  }
  stripePriceId?: string
}

export interface UsageMetrics {
  userId: string
  tenantId: string
  date: string
  apiCalls: number
  storageUsed: number // in GB
  activeUsers: number
  integrationsUsed: number
  workflowsExecuted: number
}

export interface BillingCustomer {
  id: string
  tenantId: string
  email: string
  name: string
  stripeCustomerId?: string
  currentPlan?: string
  status: 'active' | 'inactive' | 'past_due' | 'canceled'
  nextBillingDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Invoice {
  id: string
  customerId: string
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  stripeInvoiceId?: string
  items: InvoiceItem[]
  createdAt: Date
  dueDate: Date
  paidAt?: Date
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  type: 'subscription' | 'usage' | 'one_time'
}

export class BillingService {
  private stripe: Stripe
  private plans: Map<string, BillingPlan>

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    })
    this.plans = new Map()
    this.initializePlans()
  }

  /**
   * Initialize billing plans
   */
  private initializePlans(): void {
    const defaultPlans: BillingPlan[] = [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        price: 0,
        currency: 'usd',
        interval: 'month',
        features: [
          'Up to 3 users',
          '1GB storage',
          '100 API calls/month',
          'Basic integrations',
          'Community support'
        ],
        limits: {
          users: 3,
          storage: 1,
          apiCalls: 100,
          integrations: 2,
          workflows: 5
        }
      },
      {
        id: 'starter',
        name: 'Starter',
        description: 'Great for small teams',
        price: 29,
        currency: 'usd',
        interval: 'month',
        features: [
          'Up to 10 users',
          '10GB storage',
          '1,000 API calls/month',
          'Advanced integrations',
          'Email support',
          'Custom branding'
        ],
        limits: {
          users: 10,
          storage: 10,
          apiCalls: 1000,
          integrations: 10,
          workflows: 25
        }
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'For growing businesses',
        price: 99,
        currency: 'usd',
        interval: 'month',
        features: [
          'Up to 50 users',
          '100GB storage',
          '10,000 API calls/month',
          'All integrations',
          'Priority support',
          'Advanced analytics',
          'Custom workflows'
        ],
        limits: {
          users: 50,
          storage: 100,
          apiCalls: 10000,
          integrations: 50,
          workflows: 100
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations',
        price: 299,
        currency: 'usd',
        interval: 'month',
        features: [
          'Unlimited users',
          '1TB storage',
          'Unlimited API calls',
          'All integrations',
          'Dedicated support',
          'Advanced security',
          'Custom development',
          'SLA guarantee'
        ],
        limits: {
          users: -1, // unlimited
          storage: 1000,
          apiCalls: -1, // unlimited
          integrations: -1, // unlimited
          workflows: -1 // unlimited
        }
      }
    ]

    defaultPlans.forEach(plan => {
      this.plans.set(plan.id, plan)
    })
  }

  /**
   * Create or get customer
   */
  async createCustomer(
    tenantId: string,
    email: string,
    name: string
  ): Promise<BillingCustomer> {
    try {
      // Check if customer already exists
      let customer = await prisma.billingCustomer.findFirst({
        where: { tenantId }
      })

      if (customer) {
        return this.mapCustomerToBillingCustomer(customer)
      }

      // Create Stripe customer
      const stripeCustomer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          tenantId
        }
      })

      // Create customer in database
      customer = await prisma.billingCustomer.create({
        data: {
          tenantId,
          email,
          name,
          stripeCustomerId: stripeCustomer.id,
          status: 'active',
          currentPlan: 'free'
        }
      })

      return this.mapCustomerToBillingCustomer(customer)
    } catch (error) {
      console.error('Create customer error:', error)
      throw new Error('Failed to create customer')
    }
  }

  /**
   * Get customer by tenant ID
   */
  async getCustomer(tenantId: string): Promise<BillingCustomer | null> {
    try {
      const customer = await prisma.billingCustomer.findFirst({
        where: { tenantId }
      })

      return customer ? this.mapCustomerToBillingCustomer(customer) : null
    } catch (error) {
      console.error('Get customer error:', error)
      throw new Error('Failed to get customer')
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(
    tenantId: string,
    planId: string,
    paymentMethodId?: string
  ): Promise<{ subscriptionId: string; clientSecret?: string }> {
    try {
      const customer = await this.getCustomer(tenantId)
      if (!customer) {
        throw new Error('Customer not found')
      }

      const plan = this.plans.get(planId)
      if (!plan) {
        throw new Error('Plan not found')
      }

      if (plan.price === 0) {
        // Free plan - no Stripe subscription needed
        await prisma.billingCustomer.update({
          where: { id: customer.id },
          data: { currentPlan: planId }
        })

        return { subscriptionId: 'free' }
      }

      // Create Stripe subscription
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customer.stripeCustomerId!,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      }

      if (paymentMethodId) {
        subscriptionData.default_payment_method = paymentMethodId
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData)

      // Update customer in database
      await prisma.billingCustomer.update({
        where: { id: customer.id },
        data: { 
          currentPlan: planId,
          status: subscription.status as any
        }
      })

      const clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret

      return {
        subscriptionId: subscription.id,
        clientSecret
      }
    } catch (error) {
      console.error('Create subscription error:', error)
      throw new Error('Failed to create subscription')
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(tenantId: string): Promise<void> {
    try {
      const customer = await this.getCustomer(tenantId)
      if (!customer) {
        throw new Error('Customer not found')
      }

      // Get active subscription from Stripe
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customer.stripeCustomerId!,
        status: 'active'
      })

      if (subscriptions.data.length > 0) {
        // Cancel at period end
        await this.stripe.subscriptions.update(subscriptions.data[0].id, {
          cancel_at_period_end: true
        })
      }

      // Update customer status
      await prisma.billingCustomer.update({
        where: { id: customer.id },
        data: { status: 'canceled' }
      })
    } catch (error) {
      console.error('Cancel subscription error:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  /**
   * Track usage metrics
   */
  async trackUsage(metrics: UsageMetrics): Promise<void> {
    try {
      await prisma.usageMetrics.create({
        data: {
          userId: metrics.userId,
          tenantId: metrics.tenantId,
          date: new Date(metrics.date),
          apiCalls: metrics.apiCalls,
          storageUsed: metrics.storageUsed,
          activeUsers: metrics.activeUsers,
          integrationsUsed: metrics.integrationsUsed,
          workflowsExecuted: metrics.workflowsExecuted
        }
      })
    } catch (error) {
      console.error('Track usage error:', error)
      // Don't throw error for usage tracking failures
    }
  }

  /**
   * Get usage for tenant
   */
  async getUsage(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageMetrics[]> {
    try {
      const usage = await prisma.usageMetrics.findMany({
        where: {
          tenantId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { date: 'asc' }
      })

      return usage.map(this.mapUsageToUsageMetrics)
    } catch (error) {
      console.error('Get usage error:', error)
      throw new Error('Failed to get usage')
    }
  }

  /**
   * Check if usage exceeds limits
   */
  async checkUsageLimits(tenantId: string): Promise<{
    withinLimits: boolean
    exceeded: string[]
    current: any
    limits: any
  }> {
    try {
      const customer = await this.getCustomer(tenantId)
      if (!customer) {
        throw new Error('Customer not found')
      }

      const plan = this.plans.get(customer.currentPlan || 'free')
      if (!plan) {
        throw new Error('Plan not found')
      }

      // Get current month usage
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const usage = await this.getUsage(tenantId, startOfMonth, new Date())
      
      // Aggregate usage
      const currentUsage = {
        apiCalls: usage.reduce((sum, u) => sum + u.apiCalls, 0),
        storageUsed: Math.max(...usage.map(u => u.storageUsed), 0),
        activeUsers: Math.max(...usage.map(u => u.activeUsers), 0),
        integrationsUsed: Math.max(...usage.map(u => u.integrationsUsed), 0),
        workflowsExecuted: usage.reduce((sum, u) => sum + u.workflowsExecuted, 0)
      }

      // Check limits
      const exceeded: string[] = []
      
      if (plan.limits.apiCalls > 0 && currentUsage.apiCalls > plan.limits.apiCalls) {
        exceeded.push('apiCalls')
      }
      
      if (plan.limits.storage > 0 && currentUsage.storageUsed > plan.limits.storage) {
        exceeded.push('storage')
      }
      
      if (plan.limits.users > 0 && currentUsage.activeUsers > plan.limits.users) {
        exceeded.push('users')
      }
      
      if (plan.limits.integrations > 0 && currentUsage.integrationsUsed > plan.limits.integrations) {
        exceeded.push('integrations')
      }
      
      if (plan.limits.workflows > 0 && currentUsage.workflowsExecuted > plan.limits.workflows) {
        exceeded.push('workflows')
      }

      return {
        withinLimits: exceeded.length === 0,
        exceeded,
        current: currentUsage,
        limits: plan.limits
      }
    } catch (error) {
      console.error('Check usage limits error:', error)
      throw new Error('Failed to check usage limits')
    }
  }

  /**
   * Get available plans
   */
  getPlans(): BillingPlan[] {
    return Array.from(this.plans.values())
  }

  /**
   * Get plan by ID
   */
  getPlan(planId: string): BillingPlan | null {
    return this.plans.get(planId) || null
  }

  /**
   * Create invoice
   */
  async createInvoice(
    customerId: string,
    items: Omit<InvoiceItem, 'id'>[]
  ): Promise<Invoice> {
    try {
      const customer = await prisma.billingCustomer.findUnique({
        where: { id: customerId }
      })

      if (!customer) {
        throw new Error('Customer not found')
      }

      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

      // Create Stripe invoice
      const stripeInvoice = await this.stripe.invoices.create({
        customer: customer.stripeCustomerId!,
        collection_method: 'send_invoice',
        days_until_due: 30
      })

      // Add invoice items
      for (const item of items) {
        await this.stripe.invoiceItems.create({
          customer: customer.stripeCustomerId!,
          invoice: stripeInvoice.id,
          amount: Math.round(item.unitPrice * 100), // Convert to cents
          currency: 'usd',
          description: item.description
        })
      }

      // Create invoice in database
      const invoice = await prisma.invoice.create({
        data: {
          customerId,
          amount: totalAmount,
          currency: 'usd',
          status: 'draft',
          stripeInvoiceId: stripeInvoice.id,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          items: {
            create: items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              type: item.type
            }))
          }
        },
        include: { items: true }
      })

      return this.mapInvoiceToInvoice(invoice)
    } catch (error) {
      console.error('Create invoice error:', error)
      throw new Error('Failed to create invoice')
    }
  }

  /**
   * Get invoices for customer
   */
  async getInvoices(customerId: string): Promise<Invoice[]> {
    try {
      const invoices = await prisma.invoice.findMany({
        where: { customerId },
        include: { items: true },
        orderBy: { createdAt: 'desc' }
      })

      return invoices.map(this.mapInvoiceToInvoice)
    } catch (error) {
      console.error('Get invoices error:', error)
      throw new Error('Failed to get invoices')
    }
  }

  /**
   * Map database customer to billing customer
   */
  private mapCustomerToBillingCustomer(customer: any): BillingCustomer {
    return {
      id: customer.id,
      tenantId: customer.tenantId,
      email: customer.email,
      name: customer.name,
      stripeCustomerId: customer.stripeCustomerId,
      currentPlan: customer.currentPlan,
      status: customer.status,
      nextBillingDate: customer.nextBillingDate,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }
  }

  /**
   * Map database usage to usage metrics
   */
  private mapUsageToUsageMetrics(usage: any): UsageMetrics {
    return {
      userId: usage.userId,
      tenantId: usage.tenantId,
      date: usage.date.toISOString().split('T')[0],
      apiCalls: usage.apiCalls,
      storageUsed: usage.storageUsed,
      activeUsers: usage.activeUsers,
      integrationsUsed: usage.integrationsUsed,
      workflowsExecuted: usage.workflowsExecuted
    }
  }

  /**
   * Map database invoice to invoice
   */
  private mapInvoiceToInvoice(invoice: any): Invoice {
    return {
      id: invoice.id,
      customerId: invoice.customerId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
      stripeInvoiceId: invoice.stripeInvoiceId,
      items: invoice.items.map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        type: item.type
      })),
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt
    }
  }
} 