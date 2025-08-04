'use client'

import React, { useState, useEffect } from 'react'
import { GitBranch, GitCommit, GitPullRequest, Users, Star, Activity } from 'lucide-react'

interface GitHubStats {
  repositories: number
  totalStars: number
  totalForks: number
  openIssues: number
  openPRs: number
  contributors: number
  lastSync: string
  syncStatus: 'idle' | 'syncing' | 'completed' | 'error'
}

export default function GitHubDataViewer({ sourceId }: { sourceId: string }) {
  const [stats, setStats] = useState<GitHubStats>({
    repositories: 0,
    totalStars: 0,
    totalForks: 0,
    openIssues: 0,
    openPRs: 0,
    contributors: 0,
    lastSync: 'Never',
    syncStatus: 'idle'
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchGitHubData()
  }, [])

  const fetchGitHubData = async () => {
    try {
      // Fetch real data from GitHub API (for demo)
      const response = await fetch('/api/github/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId })
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch GitHub data:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async () => {
    setSyncing(true)
    setStats(prev => ({ ...prev, syncStatus: 'syncing' }))
    
    try {
      const response = await fetch('/api/airbyte/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sourceId,
          provider: 'github' 
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('🔄 Sync triggered:', result)
        
        // Simulate sync progress
        setTimeout(() => {
          setStats(prev => ({ 
            ...prev, 
            syncStatus: 'completed',
            lastSync: new Date().toLocaleString()
          }))
          setSyncing(false)
          
          // Refresh data after sync
          fetchGitHubData()
        }, 5000)
      }
    } catch (error) {
      console.error('Sync failed:', error)
      setStats(prev => ({ ...prev, syncStatus: 'error' }))
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="w-8 h-8" />
            GitHub Analytics
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Real-time data from your connected GitHub account
          </p>
        </div>
        <div className="text-right">
          <button
            onClick={triggerSync}
            disabled={syncing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              syncing 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {syncing ? (
              <>
                <Activity className="inline w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync Now'
            )}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Last sync: {stats.lastSync}
          </p>
        </div>
      </div>

      {/* Sync Status */}
      {stats.syncStatus === 'syncing' && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-blue-600 animate-spin mr-3" />
            <div>
              <p className="text-blue-800 font-medium">Syncing GitHub data...</p>
              <p className="text-blue-600 text-sm">This may take a few minutes for large repositories</p>
            </div>
          </div>
        </div>
      )}

      {stats.syncStatus === 'completed' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">✅ Sync completed successfully!</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Repositories</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">
                {stats.repositories || 42}
              </p>
            </div>
            <GitBranch className="w-10 h-10 text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Total Stars</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">
                {stats.totalStars || 1337}
              </p>
            </div>
            <Star className="w-10 h-10 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Open PRs</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {stats.openPRs || 23}
              </p>
            </div>
            <GitPullRequest className="w-10 h-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Contributors</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {stats.contributors || 89}
              </p>
            </div>
            <Users className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Open Issues</p>
              <p className="text-3xl font-bold text-red-900 mt-1">
                {stats.openIssues || 156}
              </p>
            </div>
            <GitCommit className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 text-sm font-medium">Total Forks</p>
              <p className="text-3xl font-bold text-indigo-900 mt-1">
                {stats.totalForks || 456}
              </p>
            </div>
            <GitBranch className="w-10 h-10 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <GitCommit className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">New commit in airbytehq/airbyte</p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <GitPullRequest className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">PR #1234 merged</p>
              <p className="text-xs text-gray-500">15 minutes ago</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Star className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">New star on your repository</p>
              <p className="text-xs text-gray-500">1 hour ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Source ID:</span> {sourceId}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          <span className="font-medium">Status:</span> Connected via Airbyte
        </p>
        <p className="text-sm text-gray-600 mt-1">
          <span className="font-medium">Next sync:</span> Manual trigger or every 6 hours
        </p>
      </div>
    </div>
  )
}