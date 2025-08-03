'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JourneyStep {
  id: number
  title: string
  description: string
  status: 'completed' | 'current' | 'upcoming'
  timeEstimate?: string
  substeps?: string[]
}

interface BusinessJourneyProgressProps {
  steps: JourneyStep[]
  currentStep: number
  className?: string
}

export const BusinessJourneyProgress: React.FC<BusinessJourneyProgressProps> = ({
  steps,
  currentStep,
  className
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your Dashboard Journey
        </h3>
        <p className="text-sm text-gray-600">
          {currentStep < steps.length 
            ? `Step ${currentStep + 1} of ${steps.length}` 
            : 'Journey Complete! 🎉'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {/* Progress Line */}
        <motion.div
          className="absolute left-4 top-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"
          initial={{ height: 0 }}
          animate={{ 
            height: `${(currentStep / (steps.length - 1)) * 100}%` 
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => {
            const isCompleted = step.status === 'completed'
            const isCurrent = step.status === 'current'
            const isUpcoming = step.status === 'upcoming'

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start gap-4"
              >
                {/* Step Icon */}
                <div className="relative z-10">
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <CheckCircle className="w-8 h-8 text-green-500 bg-white rounded-full" />
                    </motion.div>
                  )}
                  {isCurrent && (
                    <div className="relative">
                      <Circle className="w-8 h-8 text-blue-500 bg-white rounded-full" />
                      <Loader2 className="w-4 h-4 text-blue-500 absolute top-2 left-2 animate-spin" />
                    </div>
                  )}
                  {isUpcoming && (
                    <Circle className="w-8 h-8 text-gray-300 bg-white rounded-full" />
                  )}
                </div>

                {/* Step Content */}
                <div className={cn(
                  "flex-1 pb-4",
                  isUpcoming && "opacity-50"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn(
                      "font-semibold",
                      isCompleted && "text-green-700",
                      isCurrent && "text-blue-700",
                      isUpcoming && "text-gray-500"
                    )}>
                      {step.title}
                    </h4>
                    {isCompleted && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        ✓ Done
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">
                        In Progress
                      </span>
                    )}
                    {step.timeEstimate && isUpcoming && (
                      <span className="text-xs text-gray-500">
                        ~{step.timeEstimate}
                      </span>
                    )}
                  </div>

                  <p className={cn(
                    "text-sm mb-2",
                    isCompleted && "text-green-600",
                    isCurrent && "text-gray-700",
                    isUpcoming && "text-gray-500"
                  )}>
                    {step.description}
                  </p>

                  {/* Substeps for current step */}
                  {isCurrent && step.substeps && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 space-y-1"
                    >
                      {step.substeps.map((substep, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="w-1 h-1 bg-gray-400 rounded-full" />
                          <span>{substep}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Summary Card */}
      {currentStep === steps.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200"
        >
          <div className="text-center">
            <h4 className="font-semibold text-green-700 mb-1">
              🎉 Congratulations! Your journey is complete!
            </h4>
            <p className="text-sm text-green-600">
              Your dashboard is ready and all systems are connected.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Preset journey templates for different business types
export const journeyTemplates = {
  ecommerce: [
    {
      id: 1,
      title: "Understanding your business",
      description: "Analyzing your e-commerce platform and identifying key metrics",
      status: 'current' as const,
      timeEstimate: "1 minute",
      substeps: [
        "Scanning product catalog",
        "Analyzing customer data",
        "Reviewing order history"
      ]
    },
    {
      id: 2,
      title: "Connecting your tools",
      description: "Linking Shopify, Stripe, and Google Analytics for complete visibility",
      status: 'upcoming' as const,
      timeEstimate: "3 minutes"
    },
    {
      id: 3,
      title: "Building your dashboard",
      description: "Creating custom views for sales, inventory, and customer insights",
      status: 'upcoming' as const,
      timeEstimate: "2 minutes"
    },
    {
      id: 4,
      title: "Launching your command center",
      description: "Final setup and going live with real-time data",
      status: 'upcoming' as const,
      timeEstimate: "1 minute"
    }
  ],
  saas: [
    {
      id: 1,
      title: "Learning about your SaaS",
      description: "Understanding your business model and key metrics",
      status: 'current' as const,
      timeEstimate: "1 minute",
      substeps: [
        "Identifying subscription tiers",
        "Analyzing user segments",
        "Mapping customer journey"
      ]
    },
    {
      id: 2,
      title: "Connecting your stack",
      description: "Integrating Stripe, Auth0, and analytics platforms",
      status: 'upcoming' as const,
      timeEstimate: "3 minutes"
    },
    {
      id: 3,
      title: "Designing your metrics",
      description: "Setting up MRR, churn, and customer health tracking",
      status: 'upcoming' as const,
      timeEstimate: "2 minutes"
    },
    {
      id: 4,
      title: "Activating insights",
      description: "Enabling alerts and automated reporting",
      status: 'upcoming' as const,
      timeEstimate: "1 minute"
    }
  ]
}