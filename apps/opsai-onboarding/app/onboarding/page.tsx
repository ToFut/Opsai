'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import ProductionOnboarding from '@/components/ProductionOnboarding'

export default function OnboardingPage() {
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