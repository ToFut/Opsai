'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Server, Download, Play, Settings, BarChart3, 
  CheckCircle, AlertCircle, Loader2, RefreshCw,
  Database, Zap, Brain, Globe, Shield
} from 'lucide-react'

interface ModelStatus {
  name: string
  files: any[]
  status: string
  sizeGB: number
  lastUsed: string | null
}

interface SystemStatus {
  success: boolean
  models: ModelStatus[]
  storage: {
    provider: string
    buckets: string[]
  }
  inference: {
    available: boolean
    fallback: boolean
  }
}

export default function GPTOSSAdmin() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    checkSystemStatus()
  }, [])

  const checkSystemStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/gpt-oss/status')
      const data = await response.json()
      setStatus(data)
      addLog(`✅ System status checked - ${data.models?.length || 0} models available`)
    } catch (error) {
      addLog(`❌ Failed to check system status: ${error}`)
    }
    setLoading(false)
  }

  const initializeStorage = async () => {
    addLog('🚀 Initializing Supabase storage...')
    try {
      const response = await fetch('/api/gpt-oss/initialize', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        addLog('✅ Storage initialized successfully')
        checkSystemStatus()
      } else {
        addLog('❌ Storage initialization failed')
      }
    } catch (error) {
      addLog(`❌ Storage initialization error: ${error}`)
    }
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)])
  }

  const StatusCard = ({ title, value, status, icon: Icon, description }: {
    title: string
    value: string | number
    status: 'good' | 'warning' | 'error'
    icon: any
    description: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${
            status === 'good' ? 'bg-green-100 text-green-600' :
            status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
            'bg-red-100 text-red-600'
          }`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${
          status === 'good' ? 'bg-green-500' :
          status === 'warning' ? 'bg-yellow-500' :
          'bg-red-500'
        }`} />
      </div>
      <p className="text-sm text-gray-600 mt-2">{description}</p>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading GPT-OSS Admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-600" />
                GPT-OSS Admin Panel
              </h1>
              <p className="text-gray-600 mt-1">Manage your local AI models and infrastructure</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={checkSystemStatus}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={initializeStorage}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Database className="w-4 h-4" />
                Initialize
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatusCard
            title="Models Available"
            value={status?.models?.length || 0}
            status={status?.models?.length ? 'good' : 'warning'}
            icon={Brain}
            description="GPT-OSS models ready for inference"
          />
          <StatusCard
            title="Storage Provider"
            value={status?.storage?.provider || 'N/A'}
            status={status?.storage?.provider === 'supabase' ? 'good' : 'warning'}
            icon={Database}
            description="Model storage infrastructure"
          />
          <StatusCard
            title="Local Inference"
            value={status?.inference?.available ? 'Ready' : 'Fallback'}
            status={status?.inference?.available ? 'good' : 'warning'}
            icon={Zap}
            description="Local model inference capability"
          />
          <StatusCard
            title="System Status"
            value={status?.success ? 'Online' : 'Offline'}
            status={status?.success ? 'good' : 'error'}
            icon={status?.success ? CheckCircle : AlertCircle}
            description="Overall system health"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'models', label: 'Models', icon: Brain },
                { id: 'performance', label: 'Performance', icon: Zap },
                { id: 'logs', label: 'Logs', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Integration Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Website Analysis</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>YAML Generation</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Code Generation</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Workflow Analysis</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Benefits Active
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Zero API Costs</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Data Privacy</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Custom Models</span>
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Fallback Protection</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Models Tab */}
            {activeTab === 'models' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Model Management</h2>
                
                <div className="grid gap-4">
                  {[
                    { name: 'GPT-OSS-20B', status: 'Not Downloaded', size: '40GB', speed: '2-3s' },
                    { name: 'GPT-OSS-120B', status: 'Not Downloaded', size: '240GB', speed: '5-10s' },
                    { name: 'OpenAI GPT-4', status: 'Available (Fallback)', size: 'API', speed: '3-5s' }
                  ].map(model => (
                    <div key={model.name} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{model.name}</h3>
                          <p className="text-sm text-gray-500">Size: {model.size} | Response: {model.speed}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            model.status === 'Available (Fallback)' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {model.status}
                          </span>
                          {model.status === 'Not Downloaded' && (
                            <button className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Performance Metrics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Requests Today</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">$0</div>
                    <div className="text-sm text-gray-600">API Costs Saved</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">0ms</div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Model Comparison</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">OpenAI GPT-4</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">System Logs</h2>
                  <button 
                    onClick={() => setLogs([])}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear Logs
                  </button>
                </div>
                
                <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-gray-500">No logs available. Perform some actions to see logs here.</div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1">{log}</div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}