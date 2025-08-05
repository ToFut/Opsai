'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, Brain, CheckCircle, AlertCircle, Plus, FileText, 
  Sparkles, Shield, Palette, Rocket, ArrowLeft, ArrowRight,
  Link2, Workflow, Lock, BarChart3, Settings, Eye, Edit2,
  Zap, TrendingUp, Users, Clock, Star, ChevronRight, ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import GoogleAnalyticsPropertySelector from './GoogleAnalyticsPropertySelector'

interface Integration {
  id: string
  name: string
  type: string
  logo?: string
  status: 'detected' | 'suggested' | 'optional'
  connectionStatus: 'not_connected' | 'connecting' | 'connected' | 'error'
  confidence?: number
  value: string
  estimatedTime: string
  required: boolean
}

interface Workflow {
  id: string
  name: string
  description: string
  enabled: boolean
  editable: boolean
  triggers: string[]
  actions: string[]
  category: 'ai_generated' | 'user_added' | 'template'
}

interface AuthMethod {
  type: 'email' | 'google' | 'github' | 'saml'
  enabled: boolean
  configured: boolean
  label: string
  description: string
  icon: string
}

interface DashboardWidget {
  id: string
  name: string
  description: string
  enabled: boolean
  category: string
}

interface OnboardingState {
  websiteUrl: string
  businessAnalysis: any
  integrations: Integration[]
  workflows: Workflow[]
  authConfig: {
    methods: AuthMethod[]
    features: {
      twoFactor: boolean
      passwordReset: boolean
      emailVerification: boolean
      roleBasedAccess: boolean
    }
  }
  visualizationConfig: {
    theme: 'light' | 'dark'
    primaryColor: string
    logo?: string
    dashboardWidgets: DashboardWidget[]
  }
  currentStep: number
  isAnalyzing: boolean
  isDeploying: boolean
  isSaving: boolean
  deploymentResult: any
  tenantId?: string
}

const STEPS = [
  { id: 'analysis', label: 'AI Analysis', icon: Brain, description: 'Analyze your business' },
  { id: 'integrations', label: 'Connect Services', icon: Link2, description: 'Link your tools' },
  { id: 'workflows', label: 'Workflows', icon: Workflow, description: 'Automate processes' },
  { id: 'auth', label: 'Authentication', icon: Lock, description: 'Secure access' },
  { id: 'visualization', label: 'Dashboard', icon: BarChart3, description: 'Customize view' },
  { id: 'review', label: 'Launch', icon: Rocket, description: 'Go live' }
]

