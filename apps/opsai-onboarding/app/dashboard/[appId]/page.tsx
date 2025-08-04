'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CodeEditor from '@/components/dashboard/CodeEditor'
import { 
  Settings, Code, Eye, Edit2, Save, RefreshCw, 
  Plus, Trash2, BarChart3, Link2, Workflow, 
  Shield, Palette, Download, Upload, Sparkles, CheckCircle
} from 'lucide-react'

interface Application {
  id: string
  name: string
  website_url: string
  status: string
  config: {
    integrations: any[]
    workflows: any[]
    auth: any
    visualization: any
  }
  created_at: string
  updated_at: string
}

interface DashboardTab {
  id: string
  label: string
  icon: any
}

const TABS: DashboardTab[] = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'auth', label: 'Authentication', icon: Shield },
  { id: 'visualization', label: 'Dashboard', icon: BarChart3 },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export default function ApplicationDashboard() {
  const router = useRouter()
  const params = useParams()
  const appId = params.appId as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [application, setApplication] = useState<Application | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadApplication()
  }, [appId])

  const loadApplication = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/login')
        return
      }

      const { data: app, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', appId)
        .eq('user_id', user.id)
        .single()

      if (error || !app) {
        router.push('/dashboard')
        return
      }

      setApplication(app)
    } catch (error) {
      console.error('Failed to load application:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveChanges = async () => {
    if (!application) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          config: application.config,
          updated_at: new Date().toISOString()
        })
        .eq('id', appId)

      if (error) throw error

      setEditMode(false)
      // Show success toast
    } catch (error) {
      console.error('Failed to save changes:', error)
      // Show error toast
    } finally {
      setSaving(false)
    }
  }

  const generateCode = async (prompt: string) => {
    setGenerating(true)
    try {
      // In a real implementation, this would call your AI service
      const response = await fetch('/api/ai-generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          prompt,
          context: application?.config
        })
      })

      const data = await response.json()
      
      // Apply generated code to application
      if (data.code) {
        // Update application config with new code
        setApplication(prev => ({
          ...prev!,
          config: {
            ...prev!.config,
            ...data.updates
          }
        }))
      }
    } catch (error) {
      console.error('Code generation failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  const renderTabContent = () => {
    if (!application) return null

    switch (activeTab) {
      case 'overview':
        return <OverviewTab application={application} />
      
      case 'integrations':
        return (
          <IntegrationsTab 
            integrations={application.config.integrations}
            editMode={editMode}
            onChange={(integrations) => setApplication(prev => ({
              ...prev!,
              config: { ...prev!.config, integrations }
            }))}
          />
        )
      
      case 'workflows':
        return (
          <WorkflowsTab 
            workflows={application.config.workflows}
            editMode={editMode}
            onChange={(workflows) => setApplication(prev => ({
              ...prev!,
              config: { ...prev!.config, workflows }
            }))}
          />
        )
      
      case 'auth':
        return (
          <AuthTab 
            authConfig={application.config.auth}
            editMode={editMode}
            onChange={(auth) => setApplication(prev => ({
              ...prev!,
              config: { ...prev!.config, auth }
            }))}
          />
        )
      
      case 'visualization':
        return (
          <VisualizationTab 
            vizConfig={application.config.visualization}
            editMode={editMode}
            onChange={(visualization) => setApplication(prev => ({
              ...prev!,
              config: { ...prev!.config, visualization }
            }))}
          />
        )
      
      case 'code':
        return <CodeTab application={application} />
      
      case 'settings':
        return <SettingsTab application={application} />
      
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Application not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{application.name}</h1>
              <p className="text-sm text-gray-600">{application.website_url}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Eye className="w-4 h-4 mr-2" />
                    View Live
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mt-6 -mb-px">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* AI Assistant Bar */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <input
              type="text"
              value={aiSuggestion}
              onChange={(e) => setAiSuggestion(e.target.value)}
              placeholder="Ask AI to improve your app (e.g., 'Add user authentication', 'Improve dashboard design')"
              className="flex-1 bg-white rounded-lg px-4 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-purple-600"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && aiSuggestion.trim()) {
                  generateCode(aiSuggestion)
                  setAiSuggestion('')
                }
              }}
            />
            <button
              onClick={() => {
                if (aiSuggestion.trim()) {
                  generateCode(aiSuggestion)
                  setAiSuggestion('')
                }
              }}
              disabled={generating || !aiSuggestion.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {renderTabContent()}
      </div>
    </div>
  )
}

