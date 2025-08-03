'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Github, Chrome, ShoppingBag, CreditCard, 
  Loader2, Check, ArrowRight, Shield, Key
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Provider {
  id: string
  name: string
  icon: any
  description: string
  color: string
}

export default function OAuthCompleteDemoPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [connected, setConnected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const providers: Provider[] = [
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      description: 'Connect repositories and development data',
      color: 'bg-gray-900'
    },
    {
      id: 'google',
      name: 'Google Sheets',
      icon: Chrome,
      description: 'Access spreadsheets and drive data',
      color: 'bg-blue-600'
    },
    {
      id: 'shopify',
      name: 'Shopify',
      icon: ShoppingBag,
      description: 'Sync e-commerce and order data',
      color: 'bg-green-600'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: CreditCard,
      description: 'Import payment and subscription data',
      color: 'bg-purple-600'
    }
  ]

  const startOAuth = async (providerId: string) => {
    setLoading(providerId)
    setError(null)

    try {
      const response = await fetch('/api/oauth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          tenantId: 'demo-tenant',
          returnUrl: window.location.href
        })
      })

      const data = await response.json()

      if (data.success && data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl
      } else {
        setError(data.error || 'Failed to start OAuth')
        setLoading(null)
      }
    } catch (err) {
      setError('Failed to start OAuth process')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Complete OAuth Implementation</h1>
          <p className="text-xl text-gray-600 mb-2">
            Production-ready OAuth flow with security best practices
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              CSRF Protected
            </span>
            <span className="flex items-center gap-1">
              <Key className="w-4 h-4" />
              Encrypted State
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4" />
              Token Validation
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* OAuth Flow Diagram */}
        <Card className="p-8 mb-8 bg-white/50 backdrop-blur">
          <h2 className="text-2xl font-semibold mb-6">OAuth 2.0 Flow</h2>
          <div className="flex items-center justify-between mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">1</span>
              </div>
              <p className="text-sm">User Clicks<br />Connect</p>
            </div>
            <ArrowRight className="w-8 h-8 text-gray-400" />
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">2</span>
              </div>
              <p className="text-sm">Redirect to<br />Provider</p>
            </div>
            <ArrowRight className="w-8 h-8 text-gray-400" />
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">3</span>
              </div>
              <p className="text-sm">User<br />Authorizes</p>
            </div>
            <ArrowRight className="w-8 h-8 text-gray-400" />
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold">4</span>
              </div>
              <p className="text-sm">Exchange<br />Code</p>
            </div>
            <ArrowRight className="w-8 h-8 text-gray-400" />
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm">Store<br />Tokens</p>
            </div>
          </div>
        </Card>

        {/* Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {providers.map((provider) => {
            const Icon = provider.icon
            const isLoading = loading === provider.id
            const isConnected = connected.includes(provider.id)

            return (
              <Card
                key={provider.id}
                className={`p-6 transition-all ${
                  isConnected ? 'bg-green-50 border-green-300' : 'hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${provider.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{provider.name}</h3>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </div>
                  </div>
                  {isConnected && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Connected</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => startOAuth(provider.id)}
                  disabled={isLoading || isConnected}
                  className="w-full"
                  variant={isConnected ? 'outline' : 'default'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : isConnected ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Connected
                    </>
                  ) : (
                    <>
                      Connect {provider.name}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </Card>
            )
          })}
        </div>

        {/* Implementation Details */}
        <Card className="p-8 bg-gray-50">
          <h2 className="text-2xl font-semibold mb-4">Implementation Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">🔒 Security</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• CSRF protection with encrypted state</li>
                <li>• State validation with timestamp checks</li>
                <li>• Secure token storage in database</li>
                <li>• Token validation after exchange</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⚡ Features</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Multiple provider support</li>
                <li>• Refresh token handling</li>
                <li>• Error recovery</li>
                <li>• Extensible architecture</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🛠️ Best Practices</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Server-side token exchange</li>
                <li>• Environment-based configuration</li>
                <li>• Proper error handling</li>
                <li>• Clean redirect flow</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📦 Ready for Production</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Scalable architecture</li>
                <li>• Database token storage</li>
                <li>• Monitoring ready</li>
                <li>• Easy to extend</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}