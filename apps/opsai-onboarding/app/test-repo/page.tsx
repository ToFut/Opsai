'use client'

import { useState } from 'react'

export default function TestRepoAccess() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/vercel/next.js')
  const [files, setFiles] = useState(['package.json', 'README.md'])
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAccess = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-repo-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, files })
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
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🧪 Test OpenAI Repository Access</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Repository URL:</label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="https://github.com/user/repo"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Files to test (one per line):</label>
          <textarea
            value={files.join('\n')}
            onChange={(e) => setFiles(e.target.value.split('\n').filter(Boolean))}
            className="w-full p-2 border rounded h-24"
            placeholder="package.json&#10;README.md&#10;src/index.js"
          />
        </div>
        
        <button
          onClick={testAccess}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Access'}
        </button>
      </div>
      
      {result && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Results:</h2>
          
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-medium mb-2">Test 1: Direct Repository Access</h3>
            <div className="text-sm mb-2">
              <strong>Prompt:</strong>
              <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
                {result.test1?.prompt}
              </pre>
            </div>
            <div className="text-sm">
              <strong>Response:</strong>
              <pre className="bg-white p-2 rounded mt-1 text-xs whitespace-pre-wrap">
                {result.test1?.response}
              </pre>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-medium mb-2">Test 2: File Analysis</h3>
            <div className="text-sm mb-2">
              <strong>Prompt:</strong>
              <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
                {result.test2?.prompt}
              </pre>
            </div>
            <div className="text-sm">
              <strong>Response:</strong>
              <pre className="bg-white p-2 rounded mt-1 text-xs whitespace-pre-wrap">
                {result.test2?.response}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 