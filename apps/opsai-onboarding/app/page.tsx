'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Code, Rocket, Database, Globe, Zap, GitBranch, Play, ArrowRight, Search, BarChart3, Settings, Link2, Brain, ShieldCheck, Sparkles, Calculator, Clock, DollarSign, Users, Award, Building, Mail, Phone, MapPin } from 'lucide-react'
import SmartOnboarding from '../components/SmartOnboarding'
import AIInsightsReview from '../components/AIInsightsReview'
import AIThinkingBox from '../components/AIThinkingBox'
import CodeGenerationInterface from '../components/CodeGenerationInterface'
import { ExternalLink, Download } from 'lucide-react'

interface AppConfig {
  yamlConfig: string
  config: any
  appUrl: string
  businessProfile: any
  connectedIntegrations: Array<{ provider: string; accountName?: string }>
}

export default function HomePage() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [aiAnalysis, setAIAnalysis] = useState<any>(null)
  const [isGeneratingYAML, setIsGeneratingYAML] = useState(false)
  const [showCodeGeneration, setShowCodeGeneration] = useState(false)
  const [generatedYAML, setGeneratedYAML] = useState<string>('')
  const [roiData, setRoiData] = useState({
    employees: 10,
    appsUsed: 15,
    monthlySoftwareCost: 2000,
    hoursWastedWeekly: 20
  })

  const handleOnboardingComplete = (config: AppConfig) => {
    setAppConfig(config)
    setShowOnboarding(false)
  }

  const handleDiscoverSystems = async () => {
    if (!websiteUrl.trim()) {
      alert('Please enter your website URL first')
      return
    }
    
    try {
      setIsAnalyzing(true)
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websiteUrl, useAI: true }),
      })

      if (response.ok) {
        const analysis = await response.json()
        setAnalysisResult(analysis)
        
        // If AI analysis is available, show insights review
        if (analysis.aiAnalysis && analysis.analysisType === 'ai_powered') {
          setAIAnalysis(analysis.aiAnalysis)
          setShowAIInsights(true)
        } else {
          // Fallback to traditional onboarding
          setShowOnboarding(true)
        }
      } else {
        throw new Error('Analysis failed')
      }
    } catch (error) {
      console.error('System discovery error:', error)
      alert('Could not analyze website. Please try the manual chat interface.')
      setShowOnboarding(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleConfirmInsights = async (confirmedInsights: any) => {
    try {
      setIsGeneratingYAML(true)
      
      // Try AI generation first, fallback to simple if it fails
      let response = await fetch('/api/ai-generate-yaml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessAnalysis: aiAnalysis,
          confirmedInsights: confirmedInsights,
          businessProfile: {
            businessName: analysisResult?.businessType || 'Business',
            businessType: analysisResult?.businessType || 'General',
            industry: analysisResult?.industry || 'general',
            website: websiteUrl
          }
        }),
      })
      
      // If AI generation fails, use simple generation
      if (!response.ok) {
        console.log('AI YAML generation failed, using fallback...')
        response = await fetch('/api/ai-generate-yaml-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessAnalysis: aiAnalysis,
            confirmedInsights: confirmedInsights,
            businessProfile: {
              businessName: analysisResult?.businessType || 'Business',
              businessType: analysisResult?.businessType || 'General', 
              industry: analysisResult?.industry || 'general',
              website: websiteUrl
            }
          }),
        })
      }

      if (response.ok) {
        const yamlResult = await response.json()
        setGeneratedYAML(yamlResult.yaml)
        
        // Show code generation interface
        setShowCodeGeneration(true)
        setIsGeneratingYAML(false)
        
        // After showing generation interface, actually generate the app
        setTimeout(async () => {
          try {
            console.log('🚀 Starting actual app generation...')
            
            // Call the app generation endpoint
            const appGenerationResponse = await fetch('/api/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                yamlConfig: yamlResult.yaml,
                appName: confirmedInsights.businessIntelligence?.businessModel || analysisResult?.businessType || 'AI Generated Business'
              }),
            })
            
            if (appGenerationResponse.ok) {
              const appResult = await appGenerationResponse.json()
              console.log('✅ App generation completed:', appResult)
              
              const appConfigData: AppConfig = {
                yamlConfig: yamlResult.yaml,
                config: yamlResult.structured || yamlResult.config,
                appUrl: appResult.appUrl || `http://localhost:7250`,
                businessProfile: {
                  businessName: confirmedInsights.businessIntelligence?.businessModel || analysisResult?.businessType || 'AI Generated Business',
                  businessType: confirmedInsights.businessIntelligence?.industryCategory || 'General',
                  dataModels: confirmedInsights.technicalRequirements?.dataModels?.map((m: any) => m.name) || [],
                  website: websiteUrl
                },
                connectedIntegrations: confirmedInsights.technicalRequirements?.integrationOpportunities?.filter((i: any) => i.priority === 'critical').map((i: any) => ({
                  provider: i.service.toLowerCase().replace(/\s+/g, '-'),
                  accountName: i.service
                })) || []
              }
              
              setAppConfig(appConfigData)
              setShowAIInsights(false)
              setShowCodeGeneration(false)
            } else {
              throw new Error('App generation failed')
            }
          } catch (appError) {
            console.error('App generation error:', appError)
            alert('Failed to generate the actual application. Please try again.')
            setShowCodeGeneration(false)
          }
        }, 15000) // Show generation for 15 seconds
      } else {
        throw new Error('YAML generation failed')
      }
    } catch (error) {
      console.error('YAML generation error:', error)
      alert('Failed to generate application. Please try again.')
    } finally {
      setIsGeneratingYAML(false)
    }
  }

  const handleRejectInsights = () => {
    setShowAIInsights(false)
    setAIAnalysis(null)
    setShowOnboarding(true)
  }

  const calculateROI = () => {
    const monthlyWastedCost = (roiData.employees * roiData.hoursWastedWeekly * 25 * 4.33) // $25/hour average
    const monthlyErrorCost = roiData.appsUsed * 200 // Estimated error costs
    const monthlySavings = monthlyWastedCost + monthlyErrorCost + (roiData.monthlySoftwareCost * 0.6) // 60% consolidation
    const yearlySavings = monthlySavings * 12
    return { monthlySavings, yearlySavings, monthlyWastedCost }
  }

  const roi = calculateROI()

  const downloadConfig = () => {
    if (!appConfig) return
    
    const blob = new Blob([appConfig.yamlConfig], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${appConfig.businessProfile.businessName.toLowerCase().replace(/\s+/g, '-')}-config.yaml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Show code generation interface
  if (showCodeGeneration) {
    return (
      <CodeGenerationInterface
        isGenerating={true}
        yamlContent={generatedYAML}
        businessProfile={analysisResult}
        onComplete={() => {/* Will be handled by timeout */}}
      />
    )
  }

  // Show AI insights review
  if (showAIInsights && aiAnalysis) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <AIInsightsReview
          analysis={aiAnalysis}
          onConfirm={handleConfirmInsights}
          onReject={handleRejectInsights}
          loading={isGeneratingYAML}
        />
        {/* Show AI thinking box during YAML generation */}
        {isGeneratingYAML && (
          <AIThinkingBox
            stage="generating"
            websiteUrl={websiteUrl}
            currentStep="Generating YAML configuration..."
          />
        )}
      </div>
    )
  }

  // Show smart onboarding flow
  if (showOnboarding && !appConfig) {
    return <SmartOnboarding onComplete={handleOnboardingComplete} initialUrl={websiteUrl} />
  }

  // Show success page after app generation
  if (appConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-6">
                <span className="text-4xl">🚀</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Your App is Ready!
              </h1>
              <p className="text-xl text-gray-600">
                {appConfig.businessProfile.businessName} app has been generated and deployed
              </p>
            </div>

            {/* App URL Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Live Application</h2>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-600 mb-2">Your app is live at:</div>
                  <a 
                    href={appConfig.appUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-mono text-lg break-all"
                  >
                    {appConfig.appUrl}
                  </a>
                </div>
                <a
                  href={appConfig.appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium text-lg"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Open Your App
                </a>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              
              {/* Business Profile */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Business Profile</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-900">{appConfig.businessProfile.businessName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 text-gray-900">{appConfig.businessProfile.businessType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Models:</span>
                    <span className="ml-2 text-gray-900">{appConfig.businessProfile.dataModels.join(', ')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Workflows:</span>
                    <span className="ml-2 text-gray-900">{appConfig.config.workflows?.length || 0} automated</span>
                  </div>
                </div>
              </div>

              {/* Connected Integrations */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Connected Integrations</h3>
                {appConfig.connectedIntegrations.length > 0 ? (
                  <div className="space-y-3">
                    {appConfig.connectedIntegrations.map((integration, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {integration.provider.replace('-', ' ')}
                          </div>
                          {integration.accountName && (
                            <div className="text-sm text-gray-500">{integration.accountName}</div>
                          )}
                        </div>
                        <div className="text-green-600 text-sm font-medium">Connected</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    No integrations connected yet
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Next Steps</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={downloadConfig}
                  className="flex items-center justify-center px-6 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Download Config</div>
                    <div className="text-sm text-gray-500">YAML configuration file</div>
                  </div>
                </button>
                
                <a
                  href={appConfig.appUrl + '/admin'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-6 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Admin Panel</div>
                    <div className="text-sm text-gray-500">Manage your app</div>
                  </div>
                </a>
                
                <button
                  onClick={() => setAppConfig(null)}
                  className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="text-xl mr-2">🚀</span>
                  <div className="text-left">
                    <div className="font-medium">Create Another</div>
                    <div className="text-sm text-blue-100">Build more apps</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-gray-500 text-sm">
              Generated by <strong>OpsAI Core</strong> • Powered by AI and automation
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Marketing homepage
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-black to-gray-800 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">OPSAI</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 cursor-pointer" onClick={(e) => {e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({behavior: 'smooth'})}}>How it works</a>
            <a href="#roi-calculator" className="text-gray-600 hover:text-gray-900 cursor-pointer" onClick={(e) => {e.preventDefault(); document.getElementById('roi-calculator')?.scrollIntoView({behavior: 'smooth'})}}>ROI Calculator</a>
            <a href="#case-studies" className="text-gray-600 hover:text-gray-900 cursor-pointer" onClick={(e) => {e.preventDefault(); document.getElementById('case-studies')?.scrollIntoView({behavior: 'smooth'})}}>Case Studies</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <button 
              onClick={handleDiscoverSystems}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-20 pb-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-medium mb-6">
                <Brain className="w-4 h-4 mr-2" />
                Next-Gen AI Business Analysis
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Stop Juggling
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  100 Different Systems
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Just enter your website URL. Our advanced AI analyzes your business model, identifies your software stack, 
                and generates a custom unified platform with real integrations and workflows.
              </p>
            </div>

            {/* Website Input */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-lg">
                <div className="flex items-center">
                  <div className="flex-1 flex items-center px-4 py-3">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                      type="url"
                      placeholder="Enter your website URL (e.g., yourcompany.com)"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="flex-1 text-lg outline-none placeholder-gray-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleDiscoverSystems()}
                    />
                  </div>
              <button
                    onClick={handleDiscoverSystems}
                    disabled={isAnalyzing}
                    className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        AI Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5 mr-2" />
                        AI Analysis
                      </>
                    )}
              </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                🤖 Advanced AI will analyze your business model, identify integrations, and generate custom workflows
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="text-center text-gray-500">
              <p className="mb-4">Trusted by 1,000+ businesses to consolidate their operations</p>
              <div className="flex justify-center items-center space-x-8 text-sm">
                <div className="flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Enterprise Security
                </div>
                <div className="flex items-center">
                  <Link2 className="w-4 h-4 mr-1" />
                  500+ Integrations
                </div>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-1" />
                  5-minute Setup
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See The Transformation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Watch how we turn your chaotic desktop into one powerful command center
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Before - Chaos */}
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-red-800 mb-2">Before: System Chaos</h3>
                  <p className="text-red-600">Your current nightmare</p>
                </div>
                <div className="space-y-3">
                  {[
                    'QuickBooks (Accounting)',
                    'Shopify (E-commerce)',
                    'Square (POS)',
                    'Mailchimp (Email)',
                    'Slack (Team Chat)', 
                    'Google Analytics',
                    'Facebook Ads',
                    'Excel Spreadsheets',
                    'Stripe Dashboard',
                    'Inventory System',
                    '+ 8 more apps...'
                  ].map((app, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-red-200 text-sm text-gray-700 flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      {app}
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-red-100 rounded-lg">
                  <div className="text-red-800 font-semibold">Daily Reality:</div>
                  <div className="text-red-700 text-sm mt-1">
                    • 47 browser tabs open<br/>
                    • 3 hours switching between apps<br/>
                    • Data doesn't match anywhere<br/>
                    • Can't see the big picture
                  </div>
                </div>
              </div>

              {/* After - Unity */}
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-green-800 mb-2">After: OPSAI Unity</h3>
                  <p className="text-green-600">One dashboard to rule them all</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-green-200">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-100 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-800">$127K</div>
                      <div className="text-sm text-green-600">Monthly Revenue</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-800">847</div>
                      <div className="text-sm text-green-600">Orders Today</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-800">94%</div>
                      <div className="text-sm text-green-600">Inventory Sync</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-800">12</div>
                      <div className="text-sm text-green-600">Alerts Active</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      All systems connected & synced
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Real-time data from everywhere
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Smart actions & automations
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-100 rounded-lg">
                  <div className="text-green-800 font-semibold">New Reality:</div>
                  <div className="text-green-700 text-sm mt-1">
                    • One dashboard, one login<br/>
                    • Save 15+ hours per week<br/>
                    • Perfect data accuracy<br/>
                    • Make smarter decisions faster
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Calculator */}
      <div id="roi-calculator" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Calculate Your Savings
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See exactly how much system chaos is costing your business
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calculator Inputs */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Business Info</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Employees
                    </label>
                    <input
                      type="number"
                      value={roiData.employees}
                      onChange={(e) => setRoiData({...roiData, employees: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Software Tools Used
                    </label>
                    <input
                      type="number"
                      value={roiData.appsUsed}
                      onChange={(e) => setRoiData({...roiData, appsUsed: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Software Costs ($)
                    </label>
                    <input
                      type="number"
                      value={roiData.monthlySoftwareCost}
                      onChange={(e) => setRoiData({...roiData, monthlySoftwareCost: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="2000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hours Wasted Weekly (switching apps, manual work)
                    </label>
                    <input
                      type="number"
                      value={roiData.hoursWastedWeekly}
                      onChange={(e) => setRoiData({...roiData, hoursWastedWeekly: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="20"
                    />
                  </div>
                </div>
              </div>

              {/* ROI Results */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <Calculator className="w-6 h-6 mr-2" />
                  Your Potential Savings
                </h3>
                <div className="space-y-6">
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-3xl font-bold">${roi.yearlySavings.toLocaleString()}</div>
                    <div className="text-green-100">Saved Per Year</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-2xl font-bold">${roi.monthlySavings.toLocaleString()}</div>
                    <div className="text-green-100">Saved Per Month</div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Wasted time costs:</span>
                      <span className="font-semibold">${roi.monthlyWastedCost.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Software consolidation:</span>
                      <span className="font-semibold">${(roiData.monthlySoftwareCost * 0.6).toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Error reduction:</span>
                      <span className="font-semibold">${(roiData.appsUsed * 200).toLocaleString()}/mo</span>
                    </div>
                  </div>
                  <button
                    onClick={handleDiscoverSystems}
                    className="w-full bg-white text-green-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Start Saving Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              From Chaos to Control in 3 Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              No technical knowledge required. Our AI does the heavy lifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">1. AI Discovery</h3>
              <p className="text-gray-600 leading-relaxed">
                Just enter your website. Our AI scans and identifies all the software, tools, and systems your business currently uses.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Link2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">2. Smart Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                We automatically connect all your systems - CRM, accounting, inventory, marketing tools - into one unified platform.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">3. Intelligent Control</h3>
              <p className="text-gray-600 leading-relaxed">
                Get a custom dashboard that doesn't just show data - it helps you make decisions and automate actions across all systems.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Unify Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join 1,000+ businesses who've eliminated system chaos and boosted productivity by 40%
          </p>
          
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white/10 border border-gray-700 rounded-2xl p-2">
              <div className="flex items-center">
                <div className="flex-1 flex items-center px-4 py-3">
                  <Globe className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="url"
                    placeholder="Enter your website URL to get started"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="flex-1 text-lg outline-none bg-transparent text-white placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleDiscoverSystems()}
                  />
                </div>
            <button
                  onClick={handleDiscoverSystems}
                  className="bg-white text-black px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Start Discovery
            </button>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Free analysis • No credit card required • 5-minute setup
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}