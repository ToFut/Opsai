'use client'

import { useState } from 'react'
import { MessageCircle, Code, Rocket, Database, Globe, Zap, GitBranch, Play, ArrowRight, Search, BarChart3, Settings, Link2, Brain, ShieldCheck, Sparkles } from 'lucide-react'
import ChatInterface from '@/components/ChatInterface'
import VisualBuilder from '@/components/VisualBuilder'

export default function HomePage() {
  const [buildMode, setBuildMode] = useState<'chat' | 'visual' | null>(null)
  const [websiteUrl, setWebsiteUrl] = useState('')

  if (buildMode === 'chat') {
    return <ChatInterface onBack={() => setBuildMode(null)} />
  }

  if (buildMode === 'visual') {
    return <VisualBuilder onBack={() => setBuildMode(null)} />
  }

  const handleDiscoverSystems = () => {
    if (!websiteUrl) {
      alert('Please enter your website URL first')
      return
    }
    // This would integrate with system discovery
    setBuildMode('chat')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-black to-gray-800 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">OPSAI</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it works</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-20 pb-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Business Intelligence
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Stop Juggling
                <br />
                <span className="bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                  100 Different Systems
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Just give us your website. Our AI will discover all the software your business uses and create 
                one intelligent dashboard to control everything. No more switching between apps.
              </p>
            </div>

            {/* Website Input */}
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
                    />
                  </div>
                  <button
                    onClick={handleDiscoverSystems}
                    className="bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Discover Systems
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                ✨ We'll analyze your website and automatically detect all your business software
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => setBuildMode('chat')}
                className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Talk to AI Agent
              </button>
              <button
                onClick={() => setBuildMode('visual')}
                className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center"
              >
                <Settings className="w-5 h-5 mr-2" />
                Configure Manually
              </button>
            </div>

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

      {/* How It Works */}
      <div id="how-it-works" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              From Chaos to Control in 3 Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              No technical knowledge required. Our AI does the heavy lifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">1. AI Discovery</h3>
              <p className="text-gray-600 leading-relaxed">
                Just enter your website. Our AI scans and identifies all the software, tools, and systems your business currently uses.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Link2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">2. Smart Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                We automatically connect all your systems - CRM, accounting, inventory, marketing tools - into one unified platform.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">3. Intelligent Control</h3>
              <p className="text-gray-600 leading-relaxed">
                Get a custom dashboard that doesn't just show data - it helps you make decisions and automate actions across all systems.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Problems We Solve */}
      <div className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Stop Losing Money to System Chaos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The average business uses 87 different software tools. Here's what that costs you:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Scattered Everywhere</h3>
              <p className="text-gray-600">Customer info in 5 different systems. Inventory data doesn't match. Financial reports take days to compile.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Manual Everything</h3>
              <p className="text-gray-600">Staff switching between 10+ apps daily. Copying data manually. Human errors costing thousands monthly.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Real-Time Insights</h3>
              <p className="text-gray-600">Can't see the big picture. Making decisions with outdated data. Missing opportunities daily.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Unify Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join 1,000+ businesses who've eliminated system chaos and boosted productivity by 40%
          </p>
          
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white/10 border border-gray-700 rounded-2xl p-2">
              <div className="flex items-center">
                <div className="flex-1 flex items-center px-4 py-3">
                  <Globe className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="url"
                    placeholder="Enter your website URL to get started"
                    className="flex-1 text-lg outline-none bg-transparent text-white placeholder-gray-400"
                  />
                </div>
                <button className="bg-white text-black px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Start Discovery
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Free analysis • No credit card required • 5-minute setup
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}