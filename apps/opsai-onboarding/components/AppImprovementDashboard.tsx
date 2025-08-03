'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, RefreshCw, Code, Zap, Shield, Database, Palette, Settings } from 'lucide-react'
import { createSafeMarkdownElement } from '@/lib/sanitize-html'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  confidence?: number
  codeQuality?: number
}

interface CodeChange {
  file: string
  content: string
  description: string
}

const improvementCategories = [
  {
    title: 'Security',
    icon: Shield,
    description: 'Add authentication, authorization, and security features',
    examples: ['JWT authentication', 'Role-based access control', 'Input validation']
  },
  {
    title: 'Features',
    icon: Zap,
    description: 'Add new functionality and user features',
    examples: ['User dashboard', 'File upload', 'Real-time notifications']
  },
  {
    title: 'Integrations',
    icon: Settings,
    description: 'Connect with external APIs and services',
    examples: ['Payment gateway', 'Email service', 'Cloud storage']
  },
  {
    title: 'Database',
    icon: Database,
    description: 'Improve data storage and management',
    examples: ['Database optimization', 'Data migrations', 'Backup system']
  },
  {
    title: 'UI/UX',
    icon: Palette,
    description: 'Enhance user interface and experience',
    examples: ['Responsive design', 'Dark mode', 'Animations']
  }
]

