"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Users, 
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  Zap,
  Target,
  BarChart3,
  DollarSign,
  Calendar,
  Award,
  Shield,
  Workflow,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { useAIProvider } from '../hooks/useAIProvider';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: MessageMetadata;
  suggestions?: ActionSuggestion[];
  context?: BusinessContext;
}

interface MessageMetadata {
  confidence: number;
  sources: string[];
  reasoning: string;
  businessInsights?: BusinessInsight[];
  actionItems?: ActionItem[];
}

interface BusinessInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'soon' | 'later';
  relatedData: any[];
}

interface ActionSuggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  parameters: Record<string, any>;
  confidence: number;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
}

interface ContextualAIChatProps {
  businessContext: {
    industry: string;
    userRole: string;
    currentView: string;
    userData: any;
    permissions: string[];
    activeWorkflows: string[];
  };
  realTimeData?: any;
  onActionExecute?: (action: string, params: any) => Promise<void>;
  onInsightDrill?: (insight: BusinessInsight) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const ContextualAIChat: React.FC<ContextualAIChatProps> = ({
  businessContext,
  realTimeData,
  onActionExecute,
  onInsightDrill,
  isMinimized = false,
  onToggleMinimize
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState<any>({});
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { getBusinessData, getCurrentUser } = useBusinessContext();
  const { subscribe, unsubscribe } = useRealTimeUpdates();
  const { generateResponse, streamResponse } = useAIProvider();

  // Initial greeting based on context
  useEffect(() => {
    const initialMessage: Message = {
      id: 'welcome',
      content: generateWelcomeMessage(),
      role: 'assistant',
      timestamp: new Date(),
      metadata: {
        confidence: 1.0,
        sources: ['business-context'],
        reasoning: 'Personalized welcome based on user role and current context'
      },
      suggestions: generateInitialSuggestions()
    };
    setMessages([initialMessage]);
  }, [businessContext]);

  // Real-time data updates
  useEffect(() => {
    const handleRealTimeUpdate = (data: any) => {
      if (shouldNotifyUser(data)) {
        addSystemMessage(generateUpdateMessage(data));
      }
      updateConversationContext(data);
    };

    subscribe('business-data-updates', handleRealTimeUpdate);
    subscribe('workflow-events', handleRealTimeUpdate);
    subscribe('alerts', handleRealTimeUpdate);

    return () => {
      unsubscribe('business-data-updates', handleRealTimeUpdate);
      unsubscribe('workflow-events', handleRealTimeUpdate);
      unsubscribe('alerts', handleRealTimeUpdate);
    };
  }, []);

  const generateWelcomeMessage = useCallback(() => {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : 
                     new Date().getHours() < 18 ? 'afternoon' : 'evening';
    
    const contextualGreeting = generateContextualGreeting();
    const currentInsights = generateCurrentInsights();
    
    return `Good ${timeOfDay}! I'm your AI assistant for ${businessContext.industry}. ${contextualGreeting}

${currentInsights}

How can I help you today? I have access to your real-time data and can assist with analysis, recommendations, and workflow automation.`;
  }, [businessContext]);

  const generateContextualGreeting = () => {
    const { userRole, currentView, userData } = businessContext;
    
    switch (userRole) {
      case 'admin':
        return `As an admin, I can help you with system management, user analytics, and performance optimization.`;
      case 'manager':
        return `I can help you with team performance, workflow optimization, and strategic insights.`;
      case 'agent':
        return `I'm here to help you with client management, deal tracking, and productivity optimization.`;
      case 'analyst':
        return `I can assist with data analysis, reporting, and business intelligence insights.`;
      default:
        return `I'm here to help you navigate the platform and optimize your workflow.`;
    }
  };

  const generateCurrentInsights = () => {
    // Generate insights based on real-time data and business context
    const insights = [];
    
    if (realTimeData?.metrics) {
      if (realTimeData.metrics.growth > 10) {
        insights.push("📈 Great news! Your metrics show 10%+ growth this period.");
      }
      if (realTimeData.metrics.alerts > 0) {
        insights.push(`⚠️ You have ${realTimeData.metrics.alerts} alerts requiring attention.`);
      }
    }
    
    if (businessContext.activeWorkflows?.length > 0) {
      insights.push(`🔄 You have ${businessContext.activeWorkflows.length} active workflows running.`);
    }
    
    return insights.length > 0 ? insights.join('\n') : '';
  };

  const generateInitialSuggestions = (): ActionSuggestion[] => {
    const suggestions: ActionSuggestion[] = [];
    
    // Role-based suggestions
    if (businessContext.userRole === 'admin') {
      suggestions.push({
        id: 'system-health',
        title: 'Check System Health',
        description: 'Get overview of system performance and user activity',
        action: 'analyze-system-health',
        parameters: {},
        confidence: 0.9
      });
    }
    
    if (businessContext.userRole === 'manager') {
      suggestions.push({
        id: 'team-performance',
        title: 'Team Performance Analysis',
        description: 'Analyze team metrics and identify optimization opportunities',
        action: 'analyze-team-performance',
        parameters: {},
        confidence: 0.85
      });
    }
    
    // Context-based suggestions
    if (businessContext.currentView.includes('dashboard')) {
      suggestions.push({
        id: 'explain-metrics',
        title: 'Explain Current Metrics',
        description: 'Get detailed explanation of dashboard metrics and what they mean',
        action: 'explain-dashboard-metrics',
        parameters: { view: businessContext.currentView },
        confidence: 0.8
      });
    }
    
    return suggestions;
  };

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputMessage.trim();
    if (!messageContent) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: messageContent,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Generate contextual response using AI
      const response = await generateContextualResponse(messageContent);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        metadata: response.metadata,
        suggestions: response.suggestions,
        context: response.context
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation context
      updateConversationContext({
        lastUserMessage: messageContent,
        lastResponse: response.content,
        context: response.context
      });

    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "I'm sorry, I encountered an error. Please try again or contact support if the issue persists.",
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          confidence: 0,
          sources: [],
          reasoning: 'Error handling fallback'
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const generateContextualResponse = async (userMessage: string) => {
    // Enhanced AI prompt with full business context
    const contextPrompt = `
You are an AI assistant for a ${businessContext.industry} business platform.

Current Context:
- User Role: ${businessContext.userRole}
- Current View: ${businessContext.currentView}
- User Permissions: ${businessContext.permissions.join(', ')}
- Active Workflows: ${businessContext.activeWorkflows.join(', ')}
- Real-time Data: ${JSON.stringify(realTimeData)}
- Conversation History: ${JSON.stringify(conversationContext)}

User Message: "${userMessage}"

Provide a helpful, contextual response that:
1. Addresses the user's specific question/request
2. Leverages real-time business data when relevant
3. Offers actionable insights and suggestions
4. Maintains awareness of user role and permissions
5. Suggests relevant follow-up actions

Format your response with:
- Main response content
- Business insights (if applicable)
- Suggested actions (if applicable)
- Confidence level and reasoning

Be conversational, professional, and genuinely helpful.
`;

    const aiResponse = await generateResponse(contextPrompt, {
      temperature: 0.3,
      maxTokens: 1000,
      model: 'gpt-4'
    });

    // Parse AI response and extract metadata
    return {
      content: aiResponse.content,
      metadata: {
        confidence: aiResponse.confidence || 0.8,
        sources: aiResponse.sources || ['ai-analysis'],
        reasoning: aiResponse.reasoning || 'AI-generated contextual response',
        businessInsights: extractBusinessInsights(aiResponse.content),
        actionItems: extractActionItems(aiResponse.content)
      },
      suggestions: generateFollowUpSuggestions(userMessage, aiResponse.content),
      context: {
        userIntent: classifyUserIntent(userMessage),
        businessRelevance: assessBusinessRelevance(userMessage),
        suggestedActions: generateSuggestedActions(userMessage)
      }
    };
  };

  const extractBusinessInsights = (content: string): BusinessInsight[] => {
    // Extract business insights from AI response
    const insights: BusinessInsight[] = [];
    
    // Pattern matching for insights
    const trendPattern = /trend.*?(\d+%)/gi;
    const anomalyPattern = /unusual|anomaly|unexpected/gi;
    const opportunityPattern = /opportunity|potential|could improve/gi;
    const riskPattern = /risk|concern|warning/gi;
    
    if (trendPattern.test(content)) {
      insights.push({
        type: 'trend',
        title: 'Growth Trend Identified',
        description: 'AI detected positive trend in your metrics',
        impact: 'medium',
        urgency: 'soon',
        relatedData: []
      });
    }
    
    return insights;
  };

  const extractActionItems = (content: string): ActionItem[] => {
    // Extract actionable items from AI response
    return [];
  };

  const generateFollowUpSuggestions = (userMessage: string, aiResponse: string): ActionSuggestion[] => {
    // Generate contextual follow-up suggestions
    return [];
  };

  const classifyUserIntent = (message: string): string => {
    // Classify user intent for better context
    return 'information-seeking';
  };

  const assessBusinessRelevance = (message: string): number => {
    // Assess how relevant the message is to business operations
    return 0.8;
  };

  const generateSuggestedActions = (message: string): string[] => {
    // Generate suggested actions based on user message
    return [];
  };

  const shouldNotifyUser = (data: any): boolean => {
    // Determine if real-time data update should generate a notification
    return data.priority === 'high' || data.type === 'alert';
  };

  const generateUpdateMessage = (data: any): string => {
    // Generate message for real-time updates
    return `🔔 Update: ${data.message}`;
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      content,
      role: 'assistant',
      timestamp: new Date(),
      metadata: {
        confidence: 1.0,
        sources: ['real-time-system'],
        reasoning: 'System-generated notification'
      }
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const updateConversationContext = (newContext: any) => {
    setConversationContext(prev => ({
      ...prev,
      ...newContext,
      lastUpdated: new Date()
    }));
  };

  const handleSuggestionClick = async (suggestion: ActionSuggestion) => {
    if (onActionExecute) {
      await onActionExecute(suggestion.action, suggestion.parameters);
    } else {
      await handleSendMessage(suggestion.title);
    }
  };

  const handleInsightClick = (insight: BusinessInsight) => {
    if (onInsightDrill) {
      onInsightDrill(insight);
    }
    setExpandedInsights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insight.title)) {
        newSet.delete(insight.title);
      } else {
        newSet.add(insight.title);
      }
      return newSet;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggleMinimize}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
        >
          <MessageCircle size={24} />
          {messages.length > 1 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {messages.length - 1}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <span className="font-semibold">AI Assistant</span>
          {isTyping && (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleMinimize}
            className="p-1 hover:bg-blue-700 rounded"
          >
            <Minimize2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot size={16} className="mt-1 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Business Insights */}
                  {message.metadata?.businessInsights && message.metadata.businessInsights.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.metadata.businessInsights.map((insight, index) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded p-2 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleInsightClick(insight)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {insight.type === 'trend' && <TrendingUp size={14} className="text-green-500" />}
                              {insight.type === 'anomaly' && <AlertCircle size={14} className="text-yellow-500" />}
                              {insight.type === 'opportunity' && <Target size={14} className="text-blue-500" />}
                              {insight.type === 'risk' && <Shield size={14} className="text-red-500" />}
                              <span className="text-xs font-medium text-gray-700">{insight.title}</span>
                            </div>
                            {expandedInsights.has(insight.title) ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </div>
                          {expandedInsights.has(insight.title) && (
                            <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Action Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && showSuggestions && (
                    <div className="mt-3 space-y-1">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 p-2 rounded border border-blue-200 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{suggestion.title}</span>
                            <span className="text-blue-500">{Math.round(suggestion.confidence * 100)}%</span>
                          </div>
                          <p className="text-blue-600 mt-1">{suggestion.description}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Metadata */}
                  {message.metadata && (
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <span>Confidence: {(message.metadata.confidence * 100).toFixed(0)}%</span>
                        <span>•</span>
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask about your business, request analysis, or get help..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};