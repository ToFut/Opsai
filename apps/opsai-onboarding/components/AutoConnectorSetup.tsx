'use client'

import { useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { 
  Loader2, ChevronRight, Zap, AlertCircle, CheckCircle,
  Globe, Key, Link2, FileJson, Search, Plus, X
} from 'lucide-react'

interface AutoConnectorSetupProps {
  tenantId: string
  onSuccess?: (connector: any) => void
  onCancel?: () => void
}

interface APIEndpoint {
  name: string
  path: string
  method: string
  description?: string
}

export default function AutoConnectorSetup({ 
  tenantId, 
  onSuccess, 
  onCancel 
}: AutoConnectorSetupProps) {
  const [step, setStep] = useState<'type' | 'config' | 'auth' | 'endpoints' | 'review'>('type')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoDiscovering, setAutoDiscovering] = useState(false)
  
  // Form state
  const [setupType, setSetupType] = useState<'template' | 'custom'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [apiConfig, setApiConfig] = useState({
    apiUrl: '',
    apiName: '',
    openApiUrl: '',
    authType: 'api_key' as 'api_key' | 'oauth2' | 'bearer' | 'basic',
    authConfig: {} as any,
    endpoints: [] as APIEndpoint[]
  })

  // Available templates
  const templates = [
    { id: 'shopify', name: 'Shopify', category: 'E-commerce', requiresOAuth: true },
    { id: 'stripe', name: 'Stripe', category: 'Payments', requiresOAuth: false },
    { id: 'salesforce', name: 'Salesforce', category: 'CRM', requiresOAuth: true },
    { id: 'hubspot', name: 'HubSpot', category: 'CRM', requiresOAuth: true },
    { id: 'mailchimp', name: 'Mailchimp', category: 'Marketing', requiresOAuth: true },
    { id: 'slack', name: 'Slack', category: 'Communication', requiresOAuth: true },
    { id: 'rest-api', name: 'Generic REST API', category: 'Custom', requiresOAuth: false }
  ]

  const handleAutoDiscover = async () => {
    if (!apiConfig.apiUrl) {
      setError('Please enter an API URL first')
      return
    }

    setAutoDiscovering(true)
    setError(null)

    try {
      const response = await fetch('/api/airbyte/connectors/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          apiUrl: apiConfig.apiUrl,
          openApiUrl: apiConfig.openApiUrl,
          autoDiscover: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Auto-discovery failed')
      }

      // Update form with discovered data
      setApiConfig(prev => ({
        ...prev,
        apiName: data.connector.name,
        authType: data.connector.authType,
        endpoints: data.connector.endpoints
      }))

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-discover API')
    } finally {
      setAutoDiscovering(false)
    }
  }

  const handleTemplateSetup = async () => {
    if (!selectedTemplate) {
      setError('Please select a template')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/airbyte/sources/auto-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          sourceType: selectedTemplate,
          connectionName: `${selectedTemplate}-${Date.now()}`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Setup failed')
      }

      if (data.requiresSetup || data.requiresOAuth) {
        // Show setup instructions
        setError(data.setupInstructions?.join('\n') || 'Additional setup required')
        setLoading(false)
        return
      }

      // Success
      onSuccess?.(data.source)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up connector')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomSetup = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/airbyte/connectors/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          apiUrl: apiConfig.apiUrl,
          apiName: apiConfig.apiName,
          authType: apiConfig.authType,
          authConfig: apiConfig.authConfig,
          endpoints: apiConfig.endpoints,
          openApiUrl: apiConfig.openApiUrl,
          autoDiscover: false
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Creation failed')
      }

      // Success
      onSuccess?.(data.connector)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connector')
    } finally {
      setLoading(false)
    }
  }

  const addEndpoint = () => {
    setApiConfig(prev => ({
      ...prev,
      endpoints: [...prev.endpoints, { name: '', path: '', method: 'GET' }]
    }))
  }

  const updateEndpoint = (index: number, field: keyof APIEndpoint, value: string) => {
    setApiConfig(prev => ({
      ...prev,
      endpoints: prev.endpoints.map((ep, i) => 
        i === index ? { ...ep, [field]: value } : ep
      )
    }))
  }

  const removeEndpoint = (index: number) => {
    setApiConfig(prev => ({
      ...prev,
      endpoints: prev.endpoints.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Auto-Create Airbyte Connector</h2>
        <p className="text-gray-600">
          Automatically create custom connectors for any API
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {['type', 'config', 'auth', 'endpoints', 'review'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-medium
              ${step === s ? 'bg-blue-600 text-white' : 
                ['type', 'config', 'auth', 'endpoints', 'review'].indexOf(step) > i 
                  ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
            `}>
              {['type', 'config', 'auth', 'endpoints', 'review'].indexOf(step) > i ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                i + 1
              )}
            </div>
            {i < 4 && (
              <div className={`w-24 h-1 ${
                ['type', 'config', 'auth', 'endpoints', 'review'].indexOf(step) > i 
                  ? 'bg-green-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
          </div>
        </div>
      )}

      {/* Step 1: Choose Type */}
      {step === 'type' && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Choose Setup Type</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setSetupType('template')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                setupType === 'template' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Zap className="w-8 h-8 mb-2 text-blue-600" />
              <h4 className="font-semibold mb-1">Use Template</h4>
              <p className="text-sm text-gray-600">
                Quick setup for popular APIs like Shopify, Stripe, etc.
              </p>
            </button>
            
            <button
              onClick={() => setSetupType('custom')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                setupType === 'custom' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Globe className="w-8 h-8 mb-2 text-blue-600" />
              <h4 className="font-semibold mb-1">Custom API</h4>
              <p className="text-sm text-gray-600">
                Create connector for any REST API with auto-discovery
              </p>
            </button>
          </div>

          {setupType === 'template' && (
            <div>
              <h4 className="font-medium mb-3">Select a Template</h4>
              <div className="grid grid-cols-2 gap-3">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-600">{template.category}</p>
                      </div>
                      {template.requiresOAuth && (
                        <Badge variant="secondary" className="text-xs">OAuth</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (setupType === 'template' && selectedTemplate) {
                  handleTemplateSetup()
                } else if (setupType === 'custom') {
                  setStep('config')
                }
              }}
              disabled={setupType === 'template' && !selectedTemplate}
            >
              {setupType === 'template' ? 'Set Up Connector' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: API Configuration */}
      {step === 'config' && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">API Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiUrl">API Base URL *</Label>
              <Input
                id="apiUrl"
                type="url"
                placeholder="https://api.example.com/v1"
                value={apiConfig.apiUrl}
                onChange={(e) => setApiConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="apiName">Connector Name *</Label>
              <Input
                id="apiName"
                placeholder="My Custom API"
                value={apiConfig.apiName}
                onChange={(e) => setApiConfig(prev => ({ ...prev, apiName: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="openApiUrl">OpenAPI/Swagger URL (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="openApiUrl"
                  type="url"
                  placeholder="https://api.example.com/openapi.json"
                  value={apiConfig.openApiUrl}
                  onChange={(e) => setApiConfig(prev => ({ ...prev, openApiUrl: e.target.value }))}
                />
                <Button
                  variant="outline"
                  onClick={handleAutoDiscover}
                  disabled={autoDiscovering || !apiConfig.apiUrl}
                >
                  {autoDiscovering ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Auto-Discover
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Automatically discover endpoints and authentication from OpenAPI spec
              </p>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep('type')}>
              Back
            </Button>
            <Button 
              onClick={() => setStep('auth')}
              disabled={!apiConfig.apiUrl || !apiConfig.apiName}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Authentication */}
      {step === 'auth' && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Authentication</h3>
          
          <div className="space-y-4">
            <div>
              <Label>Authentication Type</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { value: 'api_key', label: 'API Key', icon: Key },
                  { value: 'oauth2', label: 'OAuth 2.0', icon: Link2 },
                  { value: 'bearer', label: 'Bearer Token', icon: Key },
                  { value: 'basic', label: 'Basic Auth', icon: Key }
                ].map(auth => (
                  <button
                    key={auth.value}
                    onClick={() => setApiConfig(prev => ({ ...prev, authType: auth.value as any }))}
                    className={`p-3 border rounded-lg flex items-center gap-3 transition-colors ${
                      apiConfig.authType === auth.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <auth.icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{auth.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Auth-specific fields */}
            {apiConfig.authType === 'api_key' && (
              <div className="space-y-3">
                <div>
                  <Label>Header Name</Label>
                  <Input
                    placeholder="X-API-Key"
                    value={apiConfig.authConfig.headerName || ''}
                    onChange={(e) => setApiConfig(prev => ({
                      ...prev,
                      authConfig: { ...prev.authConfig, headerName: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={apiConfig.authConfig.location || 'header'}
                    onChange={(e) => setApiConfig(prev => ({
                      ...prev,
                      authConfig: { ...prev.authConfig, location: e.target.value }
                    }))}
                  >
                    <option value="header">Header</option>
                    <option value="query">Query Parameter</option>
                  </select>
                </div>
              </div>
            )}

            {apiConfig.authType === 'oauth2' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  OAuth 2.0 configuration will be handled through Airbyte's OAuth flow.
                  You'll need to set up OAuth credentials in your provider's dashboard.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep('config')}>
              Back
            </Button>
            <Button onClick={() => setStep('endpoints')}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Endpoints */}
      {step === 'endpoints' && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">API Endpoints</h3>
          
          <div className="space-y-4">
            {apiConfig.endpoints.map((endpoint, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <Input
                      placeholder="Endpoint name"
                      value={endpoint.name}
                      onChange={(e) => updateEndpoint(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      placeholder="/api/users"
                      value={endpoint.path}
                      onChange={(e) => updateEndpoint(index, 'path', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={endpoint.method}
                      onChange={(e) => updateEndpoint(index, 'method', e.target.value)}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEndpoint(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addEndpoint}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Endpoint
            </Button>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep('auth')}>
              Back
            </Button>
            <Button onClick={() => setStep('review')}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 5: Review */}
      {step === 'review' && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Review Configuration</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">API Details</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Name:</dt>
                  <dd className="font-medium">{apiConfig.apiName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Base URL:</dt>
                  <dd className="font-medium">{apiConfig.apiUrl}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Authentication:</dt>
                  <dd className="font-medium">{apiConfig.authType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Endpoints:</dt>
                  <dd className="font-medium">{apiConfig.endpoints.length}</dd>
                </div>
              </dl>
            </div>

            {apiConfig.endpoints.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Endpoints</h4>
                <ul className="space-y-1 text-sm">
                  {apiConfig.endpoints.map((ep, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {ep.method}
                      </Badge>
                      <span className="font-medium">{ep.name}</span>
                      <span className="text-gray-600">{ep.path}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep('endpoints')}>
              Back
            </Button>
            <Button 
              onClick={handleCustomSetup}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Connector...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Create Connector
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}