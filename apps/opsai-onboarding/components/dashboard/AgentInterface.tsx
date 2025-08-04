'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Bot, Users, Play, FileCode, TrendingUp, Phone } from 'lucide-react'
import { toast } from 'sonner'

interface Agent {
  name: string
  description: string
  capabilities: string[]
}

interface AgentTask {
  agent: string
  type: string
  parameters: Record<string, any>
  result?: any
  status?: 'pending' | 'running' | 'completed' | 'error'
}

export default function AgentInterface() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [taskType, setTaskType] = useState<string>('')
  const [taskDescription, setTaskDescription] = useState('')
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [crewTasks, setCrewTasks] = useState<AgentTask[]>([])

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents/execute')
      const data = await response.json()
      setAgents(data.agents || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const executeAgent = async () => {
    if (!selectedAgent || !taskType) {
      toast.error('Please select an agent and task type')
      return
    }

    setIsLoading(true)
    const task: AgentTask = {
      agent: selectedAgent,
      type: taskType,
      parameters: {
        ...parameters,
        description: taskDescription
      },
      status: 'running'
    }

    setTasks([...tasks, task])

    try {
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_name: selectedAgent,
          task_type: taskType,
          parameters: task.parameters
        })
      })

      const result = await response.json()
      
      setTasks(prev => prev.map(t => 
        t === task ? { ...t, result, status: 'completed' } : t
      ))

      toast.success('Agent task completed successfully')
    } catch (error) {
      setTasks(prev => prev.map(t => 
        t === task ? { ...t, status: 'error' } : t
      ))
      toast.error('Failed to execute agent task')
    } finally {
      setIsLoading(false)
    }
  }

  const executeCrew = async () => {
    if (crewTasks.length === 0) {
      toast.error('Please add at least one task to the crew')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/agents/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agents: crewTasks.map(t => t.agent),
          tasks: crewTasks.map(t => ({
            type: t.type,
            parameters: t.parameters
          })),
          process_type: 'sequential'
        })
      })

      const result = await response.json()
      toast.success('Crew execution completed')
      
      // Update crew tasks with results
      setCrewTasks(prev => prev.map((t, idx) => ({
        ...t,
        result: result.results?.[idx],
        status: 'completed'
      })))
    } catch (error) {
      toast.error('Failed to execute crew')
    } finally {
      setIsLoading(false)
    }
  }

  const addToСrew = () => {
    if (!selectedAgent || !taskType) {
      toast.error('Please configure the task first')
      return
    }

    const task: AgentTask = {
      agent: selectedAgent,
      type: taskType,
      parameters: {
        ...parameters,
        description: taskDescription
      },
      status: 'pending'
    }

    setCrewTasks([...crewTasks, task])
    toast.success('Task added to crew')
  }

  const getAgentIcon = (agentName: string) => {
    switch (agentName.toLowerCase()) {
      case 'business analyst':
        return <TrendingUp className="w-4 h-4" />
      case 'code generator':
        return <FileCode className="w-4 h-4" />
      case 'communication specialist':
        return <Phone className="w-4 h-4" />
      default:
        return <Bot className="w-4 h-4" />
    }
  }

  const getTaskTypeOptions = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'business analyst':
        return [
          { value: 'market_research', label: 'Market Research' },
          { value: 'roi_calculation', label: 'ROI Calculation' },
          { value: 'workflow_optimization', label: 'Workflow Optimization' },
          { value: 'comprehensive', label: 'Comprehensive Analysis' }
        ]
      case 'code generator':
        return [
          { value: 'component', label: 'Generate Component' },
          { value: 'api', label: 'Generate API' },
          { value: 'full_feature', label: 'Generate Full Feature' }
        ]
      default:
        return [{ value: 'general', label: 'General Task' }]
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">
            <Bot className="w-4 h-4 mr-2" />
            Single Agent
          </TabsTrigger>
          <TabsTrigger value="crew">
            <Users className="w-4 h-4 mr-2" />
            Agent Crew
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execute Single Agent Task</CardTitle>
              <CardDescription>
                Select an agent and configure the task parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Agent</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(agent => (
                        <SelectItem key={agent.name} value={agent.name}>
                          <div className="flex items-center gap-2">
                            {getAgentIcon(agent.name)}
                            {agent.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Task Type</Label>
                  <Select value={taskType} onValueChange={setTaskType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedAgent && getTaskTypeOptions(selectedAgent).map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Task Description</Label>
                <Textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Describe what you want the agent to do..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={executeAgent}
                  disabled={isLoading || !selectedAgent || !taskType}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute Task
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={addToСrew}
                  disabled={!selectedAgent || !taskType}
                >
                  Add to Crew
                </Button>
              </div>
            </CardContent>
          </Card>

          {tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Task History</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {tasks.map((task, idx) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getAgentIcon(task.agent)}
                            <span className="font-medium">{task.agent}</span>
                            <Badge variant="outline">{task.type}</Badge>
                          </div>
                          <Badge
                            variant={task.status === 'completed' ? 'default' : 
                                    task.status === 'error' ? 'destructive' : 'secondary'}
                          >
                            {task.status}
                          </Badge>
                        </div>
                        {task.result && (
                          <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(task.result, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="crew" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Crew Configuration</CardTitle>
              <CardDescription>
                Add multiple agents to work together on complex tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {crewTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                      {getAgentIcon(task.agent)}
                      <span className="font-medium">{task.agent}</span>
                      <Badge variant="outline">{task.type}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCrewTasks(prev => prev.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              {crewTasks.length > 0 && (
                <Button
                  onClick={executeCrew}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing Crew...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Execute Crew Tasks
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}