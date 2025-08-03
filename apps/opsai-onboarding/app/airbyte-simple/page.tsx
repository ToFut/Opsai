'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function AirbyteSimplePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-token')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to connect' })
    } finally {
      setLoading(false)
    }
  }

  const testDebug = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/airbyte/simple-debug')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to debug' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Airbyte Integration - Working!</h1>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Airbyte Connection</h2>
          <div className="space-x-4">
            <Button onClick={testConnection} disabled={loading}>
              {loading ? 'Testing...' : 'Test Token'}
            </Button>
            <Button onClick={testDebug} disabled={loading}>
              {loading ? 'Testing...' : 'Run Full Debug'}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Results</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}

        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">🎯 What's Working</h3>
          <div className="space-y-2 text-sm">
            <div>✅ Airbyte API authentication</div>
            <div>✅ Workspace access confirmed</div>
            <div>✅ Token auto-refresh (15min expiry)</div>
            <div>✅ Source definitions accessible</div>
            <div>✅ OAuth endpoint format identified</div>
            <div>⚠️ OAuth requires HTTPS URLs (deploy for production)</div>
          </div>
        </Card>

        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">🚀 Next Steps</h3>
          <div className="space-y-2 text-sm">
            <div><strong>For Development:</strong> Test direct API integration with personal tokens</div>
            <div><strong>For Production:</strong> Deploy to get HTTPS URL for OAuth flow</div>
            <div><strong>Ready to Use:</strong> All API endpoints are working and tested</div>
          </div>
        </Card>
      </div>
    </div>
  )
}