'use client'

import React from 'react'
import Link from 'next/link'
import { 
  ExternalLink, 
  GitBranch, 
  Settings, 
  Trash2, 
  Play, 
  Pause, 
  AlertCircle,
  TrendingUp,
  Shield,
  Code,
  Users,
  Sparkles
} from 'lucide-react'

interface AppCardProps {
  app: {
    id: string
    name: string
    description?: string
    url?: string
    gitRepo?: string
    previewUrl?: string
    status: 'running' | 'stopped' | 'error'
    version: string
    features: string[]
    performanceMetrics?: {
      lighthouseScore: number
    }
    securityScore?: {
      overall: number
    }
    codeQuality?: {
      maintainability: number
      testCoverage: number
    }
    aiInsights?: Array<{
      id: string
      type: string
      title: string
      impact: string
    }>
    createdAt: string
  }
  onEdit: (appId: string) => void
  onDelete: (appId: string) => void
  onImprove: (appId: string) => void
}

const AppCard: React.FC<AppCardProps> = ({ app, onEdit, onDelete, onImprove }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800 border-green-200'
      case 'stopped': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />
      case 'stopped': return <Pause className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return <Pause className="w-4 h-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{app.name}</h3>
            {app.description && (
              <p className="text-gray-600 text-sm mb-3">{app.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>v{app.version}</span>
              <span>•</span>
              <span>{new Date(app.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
              {getStatusIcon(app.status)}
              <span className="ml-1 capitalize">{app.status}</span>
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
              <span className="text-sm font-medium text-gray-700">Performance</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {app.performanceMetrics?.lighthouseScore || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Shield className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm font-medium text-gray-700">Security</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {app.securityScore?.overall || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Code className="w-4 h-4 text-purple-600 mr-1" />
              <span className="text-sm font-medium text-gray-700">Quality</span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {app.codeQuality?.maintainability || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="p-6 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Features</h4>
        <div className="flex flex-wrap gap-2">
          {app.features.slice(0, 3).map((feature, index) => (
            <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
              {feature}
            </span>
          ))}
          {app.features.length > 3 && (
            <span className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs">
              +{app.features.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* AI Insights */}
      {app.aiInsights && app.aiInsights.length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center mb-3">
            <Sparkles className="w-4 h-4 text-indigo-600 mr-2" />
            <h4 className="text-sm font-medium text-gray-700">AI Insights</h4>
          </div>
          <div className="space-y-2">
            {app.aiInsights.slice(0, 2).map((insight) => (
              <div key={insight.id} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
                <span className="text-xs text-indigo-700 truncate">{insight.title}</span>
                <span className={`text-xs px-2 py-1 rounded-full border ${getImpactColor(insight.impact)}`}>
                  {insight.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {app.url && (
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View Live
              </a>
            )}
            {app.gitRepo && (
              <a
                href={app.gitRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <GitBranch className="w-4 h-4 mr-1" />
                Repository
              </a>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Link
              href={`/dashboard/${app.id}`}
              className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Manage
            </Link>
            <button
              onClick={() => onEdit(app.id)}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </button>
            <button
              onClick={() => onDelete(app.id)}
              className="flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppCard 