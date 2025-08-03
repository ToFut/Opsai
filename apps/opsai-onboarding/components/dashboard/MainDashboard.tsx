'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Sparkles, 
  TrendingUp, 
  Users,
  Zap,
  Shield,
  Code,
  BarChart3,
  PlusCircle,
  Loader2
} from 'lucide-react'
import { auth, db } from '@/lib/supabase'
import AppCard from './AppCard'
import CreateAppModal from './CreateAppModal'

interface Application {
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

const MainDashboard: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApps, setFilteredApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Load user and applications
  useEffect(() => {
    loadUserAndApps()
  }, [])

  // Filter applications based on search and status
  useEffect(() => {
    let filtered = applications

    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.features.some(feature => 
          feature.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    setFilteredApps(filtered)
  }, [applications, searchTerm, statusFilter])

  const loadUserAndApps = async () => {
    try {
      const { user } = await auth.getCurrentUser()
      if (user) {
        setUser(user)
        const { data: apps, error } = await db.getApplications(user.id)
        if (error) throw error
        setApplications(apps || [])
      }
    } catch (error) {
      console.error('Failed to load applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateApp = async (appData: any) => {
    try {
      if (!user) return
      
      const { data: newApp, error } = await db.createApplication({
        ...appData,
        user_id: user.id,
        tenant_id: 'default', // You might want to get this from user context
        features: appData.features || []
      })

      if (error) throw error

      setApplications(prev => [newApp, ...prev])
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create application:', error)
    }
  }

  const handleEditApp = (appId: string) => {
    // Navigate to edit page or open edit modal
    console.log('Edit app:', appId)
  }

  const handleDeleteApp = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return

    try {
      const { error } = await db.deleteApplication(appId)
      if (error) throw error

      setApplications(prev => prev.filter(app => app.id !== appId))
    } catch (error) {
      console.error('Failed to delete application:', error)
    }
  }

  const handleImproveApp = (appId: string) => {
    // Navigate to improvement dashboard
    window.location.href = `/improve/${appId}`
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                🚀 OpsAI Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Welcome, {user?.user_metadata?.first_name || user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Apps</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'running').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Security</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.length > 0 
                    ? Math.round(applications.reduce((acc, app) => acc + (app.securityScore?.overall || 0), 0) / applications.length)
                    : 0
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Code className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Quality</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.length > 0 
                    ? Math.round(applications.reduce((acc, app) => acc + (app.codeQuality?.maintainability || 0), 0) / applications.length)
                    : 0
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="error">Error</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create App
              </button>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        {filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {applications.length === 0 ? 'No applications yet' : 'No applications found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {applications.length === 0 
                  ? 'Create your first application to get started with AI-powered improvements!'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {applications.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center mx-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First App
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onEdit={handleEditApp}
                onDelete={handleDeleteApp}
                onImprove={handleImproveApp}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create App Modal */}
      {showCreateModal && (
        <CreateAppModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateApp}
        />
      )}
    </div>
  )
}

export default MainDashboard 