export default function EnhancedOnboardingV3({ 
  initialUrl = '', 
  onComplete 
}: { 
  initialUrl?: string
  onComplete?: (config: any) => void 
}) {
  const router = useRouter()
  const [state, setState] = useState<OnboardingState>({
    websiteUrl: initialUrl,
    businessAnalysis: null,
    integrations: [],
    workflows: [],
    authConfig: {
      methods: [
        { type: 'email', enabled: true, configured: false, label: 'Email/Password', description: 'Traditional login', icon: 'mail' },
        { type: 'google', enabled: true, configured: false, label: 'Google', description: 'Sign in with Google', icon: 'google' },
        { type: 'github', enabled: false, configured: false, label: 'GitHub', description: 'Sign in with GitHub', icon: 'github' },
        { type: 'saml', enabled: false, configured: false, label: 'SAML SSO', description: 'Enterprise SSO', icon: 'shield' }
      ],
      features: {
        twoFactor: false,
        passwordReset: true,
        emailVerification: true,
        roleBasedAccess: true
      }
    },
    visualizationConfig: {
      theme: 'light',
      primaryColor: '#000000',
      logo: undefined,
      dashboardWidgets: []
    },
    currentStep: 0,
    isAnalyzing: false,
    isDeploying: false,
    isSaving: false,
    deploymentResult: null
  })

  const [user, setUser] = useState<any>(null)
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [showGAPropertySelector, setShowGAPropertySelector] = useState(false)
  const [pendingGAConnection, setPendingGAConnection] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleAnalysis = async () => {
    setState(prev => ({ ...prev, isAnalyzing: true }))
    
    try {
      // Call real AI analysis API
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websiteUrl: state.websiteUrl })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze website')
      }

      const aiAnalysis = await response.json()
      
      // Transform AI analysis to our state format
      const mockAnalysis = {
        businessType: aiAnalysis.businessIntelligence?.industryCategory || 'Business',
        monthlyRevenue: 125000, // This would need separate analysis
        employeeCount: 12, // This would need separate analysis
        techStack: ['node', 'react', 'postgres'], // Could be detected from technical requirements
        detectedSystems: aiAnalysis.technicalRequirements?.integrationOpportunities?.map((opp: any) => ({
          name: opp.service,
          type: opp.category,
          confidence: opp.priority === 'critical' ? 95 : opp.priority === 'important' ? 85 : 75
        })) || []
      }

      // Create comprehensive integration list with REAL services from Terraform
      const integrations: Integration[] = [
        // Detected integrations from analysis
        ...mockAnalysis.detectedSystems.map(system => {
          // Map system names to OAuth provider IDs
          const providerMap: Record<string, string> = {
            'google analytics': 'google',
            'google-analytics': 'google',
            'github': 'github',
            'stripe': 'stripe',
            'shopify': 'shopify',
            'slack': 'slack',
            'mailchimp': 'mailchimp'
          }
          
          const systemId = system.name.toLowerCase().replace(/\s+/g, '-')
          const providerId = systemId === 'google-analytics' ? 'google-analytics' : (providerMap[systemId] || providerMap[system.name.toLowerCase()] || systemId)
          
          return {
            id: providerId,
            name: system.name,
            type: system.type,
            status: 'detected' as const,
            connectionStatus: 'not_connected' as const,
            confidence: system.confidence,
            value: `Sync ${system.type.toLowerCase()} data`,
            estimatedTime: '30 seconds',
            required: false
          }
        }),
        
        // Additional REAL integrations available in Terraform
        {
          id: 'google-analytics',
          name: 'Google Analytics',
          type: 'Analytics',
          logo: '📊',
          status: 'suggested' as const,
          connectionStatus: 'not_connected' as const,
          value: 'Track website performance & user behavior',
          estimatedTime: '30 seconds',
          required: false
        },
        {
          id: 'stripe',
          name: 'Stripe',
          type: 'Payments',
          logo: '💳',
          status: 'suggested' as const,
          connectionStatus: 'not_connected' as const,
          value: 'Process payments & subscriptions',
          estimatedTime: '1 minute',
          required: false
        },
        {
          id: 'shopify',
          name: 'Shopify', 
          type: 'E-commerce',
          logo: '🛍️',
          status: 'suggested' as const,
          connectionStatus: 'not_connected' as const,
          value: 'Sync products, orders & inventory',
          estimatedTime: '2 minutes',
          required: false
        },
        {
          id: 'github',
          name: 'GitHub',
          type: 'Development',
          logo: '👨‍💻',
          status: 'suggested' as const,
          connectionStatus: 'not_connected' as const,
          value: 'Track code changes & issues',
          estimatedTime: '30 seconds',
          required: false
        },
        {
          id: 'google',
          name: 'Google Workspace',
          type: 'Productivity',
          logo: '📊',
          status: 'suggested' as const,
          connectionStatus: 'not_connected' as const,
          value: 'Calendar, Drive & Analytics access',
          estimatedTime: '1 minute',
          required: false
        },
        {
          id: 'calendly',
          name: 'Calendly',
          type: 'Scheduling',
          logo: '📅',
          status: 'suggested' as const,
          connectionStatus: 'not_connected' as const,
          value: 'Sync appointments & availability',
          estimatedTime: '30 seconds',
          required: false
        },
        {
          id: 'quickbooks',
          name: 'QuickBooks',
          type: 'Accounting',
          logo: '💰',
          status: 'optional' as const,
          connectionStatus: 'not_connected' as const,
          value: 'Automatic financial sync',
          estimatedTime: '1 minute',
          required: false
        },
        {
          id: 'mailchimp',
          name: 'Mailchimp',
          type: 'Marketing',
          logo: '✉️',
          status: 'optional' as const,
          connectionStatus: 'not_connected' as const,
          value: 'Email campaigns & subscribers',
          estimatedTime: '1 minute',
          required: false
        },
        {
          id: 'slack',
          name: 'Slack',
          type: 'Communication',
          logo: '💬',
          status: 'optional' as const,
          connectionStatus: 'not_connected' as const,
          value: 'Team notifications & alerts',
          estimatedTime: '30 seconds',
          required: false
        },
        {
          id: 'hubspot',
          name: 'HubSpot',
          type: 'CRM',
          logo: '🎯',
          status: 'optional' as const,
          connectionStatus: 'not_connected' as const,
          value: 'Customer relationships & sales',
          estimatedTime: '2 minutes',
          required: false
        },
        {
          id: 'salesforce',
          name: 'Salesforce',
          type: 'CRM',
          logo: '☁️',
          status: 'optional' as const,
          connectionStatus: 'not_connected' as const,
          value: 'Enterprise CRM & automation',
          estimatedTime: '3 minutes',
          required: false
        }
      ]
      
      // Remove duplicates based on ID
      const uniqueIntegrations = integrations.filter((integration, index, self) =>
        index === self.findIndex(i => i.id === integration.id)
      )

      // Generate AI workflows from analysis
      const aiWorkflows: Workflow[] = aiAnalysis.technicalRequirements?.workflowRequirements?.map((wf: any, index: number) => ({
        id: `auto-${index + 1}`,
        name: wf.name,
        description: wf.description,
        enabled: wf.businessImpact === 'high',
        editable: true,
        triggers: [wf.trigger],
        actions: wf.steps?.map((step: any) => step.type) || [],
        category: 'ai_generated' as const
      })) || [
        // Fallback workflows if AI doesn't provide any
        {
          id: 'auto-1',
          name: 'Customer Onboarding',
          description: 'New signup → Send welcome email → Create dashboard → Track activation',
          enabled: true,
          editable: true,
          triggers: ['user.created'],
          actions: ['email.welcome', 'dashboard.create', 'analytics.track'],
          category: 'ai_generated' as const
        },
        {
          id: 'auto-2',
          name: 'Daily Reports',
          description: 'Every morning → Collect metrics → Generate report → Send to team',
          enabled: true,
          editable: true,
          triggers: ['schedule.daily'],
          actions: ['data.collect', 'report.generate', 'email.send'],
          category: 'ai_generated' as const
        }
      ]

      // Generate dashboard widgets from AI analysis
      const widgets: DashboardWidget[] = aiAnalysis.uiuxRecommendations?.dashboardNeeds?.keyMetrics?.map((metric: string, index: number) => ({
        id: `widget-${index + 1}`,
        name: metric,
        description: `Track and visualize ${metric.toLowerCase()}`,
        enabled: true,
        category: 'analytics'
      })) || [
        // Fallback widgets based on business type
        { id: 'overview', name: 'Business Overview', description: 'Key metrics at a glance', enabled: true, category: 'dashboard' },
        { id: 'revenue', name: 'Revenue Tracking', description: 'Financial performance metrics', enabled: true, category: 'financial' },
        { id: 'users', name: 'User Analytics', description: 'User activity and engagement', enabled: true, category: 'analytics' },
        { id: 'performance', name: 'Performance Metrics', description: 'System health and speed', enabled: true, category: 'technical' }
      ]

      setState(prev => ({
        ...prev,
        businessAnalysis: mockAnalysis,
        integrations: uniqueIntegrations,
        workflows: aiWorkflows,
        visualizationConfig: {
          ...prev.visualizationConfig,
          dashboardWidgets: widgets
        },
        isAnalyzing: false,
        currentStep: 1
      }))
    } catch (error) {
      console.error('Analysis failed:', error)
      setState(prev => ({ ...prev, isAnalyzing: false }))
    }
  }

  const connectIntegration = async (integrationId: string) => {
    // Update connection status
    setState(prev => ({
      ...prev,
      integrations: prev.integrations.map(int => 
        int.id === integrationId 
          ? { ...int, connectionStatus: 'connecting' }
          : int
      )
    }))

    try {
      // Google Analytics uses Google OAuth
      if (integrationId === 'google-analytics') {
        console.log(`📊 Setting up Google Analytics via Google OAuth`)
        // Google Analytics will use the standard OAuth flow
        // The property selector will appear after OAuth completion
      }
      
      console.log(`🔗 Starting real OAuth for ${integrationId}`)
      
      const requestBody = {
        provider: integrationId,
        tenantId: 'default'
      }
      console.log(`📤 OAuth request body:`, requestBody)
      
      // Use real OAuth endpoint with Terraform credentials
      const authResponse = await fetch('/api/oauth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log(`📡 OAuth response status:`, authResponse.status)
      console.log(`📡 OAuth response ok:`, authResponse.ok)
      
      if (authResponse.ok) {
        const { authUrl, state } = await authResponse.json()
        console.log(`🚀 Opening ${integrationId} OAuth in popup:`, authUrl)
        
        if (!authUrl) {
          throw new Error('No authUrl received from OAuth endpoint')
        }
        
        // Store state for when we return
        localStorage.setItem(`oauth_state_${integrationId}`, state)
        
        // Open OAuth in popup window
        const width = 600
        const height = 700
        const left = window.screenX + (window.innerWidth - width) / 2
        const top = window.screenY + (window.innerHeight - height) / 2
        
        console.log(`🔗 Attempting to open popup with URL: ${authUrl}`)
        
        const popup = window.open(
          authUrl,
          `oauth_${integrationId}`,
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
        )
        
        console.log(`📋 Popup object:`, popup)
        console.log(`📋 Popup closed?`, popup?.closed)
        
        if (!popup || popup.closed) {
          // Update status back to not_connected
          setState(prev => ({
            ...prev,
            integrations: prev.integrations.map(int => 
              int.id === integrationId 
                ? { ...int, connectionStatus: 'not_connected' }
                : int
            )
          }))
          
          console.error('❌ Popup was blocked or failed to open')
          
          // Offer fallback option
          const useRedirect = confirm('Popup was blocked! Would you like to continue OAuth in a new tab? (Click OK for new tab, Cancel to retry popup)')
          
          if (useRedirect) {
            console.log('🔄 Opening OAuth in new tab instead')
            window.open(authUrl, '_blank')
            
            // Show instructions to user
            alert('Please complete the OAuth process in the new tab, then return to this page. The connection will be detected automatically.')
            
            // Still wait for completion (in case they come back)
            const token = await waitForOAuthCompletion(null, integrationId)
            if (token) {
              setState(prev => ({
                ...prev,
                integrations: prev.integrations.map(int => 
                  int.id === integrationId 
                    ? { ...int, connectionStatus: 'connected' }
                    : int
                )
              }))
            }
            return
          } else {
            throw new Error('Popup was blocked. Please allow popups for this site.')
          }
        }
        
        console.log(`✅ Popup opened for ${integrationId}`)
        
        // Focus the popup
        popup.focus()
        
        // Wait for OAuth completion
        const token = await waitForOAuthCompletion(popup, integrationId)
        
        if (token) {
          console.log(`✅ OAuth completed for ${integrationId}`)
          
          // Mark as connected
          setState(prev => ({
            ...prev,
            integrations: prev.integrations.map(int => 
              int.id === integrationId 
                ? { ...int, connectionStatus: 'connected' }
                : int
            )
          }))
        } else {
          throw new Error('OAuth completion failed or was cancelled')
        }
      } else {
        const errorData = await authResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error(`❌ OAuth endpoint error for ${integrationId}:`, errorData)
        throw new Error(`OAuth initialization failed for ${integrationId}: ${errorData.error || authResponse.statusText}`)
      }
      
    } catch (error) {
      console.error(`❌ Failed to connect ${integrationId}:`, error)
      
      // Mark as error
      setState(prev => ({
        ...prev,
        integrations: prev.integrations.map(int => 
          int.id === integrationId 
            ? { ...int, connectionStatus: 'error' }
            : int
        )
      }))
      
      alert(`Failed to connect to ${integrationId}. Please try again.`)
    }
  }

  // Wait for OAuth popup to complete
  const waitForOAuthCompletion = (popup: Window | null, integrationId: string): Promise<string | null> => {
    return new Promise((resolve) => {
      let messageReceived = false
      
      // Listen for OAuth completion message
      const handleMessage = (event: MessageEvent) => {
        console.log(`📨 Received message:`, event.data, 'from:', event.origin)
        
        // Accept messages from localhost:7250 (our OAuth callback)
        const validOrigins = ['http://localhost:7250', window.location.origin]
        const isValidOrigin = validOrigins.includes(event.origin) || event.origin === 'null' // null for local file://
        
        if (!isValidOrigin) {
          console.log(`⚠️ Ignoring message from untrusted origin: ${event.origin}`)
          return
        }
        
        // Check if message is for the current provider
        const provider = event.data.provider || integrationId
        if (event.data.type === 'OAUTH_SUCCESS' && provider === integrationId) {
          console.log(`✅ OAuth success for ${integrationId}`)
          messageReceived = true
          window.removeEventListener('message', handleMessage)
          popup?.close()
          
          // For Google Analytics, show property selector
          if (integrationId === 'google-analytics') {
            setPendingGAConnection(integrationId)
            setShowGAPropertySelector(true)
          } else {
            // Setup Airbyte for other providers
            setupAirbyteConnection(integrationId)
          }
          
          resolve('token_received')
        } else if (event.data.type === 'OAUTH_ERROR' && provider === integrationId) {
          console.log(`❌ OAuth error for ${integrationId}`)
          messageReceived = true
          window.removeEventListener('message', handleMessage)
          popup?.close()
          resolve(null)
        }
      }
      
      window.addEventListener('message', handleMessage)
      
      // Log that we're listening
      console.log(`👂 Listening for OAuth messages for ${integrationId}`)
      
      // Also check if popup is closed
      const checkClosed = setInterval(() => {
        try {
          // Try to check if popup is closed
          const isClosed = popup?.closed
          
          if (isClosed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', handleMessage)
            
            // If we didn't receive a message but popup closed, check localStorage
            if (!messageReceived) {
              const token = localStorage.getItem(`oauth_token_${integrationId}`)
              if (token) {
                console.log(`✅ Found token in localStorage for ${integrationId}`)
                localStorage.removeItem(`oauth_token_${integrationId}`)
                setupAirbyteConnection(integrationId)
                resolve(token)
              } else {
                console.log(`❌ No token found for ${integrationId}, OAuth may have failed`)
                resolve(null)
              }
            }
          }
        } catch (e) {
          // COOP policy might block access to popup.closed
          // In this case, rely on the message event instead
          console.log('⚠️ COOP policy blocked popup.closed check, relying on message events')
        }
      }, 500)
      
      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        popup?.close()
        if (!messageReceived) {
          console.log(`⏱️ OAuth timeout for ${integrationId}`)
          resolve(null)
        }
      }, 300000)
    })
  }

  // Setup Airbyte connection after OAuth success
  const setupAirbyteConnection = async (provider: string, propertyId?: string) => {
    try {
      console.log(`🚀 Setting up Airbyte for ${provider}...`)
      
      // For now, skip getting the access token since it's stored in Supabase
      // The backend will retrieve it from tenant_integrations table
      const requestBody: any = {
        tenantId: 'default',
        provider
      }
      
      // Add property ID for Google Analytics
      if (propertyId) {
        requestBody.propertyId = propertyId
      }
      
      const response = await fetch('/api/airbyte/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Airbyte connection established for ${provider}`, result)
        
        // Check if the result indicates success
        if (result.success) {
          console.log(`🎉 Airbyte setup successful: ${result.message}`)
          
          // Update integration status
          setState(prev => ({
            ...prev,
            integrations: prev.integrations.map(int => 
              int.id === provider 
                ? { ...int, connectionStatus: 'connected' }
                : int
            )
          }))
        } else {
          throw new Error(result.error || 'Airbyte setup returned unsuccessful result')
        }
      } else {
        const errorText = await response.text()
        console.error(`❌ Airbyte setup failed with status ${response.status}:`, errorText)
        throw new Error(`Failed to setup Airbyte connection: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error(`❌ Failed to setup Airbyte for ${provider}:`, error)
      alert(`Connected to ${provider} but failed to setup data sync. You can retry later.`)
    }
  }

  // Handle Google Analytics property selection
  const handleGAPropertySelect = async (propertyId: string, measurementId: string) => {
    console.log(`📊 Selected GA property: ${propertyId}, measurement: ${measurementId}`)
    
    if (pendingGAConnection) {
      // Setup Airbyte with the selected property
      await setupAirbyteConnection(pendingGAConnection, propertyId)
      
      // Store the GA configuration
      await fetch('/api/integrations/google-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'default',
          propertyId,
          measurementId
        })
      })
    }
    
    setShowGAPropertySelector(false)
    setPendingGAConnection(null)
  }

  const addWorkflow = (workflow: Workflow) => {
    setState(prev => ({
      ...prev,
      workflows: [...prev.workflows, workflow]
    }))
  }

  const toggleWorkflow = (workflowId: string) => {
    setState(prev => ({
      ...prev,
      workflows: prev.workflows.map(wf => 
        wf.id === workflowId ? { ...wf, enabled: !wf.enabled } : wf
      )
    }))
  }

  const launchTempApplication = async () => {
    setState(prev => ({ ...prev, isDeploying: true }))

    try {
      // Generate YAML config from current state
      const yamlConfig = generateYamlConfigFromState(state)
      const appName = `${state.businessAnalysis.businessType.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`

      // First, generate the application files
      const generateResponse = await fetch('/api/generate-production-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Mode': 'true' // Use demo mode to skip auth
        },
        body: JSON.stringify({
          tenantId: state.tenantId || 'demo',
          analysisId: 'onboarding',
          appName,
          businessProfile: state.businessAnalysis,
          dataArchitecture: {
            models: [], // Could be populated from AI analysis
            relationships: []
          },
          integrations: state.integrations
            .filter(i => i.connectionStatus === 'connected')
            .map(i => ({
              provider: i.id,
              credentialId: 'demo',
              config: {}
            })),
          deploymentConfig: {
            platform: 'vercel',
            environment: 'production'
          }
        })
      })

      if (!generateResponse.ok) {
        const error = await generateResponse.json()
        throw new Error(error.error || 'Failed to generate application')
      }

      const generateResult = await generateResponse.json()
      console.log('✅ Application generated:', generateResult)

      // Then deploy to Vercel if configured
      let deploymentUrl = `http://localhost:3000` // Fallback for local dev
      
      if (process.env.NEXT_PUBLIC_VERCEL_TOKEN) {
        const deployResponse = await fetch('/api/deploy-to-vercel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appPath: generateResult.applicationPath,
            appName,
            environmentVariables: {
              NEXT_PUBLIC_SUPABASE_URL: generateResult.supabaseProject.url,
              NEXT_PUBLIC_SUPABASE_ANON_KEY: generateResult.supabaseProject.anonKey,
              // Add other env vars as needed
            }
          })
        })

        if (deployResponse.ok) {
          const deployResult = await deployResponse.json()
          deploymentUrl = deployResult.projectUrl
          console.log('✅ Deployed to Vercel:', deploymentUrl)
        } else {
          console.warn('⚠️ Vercel deployment failed, using local preview')
        }
      }

      // Store deployment info for potential later saving
      sessionStorage.setItem('tempDeployment', JSON.stringify({
        ...generateResult,
        deploymentUrl,
        onboardingState: state
      }))

      // Open deployed app in new tab
      window.open(deploymentUrl, '_blank')
      
      // Show success state
      setState(prev => ({ 
        ...prev, 
        isDeploying: false,
        deploymentResult: {
          ...generateResult,
          url: deploymentUrl
        }
      }))
    } catch (error) {
      console.error('Application deployment failed:', error)
      setState(prev => ({ ...prev, isDeploying: false }))
      alert(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const generateYamlConfigFromState = (state: OnboardingState) => {
    const businessType = state.businessAnalysis.businessType || 'Business App'
    const connectedIntegrations = state.integrations.filter(i => i.connectionStatus === 'connected')
    
    return `vertical:
  name: "${businessType}"
  description: "A custom ${businessType.toLowerCase()} application"
  industry: "saas"
  version: "1.0.0"

business:
  name: "${businessType}"
  type: "saas"
  website: "${state.websiteUrl}"
  contact:
    email: "admin@${businessType.toLowerCase().replace(/\s+/g, '')}.com"
  settings:
    timezone: "UTC"
    currency: "USD"
    language: "en"

database:
  provider: "postgresql"
  models:
    - name: "user"
      displayName: "Users"
      description: "Application users"
      fields:
        - name: "id"
          type: "string"
          required: true
          unique: true
        - name: "email"
          type: "string"
          required: true
          unique: true
        - name: "name"
          type: "string"
          required: true
        - name: "role"
          type: "string"
          required: true
          validation:
            enum: ["admin", "user", "viewer"]
        - name: "createdAt"
          type: "date"
          required: true

apis:
  integrations:
${connectedIntegrations.map(integration => `    - name: "${integration.name.toLowerCase()}"
      type: "oauth"
      enabled: true
      provider: "${integration.name.toLowerCase()}"`).join('\n')}

workflows:
${state.workflows.filter(w => w.enabled).map(workflow => `  - name: "${workflow.name.toLowerCase().replace(/\s+/g, '-')}"
    description: "${workflow.description}"
    trigger:
      type: "event"
      config:
        event: "${workflow.triggers[0] || 'user.created'}"
    steps:
      - name: "execute-workflow"
        type: "api-call"
        config:
          integration: "workflow-service"
          endpoint: "execute"`).join('\n')}

authentication:
  providers: ${JSON.stringify(state.authConfig.methods.filter(m => m.enabled).map(m => m.type))}
  roles:
    - name: "admin"
      description: "Administrator"
      permissions: ["*"]
    - name: "user"
      description: "Regular user"
      permissions: ["read:own", "write:own"]

ui:
  theme:
    primary: "${state.visualizationConfig.primaryColor || '#3b82f6'}"
    secondary: "#64748b"
  pages:
    - name: "dashboard"
      path: "/"
      layout: "dashboard"
      components:
        - type: "stats"
          config:
            title: "Overview"
        - type: "chart"
          config:
            title: "Analytics"
    - name: "users"
      path: "/users"
      layout: "list"
      components:
        - type: "table"
          config:
            entity: "user"
            columns: ["name", "email", "role", "createdAt"]
            actions: ["create", "edit", "delete"]

features:
  authentication: true
  multiTenancy: true
  notifications: true
  analytics: true
  fileUpload: true

deployment:
  platform: "vercel"
  environment: "production"
  autoDeploy: true`
  }

  const saveToProfile = async () => {
    // If user is not logged in, prompt for signup
    if (!user) {
      // Save current state to session storage
      sessionStorage.setItem('onboardingState', JSON.stringify(state))
      router.push('/signup?redirect=onboarding-complete')
      return
    }

    setState(prev => ({ ...prev, isSaving: true }))

    try {
      // Create application in database
      const { data: app, error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          name: `${state.businessAnalysis.businessType} Dashboard`,
          website_url: state.websiteUrl,
          config: {
            integrations: state.integrations,
            workflows: state.workflows,
            auth: state.authConfig,
            visualization: state.visualizationConfig
          },
          deployment_url: state.deploymentResult?.url,
          status: 'deployed'
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to user dashboard
      router.push(`/dashboard?saved=${app.id}`)
    } catch (error) {
      console.error('Save to profile failed:', error)
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }

  const canProceed = () => {
    switch (state.currentStep) {
      case 1: // Integrations
        return true // Always allow proceeding, no required connections
      case 2: // Workflows
        return state.workflows.filter(w => w.enabled).length > 0
      case 3: // Auth
        return state.authConfig.methods.filter(m => m.enabled).length > 0
      case 4: // Visualization
        return state.visualizationConfig.dashboardWidgets.filter(w => w.enabled).length > 0
      default:
        return true
    }
  }
  
  // Organize database when moving from integrations to workflows
  const handleNextStep = async () => {
    if (state.currentStep === 1) {
      // After integrations, organize the database
      const connectedProviders = state.integrations.filter(i => i.connectionStatus === 'connected')
      if (connectedProviders.length > 0) {
        console.log('🗄️ Organizing database with connected providers...')
        try {
          const response = await fetch('/api/organize-database', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              tenantId: state.tenantId || 'default',
              userId: state.tenantId || 'default'
            })
          })

          if (response.ok) {
            const result = await response.json()
            console.log('✅ Database organized successfully:', result)
          } else {
            console.log('⚠️ Database organization failed, continuing anyway')
          }
        } catch (error) {
          console.error('Error organizing database:', error)
          console.log('⚠️ Database organization failed, continuing anyway')
        }
      }
    }
    
    setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))
  }

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 0:
        return <AnalysisStep 
          state={state} 
          onAnalyze={handleAnalysis} 
          onUpdateUrl={(url: string) => setState(prev => ({ ...prev, websiteUrl: url }))} 
        />
      case 1:
        return <IntegrationsStep state={state} onConnect={connectIntegration} />
      case 2:
        return <WorkflowsStep state={state} onToggle={toggleWorkflow} onAdd={addWorkflow} />
      case 3:
        return <AuthenticationStep state={state} setState={setState} />
      case 4:
        return <VisualizationStep state={state} setState={setState} />
      case 5:
        return <ReviewStep 
          state={state} 
          onLaunch={launchTempApplication}
          onSave={saveToProfile}
          user={user}
        />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Enhanced Progress Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Create Your Application
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {state.businessAnalysis ? `Building for: ${state.businessAnalysis.businessType}` : 'AI-powered app generation'}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>~5 minutes to complete</span>
            </div>
          </div>
          
          {/* Enhanced Step Progress */}
          <div className="relative">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = index === state.currentStep
                const isCompleted = index < state.currentStep
                const isUpcoming = index > state.currentStep
                
                return (
                  <div key={step.id} className="flex items-center flex-1 relative">
                    <div className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
                      <motion.div 
                        className={`
                          relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                          ${isActive ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-110' : ''}
                          ${isCompleted ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25' : ''}
                          ${isUpcoming ? 'bg-gray-100 text-gray-400 border-2 border-gray-200' : ''}
                        `}
                        whileHover={isUpcoming ? { scale: 1.05 } : {}}
                      >
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <CheckCircle className="w-6 h-6" />
                          </motion.div>
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                        
                        {/* Step number badge */}
                        <div className={`
                          absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center
                          ${isActive ? 'bg-white text-blue-600' : ''}
                          ${isCompleted ? 'bg-white text-green-600' : ''}
                          ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
                        `}>
                          {index + 1}
                        </div>
                      </motion.div>
                      
                      <div className="ml-4">
                        <p className={`text-sm font-semibold transition-colors ${
                          isActive ? 'text-gray-900' : isCompleted ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                        <p className={`text-xs transition-colors ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    
                    {index < STEPS.length - 1 && (
                      <div className="flex-1 mx-6 relative">
                        <div className={`h-0.5 transition-all duration-500 ${
                          isCompleted ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gray-200'
                        }`} />
                        {isCompleted && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-400 origin-left"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Step Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Enhanced Navigation Buttons */}
        <div className="flex justify-between mt-12">
          <motion.button
            onClick={() => setState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))}
            disabled={state.currentStep === 0 || state.isDeploying}
            className={`flex items-center px-8 py-4 rounded-xl font-semibold transition-all duration-200 ${
              state.currentStep === 0 || state.isDeploying
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200 hover:border-gray-300'
            }`}
            whileHover={state.currentStep > 0 && !state.isDeploying ? { x: -3 } : {}}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </motion.button>

          {state.currentStep < STEPS.length - 1 ? (
            <motion.button
              onClick={handleNextStep}
              disabled={!canProceed() || state.isDeploying}
              className={`flex items-center px-8 py-4 rounded-xl font-semibold transition-all duration-200 ${
                canProceed() && !state.isDeploying
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              whileHover={canProceed() && !state.isDeploying ? { x: 3, scale: 1.02 } : {}}
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Choose an option above to continue</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Google Analytics Property Selector Modal */}
      <GoogleAnalyticsPropertySelector
        isOpen={showGAPropertySelector}
        onClose={() => {
          setShowGAPropertySelector(false)
          setPendingGAConnection(null)
        }}
        onSelect={handleGAPropertySelect}
        tenantId="default"
      />
    </div>
  )
}

// Step Components
function AnalysisStep({ state, onAnalyze, onUpdateUrl }: any) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-12">
      <div className="text-center max-w-3xl mx-auto">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Let's analyze your business
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Our AI will scan your website to understand your business model, 
            detect your existing systems, and create a custom integration plan.
          </p>
        </motion.div>

        {/* Enhanced URL Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <label className="block text-left text-sm font-semibold text-gray-700 mb-3">
            Your Website URL
          </label>
          <div className="relative group">
            <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200 group-focus-within:border-blue-500 group-focus-within:shadow-lg group-focus-within:shadow-blue-500/25 transition-all duration-300">
              <Globe className="w-6 h-6 text-gray-400 ml-2 mr-4" />
              <input
                type="url"
                value={state.websiteUrl}
                onChange={(e) => onUpdateUrl(e.target.value)}
                placeholder="https://yourcompany.com"
                className="flex-1 bg-transparent text-lg outline-none py-2 font-medium"
              />
            </div>
          </div>
        </motion.div>

        {/* Enhanced Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button
            onClick={onAnalyze}
            disabled={!state.websiteUrl || state.isAnalyzing}
            className={`px-12 py-5 rounded-xl font-bold text-lg transition-all duration-300 ${
              state.websiteUrl && !state.isAnalyzing
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {state.isAnalyzing ? (
              <div className="flex items-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent mr-3" />
                <span>AI is analyzing your business...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Brain className="w-6 h-6 mr-3" />
                <span>Start AI Analysis</span>
              </div>
            )}
          </button>
        </motion.div>

        {/* Enhanced Analysis Progress */}
        {state.isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 space-y-4"
          >
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Analysis Progress
              </h3>
              <div className="space-y-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center text-green-700"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium">Detected e-commerce platform</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                  className="flex items-center text-green-700"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium">Found payment processor</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.6 }}
                  className="flex items-center text-green-700"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium">Discovered 5 integration opportunities</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function IntegrationCard({ integration, onConnect }: { integration: Integration, onConnect: () => void }) {
  const getStatusColor = () => {
    switch (integration.connectionStatus) {
      case 'connected': return 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
      case 'connecting': return 'bg-blue-50 border-blue-200 hover:bg-blue-100'
      case 'error': return 'bg-red-50 border-red-200 hover:bg-red-100'
      default: return 'bg-white border-gray-200 hover:bg-gray-50'
    }
  }

  const getStatusBadge = () => {
    switch (integration.status) {
      case 'detected': return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          Detected
        </span>
      )
      case 'suggested': return (
        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
          Recommended
        </span>
      )
      case 'optional': return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          Optional
        </span>
      )
      default: return null
    }
  }

  const getIntegrationIcon = () => {
    const iconMap: Record<string, string> = {
      'google-analytics': '📊',
      'stripe': '💳',
      'shopify': '🛍️',
      'github': '👨‍💻',
      'google': '📊',
      'calendly': '📅',
      'quickbooks': '💰',
      'mailchimp': '✉️',
      'slack': '💬',
      'hubspot': '🎯',
      'salesforce': '☁️'
    }
    return iconMap[integration.id] || integration.logo || '🔗'
  }

  return (
    <motion.tr 
      className={`border-b transition-all duration-200 ${getStatusColor()}`}
      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Icon & Name */}
      <td className="px-6 py-6 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl mr-4">
            {getIntegrationIcon()}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{integration.name}</div>
            <div className="text-sm text-gray-500">{integration.type}</div>
          </div>
        </div>
      </td>

      {/* Description */}
      <td className="px-6 py-6">
        <div className="text-sm text-gray-900 max-w-xs leading-relaxed">
          {integration.value}
        </div>
      </td>

      {/* Status Badge */}
      <td className="px-6 py-6 whitespace-nowrap">
        {getStatusBadge()}
      </td>

      {/* Metadata */}
      <td className="px-6 py-6 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          {integration.estimatedTime && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
              <Clock className="w-3 h-3 mr-1" />
              {integration.estimatedTime}
            </span>
          )}
          {integration.confidence && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
              {integration.confidence}%
            </span>
          )}
        </div>
      </td>

      {/* Connection Status */}
      <td className="px-6 py-6 whitespace-nowrap">
        {integration.connectionStatus === 'connected' ? (
          <div className="flex items-center text-emerald-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="text-sm font-semibold">Connected</span>
          </div>
        ) : integration.connectionStatus === 'connecting' ? (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2" />
            <span className="text-sm font-semibold">Connecting...</span>
          </div>
        ) : (
          <div className="flex items-center text-gray-500">
            <div className="w-4 h-4 mr-2 border-2 border-gray-300 rounded-full" />
            <span className="text-sm font-semibold">Not Connected</span>
          </div>
        )}
      </td>

      {/* Action Button */}
      <td className="px-6 py-6 whitespace-nowrap text-right">
        {integration.connectionStatus === 'connected' ? (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </span>
        ) : integration.connectionStatus === 'connecting' ? (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-800 border-t-transparent mr-1" />
            Connecting...
          </span>
        ) : (
          <button
            onClick={onConnect}
            className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-lg"
          >
            <Link2 className="w-3 h-3 mr-1" />
            Connect
          </button>
        )}
      </td>
    </motion.tr>
  )
}

