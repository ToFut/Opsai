'use client'


export const dynamic = 'force-dynamic'
import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import UltimateOnboarding from '@/components/UltimateOnboarding'
import { ComprehensiveSuccessPage } from '@/components/ComprehensiveSuccessPage'

function UltimateOnboardingContent() {
  const searchParams = useSearchParams()
  const websiteUrl = searchParams.get('url') || ''
  const [isComplete, setIsComplete] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<any>(null)

  const handleComplete = (result: any) => {
    console.log('Ultimate onboarding completed:', result)
    setDeploymentResult(result)
    setIsComplete(true)
  }

  if (isComplete && deploymentResult) {
    return (
      <ComprehensiveSuccessPage
        deploymentResult={deploymentResult}
        onSetupMonitoring={() => window.open(`${deploymentResult.url}/monitoring`, '_blank')}
        onViewDashboard={() => window.open(deploymentResult.url, '_blank')}
        onContactSupport={() => window.location.href = '/support'}
      />
    )
  }

  return (
    <UltimateOnboarding 
      initialUrl={websiteUrl}
      onComplete={handleComplete}
    />
  )
}

export default function UltimateOnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UltimateOnboardingContent />
    </Suspense>
  )
}