"use client"

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Brain,
  Zap,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  RefreshCw,
  Filter,
  Download,
  Share,
  Settings,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';
import { useIntelligentState } from '../hooks/useIntelligentState';
import { useBusinessContext } from '../hooks/useBusinessContext';
import { useAIProvider } from '../hooks/useAIProvider';

interface WidgetConfig {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'insight' | 'action';
  size: 'small' | 'medium' | 'large' | 'full';
  refreshInterval: number;
  dataSource: string;
  filters?: Record<string, any>;
  aiEnabled: boolean;
  realTimeUpdates: boolean;
}

interface MetricData {
  value: number | string;
  previousValue?: number | string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  target?: number;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
}

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: any[];
  xAxis?: string;
  yAxis?: string;
  categories?: string[];
  colors?: string[];
}

interface InsightData {
  type: 'trend' | 'anomaly' | 'opportunity' | 'alert' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'soon' | 'later';
  actionSuggestions?: ActionSuggestion[];
  relatedMetrics?: string[];
}

interface ActionSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'workflow' | 'analysis' | 'optimization' | 'alert';
  estimatedImpact: string;
  confidence: number;
  parameters?: Record<string, any>;
}

interface IntelligentDashboardWidgetProps {
  config: WidgetConfig;
  businessContext: any;
  onActionExecute?: (action: ActionSuggestion) => Promise<void>;
  onDrillDown?: (metric: string, filters: any) => void;
  onConfigChange?: (config: WidgetConfig) => void;
}

