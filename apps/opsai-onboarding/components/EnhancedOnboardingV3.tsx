'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, Brain, CheckCircle, AlertCircle, Plus, FileText, 
  Sparkles, Shield, Palette, Rocket, ArrowLeft, ArrowRight,
  Link2, Workflow, Lock, BarChart3, Settings, Eye, Edit2
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
}

const STEPS = [
  { id: 'analysis', label: 'AI Analysis', icon: Brain },
  { id: 'integrations', label: 'Connect Services', icon: Link2 },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'auth', label: 'Authentication', icon: Lock },
  { id: 'visualization', label: 'Dashboard', icon: BarChart3 },
  { id: 'review', label: 'Launch', icon: Rocket }
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
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const mockAnalysis = {
        businessType: 'E-commerce',
        monthlyRevenue: 125000,
        employeeCount: 12,
        techStack: ['node', 'react', 'postgres'],
        detectedSystems: [
          { name: 'Shopify', type: 'E-commerce', confidence: 95 },
          { name: 'Stripe', type: 'Payment', confidence: 90 },
          { name: 'Mailchimp', type: 'Email Marketing', confidence: 85 },
          { name: 'Google Analytics', type: 'Analytics', confidence: 88 },
          { name: 'Slack', type: 'Communication', confidence: 75 }
        ]
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

      // Generate AI workflows
      const aiWorkflows: Workflow[] = [
        {
          id: 'auto-1',
          name: 'Order Fulfillment Automation',
          description: 'Order placed → Update inventory → Send shipping notice → Update analytics',
          enabled: true,
          editable: true,
          triggers: ['shopify.order.created'],
          actions: ['inventory.update', 'email.send', 'slack.notify', 'analytics.track'],
          category: 'ai_generated'
        },
        {
          id: 'auto-2',
          name: 'Customer Retention Flow',
          description: 'Purchase → Wait 7 days → Send review request → Track engagement',
          enabled: true,
          editable: true,
          triggers: ['shopify.order.fulfilled'],
          actions: ['wait.7days', 'email.review', 'analytics.track'],
          category: 'ai_generated'
        },
        {
          id: 'auto-3',
          name: 'Low Stock Alert',
          description: 'Inventory < 10 units → Alert team → Create reorder suggestion',
          enabled: true,
          editable: true,
          triggers: ['inventory.low'],
          actions: ['slack.alert', 'email.send', 'quickbooks.purchase_order'],
          category: 'ai_generated'
        }
      ]

      // Generate dashboard widgets
      const widgets: DashboardWidget[] = [
        { id: 'revenue', name: 'Revenue Overview', description: 'Real-time revenue tracking', enabled: true, category: 'financial' },
        { id: 'orders', name: 'Order Pipeline', description: 'Order status and fulfillment', enabled: true, category: 'operations' },
        { id: 'inventory', name: 'Inventory Levels', description: 'Stock levels and alerts', enabled: true, category: 'operations' },
        { id: 'customers', name: 'Customer Analytics', description: 'Customer behavior and segments', enabled: true, category: 'analytics' },
        { id: 'marketing', name: 'Marketing Performance', description: 'Campaign ROI and metrics', enabled: true, category: 'marketing' }
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
        throw new Error('Failed to setup Airbyte connection')
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
      // Create temporary deployment without authentication
      const response = await fetch('/api/deploy-temp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            businessAnalysis: state.businessAnalysis,
            integrations: state.integrations,
            workflows: state.workflows,
            auth: state.authConfig,
            visualization: state.visualizationConfig
          },
          websiteUrl: state.websiteUrl
        })
      })

      if (!response.ok) {
        throw new Error('Failed to deploy temporary application')
      }

      const result = await response.json()
      
      // Store deployment info for potential later saving
      sessionStorage.setItem('tempDeployment', JSON.stringify({
        ...result,
        onboardingState: state
      }))

      // Redirect to deployed app in new tab
      window.open(result.url, '_blank')
      
      // Show success state
      setState(prev => ({ 
        ...prev, 
        isDeploying: false,
        deploymentResult: result
      }))
    } catch (error) {
      console.error('Temporary deployment failed:', error)
      setState(prev => ({ ...prev, isDeploying: false }))
    }
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
        console.log('🗗 Organizing database with collected sample data...')
        try {
          const response = await fetch('/api/organize-database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId: 'default' })
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('✅ Database organized:', result)
          }
        } catch (error) {
          console.error('Failed to organize database:', error)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Progress Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Create Your Application</h1>
            <div className="text-sm text-gray-600">
              {state.businessAnalysis && (
                <span>Building for: <strong>{state.businessAnalysis.businessType}</strong></span>
              )}
            </div>
          </div>
          
          {/* Step Progress */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = index === state.currentStep
              const isCompleted = index < state.currentStep
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${isActive ? 'bg-blue-600 text-white' : ''}
                      ${isCompleted ? 'bg-green-600 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                    `}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 transition-colors ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))}
            disabled={state.currentStep === 0 || state.isDeploying}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              state.currentStep === 0 || state.isDeploying
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          {state.currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNextStep}
              disabled={!canProceed() || state.isDeploying}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                canProceed() && !state.isDeploying
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <div className="text-sm text-gray-500">
              Choose an option above to continue
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
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center max-w-2xl mx-auto">
        <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Let's analyze your business</h2>
        <p className="text-lg text-gray-600 mb-8">
          Our AI will scan your website to understand your business model, 
          detect your existing systems, and create a custom integration plan.
        </p>

        <div className="mb-8">
          <label className="block text-left text-sm font-medium text-gray-700 mb-2">
            Your Website URL
          </label>
          <div className="flex items-center bg-gray-50 rounded-lg p-2">
            <Globe className="w-5 h-5 text-gray-400 ml-3 mr-3" />
            <input
              type="url"
              value={state.websiteUrl}
              onChange={(e) => onUpdateUrl(e.target.value)}
              placeholder="https://yourcompany.com"
              className="flex-1 bg-transparent text-lg outline-none py-2"
            />
          </div>
        </div>

        <button
          onClick={onAnalyze}
          disabled={!state.websiteUrl || state.isAnalyzing}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-colors ${
            state.websiteUrl && !state.isAnalyzing
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {state.isAnalyzing ? (
            <>
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
              AI is analyzing your business...
            </>
          ) : (
            <>
              <Brain className="inline w-5 h-5 mr-2" />
              Start AI Analysis
            </>
          )}
        </button>

        {state.isAnalyzing && (
          <div className="mt-8 space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center text-green-600"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Detected e-commerce platform
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="flex items-center text-green-600"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Found payment processor
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 }}
              className="flex items-center text-green-600"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Discovered 5 integration opportunities
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

function IntegrationsStep({ state, onConnect }: any) {
  const detectedConnections = state.integrations.filter((i: Integration) => i.status === 'detected')
  const suggestedConnections = state.integrations.filter((i: Integration) => i.status === 'suggested')
  const optionalConnections = state.integrations.filter((i: Integration) => i.status === 'optional')
  
  // Group integrations by type for better organization
  const groupByType = (integrations: Integration[]) => {
    return integrations.reduce((groups: any, integration) => {
      const type = integration.type || 'Other'
      if (!groups[type]) groups[type] = []
      groups[type].push(integration)
      return groups
    }, {})
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-2">Connect Your Real Services</h2>
        <p className="text-gray-600 mb-6">
          Connect your actual business services using OAuth. All connections are secure and use your real credentials.
        </p>


        {/* Detected Integrations */}
        {detectedConnections.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Eye className="w-5 h-5 text-blue-500 mr-2" />
              Detected on Your Website
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {detectedConnections.map((integration: Integration) => (
                <IntegrationCard 
                  key={integration.id} 
                  integration={integration} 
                  onConnect={() => onConnect(integration.id)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Suggested Integrations */}
        {suggestedConnections.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Sparkles className="w-5 h-5 text-purple-500 mr-2" />
              Recommended for Your Business
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {suggestedConnections.map((integration: Integration) => (
                <IntegrationCard 
                  key={integration.id} 
                  integration={integration} 
                  onConnect={() => onConnect(integration.id)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Optional Integrations */}
        {optionalConnections.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Plus className="w-5 h-5 text-gray-500 mr-2" />
              Additional Integrations
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {optionalConnections.map((integration: Integration) => (
                <IntegrationCard 
                  key={integration.id} 
                  integration={integration} 
                  onConnect={() => onConnect(integration.id)} 
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Summary */}
      {state.integrations.some(i => i.connectionStatus === 'connected') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center text-green-800">
            <CheckCircle className="w-5 h-5 mr-2" />
            Great! You've connected some services. You can proceed or connect more integrations.
          </div>
        </motion.div>
      )}
    </div>
  )
}

function IntegrationCard({ integration, onConnect }: { integration: Integration, onConnect: () => void }) {
  const getStatusColor = () => {
    switch (integration.connectionStatus) {
      case 'connected': return 'bg-green-50 border-green-200'
      case 'connecting': return 'bg-blue-50 border-blue-200'
      case 'error': return 'bg-red-50 border-red-200'
      default: return 'bg-white border-gray-200'
    }
  }

  const getStatusBadge = () => {
    switch (integration.status) {
      case 'detected': return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Detected</span>
      case 'suggested': return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">Recommended</span>
      case 'optional': return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">Optional</span>
      default: return null
    }
  }

  return (
    <div className={`border rounded-lg p-6 transition-colors ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center text-2xl">
            {integration.logo || <Link2 className="w-6 h-6 text-gray-600" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-lg">{integration.name}</h4>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-gray-600">{integration.value}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500">{integration.type}</span>
              {integration.estimatedTime && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">⏱️ {integration.estimatedTime}</span>
                </>
              )}
              {integration.confidence && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-green-600">{integration.confidence}% match</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {integration.connectionStatus === 'connected' ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              Connected
            </div>
          ) : integration.connectionStatus === 'connecting' ? (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2" />
              Connecting...
            </div>
          ) : (
            <button
              onClick={onConnect}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect ({integration.estimatedTime})
            </button>
          )}
        </div>
      </div>
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
                checked={enabled}
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-2">Ready to Launch!</h2>
        <p className="text-gray-600 mb-6">
          Review your configuration and launch your application.
        </p>

        {/* Configuration Summary */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="font-semibold mb-3">Integrations</h3>
            <div className="space-y-2">
              {enabledIntegrations.map((int: Integration) => (
                <div key={int.id} className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  {int.name}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Workflows</h3>
            <div className="space-y-2">
              {enabledWorkflows.slice(0, 5).map((wf: Workflow) => (
                <div key={wf.id} className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  {wf.name}
                </div>
              ))}
              {enabledWorkflows.length > 5 && (
                <p className="text-sm text-gray-500">+{enabledWorkflows.length - 5} more</p>
              )}
            </div>
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold mb-4">Expected Impact</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">$15K</div>
              <div className="text-sm text-gray-600">Annual Savings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">20hrs</div>
              <div className="text-sm text-gray-600">Weekly Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">2min</div>
              <div className="text-sm text-gray-600">To Go Live</div>
            </div>
          </div>
        </div>
      </div>

      {/* Launch Options */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
          <Rocket className="w-5 h-5 mr-2" />
          Ready to Launch!
        </h3>
        <p className="text-blue-700 mb-6">
          Your application is configured and ready. Choose how you want to proceed:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Launch App Option */}
          <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
            <div className="flex items-center mb-3">
              <Eye className="w-6 h-6 text-blue-600 mr-2" />
              <h4 className="font-semibold text-lg">Launch App</h4>
            </div>
            <p className="text-gray-600 mb-4">
              Test your app immediately with a temporary deployment. No registration required.
            </p>
            <ul className="text-sm text-gray-500 mb-4 space-y-1">
              <li>• Instant preview deployment</li>
              <li>• No account needed</li>
              <li>• Test all features</li>
              <li>• Temporary URL (24 hours)</li>
            </ul>
            <button
              onClick={onLaunch}
              disabled={state.isDeploying}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                !state.isDeploying
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {state.isDeploying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Launching...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Launch App Now
                </>
              )}
            </button>
          </div>

          {/* Save to Profile Option */}
          <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
            <div className="flex items-center mb-3">
              <Settings className="w-6 h-6 text-purple-600 mr-2" />
              <h4 className="font-semibold text-lg">Save to Dashboard</h4>
            </div>
            <p className="text-gray-600 mb-4">
              Save your app to your dashboard for ongoing management and updates.
            </p>
            <ul className="text-sm text-gray-500 mb-4 space-y-1">
              <li>• Permanent deployment</li>
              <li>• Custom domain support</li>
              <li>• Ongoing updates</li>
              <li>• Analytics & monitoring</li>
            </ul>
            <button
              onClick={onSave}
              disabled={state.isSaving}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                !state.isSaving
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {state.isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  {user ? 'Save to Dashboard' : 'Sign Up & Save'}
                </>
              )}
            </button>
          </div>
        </div>
        
        {state.deploymentResult && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800 mb-2">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-semibold">App Launched Successfully!</span>
            </div>
            <p className="text-green-700 mb-3">
              Your app is now live and ready to test. You can save it to your dashboard anytime.
            </p>
            <div className="flex items-center gap-4">
              <a
                href={state.deploymentResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-700 hover:text-green-900"
              >
                <Eye className="w-4 h-4 mr-1" />
                View App
              </a>
              <span className="text-green-600">•</span>
              <span className="text-sm text-green-600">
                Available for 24 hours
              </span>
            </div>
          </div>
        )}
      </div>
      
    </div>
  )
}