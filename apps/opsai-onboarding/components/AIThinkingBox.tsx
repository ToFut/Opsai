import React, { useState, useEffect } from 'react'
import { Brain, Zap, Database, Link2, Users, Code2, Sparkles, Cog } from 'lucide-react'

interface AIThinkingBoxProps {
  stage: 'analyzing' | 'generating' | 'complete' | 'error'
  websiteUrl?: string
  progress?: number
  currentStep?: string
  onCancel?: () => void
}

interface ThinkingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'active' | 'complete' | 'error'
  duration: number
}

export default function AIThinkingBox({ stage, websiteUrl, progress = 0, currentStep, onCancel }: AIThinkingBoxProps) {
  const [steps, setSteps] = useState<ThinkingStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [dots, setDots] = useState('')

  // Define the thinking steps based on stage
  useEffect(() => {
    const analysisSteps: ThinkingStep[] = [
      {
        id: 'scraping',
        title: 'Website Analysis',
        description: `Scanning ${websiteUrl} for business information...`,
        icon: <Brain className="w-4 h-4" />,
        status: 'pending',
        duration: 3
      },
      {
        id: 'understanding',
        title: 'Business Intelligence',
        description: 'Understanding business model, industry, and target audience...',
        icon: <Sparkles className="w-4 h-4" />,
        status: 'pending',
        duration: 8
      },
      {
        id: 'technical',
        title: 'Technical Requirements',
        description: 'Identifying data models, integrations, and workflows...',
        icon: <Database className="w-4 h-4" />,
        status: 'pending',
        duration: 6
      },
      {
        id: 'integrations',
        title: 'Integration Mapping',
        description: 'Finding optimal third-party services and APIs...',
        icon: <Link2 className="w-4 h-4" />,
        status: 'pending',
        duration: 4
      },
      {
        id: 'users',
        title: 'User Management',
        description: 'Designing user roles, permissions, and security...',
        icon: <Users className="w-4 h-4" />,
        status: 'pending',
        duration: 3
      }
    ]

    const generationSteps: ThinkingStep[] = [
      {
        id: 'yaml_structure',
        title: 'YAML Architecture',
        description: 'Designing application structure and configuration...',
        icon: <Code2 className="w-4 h-4" />,
        status: 'pending',
        duration: 5
      },
      {
        id: 'database_schema',
        title: 'Database Design',
        description: 'Creating data models with relationships and validation...',
        icon: <Database className="w-4 h-4" />,
        status: 'pending',
        duration: 8
      },
      {
        id: 'api_config',
        title: 'API Configuration',
        description: 'Setting up integrations with authentication and endpoints...',
        icon: <Link2 className="w-4 h-4" />,
        status: 'pending',
        duration: 6
      },
      {
        id: 'workflows',
        title: 'Workflow Automation',
        description: 'Defining business processes and automation rules...',
        icon: <Zap className="w-4 h-4" />,
        status: 'pending',
        duration: 4
      },
      {
        id: 'deployment',
        title: 'Deployment Setup',
        description: 'Configuring production environment and monitoring...',
        icon: <Cog className="w-4 h-4" />,
        status: 'pending',
        duration: 3
      }
    ]

    if (stage === 'analyzing') {
      setSteps(analysisSteps)
    } else if (stage === 'generating') {
      setSteps(generationSteps)
    }
  }, [stage, websiteUrl])

  // Animate dots for thinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Auto-progress through steps
  useEffect(() => {
    if (steps.length === 0) return

    const timer = setTimeout(() => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps]
        
        // Mark current step as complete
        if (currentStepIndex > 0) {
          newSteps[currentStepIndex - 1].status = 'complete'
        }
        
        // Mark current step as active
        if (currentStepIndex < newSteps.length) {
          newSteps[currentStepIndex].status = 'active'
        }
        
        return newSteps
      })

      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1)
      }
    }, steps[currentStepIndex]?.duration * 1000 || 3000)

    return () => clearTimeout(timer)
  }, [currentStepIndex, steps])

  if (stage === 'complete') {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {stage === 'analyzing' ? 'AI Business Analysis' : 'Generating Your App'}
                </h3>
                <p className="text-purple-100 text-sm">
                  {stage === 'analyzing' 
                    ? 'Understanding your business model and requirements...'
                    : 'Creating production-ready YAML configuration...'
                  }
                </p>
              </div>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-white hover:text-purple-200 text-sm px-3 py-1 rounded-md hover:bg-white hover:bg-opacity-10"
              >
                Cancel
              </button>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-purple-100 mb-2">
              <span>Progress</span>
              <span>{Math.round((currentStepIndex / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(currentStepIndex / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Thinking Steps */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-start space-x-4 p-4 rounded-lg transition-all duration-500 ${
                  step.status === 'active' 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : step.status === 'complete'
                    ? 'bg-green-50 border-l-4 border-green-500'
                    : step.status === 'error'
                    ? 'bg-red-50 border-l-4 border-red-500'
                    : 'bg-gray-50'
                }`}
              >
                {/* Icon */}
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  step.status === 'active'
                    ? 'bg-blue-100 text-blue-600 animate-pulse'
                    : step.status === 'complete'
                    ? 'bg-green-100 text-green-600'
                    : step.status === 'error'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.status === 'complete' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : step.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium ${
                      step.status === 'active' ? 'text-blue-900' :
                      step.status === 'complete' ? 'text-green-900' :
                      step.status === 'error' ? 'text-red-900' :
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </h4>
                    {step.status === 'active' && (
                      <span className="text-blue-600 animate-pulse font-mono text-sm">
                        {dots}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${
                    step.status === 'active' ? 'text-blue-700' :
                    step.status === 'complete' ? 'text-green-700' :
                    step.status === 'error' ? 'text-red-700' :
                    'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                  
                  {/* Duration indicator */}
                  {step.status === 'active' && (
                    <div className="mt-2">
                      <div className="w-full bg-blue-200 rounded-full h-1">
                        <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>AI is actively processing your request</span>
            </div>
            <div className="text-xs">
              Step {currentStepIndex + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}