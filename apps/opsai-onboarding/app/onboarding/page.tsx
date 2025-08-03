'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import ProductionOnboarding from '@/components/ProductionOnboarding'

export default function OnboardingPage() {
  const searchParams = useSearchParams()
  const websiteUrl = searchParams.get('url') || ''
  const step = searchParams.get('step') || ''

  return (
    <ProductionOnboarding 
      initialUrl={websiteUrl}
      initialStep={step}
      onComplete={(config) => {
        console.log('Onboarding completed:', config)
        // Handle completion - could redirect to dashboard or show success
      }}
    />
  )
} 