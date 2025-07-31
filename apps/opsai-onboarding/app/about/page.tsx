import Link from 'next/link'
import { Brain, Users, Globe, Award, TrendingUp, Shield } from 'lucide-react'

export default function AboutPage() {
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
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/careers" className="text-gray-600 hover:text-gray-900">Careers</Link>
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</Link>
            <Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link>
            <Link href="/" className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <div className="pt-32 pb-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Unifying Business Intelligence
              <br />
              <span className="bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                Since 2019
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We started OPSAI with a simple mission: eliminate the chaos of disconnected business systems. 
              Today, we're the leading AI-powered platform trusted by over 10,000 businesses worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="py-16 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-gray-400">Businesses Unified</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-gray-400">Software Integrations</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">$2.4B</div>
              <div className="text-gray-400">In Business Savings</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-gray-400">Uptime SLA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leadership Team */}
      <div className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Leadership Team</h2>
            <p className="text-xl text-gray-600">Meet the team building the future of business intelligence</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900">Sarah Chen</h3>
              <p className="text-gray-600 mb-2">CEO & Co-Founder</p>
              <p className="text-sm text-gray-500">Former VP Engineering at Salesforce. Stanford CS, 15+ years building enterprise software.</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900">Marcus Rodriguez</h3>
              <p className="text-gray-600 mb-2">CTO & Co-Founder</p>
              <p className="text-sm text-gray-500">Ex-Google AI Research. MIT PhD, led teams building ML systems for Fortune 500 companies.</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900">Emily Johnson</h3>
              <p className="text-gray-600 mb-2">VP of Product</p>
              <p className="text-sm text-gray-500">Former Product Director at Microsoft. Harvard MBA, expert in enterprise workflow optimization.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customer-First</h3>
              <p className="text-gray-600">Every decision starts with how it impacts our customers' success. Their growth is our growth.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Continuous Innovation</h3>
              <p className="text-gray-600">We're constantly pushing boundaries in AI and automation to solve tomorrow's business challenges today.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Security & Trust</h3>
              <p className="text-gray-600">Your business data is sacred. We maintain the highest security standards and transparency in everything we do.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="py-24 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl text-gray-300 mb-8">Join thousands of companies who trust OPSAI with their operations</p>
          <button className="bg-white text-black px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors">
            Schedule a Demo
          </button>
        </div>
      </div>
    </div>
  )
} 