'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth, supabase } from '@/lib/supabase'
import AuthForm from '@/components/auth/AuthForm'

const SignupPage: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const { user } = await auth.getCurrentUser()
        if (user) {
          handlePostSignup(user)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handlePostSignup = async (user: any) => {
    // Check if this is from onboarding flow
    if (redirect === 'onboarding-complete') {
      // First check for temp deployment to save
      const tempDeployment = sessionStorage.getItem('tempDeployment')
      if (tempDeployment) {
        try {
          const deployment = JSON.parse(tempDeployment)
          const state = deployment.onboardingState
          
          // Create application with temp deployment info
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
              deployment_url: deployment.url,
              status: 'deployed'
            })
            .select()
            .single()

          if (!error && app) {
            sessionStorage.removeItem('tempDeployment')
            sessionStorage.removeItem('onboardingState')
            router.push(`/dashboard?saved=${app.id}`)
            return
          }
        } catch (error) {
          console.error('Failed to save temp deployment:', error)
        }
      }
      
      // Fallback to saved onboarding state
      const savedState = sessionStorage.getItem('onboardingState')
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          
          // Create application with saved configuration
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
              status: 'deployed'
            })
            .select()
            .single()

          if (!error && app) {
            sessionStorage.removeItem('onboardingState')
            router.push(`/dashboard?saved=${app.id}`)
            return
          }
        } catch (error) {
          console.error('Failed to create application:', error)
        }
      }
    }
    
    // Default redirect to dashboard
    router.push('/dashboard')
  }

  const handleSuccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await handlePostSignup(user)
    }
  }

  const handleError = (error: string) => {
    console.error('Authentication error:', error)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🚀 OpsAI
          </h1>
          <p className="text-gray-600">Join the future of AI-powered development</p>
          {redirect === 'onboarding-complete' && (
            <p className="text-sm text-indigo-600 mt-2">
              Sign up to save your application to your dashboard
            </p>
          )}
        </div>
        
        <AuthForm 
          mode="signup" 
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </div>
  )
}

export default SignupPage 