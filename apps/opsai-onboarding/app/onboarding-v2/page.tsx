'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SmartOnboardingV2 } from '@/components/SmartOnboardingV2'
import { ComprehensiveSuccessPage } from '@/components/ComprehensiveSuccessPage'
import { toast } from 'sonner'

export default function OnboardingV2Page() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const websiteUrl = searchParams.get('url') || ''
  const mockMode = searchParams.get('mock') === 'true'
  
  const [isComplete, setIsComplete] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<any>(null)

  const handleOnboardingComplete = async (config: any) => {
    console.log('Onboarding completed with config:', config)
    
    try {
      // Generate the application
      const response = await fetch('/api/generate-local-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: config.businessProfile.businessName,
          businessProfile: config.businessProfile,
          dataModels: config.analysisResults?.recommendedIntegrations?.map((int: any) => ({
            name: int.name.toLowerCase().replace(/\s+/g, '_'),
            description: `Data from ${int.name}`,
            fields: [
              { name: 'id', type: 'string', required: true },
              { name: 'name', type: 'string', required: true },
              { name: 'created_at', type: 'date', required: true }
            ]
          })) || [],
          integrations: config.integrations.map((name: string) => ({
            provider: name,
            businessValue: `${name} integration for data sync`
          })),
          port: 8991
        })
      })

      if (response.ok) {
        const appData = await response.json()
        
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
            sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
            posthogApiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || ''
          },
          apiKeys: {
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvwmnmwzrpftufjpojvb.supabase.co',
            supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || ''
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
        throw new Error('Failed to generate application')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error('Failed to complete setup. Please try again.')
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
    <SmartOnboardingV2
      onComplete={handleOnboardingComplete}
      initialUrl={websiteUrl}
      mockMode={mockMode}
    />
  )
}