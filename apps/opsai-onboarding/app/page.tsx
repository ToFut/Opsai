'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/supabase'
import { MessageCircle, Code, Rocket, Database, Globe, Zap, GitBranch, Play, ArrowRight, Search, BarChart3, Settings, Link2, Brain, ShieldCheck, Sparkles, Calculator, Clock, DollarSign, Users, Award, Building, Mail, Phone, MapPin, Plus } from 'lucide-react'

export default function HomePage() {
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [useNewOnboarding, setUseNewOnboarding] = useState<'classic' | 'v2' | 'v3' | 'enhanced-v3' | 'airbyte-v2' | 'intelligent' | 'ultimate'>('ultimate') // Default to ultimate
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await auth.getCurrentUser()
        setUser(user)
      } catch (error) {
        // Silently fail auth check - user can still use the app without auth
        console.log('Auth unavailable, continuing without authentication')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    // Add a timeout to prevent hanging on auth check
    const authTimeout = setTimeout(() => {
      console.log('Auth check timed out, continuing without authentication')
      setUser(null)
      setLoading(false)
    }, 3000)
    
    checkAuth().then(() => clearTimeout(authTimeout))
    
    return () => clearTimeout(authTimeout)
  }, [])

  const handleDiscoverSystems = async () => {
    if (!websiteUrl.trim()) {
      alert('Please enter your website URL first')
      return
    }
    
    setIsAnalyzing(true)
    
    try {
      // Start AI analysis regardless of login status
      if (user) {
        // If logged in, redirect to dashboard with analysis
        router.push(`/dashboard?analysis=${encodeURIComponent(websiteUrl)}`)
      } else {
        // If not logged in, start onboarding flow
        const onboardingPaths = {
          'classic': 'onboarding',
          'v2': 'onboarding-v2',
          'v3': 'simple', // Ultra-simple maps to /simple
          'enhanced-v3': 'test-integrations', // Use the simple working Airbyte integration
          'airbyte-v2': 'test-integrations',
          'intelligent': 'intelligent', // AI-driven intelligent onboarding
          'ultimate': 'test-integrations' // Use the simple working Airbyte integration
        }
        const onboardingPath = onboardingPaths[useNewOnboarding]
        router.push(`/${onboardingPath}?url=${encodeURIComponent(websiteUrl)}`)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-black to-gray-800 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">OPSAI</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 cursor-pointer">How it works</a>
            <a href="#roi-calculator" className="text-gray-600 hover:text-gray-900 cursor-pointer">ROI Calculator</a>
            <a href="#case-studies" className="text-gray-600 hover:text-gray-900 cursor-pointer">Case Studies</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.user_metadata?.firstName || user.email}</span>
                <Link href="/dashboard" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-20 pb-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-medium mb-6">
                <Brain className="w-4 h-4 mr-2" />
                Next-Gen AI Business Analysis
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {user ? (
                  <>
                    Welcome Back,
                    <br />
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {user.user_metadata?.firstName || 'Developer'}!
                    </span>
                  </>
                ) : (
                  <>
                    Stop Juggling
                    <br />
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      100 Different Systems
                    </span>
                  </>
                )}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {user ? (
                  'Ready to continue building amazing applications? Access your dashboard or start a new project.'
                ) : (
                  'Just enter your website URL. Our advanced AI analyzes your business model, identifies your software stack, and generates a custom unified platform with real integrations and workflows.'
                )}
              </p>
            </div>

            {/* Onboarding Version Toggle - for development */}
            <div className="mb-6 flex justify-center">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-600 font-medium text-center mb-1">Choose Onboarding Experience:</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      onClick={() => setUseNewOnboarding('ultimate')}
                      className={`px-4 py-3 rounded text-sm font-medium transition-all col-span-2 ${
                        useNewOnboarding === 'ultimate' 
                          ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white shadow-xl' 
                          : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-gray-800 hover:from-yellow-200 hover:to-orange-200 border border-orange-300'
                      }`}
                    >
                      <div className="font-bold text-lg">🔥 Ultimate</div>
                      <div className="text-xs opacity-90">Best of all - 3 modes, real data, no mocks</div>
                    </button>
                    <button
                      onClick={() => setUseNewOnboarding('classic')}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                        useNewOnboarding === 'classic' 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="font-semibold">Production</div>
                      <div className="text-xs opacity-80">Full 7-stage flow</div>
                    </button>
                    <button
                      onClick={() => setUseNewOnboarding('v2')}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                        useNewOnboarding === 'v2' 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="font-semibold">Smart V2</div>
                      <div className="text-xs opacity-80">4-phase journey</div>
                    </button>
                    <button
                      onClick={() => setUseNewOnboarding('v3')}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                        useNewOnboarding === 'v3' 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="font-semibold">Ultra Simple</div>
                      <div className="text-xs opacity-80">3 quick steps</div>
                    </button>
                    <button
                      onClick={() => setUseNewOnboarding('enhanced-v3')}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                        useNewOnboarding === 'enhanced-v3' 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="font-semibold">Enhanced V3</div>
                      <div className="text-xs opacity-80">With Supabase</div>
                    </button>
                    <button
                      onClick={() => setUseNewOnboarding('airbyte-v2')}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                        useNewOnboarding === 'airbyte-v2' 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="font-semibold">Airbyte Flow</div>
                      <div className="text-xs opacity-80">Direct integrations</div>
                    </button>
                    <button
                      onClick={() => setUseNewOnboarding('intelligent')}
                      className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                        useNewOnboarding === 'intelligent' 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="font-semibold">Intelligent</div>
                      <div className="text-xs opacity-80">AI-driven flow</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Website Input - Show for everyone */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-lg">
                <div className="flex items-center">
                  <div className="flex-1 flex items-center px-4 py-3">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                      type="url"
                      placeholder="Enter your website URL (e.g., yourcompany.com)"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="flex-1 text-lg outline-none placeholder-gray-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleDiscoverSystems()}
                    />
                  </div>
                  <button
                    onClick={handleDiscoverSystems}
                    disabled={isAnalyzing}
                    className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        AI Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Build App with Real Data
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                🚀 Ultra-simple 4-step process: Connect real integrations → AI analyzes your data → Generate custom app
              </p>
              
              {/* OR divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-gray-500 text-sm">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              
              {/* Ultra-Simple CTA */}
              <button
                onClick={() => router.push('/simple')}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg"
              >
                <Rocket className="w-6 h-6" />
                Skip Analysis - Start Building Now!
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                ⚡ Connect real Stripe, Shopify, Google Analytics in minutes
              </p>
            </div>

            {/* CTA Buttons for logged in users */}
            {user && (
              <div className="max-w-2xl mx-auto mb-12">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/dashboard"
                    className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center"
                  >
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New App
                  </button>
                </div>
              </div>
            )}

            {/* Trust Indicators */}
            <div className="text-center text-gray-500">
              <p className="mb-4">Trusted by 1,000+ businesses to consolidate their operations</p>
              <div className="flex justify-center items-center space-x-8 text-sm">
                <div className="flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Enterprise Security
                </div>
                <div className="flex items-center">
                  <Link2 className="w-4 h-4 mr-1" />
                  500+ Integrations
                </div>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-1" />
                  5-minute Setup
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See The Transformation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Watch how we turn your chaotic desktop into one powerful command center
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Before - Chaos */}
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-red-800 mb-2">Before: System Chaos</h3>
                  <p className="text-red-600">Your current nightmare</p>
                </div>
                <div className="space-y-3">
                  {[
                    'QuickBooks (Accounting)',
                    'Shopify (E-commerce)',
                    'Square (POS)',
                    'Mailchimp (Email)',
                    'Slack (Team Chat)', 
                    'Google Analytics',
                    'Facebook Ads',
                    'Excel Spreadsheets',
                    'Stripe Dashboard',
                    'Inventory System',
                    '+ 8 more apps...'
                  ].map((app, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-red-200 text-sm text-gray-700 flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      {app}
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-red-100 rounded-lg">
                  <div className="text-red-800 font-semibold">Daily Reality:</div>
                  <div className="text-red-700 text-sm mt-1">
                    • 47 browser tabs open<br/>
                    • 3 hours switching between apps<br/>
                    • Data doesn't match anywhere<br/>
                    • Can't see the big picture
                  </div>
                </div>
              </div>

              {/* After - Unity */}
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-green-800 mb-2">After: OPSAI Unity</h3>
                  <p className="text-green-600">One dashboard to rule them all</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-green-200">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-100 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-800">$127K</div>
                      <div className="text-sm text-green-600">Monthly Revenue</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-800">847</div>
                      <div className="text-sm text-green-600">Orders Today</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-800">94%</div>
                      <div className="text-sm text-green-600">Inventory Sync</div>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-800">12</div>
                      <div className="text-sm text-green-600">Alerts Active</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      All systems connected & synced
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Real-time data from everywhere
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Smart actions & automations
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-100 rounded-lg">
                  <div className="text-green-800 font-semibold">New Reality:</div>
                  <div className="text-green-700 text-sm mt-1">
                    • One dashboard, one login<br/>
                    • Save 15+ hours per week<br/>
                    • Perfect data accuracy<br/>
                    • Make smarter decisions faster
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            {user ? 'Ready to Build More?' : 'Ready to Unify Your Business?'}
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {user 
              ? 'Continue creating amazing applications with AI-powered insights and improvements.'
              : 'Join 1,000+ businesses who\'ve eliminated system chaos and boosted productivity by 40%'
            }
          </p>
          
          {/* Website Input - Show for everyone */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white/10 border border-gray-700 rounded-2xl p-2">
              <div className="flex items-center">
                <div className="flex-1 flex items-center px-4 py-3">
                  <Globe className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="url"
                    placeholder="Enter your website URL to get started"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="flex-1 text-lg outline-none bg-transparent text-white placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleDiscoverSystems()}
                  />
                </div>
                <button
                  onClick={handleDiscoverSystems}
                  className="bg-white text-black px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Start Discovery
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Free analysis • No credit card required • 5-minute setup
            </p>
          </div>

          {/* Login/Register CTA */}
          <div className="flex justify-center space-x-4">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-white text-black px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="bg-white text-black px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  Login to Dashboard
                </Link>
                <Link
                  href="/signup"
                  className="bg-transparent border border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-black transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}