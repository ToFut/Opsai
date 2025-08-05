'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, XCircle, Loader2, RefreshCw, 
  AlertTriangle, Info, Copy, CheckCheck
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface TestResult {
  name: string
  endpoint: string
  success: boolean
  status?: number
  error?: string
  response?: any
  test?: string
}

interface DebugResponse {
  success: boolean
  tokenInfo?: {
    token: string
    clientId: string
    workspaceId: string
    apiUrl: string
  }
  tests?: TestResult[]
  results?: TestResult[]
  summary?: {
    total: number
    passed: number
    failed: number
  }
  recommendations?: string[]
  error?: string
  details?: string
}

export default function AirbyteDebugPage() {
  const [loading, setLoading] = useState(false)
  const [debugData, setDebugData] = useState<DebugResponse | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const runDebugTests = async () => {
    setLoading(true)
    setDebugData(null)

    try {
      const response = await fetch('/api/airbyte/debug')
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const text = await response.text()
        setDebugData({
          success: false,
          error: `Server error: ${response.status}`,
          details: text || 'No response body'
        })
        return
      }
      
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      // If it's a pattern error, try the simple debug endpoint
      if (error instanceof Error && error.message.includes('pattern')) {
        try {
          const simpleResponse = await fetch('/api/airbyte/simple-debug')
          const simpleData = await simpleResponse.json()
          setDebugData({
            success: true,
            results: simpleData.results,
            recommendations: simpleData.recommendations,
            error: 'Using simplified debug (full debug had pattern error)'
          })
        } catch (simpleError) {
          setDebugData({
            success: false,
            error: 'Failed to run debug tests',
            details: error.message + ' | Simple debug also failed: ' + (simpleError instanceof Error ? simpleError.message : 'Unknown')
          })
        }
      } else {
        setDebugData({
          success: false,
          error: 'Failed to run debug tests',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-500'
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 400 && status < 500) return 'text-red-600'
    if (status >= 500) return 'text-red-800'
    return 'text-yellow-600'
  }

  const getStatusIcon = (success: boolean) => {
    return success 
      ? <CheckCircle className="w-5 h-5 text-green-600" />
      : <XCircle className="w-5 h-5 text-red-600" />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Airbyte API Debug Tool</h1>
          <p className="text-gray-600">
            Test Airbyte API endpoints and diagnose authentication issues
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Run Debug Tests</h2>
              <p className="text-sm text-gray-600">
                This will test various Airbyte API endpoints to identify issues
              </p>
            </div>
            <Button
              onClick={runDebugTests}
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Debug Tests
                </>
              )}
            </Button>
          </div>
        </Card>

        {debugData && (
          <>
            {/* Summary */}
            {debugData.summary && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Test Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{debugData.summary.total}</p>
                    <p className="text-sm text-gray-600">Total Tests</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{debugData.summary.passed}</p>
                    <p className="text-sm text-gray-600">Passed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{debugData.summary.failed}</p>
                    <p className="text-sm text-gray-600">Failed</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Token Info */}
            {debugData.tokenInfo && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Configuration Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Client ID:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">{debugData.tokenInfo.clientId}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(debugData.tokenInfo!.clientId, 'clientId')}
                      >
                        {copied === 'clientId' ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Workspace ID:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm">{debugData.tokenInfo.workspaceId}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(debugData.tokenInfo!.workspaceId, 'workspaceId')}
                      >
                        {copied === 'workspaceId' ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">API URL:</span>
                    <code className="text-sm">{debugData.tokenInfo.apiUrl}</code>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Token (truncated):</span>
                    <code className="text-sm font-mono">{debugData.tokenInfo.token}</code>
                  </div>
                </div>
              </Card>
            )}

            {/* Test Results */}
            {debugData.tests && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Test Results</h3>
                <div className="space-y-3">
                  {debugData.tests.map((test, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${
                        test.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(test.success)}
                          <div>
                            <h4 className="font-medium">{test.name}</h4>
                            <code className="text-xs text-gray-600">{test.endpoint}</code>
                            {test.status && (
                              <p className={`text-sm mt-1 ${getStatusColor(test.status)}`}>
                                Status: {test.status}
                              </p>
                            )}
                            {test.error && (
                              <p className="text-sm text-red-600 mt-1">{test.error}</p>
                            )}
                          </div>
                        </div>
                        {test.response && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                              View Response
                            </summary>
                            <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-w-md">
                              {JSON.stringify(test.response, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recommendations */}
            {debugData.recommendations && debugData.recommendations.length > 0 && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Recommendations
                </h3>
                <div className="space-y-2">
                  {debugData.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Simple Results Display */}
            {debugData.results && Array.isArray(debugData.results) && (
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Debug Results</h3>
                <div className="space-y-4">
                  {debugData.results.map((result, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded">
                      <h4 className="font-medium mb-2">{result.test}</h4>
                      <pre className="text-sm overflow-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Error Display */}
            {debugData.error && (
              <Alert variant={debugData.error.includes('simplified') ? 'default' : 'error'}>
                <AlertDescription>
                  {debugData.error}
                  {debugData.details && (
                    <pre className="mt-2 text-xs">{debugData.details}</pre>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <h4 className="font-medium mb-2">Test Token Manually</h4>
              <p className="text-sm text-gray-600 mb-3">
                Copy this curl command to test your token:
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
{`curl -X GET "https://api.airbyte.com/v1/workspaces" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Accept: application/json"`}
              </pre>
            </div>
            <div className="p-4 border rounded">
              <h4 className="font-medium mb-2">Alternative: Use Airbyte OSS</h4>
              <p className="text-sm text-gray-600 mb-3">
                Run Airbyte locally for easier development:
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
{`docker run -p 8000:8000 -p 8001:8001 \\
  --name airbyte airbyte/airbyte:latest`}
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}