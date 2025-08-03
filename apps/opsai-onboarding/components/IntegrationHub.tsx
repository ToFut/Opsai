'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { 
  Link2, Key, Database, Webhook, Cloud, Shield, Check, X, 
  Loader2, ExternalLink, Info, Search, Filter
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  category: string
  authType: 'oauth2' | 'api_key' | 'database' | 'webhook' | 'platform' | 'service_account'
  requiresUserLogin: boolean
  connected?: boolean
  description?: string
  icon?: string
}

export default function IntegrationHub({ 
  tenantId,
  onConnectionsUpdate 
}: {
  tenantId: string
  onConnectionsUpdate: (connections: any[]) => void
}) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [showCredentialModal, setShowCredentialModal] = useState<{
    integration: Integration | null
    show: boolean
  }>({ integration: null, show: false })

  useEffect(() => {
    fetchIntegrations()
    fetchConnectedIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations/connect')
      const data = await response.json()
      setIntegrations(data.integrations)
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    }
  }

  const fetchConnectedIntegrations = async () => {
    try {
      const response = await fetch(`/api/integrations/status?tenant=${tenantId}`)
      const data = await response.json()
      setConnectedIntegrations(new Set(data.connected.map((c: any) => c.provider)))
      onConnectionsUpdate(data.connected)
    } catch (error) {
      console.error('Failed to fetch connection status:', error)
    }
  }

  const handleConnect = async (integration: Integration) => {
    setConnectingId(integration.id)

    try {
      if (integration.authType === 'oauth2') {
        // OAuth flow - open popup
        const width = 600
        const height = 700
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2

        const authWindow = window.open(
          '',
          'oauth',
          `width=${width},height=${height},left=${left},top=${top}`
        )

        // Get auth URL
        const response = await fetch('/api/oauth/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: integration.id,
            tenantId
          })
        })

        const { authUrl } = await response.json()
        
        if (authWindow) {
          authWindow.location.href = authUrl
        }

        // Listen for OAuth completion
        window.addEventListener('message', function handler(event) {
          if (event.data.type === 'oauth-success' && event.data.provider === integration.id) {
            setConnectedIntegrations(prev => new Set(Array.from(prev).concat(integration.id)))
            fetchConnectedIntegrations()
            window.removeEventListener('message', handler)
          }
        })

      } else if (integration.authType === 'api_key' || integration.authType === 'database') {
        // Show credential input modal
        setShowCredentialModal({ integration, show: true })
        
      } else if (integration.authType === 'webhook') {
        // Generate webhook URL
        const response = await fetch('/api/integrations/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: integration.id,
            tenantId,
            authType: integration.authType
          })
        })

        const data = await response.json()
        if (data.webhookUrl) {
          alert(`Webhook URL generated: ${data.webhookUrl}`)
          setConnectedIntegrations(prev => new Set(Array.from(prev).concat(integration.id)))
        }

      } else if (integration.authType === 'platform') {
        // Direct connection using platform credentials
        const response = await fetch('/api/integrations/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: integration.id,
            tenantId,
            authType: integration.authType
          })
        })

        if (response.ok) {
          setConnectedIntegrations(prev => new Set(Array.from(prev).concat(integration.id)))
        }
      }

    } catch (error) {
      console.error('Connection failed:', error)
      alert('Failed to connect integration')
    } finally {
      setConnectingId(null)
    }
  }

  const handleCredentialSubmit = async (credentials: any) => {
    const integration = showCredentialModal.integration
    if (!integration) return

    try {
      const response = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: integration.id,
          tenantId,
          authType: integration.authType,
          credentials
        })
      })

      if (response.ok) {
        setConnectedIntegrations(prev => new Set(Array.from(prev).concat(integration.id)))
        setShowCredentialModal({ integration: null, show: false })
        fetchConnectedIntegrations()
      } else {
        throw new Error('Failed to connect')
      }
    } catch (error) {
      alert('Failed to connect integration')
    }
  }

  const getAuthIcon = (authType: string) => {
    const icons: Record<string, JSX.Element> = {
      oauth2: <Link2 className="w-4 h-4" />,
      api_key: <Key className="w-4 h-4" />,
      database: <Database className="w-4 h-4" />,
      webhook: <Webhook className="w-4 h-4" />,
      platform: <Cloud className="w-4 h-4" />,
      service_account: <Shield className="w-4 h-4" />
    }
    return icons[authType] || <Link2 className="w-4 h-4" />
  }

  const getAuthLabel = (authType: string, requiresUserLogin: boolean) => {
    if (authType === 'oauth2') return 'Login Required'
    if (authType === 'api_key') return 'API Key'
    if (authType === 'database') return 'Database'
    if (authType === 'webhook') return 'Webhook'
    if (authType === 'platform') return 'Auto-Connect'
    return authType
  }

  const categories = ['all'].concat(Array.from(new Set(integrations.map(i => i.category))))
  
  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Connect Your Business Tools</h2>
        <p className="text-gray-600">
          Connect your existing tools to import data and build your custom application
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search integrations..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map(integration => {
          const isConnected = connectedIntegrations.has(integration.id)
          const isConnecting = connectingId === integration.id

          return (
            <Card key={integration.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    {/* Integration logo would go here */}
                    <span className="text-lg font-bold">
                      {integration.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{integration.name}</h3>
                    <p className="text-sm text-gray-500">{integration.category}</p>
                  </div>
                </div>
                {isConnected && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {getAuthIcon(integration.authType)}
                  <span>{getAuthLabel(integration.authType, integration.requiresUserLogin)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                variant={isConnected ? 'outline' : 'default'}
                size="sm"
                onClick={() => handleConnect(integration)}
                disabled={isConnecting || isConnected}
              >
                {isConnecting ? (
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
                    <Link2 className="w-4 h-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Credential Input Modal */}
      {showCredentialModal.show && showCredentialModal.integration && (
        <CredentialModal
          integration={showCredentialModal.integration}
          onSubmit={handleCredentialSubmit}
          onClose={() => setShowCredentialModal({ integration: null, show: false })}
        />
      )}
    </div>
  )
}

function CredentialModal({ 
  integration, 
  onSubmit, 
  onClose 
}: {
  integration: Integration
  onSubmit: (credentials: any) => void
  onClose: () => void
}) {
  const [credentials, setCredentials] = useState<any>({})

  const getRequiredFields = () => {
    if (integration.authType === 'api_key') {
      const fields: Record<string, any[]> = {
        sendgrid: [{ name: 'apiKey', label: 'API Key', type: 'password' }],
        airtable: [
          { name: 'apiKey', label: 'API Key', type: 'password' },
          { name: 'baseId', label: 'Base ID', type: 'text' }
        ],
        zendesk: [
          { name: 'subdomain', label: 'Subdomain', type: 'text', placeholder: 'yourcompany' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'apiKey', label: 'API Token', type: 'password' }
        ]
      }
      return fields[integration.id] || [{ name: 'apiKey', label: 'API Key', type: 'password' }]
    }

    if (integration.authType === 'database') {
      return [
        { name: 'host', label: 'Host', type: 'text', placeholder: 'localhost' },
        { name: 'port', label: 'Port', type: 'number', placeholder: '5432' },
        { name: 'database', label: 'Database', type: 'text' },
        { name: 'username', label: 'Username', type: 'text' },
        { name: 'password', label: 'Password', type: 'password' },
        { name: 'ssl', label: 'Use SSL', type: 'checkbox' }
      ]
    }

    return []
  }

  const fields = getRequiredFields()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          Connect {integration.name}
        </h3>

        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">
                {field.label}
              </label>
              {field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={credentials[field.name] || false}
                  onChange={(e) => setCredentials({
                    ...credentials,
                    [field.name]: e.target.checked
                  })}
                  className="rounded"
                />
              ) : (
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={credentials[field.name] || ''}
                  onChange={(e) => setCredentials({
                    ...credentials,
                    [field.name]: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(credentials)}
            className="flex-1"
          >
            Connect
          </Button>
        </div>
      </Card>
    </div>
  )
}