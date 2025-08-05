'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, X, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function TestAirbytePage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [selectedProvider, setSelectedProvider] = useState('github')

  const providers = [
    { id: 'github', name: 'GitHub', requiresOAuth: true },
    { id: 'postgres', name: 'PostgreSQL', requiresOAuth: false },
    { id: 'mysql', name: 'MySQL', requiresOAuth: false },
    { id: 'shopify', name: 'Shopify', requiresOAuth: true },
    { id: 'stripe', name: 'Stripe', requiresOAuth: true }
  ]

  const testConnection = async () => {
    setTesting(true)
    setResults(null)

    try {
      // Test the simple connect endpoint
      const response = await fetch('/api/airbyte/simple-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          tenantId: 'test-tenant-123'
        })
      })

      const data = await response.json()
      
      if (data.requiresAuth && data.authUrl) {
        // For OAuth providers, redirect to auth
        window.location.href = data.authUrl
        return
      }

      setResults({
        success: response.ok,
        data: data,
        status: response.status
      })

    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setTesting(false)
    }
  }

  const checkConfig = async () => {
    try {
      const response = await fetch('/api/debug/oauth-status')
      const status = await response.json()
      setResults({
        success: true,
        data: status,
        type: 'config'
      })
    } catch (error) {
      setResults({
        success: false,
        error: 'Failed to check configuration'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Airbyte Connection</h1>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Test</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Provider:</label>
            <select 
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.requiresOAuth ? '(OAuth)' : '(Direct)'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={testConnection} 
              disabled={testing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
            
            <Button 
              onClick={checkConfig}
              variant="outline"
            >
              Check Configuration
            </Button>
          </div>
        </Card>

        {results && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {results.type === 'config' ? 'Configuration Status' : 'Test Results'}
            </h3>
            
            {results.success ? (
              <div>
                <Alert className="mb-4">
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    {results.type === 'config' ? 'Configuration loaded' : 'Request successful'}
                  </AlertDescription>
                </Alert>
                
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </div>
            ) : (
              <Alert variant="error">
                <X className="h-4 w-4" />
                <AlertDescription>
                  {results.error || 'Test failed'}
                </AlertDescription>
              </Alert>
            )}
          </Card>
        )}

        <div className="mt-8 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Add Airbyte API credentials to .env.local</li>
            <li>For GitHub: Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET</li>
            <li>Click "Test Connection" to verify setup</li>
            <li>For OAuth providers, you'll be redirected to authorize</li>
          </ol>
        </div>
      </div>
    </div>
  )
}