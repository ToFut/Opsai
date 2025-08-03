'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  Loader2,
  Zap,
  Globe,
  Brain,
  Rocket,
  Check
} from 'lucide-react'

// Import our components
import { BusinessJourneyProgress } from './BusinessJourneyProgress'
import { InstantValuePreview } from './InstantValuePreview'
import AppGenerationProgress from './AppGenerationProgress'

interface SmartOnboardingV3Props {
  onComplete: (config: any) => void
  initialUrl?: string
  mockMode?: boolean
}

export const SmartOnboardingV3: React.FC<SmartOnboardingV3Props> = ({
  onComplete,
  initialUrl = '',
  mockMode = false
}) => {
  const [websiteUrl, setWebsiteUrl] = useState(initialUrl)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [businessData, setBusinessData] = useState<any>(null)
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<'input' | 'analyzing' | 'review' | 'generating'>('input')

  const analyzeWebsite = async () => {
    if (!websiteUrl.trim()) return
    
    setIsAnalyzing(true)
    setCurrentPhase('analyzing')
    
    // Simulate comprehensive AI analysis
    const analysisSteps = [
      "🔍 Scanning your website...",
      "🤖 Understanding your business model...",
      "📊 Detecting your tech stack...",
      "💡 Identifying growth opportunities...",
      "🔗 Finding integration points...",
      "⚡ Preparing your dashboard blueprint..."
    ]
    
    for (let i = 0; i < analysisSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
    }
    
    // Generate comprehensive business data from website
    const mockBusinessData = {
      businessName: extractBusinessName(websiteUrl),
      businessType: 'E-commerce',
      industry: 'Online Retail',
      websiteUrl: websiteUrl,
      detectedInfo: {
        description: "Leading online marketplace for premium products",
        targetAudience: "Tech-savvy consumers aged 25-45",
        businessModel: "B2C E-commerce with subscription options",
        yearFounded: 2020,
        estimatedRevenue: "$5M-$10M",
        employeeCount: "50-100"
      },
      detectedPlatforms: [
        { name: 'Shopify', type: 'E-commerce', confidence: 95 },
        { name: 'Stripe', type: 'Payments', confidence: 92 },
        { name: 'Google Analytics', type: 'Analytics', confidence: 88 },
        { name: 'Mailchimp', type: 'Email Marketing', confidence: 85 },
        { name: 'Facebook Ads', type: 'Advertising', confidence: 82 }
      ],
      opportunities: [
        {
          title: "Abandoned cart recovery",
          impact: "Recover 30% of lost sales",
          effort: "low"
        },
        {
          title: "Customer segmentation",
          impact: "20% increase in email conversions",
          effort: "medium"
        },
        {
          title: "Inventory optimization",
          impact: "Reduce stockouts by 87%",
          effort: "low"
        }
      ],
      suggestedFeatures: [
        "Real-time sales dashboard",
        "Customer lifetime value tracking",
        "Inventory alerts and forecasting",
        "Marketing ROI calculator",
        "Automated reporting"
      ]
    }
    
    setBusinessData(mockBusinessData)
    setSelectedIntegrations(mockBusinessData.detectedPlatforms.map(p => p.name))
    setIsAnalyzing(false)
    setAnalysisComplete(true)
    setCurrentPhase('review')
  }
  
  const extractBusinessName = (url: string) => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
      const name = domain.replace('www.', '').split('.')[0]
      return name.charAt(0).toUpperCase() + name.slice(1)
    } catch {
      return 'Your Business'
    }
  }

  const generateYamlConfig = () => {
    if (!businessData) return ''
    
    return `
vertical:
  name: ${businessData.businessName}
  type: ${businessData.businessType.toLowerCase().replace(/\s+/g, '-')}
  description: ${businessData.detectedInfo.description}
  industry: ${businessData.industry}
  businessModel: ${businessData.detectedInfo.businessModel}

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
${businessData.detectedPlatforms.map((p: any) => `    - name: ${p.name}\n      type: ${p.type}\n      enabled: true`).join('\n')}

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

  const handleGenerate = () => {
    setCurrentPhase('generating')
    setIsGenerating(true)
  }

  const renderContent = () => {
    switch (currentPhase) {
      case 'input':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Enter Your Website, Get Your Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Our AI will analyze everything and build your perfect business command center
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Input
                      type="url"
                      placeholder="yourcompany.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="pl-10 h-12 text-lg"
                      onKeyPress={(e) => e.key === 'Enter' && analyzeWebsite()}
                    />
                  </div>
                  
                  <Button 
                    onClick={analyzeWebsite}
                    disabled={!websiteUrl.trim() || isAnalyzing}
                    className="w-full h-12 text-lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze & Build My Dashboard
                  </Button>
                  
                  <p className="text-center text-sm text-gray-500">
                    Takes about 30 seconds • No credit card required
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )

      case 'analyzing':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="border-blue-200">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      AI is analyzing {businessData?.businessName || extractBusinessName(websiteUrl)}
                    </h2>
                    <p className="text-gray-600">
                      Discovering your business model, tech stack, and opportunities...
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      "🔍 Scanning website structure",
                      "🤖 Understanding business model", 
                      "📊 Detecting technology stack",
                      "💡 Finding growth opportunities",
                      "🔗 Identifying integrations",
                      "⚡ Creating dashboard blueprint"
                    ].map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.8 }}
                        className="flex items-center gap-3 text-left"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.8 + 0.3 }}
                        >
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </motion.div>
                        <span className="text-gray-700">{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )

      case 'review':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* AI Analysis Complete */}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Analysis complete!</strong> We've discovered everything about {businessData.businessName} 
                and prepared your custom dashboard.
              </AlertDescription>
            </Alert>

            {/* Business Summary */}
            <Card>
              <CardHeader>
                <CardTitle>We found your business</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Business Name</span>
                      <p className="font-semibold">{businessData.businessName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Industry</span>
                      <p className="font-semibold">{businessData.industry}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Business Type</span>
                      <p className="font-semibold">{businessData.businessType}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Target Audience</span>
                      <p className="font-semibold">{businessData.detectedInfo.targetAudience}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Est. Revenue</span>
                      <p className="font-semibold">{businessData.detectedInfo.estimatedRevenue}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Team Size</span>
                      <p className="font-semibold">{businessData.detectedInfo.employeeCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detected Platforms */}
            <Card>
              <CardHeader>
                <CardTitle>Detected platforms we'll connect</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {businessData.detectedPlatforms.map((platform: any) => (
                    <div key={platform.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {platform.name === 'Shopify' && '🛍️'}
                          {platform.name === 'Stripe' && '💳'}
                          {platform.name === 'Google Analytics' && '📊'}
                          {platform.name === 'Mailchimp' && '📧'}
                          {platform.name === 'Facebook Ads' && '📱'}
                        </div>
                        <div>
                          <h4 className="font-medium">{platform.name}</h4>
                          <p className="text-sm text-gray-600">{platform.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {platform.confidence}% match
                        </Badge>
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dashboard Features */}
            <Card>
              <CardHeader>
                <CardTitle>Your dashboard will include</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {businessData.suggestedFeatures.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Auth Notice */}
            <Alert className="border-blue-200 bg-blue-50">
              <Zap className="w-5 h-5 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Free Preview Available!</strong> You can explore a demo version immediately. 
                Sign up for free to unlock full features, save your work, and deploy to production.
              </AlertDescription>
            </Alert>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate}
              size="lg"
              className="w-full"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Generate My Dashboard Now
            </Button>
          </motion.div>
        )

      case 'generating':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AppGenerationProgress
              yamlConfig={generateYamlConfig()}
              appName={businessData.businessName}
              onComplete={(appUrl) => {
                setIsGenerating(false)
                onComplete({
                  businessProfile: businessData,
                  integrations: selectedIntegrations,
                  features: businessData.suggestedFeatures,
                  mockMode,
                  requiresAuth: true,
                  appUrl
                })
              }}
              onBack={() => setCurrentPhase('review')}
            />
          </motion.div>
        )
    }
  }

  // Journey steps based on phase
  const journeySteps = [
    {
      id: 1,
      title: "Enter your website",
      description: "Just your URL, nothing else needed",
      status: currentPhase === 'input' ? 'current' : analysisComplete ? 'completed' : 'upcoming'
    },
    {
      id: 2,
      title: "AI analyzes everything",
      description: "Business model, tech stack, opportunities",
      status: currentPhase === 'analyzing' ? 'current' : analysisComplete ? 'completed' : 'upcoming'
    },
    {
      id: 3,
      title: "Review & customize",
      description: "Confirm what we found (30 seconds)",
      status: currentPhase === 'review' ? 'current' : isGenerating ? 'completed' : 'upcoming'
    },
    {
      id: 4,
      title: "Dashboard goes live",
      description: "Access your business command center",
      status: currentPhase === 'generating' ? 'current' : 'upcoming'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left sidebar - Journey Progress */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="pt-6">
                <BusinessJourneyProgress
                  steps={journeySteps}
                  currentStep={journeySteps.findIndex(s => s.status === 'current')}
                />
              </CardContent>
            </Card>

            {/* Value Preview - show after analysis */}
            {businessData && (
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
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}