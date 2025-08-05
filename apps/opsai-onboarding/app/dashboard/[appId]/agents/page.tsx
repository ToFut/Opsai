'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, Code, TrendingUp, Phone, DollarSign, Link } from 'lucide-react'
import AgentInterface from '@/components/dashboard/AgentInterface'
import { useAgentWebSocket } from '@/hooks/useAgentWebSocket'
import { toast } from 'sonner'

const AGENT_PRESETS = [
  {
    id: 'business-analysis',
    name: 'Business Analysis Suite',
    description: 'Comprehensive business analysis including market research, ROI calculation, and risk assessment',
    icon: TrendingUp,
    agents: ['Business Analyst'],
    tasks: [
      { type: 'market_research', description: 'Analyze market trends and competitors' },
      { type: 'roi_calculation', description: 'Calculate ROI and financial metrics' },
      { type: 'workflow_optimization', description: 'Optimize business workflows' }
    ]
  },
  {
    id: 'full-stack-development',
    name: 'Full-Stack Development',
    description: 'Generate complete features with frontend, backend, and tests',
    icon: Code,
    agents: ['Code Generator'],
    tasks: [
      { type: 'full_feature', description: 'Create complete feature with UI, API, and tests' }
    ]
  },
  {
    id: 'customer-engagement',
    name: 'Customer Engagement',
    description: 'Automated customer communication via calls, emails, and messages',
    icon: Phone,
    agents: ['Communication Specialist'],
    tasks: [
      { type: 'customer_outreach', description: 'Send personalized communications' },
      { type: 'follow_up', description: 'Automated follow-up sequences' }
    ]
  },
  {
    id: 'finance-automation',
    name: 'Finance Automation',
    description: 'Handle payments, invoicing, and financial tracking',
    icon: DollarSign,
    agents: ['Finance Manager'],
    tasks: [
      { type: 'payment_processing', description: 'Process payments via Stripe' },
      { type: 'invoice_generation', description: 'Generate and send invoices' },
      { type: 'expense_tracking', description: 'Track and categorize expenses' }
    ]
  },
  {
    id: 'integration-hub',
    name: 'Integration Hub',
    description: 'Connect with external services and manage data sync',
    icon: Link,
    agents: ['Integration Specialist'],
    tasks: [
      { type: 'oauth_setup', description: 'Configure OAuth connections' },
      { type: 'webhook_management', description: 'Set up webhooks' },
      { type: 'data_sync', description: 'Synchronize data between systems' }
    ]
  }
]

export default function AgentsPage({ params }: { params: { appId: string } }) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const { isConnected, updates } = useAgentWebSocket({
    onUpdate: (update) => {
      console.log('Agent update:', update)
      if (update.status === 'completed') {
        toast.success(`${update.agent} completed task`)
      } else if (update.status === 'error') {
        toast.error(`${update.agent} encountered an error`)
      }
    }
  })

  const executePreset = async (presetId: string) => {
    const preset = AGENT_PRESETS.find(p => p.id === presetId)
    if (!preset) return

    try {
      const response = await fetch('/api/agents/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agents: preset.agents,
          tasks: preset.tasks.map(task => ({
            type: task.type,
            parameters: {
              description: task.description,
              app_id: params.appId
            }
          })),
          process_type: 'sequential'
        })
      })

      if (response.ok) {
        toast.success(`Started ${preset.name} workflow`)
        setSelectedPreset(presetId)
      }
    } catch (error) {
      toast.error('Failed to start workflow')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground">
            Automate complex tasks with specialized AI agents
          </p>
        </div>
        <Badge variant={isConnected ? 'default' : 'secondary'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      <Tabs defaultValue="presets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="presets">Agent Presets</TabsTrigger>
          <TabsTrigger value="custom">Custom Tasks</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {AGENT_PRESETS.map((preset) => {
              const Icon = preset.icon
              return (
                <Card key={preset.id} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{preset.name}</CardTitle>
                    </div>
                    <CardDescription>{preset.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Agents:</p>
                        <div className="flex flex-wrap gap-1">
                          {preset.agents.map(agent => (
                            <Badge key={agent} variant="secondary" className="text-xs">
                              {agent}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Tasks:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {preset.tasks.slice(0, 3).map((task, idx) => (
                            <li key={idx}>• {task.description}</li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => executePreset(preset.id)}
                        disabled={selectedPreset === preset.id}
                      >
                        {selectedPreset === preset.id ? 'Running...' : 'Execute'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <AgentInterface />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Agent Activity</CardTitle>
              <CardDescription>
                Real-time updates from running agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {updates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  updates.slice(-10).reverse().map((update, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bot className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{update.agent}</p>
                          <p className="text-xs text-muted-foreground">{update.message}</p>
                        </div>
                      </div>
                      <Badge
                        variant={update.status === 'completed' ? 'default' : 
                                update.status === 'error' ? 'error' : 'secondary'}
                      >
                        {update.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}