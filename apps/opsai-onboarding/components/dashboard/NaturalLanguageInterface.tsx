'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Bot, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Send,
  Lightbulb,
  Zap,
  Code,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface ConversationMessage {
  id: string
  type: 'user' | 'agent' | 'system'
  content: string
  timestamp: Date
  executionPath?: 'agent' | 'legacy' | 'hybrid'
  executionTime?: number
  insights?: string[]
  output?: any
}

interface AgentCapability {
  name: string
  description: string
  examples: string[]
}

const AGENT_CAPABILITIES: AgentCapability[] = [
  {
    name: 'App Generation',
    description: 'Build complete applications from natural language descriptions',
    examples: [
      'Build a restaurant app with online ordering and table reservations',
      'Create an e-commerce platform with inventory management',
      'Generate a SaaS dashboard with user analytics'
    ]
  },
  {
    name: 'YAML Configuration',
    description: 'Generate and optimize YAML configurations intelligently',
    examples: [
      'Create YAML config for a multi-tenant SaaS application',
      'Generate database schema for a healthcare management system',
      'Optimize existing YAML for better performance'
    ]
  },
  {
    name: 'Architecture Design',
    description: 'Design optimal system architectures and tech stacks',
    examples: [
      'Design scalable architecture for 1M+ users',
      'Recommend tech stack for real-time collaboration app',
      'Optimize existing architecture for performance'
    ]
  }
]

const QUICK_PROMPTS = [
  {
    category: 'App Building',
    prompts: [
      'Build a modern restaurant website with online ordering',
      'Create a SaaS platform for project management',
      'Generate an e-commerce marketplace with vendor support'
    ]
  },
  {
    category: 'Configuration',
    prompts: [
      'Create YAML config for a microservices architecture',
      'Generate database schema for user management',
      'Optimize my app configuration for production'
    ]
  },
  {
    category: 'Architecture',
    prompts: [
      'Design architecture for a real-time chat application',
      'Recommend tech stack for a fintech startup',
      'Review my current architecture for scalability issues'
    ]
  }
]

