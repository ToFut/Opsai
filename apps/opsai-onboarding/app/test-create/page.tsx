'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default function TestCreatePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCreate = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/airbyte/test-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: 'postgres' })
      })
      
      const data = await response.json()
      setResult({
        status: response.status,
        data
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testMinimal = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/airbyte/test-minimal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await response.json()
      setResult({
        status: response.status,
        data
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const listDefinitions = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/airbyte/list-definitions')
      const data = await response.json()
      setResult({
        status: response.status,
        data
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/airbyte/refresh-token')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to check token' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Airbyte Source Creation</h1>

      <Card className="p-6 mb-4">
        <h2 className="font-semibold mb-3">Quick Tests</h2>
        <div className="space-y-2">
          <div className="space-x-2">
            <Button onClick={testCreate} disabled={loading} size="sm">
              Test Create (Multiple Endpoints)
            </Button>
            <Button onClick={testMinimal} disabled={loading} size="sm">
              Test Minimal Create
            </Button>
          </div>
          <div className="space-x-2">
            <Button onClick={listDefinitions} disabled={loading} variant="outline" size="sm">
              List Definitions
            </Button>
            <Button onClick={refreshToken} disabled={loading} variant="outline" size="sm">
              Check Token Status
            </Button>
          </div>
        </div>
      </Card>

      {result && (
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Result:</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}

      <Card className="p-6 mt-4 bg-blue-50">
        <h3 className="font-semibold mb-2">What This Tests:</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Token auto-refresh using client credentials</li>
          <li>Correct API request format (configuration vs connectionConfiguration)</li>
          <li>Creates a test PostgreSQL source</li>
          <li>Shows detailed error messages if something fails</li>
        </ul>
      </Card>
    </div>
  )
}