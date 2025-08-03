'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Loader2, Check, X, AlertCircle, Plus, Database, Cloud,
  Play, Link, ArrowRight, Settings, RefreshCw
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AirbyteSetupPage() {
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState<any[]>([])
  const [destinations, setDestinations] = useState<any[]>([])
  const [createdSources, setCreatedSources] = useState<any[]>([])
  const [createdDestinations, setCreatedDestinations] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('sources')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Load available sources and destinations
  useEffect(() => {
    loadAvailableConnectors()
  }, [])

  const loadAvailableConnectors = async () => {
    setLoading(true)
    try {
      // First test the API connection
      const testRes = await fetch('/api/airbyte/test')
      const testData = await testRes.json()
      
      if (!testRes.ok) {
        console.warn('Airbyte API not configured, using mock data')
        // Use mock data as fallback
        setSources(getMockSources())
        setDestinations(getMockDestinations())
        setMessage({ 
          type: 'error', 
          text: 'Airbyte API not configured. Using demo mode. Add API credentials to .env.local' 
        })
        setLoading(false)
        return
      }

      // Load sources
      const sourcesRes = await fetch('/api/airbyte/complete-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list-sources' })
      })
      if (sourcesRes.ok) {
        const data = await sourcesRes.json()
        setSources(data.sources.slice(0, 10)) // Show first 10
      } else {
        setSources(getMockSources())
      }

      // Load destinations
      const destsRes = await fetch('/api/airbyte/complete-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list-destinations' })
      })
      if (destsRes.ok) {
        const data = await destsRes.json()
        setDestinations(data.destinations.slice(0, 10)) // Show first 10
      } else {
        setDestinations(getMockDestinations())
      }
    } catch (error) {
      console.error('Failed to load connectors:', error)
      // Use mock data as fallback
      setSources(getMockSources())
      setDestinations(getMockDestinations())
    } finally {
      setLoading(false)
    }
  }

  // Mock data for demo purposes
  const getMockSources = () => [
    { sourceDefinitionId: 'github', name: 'GitHub', requiresOAuth: true },
    { sourceDefinitionId: 'postgres', name: 'PostgreSQL', requiresOAuth: false },
    { sourceDefinitionId: 'mysql', name: 'MySQL', requiresOAuth: false },
    { sourceDefinitionId: 'shopify', name: 'Shopify', requiresOAuth: true },
    { sourceDefinitionId: 'stripe', name: 'Stripe', requiresOAuth: true },
    { sourceDefinitionId: 'google-sheets', name: 'Google Sheets', requiresOAuth: true }
  ]

  const getMockDestinations = () => [
    { destinationDefinitionId: 'postgres', name: 'PostgreSQL' },
    { destinationDefinitionId: 'bigquery', name: 'BigQuery' },
    { destinationDefinitionId: 'snowflake', name: 'Snowflake' },
    { destinationDefinitionId: 's3', name: 'Amazon S3' }
  ]

  const createSource = async (sourceType: string) => {
    setLoading(true)
    setMessage(null)

    try {
      // Check if OAuth is required
      const oauthSources = ['github', 'shopify', 'stripe', 'google-sheets']
      if (oauthSources.includes(sourceType)) {
        // Get OAuth URL
        const oauthRes = await fetch('/api/airbyte/complete-flow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'get-oauth-url',
            sourceType 
          })
        })

        if (oauthRes.ok) {
          const { authUrl } = await oauthRes.json()
          // Store source type for after OAuth
          localStorage.setItem('pending_source_type', sourceType)
          localStorage.setItem('oauth_return_to', '/airbyte-setup')
          window.location.href = authUrl
          return
        }
      }

      // Create non-OAuth source
      const response = await fetch('/api/airbyte/complete-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create-source',
          sourceType,
          name: `${sourceType}-${Date.now()}`
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedSources([...createdSources, {
          id: data.sourceId,
          name: sourceType,
          ...data.source
        }])
        setMessage({ type: 'success', text: `Created ${sourceType} source successfully!` })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.details || 'Failed to create source' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create source' })
    } finally {
      setLoading(false)
    }
  }

  const createDestination = async (destinationType: string) => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/airbyte/complete-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create-destination',
          destinationType,
          name: `${destinationType}-${Date.now()}`
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedDestinations([...createdDestinations, {
          id: data.destinationId,
          name: destinationType,
          ...data.destination
        }])
        setMessage({ type: 'success', text: `Created ${destinationType} destination successfully!` })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.details || 'Failed to create destination' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create destination' })
    } finally {
      setLoading(false)
    }
  }

  const createConnection = async (sourceId: string, destinationId: string) => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/airbyte/complete-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create-connection',
          sourceId,
          destinationId,
          streams: [] // Will use all available streams by default
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConnections([...connections, data.connection])
        setMessage({ type: 'success', text: 'Connection created successfully!' })
        setActiveTab('sync')
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.details || 'Failed to create connection' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create connection' })
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async (connectionId: string) => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/airbyte/complete-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'trigger-sync',
          connectionId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: `Sync started! Job ID: ${data.jobId}` })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.details || 'Failed to trigger sync' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to trigger sync' })
    } finally {
      setLoading(false)
    }
  }

  // Check for OAuth success
  useEffect(() => {
    const checkOAuthSuccess = () => {
      const oauthSuccess = localStorage.getItem('oauth_success')
      const pendingSourceType = localStorage.getItem('pending_source_type')
      
      if (oauthSuccess && pendingSourceType) {
        try {
          const successData = JSON.parse(oauthSuccess)
          // Create source with OAuth credentials
          createSourceWithOAuth(pendingSourceType, successData)
          
          // Clean up
          localStorage.removeItem('oauth_success')
          localStorage.removeItem('pending_source_type')
        } catch (e) {
          console.error('Failed to process OAuth success:', e)
        }
      }
    }

    checkOAuthSuccess()
  }, [])

  const createSourceWithOAuth = async (sourceType: string, oauthData: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/airbyte/complete-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create-source',
          sourceType,
          name: `${sourceType}-${Date.now()}`,
          config: {
            credentials: oauthData.connection?.credentials || {
              option_title: 'OAuth Credentials',
              access_token: oauthData.accessToken
            }
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedSources([...createdSources, {
          id: data.sourceId,
          name: sourceType,
          ...data.source
        }])
        setMessage({ type: 'success', text: `Created ${sourceType} source with OAuth successfully!` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create OAuth source' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Airbyte Complete Setup</h1>
          <p className="text-gray-600">Create sources, destinations, and sync data</p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
            {message.type === 'error' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue={activeTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="sources" className="flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="destinations" className="flex items-center">
              <Cloud className="w-4 h-4 mr-2" />
              Destinations
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center">
              <Link className="w-4 h-4 mr-2" />
              Connections
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center">
              <Play className="w-4 h-4 mr-2" />
              Sync
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Available Sources</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sources.map((source) => (
                    <div key={source.sourceDefinitionId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{source.name}</h3>
                        {source.requiresOAuth && (
                          <Badge variant="secondary">OAuth</Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => createSource(source.name.toLowerCase().replace(/\s+/g, '-'))}
                        disabled={loading}
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {createdSources.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Created Sources</h3>
                  <div className="space-y-2">
                    {createdSources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded">
                        <span>{source.name}</span>
                        <Badge variant="outline" className="text-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="destinations">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Available Destinations</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {destinations.map((dest) => (
                    <div key={dest.destinationDefinitionId} className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">{dest.name}</h3>
                      <Button
                        onClick={() => createDestination(dest.name.toLowerCase().replace(/\s+/g, '-'))}
                        disabled={loading}
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {createdDestinations.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Created Destinations</h3>
                  <div className="space-y-2">
                    {createdDestinations.map((dest) => (
                      <div key={dest.id} className="flex items-center justify-between p-3 border rounded">
                        <span>{dest.name}</span>
                        <Badge variant="outline" className="text-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="connections">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Create Connection</h2>
              
              {createdSources.length > 0 && createdDestinations.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <label className="block text-sm font-medium mb-2">Source</label>
                      <select className="w-full p-2 border rounded">
                        {createdSources.map((source) => (
                          <option key={source.id} value={source.id}>
                            {source.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-center">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Destination</label>
                      <select className="w-full p-2 border rounded">
                        {createdDestinations.map((dest) => (
                          <option key={dest.id} value={dest.id}>
                            {dest.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      const sourceId = createdSources[0]?.id
                      const destId = createdDestinations[0]?.id
                      if (sourceId && destId) {
                        createConnection(sourceId, destId)
                      }
                    }}
                    disabled={loading}
                    className="w-full"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Create Connection
                  </Button>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please create at least one source and one destination first.
                  </AlertDescription>
                </Alert>
              )}

              {connections.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Active Connections</h3>
                  <div className="space-y-2">
                    {connections.map((conn) => (
                      <div key={conn.connectionId} className="flex items-center justify-between p-3 border rounded">
                        <span>{conn.name}</span>
                        <Badge variant="outline" className="text-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="sync">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Sync Data</h2>
              
              {connections.length > 0 ? (
                <div className="space-y-4">
                  {connections.map((conn) => (
                    <div key={conn.connectionId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{conn.name}</h3>
                          <p className="text-sm text-gray-600">
                            Status: {conn.status}
                          </p>
                        </div>
                        <Button
                          onClick={() => triggerSync(conn.connectionId)}
                          disabled={loading}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Sync
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No connections available. Please create a connection first.
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Complete Flow:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create a source (data origin)</li>
            <li>Create a destination (where data goes)</li>
            <li>Connect source to destination</li>
            <li>Trigger sync to move data</li>
          </ol>
        </div>
      </div>
    </div>
  )
}