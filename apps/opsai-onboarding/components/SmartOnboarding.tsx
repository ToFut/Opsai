'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, Globe, Sparkles, Link as LinkIcon, Check, AlertCircle, ExternalLink } from 'lucide-react'
import AppGenerationProgress from './AppGenerationProgress'

interface BusinessAnalysis {
  websiteAnalysis: {
    url: string
    title: string
    description: string
    industry: string
    industryConfidence: number
    detectedContact: {
      phone: string
      email: string
      socialMedia: Array<{ platform: string; url: string }>
    }
    businessHours: string
  }
  businessProfile: {
    businessName: string
    businessType: string
    yearFounded: number
    suggestedIntegrations: string[]
    dataModels: string[]
    workflows: string[]
    uniqueFeatures: string[]
  }
  suggestedIntegrations: string[]
  dataSchema: {
    models: string[]
    workflows: string[]
  }
}

interface IntegrationStatus {
  [key: string]: {
    connected: boolean
    accountName?: string
    connecting: boolean
  }
}

const providerLogos: Record<string, string> = {
  quickbooks: '💰',
  square: '⬜',
  stripe: '💳',
  shopify: '🛍️',
  hubspot: '🎯',
  salesforce: '☁️',
  mailchimp: '📧',
  'google-workspace': '📊',
  slack: '💬',
  twilio: '📱',
  calendly: '📅',
  xero: '📈',
  'microsoft-365': '📘',
  zendesk: '🎫',
  paypal: '💰',
  woocommerce: '🛒',
  amazon: '📦',
  intercom: '💬',
  sendgrid: '📧',
  zoho: '🏢',
  canva: '🎨',
  zoom: '📹',
  // Restaurant/Food Service
  doordash: '🚗',
  'uber-eats': '🍔',
  opentable: '🍽️',
  resy: '🥂',
  toast: '🍞',
  restaurant365: '🏪',
  // Enterprise ERP
  netsuite: '💼',
  sap: '🏭',
  oracle: '🔶',
  workday: '👥',
  // Project Management
  asana: '✅',
  trello: '📋',
  monday: '📅',
  notion: '📝',
  jira: '🐛'
}

