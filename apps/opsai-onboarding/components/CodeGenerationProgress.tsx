'use client'

import React, { useState, useEffect } from 'react'
import { Play, FolderOpen, File, Code2, Database, Settings, Zap, CheckCircle, XCircle, Loader2, Terminal, FileCode2, Package } from 'lucide-react'

interface CodeGenerationProgressProps {
  yamlContent?: string
  businessProfile?: any
  onGenerationComplete: (appConfig: any) => void
  onGenerationError: (error: Error) => void
  connectedProviders: Array<{ provider: string; accountName?: string }>
  confirmedInsights: any
  analysisResult: any
  websiteUrl: string
}

interface GenerationStep {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  description?: string
  icon: React.ReactNode
}

export default function CodeGenerationProgress({ 
  yamlContent, 
  businessProfile,
  onGenerationComplete,
  onGenerationError,
  connectedProviders,
  confirmedInsights,
  analysisResult,
  websiteUrl
}: CodeGenerationProgressProps) {
  const [steps, setSteps] = useState<GenerationStep[]>([
    {
      id: 'yaml',
      name: 'Generating YAML Configuration',
      status: 'completed',
      description: 'Business logic and data models',
      icon: <Settings className="w-5 h-5" />
    },
    {
      id: 'structure',
      name: 'Creating Project Structure',
      status: 'pending',
      description: 'Setting up directories and files',
      icon: <FolderOpen className="w-5 h-5" />
    },
    {
      id: 'database',
      name: 'Generating Database Schema',
      status: 'pending',
      description: 'Tables, relationships, and migrations',
      icon: <Database className="w-5 h-5" />
    },
    {
      id: 'api',
      name: 'Building API Endpoints',
      status: 'pending',
      description: 'REST APIs and integrations',
      icon: <Code2 className="w-5 h-5" />
    },
    {
      id: 'ui',
      name: 'Creating UI Components',
      status: 'pending',
      description: 'Dashboard and management interfaces',
      icon: <FileCode2 className="w-5 h-5" />
    },
    {
      id: 'workflows',
      name: 'Configuring Workflows',
      status: 'pending',
      description: 'Automation and business logic',
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'dependencies',
      name: 'Installing Dependencies',
      status: 'pending',
      description: 'Packages and libraries',
      icon: <Package className="w-5 h-5" />
    },
    {
      id: 'deploy',
      name: 'Starting Application',
      status: 'pending',
      description: 'Launching your app locally',
      icon: <Play className="w-5 h-5" />
    }
  ])
  
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '🚀 OpsAI Code Generator v1.0.0',
    '📋 Initializing generation process...'
  ])
  
  const [currentStepIndex, setCurrentStepIndex] = useState(1)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)

  // Start the actual generation process
  useEffect(() => {
    const startGeneration = async () => {
      try {
        // Update step to in_progress
        updateStepStatus(currentStepIndex, 'in_progress')
        addLog(`Starting: ${steps[currentStepIndex].name}...`)
        
        // Log what we're sending
        console.log('📤 Sending to generate API:', {
          yamlContentLength: yamlContent?.length,
          yamlContentType: typeof yamlContent,
          yamlContentPreview: yamlContent?.substring(0, 200),
          appName: confirmedInsights?.businessIntelligence?.businessModel || 
                  analysisResult?.businessType || 
                  'AI Generated Business'
        })
        
        // Debug: Log the full request body
        const requestBody = {
          yamlConfig: yamlContent || '',
          appName: confirmedInsights?.businessIntelligence?.businessModel || 
                  analysisResult?.businessType || 
                  'AI Generated Business'
        }
        
        console.log('📦 Full request body:', {
          bodyKeys: Object.keys(requestBody),
          yamlConfigType: typeof requestBody.yamlConfig,
          yamlConfigLength: requestBody.yamlConfig?.length,
          appNameType: typeof requestBody.appName,
          appName: requestBody.appName
        })
        
        console.log('📝 yamlConfig first 500 chars:', requestBody.yamlConfig?.substring(0, 500))
        
        // Call the actual generation API
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Generation failed: ${response.status}`)
        }
        
        const result = await response.json()
        
        // Simulate step progression
        for (let i = 1; i < steps.length; i++) {
          await simulateStep(i)
        }
        
        // Generation complete
        addLog('✅ Application generated successfully!')
        addLog(`🌐 Your app is running at: http://localhost:${result.port || 7250}`)
        
        setIsGenerating(false)
        
        // Create app config
        const appConfig = {
          yamlConfig: yamlContent,
          config: result.config || {},
          appUrl: result.appUrl || `http://localhost:${result.port || 7250}`,
          port: result.port,
          businessProfile: {
            businessName: confirmedInsights?.businessIntelligence?.businessModel || 
                         analysisResult?.businessType || 
                         'AI Generated Business',
            businessType: confirmedInsights?.businessIntelligence?.industryCategory || 'General',
            dataModels: confirmedInsights?.technicalRequirements?.dataModels?.map((m: any) => m.name) || [],
            website: websiteUrl
          },
          connectedIntegrations: connectedProviders
        }
        
        // Wait a bit before completing to show the success state
        setTimeout(() => {
          onGenerationComplete(appConfig)
        }, 2000)
        
      } catch (error) {
        console.error('Generation error:', error)
        setGenerationError(error instanceof Error ? error.message : 'Unknown error occurred')
        updateStepStatus(currentStepIndex, 'error')
        addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsGenerating(false)
        onGenerationError(error instanceof Error ? error : new Error('Unknown error'))
      }
    }
    
    // Start generation after a short delay
    const timer = setTimeout(startGeneration, 500)
    return () => clearTimeout(timer)
  }, [])

  const simulateStep = async (stepIndex: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        updateStepStatus(stepIndex - 1, 'completed')
        addLog(`✓ Completed: ${steps[stepIndex - 1].name}`)
        
        if (stepIndex < steps.length) {
          updateStepStatus(stepIndex, 'in_progress')
          addLog(`Starting: ${steps[stepIndex].name}...`)
          setCurrentStepIndex(stepIndex)
        }
        
        resolve()
      }, 2000 + Math.random() * 1000) // 2-3 seconds per step
    })
  }

  const updateStepStatus = (index: number, status: GenerationStep['status']) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status } : step
    ))
  }

  const addLog = (message: string) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const getStatusIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStatusColor = (status: GenerationStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200 animate-pulse'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Building Your Application</h1>
          <p className="text-xl text-gray-300">
            We're generating a custom {businessProfile?.businessType || 'business'} platform just for you
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Progress Steps */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Code2 className="w-6 h-6 mr-2" />
              Generation Progress
            </h2>
            
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${getStatusColor(step.status)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900">{step.icon}</span>
                        <h3 className="font-medium text-gray-900">{step.name}</h3>
                      </div>
                      {step.description && (
                        <p className="text-sm text-gray-700 mt-1">{step.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Message */}
            {generationError && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
                <p className="text-red-200 text-sm">{generationError}</p>
              </div>
            )}
          </div>

          {/* Terminal Output */}
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Build Output</span>
              {isGenerating && (
                <div className="flex items-center space-x-2 ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-400">Building...</span>
                </div>
              )}
            </div>
            
            <div className="p-4 h-96 overflow-y-auto font-mono text-sm">
              {terminalLogs.map((log, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${
                    log.includes('Error') || log.includes('❌') 
                      ? 'text-red-400' 
                      : log.includes('✓') || log.includes('✅')
                      ? 'text-green-400'
                      : 'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))}
              {isGenerating && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <span>$</span>
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Being Built */}
        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">What we're building for you:</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <Database className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium">Custom Database</h4>
                <p className="text-sm text-gray-400">
                  {confirmedInsights?.technicalRequirements?.dataModels?.length || 0} data models
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium">Automated Workflows</h4>
                <p className="text-sm text-gray-400">
                  {confirmedInsights?.technicalRequirements?.workflowRequirements?.length || 0} workflows
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Code2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium">API Integrations</h4>
                <p className="text-sm text-gray-400">
                  {connectedProviders.length} connected services
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}