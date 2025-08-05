'use client'


export const dynamic = 'force-dynamic'
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import IntelligentOnboarding from '@/components/IntelligentOnboarding'
import { ComprehensiveSuccessPage } from '@/components/ComprehensiveSuccessPage'
import { TenantManager } from '@/lib/tenant-manager'

export default function IntelligentOnboardingPage() {
  const searchParams = useSearchParams()
  const websiteUrl = searchParams.get('url') || ''
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [businessInfo, setBusinessInfo] = useState<any>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(true)

  useEffect(() => {
    // Analyze website and create tenant
    const initializeOnboarding = async () => {
      try {
        // Call real AI analysis
        const response = await fetch('/api/analyze-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            url: websiteUrl,
            deepAnalysis: true,
            crawlPages: 10
          })
        })
        
        if (!response.ok) throw new Error('Analysis failed')
        
        const analysis = await response.json()
        
        // Create tenant
        const newTenantId = await TenantManager.createTenant({
          name: analysis.business?.name || 'New Business',
          industry: analysis.business?.industry || 'general',
          type: analysis.business?.type || 'b2b',
          description: analysis.business?.description,
          websiteUrl
        })
        
        setTenantId(newTenantId)
        setBusinessInfo(analysis)
        setIsAnalyzing(false)
      } catch (error) {
        console.error('Failed to initialize:', error)
        setIsAnalyzing(false)
      }
    }

    if (websiteUrl) {
      initializeOnboarding()
    }
  }, [websiteUrl])

  const handleComplete = async (result: any) => {
    console.log('Intelligent onboarding completed:', result)
    
    // Create deployment result with real integrations
    const deploymentData = {
      appId: result.appId || `app-${Date.now()}`,
      deploymentId: `deploy-${Date.now()}`,
      url: result.url || 'https://your-app.vercel.app',
      platform: 'vercel',
      environment: 'production',
      adminCredentials: {
        email: 'admin@example.com',
        password: 'Generated during deployment',
        dashboardUrl: `${result.url}/admin`
      },
      monitoring: {
        sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
        posthogApiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || ''
      },
      apiKeys: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwmnmwzrpftufjpojvb.supabase.co',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || ''
      },
      integrations: result.integrations || [],
      documentation: {
        apiDocsUrl: `${result.url}/api-docs`,
        readmeUrl: `${result.url}/readme`,
        postmanCollectionUrl: `${result.url}/postman`
      }
    }
    
    setDeploymentResult(deploymentData)
    setIsComplete(true)
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Analyzing your business...</h2>
          <p className="text-gray-600 mt-2">This AI-driven process takes just a moment</p>
        </div>
      </div>
    )
  }

  if (isComplete && deploymentResult) {
    return (
      <ComprehensiveSuccessPage
        deploymentResult={deploymentResult}
        onSetupMonitoring={() => console.log('Setup monitoring')}
        onViewDashboard={() => window.open(deploymentResult.adminCredentials.dashboardUrl, '_blank')}
        onContactSupport={() => console.log('Contact support')}
      />
    )
  }

  if (!tenantId || !businessInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Unable to analyze website</h2>
          <p className="text-gray-600 mt-2">Please go back and try again</p>
        </div>
      </div>
    )
  }

  return (
    <IntelligentOnboarding 
      tenantId={tenantId}
      businessInfo={businessInfo}
      onComplete={handleComplete}
    />
  )
}