const SmartOnboarding = ({ 
  onComplete, 
  initialUrl = '' 
}: { 
  onComplete: (config: any) => void;
  initialUrl?: string;
}) => {
  const [step, setStep] = useState<'input' | 'analyzing' | 'results' | 'integrations' | 'generating'>('analyzing')
  const [websiteUrl, setWebsiteUrl] = useState(initialUrl)
  const [analysis, setAnalysis] = useState<BusinessAnalysis | null>(null)
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({})
  const [error, setError] = useState('')
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9))

  // Auto-start analysis if initialUrl is provided
  useEffect(() => {
    if (initialUrl && step === 'analyzing') {
      analyzeWebsite()
    }
  }, [initialUrl])

  // Website Analysis
  const analyzeWebsite = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL')
      return
    }

    setStep('analyzing')
    setError('')

    try {
              const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: websiteUrl.trim() })
      })

      const data = await response.json()

      if (response.ok && data.businessType) {
        // Convert API response to expected format
        const analysisData = {
          websiteAnalysis: {
            industry: data.industry || 'General Business',
            industryConfidence: 95,
            url: websiteUrl.trim(),
            title: data.businessType || 'Business Website',
            description: `${data.businessType || 'Business'} website analysis`,
            detectedContact: {
              phone: '+1-555-0123',
              email: 'contact@business.com',
              socialMedia: []
            },
            businessHours: 'Mon-Fri 9AM-5PM'
          },
          businessProfile: {
            businessName: data.businessType || 'Your Business',
            businessType: data.businessType || 'General Business',
            yearFounded: new Date().getFullYear(),
            suggestedIntegrations: data.detectedSystems || [],
            dataModels: data.detectedSystems || [],
            workflows: data.integrationOpportunities?.slice(0, 3) || ['Order Processing', 'Customer Onboarding', 'Payment Handling'],
            uniqueFeatures: data.recommendations?.slice(0, 3) || ['Modern Design', 'Mobile Responsive', 'Cloud Based']
          },
          dataSchema: {
            models: data.detectedSystems?.slice(0, 3) || ['User', 'Order', 'Product'],
            workflows: data.integrationOpportunities?.slice(0, 3) || ['Order Processing', 'Customer Onboarding', 'Payment Handling']
          },
          suggestedIntegrations: data.detectedSystems || [],
          recommendations: data.recommendations || [],
          integrationOpportunities: data.integrationOpportunities || [],
          success: true
        }
        setAnalysis(analysisData)
        
        // Initialize integration status
        const status: IntegrationStatus = {}
        data.detectedSystems.forEach((provider: string) => {
          status[provider] = { connected: false, connecting: false }
        })
        setIntegrationStatus(status)
        
        setStep('results')
      } else {
        setError(data.error || 'Failed to analyze website')
        setStep('input')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      setStep('input')
    }
  }

  // Connect OAuth Integration
  const connectIntegration = async (provider: string) => {
    setIntegrationStatus(prev => ({
      ...prev,
      [provider]: { ...prev[provider], connecting: true }
    }))

    try {
      // Open OAuth flow in new window
      const authWindow = window.open(
        `/api/oauth/${provider}/connect?session_id=${sessionId}`,
        'oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      // Listen for messages from OAuth popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'OAUTH_SUCCESS' && event.data.provider === provider) {
          setIntegrationStatus(prev => ({
            ...prev,
            [provider]: { 
              connected: true, 
              connecting: false,
              accountName: event.data.account || undefined
            }
          }))
          
          // Clean up
          window.removeEventListener('message', handleMessage)
        } else if (event.data.type === 'OAUTH_ERROR' && event.data.provider === provider) {
          setIntegrationStatus(prev => ({
            ...prev,
            [provider]: { ...prev[provider], connecting: false }
          }))
          
          // Clean up
          window.removeEventListener('message', handleMessage)
        }
      }

      // Add message listener
      window.addEventListener('message', handleMessage)

      // Fallback: check if window is closed (in case postMessage fails)
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed)
          
          setTimeout(() => {
            // If still connecting after window closed, assume failure
            setIntegrationStatus(prev => {
              if (prev[provider]?.connecting) {
                return {
                  ...prev,
                  [provider]: { ...prev[provider], connecting: false }
                }
              }
              return prev
            })
            
            // Clean up message listener
            window.removeEventListener('message', handleMessage)
          }, 1000)
        }
      }, 1000)

    } catch (error) {
      setIntegrationStatus(prev => ({
        ...prev,
        [provider]: { ...prev[provider], connecting: false }
      }))
    }
  }

  // Generate App - Show Visual Generation Interface
  const generateApp = () => {
    if (!analysis) return
    setStep('generating')
  }

  const connectedCount = Object.values(integrationStatus).filter(status => status.connected).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Business App Generator</h1>
            <p className="text-gray-600">Enter your website and we'll build your complete business app automatically</p>
          </div>

          {/* Step 1: Website Input */}
          {step === 'input' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyze Your Business</h2>
                <p className="text-gray-600">Our AI will scan your website to understand your business and create the perfect app</p>
              </div>

              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Business Website
                </label>
                <div className="flex space-x-3">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://yourbusiness.com"
                    onKeyPress={(e) => e.key === 'Enter' && analyzeWebsite()}
                  />
                  <button
                    onClick={analyzeWebsite}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium"
                  >
                    Analyze
                  </button>
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-700 text-sm">{error}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Analyzing */}
          {step === 'analyzing' && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyzing Your Business...</h2>
              <div className="space-y-2 text-gray-600">
                <p>🔍 Scanning your website content</p>
                <p>🤖 Detecting your industry and business type</p>
                <p>📊 Generating data models and workflows</p>
                <p>🔗 Identifying integration opportunities</p>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'results' && analysis && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Analysis Complete! ✨</h2>
                    <p className="text-green-100">
                      We detected a <strong>{analysis.websiteAnalysis.industry}</strong> business with {analysis.businessProfile.dataModels.length} data models and {analysis.suggestedIntegrations.length} recommended integrations
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{analysis.websiteAnalysis.industryConfidence}%</div>
                    <div className="text-sm text-green-100">Confidence</div>
                  </div>
                </div>
              </div>

              {/* Business Profile */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Your Business Profile</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {analysis.businessProfile.businessName}</div>
                      <div><span className="font-medium">Type:</span> {analysis.businessProfile.businessType}</div>
                      <div><span className="font-medium">Industry:</span> {analysis.websiteAnalysis.industry}</div>
                      <div><span className="font-medium">Website:</span> 
                        <a href={analysis.websiteAnalysis.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          {analysis.websiteAnalysis.url}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Generated Features</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Data Models:</span> {analysis.businessProfile.dataModels.join(', ')}</div>
                      <div><span className="font-medium">Workflows:</span> {analysis.dataSchema.workflows.join(', ')}</div>
                      <div><span className="font-medium">Special Features:</span> {analysis.businessProfile.uniqueFeatures.join(', ')}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('input')}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Analyze Different Website
                </button>
                <button
                  onClick={() => setStep('integrations')}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium"
                >
                  Connect Integrations
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Integrations */}
          {step === 'integrations' && analysis && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Connect Your Tools</h2>
                    <p className="text-gray-600">Connect the tools you use to sync data automatically</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{connectedCount}/{analysis.suggestedIntegrations.length}</div>
                    <div className="text-sm text-gray-500">Connected</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.suggestedIntegrations.map((provider, index) => {
                    const status = integrationStatus[provider]
                    return (
                      <div key={provider} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{providerLogos[provider] || '🔗'}</div>
                            <div>
                              <div className="font-medium text-gray-900 capitalize">
                                {provider.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              {status?.accountName && (
                                <div className="text-sm text-gray-500">{status.accountName}</div>
                              )}
                            </div>
                          </div>
                          
                          {status?.connected ? (
                            <div className="flex items-center text-green-600">
                              <Check className="w-5 h-5 mr-1" />
                              <span className="text-sm font-medium">Connected</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => connectIntegration(provider)}
                              disabled={status?.connecting}
                              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                status?.connecting
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {status?.connecting ? 'Connecting...' : 'Connect'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      You can connect more integrations later. {connectedCount > 0 ? `${connectedCount} integration${connectedCount > 1 ? 's' : ''} ready to sync data.` : 'Skip for now if you prefer.'}
                    </div>
                    <button
                      onClick={generateApp}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 font-medium"
                    >
                      Generate My App
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Visual Generation */}
          {step === 'generating' && analysis && (
            <AppGenerationProgress
              yamlConfig=""
              appName={analysis.businessProfile.businessName}
              onComplete={(appUrl: string) => {
                onComplete({
                  yamlConfig: '',
                  config: {},
                  appUrl: appUrl,
                  businessProfile: analysis.businessProfile,
                  connectedIntegrations: Object.entries(integrationStatus)
                    .filter(([_, status]) => status.connected)
                    .map(([provider, status]) => ({ provider, accountName: status.accountName }))
                })
              }}
              onBack={() => setStep('integrations')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default SmartOnboarding