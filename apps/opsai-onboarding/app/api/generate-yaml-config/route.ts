import { NextRequest, NextResponse } from 'next/server'
import { credentialManager } from '@/lib/credential-store'
// Simple YAML generation (avoiding js-yaml dependency for demo)
function generateYAML(obj: any): string {
  return JSON.stringify(obj, null, 2)
    .replace(/"/g, '')
    .replace(/,/g, '')
    .replace(/\{/g, '')
    .replace(/\}/g, '')
    .replace(/\[/g, '- ')
    .replace(/\]/g, '')
}

interface ConfigGenerationRequest {
  sessionId: string
  businessProfile: any
  dataSchema: any
  integrations: string[]
  workflows: string[]
}

export async function POST(request: NextRequest) {
  try {
    const data: ConfigGenerationRequest = await request.json()
    const { sessionId, businessProfile, dataSchema, integrations, workflows } = data
    
    // Get stored credentials for this session
    const credentials = await getSessionCredentials(sessionId)
    
    // Generate the YAML configuration
    const yamlConfig = {
      vertical: {
        name: businessProfile.businessName.toLowerCase().replace(/\s+/g, '-'),
        description: `${businessProfile.businessType} management system`,
        version: '1.0.0',
        industry: businessProfile.industry || 'general'
      },
      
      business: {
        name: businessProfile.businessName,
        type: businessProfile.businessType,
        website: businessProfile.website,
        contact: {
          email: businessProfile.email,
          phone: businessProfile.phone,
          address: businessProfile.address
        },
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en'
        }
      },
      
      database: {
        provider: 'postgresql',
        models: dataSchema.models.map((model: string) => ({
          name: model,
          fields: generateModelFields(model, businessProfile.businessType)
        }))
      },
      
      apis: {
        integrations: integrations.map(integration => {
          const credential = (credentials as any)[integration]
          return {
            name: integration,
            enabled: !!credential,
            config: generateIntegrationConfig(integration, credential)
          }
        })
      },
      
      workflows: workflows.map(workflow => ({
        name: workflow,
        description: `Automated ${workflow.replace(/_/g, ' ')}`,
        trigger: generateWorkflowTrigger(workflow),
        steps: generateWorkflowSteps(workflow, businessProfile.businessType)
      })),
      
      ui: {
        theme: {
          primary_color: '#3B82F6',
          secondary_color: '#10B981',
          font_family: 'Inter'
        },
        branding: {
          logo_url: businessProfile.logoUrl || '',
          favicon_url: businessProfile.faviconUrl || ''
        },
        pages: generateUIPages(dataSchema.models, businessProfile.businessType)
      },
      
      alerts: {
        channels: [
          {
            type: 'email',
            config: {
              from: `noreply@${businessProfile.businessName.toLowerCase().replace(/\s+/g, '-')}.com`,
              smtp: (credentials as any).smtp || {}
            }
          },
          {
            type: 'sms',
            enabled: !!(credentials as any).twilio,
            config: (credentials as any).twilio ? {
              provider: 'twilio',
              from: (credentials as any).twilio.phoneNumber
            } : {}
          }
        ],
        rules: generateAlertRules(businessProfile.businessType)
      },
      
      deployment: {
        environment: 'production',
        platform: 'vercel',
        resources: {
          api: {
            instances: 2,
            memory: '1Gi',
            cpu: '0.5'
          },
          database: {
            size: '10Gi',
            connections: 100
          }
        },
        domains: [
          `${businessProfile.businessName.toLowerCase().replace(/\s+/g, '-')}.opsai.app`
        ]
      }
    }
    
    // Convert to YAML
    const yamlString = generateYAML(yamlConfig)
    
    return NextResponse.json({
      success: true,
      yaml: yamlString,
      config: yamlConfig
    })
    
  } catch (error) {
    console.error('YAML generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions

async function getSessionCredentials(sessionId: string) {
  // In a real implementation, fetch credentials from database by session ID
  // For now, return structure
  return {
    quickbooks: null,
    square: null,
    stripe: null,
    shopify: null,
    smtp: {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false
    }
  }
}

function generateModelFields(modelName: string, businessType: string) {
  const commonFields = [
    { name: 'id', type: 'string', required: true, unique: true },
    { name: 'createdAt', type: 'datetime', required: true },
    { name: 'updatedAt', type: 'datetime', required: true }
  ]
  
  const modelFields: Record<string, any[]> = {
    Customer: [
      { name: 'name', type: 'string', required: true },
      { name: 'email', type: 'string', required: true, unique: true },
      { name: 'phone', type: 'string' },
      { name: 'address', type: 'json' },
      { name: 'loyaltyPoints', type: 'integer', default: 0 }
    ],
    Product: [
      { name: 'name', type: 'string', required: true },
      { name: 'sku', type: 'string', required: true, unique: true },
      { name: 'price', type: 'decimal', required: true },
      { name: 'cost', type: 'decimal' },
      { name: 'inventory', type: 'integer', default: 0 },
      { name: 'category', type: 'string' }
    ],
    Order: [
      { name: 'orderNumber', type: 'string', required: true, unique: true },
      { name: 'customerId', type: 'string', relation: 'Customer' },
      { name: 'items', type: 'json', required: true },
      { name: 'total', type: 'decimal', required: true },
      { name: 'status', type: 'enum', values: ['pending', 'processing', 'completed', 'cancelled'] },
      { name: 'paymentMethod', type: 'string' }
    ],
    Property: [
      { name: 'name', type: 'string', required: true },
      { name: 'address', type: 'json', required: true },
      { name: 'type', type: 'string' },
      { name: 'bedrooms', type: 'integer' },
      { name: 'bathrooms', type: 'decimal' },
      { name: 'maxGuests', type: 'integer' },
      { name: 'basePrice', type: 'decimal' }
    ],
    Reservation: [
      { name: 'confirmationCode', type: 'string', required: true, unique: true },
      { name: 'propertyId', type: 'string', relation: 'Property' },
      { name: 'guestId', type: 'string', relation: 'Guest' },
      { name: 'checkIn', type: 'date', required: true },
      { name: 'checkOut', type: 'date', required: true },
      { name: 'totalAmount', type: 'decimal', required: true },
      { name: 'status', type: 'enum', values: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] }
    ]
  }
  
  return [...commonFields, ...(modelFields[modelName] || [])]
}

function generateIntegrationConfig(integration: string, credential: any) {
  if (!credential) {
    return { enabled: false, message: 'Not configured yet' }
  }
  
  const configs: Record<string, any> = {
    quickbooks: {
      companyId: credential.companyId,
      syncInterval: '15m',
      entities: ['customers', 'invoices', 'products', 'payments']
    },
    square: {
      locationId: credential.locationId,
      webhooks: ['payment.created', 'order.updated', 'customer.created'],
      syncInterval: '5m'
    },
    stripe: {
      webhooks: ['payment_intent.succeeded', 'customer.created', 'invoice.paid'],
      syncProducts: true,
      syncCustomers: true
    },
    shopify: {
      shop: credential.shop,
      webhooks: ['orders/create', 'products/update', 'customers/create'],
      syncInterval: '10m'
    }
  }
  
  return configs[integration] || { enabled: true }
}

function generateWorkflowTrigger(workflow: string) {
  const triggers: Record<string, any> = {
    order_fulfillment: { type: 'event', event: 'order.created' },
    inventory_reorder: { type: 'schedule', cron: '0 6 * * *' },
    customer_loyalty: { type: 'event', event: 'order.completed' },
    booking_confirmation: { type: 'event', event: 'reservation.created' },
    check_in_process: { type: 'schedule', cron: '0 15 * * *' },
    invoice_generation: { type: 'event', event: 'service.completed' },
    appointment_reminder: { type: 'schedule', cron: '0 9 * * *' }
  }
  
  return triggers[workflow] || { type: 'manual' }
}

function generateWorkflowSteps(workflow: string, businessType: string) {
  const workflowSteps: Record<string, any[]> = {
    order_fulfillment: [
      { name: 'validate_inventory', type: 'condition' },
      { name: 'charge_payment', type: 'integration', provider: 'stripe' },
      { name: 'update_inventory', type: 'database' },
      { name: 'send_confirmation', type: 'email' },
      { name: 'notify_kitchen', type: 'notification' }
    ],
    booking_confirmation: [
      { name: 'check_availability', type: 'condition' },
      { name: 'process_payment', type: 'integration', provider: 'stripe' },
      { name: 'update_calendar', type: 'database' },
      { name: 'send_confirmation', type: 'email' },
      { name: 'sync_channel_manager', type: 'integration' }
    ],
    inventory_reorder: [
      { name: 'check_stock_levels', type: 'query' },
      { name: 'calculate_reorder_qty', type: 'calculation' },
      { name: 'create_purchase_order', type: 'database' },
      { name: 'send_to_supplier', type: 'email' },
      { name: 'update_expected_stock', type: 'database' }
    ]
  }
  
  return workflowSteps[workflow] || [
    { name: 'process', type: 'custom' },
    { name: 'notify', type: 'notification' }
  ]
}

function generateUIPages(models: string[], businessType: string) {
  const pages = [
    {
      name: 'dashboard',
      path: '/',
      components: [
        { type: 'stats_overview', dataSource: 'analytics' },
        { type: 'chart', dataSource: 'revenue_trends' },
        { type: 'recent_activity', dataSource: 'activity_log' }
      ]
    }
  ]
  
  // Generate CRUD pages for each model
  models.forEach(model => {
    pages.push({
      name: `${model.toLowerCase()}_list`,
      path: `/${model.toLowerCase()}s`,
      components: [
        { type: 'data_table', dataSource: model, actions: ['create', 'edit', 'delete'] } as any
      ]
    })
    
    pages.push({
      name: `${model.toLowerCase()}_form`,
      path: `/${model.toLowerCase()}s/:id`,
      components: [
        { type: 'form', dataSource: model, mode: 'edit' } as any
      ]
    })
  })
  
  return pages
}

function generateAlertRules(businessType: string) {
  const commonRules = [
    {
      name: 'low_inventory',
      condition: 'inventory < reorder_point',
      severity: 'warning',
      channels: ['email', 'dashboard']
    },
    {
      name: 'high_value_order',
      condition: 'order.total > 1000',
      severity: 'info',
      channels: ['email', 'sms']
    }
  ]
  
  const businessSpecificRules: Record<string, any[]> = {
    'vacation-rental': [
      {
        name: 'check_in_today',
        condition: 'reservation.checkIn = TODAY',
        severity: 'info',
        channels: ['email', 'sms']
      },
      {
        name: 'cleaning_needed',
        condition: 'reservation.checkOut = TODAY',
        severity: 'high',
        channels: ['sms']
      }
    ],
    bakery: [
      {
        name: 'expiring_products',
        condition: 'product.expiryDate <= TODAY + 2',
        severity: 'warning',
        channels: ['email']
      }
    ],
    insurance: [
      {
        name: 'policy_expiring',
        condition: 'policy.expiryDate <= TODAY + 30',
        severity: 'warning',
        channels: ['email', 'sms']
      }
    ]
  }
  
  return [...commonRules, ...(businessSpecificRules[businessType] || [])]
}