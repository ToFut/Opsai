'use client'

import { useState } from 'react'
import { 
  Brain, Sparkles, Database, Link2, Zap, Shield, Users, 
  BarChart3, Settings, Edit3, Check, X, Plus, AlertCircle,
  ChevronDown, ChevronUp, Trash2, RefreshCw, ArrowRight,
  Building2, Target, TrendingUp, Package, Clock, DollarSign
} from 'lucide-react'

interface AIAnalysisReviewProps {
  analysis: any
  insights: any
  onConfirm: (updatedInsights: any) => void
  onBack: () => void
}

export default function AIAnalysisReview({ 
  analysis, 
  insights, 
  onConfirm, 
  onBack 
}: AIAnalysisReviewProps) {
  const [editingInsights, setEditingInsights] = useState(insights)
  const [activeTab, setActiveTab] = useState<'business' | 'technical' | 'integrations' | 'workflows'>('business')
  const [editMode, setEditMode] = useState<Record<string, boolean>>({})
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev: Record<string, boolean>) => ({ ...prev, [section]: !prev[section] }))
  }
  
  // Toggle edit mode for a field
  const toggleEdit = (field: string) => {
    setEditMode((prev: Record<string, boolean>) => ({ ...prev, [field]: !prev[field] }))
  }
  
  // Update a field value
  const updateField = (path: string[], value: any) => {
    setEditingInsights((prev: any) => {
      const updated = { ...prev }
      let current = updated
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }
      
      current[path[path.length - 1]] = value
      return updated
    })
  }
  
  // Add item to array
  const addArrayItem = (path: string[], item: any) => {
    setEditingInsights((prev: any) => {
      const updated = { ...prev }
      let current = updated
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }
      
      const array = current[path[path.length - 1]]
      current[path[path.length - 1]] = [...array, item]
      return updated
    })
  }
  
  // Remove item from array
  const removeArrayItem = (path: string[], index: number) => {
    setEditingInsights((prev: any) => {
      const updated = { ...prev }
      let current = updated
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }
      
      const array = current[path[path.length - 1]]
      current[path[path.length - 1]] = array.filter((_: any, i: number) => i !== index)
      return updated
    })
  }
  
  const tabs = [
    { id: 'business', label: 'Business Profile', icon: Building2 },
    { id: 'technical', label: 'Technical Architecture', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'workflows', label: 'Workflows', icon: Zap }
  ]
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          AI Analysis Review
        </h2>
        <p className="text-lg text-gray-600">
          Review and customize the AI's understanding of your business
        </p>
      </div>
      
      {/* Confidence Score */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Analysis Confidence</h3>
            <p className="text-gray-600">Based on {analysis.pagesAnalyzed} pages analyzed</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {Math.round(analysis.metrics?.confidenceScore * 100 || 85)}%
            </div>
            <p className="text-sm text-gray-500">Confidence Score</p>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Business Tab */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Business Information
              </h3>
              <button
                onClick={() => toggleEdit('businessInfo')}
                className="text-purple-600 hover:text-purple-700"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Industry Category</label>
                {editMode.businessInfo ? (
                  <input
                    type="text"
                    value={editingInsights.businessIntelligence.industryCategory}
                    onChange={e => updateField(['businessIntelligence', 'industryCategory'], e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="font-medium mt-1">{editingInsights.businessIntelligence.industryCategory}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Business Model</label>
                {editMode.businessInfo ? (
                  <input
                    type="text"
                    value={editingInsights.businessIntelligence.businessModel}
                    onChange={e => updateField(['businessIntelligence', 'businessModel'], e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="font-medium mt-1">{editingInsights.businessIntelligence.businessModel}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Target Audience</label>
                {editMode.businessInfo ? (
                  <input
                    type="text"
                    value={editingInsights.businessIntelligence.targetAudience}
                    onChange={e => updateField(['businessIntelligence', 'targetAudience'], e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="font-medium mt-1">{editingInsights.businessIntelligence.targetAudience}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Scalability Requirements</label>
                {editMode.businessInfo ? (
                  <select
                    value={editingInsights.businessIntelligence.scalabilityRequirements}
                    onChange={e => updateField(['businessIntelligence', 'scalabilityRequirements'], e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="local">Local</option>
                    <option value="regional">Regional</option>
                    <option value="national">National</option>
                    <option value="global">Global</option>
                  </select>
                ) : (
                  <p className="font-medium mt-1 capitalize">{editingInsights.businessIntelligence.scalabilityRequirements}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Revenue Streams */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Revenue Streams
              </h3>
              <button
                onClick={() => toggleEdit('revenueStreams')}
                className="text-purple-600 hover:text-purple-700"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {editingInsights.businessIntelligence.revenueStreams.map((stream: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  {editMode.revenueStreams ? (
                    <>
                      <input
                        type="text"
                        value={stream}
                        onChange={e => {
                          const updated = [...editingInsights.businessIntelligence.revenueStreams]
                          updated[idx] = e.target.value
                          updateField(['businessIntelligence', 'revenueStreams'], updated)
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      />
                      <button
                        onClick={() => removeArrayItem(['businessIntelligence', 'revenueStreams'], idx)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-md">
                      {stream}
                    </span>
                  )}
                </div>
              ))}
              
              {editMode.revenueStreams && (
                <button
                  onClick={() => addArrayItem(['businessIntelligence', 'revenueStreams'], 'New Revenue Stream')}
                  className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-md"
                >
                  <Plus className="w-4 h-4" />
                  Add Revenue Stream
                </button>
              )}
            </div>
          </div>
          
          {/* Competitive Advantages */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Competitive Advantages
              </h3>
              <button
                onClick={() => toggleEdit('advantages')}
                className="text-purple-600 hover:text-purple-700"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {editingInsights.businessIntelligence.competitiveAdvantages.map((advantage: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  {editMode.advantages ? (
                    <>
                      <input
                        type="text"
                        value={advantage}
                        onChange={e => {
                          const updated = [...editingInsights.businessIntelligence.competitiveAdvantages]
                          updated[idx] = e.target.value
                          updateField(['businessIntelligence', 'competitiveAdvantages'], updated)
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      />
                      <button
                        onClick={() => removeArrayItem(['businessIntelligence', 'competitiveAdvantages'], idx)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-gray-700">{advantage}</span>
                    </div>
                  )}
                </div>
              ))}
              
              {editMode.advantages && (
                <button
                  onClick={() => addArrayItem(['businessIntelligence', 'competitiveAdvantages'], 'New Advantage')}
                  className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-md"
                >
                  <Plus className="w-4 h-4" />
                  Add Advantage
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Technical Tab */}
      {activeTab === 'technical' && (
        <div className="space-y-6">
          {/* Data Models */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Data Models
              </h3>
              <span className="text-sm text-gray-500">
                {editingInsights.technicalRequirements.dataModels.length} models identified
              </span>
            </div>
            
            <div className="space-y-4">
              {editingInsights.technicalRequirements.dataModels.map((model: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <button
                    onClick={() => toggleSection(`model-${idx}`)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{model.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        model.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        model.priority === 'important' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {model.priority}
                      </span>
                    </div>
                    {expandedSections[`model-${idx}`] ? 
                      <ChevronUp className="w-4 h-4 text-gray-400" /> :
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </button>
                  
                  {expandedSections[`model-${idx}`] && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-gray-600">{model.description}</p>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Fields ({model.fields.length})</h5>
                        <div className="space-y-2">
                          {model.fields.map((field: any, fieldIdx: number) => (
                            <div key={fieldIdx} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{field.name}</span>
                                <span className="text-gray-500">({field.type})</span>
                                {field.required && <span className="text-xs text-red-600">Required</span>}
                                {field.unique && <span className="text-xs text-blue-600">Unique</span>}
                              </div>
                              <span className="text-xs text-gray-500">{field.businessReason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Deployment Strategy */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Deployment Strategy
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Recommended Platform</label>
                <p className="font-medium mt-1">{editingInsights.deploymentStrategy.recommendedPlatform}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Scaling Strategy</label>
                <p className="font-medium mt-1">{editingInsights.deploymentStrategy.scalingStrategy}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Estimated Traffic</label>
                <p className="font-medium mt-1">{editingInsights.deploymentStrategy.estimatedTraffic}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Monitoring Level</label>
                <p className="font-medium mt-1">{editingInsights.deploymentStrategy.monitoringLevel}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-purple-600" />
              Required Integrations
            </h3>
            
            <div className="space-y-3">
              {editingInsights.technicalRequirements.integrationOpportunities
                .sort((a: any, b: any) => {
                  const priority: Record<string, number> = { critical: 0, important: 1, 'nice-to-have': 2 }
                  return priority[a.priority] - priority[b.priority]
                })
                .map((integration: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{integration.service}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            integration.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            integration.priority === 'important' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {integration.priority}
                          </span>
                          <span className="text-xs text-gray-500">({integration.category})</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{integration.businessValue}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {integration.estimatedSetupTime}
                          </span>
                          <span>Complexity: {integration.complexity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Automated Workflows
            </h3>
            
            <div className="space-y-4">
              {editingInsights.technicalRequirements.workflowRequirements.map((workflow: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <button
                    onClick={() => toggleSection(`workflow-${idx}`)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-gray-900">{workflow.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        workflow.businessImpact === 'high' ? 'bg-red-100 text-red-800' :
                        workflow.businessImpact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {workflow.businessImpact} impact
                      </span>
                    </div>
                    {expandedSections[`workflow-${idx}`] ? 
                      <ChevronUp className="w-4 h-4 text-gray-400" /> :
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </button>
                  
                  {expandedSections[`workflow-${idx}`] && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-gray-600">{workflow.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Trigger:</span>
                          <p className="font-medium capitalize">{workflow.trigger.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Frequency:</span>
                          <p className="font-medium">{workflow.frequency}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Steps</h5>
                        <div className="space-y-2">
                          {workflow.steps.map((step: any, stepIdx: number) => (
                            <div key={stepIdx} className="flex items-start gap-2 text-sm">
                              <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                                {stepIdx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{step.name}</p>
                                <p className="text-gray-500 text-xs">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-700 hover:text-gray-900"
        >
          Back to Analysis
        </button>
        
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Re-analyze
          </button>
          
          <button
            onClick={() => onConfirm(editingInsights)}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 flex items-center gap-2"
          >
            Confirm & Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Info Alert */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About This Analysis</p>
            <p>This AI analysis is based on crawling {analysis.pagesAnalyzed} pages from your website. You can edit any field to better match your business needs. The more accurate the information, the better your custom app will be.</p>
          </div>
        </div>
      </div>
    </div>
  )
}