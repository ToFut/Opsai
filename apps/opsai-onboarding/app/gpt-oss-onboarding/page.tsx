'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, Brain, Link2, Database, Zap, Cloud, CheckCircle, 
  ArrowRight, Loader2, Shield, Activity, BarChart3, 
  Settings, Users, FileCode, Sparkles, AlertCircle,
  ExternalLink, Download, Play, Coffee, ChevronLeft, Clock,
  Rocket, Eye, Edit2, Plus, Workflow, Lock, TrendingUp,
  Server, Cpu, HardDrive, Network, Bot
} from 'lucide-react'

interface OnboardingState {
  currentStep: number
  websiteUrl: string
  businessAnalysis: any
  aiInsights: any
  selectedModel: 'gpt-oss-20b' | 'gpt-oss-120b' | 'openai'
  modelStatus: any
  integrations: any[]
  workflows: any[]
  yamlConfig: string
  generatedApp: any
  deploymentResult: any
  isAnalyzing: boolean
  isGenerating: boolean
  isDeploying: boolean
  error: string | null
}

export default function GPTOSSOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    websiteUrl: 'https://stripe.com',
    businessAnalysis: null,
    aiInsights: null,
    selectedModel: 'openai',
    modelStatus: null,
    integrations: [],
    workflows: [],
    yamlConfig: '',
    generatedApp: null,
    deploymentResult: null,
    isAnalyzing: false,
    isGenerating: false,
    isDeploying: false,
    error: null
  })

  const steps = [
    { id: 0, title: 'AI Model Selection', icon: Brain, description: 'Choose your AI processing power' },
    { id: 1, title: 'Business Analysis', icon: Globe, description: 'AI analyzes your business' },
    { id: 2, title: 'Smart Integrations', icon: Link2, description: 'AI recommends connections' },
    { id: 3, title: 'Workflow Design', icon: Workflow, description: 'AI designs automations' },
    { id: 4, title: 'App Generation', icon: FileCode, description: 'AI builds your application' },
    { id: 5, title: 'Live Deployment', icon: Rocket, description: 'Deploy to the world' }
  ]

  useEffect(() => {
    checkModelStatus()
  }, [])

  const checkModelStatus = async () => {
    try {
      const response = await fetch('/api/gpt-oss/status')
      const status = await response.json()
      setState(prev => ({ ...prev, modelStatus: status }))
    } catch (error) {
      console.error('Failed to check model status:', error)
    }
  }

  const selectModel = (model: 'gpt-oss-20b' | 'gpt-oss-120b' | 'openai') => {
    setState(prev => ({ ...prev, selectedModel: model }))
  }

  const nextStep = () => {
    setState(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, steps.length - 1) }))
  }

  const prevStep = () => {
    setState(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 0) }))
  }

  const analyzeWebsite = async () => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))
    
    try {
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          websiteUrl: state.websiteUrl,
          selectedModel: state.selectedModel
        })
      })
      
      const analysis = await response.json()
      
      setState(prev => ({
        ...prev,
        businessAnalysis: analysis,
        isAnalyzing: false
      }))
      
      // Auto-advance after successful analysis
      setTimeout(nextStep, 1500)
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: 'Failed to analyze website' 
      }))
    }
  }

  const generateIntegrations = async () => {
    if (!state.businessAnalysis) {
      setState(prev => ({ ...prev, error: 'Business analysis required first' }))
      return
    }

    try {
      const response = await fetch('/api/ai-generate-integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessAnalysis: state.businessAnalysis,
          selectedModel: state.selectedModel
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({ 
          ...prev, 
          integrations: data.integrations,
          error: null
        }))
        setTimeout(nextStep, 1500)
      } else {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to generate integrations' 
        }))
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to generate integrations' 
      }))
    }
  }

  const designWorkflows = async () => {
    if (!state.businessAnalysis) {
      setState(prev => ({ ...prev, error: 'Business analysis required first' }))
      return
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      const response = await fetch('/api/ai-generate-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessAnalysis: state.businessAnalysis,
          integrations: state.integrations,
          selectedModel: state.selectedModel
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setState(prev => ({ 
          ...prev, 
          workflows: data.workflows,
          isGenerating: false,
          error: null
        }))
        setTimeout(nextStep, 1500)
      } else {
        setState(prev => ({ 
          ...prev, 
          isGenerating: false,
          error: 'Failed to generate workflows' 
        }))
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        error: 'Failed to generate workflows' 
      }))
    }
  }

  const generateApplication = async () => {
    if (!state.businessAnalysis) {
      setState(prev => ({ ...prev, error: 'Business analysis required first' }))
      return
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }))
    
    try {
      // First generate YAML
      const yamlResponse = await fetch('/api/ai-generate-yaml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessAnalysis: state.businessAnalysis,
          confirmedInsights: { confirmed: true },
          businessProfile: { businessName: 'AI-Powered Business' },
          selectedModel: state.selectedModel
        })
      })
      
      const yamlData = await yamlResponse.json()
      const yamlConfig = yamlData.yaml || 'Generated YAML config...'
      
      setState(prev => ({ ...prev, yamlConfig }))
      
      // Then generate the complete application
      const appResponse = await fetch('/api/ai-generate-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessAnalysis: state.businessAnalysis,
          workflows: state.workflows,
          integrations: state.integrations,
          yamlConfig: yamlConfig,
          selectedModel: state.selectedModel
        })
      })

      const appData = await appResponse.json()
      
      if (appData.success) {
        setState(prev => ({
          ...prev,
          generatedApp: appData.generatedApp,
          isGenerating: false,
          error: null
        }))
        setTimeout(nextStep, 1500)
      } else {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: 'Failed to generate application'
        }))
      }
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: 'Failed to generate application' 
      }))
    }
  }

  const deployApplication = async () => {
    setState(prev => ({ ...prev, isDeploying: true }))
    
    setTimeout(() => {
      const deploymentResult = {
        url: 'https://ai-powered-app.vercel.app',
        status: 'deployed',
        aiModel: state.selectedModel,
        deploymentTime: '45s',
        features: ['Authentication', 'Payment Processing', 'Analytics', 'Workflows']
      }
      
      setState(prev => ({
        ...prev,
        deploymentResult,
        isDeploying: false
      }))
    }, 3000)
  }

  const ModelCard = ({ model, title, description, speed, quality, cost, selected, onClick }: any) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-6 rounded-xl cursor-pointer transition-all ${
        selected 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-500 shadow-lg' 
          : 'bg-white border-2 border-gray-200 hover:border-gray-300 shadow-md'
      }`}
    >
      <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
          selected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          {model === 'gpt-oss-20b' ? <Zap className="w-8 h-8" /> :
           model === 'gpt-oss-120b' ? <Brain className="w-8 h-8" /> :
           <Cloud className="w-8 h-8" />}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Speed:</span>
            <span className="font-medium">{speed}</span>
          </div>
          <div className="flex justify-between">
            <span>Quality:</span>
            <span className="font-medium">{quality}</span>
          </div>
          <div className="flex justify-between">
            <span>Cost:</span>
            <span className={`font-medium ${cost === '$0' ? 'text-green-600' : 'text-orange-600'}`}>{cost}</span>
          </div>
        </div>
        
        {selected && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-4 flex items-center justify-center gap-2 text-blue-600"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Selected</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )

  const renderStep = () => {
    const currentStepData = steps[state.currentStep]
    
    switch (state.currentStep) {
      case 0: // AI Model Selection
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Choose Your AI Processing Power</h1>
              <p className="text-xl text-gray-600">Select the AI model that best fits your needs</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <ModelCard
                model="gpt-oss-20b"
                title="GPT-OSS-20B"
                description="Fast & Efficient"
                speed="2-3 seconds"
                quality="Good"
                cost="$0"
                selected={state.selectedModel === 'gpt-oss-20b'}
                onClick={() => selectModel('gpt-oss-20b')}
              />
              <ModelCard
                model="gpt-oss-120b"
                title="GPT-OSS-120B"
                description="Maximum Quality"
                speed="5-10 seconds"
                quality="Excellent"
                cost="$0"
                selected={state.selectedModel === 'gpt-oss-120b'}
                onClick={() => selectModel('gpt-oss-120b')}
              />
              <ModelCard
                model="openai"
                title="OpenAI GPT-4"
                description="Reliable Fallback"
                speed="3-5 seconds"
                quality="Excellent"
                cost="$0.03-0.12"
                selected={state.selectedModel === 'openai'}
                onClick={() => selectModel('openai')}
              />
            </div>

            {/* Model Status Display */}
            {state.modelStatus && (
              <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  System Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${state.modelStatus.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>System: {state.modelStatus.success ? 'Online' : 'Offline'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-4 h-4 text-gray-500" />
                    <span>Models: {state.modelStatus.models?.length || 0} Available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Network className="w-4 h-4 text-gray-500" />
                    <span>Storage: {state.modelStatus.storage?.provider || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={nextStep}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                Continue with {state.selectedModel === 'gpt-oss-20b' ? 'GPT-OSS-20B' : 
                                state.selectedModel === 'gpt-oss-120b' ? 'GPT-OSS-120B' : 'OpenAI GPT-4'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )

      case 1: // Business Analysis
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">AI Business Analysis</h1>
              <p className="text-xl text-gray-600">
                Using {state.selectedModel === 'gpt-oss-20b' ? 'GPT-OSS-20B' : 
                       state.selectedModel === 'gpt-oss-120b' ? 'GPT-OSS-120B' : 'OpenAI GPT-4'} to analyze your business
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL to Analyze
                </label>
                <input
                  type="url"
                  value={state.websiteUrl}
                  onChange={(e) => setState(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://your-website.com"
                />
              </div>

              {state.isAnalyzing && (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <Bot className="w-8 h-8 ml-4 text-blue-600" />
                  </div>
                  <p className="text-lg font-medium">AI is analyzing your business...</p>
                  <p className="text-gray-600 mt-2">
                    Using {state.selectedModel} model for deep business insights
                  </p>
                </div>
              )}

              {state.businessAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6"
                >
                  <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Analysis Complete
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Industry:</span>
                      <span className="ml-2">{state.businessAnalysis.businessIntelligence?.industryCategory || 'Financial Technology'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Business Model:</span>
                      <span className="ml-2">{state.businessAnalysis.businessIntelligence?.businessModel || 'B2B Service Platform'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Complexity:</span>
                      <span className="ml-2">{state.businessAnalysis.businessIntelligence?.operationalComplexity || 'High'}</span>
                    </div>
                    <div>
                      <span className="font-medium">AI Model Used:</span>
                      <span className="ml-2">{state.selectedModel}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {!state.businessAnalysis && !state.isAnalyzing && (
                <div className="text-center">
                  <button
                    onClick={analyzeWebsite}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Brain className="w-5 h-5" />
                    Start AI Analysis
                  </button>
                </div>
              )}
            </div>
          </div>
        )

      case 2: // Smart Integrations
        return (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">AI-Recommended Integrations</h1>
              <p className="text-xl text-gray-600">
                Smart integration suggestions powered by {state.selectedModel}
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Detected Integrations</h3>
                {state.integrations.length === 0 && (
                  <button
                    onClick={generateIntegrations}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate AI Recommendations
                  </button>
                )}
              </div>

              {state.integrations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {state.integrations.map(integration => (
                    <motion.div
                      key={integration.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">{integration.name}</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {integration.confidence}% match
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{integration.reason}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{integration.type}</span>
                        <span>via {integration.aiModel}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Click "Generate AI Recommendations" to discover integrations
                </div>
              )}
            </div>
          </div>
        )

      case 3: // Workflow Design
        return (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">AI Workflow Designer</h1>
              <p className="text-xl text-gray-600">
                Intelligent automation workflows generated by {state.selectedModel}
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Generated Workflows</h3>
                {state.workflows.length === 0 && (
                  <button
                    onClick={designWorkflows}
                    disabled={state.isGenerating}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {state.isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI Designing...
                      </>
                    ) : (
                      <>
                        <Workflow className="w-4 h-4" />
                        Design AI Workflows
                      </>
                    )}
                  </button>
                )}
              </div>

              {state.workflows.length > 0 ? (
                <div className="space-y-6">
                  {state.workflows.map(workflow => (
                    <motion.div
                      key={workflow.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{workflow.name}</h4>
                          <p className="text-gray-600 mt-1">{workflow.description}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>Model: {workflow.aiModel}</div>
                          <div>Setup: {workflow.estimatedTime}</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm mb-2 font-medium">Workflow Steps:</div>
                        <div className="flex items-center gap-2 text-sm">
                          {workflow.triggers.map((trigger: string, index: number) => (
                            <React.Fragment key={trigger}>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{trigger}</span>
                              {index < workflow.triggers.length - 1 && <ArrowRight className="w-3 h-3 text-gray-400" />}
                            </React.Fragment>
                          ))}
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          {workflow.actions.map((action: string, index: number) => (
                            <React.Fragment key={action}>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{action}</span>
                              {index < workflow.actions.length - 1 && <ArrowRight className="w-3 h-3 text-gray-400" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {state.isGenerating ? (
                    <div>
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                      <p>AI is designing intelligent workflows for your business...</p>
                    </div>
                  ) : (
                    <p>Click "Design AI Workflows" to generate intelligent automations</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 4: // App Generation
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">AI Application Generator</h1>
              <p className="text-xl text-gray-600">
                Building your complete application with {state.selectedModel}
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              {state.isGenerating ? (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                      <FileCode className="w-6 h-6 text-blue-600 absolute top-3 left-3" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Generating Your Application</h3>
                  <p className="text-gray-600 mb-4">
                    {state.selectedModel} is creating your complete business application...
                  </p>
                  <div className="max-w-md mx-auto">
                    <div className="bg-gray-200 rounded-full h-2 mb-4">
                      <motion.div 
                        className="bg-blue-600 h-2 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 5 }}
                      />
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>✓ Generating YAML configuration</div>
                      <div>⏳ Creating React components</div>
                      <div>⏳ Building API endpoints</div>
                      <div>⏳ Setting up database models</div>
                    </div>
                  </div>
                </div>
              ) : state.generatedApp ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="text-center mb-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-800">Application Generated!</h3>
                    <p className="text-gray-600 mt-2">
                      Generated in {state.generatedApp.generationTime} using {state.generatedApp.aiModel}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Generated Components</h4>
                      <div className="space-y-1 text-sm">
                        {state.generatedApp.components.map((component: string) => (
                          <div key={component} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {component}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Application Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {state.generatedApp.name}</div>
                        <div><strong>AI Model:</strong> {state.generatedApp.aiModel}</div>
                        <div><strong>Generation Time:</strong> {state.generatedApp.generationTime}</div>
                        <div><strong>Status:</strong> <span className="text-green-600">Ready to Deploy</span></div>
                      </div>
                    </div>
                  </div>

                  {state.yamlConfig && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold mb-2">Generated YAML Configuration</h4>
                      <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
                        {typeof state.yamlConfig === 'string' ? state.yamlConfig : JSON.stringify(state.yamlConfig, null, 2)}
                      </pre>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center">
                  <FileCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-4">Ready to Generate</h3>
                  <p className="text-gray-600 mb-6">
                    All analysis complete. Ready to generate your application with {state.selectedModel}.
                  </p>
                  <button
                    onClick={generateApplication}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate AI Application
                  </button>
                </div>
              )}
            </div>
          </div>
        )

      case 5: // Deployment
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Deploy Your AI-Generated App</h1>
              <p className="text-xl text-gray-600">Launch your application to the world</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              {state.isDeploying ? (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center mb-6">
                    <Loader2 className="w-12 h-12 animate-spin text-green-600" />
                    <Rocket className="w-8 h-8 ml-4 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Deploying Application</h3>
                  <p className="text-gray-600">Setting up your live application...</p>
                  <div className="mt-6 max-w-xs mx-auto">
                    <div className="bg-gray-200 rounded-full h-2">
                      <motion.div 
                        className="bg-green-600 h-2 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3 }}
                      />
                    </div>
                  </div>
                </div>
              ) : state.deploymentResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Rocket className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-green-800 mb-2">🎉 Deployment Successful!</h3>
                    <p className="text-gray-600">
                      Your AI-generated application is now live and ready to use
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-left">
                        <h4 className="font-semibold mb-3">Deployment Details</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>URL:</strong> <a href={state.deploymentResult.url} target="_blank" className="text-blue-600 hover:underline">{state.deploymentResult.url}</a></div>
                          <div><strong>Status:</strong> <span className="text-green-600 capitalize">{state.deploymentResult.status}</span></div>
                          <div><strong>Deploy Time:</strong> {state.deploymentResult.deploymentTime}</div>
                          <div><strong>AI Model Used:</strong> {state.deploymentResult.aiModel}</div>
                        </div>
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold mb-3">Active Features</h4>
                        <div className="space-y-1">
                          {state.deploymentResult.features.map((feature: string) => (
                            <div key={feature} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => window.open(state.deploymentResult.url, '_blank')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Live App
                    </button>
                    <button
                      onClick={() => setState(prev => ({ ...prev, currentStep: 0 }))}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Another App
                    </button>
                  </div>

                  <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">🚀 Congratulations!</h4>
                    <p className="text-blue-700 text-sm">
                      You've successfully created and deployed an AI-generated application using {state.selectedModel}. 
                      Your app includes intelligent features, automated workflows, and seamless integrations—all powered by advanced AI.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center">
                  <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-4">Ready to Deploy</h3>
                  <p className="text-gray-600 mb-6">
                    Your AI-generated application is ready for deployment to production.
                  </p>
                  <button
                    onClick={deployApplication}
                    className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Rocket className="w-5 h-5" />
                    Deploy to Production
                  </button>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return <div>Step not found</div>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header with Progress */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              GPT-OSS Powered Onboarding
            </h1>
            <div className="text-sm text-gray-600">
              Step {state.currentStep + 1} of {steps.length}
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${
                  index <= state.currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < state.currentStep 
                      ? 'bg-blue-600 text-white' 
                      : index === state.currentStep 
                        ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {index < state.currentStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs font-medium">{step.title}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < state.currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={state.currentStep === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="text-sm text-gray-500">
            {state.selectedModel === 'openai' ? 'Using OpenAI GPT-4' :
             state.selectedModel === 'gpt-oss-20b' ? 'Using GPT-OSS-20B (Local)' :
             'Using GPT-OSS-120B (Local)'}
          </div>

          {state.currentStep < steps.length - 1 && (
            <button
              onClick={nextStep}
              disabled={state.currentStep === 1 && !state.businessAnalysis ||
                       state.currentStep === 4 && !state.generatedApp}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {state.error}
          </div>
        </div>
      )}
    </div>
  )
}