'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Loader2,
  Zap,
  Building2,
  Check
} from 'lucide-react'

// Import our new components
import { SmartBusinessForm } from './SmartBusinessForm'
import { BusinessWebsiteAnalyzer, AnalysisResultsDisplay } from './BusinessWebsiteAnalyzer'
import { BusinessJourneyProgress, journeyTemplates } from './BusinessJourneyProgress'
import { InstantValuePreview } from './InstantValuePreview'
import AppGenerationProgress from './AppGenerationProgress'

interface OnboardingPhase {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
}

const phases: OnboardingPhase[] = [
  {
    id: 'business-info',
    title: 'Tell us about your business',
    subtitle: 'Quick questions to understand your needs',
    icon: <Building2 className="w-6 h-6" />
  },
  {
    id: 'analysis',
    title: 'Smart business analysis',
    subtitle: 'Finding opportunities to grow',
    icon: <Sparkles className="w-6 h-6" />
  },
  {
    id: 'integrations',
    title: 'Connect your tools',
    subtitle: 'Link your existing platforms',
    icon: <Zap className="w-6 h-6" />
  },
  {
    id: 'launch',
    title: 'Launch your dashboard',
    subtitle: 'Go live with real-time insights',
    icon: <CheckCircle className="w-6 h-6" />
  }
]

interface SmartOnboardingV2Props {
  onComplete: (config: any) => void
  initialUrl?: string
  mockMode?: boolean
}

