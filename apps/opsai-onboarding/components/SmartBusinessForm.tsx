'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Sparkles, ArrowRight, Building2, ShoppingBag, Heart, Briefcase, Store, Zap } from 'lucide-react'

interface ConversationalInputProps {
  question: string
  suggestions?: string[]
  value: string
  onChange: (value: string) => void
  onNext?: () => void
  followUp?: string
  icon?: React.ReactNode
}

const ConversationalInput: React.FC<ConversationalInputProps> = ({
  question,
  suggestions = [],
  value,
  onChange,
  onNext,
  followUp,
  icon
}) => {
  const [showFollowUp, setShowFollowUp] = useState(false)

  useEffect(() => {
    if (value && followUp) {
      setTimeout(() => setShowFollowUp(true), 500)
    }
  }, [value, followUp])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-1">
            {icon}
          </div>
        )}
        <div className="flex-1 space-y-3">
          <h3 className="text-lg font-medium text-gray-900">
            {question}
          </h3>
          
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant={value === suggestion ? "default" : "outline"}
                  size="sm"
                  onClick={() => onChange(suggestion)}
                  className="transition-all"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Or type your answer..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && onNext?.()}
            />
            {value && (
              <Button onClick={onNext} size="sm">
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showFollowUp && followUp && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="ml-12 flex items-center gap-2 text-green-600"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              {followUp.replace('{businessType}', value)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface BusinessFormData {
  businessType: string
  businessName: string
  websiteUrl: string
  mainGoal: string
}

interface SmartBusinessFormProps {
  onComplete: (data: BusinessFormData) => void
  initialData?: Partial<BusinessFormData>
}

export const SmartBusinessForm: React.FC<SmartBusinessFormProps> = ({
  onComplete,
  initialData = {}
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<BusinessFormData>({
    businessType: initialData.businessType || '',
    businessName: initialData.businessName || '',
    websiteUrl: initialData.websiteUrl || '',
    mainGoal: initialData.mainGoal || ''
  })

  const businessIcons = {
    'E-commerce': <ShoppingBag className="w-5 h-5 text-blue-600" />,
    'SaaS': <Zap className="w-5 h-5 text-purple-600" />,
    'Healthcare': <Heart className="w-5 h-5 text-red-600" />,
    'Professional Services': <Briefcase className="w-5 h-5 text-gray-600" />,
    'Retail': <Store className="w-5 h-5 text-green-600" />
  }

  const goalSuggestions = {
    'E-commerce': [
      'Track sales and inventory in real-time',
      'Reduce cart abandonment',
      'Improve customer retention',
      'Optimize marketing spend'
    ],
    'SaaS': [
      'Monitor MRR and churn',
      'Track customer usage patterns',
      'Improve onboarding conversion',
      'Automate billing and invoicing'
    ],
    'Healthcare': [
      'Streamline patient scheduling',
      'Track treatment outcomes',
      'Improve operational efficiency',
      'Ensure compliance reporting'
    ],
    'Professional Services': [
      'Track billable hours',
      'Manage client projects',
      'Automate invoicing',
      'Monitor team utilization'
    ],
    'Retail': [
      'Manage multi-location inventory',
      'Track customer foot traffic',
      'Optimize staff scheduling',
      'Monitor sales performance'
    ]
  }

  const steps = [
    {
      field: 'businessType',
      question: 'What kind of business do you run?',
      suggestions: Object.keys(businessIcons),
      followUp: "Great! I specialize in {businessType} dashboards",
      icon: <Building2 className="w-5 h-5 text-gray-600" />
    },
    {
      field: 'businessName',
      question: "What's your business name?",
      suggestions: [],
      followUp: "Nice to meet you, {businessType}!",
      icon: businessIcons[formData.businessType] || <Building2 className="w-5 h-5 text-gray-600" />
    },
    {
      field: 'websiteUrl',
      question: 'Do you have a website I can analyze?',
      suggestions: [],
      followUp: "I'll analyze this to understand your business better",
      icon: <Sparkles className="w-5 h-5 text-yellow-600" />
    },
    {
      field: 'mainGoal',
      question: "What's your main goal with this dashboard?",
      suggestions: goalSuggestions[formData.businessType] || [],
      followUp: "Perfect! I'll focus on helping you {businessType}",
      icon: <Zap className="w-5 h-5 text-green-600" />
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(formData)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Let's build your perfect dashboard
        </h2>
        <p className="text-gray-600">
          Just a few quick questions to understand your business
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                Question {currentStep + 1} of {steps.length}
              </span>
              <Badge variant="outline" className="text-xs">
                {Math.round(progress)}% complete
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
          </div>

          <ConversationalInput
            key={currentStep}
            question={currentStepData.question}
            suggestions={currentStepData.suggestions}
            value={formData[currentStepData.field]}
            onChange={(value) => handleChange(currentStepData.field, value)}
            onNext={handleNext}
            followUp={currentStepData.followUp}
            icon={currentStepData.icon}
          />

          {currentStep > 0 && (
            <div className="mt-6 pt-6 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                ← Previous question
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview of collected data */}
      {currentStep > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Building your profile:
            </h4>
            <div className="space-y-1 text-sm text-blue-800">
              {formData.businessType && (
                <div>• Business Type: {formData.businessType}</div>
              )}
              {formData.businessName && (
                <div>• Business Name: {formData.businessName}</div>
              )}
              {formData.websiteUrl && (
                <div>• Website: {formData.websiteUrl}</div>
              )}
              {formData.mainGoal && (
                <div>• Main Goal: {formData.mainGoal}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}