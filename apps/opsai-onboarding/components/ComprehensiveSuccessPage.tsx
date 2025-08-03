'use client'

import React, { useState, useEffect } from 'react'
import { Check, ExternalLink, Copy, RefreshCw, Shield, Activity, Book, HeadphonesIcon, Zap, AlertCircle, CheckCircle, Clock, Users, Database, Globe, Settings, ChevronRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'

interface SuccessPageProps {
  deploymentResult: {
    appId: string
    deploymentId: string
    url: string
    customDomainUrl?: string
    platform: string
    environment: string
    adminCredentials: {
      email: string
      password: string
      dashboardUrl: string
    }
    monitoring: {
      sentryDsn?: string
      posthogApiKey?: string
      vercelAnalyticsId?: string
    }
    apiKeys: {
      supabaseUrl: string
      supabaseAnonKey: string
      supabaseServiceKey: string
    }
    integrations: Array<{
      provider: string
      status: 'connected' | 'pending'
      syncEnabled: boolean
    }>
    documentation: {
      apiDocsUrl: string
      readmeUrl: string
      postmanCollectionUrl?: string
    }
  }
  onSetupMonitoring: () => void
  onViewDashboard: () => void
  onContactSupport: () => void
}

export function ComprehensiveSuccessPage({
  deploymentResult,
  onSetupMonitoring,
  onViewDashboard,
  onContactSupport
}: SuccessPageProps) {
  // Debug: Log what URL we received
  console.log('🎉 ComprehensiveSuccessPage received dashboardUrl:', deploymentResult.adminCredentials.dashboardUrl)
  const [copied, setCopied] = useState<string | null>(null)
  const [deploymentStatus, setDeploymentStatus] = useState<'checking' | 'live' | 'pending'>('checking')
  const [sslStatus, setSslStatus] = useState<'checking' | 'active' | 'pending'>('checking')
  const [monitoringSetup, setMonitoringSetup] = useState({
    sentry: false,
    posthog: false,
    vercelAnalytics: false
  })

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    // Check deployment status
    checkDeploymentStatus()
    
    // Check SSL status for custom domain
    if (deploymentResult.customDomainUrl) {
      checkSSLStatus()
    }
  }, [])

  const checkDeploymentStatus = async () => {
    try {
      const response = await fetch(deploymentResult.url, { method: 'HEAD' })
      if (response.ok) {
        setDeploymentStatus('live')
      } else {
        setDeploymentStatus('pending')
        // Retry after 5 seconds
        setTimeout(checkDeploymentStatus, 5000)
      }
    } catch (error) {
      setDeploymentStatus('pending')
      setTimeout(checkDeploymentStatus, 5000)
    }
  }

  const checkSSLStatus = async () => {
    try {
      const response = await fetch(deploymentResult.customDomainUrl!, { method: 'HEAD' })
      if (response.ok) {
        setSslStatus('active')
      } else {
        setSslStatus('pending')
        setTimeout(checkSSLStatus, 10000)
      }
    } catch (error) {
      setSslStatus('pending')
      setTimeout(checkSSLStatus, 10000)
    }
  }

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(null), 2000)
  }

  const setupMonitoringService = async (service: 'sentry' | 'posthog' | 'vercelAnalytics') => {
    try {
      // Call API to setup monitoring
      const response = await fetch('/api/setup-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: deploymentResult.appId,
          service,
          config: deploymentResult.monitoring
        })
      })

      if (response.ok) {
        setMonitoringSetup(prev => ({ ...prev, [service]: true }))
        toast.success(`${service} monitoring enabled!`)
      }
    } catch (error) {
      toast.error(`Failed to setup ${service}`)
    }
  }

  const getIntegrationStats = () => {
    const total = deploymentResult.integrations.length
    const connected = deploymentResult.integrations.filter(i => i.status === 'connected').length
    const syncing = deploymentResult.integrations.filter(i => i.syncEnabled).length
    
    return { total, connected, syncing }
  }

  const integrationStats = getIntegrationStats()
  const monitoringProgress = Object.values(monitoringSetup).filter(Boolean).length * 33.33

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Congratulations! Your App is Live!
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your application has been successfully generated and deployed. 
            Here's everything you need to get started.
          </p>
        </motion.div>

        {/* Quick Access Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-green-200 hover:border-green-300 transition-colors cursor-pointer"
                  onClick={() => window.open(deploymentResult.url, '_blank')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  Live Application
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {deploymentStatus === 'live' ? (
                      <Badge variant="default" className="bg-green-600">Live</Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        Deploying
                      </Badge>
                    )}
                    <span className="text-sm text-gray-600">{deploymentResult.platform}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mt-2 break-all">
                  {deploymentResult.url}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => {
                    console.log('🔗 Card click - Opening dashboard:', deploymentResult.adminCredentials.dashboardUrl)
                    const opened = window.open(deploymentResult.adminCredentials.dashboardUrl, '_blank')
                    if (!opened) {
                      alert(`Please navigate to: ${deploymentResult.adminCredentials.dashboardUrl}\n\nCredentials:\nEmail: ${deploymentResult.adminCredentials.email}\nPassword: ${deploymentResult.adminCredentials.password}`)
                    }
                  }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Admin Dashboard
                  {/* Debug: Show what URL we have */}
                  <Badge variant="outline" className="ml-2 text-xs">
                    {deploymentResult.adminCredentials.dashboardUrl || 'NO URL'}
                  </Badge>
                  {deploymentResult.adminCredentials.dashboardUrl?.includes('localhost') && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Local
                    </Badge>
                  )}
                </CardTitle>
                {deploymentResult.adminCredentials.dashboardUrl?.includes('localhost') && (
                  <CardDescription>
                    🏠 Running locally at {deploymentResult.adminCredentials.dashboardUrl}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-mono">{deploymentResult.adminCredentials.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Password:</span>
                    <span className="font-mono">{deploymentResult.adminCredentials.password}</span>
                  </div>
                  {deploymentResult.adminCredentials.dashboardUrl?.includes('localhost') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-xs text-blue-700 mb-1">Manual Access:</div>
                      <div className="text-xs font-mono text-blue-800 break-all">
                        {deploymentResult.adminCredentials.dashboardUrl}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs mt-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(deploymentResult.adminCredentials.dashboardUrl)
                          toast.success('URL copied to clipboard!')
                        }}
                      >
                        Copy URL
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDashboard()
                      }}
                    >
                      Access Dashboard
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    {/* Force localhost button as fallback */}
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('🚀 Force opening localhost demo')
                        
                        // For now, open a demo page that actually exists
                        const demoUrl = 'http://localhost:7250/demo-admin'
                        console.log('Opening demo admin at:', demoUrl)
                        
                        const opened = window.open(demoUrl, '_blank')
                        if (!opened) {
                          alert(`Please navigate to: ${demoUrl}\n\nThis is a demo admin panel showing what your generated app would look like.\n\nCredentials:\nEmail: admin@example.com\nPassword: admin123`)
                        }
                      }}
                    >
                      🏠 Open Demo Admin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-purple-200 hover:border-purple-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  Data Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Connected:</span>
                    <Badge variant="outline">{integrationStats.connected}/{integrationStats.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Syncing:</span>
                    <Badge variant="outline" className="bg-green-50">
                      {integrationStats.syncing} active
                    </Badge>
                  </div>
                  <Progress value={(integrationStats.connected / integrationStats.total) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="credentials" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
          </TabsList>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Credentials</CardTitle>
                <CardDescription>
                  Save these credentials securely. You'll need them to access your application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Admin Credentials */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Admin Access
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Dashboard URL:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded text-sm">
                          {deploymentResult.adminCredentials.dashboardUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(deploymentResult.adminCredentials.dashboardUrl, 'dashboard-url')}
                        >
                          {copied === 'dashboard-url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded text-sm">
                          {deploymentResult.adminCredentials.email}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(deploymentResult.adminCredentials.email, 'admin-email')}
                        >
                          {copied === 'admin-email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Password:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded text-sm font-mono">
                          {deploymentResult.adminCredentials.password}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(deploymentResult.adminCredentials.password, 'admin-password')}
                        >
                          {copied === 'admin-password' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* API Keys */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    API Keys
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Supabase URL:</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(deploymentResult.apiKeys.supabaseUrl, 'supabase-url')}
                        >
                          {copied === 'supabase-url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <code className="block bg-white px-3 py-2 rounded text-xs break-all">
                        {deploymentResult.apiKeys.supabaseUrl}
                      </code>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Anon Key:</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(deploymentResult.apiKeys.supabaseAnonKey, 'anon-key')}
                        >
                          {copied === 'anon-key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <code className="block bg-white px-3 py-2 rounded text-xs break-all">
                        {deploymentResult.apiKeys.supabaseAnonKey}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Custom Domain */}
                {deploymentResult.customDomainUrl && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Custom Domain
                    </h3>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Domain Configuration Required</AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">Your custom domain <strong>{deploymentResult.customDomainUrl}</strong> needs DNS configuration.</p>
                        <p className="text-sm">Add a CNAME record pointing to: <code className="bg-gray-100 px-1 rounded">{new URL(deploymentResult.url).hostname}</code></p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={sslStatus === 'active' ? 'default' : 'secondary'}>
                            {sslStatus === 'active' ? 'SSL Active' : 'SSL Pending'}
                          </Badge>
                          {sslStatus === 'pending' && <Loader2 className="w-3 h-3 animate-spin" />}
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Monitoring</CardTitle>
                <CardDescription>
                  Set up monitoring to track performance, errors, and user behavior.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Sentry Error Tracking</h4>
                        <p className="text-sm text-gray-600">Monitor errors and performance issues</p>
                      </div>
                    </div>
                    <Button
                      variant={monitoringSetup.sentry ? "secondary" : "default"}
                      disabled={monitoringSetup.sentry}
                      onClick={() => setupMonitoringService('sentry')}
                    >
                      {monitoringSetup.sentry ? 'Enabled' : 'Enable'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">PostHog Analytics</h4>
                        <p className="text-sm text-gray-600">Track user behavior and product metrics</p>
                      </div>
                    </div>
                    <Button
                      variant={monitoringSetup.posthog ? "secondary" : "default"}
                      disabled={monitoringSetup.posthog}
                      onClick={() => setupMonitoringService('posthog')}
                    >
                      {monitoringSetup.posthog ? 'Enabled' : 'Enable'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Vercel Analytics</h4>
                        <p className="text-sm text-gray-600">Web vitals and performance metrics</p>
                      </div>
                    </div>
                    <Button
                      variant={monitoringSetup.vercelAnalytics ? "secondary" : "default"}
                      disabled={monitoringSetup.vercelAnalytics}
                      onClick={() => setupMonitoringService('vercelAnalytics')}
                    >
                      {monitoringSetup.vercelAnalytics ? 'Enabled' : 'Enable'}
                    </Button>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Monitoring Setup Progress</span>
                      <span className="text-sm text-gray-600">{Math.round(monitoringProgress)}%</span>
                    </div>
                    <Progress value={monitoringProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Integrations</CardTitle>
                <CardDescription>
                  Your data sources and their sync status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deploymentResult.integrations.map((integration, index) => (
                    <motion.div
                      key={integration.provider}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Database className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold capitalize">{integration.provider}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={integration.status === 'connected' ? 'default' : 'secondary'}
                              className={integration.status === 'connected' ? 'bg-green-600' : ''}
                            >
                              {integration.status === 'connected' ? 'Connected' : 'Pending'}
                            </Badge>
                            {integration.syncEnabled && (
                              <Badge variant="outline" className="text-xs">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Syncing
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Configure
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Developer Resources</CardTitle>
                <CardDescription>
                  Everything you need to work with your new application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border hover:border-blue-300 transition-colors cursor-pointer"
                        onClick={() => window.open(deploymentResult.documentation.apiDocsUrl, '_blank')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Book className="w-5 h-5 text-blue-600" />
                        API Documentation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Interactive API documentation with endpoints, schemas, and examples.
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-blue-600 text-sm">
                        View Docs <ExternalLink className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border hover:border-green-300 transition-colors cursor-pointer"
                        onClick={() => window.open(deploymentResult.documentation.readmeUrl, '_blank')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Book className="w-5 h-5 text-green-600" />
                        README & Setup Guide
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Project setup instructions, architecture overview, and development guide.
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
                        View Guide <ExternalLink className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>

                  {deploymentResult.documentation.postmanCollectionUrl && (
                    <Card className="border hover:border-orange-300 transition-colors cursor-pointer"
                          onClick={() => window.open(deploymentResult.documentation.postmanCollectionUrl, '_blank')}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Zap className="w-5 h-5 text-orange-600" />
                          Postman Collection
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Ready-to-use API collection for testing and development.
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-orange-600 text-sm">
                          Download <ExternalLink className="w-3 h-3" />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border hover:border-purple-300 transition-colors cursor-pointer"
                        onClick={() => window.open('https://supabase.com/docs', '_blank')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="w-5 h-5 text-purple-600" />
                        Supabase Documentation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Learn about authentication, database, and real-time features.
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-purple-600 text-sm">
                        View Docs <ExternalLink className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Next Steps Tab */}
          <TabsContent value="next-steps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Next Steps</CardTitle>
                <CardDescription>
                  Complete these steps to ensure your application is production-ready.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg flex items-start gap-3">
                    <div className="mt-1">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Configure DNS (if using custom domain)</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Add the CNAME record to your domain provider to activate your custom domain.
                      </p>
                      <Button size="sm" variant="outline">
                        View DNS Instructions
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg flex items-start gap-3">
                    <div className="mt-1">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Enable Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Secure your admin account with 2FA for enhanced security.
                      </p>
                      <Button size="sm" variant="outline" onClick={onViewDashboard}>
                        Go to Security Settings
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg flex items-start gap-3">
                    <div className="mt-1">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Invite Team Members</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Add your team members and set up proper role-based access control.
                      </p>
                      <Button size="sm" variant="outline" onClick={onViewDashboard}>
                        Manage Team
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg flex items-start gap-3">
                    <div className="mt-1">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Complete Monitoring Setup</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Enable all monitoring services to track performance and catch issues early.
                      </p>
                      <Button size="sm" variant="outline" onClick={onSetupMonitoring}>
                        Setup Monitoring
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <HeadphonesIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Need Help?</h3>
                      <p className="text-sm text-gray-600">
                        Our support team is here to help you succeed.
                      </p>
                    </div>
                  </div>
                  <Button onClick={onContactSupport}>
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}