// Tab Components
function OverviewTab({ application }: { application: Application }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Application Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {application.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Created</span>
            <span className="text-sm">{new Date(application.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Last Updated</span>
            <span className="text-sm">{new Date(application.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-600">Uptime</span>
              <span className="font-semibold">99.9%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.9%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-600">Response Time</span>
              <span className="font-semibold">124ms</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between">
              <span>Export Configuration</span>
              <Download className="w-4 h-4 text-gray-400" />
            </div>
          </button>
          <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between">
              <span>Import Changes</span>
              <Upload className="w-4 h-4 text-gray-400" />
            </div>
          </button>
          <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center justify-between">
              <span>Restart Application</span>
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

function IntegrationsTab({ integrations, editMode, onChange }: any) {
  const addIntegration = () => {
    onChange([...integrations, {
      id: `new-${Date.now()}`,
      name: 'New Integration',
      type: 'Custom',
      status: 'suggested',
      connectionStatus: 'not_connected',
      value: 'Configure this integration',
      estimatedTime: '5 minutes',
      required: false
    }])
  }

  const removeIntegration = (id: string) => {
    onChange(integrations.filter((i: any) => i.id !== id))
  }

  const updateIntegration = (id: string, updates: any) => {
    onChange(integrations.map((i: any) => i.id === id ? { ...i, ...updates } : i))
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Connected Integrations</h2>
          {editMode && (
            <button
              onClick={addIntegration}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {integrations.map((integration: any) => (
            <div key={integration.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {editMode ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={integration.name}
                        onChange={(e) => updateIntegration(integration.id, { name: e.target.value })}
                        className="font-semibold text-lg border-b focus:outline-none focus:border-blue-600"
                      />
                      <input
                        type="text"
                        value={integration.value}
                        onChange={(e) => updateIntegration(integration.id, { value: e.target.value })}
                        className="text-sm text-gray-600 border-b focus:outline-none focus:border-blue-600 w-full"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-lg">{integration.name}</h3>
                      <p className="text-sm text-gray-600">{integration.value}</p>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  {integration.connectionStatus === 'connected' ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Connected
                    </span>
                  ) : (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Connect
                    </button>
                  )}
                  
                  {editMode && (
                    <button
                      onClick={() => removeIntegration(integration.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WorkflowsTab({ workflows, editMode, onChange }: any) {
  const addWorkflow = () => {
    onChange([...workflows, {
      id: `new-${Date.now()}`,
      name: 'New Workflow',
      description: 'Configure this workflow',
      enabled: false,
      editable: true,
      triggers: [],
      actions: [],
      category: 'user_added'
    }])
  }

  const removeWorkflow = (id: string) => {
    onChange(workflows.filter((w: any) => w.id !== id))
  }

  const updateWorkflow = (id: string, updates: any) => {
    onChange(workflows.map((w: any) => w.id === id ? { ...w, ...updates } : w))
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Workflows</h2>
          {editMode && (
            <button
              onClick={addWorkflow}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Workflow
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {workflows.map((workflow: any) => (
            <div key={workflow.id} className={`border rounded-lg p-4 ${
              workflow.enabled ? 'bg-blue-50 border-blue-200' : ''
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={workflow.enabled}
                    onChange={(e) => updateWorkflow(workflow.id, { enabled: e.target.checked })}
                    disabled={!editMode}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    {editMode ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={workflow.name}
                          onChange={(e) => updateWorkflow(workflow.id, { name: e.target.value })}
                          className="font-semibold border-b focus:outline-none focus:border-blue-600 w-full"
                        />
                        <textarea
                          value={workflow.description}
                          onChange={(e) => updateWorkflow(workflow.id, { description: e.target.value })}
                          className="text-sm text-gray-600 border rounded p-2 focus:outline-none focus:border-blue-600 w-full"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="font-semibold">{workflow.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                      </>
                    )}
                    
                    {workflow.category === 'ai_generated' && (
                      <span className="inline-flex items-center text-xs text-purple-600 mt-2">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Generated
                      </span>
                    )}
                  </div>
                </div>
                
                {editMode && (
                  <button
                    onClick={() => removeWorkflow(workflow.id)}
                    className="text-red-600 hover:text-red-700 ml-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AuthTab({ authConfig, editMode, onChange }: any) {
  const updateMethod = (type: string, updates: any) => {
    onChange({
      ...authConfig,
      methods: authConfig.methods.map((m: any) => 
        m.type === type ? { ...m, ...updates } : m
      )
    })
  }

  const updateFeature = (feature: string, value: boolean) => {
    onChange({
      ...authConfig,
      features: {
        ...authConfig.features,
        [feature]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Login Methods */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Login Methods</h2>
        </div>
        <div className="p-6 space-y-3">
          {authConfig.methods.map((method: any) => (
            <div key={method.type} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={method.enabled}
                    onChange={(e) => updateMethod(method.type, { enabled: e.target.checked })}
                    disabled={!editMode}
                  />
                  <div>
                    <p className="font-medium">{method.label}</p>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                </div>
                {method.enabled && !method.configured && editMode && (
                  <button className="text-blue-600 text-sm hover:underline">
                    Configure →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Security Features</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(authConfig.features).map(([feature, enabled]) => (
              <label key={feature} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={enabled as boolean}
                  onChange={(e) => updateFeature(feature, e.target.checked)}
                  disabled={!editMode}
                />
                <span className="text-sm">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function VisualizationTab({ vizConfig, editMode, onChange }: any) {
  const updateWidget = (widgetId: string, enabled: boolean) => {
    onChange({
      ...vizConfig,
      dashboardWidgets: vizConfig.dashboardWidgets.map((w: any) => 
        w.id === widgetId ? { ...w, enabled } : w
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Preview */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Dashboard Preview</h2>
        </div>
        <div className="p-6">
          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              {vizConfig.dashboardWidgets
                .filter((w: any) => w.enabled)
                .slice(0, 4)
                .map((widget: any) => (
                  <div key={widget.id} className="bg-white rounded-lg p-4 border">
                    <BarChart3 className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="font-medium">{widget.name}</p>
                    <p className="text-sm text-gray-500">{widget.description}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customization */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Customization</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select 
                value={vizConfig.theme}
                onChange={(e) => onChange({ ...vizConfig, theme: e.target.value })}
                disabled={!editMode}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Brand Color</label>
              <input
                type="color"
                value={vizConfig.primaryColor}
                onChange={(e) => onChange({ ...vizConfig, primaryColor: e.target.value })}
                disabled={!editMode}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Widgets */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Dashboard Widgets</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {vizConfig.dashboardWidgets.map((widget: any) => (
              <label key={widget.id} className="border rounded-lg p-3 cursor-pointer hover:border-blue-500">
                <input
                  type="checkbox"
                  checked={widget.enabled}
                  onChange={(e) => updateWidget(widget.id, e.target.checked)}
                  disabled={!editMode}
                  className="mr-2"
                />
                <span className="font-medium">{widget.name}</span>
                <p className="text-xs text-gray-500 ml-6">{widget.description}</p>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeTab({ application }: { application: Application }) {
  const handleSave = (files: any[]) => {
    console.log('Saving files:', files)
    // Save files to database or trigger rebuild
  }

  const handleDeploy = async () => {
    console.log('Deploying to GitHub Actions...')
    
    try {
      const response = await fetch('/api/github/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: application.id,
          files: [], // Current files from CodeEditor
          config: {
            repositoryName: `${application.name.toLowerCase().replace(/\s+/g, '-')}-app`,
            isPrivate: true,
            deploymentPlatform: 'vercel', // or 'netlify', 'github-pages'
            environmentVariables: {
              // Add any env vars needed
            }
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Deployed to GitHub:', result.repository.url)
        console.log('🚀 Live URL:', result.deployment.url)
        
        // Show success notification
        alert(`Successfully deployed! 
Repository: ${result.repository.url}
Live URL: ${result.deployment.url}`)
      } else {
        console.error('❌ Deployment failed:', result.error)
        alert(`Deployment failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Deployment error:', error)
      alert('Deployment failed. Please try again.')
    }
  }

  return (
    <div className="h-full">
      <CodeEditor 
        appId={application.id}
        onSave={handleSave}
        onDeploy={handleDeploy}
      />
    </div>
  )
}

function SettingsTab({ application }: { application: Application }) {
  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">General Settings</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Application Name</label>
            <input
              type="text"
              value={application.name}
              className="w-full border rounded-lg px-3 py-2"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Website URL</label>
            <input
              type="url"
              value={application.website_url}
              className="w-full border rounded-lg px-3 py-2"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Deployment Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Deployment</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Production URL</p>
                <p className="text-sm text-gray-600">https://{application.name.toLowerCase().replace(/\s+/g, '-')}.vercel.app</p>
              </div>
              <button className="text-blue-600 hover:underline">
                Change Domain
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow border-red-200">
        <div className="p-6 border-b border-red-200">
          <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
        </div>
        <div className="p-6">
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Delete Application
          </button>
        </div>
      </div>
    </div>
  )
}