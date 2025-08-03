'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default function DebugAirbytePage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testListSources = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/airbyte/complete-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list-sources' })
      })
      
      const data = await response.json()
      setResults({
        status: response.status,
        ok: response.ok,
        data: data
      })
    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testApiConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://api.airbyte.com/v1/workspaces', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AIRBYTE_API_KEY || 'key-not-set'}`,
          'Accept': 'application/json'
        }
      })
      
      setResults({
        status: response.status,
        statusText: response.statusText,
        message: 'Direct API test to Airbyte'
      })
    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkEnvVars = () => {
    setResults({
      envVars: {
        AIRBYTE_API_URL: process.env.NEXT_PUBLIC_AIRBYTE_API_URL || 'Not set (using default)',
        AIRBYTE_API_KEY: process.env.NEXT_PUBLIC_AIRBYTE_API_KEY ? 'Set' : 'NOT SET',
        AIRBYTE_WORKSPACE_ID: process.env.NEXT_PUBLIC_AIRBYTE_WORKSPACE_ID ? 'Set' : 'NOT SET',
        GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ? 'Set' : 'NOT SET'
      },
      note: 'Server-side env vars are not accessible from client. Check server logs.'
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Airbyte API</h1>

      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Test API Endpoints</h2>
          <div className="space-x-4">
            <Button onClick={testListSources} disabled={loading}>
              Test List Sources
            </Button>
            <Button onClick={testApiConnection} disabled={loading} variant="outline">
              Test Direct API
            </Button>
            <Button onClick={checkEnvVars} variant="outline">
              Check Env Vars
            </Button>
          </div>
        </Card>

        {results && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Results:</h3>
            <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </Card>
        )}

        <Card className="p-4 bg-blue-50">
          <h3 className="font-semibold mb-2">Quick Fix:</h3>
          <p className="text-sm mb-2">If sources aren't loading, check:</p>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Airbyte API credentials in .env.local</li>
            <li>Server console for error messages</li>
            <li>Network tab in browser dev tools</li>
          </ol>
        </Card>
      </div>
    </div>
  )
}