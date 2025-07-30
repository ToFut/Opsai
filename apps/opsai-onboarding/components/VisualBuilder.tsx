'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, Database, Globe, Play, Plus, X, Download, Rocket } from 'lucide-react'
import AppGenerationProgress from './AppGenerationProgress'
import AppPreview from './AppPreview'

interface VisualBuilderProps {
  onBack: () => void
}

interface Entity {
  id: string
  name: string
  fields: Array<{
    id: string
    name: string
    type: string
    required: boolean
  }>
}

interface Integration {
  id: string
  name: string
  provider: string
  category: string
  connected: boolean
}

interface Workflow {
  id: string
  name: string
  description: string
  steps: number
}

export default function VisualBuilder({ onBack }: VisualBuilderProps) {
  const [currentView, setCurrentView] = useState<'builder' | 'generating' | 'preview'>('builder')
  const [generatedAppUrl, setGeneratedAppUrl] = useState<string>('')
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedVertical, setSelectedVertical] = useState('')
  const [appConfig, setAppConfig] = useState({
    name: '',
    description: ''
  })
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedIntegrations, setSelectedIntegrations] = useState<Set<string>>(new Set())
  const [workflows, setWorkflows] = useState<Workflow[]>([])

  const steps = [
    { id: 'vertical', title: 'Choose Industry' },
    { id: 'config', title: 'App Configuration' },
    { id: 'schema', title: 'Data Schema' },
    { id: 'integrations', title: 'API Integrations' },
    { id: 'workflows', title: 'Workflows' },
    { id: 'generate', title: 'Generate App' }
  ]

  const verticals = [
    { id: 'vacation-rental', name: 'Vacation Rental', icon: '🏨', description: 'Property management and booking system' },
    { id: 'restaurant', name: 'Restaurant', icon: '🍕', description: 'Customer management and orders' },
    { id: 'fitness', name: 'Fitness Studio', icon: '💪', description: 'Class booking and member management' },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛍️', description: 'Product and order management' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', description: 'Patient and appointment management' },
    { id: 'custom', name: 'Custom', icon: '⚙️', description: 'Build from scratch' }
  ]

  const availableIntegrations: Integration[] = [
    { id: 'stripe', name: 'Stripe', provider: 'Payment Processing', category: 'finance', connected: false },
    { id: 'shopify', name: 'Shopify', provider: 'E-commerce Platform', category: 'ecommerce', connected: false },
    { id: 'salesforce', name: 'Salesforce', provider: 'CRM Platform', category: 'crm', connected: false },
    { id: 'sendgrid', name: 'SendGrid', provider: 'Email Service', category: 'communication', connected: false },
    { id: 'twilio', name: 'Twilio', provider: 'SMS & Voice', category: 'communication', connected: false },
    { id: 'hubspot', name: 'HubSpot', provider: 'Marketing & CRM', category: 'crm', connected: false }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addEntity = () => {
    const newEntity: Entity = {
      id: Date.now().toString(),
      name: 'NewEntity',
      fields: [
        { id: '1', name: 'id', type: 'uuid', required: true },
        { id: '2', name: 'name', type: 'string', required: true },
        { id: '3', name: 'created_at', type: 'timestamp', required: true }
      ]
    }
    setEntities([...entities, newEntity])
  }

  const toggleIntegration = (integrationId: string) => {
    const newSelected = new Set(selectedIntegrations)
    if (newSelected.has(integrationId)) {
      newSelected.delete(integrationId)
    } else {
      newSelected.add(integrationId)
    }
    setSelectedIntegrations(newSelected)
  }

  const generateYamlConfig = () => {
    const vertical = verticals.find(v => v.id === selectedVertical)
    const selectedIntegrationsList = Array.from(selectedIntegrations).map(id => 
      availableIntegrations.find(i => i.id === id)
    ).filter(Boolean)

    const yamlConfig = {
      metadata: {
        name: appConfig.name.toLowerCase().replace(/\s+/g, '-') || 'my-saas-app',
        displayName: appConfig.name || 'My SaaS Application',
        description: appConfig.description || `Complete ${vertical?.name} management platform`,
        version: '1.0.0',
        vertical: selectedVertical,
        generated: new Date().toISOString()
      },
      database: {
        type: 'postgresql',
        entities: entities.reduce((acc, entity) => {
          acc[entity.name] = {
            fields: entity.fields.reduce((fieldAcc, field) => {
              fieldAcc[field.name] = {
                type: field.type,
                required: field.required,
                ...(field.name === 'id' && { primary: true })
              }
              return fieldAcc
            }, {} as any)
          }
          return acc
        }, {} as any)
      },
      integrations: selectedIntegrationsList.map(integration => ({
        name: integration!.id,
        provider: integration!.name,
        category: integration!.category,
        type: 'rest',
        authentication: {
          type: integration!.id === 'stripe' ? 'api_key' : 'oauth2'
        }
      })),
      workflows: workflows.map(workflow => ({
        name: workflow.id,
        displayName: workflow.name,
        description: workflow.description,
        enabled: true
      })),
      ui: {
        theme: {
          primary: '#3B82F6',
          secondary: '#64748B'
        },
        pages: entities.map(entity => ({
          name: entity.name.toLowerCase(),
          path: `/${entity.name.toLowerCase()}s`,
          type: 'crud',
          entity: entity.name
        }))
      },
      deployment: {
        platform: 'vercel',
        database: 'postgresql'
      }
    }

    return `# OPSAI Generated Configuration\n# Generated: ${new Date().toISOString()}\n\n${JSON.stringify(yamlConfig, null, 2)}`
  }

  const downloadConfig = () => {
    const yaml = generateYamlConfig()
    const blob = new Blob([yaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'opsai-config.yaml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateApp = () => {
    setCurrentView('generating')
  }

  const handleGenerationComplete = (appUrl: string) => {
    setGeneratedAppUrl(appUrl)
    setCurrentView('preview')
  }

  const handleBackToBuilder = () => {
    setCurrentView('builder')
  }

  const handleStartNew = () => {
    setCurrentView('builder')
    setCurrentStep(0)
    setSelectedVertical('')
    setAppConfig({ name: '', description: '' })
    setEntities([])
    setSelectedIntegrations(new Set())
    setWorkflows([])
    setGeneratedAppUrl('')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Vertical Selection
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Industry</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Select your business vertical to get personalized templates and integrations
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {verticals.map((vertical) => (
                <button
                  key={vertical.id}
                  onClick={() => setSelectedVertical(vertical.id)}
                  className={`p-6 rounded-lg border-2 transition-all hover:shadow-lg ${
                    selectedVertical === vertical.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-4xl mb-3">{vertical.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{vertical.name}</h3>
                  <p className="text-sm text-gray-600">{vertical.description}</p>
                </button>
              ))}
            </div>
          </div>
        )

      case 1: // App Configuration
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Configure Your App</h2>
              <p className="text-gray-600">Basic information about your SaaS application</p>
            </div>
            <div className="bg-white p-6 rounded-lg border space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
                <input
                  type="text"
                  value={appConfig.name}
                  onChange={(e) => setAppConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Awesome SaaS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={appConfig.description}
                  onChange={(e) => setAppConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe what your SaaS application does..."
                />
              </div>
            </div>
          </div>
        )

      case 2: // Schema Design
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Design Your Data Schema</h2>
              <p className="text-gray-600">Define the data models for your application</p>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Data Entities</h3>
                <button
                  onClick={addEntity}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entity
                </button>
              </div>
              
              {entities.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No entities defined</h3>
                  <p className="text-gray-500 mb-4">Add your first data entity</p>
                  <button
                    onClick={addEntity}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Entity
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {entities.map((entity, index) => (
                    <div key={entity.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <input
                          type="text"
                          value={entity.name}
                          onChange={(e) => {
                            const updated = [...entities]
                            updated[index].name = e.target.value
                            setEntities(updated)
                          }}
                          className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                        />
                        <button
                          onClick={() => {
                            setEntities(entities.filter(e => e.id !== entity.id))
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {entity.fields.map((field) => (
                          <div key={field.id} className="flex items-center space-x-2 text-sm">
                            <span className="font-mono bg-white px-2 py-1 rounded">{field.name}</span>
                            <span className="text-gray-500">{field.type}</span>
                            {field.required && <span className="text-red-500 text-xs">required</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 3: // Integrations
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Select API Integrations</h2>
              <p className="text-gray-600">Connect your app with popular services</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableIntegrations.map((integration) => {
                const isSelected = selectedIntegrations.has(integration.id)
                return (
                  <button
                    key={integration.id}
                    onClick={() => toggleIntegration(integration.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Globe className="w-8 h-8 text-gray-600" />
                      {isSelected && <div className="w-4 h-4 bg-blue-500 rounded-full" />}
                    </div>
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-600">{integration.provider}</p>
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {integration.category}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 4: // Workflows
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Automated Workflows</h2>
              <p className="text-gray-600">Business process automation for your app</p>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Workflows</h3>
                <button
                  onClick={() => setWorkflows([...workflows, {
                    id: Date.now().toString(),
                    name: 'New Workflow',
                    description: 'Automated business process',
                    steps: 3
                  }])}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workflow
                </button>
              </div>
              
              {workflows.length === 0 ? (
                <div className="text-center py-12">
                  <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows defined</h3>
                  <p className="text-gray-500 mb-4">Add automated workflows for your business processes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                          <p className="text-sm text-gray-600">{workflow.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{workflow.steps} steps</span>
                          <button
                            onClick={() => setWorkflows(workflows.filter(w => w.id !== workflow.id))}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 5: // Generate
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Generate Your SaaS Application</h2>
              <p className="text-gray-600">Review your configuration and generate your app</p>
            </div>
            
            {/* Configuration Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-4">📱 Application</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {appConfig.name || 'Untitled'}</div>
                  <div><span className="font-medium">Vertical:</span> {verticals.find(v => v.id === selectedVertical)?.name}</div>
                  <div><span className="font-medium">Entities:</span> {entities.length}</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-4">🔌 Integrations</h3>
                <div className="space-y-2 text-sm">
                  {Array.from(selectedIntegrations).map(id => {
                    const integration = availableIntegrations.find(i => i.id === id)
                    return (
                      <div key={id} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>{integration?.name}</span>
                      </div>
                    )
                  })}
                  {selectedIntegrations.size === 0 && (
                    <div className="text-gray-500 italic">No integrations selected</div>
                  )}
                </div>
              </div>
            </div>

            {/* YAML Preview */}
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">📄 Generated Configuration</h3>
                <button
                  onClick={downloadConfig}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download YAML
                </button>
              </div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-64">
                <pre className="text-sm whitespace-pre-wrap">
                  {generateYamlConfig().substring(0, 500)}...
                </pre>
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={generateApp}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 flex items-center mx-auto"
              >
                <Rocket className="w-6 h-6 mr-3" />
                Generate My SaaS Application
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Your complete application will be ready in 2-3 minutes
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Handle different views
  if (currentView === 'generating') {
    return (
      <AppGenerationProgress
        yamlConfig={generateYamlConfig()}
        appName={appConfig.name || 'My SaaS Application'}
        onComplete={handleGenerationComplete}
        onBack={handleBackToBuilder}
      />
    )
  }

  if (currentView === 'preview') {
    return (
      <AppPreview
        appUrl={generatedAppUrl}
        appName={appConfig.name || 'My SaaS Application'}
        yamlConfig={generateYamlConfig()}
        onBack={handleBackToBuilder}
        onStartNew={handleStartNew}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Visual SaaS Builder</h1>
              <p className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="hidden md:flex items-center space-x-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`px-3 py-1 text-sm rounded-full ${
                  index === currentStep
                    ? 'bg-blue-600 text-white'
                    : index < currentStep
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {renderStep()}
        
        {/* Navigation */}
        <div className="flex justify-between pt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          {currentStep < steps.length - 1 && (
            <button
              onClick={nextStep}
              disabled={currentStep === 0 && !selectedVertical}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}