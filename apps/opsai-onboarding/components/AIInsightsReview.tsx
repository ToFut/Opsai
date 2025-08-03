import React, { useState } from 'react'
import { Check, X, AlertCircle, Lightbulb, Users, Database, Workflow, Shield } from 'lucide-react'

interface AIInsightsReviewProps {
  analysis: any
  onConfirm: (confirmedInsights: any) => void
  onReject: () => void
  loading?: boolean
}

export default function AIInsightsReview({ analysis, onConfirm, onReject, loading = false }: AIInsightsReviewProps) {
  const [confirmedInsights, setConfirmedInsights] = useState(analysis || {
    businessIntelligence: {},
    technicalRequirements: {},
    userManagement: {},
    uiuxRecommendations: {}
  })
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    businessIntelligence: true,
    technicalRequirements: false,
    userManagement: false,
    uiuxRecommendations: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updateInsight = (path: string[], value: any) => {
    setConfirmedInsights((prev: any) => {
      const updated = { ...prev }
      let current = updated
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {}
        }
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      
      return updated
    })
  }

  const handleConfirm = () => {
    onConfirm(confirmedInsights)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Analyzing Your Business...</h3>
          <p className="text-gray-600">Our AI is deeply analyzing your website and business model to create custom recommendations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🤖 AI Business Analysis Results</h2>
        <p className="text-gray-600">Review and customize these AI-generated insights for your business application</p>
      </div>

      {/* Business Intelligence Section */}
      <div className="mb-6 border border-gray-200 rounded-lg">
        <div 
          className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('businessIntelligence')}
        >
          <div className="flex items-center">
            <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="font-semibold text-gray-800">Business Intelligence</h3>
          </div>
          <div className="text-gray-400">{expandedSections.businessIntelligence ? '−' : '+'}</div>
        </div>
        
        {expandedSections.businessIntelligence && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry Category</label>
                <input
                  type="text"
                  value={confirmedInsights.businessIntelligence?.industryCategory || ''}
                  onChange={(e) => updateInsight(['businessIntelligence', 'industryCategory'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Model</label>
                <input
                  type="text"
                  value={confirmedInsights.businessIntelligence?.businessModel || ''}
                  onChange={(e) => updateInsight(['businessIntelligence', 'businessModel'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Streams</label>
              <div className="space-y-2">
                {confirmedInsights.businessIntelligence?.revenueStreams?.map((stream: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      value={stream}
                      onChange={(e) => {
                        const newStreams = [...(confirmedInsights.businessIntelligence?.revenueStreams || [])]
                        newStreams[index] = e.target.value
                        updateInsight(['businessIntelligence', 'revenueStreams'], newStreams)
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md mr-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <textarea
                value={confirmedInsights.businessIntelligence?.targetAudience || ''}
                onChange={(e) => updateInsight(['businessIntelligence', 'targetAudience'], e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      {/* Technical Requirements Section */}
      <div className="mb-6 border border-gray-200 rounded-lg">
        <div 
          className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('technicalRequirements')}
        >
          <div className="flex items-center">
            <Database className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="font-semibold text-gray-800">Technical Requirements</h3>
          </div>
          <div className="text-gray-400">{expandedSections.technicalRequirements ? '−' : '+'}</div>
        </div>
        
        {expandedSections.technicalRequirements && (
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Data Models ({confirmedInsights.technicalRequirements?.dataModels?.length || 0})</h4>
              <div className="space-y-2">
                {confirmedInsights.technicalRequirements?.dataModels?.map((model: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <span className="font-medium">{model.name}</span>
                      <span className="ml-2 text-sm text-gray-600">({model.priority})</span>
                      <p className="text-sm text-gray-500">{model.description}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {model.fields?.length || 0} fields
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">Integration Opportunities</h4>
              <div className="grid grid-cols-2 gap-2">
                {confirmedInsights.technicalRequirements?.integrationOpportunities?.map((integration: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-md">
                    <div>
                      <span className="font-medium text-sm">{integration.service}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        integration.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        integration.priority === 'important' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {integration.priority}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{integration.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Management Section */}
      <div className="mb-6 border border-gray-200 rounded-lg">
        <div 
          className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('userManagement')}
        >
          <div className="flex items-center">
            <Users className="h-5 w-5 text-purple-500 mr-2" />
            <h3 className="font-semibold text-gray-800">User Management & Security</h3>
          </div>
          <div className="text-gray-400">{expandedSections.userManagement ? '−' : '+'}</div>
        </div>
        
        {expandedSections.userManagement && (
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">User Types</h4>
              <div className="space-y-2">
                {confirmedInsights.userManagement?.userTypes?.map((userType: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{userType.role}</span>
                      <span className="text-sm text-gray-500">{userType.estimatedUsers}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{userType.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {userType.permissions?.map((permission: string, pIndex: number) => (
                        <span key={pIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Classification</label>
                <select
                  value={confirmedInsights.userManagement?.securityRequirements?.dataClassification || ''}
                  onChange={(e) => updateInsight(['userManagement', 'securityRequirements', 'dataClassification'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="public">Public</option>
                  <option value="internal">Internal</option>
                  <option value="confidential">Confidential</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Encryption Level</label>
                <select
                  value={confirmedInsights.userManagement?.securityRequirements?.encryptionLevel || ''}
                  onChange={(e) => updateInsight(['userManagement', 'securityRequirements', 'encryptionLevel'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* UI/UX Recommendations Section */}
      <div className="mb-8 border border-gray-200 rounded-lg">
        <div 
          className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('uiuxRecommendations')}
        >
          <div className="flex items-center">
            <Workflow className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="font-semibold text-gray-800">UI/UX & Features</h3>
          </div>
          <div className="text-gray-400">{expandedSections.uiuxRecommendations ? '−' : '+'}</div>
        </div>
        
        {expandedSections.uiuxRecommendations && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary User Journey</label>
              <textarea
                value={confirmedInsights.uiuxRecommendations?.primaryUserJourney || ''}
                onChange={(e) => updateInsight(['uiuxRecommendations', 'primaryUserJourney'], e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Critical Features</label>
              <div className="grid grid-cols-3 gap-2">
                {confirmedInsights.uiuxRecommendations?.criticalFeatures?.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center p-2 bg-green-50 border border-green-200 rounded-md">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-green-800">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Design Complexity</label>
                <select
                  value={confirmedInsights.uiuxRecommendations?.designComplexity || ''}
                  onChange={(e) => updateInsight(['uiuxRecommendations', 'designComplexity'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="simple">Simple</option>
                  <option value="moderate">Moderate</option>
                  <option value="complex">Complex</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Requirements</label>
                <select
                  value={confirmedInsights.uiuxRecommendations?.mobileRequirements || ''}
                  onChange={(e) => updateInsight(['uiuxRecommendations', 'mobileRequirements'], e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="responsive">Responsive</option>
                  <option value="mobile_first">Mobile First</option>
                  <option value="native_app">Native App</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onReject}
          className="flex items-center px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <X className="h-4 w-4 mr-2" />
          Start Over
        </button>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            Review and modify insights above
          </div>
          <button
            onClick={handleConfirm}
            className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Check className="h-4 w-4 mr-2" />
            Generate Custom YAML
          </button>
        </div>
      </div>
    </div>
  )
}