export const IntelligentDashboardWidget: React.FC<IntelligentDashboardWidgetProps> = ({
  config,
  businessContext,
  onActionExecute,
  onDrillDown,
  onConfigChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  const { state: widgetState, updateState } = useIntelligentState(
    `widget-${config.id}`,
    {
      data: null,
      lastUpdate: null,
      insights: [],
      userInteractions: [],
      preferences: {}
    }
  );

  const { generateInsights, analyzeMetrics } = useAIProvider();
  const { getBusinessData, getCurrentUser } = useBusinessContext();

  // Load and refresh data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/data/${config.dataSource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: config.filters,
          businessContext,
          widgetConfig: config
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data);

      // Update intelligent state
      updateState({
        data: result.data,
        lastUpdate: new Date(),
        userInteractions: [...widgetState.userInteractions, {
          type: 'data-refresh',
          timestamp: new Date()
        }]
      });

      // Generate AI insights if enabled
      if (config.aiEnabled) {
        await generateAIInsights(result.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsights = async (widgetData: any) => {
    try {
      const insightPrompt = `
Analyze this ${config.type} widget data for a ${businessContext.industry} business:

Widget: ${config.title}
Data: ${JSON.stringify(widgetData)}
Business Context: ${JSON.stringify(businessContext)}
User Role: ${getCurrentUser()?.role}

Generate intelligent insights including:
1. Key trends and patterns
2. Anomalies or unusual behavior
3. Business opportunities
4. Risks or alerts
5. Actionable recommendations

Format as JSON with confidence scores and impact assessments.
`;

      const response = await generateInsights(insightPrompt, {
        temperature: 0.3,
        maxTokens: 800
      });

      const generatedInsights = JSON.parse(response.content);
      setInsights(generatedInsights);

      // Update state with insights
      updateState({
        insights: generatedInsights
      });

    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    loadData();

    if (config.realTimeUpdates && config.refreshInterval > 0) {
      const interval = setInterval(loadData, config.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [config.dataSource, config.filters, config.refreshInterval]);

  // Render metric widget
  const renderMetricWidget = (metricData: MetricData) => {
    const trendIcon = metricData.trend === 'up' ? TrendingUp : 
                     metricData.trend === 'down' ? TrendingDown : 
                     Activity;
    
    const trendColor = metricData.trend === 'up' ? 'text-green-500' : 
                      metricData.trend === 'down' ? 'text-red-500' : 
                      'text-gray-500';

    const formatValue = (value: number | string) => {
      if (typeof value === 'string') return value;
      
      switch (metricData.format) {
        case 'currency':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value);
        case 'percentage':
          return `${value}%`;
        case 'duration':
          return `${value}${metricData.unit || 'min'}`;
        default:
          return value.toLocaleString();
      }
    };

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          <div className="flex items-center space-x-2">
            {config.aiEnabled && (
              <Brain size={16} className="text-blue-500" title="AI-Enhanced" />
            )}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatValue(metricData.value)}
            </span>
            {metricData.unit && (
              <span className="text-sm text-gray-500">{metricData.unit}</span>
            )}
          </div>

          {metricData.previousValue && metricData.trendPercentage && (
            <div className="flex items-center mt-2">
              <trendIcon className={`${trendColor} mr-1`} size={16} />
              <span className={`text-sm ${trendColor} font-medium`}>
                {metricData.trendPercentage > 0 ? '+' : ''}{metricData.trendPercentage.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-2">vs previous period</span>
            </div>
          )}

          {metricData.target && (
            <div className="mt-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress to target</span>
                <span>{((Number(metricData.value) / metricData.target) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((Number(metricData.value) / metricData.target) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center mb-2">
              <Brain size={14} className="text-blue-500 mr-1" />
              <span className="text-sm font-medium text-gray-700">AI Insights</span>
            </div>
            {insights.slice(0, 2).map((insight, index) => (
              <div key={index} className="mb-2 p-2 bg-blue-50 rounded border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {insight.type === 'trend' && <TrendingUp size={12} className="text-green-500" />}
                    {insight.type === 'anomaly' && <AlertTriangle size={12} className="text-yellow-500" />}
                    {insight.type === 'opportunity' && <Target size={12} className="text-blue-500" />}
                    {insight.type === 'alert' && <AlertTriangle size={12} className="text-red-500" />}
                    <span className="text-xs font-medium text-gray-700">{insight.title}</span>
                  </div>
                  <span className="text-xs text-blue-600">
                    {(insight.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                
                {insight.actionSuggestions && insight.actionSuggestions.length > 0 && (
                  <div className="mt-2">
                    {insight.actionSuggestions.slice(0, 1).map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => onActionExecute?.(action)}
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                      >
                        {action.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render chart widget
  const renderChartWidget = (chartData: ChartData) => {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          <div className="flex items-center space-x-2">
            <button className="p-1 hover:bg-gray-100 rounded">
              <Download size={16} />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <Share size={16} />
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        <div className="h-64 mb-4">
          {/* Chart implementation would go here */}
          <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Chart: {chartData.type}</p>
              <p className="text-xs text-gray-400">{chartData.data.length} data points</p>
            </div>
          </div>
        </div>

        {/* Chart-specific insights */}
        {config.aiEnabled && insights.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center mb-2">
              <Brain size={14} className="text-blue-500 mr-1" />
              <span className="text-sm font-medium text-gray-700">Chart Analysis</span>
            </div>
            {insights.slice(0, 1).map((insight, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{insight.title}</span>
                  <span className="text-xs text-gray-500">{(insight.confidence * 100).toFixed(0)}% confident</span>
                </div>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render insight widget
  const renderInsightWidget = () => {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain size={20} className="text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          </div>
          <button onClick={loadData} disabled={isLoading} className="p-1 hover:bg-gray-100 rounded">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {insights.map((insight, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {insight.type === 'trend' && <TrendingUp size={16} className="text-green-500" />}
                  {insight.type === 'anomaly' && <AlertTriangle size={16} className="text-yellow-500" />}
                  {insight.type === 'opportunity' && <Target size={16} className="text-blue-500" />}
                  {insight.type === 'alert' && <AlertTriangle size={16} className="text-red-500" />}
                  {insight.type === 'recommendation' && <Zap size={16} className="text-purple-500" />}
                  <span className="font-medium text-gray-900">{insight.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                    insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {insight.impact} impact
                  </span>
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedInsights);
                      if (newExpanded.has(insight.title)) {
                        newExpanded.delete(insight.title);
                      } else {
                        newExpanded.add(insight.title);
                      }
                      setExpandedInsights(newExpanded);
                    }}
                    className="p-1"
                  >
                    {expandedInsights.has(insight.title) ? 
                      <ChevronUp size={14} /> : <ChevronDown size={14} />
                    }
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-2">{insight.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                <span>Urgency: {insight.urgency}</span>
              </div>

              {expandedInsights.has(insight.title) && insight.actionSuggestions && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-medium text-gray-700 mb-2">Suggested Actions:</p>
                  <div className="space-y-2">
                    {insight.actionSuggestions.map((action, actionIndex) => (
                      <div key={actionIndex} className="bg-gray-50 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800">{action.title}</span>
                          <span className="text-xs text-gray-500">{(action.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{action.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-600">Est. Impact: {action.estimatedImpact}</span>
                          <button
                            onClick={() => onActionExecute?.(action)}
                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                          >
                            Execute
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {insights.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Brain size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No insights available</p>
            <p className="text-sm text-gray-400">AI will analyze your data as it becomes available</p>
          </div>
        )}
      </div>
    );
  };

  // Render loading state
  if (isLoading && !data) {
    return (
      <div className={`bg-white rounded-lg shadow border border-gray-200 ${getSizeClasses()}`}>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw size={32} className="text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading {config.title}...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow border border-red-200 ${getSizeClasses()}`}>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">Error loading widget</p>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  function getSizeClasses() {
    switch (config.size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-2';
      case 'large': return 'col-span-3';
      case 'full': return 'col-span-full';
      default: return 'col-span-1';
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 ${getSizeClasses()} relative`}>
      {/* Real-time indicator */}
      {config.realTimeUpdates && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" 
             title="Real-time updates" />
      )}

      {/* Widget content */}
      {config.type === 'metric' && data && renderMetricWidget(data)}
      {config.type === 'chart' && data && renderChartWidget(data)}
      {config.type === 'insight' && renderInsightWidget()}

      {/* Configuration panel */}
      {showConfig && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-10 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => onConfigChange?.({ ...config, title: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                value={config.refreshInterval}
                onChange={(e) => onConfigChange?.({ ...config, refreshInterval: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.aiEnabled}
                  onChange={(e) => onConfigChange?.({ ...config, aiEnabled: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Enable AI Insights</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowConfig(false)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentDashboardWidget;