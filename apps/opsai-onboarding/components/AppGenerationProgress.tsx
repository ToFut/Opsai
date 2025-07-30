'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Clock, Loader2, ExternalLink, Download, Code, Database, Globe, Palette } from 'lucide-react'

interface AppGenerationProgressProps {
  yamlConfig: string
  appName: string
  onComplete: (appUrl: string) => void
  onBack: () => void
}

interface GenerationStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  duration?: number
}

export default function AppGenerationProgress({ yamlConfig, appName, onComplete, onBack }: AppGenerationProgressProps) {
  const [steps, setSteps] = useState<GenerationStep[]>([
    {
      id: 'parse_config',
      title: 'Parsing Configuration',
      description: 'Reading YAML and validating structure',
      icon: Code,
      status: 'pending'
    },
    {
      id: 'generate_database',
      title: 'Creating Database Schema',
      description: 'Generating tables, relationships, and migrations',
      icon: Database,
      status: 'pending'
    },
    {
      id: 'setup_apis',
      title: 'Setting Up API Endpoints',
      description: 'Creating REST API routes and authentication',
      icon: Globe,
      status: 'pending'
    },
    {
      id: 'generate_ui',
      title: 'Building User Interface',
      description: 'Generating React components and pages',
      icon: Palette,
      status: 'pending'
    },
    {
      id: 'deploy_app',
      title: 'Deploying Application',
      description: 'Building and deploying to production',
      icon: ExternalLink,
      status: 'pending'
    }
  ])

  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [generatedAppUrl, setGeneratedAppUrl] = useState<string | null>(null)
  const [generationLog, setGenerationLog] = useState<string[]>([])

  useEffect(() => {
    startGeneration()
  }, [])

  const startGeneration = async () => {
    const stepDurations = [2000, 4000, 3000, 5000, 3000] // Simulated durations

    for (let i = 0; i < steps.length; i++) {
      // Mark current step as in progress
      setCurrentStepIndex(i)
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === i ? 'in_progress' : index < i ? 'completed' : 'pending'
      })))

      // Add log entry
      setGenerationLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Starting: ${steps[i].title}`])

      // Simulate generation with actual CLI integration
      await simulateStepGeneration(steps[i], stepDurations[i])

      // Mark step as completed
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index <= i ? 'completed' : 'pending'
      })))

      setGenerationLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Completed: ${steps[i].title}`])
    }

    // Generation complete
    const appUrl = generateAppUrl(appName)
    setGeneratedAppUrl(appUrl)
    setGenerationLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🚀 App deployed successfully!`])
    onComplete(appUrl)
  }

  const simulateStepGeneration = async (step: GenerationStep, duration: number) => {
    // This would integrate with the actual OPSAI Core CLI
    // For now, simulate the generation process
    
    switch (step.id) {
      case 'parse_config':
        // Parse YAML config
        setGenerationLog(prev => [...prev, '  - Validating YAML syntax...'])
        await new Promise(resolve => setTimeout(resolve, duration / 3))
        setGenerationLog(prev => [...prev, '  - Extracting entities and relationships...'])
        await new Promise(resolve => setTimeout(resolve, duration / 3))
        setGenerationLog(prev => [...prev, '  - Configuration validated successfully'])
        await new Promise(resolve => setTimeout(resolve, duration / 3))
        break

      case 'generate_database':
        setGenerationLog(prev => [...prev, '  - Creating Prisma schema...'])
        await new Promise(resolve => setTimeout(resolve, duration / 4))
        setGenerationLog(prev => [...prev, '  - Generating migration files...'])
        await new Promise(resolve => setTimeout(resolve, duration / 4))
        setGenerationLog(prev => [...prev, '  - Setting up PostgreSQL database...'])
        await new Promise(resolve => setTimeout(resolve, duration / 4))
        setGenerationLog(prev => [...prev, '  - Running database migrations...'])
        await new Promise(resolve => setTimeout(resolve, duration / 4))
        break

      case 'setup_apis':
        setGenerationLog(prev => [...prev, '  - Generating REST API routes...'])
        await new Promise(resolve => setTimeout(resolve, duration / 3))
        setGenerationLog(prev => [...prev, '  - Setting up authentication middleware...'])
        await new Promise(resolve => setTimeout(resolve, duration / 3))
        setGenerationLog(prev => [...prev, '  - Configuring API integrations...'])
        await new Promise(resolve => setTimeout(resolve, duration / 3))
        break

      case 'generate_ui':
        setGenerationLog(prev => [...prev, '  - Creating React components...'])
        await new Promise(resolve => setTimeout(resolve, duration / 5))
        setGenerationLog(prev => [...prev, '  - Generating CRUD pages...'])
        await new Promise(resolve => setTimeout(resolve, duration / 5))
        setGenerationLog(prev => [...prev, '  - Setting up routing and navigation...'])
        await new Promise(resolve => setTimeout(resolve, duration / 5))
        setGenerationLog(prev => [...prev, '  - Applying theme and styling...'])
        await new Promise(resolve => setTimeout(resolve, duration / 5))
        setGenerationLog(prev => [...prev, '  - Building production bundle...'])
        await new Promise(resolve => setTimeout(resolve, duration / 5))
        break

      case 'deploy_app':
        setGenerationLog(prev => [...prev, '  - Deploying to Vercel...'])
        await new Promise(resolve => setTimeout(resolve, duration / 3))
        setGenerationLog(prev => [...prev, '  - Setting up environment variables...'])
        await new Promise(resolve => setTimeout(resolve, duration / 3))
        setGenerationLog(prev => [...prev, '  - Configuring custom domain...'])
        await new Promise(resolve => setTimeout(resolve, duration / 3))
        break

      default:
        await new Promise(resolve => setTimeout(resolve, duration))
    }
  }

  const generateAppUrl = (name: string): string => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    return `https://${slug}-${Math.random().toString(36).substr(2, 8)}.vercel.app`
  }

  const downloadSourceCode = () => {
    // Create a mock source code download
    const sourceCode = `
// Generated by OPSAI Core
// ${appName} - Full Stack SaaS Application

// Package.json
{
  "name": "${appName.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0"
  }
}

// Generated based on your YAML configuration:
${yamlConfig}
    `.trim()

    const blob = new Blob([sourceCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}-source.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Generating Your SaaS Application</h1>
              <p className="text-gray-600">{appName}</p>
            </div>
            {generatedAppUrl && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={downloadSourceCode}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Source
                </button>
                <a
                  href={generatedAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live App
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Progress Steps */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Generation Progress</h2>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                return (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                      step.status === 'in_progress' ? 'bg-blue-50 border border-blue-200' :
                      step.status === 'completed' ? 'bg-green-50 border border-green-200' :
                      'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.status === 'in_progress' ? 'bg-blue-600 text-white' :
                      step.status === 'completed' ? 'bg-green-600 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {step.status === 'in_progress' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : step.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        step.status === 'completed' ? 'text-green-900' :
                        step.status === 'in_progress' ? 'text-blue-900' :
                        'text-gray-700'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-sm ${
                        step.status === 'completed' ? 'text-green-600' :
                        step.status === 'in_progress' ? 'text-blue-600' :
                        'text-gray-500'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                    <StepIcon className={`w-5 h-5 ${
                      step.status === 'completed' ? 'text-green-600' :
                      step.status === 'in_progress' ? 'text-blue-600' :
                      'text-gray-400'
                    }`} />
                  </div>
                )
              })}
            </div>

            {generatedAppUrl && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Application Generated Successfully!</h3>
                </div>
                <p className="text-green-700 text-sm mb-3">
                  Your SaaS application is live and ready to use.
                </p>
                <div className="flex items-center space-x-3">
                  <a
                    href={generatedAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {generatedAppUrl}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Generation Log */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generation Log</h2>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
              {generationLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
              {currentStepIndex >= 0 && currentStepIndex < steps.length && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            ← Back to Builder
          </button>
        </div>
      </div>
    </div>
  )
}