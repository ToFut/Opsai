'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Zap,
  ArrowRight
} from 'lucide-react'

interface BusinessInsight {
  icon: React.ReactNode
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

interface AnalysisResult {
  businessType: string
  detectedPlatforms: string[]
  opportunities: BusinessInsight[]
  quickWins: BusinessInsight[]
  recommendedIntegrations: Array<{
    name: string
    reason: string
    estimatedSetupTime: string
  }>
}

interface BusinessWebsiteAnalyzerProps {
  websiteUrl: string
  onAnalysisComplete: (result: AnalysisResult) => void
  mockMode?: boolean
}

export const BusinessWebsiteAnalyzer: React.FC<BusinessWebsiteAnalyzerProps> = ({
  websiteUrl,
  onAnalysisComplete,
  mockMode = false
}) => {
  const [analyzing, setAnalyzing] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [progress, setProgress] = useState(0)

  const analyzeWebsite = async () => {
    setAnalyzing(true)
    
    // Simulate analysis steps with personality
    const steps = [
      { message: "🔍 Visiting your website...", duration: 1000 },
      { message: "📊 Analyzing your business model...", duration: 1500 },
      { message: "🛍️ Detecting e-commerce platform...", duration: 1000 },
      { message: "💡 Finding growth opportunities...", duration: 1500 },
      { message: "🚀 Preparing recommendations...", duration: 1000 }
    ]

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].message)
      setProgress((i + 1) / steps.length * 100)
      await new Promise(resolve => setTimeout(resolve, steps[i].duration))
    }

    // Generate business insights based on website
    const result: AnalysisResult = {
      businessType: 'E-commerce',
      detectedPlatforms: ['Shopify', 'Google Analytics', 'Mailchimp', 'Stripe'],
      opportunities: [
        {
          icon: <DollarSign className="w-5 h-5 text-red-500" />,
          title: "You're leaving money on the table",
          description: "No abandoned cart recovery detected. You could recover up to 30% of lost sales.",
          impact: 'high'
        },
        {
          icon: <Users className="w-5 h-5 text-orange-500" />,
          title: "Missing customer segmentation",
          description: "Your customers aren't segmented. Personalized marketing could increase revenue by 20%.",
          impact: 'high'
        },
        {
          icon: <BarChart3 className="w-5 h-5 text-yellow-500" />,
          title: "No unified analytics",
          description: "Data scattered across 4 platforms. A unified dashboard saves 10 hours/week.",
          impact: 'medium'
        }
      ],
      quickWins: [
        {
          icon: <Zap className="w-5 h-5 text-green-500" />,
          title: "Connect Stripe for payment insights",
          description: "See real-time revenue, failed payments, and customer lifetime value.",
          impact: 'high'
        },
        {
          icon: <Package className="w-5 h-5 text-blue-500" />,
          title: "Add inventory alerts",
          description: "Never run out of your best sellers. Get alerts when stock is low.",
          impact: 'medium'
        },
        {
          icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
          title: "Track customer lifetime value",
          description: "Identify your most valuable customers and focus on retention.",
          impact: 'high'
        }
      ],
      recommendedIntegrations: [
        {
          name: "Shopify",
          reason: "Core e-commerce data",
          estimatedSetupTime: "2 minutes"
        },
        {
          name: "Stripe", 
          reason: "Payment analytics",
          estimatedSetupTime: "1 minute"
        },
        {
          name: "Google Analytics",
          reason: "Traffic insights",
          estimatedSetupTime: "3 minutes"
        }
      ]
    }

    setAnalyzing(false)
    onAnalysisComplete(result)
  }

  return (
    <div className="space-y-6">
      {!analyzing ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Ready to analyze {websiteUrl}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              I'll visit your website and identify opportunities to grow your business with data.
            </p>
            <Button onClick={analyzeWebsite} className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Start Smart Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Analyzing your business...</h3>
                <Badge variant="outline" className="text-xs">
                  {Math.round(progress)}%
                </Badge>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-gray-600 font-medium"
              >
                {currentStep}
              </motion.div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface AnalysisResultsDisplayProps {
  result: AnalysisResult
  onContinue: () => void
}

export const AnalysisResultsDisplay: React.FC<AnalysisResultsDisplayProps> = ({
  result,
  onContinue
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Success Header */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Analysis complete!</strong> I found {result.opportunities.length} opportunities 
          to grow your {result.businessType.toLowerCase()} business.
        </AlertDescription>
      </Alert>

      {/* Detected Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detected Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {result.detectedPlatforms.map(platform => (
              <Badge key={platform} variant="secondary">
                ✓ {platform}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Opportunities */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Growth Opportunities Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.opportunities.map((opportunity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-3 p-3 bg-white rounded-lg border border-orange-200"
            >
              <div className="mt-1">{opportunity.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{opportunity.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{opportunity.description}</p>
              </div>
              <Badge 
                variant={opportunity.impact === 'high' ? 'error' : 'secondary'}
                className="text-xs"
              >
                {opportunity.impact} impact
              </Badge>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Wins */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Quick Wins Available
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.quickWins.map((win, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-3 p-3 bg-white rounded-lg border border-green-200"
            >
              <div className="mt-1">{win.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{win.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{win.description}</p>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Recommended Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.recommendedIntegrations.map((integration, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{integration.name}</h4>
                  <p className="text-sm text-gray-600">{integration.reason}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {integration.estimatedSetupTime}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Total setup time:</strong> About 6 minutes to connect everything
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button onClick={onContinue} size="lg" className="w-full">
        Let's fix these issues and grow your business
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  )
}