export default function NaturalLanguageInterface() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch system status on mount
    fetchSystemStatus()
    
    // Add welcome message
    addMessage({
      type: 'system',
      content: '🤖 **AI Agent System Ready!**\n\nI can help you build complete applications, generate configurations, and design architectures using natural language. Just describe what you need!',
      timestamp: new Date()
    })
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [conversation])

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/agents/orchestrate')
      if (response.ok) {
        const status = await response.json()
        setSystemStatus(status)
      }
    } catch (error) {
      console.warn('Failed to fetch system status:', error)
    }
  }

  const addMessage = (message: Omit<ConversationMessage, 'id'>) => {
    const newMessage: ConversationMessage = {
      ...message,
      id: Date.now().toString()
    }
    setConversation(prev => [...prev, newMessage])
  }

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message
    addMessage({
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    })

    try {
      const response = await fetch('/api/agents/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: userMessage,
          type: 'natural_language',
          context: {
            conversationHistory: conversation.slice(-5) // Last 5 messages for context
          },
          preferAgent: true
        })
      })

      const result = await response.json()

      if (result.success) {
        // Format the agent response
        let responseContent = ''
        
        if (typeof result.output === 'string') {
          responseContent = result.output
        } else if (result.output?.result) {
          responseContent = typeof result.output.result === 'string' 
            ? result.output.result 
            : JSON.stringify(result.output.result, null, 2)
        } else {
          responseContent = JSON.stringify(result.output, null, 2)
        }

        // Add execution info
        responseContent += `\n\n---\n**Execution Details:**\n`
        responseContent += `• Path: ${result.executionPath}\n`
        responseContent += `• Time: ${result.executionTime}ms\n`
        
        if (result.insights && result.insights.length > 0) {
          responseContent += `• Insights: ${result.insights.join(', ')}\n`
        }

        addMessage({
          type: 'agent',
          content: responseContent,
          timestamp: new Date(),
          executionPath: result.executionPath,
          executionTime: result.executionTime,
          insights: result.insights,
          output: result.output
        })

        toast.success(`Task completed via ${result.executionPath} in ${result.executionTime}ms`)
      } else {
        addMessage({
          type: 'agent',
          content: `❌ **Error:** ${result.error}\n\n${result.details || ''}\n\n**Suggestion:** ${result.fallback || 'Please try rephrasing your request.'}`,
          timestamp: new Date()
        })
        
        toast.error('Task failed')
      }
    } catch (error: any) {
      console.error('Request failed:', error)
      addMessage({
        type: 'agent',
        content: `❌ **Request Failed:** ${error.message}\n\nPlease check your connection and try again.`,
        timestamp: new Date()
      })
      toast.error('Request failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const useQuickPrompt = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const renderMessage = (message: ConversationMessage) => {
    const isUser = message.type === 'user'
    const isSystem = message.type === 'system'
    
    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isSystem ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
          }`}>
            {isSystem ? <Settings className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
        )}
        
        <div className={`max-w-[80%] ${
          isUser 
            ? 'bg-blue-600 text-white rounded-lg rounded-br-sm' 
            : 'bg-gray-100 text-gray-900 rounded-lg rounded-bl-sm'
        } px-4 py-3`}>
          <div className="whitespace-pre-wrap text-sm">
            {message.content.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return <div key={i} className="font-semibold">{line.slice(2, -2)}</div>
              }
              if (line.startsWith('• ')) {
                return <div key={i} className="ml-2">• {line.slice(2)}</div>
              }
              return <div key={i}>{line}</div>
            })}
          </div>
          
          {message.executionPath && (
            <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-2 text-xs opacity-75">
              <Badge variant="outline" className="text-xs">
                {message.executionPath}
              </Badge>
              <Clock className="w-3 h-3" />
              <span>{message.executionTime}ms</span>
            </div>
          )}
        </div>
        
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
            <span className="text-sm font-medium">U</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
      {/* Main Chat Interface */}
      <div className="lg:col-span-3 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <CardTitle>AI Agent Assistant</CardTitle>
                {systemStatus && (
                  <Badge variant="outline" className="ml-2">
                    {systemStatus.agents?.totalAgents || 0} agents ready
                  </Badge>
                )}
              </div>
              {systemStatus?.status === 'operational' ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="error">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
            <CardDescription>
              Describe what you want to build in natural language. I'll handle the technical implementation.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col gap-4">
            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
              <div className="space-y-4">
                {conversation.map(renderMessage)}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-gray-100 text-gray-600 rounded-lg rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing your request...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Input */}
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe what you want to build... (e.g., 'Create a restaurant app with online ordering and payments')"
                className="min-h-[80px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="px-3"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Sidebar */}
      <div className="space-y-4">
        {/* Capabilities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {AGENT_CAPABILITIES.map((capability, index) => (
              <div key={index} className="space-y-1">
                <h4 className="font-medium text-sm">{capability.name}</h4>
                <p className="text-xs text-muted-foreground">{capability.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Quick Prompts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Quick Prompts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {QUICK_PROMPTS.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-2">
                <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                  {category.category}
                </h4>
                <div className="space-y-1">
                  {category.prompts.map((prompt, promptIndex) => (
                    <button
                      key={promptIndex}
                      onClick={() => useQuickPrompt(prompt)}
                      className="w-full text-left text-xs p-2 rounded hover:bg-gray-100 transition-colors"
                      disabled={isLoading}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                {categoryIndex < QUICK_PROMPTS.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* System Status */}
        {systemStatus && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="w-4 h-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Agents:</span>
                <span>{systemStatus.agents?.totalAgents || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Crews:</span>
                <span>{systemStatus.agents?.activeCrews || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Legacy Services:</span>
                <span>{systemStatus.hybrid?.legacyServices?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}