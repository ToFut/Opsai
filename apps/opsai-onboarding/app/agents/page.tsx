'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, 
  Sparkles, 
  Code, 
  FileText, 
  Zap, 
  Settings,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import NaturalLanguageInterface from '@/components/dashboard/NaturalLanguageInterface'

const AGENT_FEATURES = [
  {
    icon: Sparkles,
    title: 'Natural Language Processing',
    description: 'Describe what you want in plain English - our agents understand context and intent',
    examples: [
      'Build me a restaurant app with online ordering',
      'Create a SaaS platform with subscription billing',
      'Generate an e-commerce site with inventory management'
    ]
  },
  {
    icon: Code,
    title: 'Intelligent Code Generation',
    description: 'Generate production-ready code with best practices and optimizations',
    examples: [
      'React components with TypeScript',
      'API endpoints with authentication',
      'Database schemas with relationships'
    ]
  },
  {
    icon: FileText,
    title: 'YAML Configuration',
    description: 'Smart YAML generation and validation for any application structure',
    examples: [
      'Multi-tenant SaaS configurations',
      'Microservices architecture definitions',
      'CI/CD pipeline configurations'
    ]
  },
  {
    icon: Zap,
    title: 'Performance Optimization',
    description: 'Automatic performance analysis and optimization recommendations',
    examples: [
      'Database query optimization',
      'Frontend bundle optimization',
      'API response time improvements'
    ]
  }
]

const SUCCESS_STORIES = [
  {
    title: 'Restaurant Chain App',
    description: 'Built complete ordering system in 2 hours instead of 2 months',
    metrics: '98% faster development',
    features: ['Online ordering', 'Table reservations', 'Payment processing', 'Admin dashboard']
  },
  {
    title: 'SaaS Analytics Platform',
    description: 'Generated full-stack application with real-time analytics',
    metrics: '10x development speed',
    features: ['User authentication', 'Dashboard analytics', 'Subscription billing', 'API integration']
  },
  {
    title: 'E-commerce Marketplace',
    description: 'Created multi-vendor platform with advanced features',
    metrics: '90% cost reduction',
    features: ['Vendor management', 'Product catalog', 'Order tracking', 'Payment gateway']
  }
]

export default function AgentsPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null)

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Bot className="w-12 h-12 text-blue-600" />
          <h1 className="text-4xl font-bold">AI Agent System</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Transform your ideas into production-ready applications using natural language. 
          Our AI agents understand, design, and build complete systems autonomously.
        </p>
        
        <div className="flex items-center justify-center gap-4 pt-4">
          <Badge className="bg-green-100 text-green-800 px-4 py-2">
            <CheckCircle className="w-4 h-4 mr-2" />
            System Online
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            Response Time: &lt;2s
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            Success Rate: 94%
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="interface" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interface">
            <Bot className="w-4 h-4 mr-2" />
            AI Interface
          </TabsTrigger>
          <TabsTrigger value="features">
            <Sparkles className="w-4 h-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="examples">
            <Code className="w-4 h-4 mr-2" />
            Examples
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* AI Interface Tab */}
        <TabsContent value="interface" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Natural Language Interface</CardTitle>
              <CardDescription>
                Chat with our AI agents to build applications, generate configurations, and get technical advice.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <NaturalLanguageInterface />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {AGENT_FEATURES.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="w-8 h-8 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-500">Examples:</h4>
                      <ul className="space-y-1">
                        {feature.examples.map((example, exampleIndex) => (
                          <li key={exampleIndex} className="text-sm flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <div className="grid gap-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Success Stories</h2>
              <p className="text-gray-600">
                Real applications built by our AI agents in record time
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              {SUCCESS_STORIES.map((story, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                    <CardDescription>{story.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-green-50 text-green-800 px-3 py-2 rounded-lg text-center font-semibold">
                      {story.metrics}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Generated Features:</h4>
                      <div className="flex flex-wrap gap-2">
                        {story.features.map((feature, featureIndex) => (
                          <Badge key={featureIndex} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveDemo(story.title)}
                    >
                      View Demo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent System Status</CardTitle>
              <CardDescription>
                Monitor and configure the AI agent system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-green-600">94%</div>
                  <div className="text-sm text-gray-500">Success Rate</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-blue-600">1.8s</div>
                  <div className="text-sm text-gray-500">Avg Response</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-purple-600">2,847</div>
                  <div className="text-sm text-gray-500">Tasks Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}