export const SmartOnboardingV2: React.FC<SmartOnboardingV2Props> = ({
  onComplete,
  initialUrl = '',
  mockMode = false
}) => {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [businessData, setBusinessData] = useState<any>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Update journey progress
  const journeySteps = businessData?.businessType 
    ? journeyTemplates[businessData.businessType.toLowerCase()] || journeyTemplates.ecommerce
    : journeyTemplates.ecommerce

  const updatedJourneySteps = journeySteps.map((step, index) => ({
    ...step,
    status: index < currentPhase ? 'completed' as const : 
            index === currentPhase ? 'current' as const : 
            'upcoming' as const
  }))

  const handleBusinessFormComplete = (data: any) => {
    setBusinessData(data)
    setCurrentPhase(1)
  }

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result)
    // Auto-select recommended integrations
    setSelectedIntegrations(result.recommendedIntegrations.map((i: any) => i.name))
  }

  const generateYamlConfig = () => {
    if (!businessData) return ''
    
    return `
vertical:
  name: ${businessData.businessName}
  type: ${businessData.businessType.toLowerCase().replace(/\s+/g, '-')}
  description: ${businessData.description || 'Business application'}
  industry: ${businessData.industry || 'General'}
  businessModel: ${businessData.businessModel || 'B2C'}

business:
  name: ${businessData.businessName}
  type: ${businessData.businessType}

database:
  models:
    - name: Customer
      fields:
        - name: id
          type: uuid
          primary: true
        - name: email
          type: string
          unique: true
        - name: name
          type: string
        - name: createdAt
          type: datetime
          default: now
    - name: Order
      fields:
        - name: id
          type: uuid
          primary: true
        - name: customerId
          type: relation
          relation: Customer
        - name: total
          type: decimal
        - name: status
          type: string
          enum: [pending, completed, cancelled]
        - name: createdAt
          type: datetime
          default: now

apis:
  integrations:
${selectedIntegrations.map(name => `    - name: ${name}\n      type: integration\n      enabled: true`).join('\n')}

ui:
  pages:
    - name: dashboard
      title: Dashboard
      components:
        - type: stats
          title: Key Metrics
        - type: chart
          title: Revenue Trends
    - name: customers
      title: Customers
      components:
        - type: table
          title: Customer List
    - name: orders
      title: Orders
      components:
        - type: table
          title: Order History

workflows:
  - name: order-processing
    trigger: api
    steps:
      - action: validate-order
      - action: process-payment
      - action: update-inventory
      - action: send-confirmation
`.trim()
  }

  const handleIntegrationsComplete = () => {
    setCurrentPhase(3)
    setIsGenerating(true)
    
    // Prepare configuration for app generation
    const config = {
      businessProfile: businessData,
      analysisResults: analysisResult,
      integrations: selectedIntegrations,
      mockMode
    }
    
    // Simulate generation then call onComplete
    setTimeout(() => {
      onComplete(config)
    }, 3000)
  }

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SmartBusinessForm
              onComplete={handleBusinessFormComplete}
              initialData={{ websiteUrl: initialUrl }}
            />
          </motion.div>
        )

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {!analysisResult ? (
              <BusinessWebsiteAnalyzer
                websiteUrl={businessData.websiteUrl}
                onAnalysisComplete={handleAnalysisComplete}
                mockMode={mockMode}
              />
            ) : (
              <AnalysisResultsDisplay
                result={analysisResult}
                onContinue={() => setCurrentPhase(2)}
              />
            )}
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Connect Your Business Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  We'll connect these platforms to give you a complete view of your business.
                </p>
                
                <div className="space-y-3">
                  {analysisResult.recommendedIntegrations.map((integration: any) => (
                    <IntegrationCard
                      key={integration.name}
                      name={integration.name}
                      reason={integration.reason}
                      setupTime={integration.estimatedSetupTime}
                      selected={selectedIntegrations.includes(integration.name)}
                      onToggle={() => {
                        setSelectedIntegrations(prev =>
                          prev.includes(integration.name)
                            ? prev.filter(i => i !== integration.name)
                            : [...prev, integration.name]
                        )
                      }}
                    />
                  ))}
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Quick setup:</strong> All integrations use secure OAuth. 
                    No passwords needed!
                  </p>
                </div>

                <Button 
                  onClick={handleIntegrationsComplete}
                  className="w-full mt-6"
                  disabled={selectedIntegrations.length === 0}
                >
                  Connect {selectedIntegrations.length} Integration{selectedIntegrations.length !== 1 ? 's' : ''}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {isGenerating && (
              <AppGenerationProgress
                yamlConfig={generateYamlConfig()}
                appName={businessData.businessName}
                onComplete={(appUrl) => {
                  setIsGenerating(false)
                  onComplete({
                    businessProfile: businessData,
                    integrations: selectedIntegrations,
                    features: businessData.suggestedFeatures || [],
                    mockMode,
                    requiresAuth: true,
                    appUrl
                  })
                }}
                onBack={() => setCurrentPhase('dashboard-customization')}
              />
            )}
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Build Your Business Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Get insights that help you grow - setup in minutes, not weeks
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left sidebar - Journey Progress */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="pt-6">
                <BusinessJourneyProgress
                  steps={updatedJourneySteps}
                  currentStep={currentPhase}
                />
              </CardContent>
            </Card>

            {/* Value Preview - show after business info */}
            {businessData && currentPhase > 0 && (
              <div className="mt-6">
                <InstantValuePreview
                  businessType={businessData.businessType}
                  integrations={selectedIntegrations}
                />
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Phase indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                {phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className={`flex items-center ${index < phases.length - 1 ? 'flex-1' : ''}`}
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                        index < currentPhase
                          ? 'bg-green-500 text-white'
                          : index === currentPhase
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {index < currentPhase ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        phase.icon
                      )}
                    </div>
                    {index < phases.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 transition-colors ${
                          index < currentPhase ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {phases[currentPhase].title}
                </h2>
                <p className="text-gray-600">
                  {phases[currentPhase].subtitle}
                </p>
              </div>
            </div>

            {/* Phase content */}
            <AnimatePresence mode="wait">
              {renderPhaseContent()}
            </AnimatePresence>

            {/* Navigation */}
            {currentPhase > 0 && currentPhase < 3 && !isGenerating && (
              <div className="mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPhase(currentPhase - 1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Integration Card Component
interface IntegrationCardProps {
  name: string
  reason: string
  setupTime: string
  selected: boolean
  onToggle: () => void
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  name,
  reason,
  setupTime,
  selected,
  onToggle
}) => {
  const logos: Record<string, string> = {
    Shopify: '🛍️',
    Stripe: '💳',
    'Google Analytics': '📊',
    Mailchimp: '📧',
    HubSpot: '🎯',
    Salesforce: '☁️'
  }

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{logos[name] || '🔗'}</span>
          <div>
            <h4 className="font-medium">{name}</h4>
            <p className="text-sm text-gray-600">{reason}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {setupTime}
          </Badge>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
            }`}
          >
            {selected && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
      </div>
    </div>
  )
}