'use client'


export const dynamic = 'force-dynamic'
import React, { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EnhancedOnboardingV3 from '@/components/EnhancedOnboardingV3'

function OnboardingV3Content() {
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

export default function OnboardingV3Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div><p className="text-gray-600">Loading...</p></div></div>}>
      <OnboardingV3Content />
    </Suspense>
  )
}