function IntegrationsStep({ state, onConnect }: any) {
  const detectedConnections = state.integrations.filter((i: Integration) => i.status === 'detected')
  const suggestedConnections = state.integrations.filter((i: Integration) => i.status === 'suggested')
  const optionalConnections = state.integrations.filter((i: Integration) => i.status === 'optional')
  const connectedCount = state.integrations.filter((i: Integration) => i.connectionStatus === 'connected').length
  const totalCount = state.integrations.length

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl mb-8 shadow-2xl shadow-blue-500/30"
        >
          <Link2 className="w-10 h-10 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-700 to-purple-700 bg-clip-text text-transparent"
        >
          Connect Your Ecosystem
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto"
        >
          We've analyzed your business and identified the perfect integrations to create a unified, powerful dashboard. 
          Each connection is secured with enterprise-grade OAuth 2.0 protocols.
        </motion.p>
      </motion.div>

      {/* Connection Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="group relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-8 border-2 border-green-200 shadow-lg hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 200 }}
                className="text-4xl font-bold text-green-600"
              >
                {detectedConnections.length}
              </motion.span>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-green-800 mb-2">Detected</h3>
            <p className="text-green-700 text-sm leading-relaxed">Found on your website automatically</p>
          </div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="group relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 border-2 border-blue-200 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
                className="text-4xl font-bold text-blue-600"
              >
                {suggestedConnections.length}
              </motion.span>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-blue-800 mb-2">Recommended</h3>
            <p className="text-blue-700 text-sm leading-relaxed">AI-powered suggestions for your workflow</p>
          </div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="group relative bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-3xl p-8 border-2 border-purple-200 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.4, type: "spring", stiffness: 200 }}
                className="text-4xl font-bold text-purple-600"
              >
                {optionalConnections.length}
              </motion.span>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Plus className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-purple-800 mb-2">Advanced</h3>
            <p className="text-purple-700 text-sm leading-relaxed">Optional features for power users</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Detected Connections */}
      {detectedConnections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex items-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mr-6 shadow-xl shadow-green-500/25">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Detected Services</h3>
                <p className="text-gray-600 text-lg">We found these services on your website</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-green-200">
                <h4 className="text-lg font-semibold text-green-800">Automatically Detected</h4>
                <p className="text-green-700 text-sm">These integrations were found on your website</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Service</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/3">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/12">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detectedConnections.map((integration: Integration, index: number) => (
                      <IntegrationCard 
                        key={integration.id}
                        integration={integration} 
                        onConnect={() => onConnect(integration.id)} 
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Suggested Connections */}
      {suggestedConnections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.8 }}
              className="flex items-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mr-6 shadow-xl shadow-blue-500/25">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">AI Recommendations</h3>
                <p className="text-gray-600 text-lg">Smart suggestions to enhance your workflow</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-blue-200">
                <h4 className="text-lg font-semibold text-blue-800">Intelligent Suggestions</h4>
                <p className="text-blue-700 text-sm">Based on your business analysis and best practices</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Service</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/3">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/12">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {suggestedConnections.map((integration: Integration, index: number) => (
                      <IntegrationCard 
                        key={integration.id}
                        integration={integration} 
                        onConnect={() => onConnect(integration.id)} 
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Optional Connections */}
      {optionalConnections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2 }}
        >
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 2.4 }}
              className="flex items-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mr-6 shadow-xl shadow-purple-500/25">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Advanced Features</h3>
                <p className="text-gray-600 text-lg">Optional integrations for power users</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.6 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-purple-200">
                <h4 className="text-lg font-semibold text-purple-800">Power User Features</h4>
                <p className="text-purple-700 text-sm">Advanced integrations for enhanced functionality</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Service</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/3">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/12">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Details</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-1/6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {optionalConnections.map((integration: Integration, index: number) => (
                      <IntegrationCard 
                        key={integration.id}
                        integration={integration} 
                        onConnect={() => onConnect(integration.id)} 
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Connection Progress */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.8 }}
        className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 rounded-3xl p-10 border-2 border-gray-200 shadow-xl"
      >
        <div className="text-center">
          <motion.h4
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 3 }}
            className="text-2xl font-bold text-gray-900 mb-3"
          >
            Connection Progress
          </motion.h4>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 3.2 }}
            className="text-gray-600 mb-8 text-lg"
          >
            Track your integration setup progress
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 3.4 }}
            className="flex items-center justify-center space-x-8 mb-8"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-green-700">Connected</span>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-blue-700">In Progress</span>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3 shadow-lg">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-sm font-semibold text-gray-600">Pending</span>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 3.6 }}
            className="w-full bg-gray-200 rounded-full h-4 shadow-inner"
          >
            <motion.div
              className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 h-4 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${totalCount > 0 ? (connectedCount / totalCount) * 100 : 0}%` }}
              transition={{ duration: 1.5, delay: 3.8, ease: "easeOut" }}
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 4 }}
            className="text-sm text-gray-600 mt-4 font-medium"
          >
            {connectedCount} of {totalCount} integrations connected
            {totalCount > 0 && (
              <span className="text-blue-600 ml-2">
                ({Math.round((connectedCount / totalCount) * 100)}% complete)
              </span>
            )}
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}

function WorkflowsStep({ state, onToggle, onAdd }: any) {
  const [showAddWorkflow, setShowAddWorkflow] = useState(false)
  const aiWorkflows = state.workflows.filter((w: Workflow) => w.category === 'ai_generated')
  const userWorkflows = state.workflows.filter((w: Workflow) => w.category === 'user_added')

  const workflowTemplates = [
    { name: 'Abandoned Cart Recovery', category: 'Sales' },
    { name: 'Customer Win-Back', category: 'Sales' },
    { name: 'Inventory Reorder Alert', category: 'Operations' },
    { name: 'Weekly Sales Report', category: 'Analytics' },
    { name: 'New Customer Welcome', category: 'Marketing' }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-2">Configure Workflows</h2>
        <p className="text-gray-600 mb-6">
          We've created smart workflows based on your business. Enable the ones you want and add more as needed.
        </p>

        {/* AI Generated Workflows */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
            AI-Generated Workflows
          </h3>
          <div className="space-y-3">
            {aiWorkflows.map((workflow: Workflow) => (
              <WorkflowCard 
                key={workflow.id}
                workflow={workflow}
                onToggle={() => onToggle(workflow.id)}
              />
            ))}
          </div>
        </div>

        {/* Add Custom Workflows */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Add More Workflows</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowAddWorkflow(true)}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors"
            >
              <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <span className="text-gray-600">Create Custom Workflow</span>
            </button>
            
            <div className="border rounded-lg p-6 bg-blue-50">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <span className="text-gray-700">Browse Templates</span>
            </div>
          </div>
        </div>

        {/* Quick Templates */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">Popular templates for your industry:</p>
          <div className="flex flex-wrap gap-2">
            {workflowTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onAdd({
                    id: `template-${idx}`,
                    name: template.name,
                    description: 'Template workflow',
                    enabled: true,
                    editable: true,
                    triggers: [],
                    actions: [],
                    category: 'user_added'
                  })
                }}
                className="px-3 py-1 bg-white rounded-full text-sm border hover:border-blue-600 transition-colors"
              >
                + {template.name}
              </button>
            ))}
          </div>
        </div>

        {/* User Added Workflows */}
        {userWorkflows.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Your Custom Workflows</h3>
            <div className="space-y-3">
              {userWorkflows.map((workflow: Workflow) => (
                <WorkflowCard 
                  key={workflow.id}
                  workflow={workflow}
                  onToggle={() => onToggle(workflow.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function WorkflowCard({ workflow, onToggle }: { workflow: Workflow, onToggle: () => void }) {
  return (
    <div className={`border rounded-lg p-4 transition-colors ${
      workflow.enabled ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={workflow.enabled}
            onChange={onToggle}
            className="mt-1"
          />
          <div>
            <h4 className="font-semibold">{workflow.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
            {workflow.triggers.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Triggers:</span>
                {workflow.triggers.map((trigger, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {trigger}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {workflow.editable && (
          <button className="text-blue-600 hover:text-blue-700">
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function AuthenticationStep({ state, setState }: any) {
  const updateAuthMethod = (type: string, updates: Partial<AuthMethod>) => {
    setState((prev: OnboardingState) => ({
      ...prev,
      authConfig: {
        ...prev.authConfig,
        methods: prev.authConfig.methods.map(m => 
          m.type === type ? { ...m, ...updates } : m
        )
      }
    }))
  }

  const updateAuthFeature = (feature: string, value: boolean) => {
    setState((prev: OnboardingState) => ({
      ...prev,
      authConfig: {
        ...prev.authConfig,
        features: {
          ...prev.authConfig.features,
          [feature]: value
        }
      }
    }))
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-2">Setup Authentication</h2>
      <p className="text-gray-600 mb-6">
        Configure how users will access your application securely.
      </p>

      {/* Login Methods */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Login Methods</h3>
        <div className="space-y-3">
          {state.authConfig.methods.map((method: AuthMethod) => (
            <div key={method.type} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={method.enabled}
                    onChange={(e) => updateAuthMethod(method.type, { enabled: e.target.checked })}
                  />
                  <div>
                    <p className="font-medium">{method.label}</p>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                </div>
                {method.enabled && !method.configured && (
                  <button className="text-blue-600 text-sm hover:underline">
                    Configure →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Features */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Shield className="w-5 h-5 text-green-600 mr-2" />
          Security Features
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(state.authConfig.features).map(([feature, enabled]) => (
            <label key={feature} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={enabled as boolean}
                onChange={(e) => updateAuthFeature(feature, e.target.checked)}
              />
              <span className="text-sm">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function VisualizationStep({ state, setState }: any) {
  const updateWidget = (widgetId: string, enabled: boolean) => {
    setState((prev: OnboardingState) => ({
      ...prev,
      visualizationConfig: {
        ...prev.visualizationConfig,
        dashboardWidgets: prev.visualizationConfig.dashboardWidgets.map(w => 
          w.id === widgetId ? { ...w, enabled } : w
        )
      }
    }))
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-2">Customize Your Dashboard</h2>
      <p className="text-gray-600 mb-6">
        Design how your unified dashboard will look and what data to display.
      </p>

      {/* Dashboard Preview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Dashboard Preview</h3>
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {state.visualizationConfig.dashboardWidgets
              .filter((w: DashboardWidget) => w.enabled)
              .slice(0, 4)
              .map((widget: DashboardWidget) => (
                <div key={widget.id} className="bg-white rounded-lg p-4 border">
                  <BarChart3 className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="font-medium">{widget.name}</p>
                  <p className="text-sm text-gray-500">{widget.description}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Customization Options */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <select 
            value={state.visualizationConfig.theme}
            onChange={(e) => setState((prev: OnboardingState) => ({
              ...prev,
              visualizationConfig: {
                ...prev.visualizationConfig,
                theme: e.target.value as 'light' | 'dark'
              }
            }))}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Brand Color</label>
          <input
            type="color"
            value={state.visualizationConfig.primaryColor}
            onChange={(e) => setState((prev: OnboardingState) => ({
              ...prev,
              visualizationConfig: {
                ...prev.visualizationConfig,
                primaryColor: e.target.value
              }
            }))}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Widget Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dashboard Widgets</h3>
        <div className="grid grid-cols-2 gap-3">
          {state.visualizationConfig.dashboardWidgets.map((widget: DashboardWidget) => (
            <label key={widget.id} className="border rounded-lg p-3 cursor-pointer hover:border-blue-500">
              <input
                type="checkbox"
                checked={widget.enabled}
                onChange={(e) => updateWidget(widget.id, e.target.checked)}
                className="mr-2"
              />
              <span className="font-medium">{widget.name}</span>
              <p className="text-xs text-gray-500 ml-6">{widget.description}</p>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewStep({ state, onLaunch, onSave, user }: any) {
  const enabledIntegrations = state.integrations.filter((i: Integration) => i.connectionStatus === 'connected')
  const enabledWorkflows = state.workflows.filter((w: Workflow) => w.enabled)
  const enabledAuthMethods = state.authConfig.methods.filter((m: AuthMethod) => m.enabled)
  const enabledWidgets = state.visualizationConfig.dashboardWidgets.filter((w: DashboardWidget) => w.enabled)
  
  const [showCodeGeneration, setShowCodeGeneration] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [codeLines, setCodeLines] = useState<string[]>([])
  const [currentCodeLine, setCurrentCodeLine] = useState(0)
  const [typingText, setTypingText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [isGenerationComplete, setIsGenerationComplete] = useState(false)
  
  const generationSteps = [
    { title: "Analyzing requirements", description: "Processing your configuration", icon: Brain, color: "blue" },
    { title: "Generating database schema", description: "Creating Prisma models", icon: FileText, color: "purple" },
    { title: "Building API routes", description: "Setting up REST endpoints", icon: Link2, color: "green" },
    { title: "Creating UI components", description: "Generating React components", icon: Palette, color: "pink" },
    { title: "Configuring authentication", description: "Setting up auth system", icon: Lock, color: "orange" },
    { title: "Deploying application", description: "Launching your app", icon: Rocket, color: "indigo" }
  ]
  
  const codeToWrite = [
    "const app = new AppGenerator(config);",
    "await app.generateDatabase();",
    "await app.generateAPI();",
    "await app.generateUI();",
    "await app.deploy();",
    "✓ App generated successfully!"
  ]
  
  const detailedSteps = [
    "📁 Creating output directory...",
    "✓ Output directory created",
    "🏗️ Starting app generation...",
    "🚀 Generating custom application based on YAML configuration...",
    "📊 Config summary: {",
    "  appName: 'e-commerce-app',",
    "  verticalName: 'E-commerce',",
    "  businessName: 'E-commerce',",
    "  modelCount: 1,",
    "  workflowCount: 3,",
    "  integrationCount: 2",
    "}",
    "📁 Creating directories...",
    "✓ Directories created",
    "🔧 Generating Prisma schema...",
    "📊 Custom Prisma schema generated",
    "✓ Prisma schema generated",
    "🎨 Generating app layout...",
    "🎨 Custom app layout generated",
    "✓ App layout generated",
    "📄 Generating main page...",
    "📄 Custom main page generated",
    "✓ Main page generated",
    "🧩 Generating dashboard components...",
    "🧩 Custom dashboard components generated",
    "✓ Dashboard components generated",
    "🔌 Generating API routes...",
    "🔌 Custom API routes generated",
    "✓ API routes generated",
    "📊 Generating data pages...",
    "📄 Custom data pages generated",
    "✓ Data pages generated",
    "🛠️ Generating utility files...",
    "🎨 Custom utility files generated",
    "✓ Utility files generated",
    "🔐 Generating authentication system...",
    "🔐 Authentication system generated",
    "✓ Authentication system generated",
    "🔗 Generating integration configurations...",
    "🔌 Integration configurations generated",
    "✓ Integration configurations generated",
    "📦 Generating package.json...",
    "📦 Custom package.json generated",
    "✓ Package.json generated",
    "🎨 Generating Tailwind config...",
    "🎨 Tailwind config generated",
    "🎨 PostCSS config generated",
    "✓ Tailwind and PostCSS configs generated",
    "📝 Generating TypeScript config...",
    "📑 TypeScript config generated",
    "✓ TypeScript config generated",
    "🔧 Generating environment config...",
    "🌍 Environment configuration generated",
    "✓ Environment config generated",
    "🚀 Generating deployment config...",
    "🚀 Deployment configuration generated",
    "✓ Deployment config generated",
    "📚 Generating README...",
    "📖 Custom README generated",
    "✓ README generated",
    "✓ Custom application generation completed!",
    "✓ App generation completed",
    "🚀 Auto-starting app on port 6047...",
    "📦 Installing dependencies...",
    "✓ Dependencies installed",
    "🌐 App is now running at http://localhost:6047",
    "✓ App generated successfully!"
  ]
  
  const typeText = async (text: string, speed: number = 50) => {
    setIsTyping(true)
    setTypingText("")
    for (let i = 0; i < text.length; i++) {
      setTypingText(text.slice(0, i + 1))
      await new Promise(resolve => setTimeout(resolve, speed))
    }
    setIsTyping(false)
  }
  
  const handleLaunch = async () => {
    // Prevent multiple launches
    if (showTerminal) return
    
    setShowTerminal(true)
    setGenerationStep(0)
    setCodeLines([])
    setCurrentCodeLine(0)
    setTypingText("")
    setIsGenerationComplete(false)
    
    try {
      // Start with the main code
      for (let i = 0; i < codeToWrite.length; i++) {
        await typeText(codeToWrite[i], 30) // Type each line
        setCodeLines(prev => {
          // Check if line already exists to prevent duplicates
          if (prev.includes(codeToWrite[i])) return prev
          return [...prev, codeToWrite[i]]
        })
        setCurrentCodeLine(i + 1)
        await new Promise(resolve => setTimeout(resolve, 200)) // Pause between lines
      }
      
      // Add detailed generation steps
      for (let i = 0; i < detailedSteps.length; i++) {
        await typeText(detailedSteps[i], 20) // Faster typing for detailed steps
        setCodeLines(prev => {
          // Check if line already exists to prevent duplicates
          if (prev.includes(detailedSteps[i])) return prev
          return [...prev, detailedSteps[i]]
        })
        setCurrentCodeLine(codeToWrite.length + i + 1)
        await new Promise(resolve => setTimeout(resolve, 100)) // Shorter pause between detailed steps
      }
      
      // Simulate generation steps
      for (let i = 0; i < generationSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600))
        setGenerationStep(i + 1)
      }
      
      // Final completion
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mark generation as complete
      setIsGenerationComplete(true)
      
      // Call the actual launch function
      await onLaunch()
      
      // Reset terminal state after successful launch
      setTimeout(() => {
        setShowTerminal(false)
      }, 2000) // Give user time to see the completion message
      
    } catch (error) {
      console.error('Launch error:', error)
      // Reset state on error
      setShowTerminal(false)
      setGenerationStep(0)
      setCodeLines([])
      setCurrentCodeLine(0)
      setTypingText("")
      setIsGenerationComplete(false)
    }
  }

  return (
    <div className="space-y-8">
  

    {/* Enhanced Launch Options */}
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-8 shadow-xl">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/25">
          <Rocket className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Ready to Launch!</h3>
          <p className="text-lg text-gray-700 leading-relaxed">
            Your application is configured and ready. Choose how you want to proceed:
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generate & Launch App */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-200/50"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/25">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Generate & Launch App</h4>
          </div>
          <p className="text-gray-600 mb-4">
            Test your app immediately with a temporary deployment. No registration required.
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Instant preview deployment
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              No account needed
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Test all features
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Temporary URL (24 hours)
            </li>
          </ul>
          <motion.button
            onClick={handleLaunch}
            disabled={showTerminal}
            className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              showTerminal
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105'
            }`}
            whileHover={!showTerminal ? { scale: 1.02 } : {}}
            whileTap={!showTerminal ? { scale: 0.98 } : {}}
          >
            {showTerminal ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mr-3" />
                <span>Generating...</span>
              </div>
            ) : (
              <>
                <Rocket className="w-5 h-5 mr-3" />
                Generate & Launch App
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Save to Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-200/50"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-purple-500/25">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Save to Dashboard</h4>
          </div>
          <p className="text-gray-600 mb-4">
            Save your configuration and deploy when you're ready. Requires account.
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Save configuration
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Deploy when ready
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Full account access
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Manage multiple apps
            </li>
          </ul>
          <motion.button
            onClick={onSave}
            disabled={state.isSaving}
            className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              state.isSaving
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105'
            }`}
            whileHover={!state.isSaving ? { scale: 1.02 } : {}}
            whileTap={!state.isSaving ? { scale: 0.98 } : {}}
          >
            {state.isSaving ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mr-3" />
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <Settings className="w-5 h-5 mr-3" />
                Save to Dashboard
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>

    {/* Success Message */}
    {state.deploymentResult && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-bold text-lg">App Launched Successfully!</p>
            <p className="text-green-700">
              Your application is now running at: <a href={state.deploymentResult.url} target="_blank" rel="noopener noreferrer" className="underline font-medium">{state.deploymentResult.url}</a>
            </p>
          </div>
        </div>
      </motion.div>
    )}

    {/* Launch Section */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-200/50 mt-6"
    >
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/25">
          <Rocket className="w-6 h-6 text-white" />
        </div>
        <h4 className="text-xl font-bold text-gray-900">Launch!</h4>
      </div>
      <p className="text-gray-600 mb-6">
        Review your configuration and generate your application locally.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Connected Integrations */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200/50">
          <h5 className="font-semibold text-gray-900 mb-3">Connected Integrations</h5>
          <div className="space-y-2">
            {state.integrations.filter(i => i.connectionStatus === 'connected').map(integration => (
              <div key={integration.id} className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                {integration.name}
              </div>
            ))}
          </div>
        </div>

        {/* Active Workflows */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200/50">
          <h5 className="font-semibold text-gray-900 mb-3">Active Workflows</h5>
          <div className="space-y-2">
            {state.workflows.filter(w => w.enabled).map(workflow => (
              <div key={workflow.id} className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                {workflow.name}
              </div>
            ))}
          </div>
        </div>

        {/* Expected Impact */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200/50">
          <h5 className="font-semibold text-gray-900 mb-3">Expected Impact</h5>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$15K</div>
              <div className="text-xs text-gray-500">Annual Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">20hrs</div>
              <div className="text-xs text-gray-500">Weekly Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">2min</div>
              <div className="text-xs text-gray-500">To Go Live</div>
            </div>
          </div>
        </div>
      </div>

      <motion.button
        onClick={onLaunch}
        disabled={state.isDeploying}
        className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
          state.isDeploying
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105'
        }`}
        whileHover={!state.isDeploying ? { scale: 1.02 } : {}}
        whileTap={!state.isDeploying ? { scale: 0.98 } : {}}
      >
        {state.isDeploying ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mr-3" />
            <span>Launching...</span>
          </div>
        ) : (
          <>
            <Rocket className="w-5 h-5 mr-3" />
            Launch!
          </>
        )}
      </motion.button>
    </motion.div>

  </div>
)
}