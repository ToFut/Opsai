'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Check, Loader2, Link2, Database, Zap, Palette } from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'error'
  action?: () => Promise<void>
}

export default function IntelligentOnboarding({ 
  tenantId, 
  businessInfo,
  onComplete 
}: {
  tenantId: string
  businessInfo: any
  onComplete: (result: any) => void
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'oauth',
      title: 'Connect Your Business Tools',
      description: 'Securely connect to your existing systems',
      status: 'pending'
    },
    {
      id: 'discovery',
      title: 'Discover & Analyze Data',
      description: 'AI analyzes your business data structure',
      status: 'pending'
    },
    {
      id: 'schema',
      title: 'Generate Optimal Schema',
      description: 'Create database structure from real data',
      status: 'pending'
    },
    {
      id: 'ui',
      title: 'Build Custom Interface',
      description: 'Generate UI tailored to your data',
      status: 'pending'
    },
    {
      id: 'deploy',
      title: 'Deploy Your App',
      description: 'Launch your custom application',
      status: 'pending'
    }
  ])
  const [connectedServices, setConnectedServices] = useState<any[]>([])
  const [generationResult, setGenerationResult] = useState<any>(null)

  useEffect(() => {
    startOnboarding()
  }, [])

  const startOnboarding = async () => {
    await executeStep(0)
  }

  const executeStep = async (stepIndex: number) => {
    if (stepIndex >= steps.length) {
      onComplete(generationResult)
      return
    }

    const step = steps[stepIndex]
    updateStepStatus(stepIndex, 'active')

    try {
      switch (step.id) {
        case 'oauth':
          await handleOAuthConnections()
          break
        case 'discovery':
          await handleDataDiscovery()
          break
        case 'schema':
          await handleSchemaGeneration()
          break
        case 'ui':
          await handleUIGeneration()
          break
        case 'deploy':
          await handleDeployment()
          break
      }

      updateStepStatus(stepIndex, 'completed')
      await executeStep(stepIndex + 1)
    } catch (error) {
      console.error(`Step ${step.id} failed:`, error)
      updateStepStatus(stepIndex, 'error')
    }
  }

  const updateStepStatus = (index: number, status: OnboardingStep['status']) => {
    setSteps(prev => {
      const newSteps = [...prev]
      newSteps[index].status = status
      return newSteps
    })
    if (status === 'active') {
      setCurrentStep(index)
    }
  }

  const handleOAuthConnections = async () => {
    // Get recommended services
    const response = await fetch('/api/oauth/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessInfo })
    })
    
    const { providers } = await response.json()
    
    // Open OAuth popup for each provider
    for (const provider of providers) {
      const connected = await connectProvider(provider)
      if (connected) {
        setConnectedServices(prev => [...prev, provider])
      }
    }
  }

  const connectProvider = async (provider: any): Promise<boolean> => {
    return new Promise((resolve) => {
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const authWindow = window.open(
        `/api/oauth/${provider.id}/connect?tenant=${tenantId}`,
        'oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      const checkInterval = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkInterval)
          // Check if connection was successful
          fetch(`/api/oauth/${provider.id}/status?tenant=${tenantId}`)
            .then(res => res.json())
            .then(data => resolve(data.connected))
            .catch(() => resolve(false))
        }
      }, 1000)
    })
  }

  const handleDataDiscovery = async () => {
    const response = await fetch('/api/intelligent-discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        connectedServices,
        businessInfo
      })
    })

    const discovery = await response.json()
    setGenerationResult((prev: any) => ({ ...prev, discovery }))
  }

  const handleSchemaGeneration = async () => {
    const response = await fetch('/api/generate-schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        discovery: generationResult.discovery
      })
    })

    const schema = await response.json()
    setGenerationResult((prev: any) => ({ ...prev, schema }))
  }

  const handleUIGeneration = async () => {
    const response = await fetch('/api/generate-ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        schema: generationResult.schema,
        businessInfo
      })
    })

    const ui = await response.json()
    setGenerationResult((prev: any) => ({ ...prev, ui }))
  }

  const handleDeployment = async () => {
    const response = await fetch('/api/deploy-app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        config: generationResult
      })
    })

    const deployment = await response.json()
    setGenerationResult((prev: any) => ({ ...prev, deployment }))
  }

  const getStepIcon = (step: OnboardingStep) => {
    const icons: Record<string, any> = {
      oauth: Link2,
      discovery: Database,
      schema: Database,
      ui: Palette,
      deploy: Zap
    }
    return icons[step.id] || Zap
  }

  const progress = ((steps.filter(s => s.status === 'completed').length / steps.length) * 100)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6">Building Your Custom Application</h2>
        
        <Progress value={progress} className="mb-8" />
        
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = getStepIcon(step)
            return (
              <div
                key={step.id}
                className={`flex items-center p-4 rounded-lg border transition-all ${
                  step.status === 'active' ? 'border-blue-500 bg-blue-50' :
                  step.status === 'completed' ? 'border-green-500 bg-green-50' :
                  step.status === 'error' ? 'border-red-500 bg-red-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex-shrink-0 mr-4">
                  {step.status === 'completed' ? (
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  ) : step.status === 'active' ? (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                  
                  {step.id === 'oauth' && connectedServices.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">
                        Connected: {connectedServices.map(s => s.name).join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {step.id === 'discovery' && generationResult?.discovery && (
                    <div className="mt-2">
                      <p className="text-sm text-blue-600">
                        Found {generationResult.discovery.entities?.length || 0} data entities
                      </p>
                    </div>
                  )}
                  
                  {step.id === 'deploy' && generationResult?.deployment && (
                    <div className="mt-2">
                      <a 
                        href={generationResult.deployment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View your app →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {steps.every(s => s.status === 'completed') && (
          <div className="mt-8 p-4 bg-green-100 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              🎉 Your application is ready!
            </h3>
            <p className="text-green-700">
              Your custom application has been generated and deployed successfully.
            </p>
            <Button 
              className="mt-4"
              onClick={() => window.open(generationResult.deployment.url, '_blank')}
            >
              Open Your App
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}