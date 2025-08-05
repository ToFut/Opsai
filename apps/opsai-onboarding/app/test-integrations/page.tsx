'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import AirbyteIntegrationHub from '@/components/AirbyteIntegrationHub'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react'

export default function TestIntegrationsPage() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<string>('')
  const [generatedAppUrl, setGeneratedAppUrl] = useState<string>('')

  const handleIntegrationsComplete = async (connections: any[]) => {
    console.log('✅ Integrations completed:', connections)
    
    // Start app generation process
    setIsGenerating(true)
    setGenerationStatus('Starting app generation...')
    
    try {
      // Generate a sample YAML config based on the connections
      const yamlConfig = generateYamlConfig(connections)
      const appName = `business-app-${Date.now()}`
      
      setGenerationStatus('Generating application from YAML config...')
      
      // Call the generate API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yamlConfig,
          appName
        })
      })
      
      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setGenerationStatus('App generated successfully!')
        setGeneratedAppUrl(result.appUrl)
      } else {
        throw new Error(result.error || 'Generation failed')
      }
      
    } catch (error) {
      console.error('App generation error:', error)
      setGenerationStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateYamlConfig = (connections: any[]) => {
    // Create a dynamic YAML config based on the connected integrations
    const connectedSources = connections.map(c => c.sourceName)
    const businessType = determineBusinessType(connectedSources)
    const models = generateModelsFromIntegrations(connectedSources)
    
    return `vertical:
  name: "${businessType}"
  description: "A custom ${businessType.toLowerCase()} application with integrated data sources"
  industry: "saas"
  version: "1.0.0"

business:
  name: "${businessType}"
  type: "saas"
  website: "https://${businessType.toLowerCase().replace(/\s+/g, '')}.com"
  contact:
    email: "admin@${businessType.toLowerCase().replace(/\s+/g, '')}.com"
  settings:
    timezone: "UTC"
    currency: "USD"
    language: "en"

database:
  provider: "postgresql"
  models:
${models.map(model => `    - name: "${model.name}"
      displayName: "${model.displayName}"
      description: "${model.description}"
      fields:
${model.fields.map(field => `        - name: "${field.name}"
          type: "${field.type}"
          required: ${field.required}
          ${field.unique ? 'unique: true' : ''}
          ${field.validation ? `validation:
            enum: ${JSON.stringify(field.validation.enum)}` : ''}`).join('\n')}`).join('\n')}

apis:
  integrations:
${connectedSources.map(source => `    - name: "${source.toLowerCase()}"
      type: "oauth"
      enabled: true
      provider: "${source.toLowerCase()}"`).join('\n')}

workflows:
  - name: "data-sync"
    description: "Sync data from connected sources"
    trigger:
      type: "schedule"
      config:
        interval: "1h"
    steps:
      - name: "sync-data"
        type: "api-call"
        config:
          integration: "data-sync"
          endpoint: "sync"

authentication:
  providers: ["email", ${connectedSources.map(s => `"${s.toLowerCase()}"`).join(', ')}]
  roles:
    - name: "admin"
      description: "Administrator"
      permissions: ["*"]
    - name: "user"
      description: "Regular user"
      permissions: ["read:own", "write:own"]

ui:
  theme:
    primary: "#3b82f6"
    secondary: "#64748b"
  pages:
    - name: "dashboard"
      path: "/"
      layout: "dashboard"
      components:
        - type: "stats"
          config:
            title: "Overview"
        - type: "chart"
          config:
            title: "Analytics"
${models.map(model => `    - name: "${model.name.toLowerCase()}s"
      path: "/${model.name.toLowerCase()}s"
      layout: "list"
      components:
        - type: "table"
          config:
            entity: "${model.name.toLowerCase()}"
            columns: ${JSON.stringify(model.fields.map(f => f.name))}
            actions: ["create", "edit", "delete"]`).join('\n')}

features:
  authentication: true
  multiTenancy: true
  notifications: true
  analytics: true
  fileUpload: true

deployment:
  platform: "local"
  environment: "development"
  autoDeploy: true`
  }

  const determineBusinessType = (integrations: string[]) => {
    if (integrations.includes('Shopify')) return 'E-commerce'
    if (integrations.includes('Stripe')) return 'Payment Platform'
    if (integrations.includes('Google Analytics')) return 'Analytics Dashboard'
    if (integrations.includes('GitHub')) return 'Developer Platform'
    if (integrations.includes('Slack')) return 'Team Collaboration'
    return 'Business App'
  }

  const generateModelsFromIntegrations = (integrations: string[]) => {
    const models = [
      {
        name: 'user',
        displayName: 'Users',
        description: 'Application users',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'email', type: 'string', required: true, unique: true },
          { name: 'name', type: 'string', required: true },
          { name: 'role', type: 'string', required: true, validation: { enum: ['admin', 'user', 'viewer'] } },
          { name: 'createdAt', type: 'date', required: true }
        ]
      }
    ]

    // Add models based on integrations
    if (integrations.includes('Shopify')) {
      models.push({
        name: 'product',
        displayName: 'Products',
        description: 'E-commerce products',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'name', type: 'string', required: true },
          { name: 'price', type: 'number', required: true },
          { name: 'description', type: 'string', required: false },
          { name: 'category', type: 'string', required: true },
          { name: 'createdAt', type: 'date', required: true }
        ]
      })
    }

    if (integrations.includes('Stripe')) {
      models.push({
        name: 'payment',
        displayName: 'Payments',
        description: 'Payment transactions',
        fields: [
          { name: 'id', type: 'string', required: true, unique: true },
          { name: 'amount', type: 'number', required: true },
          { name: 'currency', type: 'string', required: true },
          { name: 'status', type: 'string', required: true },
          { name: 'customerId', type: 'string', required: true },
          { name: 'createdAt', type: 'date', required: true }
        ]
      })
    }

    return models
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🚀 App Generation with Integrations
          </h1>
          <p className="text-gray-600">
            Connect your data sources and generate a custom business application
          </p>
        </div>
        
        {!isGenerating && !generatedAppUrl && (
          <AirbyteIntegrationHub
            tenantId={`test_tenant_${Date.now()}`}
            businessProfile={{
              industry: 'saas',
              businessType: 'b2b',
              size: 'medium',
              description: 'A demo SaaS business for testing integrations'
            }}
            onIntegrationsComplete={handleIntegrationsComplete}
          />
        )}

        {isGenerating && (
          <Card className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Generating Your App</h3>
            <p className="text-gray-600">{generationStatus}</p>
          </Card>
        )}

        {generatedAppUrl && (
          <Card className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">App Generated Successfully!</h3>
            <p className="text-gray-600 mb-4">
              Your custom business application has been created and is ready to use.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.open(generatedAppUrl, '_blank')}
                className="w-full"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Open Generated App
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setGeneratedAppUrl('')
                  setGenerationStatus('')
                }}
              >
                Generate Another App
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}