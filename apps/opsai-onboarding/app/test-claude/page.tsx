'use client'

import { useState } from 'react'

export default function TestClaude() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/ToFut/GMIdemo')
  const [specificFile, setSpecificFile] = useState('src/App.js')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testClaude = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-claude-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, specificFile })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Test failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🤖 Claude vs OpenAI Repository Access Test</h1>
      
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-purple-800 mb-2">Testing Repository Access</h2>
        <p className="text-purple-700">
          Repository: <strong>{repoUrl}</strong><br/>
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
          <label className="block text-sm font-medium mb-2">Specific File:</label>
          <input
            type="text"
            value={specificFile}
            onChange={(e) => setSpecificFile(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="src/App.js"
          />
        </div>
        
        <button
          onClick={testClaude}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg disabled:opacity-50 hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
        >
          {loading ? '🔍 Testing Claude...' : '🚀 Test Claude Access'}
        </button>
      </div>
      
      {result && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">📊 Test Results</h2>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-purple-700">🤖 Claude Direct Repository Access</h3>
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <strong>Prompt:</strong>
                <pre className="text-sm bg-white p-3 rounded mt-2 overflow-x-auto">
                  {result.claudeDirectAccess?.prompt}
                </pre>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <strong>Claude Response:</strong>
                <div className="mt-2 text-gray-800 whitespace-pre-wrap">
                  {result.claudeDirectAccess?.response}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-blue-700">📄 Claude with File Content (GitHub API)</h3>
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <strong>File Content (first 500 chars):</strong>
                <pre className="text-sm bg-white p-3 rounded mt-2 overflow-x-auto">
                  {result.claudeWithFileContent?.fileContent}
                </pre>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <strong>Claude Analysis:</strong>
                <div className="mt-2 text-gray-800 whitespace-pre-wrap">
                  {result.claudeWithFileContent?.response}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">💡 Key Findings</h3>
            <ul className="text-yellow-700 space-y-1">
              <li>• <strong>Direct Access:</strong> Can Claude read GitHub URLs directly?</li>
              <li>• <strong>File Analysis:</strong> How well does Claude analyze code when provided?</li>
              <li>• <strong>Comparison:</strong> Claude vs OpenAI repository access capabilities</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
} 