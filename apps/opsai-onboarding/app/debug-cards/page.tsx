'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugCardsPage() {
  const [connecting, setConnecting] = useState<string | null>(null)

  const mockSources = [
    { id: 'shopify', name: 'Shopify', icon: '🛍️', type: 'shopify' },
    { id: 'stripe', name: 'Stripe', icon: '💳', type: 'stripe' },
    { id: 'postgres', name: 'PostgreSQL', icon: '🐘', type: 'postgres' },
    { id: 'salesforce', name: 'Salesforce', icon: '☁️', type: 'salesforce' },
    { id: 'google', name: 'Google Analytics', icon: '📊', type: 'google-analytics' },
    { id: 'slack', name: 'Slack', icon: '💬', type: 'slack' },
    { id: 'hubspot', name: 'HubSpot', icon: '🎯', type: 'hubspot' },
    { id: 'notion', name: 'Notion', icon: '📝', type: 'notion' }
  ]

  const handleConnect = async (source: any) => {
    setConnecting(source.id)
    console.log(`🔗 Connecting to ${source.name}...`)
    
    try {
      // Create OAuth URL
      const response = await fetch('/api/oauth/create-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: source.type,
          tenantId: `debug_tenant_${Date.now()}`,
          redirectUri: `${window.location.origin}/oauth-success`
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ OAuth URL created:`, data)
        
        if (data.oauthUrl) {
          console.log(`🚀 Redirecting to: ${data.oauthUrl}`)
          window.location.href = data.oauthUrl
        } else {
          alert('No OAuth URL returned - check console for details')
        }
      } else {
        console.error('❌ OAuth URL creation failed:', response.status)
        alert(`OAuth URL creation failed: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Connection error:', error)
      alert(`Connection error: ${error.message}`)
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🐛 Debug Integration Cards
          </h1>
          <p className="text-gray-600">
            This page shows integration cards directly to test the OAuth flow.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockSources.map(source => (
            <Card key={source.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                    {source.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{source.name}</h3>
                    <p className="text-sm text-gray-500">Connect your {source.name} account</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => handleConnect(source)}
                disabled={connecting === source.id}
                className="w-full"
              >
                {connecting === source.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  `Connect ${source.name}`
                )}
              </Button>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">🧪 Test Instructions:</h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-1">
            <li>Click any "Connect" button above</li>
            <li>You should be redirected to the real provider's OAuth login page</li>
            <li>You'll see an "invalid_client" error (expected for demo)</li>
            <li>This proves the OAuth redirect is working correctly!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}