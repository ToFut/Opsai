'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductionOnboarding from '@/components/ProductionOnboarding'

function OnboardingContent() {
  const searchParams = useSearchParams()
  const websiteUrl = searchParams.get('url') || ''
  const step = searchParams.get('step') || ''
  const oauthSuccess = searchParams.get('oauth_success') === 'true'
  const oauthProvider = searchParams.get('provider') || ''
  const oauthError = searchParams.get('oauth_error') === 'true'
  const errorMessage = searchParams.get('error_message') || ''

  return (
    <ProductionOnboarding 
      initialUrl={websiteUrl}
      initialStep={step}
      oauthSuccess={oauthSuccess}
      oauthProvider={oauthProvider}
      oauthError={oauthError}
      oauthErrorMessage={errorMessage}
      onComplete={(config) => {
        console.log('Onboarding completed:', config)
        // Handle completion - could redirect to dashboard or show success
      }}
    />
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div><p className="text-gray-600">Loading...</p></div></div>}>
      <OnboardingContent />
    </Suspense>
  )
} 