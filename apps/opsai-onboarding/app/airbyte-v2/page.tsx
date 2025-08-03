'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, Cloud, Play, Check, X, Loader2, 
  Github, FileSpreadsheet, ShoppingBag, CreditCard 
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface TestResult {
  success: boolean
  data?: any
  error?: string
}

export default function AirbyteV2Page() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [sourceName, setSourceName] = useState('My Integration')
  const [callbackUrl, setCallbackUrl] = useState('/oauth-callback')

  useEffect(() => {
    // Set the callback URL after component mounts (client-side only)
    setCallbackUrl(`${window.location.origin}/oauth-callback`)
  }, [])

  // OAuth Sources
  const oauthSources = [
    { type: 'github', name: 'GitHub', icon: Github },
    { type: 'google-sheets', name: 'Google Sheets', icon: FileSpreadsheet },
    { type: 'shopify', name: 'Shopify', icon: ShoppingBag },
    { type: 'stripe', name: 'Stripe', icon: CreditCard }
  ]

  // Direct Sources (no OAuth)
  const directSources = [
    { type: 'postgres', name: 'PostgreSQL', icon: Database },
    { type: 'mysql', name: 'MySQL', icon: Database },
    { type: 'mongodb', name: 'MongoDB', icon: Database }
  ]

  const testPostgres = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/airbyte-v2/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'postgres' })
      })
      
      const data = await response.json()
      setResult({
        success: response.ok,
        data: response.ok ? data : undefined,
        error: !response.ok ? data.details || data.error : undefined
      })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testListSources = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/airbyte-v2/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'list' })
      })
      
      const data = await response.json()
      setResult({
        success: response.ok,
        data: response.ok ? data : undefined,
        error: !response.ok ? data.details || data.error : undefined
      })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const initiateOAuth = async (sourceType: string) => {
    const finalName = sourceName.trim() || `${sourceType}-${Date.now()}`

    setLoading(true)
    setResult(null)
    
    try {
      // Store context for OAuth callback
      localStorage.setItem('oauth_context', JSON.stringify({
        sourceType,
        sourceName: finalName
      }))

      const response = await fetch('/api/airbyte-v2/initiate-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sourceType,
          redirectUrl: callbackUrl
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.consentUrl) {
        // Redirect to OAuth consent page
        window.location.href = data.consentUrl
      } else {
        setResult({
          success: false,
          error: data.details || data.error || 'Failed to initiate OAuth'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const createDirectSource = async (sourceType: string) => {
    const finalName = sourceName.trim() || `${sourceType}-${Date.now()}`

    setLoading(true)
    setResult(null)
    
    try {
      const configurations: Record<string, any> = {
        postgres: {
          host: 'localhost',
          port: 5432,
          database: 'mydb',
          username: 'postgres',
          password: 'password'
        },
        mysql: {
          host: 'localhost',
          port: 3306,
          database: 'mydb',
          username: 'root',
          password: 'password'
        },
        mongodb: {
          instance_type: { instance: 'standalone' },
          host: 'localhost',
          port: 27017,
          database: 'mydb',
          user: 'mongodb',
          password: 'password',
          auth_source: 'admin'
        }
      }

      const response = await fetch('/api/airbyte-v2/create-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          name: finalName,
          configuration: configurations[sourceType]
        })
      })
      
      const data = await response.json()
      setResult({
        success: response.ok,
        data: response.ok ? data : undefined,
        error: !response.ok ? data.details || data.error : undefined
      })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Airbyte API v2 Implementation</h1>
          <p className="text-gray-600">Correct implementation based on official documentation</p>
        </div>

        <Tabs defaultValue="oauth" className="space-y-4">
          <TabsList>
            <TabsTrigger value="oauth">OAuth Sources</TabsTrigger>
            <TabsTrigger value="direct">Direct Sources</TabsTrigger>
            <TabsTrigger value="test">Quick Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="oauth">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">OAuth Sources</h2>
              <p className="text-sm text-gray-600 mb-4">
                These sources require OAuth authentication. You'll be redirected to authorize.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Source Name <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="e.g., My GitHub Integration"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="max-w-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A default name will be generated if left empty
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {oauthSources.map((source) => {
                  const Icon = source.icon
                  return (
                    <button
                      key={source.type}
                      onClick={() => initiateOAuth(source.type)}
                      disabled={loading}
                      className="p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-left"
                    >
                      <Icon className="w-8 h-8 mb-2 text-gray-600" />
                      <h3 className="font-medium">{source.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">OAuth 2.0</p>
                    </button>
                  )
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="direct">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Direct Sources</h2>
              <p className="text-sm text-gray-600 mb-4">
                These sources use direct credentials (no OAuth required).
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Source Name <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="e.g., Production Database"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="max-w-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A default name will be generated if left empty
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {directSources.map((source) => {
                  const Icon = source.icon
                  return (
                    <button
                      key={source.type}
                      onClick={() => createDirectSource(source.type)}
                      disabled={loading}
                      className="p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-left"
                    >
                      <Icon className="w-8 h-8 mb-2 text-gray-600" />
                      <h3 className="font-medium">{source.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">Direct Connection</p>
                    </button>
                  )
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Tests</h2>
              <div className="space-x-4">
                <Button onClick={testPostgres} disabled={loading}>
                  <Database className="w-4 h-4 mr-2" />
                  Test PostgreSQL Creation
                </Button>
                <Button onClick={testListSources} disabled={loading} variant="outline">
                  List Existing Sources
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {loading && (
          <Card className="p-6 mt-6">
            <div className="flex items-center">
              <Loader2 className="w-5 h-5 animate-spin mr-3" />
              <span>Processing...</span>
            </div>
          </Card>
        )}

        {result && (
          <Card className="p-6 mt-6">
            <div className="flex items-start gap-3 mb-4">
              {result.success ? (
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-red-600" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold mb-2">
                  {result.success ? 'Success' : 'Error'}
                </h3>
                {result.error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                )}
                {result.data && (
                  <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 mt-6 bg-blue-50">
          <h3 className="font-semibold mb-2">How This Works</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><strong>OAuth Sources</strong>: Click to initiate OAuth → Authorize → Automatically create source</li>
            <li><strong>Direct Sources</strong>: Click to create source with test credentials</li>
            <li><strong>Callback URL</strong>: {callbackUrl}</li>
            <li><strong>API Version</strong>: Using Airbyte API v1 with correct endpoints</li>
          </ol>
        </Card>
      </div>
    </div>
  )
}