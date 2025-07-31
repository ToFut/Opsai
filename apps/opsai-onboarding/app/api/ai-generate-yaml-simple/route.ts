import { NextRequest, NextResponse } from 'next/server'
import * as yaml from 'js-yaml'

export async function POST(request: NextRequest) {
  try {
    const { businessAnalysis, confirmedInsights, businessProfile } = await request.json()

    if (!confirmedInsights || !businessProfile) {
      return NextResponse.json({ error: 'Confirmed insights and business profile are required' }, { status: 400 })
    }

    console.log(`🤖 Generating YAML for: ${businessProfile.businessName}`)

    // Generate YAML configuration based on AI insights
    const yamlConfig = {
      vertical: {
        name: businessProfile.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: `${businessProfile.businessType} management system powered by AI`,
        version: "1.0.0",
        industry: businessProfile.industry || 'general',
        businessModel: confirmedInsights.businessIntelligence?.businessModel || 'B2C'
      },
      
      business: {
        name: businessProfile.businessName,
        type: businessProfile.businessType,
        website: businessProfile.website,
        contact: {
          email: `support@${businessProfile.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          phone: '+1-800-555-0100'
        },
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en'
        }
      },
      
      database: {
        provider: 'postgresql',
        models: (confirmedInsights.technicalRequirements?.dataModels || []).map((model: any) => ({
          name: model.name,
          displayName: model.name,
          description: model.description,
          fields: (model.fields || []).map((field: any) => ({
            name: field.name,
            type: field.type,
            required: field.required || false,
            unique: field.unique || false,
            validation: field.validation || null,
            ui: {
              label: field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/([A-Z])/g, ' $1'),
              widget: getUIWidget(field.type),
              placeholder: `Enter ${field.name}`
            }
          })),
          relationships: model.relationships || [],
          indexes: [`${model.name.toLowerCase()}_created_at`],
          permissions: {
            read: ['admin', 'staff', 'customer'],
            write: ['admin', 'staff'],
            delete: ['admin']
          }
        }))
      },
      
      apis: {
        integrations: (confirmedInsights.technicalRequirements?.integrationOpportunities || [])
          .filter((int: any) => int.priority === 'critical' || int.priority === 'important')
          .map((integration: any) => ({
            name: integration.service.toLowerCase().replace(/\s+/g, '-'),
            type: 'rest',
            provider: integration.service,
            baseUrl: getIntegrationUrl(integration.service),
            authentication: {
              type: getAuthType(integration.service),
              envVars: [`${integration.service.toUpperCase().replace(/\s+/g, '_')}_API_KEY`]
            },
            endpoints: getIntegrationEndpoints(integration.service, integration.category),
            rateLimits: {
              requests: 1000,
              period: '1h'
            }
          }))
      },
      
      workflows: (confirmedInsights.technicalRequirements?.workflowRequirements || []).map((workflow: any) => ({
        name: workflow.name.toLowerCase().replace(/\s+/g, '-'),
        description: workflow.description,
        trigger: {
          type: workflow.trigger,
          endpoint: workflow.trigger === 'api_call' ? `/api/workflows/${workflow.name.toLowerCase().replace(/\s+/g, '-')}` : null,
          schedule: workflow.trigger === 'schedule' ? '0 0 * * *' : null
        },
        steps: (workflow.steps || []).map((step: any, index: number) => ({
          id: `step_${index + 1}`,
          name: step.name,
          type: step.type,
          description: step.description,
          config: getStepConfig(step.type)
        }))
      })),
      
      authentication: {
        providers: ['email', 'oauth'],
        roles: (confirmedInsights.userManagement?.userTypes || []).map((userType: any) => ({
          name: userType.role,
          description: userType.description,
          permissions: userType.permissions || []
        })),
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialChars: true
          },
          sessionManagement: {
            sessionTimeout: '24h',
            refreshToken: true
          },
          auditLogging: confirmedInsights.userManagement?.securityRequirements?.auditRequirements || false
        }
      },
      
      ui: {
        theme: {
          primaryColor: '#1e40af',
          secondaryColor: '#3b82f6',
          layout: 'sidebar'
        },
        pages: generateUIPages(confirmedInsights),
        dashboards: {
          executive: confirmedInsights.uiuxRecommendations?.dashboardNeeds?.executiveDashboard || false,
          operational: confirmedInsights.uiuxRecommendations?.dashboardNeeds?.operationalDashboard || true,
          customer: confirmedInsights.uiuxRecommendations?.dashboardNeeds?.customerDashboard || false
        }
      },
      
      deployment: {
        platform: confirmedInsights.deploymentStrategy?.recommendedPlatform || 'vercel',
        environment: 'production',
        resources: {
          api: { memory: '512MB', cpu: '0.5' },
          database: { size: '10GB', connections: 20 }
        },
        domains: [`${businessProfile.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.opsai.app`],
        ssl: true,
        monitoring: {
          enabled: true,
          services: ['logs', 'metrics', 'alerts']
        }
      },
      
      features: {
        authentication: true,
        workflows: true,
        integrations: true,
        fileUpload: true,
        notifications: true,
        analytics: true,
        audit: confirmedInsights.userManagement?.securityRequirements?.auditRequirements || false
      }
    }

    // Convert to YAML string
    const yamlString = yaml.dump(yamlConfig, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    })

    console.log('✅ YAML Generation completed')
    
    return NextResponse.json({
      success: true,
      yaml: yamlString,
      structured: yamlConfig,
      config: yamlConfig, // For compatibility
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'ai-insights-based',
        stage: 'yaml_generation'
      }
    })

  } catch (error) {
    console.error('YAML Generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate YAML configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getUIWidget(fieldType: string): string {
  const widgetMap: Record<string, string> = {
    'string': 'text',
    'number': 'number',
    'boolean': 'checkbox',
    'date': 'datepicker',
    'json': 'json-editor',
    'enum': 'select'
  }
  return widgetMap[fieldType] || 'text'
}

function getIntegrationUrl(service: string): string {
  const urls: Record<string, string> = {
    'Stripe': 'https://api.stripe.com/v1',
    'QuickBooks': 'https://api.quickbooks.com/v3',
    'Mailchimp': 'https://api.mailchimp.com/3.0',
    'Twilio': 'https://api.twilio.com/2010-04-01',
    'DoorDash': 'https://api.doordash.com/v1',
    'Uber Eats': 'https://api.uber.com/v1/eats',
    'Square': 'https://connect.squareup.com/v2',
    'Google Maps API': 'https://maps.googleapis.com/maps/api'
  }
  return urls[service] || 'https://api.example.com'
}

function getAuthType(service: string): string {
  const authTypes: Record<string, string> = {
    'Stripe': 'api_key',
    'QuickBooks': 'oauth2',
    'Mailchimp': 'api_key',
    'Twilio': 'basic',
    'DoorDash': 'oauth2',
    'Uber Eats': 'oauth2',
    'Square': 'oauth2',
    'Google Maps API': 'api_key'
  }
  return authTypes[service] || 'api_key'
}

function getIntegrationEndpoints(service: string, category: string): any[] {
  const endpointMap: Record<string, any[]> = {
    'payments': [
      { name: 'create_payment', method: 'POST', path: '/payments' },
      { name: 'get_payment', method: 'GET', path: '/payments/{id}' },
      { name: 'list_payments', method: 'GET', path: '/payments' }
    ],
    'communication': [
      { name: 'send_sms', method: 'POST', path: '/messages' },
      { name: 'send_email', method: 'POST', path: '/emails' }
    ],
    'delivery': [
      { name: 'create_delivery', method: 'POST', path: '/deliveries' },
      { name: 'track_delivery', method: 'GET', path: '/deliveries/{id}' }
    ],
    'accounting': [
      { name: 'create_invoice', method: 'POST', path: '/invoices' },
      { name: 'sync_transactions', method: 'GET', path: '/transactions' }
    ]
  }
  return endpointMap[category] || []
}

function getStepConfig(stepType: string): any {
  const configs: Record<string, any> = {
    'validation': { validateFields: true, stopOnError: true },
    'api_call': { retries: 3, timeout: 30000 },
    'notification': { channels: ['email', 'sms'] },
    'calculation': { precision: 2 },
    'data_transformation': { format: 'json' }
  }
  return configs[stepType] || {}
}

function generateUIPages(insights: any): any[] {
  const pages = [
    {
      name: 'dashboard',
      path: '/',
      layout: 'full-width',
      components: ['stats-overview', 'charts', 'recent-activity'],
      permissions: ['admin', 'staff']
    }
  ]
  
  // Add pages for each data model
  if (insights.technicalRequirements?.dataModels) {
    insights.technicalRequirements.dataModels.forEach((model: any) => {
      pages.push({
        name: model.name.toLowerCase(),
        path: `/${model.name.toLowerCase()}`,
        layout: 'sidebar',
        components: ['data-table', 'filters', 'actions'],
        permissions: ['admin', 'staff']
      })
    })
  }
  
  // Add critical feature pages
  if (insights.uiuxRecommendations?.criticalFeatures) {
    insights.uiuxRecommendations.criticalFeatures.forEach((feature: string) => {
      const featureName = feature.toLowerCase().replace(/\s+/g, '-')
      if (!pages.find(p => p.name === featureName)) {
        pages.push({
          name: featureName,
          path: `/${featureName}`,
          layout: 'sidebar',
          components: ['feature-specific'],
          permissions: ['admin', 'staff', 'customer']
        })
      }
    })
  }
  
  return pages
}