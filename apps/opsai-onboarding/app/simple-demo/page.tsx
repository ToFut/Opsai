'use client'

import React, { useState } from 'react'

export default function SimpleDemo() {
  const [selectedModel, setSelectedModel] = useState('gpt-oss-20b')
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          🚀 GPT-OSS Onboarding Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Model Selection */}
          <div 
            className={`p-6 border rounded-lg cursor-pointer transition-all ${
              selectedModel === 'gpt-oss-20b' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onClick={() => setSelectedModel('gpt-oss-20b')}
          >
            <h3 className="text-xl font-semibold mb-2">GPT-OSS 20B</h3>
            <p className="text-gray-600 mb-4">Fast responses in ~3 seconds</p>
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
              $0 per request
            </div>
          </div>

          <div 
            className={`p-6 border rounded-lg cursor-pointer transition-all ${
              selectedModel === 'gpt-oss-120b' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onClick={() => setSelectedModel('gpt-oss-120b')}
          >
            <h3 className="text-xl font-semibold mb-2">GPT-OSS 120B</h3>
            <p className="text-gray-600 mb-4">High quality in ~8 seconds</p>
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
              $0 per request
            </div>
          </div>

          <div 
            className={`p-6 border rounded-lg cursor-pointer transition-all ${
              selectedModel === 'openai' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onClick={() => setSelectedModel('openai')}
          >
            <h3 className="text-xl font-semibold mb-2">OpenAI Fallback</h3>
            <p className="text-gray-600 mb-4">When local models unavailable</p>
            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
              $0.03-0.12 per request
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Selected Model: {selectedModel}</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Website URL:</label>
              <input 
                type="url"
                className="w-full p-3 border rounded-lg"
                placeholder="https://stripe.com"
                defaultValue="https://stripe.com"
              />
            </div>
            
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
              🧠 Analyze with {selectedModel}
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: 1, title: "AI Model Selection", status: "✅ Complete" },
            { step: 2, title: "Business Analysis", status: "🔄 Ready" },
            { step: 3, title: "Smart Integrations", status: "⏳ Pending" },
            { step: 4, title: "App Generation", status: "⏳ Pending" }
          ].map(item => (
            <div key={item.step} className="bg-white p-4 rounded-lg shadow">
              <div className="text-lg font-semibold">Step {item.step}</div>
              <div className="text-sm text-gray-600">{item.title}</div>
              <div className="text-sm mt-2">{item.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}