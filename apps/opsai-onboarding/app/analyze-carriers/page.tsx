'use client'

import { useState } from 'react'

export default function AnalyzeCarriers() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/ToFut/GMIdemo')
  const [specificFile, setSpecificFile] = useState('src/App.js')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const analyzeCarriers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analyze-carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, specificFile })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Analysis failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🏢 Insurance Carrier Analysis</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Target Repository</h2>
        <p className="text-blue-700">
          Analyzing: <strong>{repoUrl}</strong><br/>
          File: <strong>{specificFile}</strong>
        </p>
      </div>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Repository URL:</label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="https://github.com/user/repo"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Specific File to Analyze:</label>
          <input
            type="text"
            value={specificFile}
            onChange={(e) => setSpecificFile(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="src/App.js"
          />
        </div>
        
        <button
          onClick={analyzeCarriers}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg disabled:opacity-50 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
        >
          {loading ? '🔍 Analyzing...' : '🚀 Analyze Carriers'}
        </button>
      </div>
      
      {result && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">📊 Analysis Results</h2>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-green-700">🏢 Repository Analysis</h3>
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <strong>Analysis Prompt:</strong>
                <pre className="text-sm bg-white p-3 rounded mt-2 overflow-x-auto">
                  {result.repositoryAnalysis?.prompt}
                </pre>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <strong>AI Response:</strong>
                <div className="mt-2 text-gray-800 whitespace-pre-wrap">
                  {result.repositoryAnalysis?.response}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-purple-700">💼 Commercial Insurance Recommendations</h3>
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <strong>Recommendation Prompt:</strong>
                <pre className="text-sm bg-white p-3 rounded mt-2 overflow-x-auto">
                  {result.carrierRecommendations?.prompt}
                </pre>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <strong>Top Carrier Recommendations:</strong>
                <div className="mt-2 text-gray-800 whitespace-pre-wrap">
                  {result.carrierRecommendations?.response}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 