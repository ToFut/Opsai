'use client'

import React, { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import EnhancedOnboardingV3 from '@/components/EnhancedOnboardingV3'

export default function OnboardingV3Page() {
  const searchParams = useSearchParams()
  const websiteUrl = searchParams.get('url') || ''
  const oauthStatus = searchParams.get('oauth')
  const provider = searchParams.get('provider')
  
  useEffect(() => {
    // Check if we're returning from an OAuth redirect
    if (oauthStatus === 'success' && provider) {
      console.log(`📍 Detected OAuth redirect success for ${provider}`)
      // Send a message in case the popup flow failed
      window.postMessage({
        type: 'OAUTH_SUCCESS',
        provider: provider
      }, window.location.origin)
    }
  }, [oauthStatus, provider])

  return (
    <EnhancedOnboardingV3 
      initialUrl={websiteUrl}
      onComplete={(config) => {
        console.log('Onboarding completed:', config)
      }}
    />
  )
}