export default function AppImprovementDashboard() {
  const [messages, setMessages] = useState<ChatMessage[]>([
      {
        id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI development assistant. I can help you improve your app with security features, new functionality, integrations, database optimizations, and UI enhancements. What would you like to work on today? 🚀',
      timestamp: new Date(),
            confidence: 95,
      codeQuality: 90
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiThinking, setAiThinking] = useState<string[]>([])
  const [currentCodeChanges, setCurrentCodeChanges] = useState<CodeChange[]>([])
  const [appId] = useState(`app-${Date.now()}`)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addThinkingStep = (step: string) => {
    setAiThinking(prev => [...prev, step])
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsProcessing(true)
    setAiThinking([])
    setCurrentCodeChanges([])

    try {
      // Add AI thinking steps
      addThinkingStep('Analyzing your request...')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      addThinkingStep('Generating code improvements...')
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      addThinkingStep('Preparing repository...')
      await new Promise(resolve => setTimeout(resolve, 600))

      // Call AI improvement API
      const response = await fetch('/api/ai-improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          appId: appId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

        const data = await response.json()
        
      addThinkingStep('Applying changes to repository...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Apply changes to repository
      const applyResponse = await fetch('/api/apply-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: appId,
          codeChanges: data.codeChanges,
          branch: 'main'
        })
      })

      const applyData = await applyResponse.json()

      if (applyData.success) {
          setCurrentCodeChanges(data.codeChanges)
        
        const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
          content: `🎉 **Improvements Applied Successfully!**

I've created a new repository and applied your requested improvements:

**Repository**: ${applyData.repository}
**Files Modified**: ${applyData.details.filesModified}
**Status**: Ready for Vercel deployment

**What I've implemented:**
${data.codeChanges.map((change: CodeChange) => `• **${change.file}**: ${change.description}`).join('\n')}

Your app is now ready to be deployed! The repository has been created and all code changes have been applied. Vercel will automatically detect the new repository and can deploy it immediately.

Would you like me to help you with any other improvements or features?`,
          timestamp: new Date(),
          confidence: 92,
          codeQuality: 88
        }

        setMessages(prev => [...prev, aiMessage])
    } else {
        throw new Error(applyData.error || 'Failed to apply changes')
      }

    } catch (error) {
      console.error('Error:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `❌ **Oops! Something went wrong**

I encountered an error while processing your request:

\`\`\`
${error instanceof Error ? error.message : 'Unknown error occurred'}
\`\`\`

Please try again or let me know if you need help with a different approach.`,
        timestamp: new Date(),
        confidence: 0,
        codeQuality: 0
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
      setAiThinking([])
    }
  }

  const handleQuickImprovement = (category: typeof improvementCategories[0]) => {
    const examples = category.examples.join(', ')
    setInputMessage(`I want to add ${category.title.toLowerCase()} improvements to my app. Specifically, I'm interested in: ${examples}. Please generate the necessary code and implement these features.`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                ✨ AI Development Assistant
              </h1>
              <p className="text-sm text-blue-100 mt-1">Let's make your app absolutely magical! 🚀</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Ready to help!</span>
            </div>
          </div>
        </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Side - Chat Interface */}
        <div className="w-1/2 bg-white/80 backdrop-blur-sm border-r border-gray-200 flex flex-col">
          {/* Quick Improvement Categories */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Improvements</h3>
            <div className="grid grid-cols-2 gap-3">
              {improvementCategories.map((category) => {
                const Icon = category.icon
                return (
                <button
                    key={category.title}
                    onClick={() => handleQuickImprovement(category)}
                    className="flex items-center space-x-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-indigo-300 group"
                  >
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-800 text-sm">{category.title}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                  </div>
                </button>
                )
              })}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-lg ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                      : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/50'
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    <div
                      className={`whitespace-pre-wrap ${
                        message.type === 'user' ? 'text-white' : 'text-gray-800'
                      }`}
                      dangerouslySetInnerHTML={createSafeMarkdownElement(message.content)}
                    />
        </div>

                  {message.type === 'ai' && (message.confidence || message.codeQuality) && (
                    <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-200/50">
                     {message.confidence && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                          <span className="text-xs text-gray-600">Confidence: {message.confidence}%</span>
                       </div>
                     )}
                     {message.codeQuality && (
                        <div className="flex items-center space-x-2">
                          <Code className="w-3 h-3 text-indigo-600" />
                          <span className="text-xs text-gray-600">Code Quality: {message.codeQuality}%</span>
                       </div>
                     )}
                       </div>
                     )}
              </div>
            </div>
          ))}
          
            {/* AI Thinking Process */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/50 px-6 py-4 rounded-2xl shadow-xl backdrop-blur-sm">
                <div className="space-y-3">
                    {aiThinking.map((thought, index) => (
                      <div key={index} className="flex items-center space-x-3">
                      <div className="relative">
                        <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                        <div className="absolute inset-0 w-5 h-5 text-indigo-400 animate-ping opacity-50"></div>
                      </div>
                        <span className="text-sm text-indigo-700 font-medium">{thought}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
          <div className="p-6 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Describe the improvements you want for your app..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
              disabled={isProcessing}
            />
            <button
              onClick={handleSendMessage}
              disabled={isProcessing || !inputMessage.trim()}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

        {/* Right Side - Code Preview */}
        <div className="w-1/2 bg-gray-900 flex flex-col">
          <div className="p-6 border-b border-gray-700 bg-gray-800">
            <h3 className="text-lg font-semibold text-white mb-2">Generated Code Preview</h3>
            <p className="text-gray-400 text-sm">
              {currentCodeChanges.length > 0 
                ? `${currentCodeChanges.length} files generated and applied to repository`
                : 'Your generated code will appear here'
              }
            </p>
        </div>

          <div className="flex-1 overflow-y-auto p-6">
            {currentCodeChanges.length > 0 ? (
                  <div className="space-y-6">
                {currentCodeChanges.map((change, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    <div className="px-4 py-3 bg-gray-700 border-b border-gray-600">
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-gray-200">{change.file}</span>
                        <span className="text-xs text-gray-400">• {change.description}</span>
                            </div>
                            </div>
                    <div className="p-4">
                      <pre className="text-sm text-gray-300 overflow-x-auto">
                        <code>{change.content}</code>
                      </pre>
                            </div>
                          </div>
                ))}
                </div>
              ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Code className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Ready to Generate Code</h3>
                  <p className="text-gray-400">
                    Start a conversation with the AI assistant to generate and apply code improvements to your app.
                  </p>
                    </div>
                    </div>
                  )}
                </div>
            </div>
          </div>
    </div>
  )
}