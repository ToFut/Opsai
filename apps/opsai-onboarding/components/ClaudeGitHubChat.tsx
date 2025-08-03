import React, { useState, useRef, useEffect } from 'react'
import { Send, Github, MessageSquare, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react'

interface ClaudeGitHubChatProps {
  appId: string
  appName: string
  githubRepo?: string
  currentFeatures?: string[]
  businessRequirements?: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'claude'
  content: string
  timestamp: Date
  action?: 'create_issue' | 'create_pr' | 'comment' | 'analyze'
  githubUrl?: string
}

export default function ClaudeGitHubChat({
  appId,
  appName,
  githubRepo,
  currentFeatures = [],
  businessRequirements = ''
}: ClaudeGitHubChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'claude',
      content: `🤖 Hi! I'm Claude, your AI assistant. I can help you improve your "${appName}" application by creating GitHub issues, pull requests, or providing code analysis. What would you like to work on today?`,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'create_issue' | 'create_pr' | 'comment' | 'analyze'>('create_issue')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/claude-github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          appId,
          appName,
          githubRepo,
          action: selectedAction,
          context: {
            currentFeatures,
            businessRequirements
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        const claudeMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'claude',
          content: data.claudeResponse,
          timestamp: new Date(),
          action: selectedAction,
          githubUrl: data.githubAction?.url
        }

        setMessages(prev => [...prev, claudeMessage])
      } else {
        throw new Error(data.error || 'Failed to process request')
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'claude',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'create_issue':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'create_pr':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'analyze':
        return <Loader2 className="w-4 h-4 text-purple-500" />
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />
    }
  }

  const getActionLabel = (action?: string) => {
    switch (action) {
      case 'create_issue':
        return 'GitHub Issue'
      case 'create_pr':
        return 'Pull Request'
      case 'comment':
        return 'Comment'
      case 'analyze':
        return 'Analysis'
      default:
        return 'Message'
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">🤖 Claude GitHub Assistant</h2>
            <p className="text-gray-600">Chat with Claude to improve your {appName} application</p>
          </div>
          {githubRepo && (
            <a
              href={githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>View Repository</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Action Selector */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex space-x-2">
          {[
            { value: 'create_issue', label: 'Create Issue', icon: <AlertCircle className="w-4 h-4" /> },
            { value: 'create_pr', label: 'Create PR', icon: <CheckCircle className="w-4 h-4" /> },
            { value: 'comment', label: 'Add Comment', icon: <MessageSquare className="w-4 h-4" /> },
            { value: 'analyze', label: 'Analyze Code', icon: <Loader2 className="w-4 h-4" /> }
          ].map((action) => (
            <button
              key={action.value}
              onClick={() => setSelectedAction(action.value as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                selectedAction === action.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'claude' && message.action && (
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(message.action)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.githubUrl && (
                    <a
                      href={message.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <Github className="w-3 h-3" />
                      <span>View on GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Claude is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Tell Claude what you'd like to ${selectedAction.replace('_', ' ')}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Send</span>
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            'Add authentication to my app',
            'Improve the dashboard design',
            'Add new features',
            'Fix performance issues',
            'Enhance security',
            'Analyze my codebase'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputMessage(suggestion)}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Powered by Claude Code GitHub Actions • Your conversations are saved and can be reviewed later
        </div>
      </div>
    </div>
  )
} 