'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { 
  Github, Database, Loader2, CheckCircle, 
  AlertCircle, Key, Server
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface SourceConfig {
  type: string
  name: string
  icon: any
  fields: {
    name: string
    label: string
    type: string
    placeholder: string
    required: boolean
  }[]
}

export default function AirbyteDirectPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<Record<string, any>>({})

  const sources: SourceConfig[] = [
    {
      type: 'github',
      name: 'GitHub (Personal Access Token)',
      icon: Github,
      fields: [
        {
          name: 'token',
          label: 'Personal Access Token',
          type: 'password',
          placeholder: 'ghp_xxxxxxxxxxxx',
          required: true
        },
        {
          name: 'repository',
          label: 'Repository (optional)',
          type: 'text',
          placeholder: 'owner/repo or leave empty for all',
          required: false
        }
      ]
    },
    {
      type: 'postgres',
      name: 'PostgreSQL',
      icon: Database,
      fields: [
        {
          name: 'host',
          label: 'Host',
          type: 'text',
          placeholder: 'localhost or database.example.com',
          required: true
        },
        {
          name: 'port',
          label: 'Port',
          type: 'number',
          placeholder: '5432',
          required: true
        },
        {
          name: 'database',
          label: 'Database',
          type: 'text',
          placeholder: 'mydb',
          required: true
        },
        {
          name: 'username',
          label: 'Username',
          type: 'text',
          placeholder: 'postgres',
          required: true
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          placeholder: '••••••••',
          required: true
        }
      ]
    },
    {
      type: 'mysql',
      name: 'MySQL',
      icon: Database,
      fields: [
        {
          name: 'host',
          label: 'Host',
          type: 'text',
          placeholder: 'localhost or database.example.com',
          required: true
        },
        {
          name: 'port',
          label: 'Port',
          type: 'number',
          placeholder: '3306',
          required: true
        },
        {
          name: 'database',
          label: 'Database',
          type: 'text',
          placeholder: 'mydb',
          required: true
        },
        {
          name: 'username',
          label: 'Username',
          type: 'text',
          placeholder: 'root',
          required: true
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          placeholder: '••••••••',
          required: true
        }
      ]
    }
  ]

  const createSource = async () => {
    if (!selectedSource) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/airbyte/test-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: selectedSource,
          credentials
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create source')
        console.error('API Error:', data)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Network error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const currentSource = sources.find(s => s.type === selectedSource)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Direct Source Creation</h1>
          <p className="text-gray-600">
            Create Airbyte sources using API credentials (no OAuth)
          </p>
        </div>

        {/* Source Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Source Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sources.map((source) => {
              const Icon = source.icon
              return (
                <button
                  key={source.type}
                  onClick={() => {
                    setSelectedSource(source.type)
                    setCredentials({})
                    setResult(null)
                    setError(null)
                  }}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedSource === source.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-8 h-8 mb-2 mx-auto" />
                  <p className="font-medium">{source.name}</p>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Credentials Form */}
        {currentSource && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Configure {currentSource.name}
            </h2>
            <div className="space-y-4">
              {currentSource.fields.map((field) => (
                <div key={field.name}>
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={credentials[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={createSource}
              disabled={loading || !currentSource.fields.filter(f => f.required).every(f => credentials[f.name])}
              className="w-full mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Source...
                </>
              ) : (
                <>
                  <Server className="w-4 h-4 mr-2" />
                  Create Source
                </>
              )}
            </Button>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="error" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Result */}
        {result && result.success && (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Source Created Successfully!
                </h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Source ID:</span> {result.sourceId}
                  </p>
                  {result.connectionTest && (
                    <p className="text-sm">
                      <span className="font-medium">Connection Status:</span>{' '}
                      {result.connectionTest.status || 'Testing...'}
                    </p>
                  )}
                </div>
                {result.source && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-green-700 hover:text-green-800">
                      View Full Response
                    </summary>
                    <pre className="mt-2 p-3 bg-white rounded text-xs overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">📝 Instructions</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900">GitHub Personal Access Token:</p>
              <ol className="list-decimal list-inside ml-4 mt-1">
                <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                <li>Create a new token with repo scope</li>
                <li>Copy the token (starts with ghp_)</li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-gray-900">Database Connections:</p>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Ensure your database is accessible from Airbyte</li>
                <li>Check firewall rules and network settings</li>
                <li>Use proper SSL settings for production</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}