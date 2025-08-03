'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SmartOnboardingV3 } from '@/components/SmartOnboardingV3'
import { ComprehensiveSuccessPage } from '@/components/ComprehensiveSuccessPage'
import { toast } from 'sonner'

export default function OnboardingV3Page() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const websiteUrl = searchParams.get('url') || ''
  const mockMode = searchParams.get('mock') === 'true'
  
  const [isComplete, setIsComplete] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<any>(null)

  const handleOnboardingComplete = async (config: any) => {
    console.log('Onboarding completed with config:', config)
    
    try {
      // Generate the custom application based on business analysis
      const response = await fetch('/api/generate-custom-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfile: config.businessProfile,
          integrations: config.integrations,
          features: config.features,
          userId: null, // Not logged in yet
          isAuthenticated: false // Will require login for full features
        })
      })

      const responseData = await response.json()
      
      if (response.ok && responseData.success) {
        const appData = responseData
        
        // Create deployment result for success page
        const result = {
          appId: `app-${Date.now()}`,
          deploymentId: `deploy-${Date.now()}`,
          url: appData.appUrl,
          platform: 'local',
          environment: 'development',
          adminCredentials: {
            email: 'admin@example.com',
            password: 'admin123',
            dashboardUrl: appData.adminUrl
          },
          monitoring: {
            sentryDsn: 'mock-sentry-dsn',
            posthogApiKey: 'mock-posthog-key'
          },
          apiKeys: {
            supabaseUrl: 'https://mock.supabase.co',
            supabaseAnonKey: 'mock-anon-key',
            supabaseServiceKey: 'mock-service-key'
          },
          integrations: config.integrations.map((name: string) => ({
            provider: name,
            status: 'connected' as const,
            syncEnabled: true
          })),
          documentation: {
            apiDocsUrl: `${appData.appUrl}/api-docs`,
            readmeUrl: `${appData.appUrl}/readme`,
            postmanCollectionUrl: `${appData.appUrl}/postman`
          }
        }
        
        setDeploymentResult(result)
        setIsComplete(true)
        toast.success('Your dashboard is ready! 🎉')
      } else {
        console.error('API response error:', responseData)
        const errorMessage = responseData.details || responseData.error || 'Failed to generate application'
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete setup'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  const handleSetupMonitoring = () => {
    console.log('Setup monitoring clicked')
    toast.info('Monitoring setup coming soon!')
  }

  const handleViewDashboard = () => {
    if (deploymentResult?.adminCredentials?.dashboardUrl) {
      window.open(deploymentResult.adminCredentials.dashboardUrl, '_blank')
    }
  }

  const handleContactSupport = () => {
    console.log('Contact support clicked')
    toast.info('Support feature coming soon!')
  }

  if (isComplete && deploymentResult) {
    return (
      <ComprehensiveSuccessPage
        deploymentResult={deploymentResult}
        onSetupMonitoring={handleSetupMonitoring}
        onViewDashboard={handleViewDashboard}
        onContactSupport={handleContactSupport}
      />
    )
  }

  return (
    <SmartOnboardingV3
      onComplete={handleOnboardingComplete}
      initialUrl={websiteUrl}
      mockMode={mockMode}
    />
  )
}