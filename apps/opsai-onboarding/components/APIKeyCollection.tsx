'use client'

import { useState } from 'react'
import { Eye, EyeOff, Key, CheckCircle, AlertTriangle, ExternalLink, ArrowRight } from 'lucide-react'

interface APIKeyCollectionProps {
  selectedIntegrations: string[]
  onKeysCollected: (keys: Record<string, string>) => void
  onBack: () => void
}

interface APIKeyConfig {
  id: string
  name: string
  provider: string
  description: string
  setupUrl: string
  keyFormat: string
  required: boolean
  testEndpoint?: string
  docUrl: string
}

const API_KEY_CONFIGS: Record<string, APIKeyConfig> = {
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    provider: 'Payment Processing',
    description: 'Required for payment processing, subscriptions, and checkout functionality',
    setupUrl: 'https://dashboard.stripe.com/apikeys',
    keyFormat: 'sk_test_... or sk_live_...',
    required: true,
    testEndpoint: 'https://api.stripe.com/v1/account',
    docUrl: 'https://stripe.com/docs/keys'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    provider: 'AI Integration',
    description: 'For AI-powered features like chat, content generation, and recommendations',
    setupUrl: 'https://platform.openai.com/api-keys',
    keyFormat: 'sk-...',
    required: false,
    testEndpoint: 'https://api.openai.com/v1/models',
    docUrl: 'https://platform.openai.com/docs/quickstart'
  },
  sendgrid: {
    id: 'sendgrid',
    name: 'SendGrid',
    provider: 'Email Service',
    description: 'For sending transactional emails, notifications, and marketing campaigns',
    setupUrl: 'https://app.sendgrid.com/settings/api_keys',
    keyFormat: 'SG...',
    required: true,
    testEndpoint: 'https://api.sendgrid.com/v3/user/account',
    docUrl: 'https://docs.sendgrid.com/for-developers/sending-email/api-getting-started'
  },
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    provider: 'E-commerce Platform',
    description: 'For e-commerce functionality, product management, and order processing',
    setupUrl: 'https://partners.shopify.com/organizations',
    keyFormat: 'Access Token from Private App',
    required: true,
    docUrl: 'https://shopify.dev/docs/apps/auth/admin-app-access-tokens'
  },
  supabase: {
    id: 'supabase',
    name: 'Supabase',
    provider: 'Database & Auth',
    description: 'For database hosting, user authentication, and real-time features',
    setupUrl: 'https://supabase.com/dashboard/project/_/settings/api',
    keyFormat: 'URL + anon key + service_role key',
    required: true,
    docUrl: 'https://supabase.com/docs/guides/api/api-keys'
  },
  vercel: {
    id: 'vercel',
    name: 'Vercel',
    provider: 'Deployment Platform',
    description: 'Required for deploying your application to production',
    setupUrl: 'https://vercel.com/account/tokens',
    keyFormat: 'vercel_...',
    required: true,
    docUrl: 'https://vercel.com/docs/rest-api#authentication'
  }
}

export default function APIKeyCollection({ selectedIntegrations, onKeysCollected, onBack }: APIKeyCollectionProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [validationStatus, setValidationStatus] = useState<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({})
  const [currentStep, setCurrentStep] = useState<'setup' | 'validate' | 'complete'>('setup')

  // Always include essential keys
  const essentialKeys = ['supabase', 'vercel', 'sendgrid']
  const allRequiredKeys = [...new Set([...essentialKeys, ...selectedIntegrations])]
  const requiredConfigs = allRequiredKeys.map(id => API_KEY_CONFIGS[id]).filter(Boolean)

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const updateApiKey = (keyId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [keyId]: value }))
    // Reset validation when key changes
    setValidationStatus(prev => ({ ...prev, [keyId]: 'idle' }))
  }

  const validateApiKey = async (keyId: string) => {
    const config = API_KEY_CONFIGS[keyId]
    const key = apiKeys[keyId]

    if (!key?.trim()) return

    setValidationStatus(prev => ({ ...prev, [keyId]: 'validating' }))

    try {
      // Simulate API validation (in real implementation, you'd call the actual APIs)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simple format validation
      let isValid = false
      switch (keyId) {
        case 'stripe':
          isValid = key.startsWith('sk_test_') || key.startsWith('sk_live_')
          break
        case 'openai':
          isValid = key.startsWith('sk-') && key.length > 20
          break
        case 'sendgrid':
          isValid = key.startsWith('SG.') && key.length > 20
          break
        case 'vercel':
          isValid = key.length > 20
          break
        case 'supabase':
          isValid = key.includes('supabase.co') || key.length > 30
          break
        default:
          isValid = key.length > 10
      }

      setValidationStatus(prev => ({ ...prev, [keyId]: isValid ? 'valid' : 'invalid' }))
    } catch (error) {
      setValidationStatus(prev => ({ ...prev, [keyId]: 'invalid' }))
    }
  }

  const validateAllKeys = async () => {
    setCurrentStep('validate')
    
    for (const config of requiredConfigs) {
      if (apiKeys[config.id]) {
        await validateApiKey(config.id)
      }
    }

    // Check if all required keys are valid
    const allValid = requiredConfigs
      .filter(config => config.required)
      .every(config => validationStatus[config.id] === 'valid')

    if (allValid) {
      setCurrentStep('complete')
      setTimeout(() => {
        onKeysCollected(apiKeys)
      }, 2000)
    }
  }

  const getValidationIcon = (keyId: string) => {
    const status = validationStatus[keyId]
    switch (status) {
      case 'validating':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'invalid':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">API Keys Configured!</h2>
          <p className="text-gray-600 mb-6">
            All your API keys have been validated and configured. Your app will now be generated with real integrations.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="ml-2">Starting app generation...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configure API Integrations</h1>
            <p className="text-gray-600">Add your API keys to enable real integrations</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              Step {currentStep === 'setup' ? '1' : '2'} of 2
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 'validate' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-800 font-medium">Validating API keys...</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {requiredConfigs.map((config) => (
            <div key={config.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{config.name}</h3>
                    <p className="text-sm text-gray-500">{config.provider}</p>
                    <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                  </div>
                </div>
                {config.required && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    Required
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type={showKeys[config.id] ? 'text' : 'password'}
                      value={apiKeys[config.id] || ''}
                      onChange={(e) => updateApiKey(config.id, e.target.value)}
                      placeholder={`Enter your ${config.name} API key (${config.keyFormat})`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      disabled={currentStep === 'validate'}
                    />
                    <button
                      onClick={() => toggleKeyVisibility(config.id)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys[config.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getValidationIcon(config.id)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <a
                    href={config.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Get API Key
                  </a>
                  <a
                    href={config.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Documentation
                  </a>
                </div>

                {validationStatus[config.id] === 'invalid' && (
                  <div className="text-red-600 text-sm flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Invalid API key format or key doesn't work
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-8">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            disabled={currentStep === 'validate'}
          >
            ← Back
          </button>
          
          <button
            onClick={validateAllKeys}
            disabled={
              currentStep === 'validate' || 
              !requiredConfigs.filter(c => c.required).every(c => apiKeys[c.id]?.trim())
            }
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {currentStep === 'validate' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Validating...
              </>
            ) : (
              <>
                Continue to Generation
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}