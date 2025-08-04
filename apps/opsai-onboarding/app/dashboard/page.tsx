'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/supabase'
import MainDashboard from '@/components/dashboard/MainDashboard'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisUrl = searchParams.get('analysis')
  const savedAppId = searchParams.get('saved')
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [showSavedMessage, setShowSavedMessage] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await auth.getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)
        
        // If there's an analysis URL, show analysis results
        if (analysisUrl) {
          await performAnalysis(analysisUrl)
        }
        
        // If there's a saved app ID, show success message
        if (savedAppId) {
          setShowSavedMessage(true)
          // Auto-hide after 5 seconds
          setTimeout(() => setShowSavedMessage(false), 5000)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router, analysisUrl, savedAppId])

  const performAnalysis = async (url: string) => {
    setShowAnalysis(true)
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock analysis results
      const mockResults = {
        businessType: 'E-commerce',
        detectedSystems: [
          { name: 'Shopify', type: 'E-commerce', confidence: 95 },
          { name: 'Stripe', type: 'Payment', confidence: 90 },
          { name: 'Mailchimp', type: 'Email Marketing', confidence: 85 },
          { name: 'Google Analytics', type: 'Analytics', confidence: 80 },
          { name: 'Slack', type: 'Communication', confidence: 75 }
        ],
        recommendations: [
          'Unified inventory management',
          'Automated order processing',
          'Customer data synchronization',
          'Real-time analytics dashboard',
          'Automated marketing workflows'
        ],
        estimatedSavings: '$15,000/year',
        timeToImplement: '2-3 weeks'
      }
      
      setAnalysisResults(mockResults)
    } catch (error) {
      console.error('Analysis failed:', error)
    }
  }

  const handleCloseAnalysis = () => {
    setShowAnalysis(false)
    setAnalysisResults(null)
    // Remove the analysis parameter from URL
    router.replace('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success message for saved apps */}
      {showSavedMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg flex items-center max-w-sm">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium">App Saved Successfully!</p>
              <p className="text-sm">Your application has been added to your dashboard.</p>
            </div>
            <button
              onClick={() => setShowSavedMessage(false)}
              className="ml-4 text-green-400 hover:text-green-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Analysis Modal for logged-in users */}
      {showAnalysis && analysisResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">AI Analysis Results</h2>
                <button
                  onClick={handleCloseAnalysis}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Analysis completed for: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{analysisUrl}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Detected Systems */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Systems</h3>
                  <div className="space-y-3">
                    {analysisResults.detectedSystems.map((system: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{system.name}</div>
                          <div className="text-sm text-gray-500">{system.type}</div>
                        </div>
                        <div className="text-sm text-indigo-600 font-medium">
                          {system.confidence}% match
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
                  <div className="space-y-3">
                    {analysisResults.recommendations.map((rec: string, idx: number) => (
                      <div key={idx} className="flex items-start p-3 bg-green-50 rounded-lg">
                        <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-900">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Impact Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{analysisResults.estimatedSavings}</div>
                  <div className="text-sm text-gray-600">Annual Savings</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analysisResults.timeToImplement}</div>
                  <div className="text-sm text-gray-600">Implementation Time</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">15+ hrs</div>
                  <div className="text-sm text-gray-600">Weekly Time Saved</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleCloseAnalysis}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Application
                </button>
                <button
                  onClick={handleCloseAnalysis}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MainDashboard />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
} 