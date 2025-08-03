'use client';

import React, { useState, useEffect } from 'react';
import { AICodeGenerator, CodeGenerationRequest } from '../../../packages/core/src/services/ai-code-generator';

interface AppBuilderProps {
  appId: string;
  currentAppStructure: any;
}

export default function InteractiveAppBuilder({ appId, currentAppStructure }: AppBuilderProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [modificationRequest, setModificationRequest] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  const handleComponentModification = async () => {
    if (!selectedComponent || !modificationRequest) return;

    setIsGenerating(true);
    
    try {
      const aiGenerator = new AICodeGenerator(process.env.NEXT_PUBLIC_OPENAI_API_KEY!);
      
      const request: CodeGenerationRequest = {
        filePath: selectedComponent,
        modification: modificationRequest,
        context: {
          currentCode: '', // Would be loaded from file system
          appStructure: currentAppStructure,
          userIntent: modificationRequest
        }
      };

      const result = await aiGenerator.generateComponentModification(request);
      
      // Apply the changes
      await applyCodeChanges(result);
      
      setChatHistory(prev => [...prev, 
        { role: 'user', content: modificationRequest },
        { role: 'assistant', content: result.explanation }
      ]);
      
      setModificationRequest('');
    } catch (error) {
      console.error('Error modifying component:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyCodeChanges = async (generatedCode: any) => {
    // This would integrate with your deployment system
    // to apply changes to the live app
    console.log('Applying code changes:', generatedCode);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - App Structure */}
      <div className="w-1/4 bg-white border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">App Structure</h2>
        <div className="space-y-2">
          {Object.keys(currentAppStructure).map((component) => (
            <div
              key={component}
              className={`p-2 rounded cursor-pointer ${
                selectedComponent === component 
                  ? 'bg-blue-100 border-blue-300' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedComponent(component)}
            >
              📄 {component}
            </div>
          ))}
        </div>
      </div>

      {/* Center Panel - Live Preview */}
      <div className="flex-1 flex flex-col">
        <div className="h-1/2 bg-white border-b border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Live Preview</h2>
            <div className="flex space-x-2 mt-2">
              <button className="px-3 py-1 bg-green-500 text-white rounded text-sm">
                🚀 Deploy Changes
              </button>
              <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm">
                🔄 Refresh
              </button>
            </div>
          </div>
          <div className="p-4">
            <iframe
              src={previewUrl || `/api/preview/${appId}`}
              className="w-full h-full border border-gray-300 rounded"
              title="App Preview"
            />
          </div>
        </div>

        {/* Bottom Panel - AI Chat */}
        <div className="flex-1 bg-white">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">AI Assistant</h2>
          </div>
          
          {/* Chat History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={modificationRequest}
                onChange={(e) => setModificationRequest(e.target.value)}
                placeholder="Describe what you want to change..."
                className="flex-1 p-2 border border-gray-300 rounded"
                onKeyPress={(e) => e.key === 'Enter' && handleComponentModification()}
              />
              <button
                onClick={handleComponentModification}
                disabled={isGenerating || !modificationRequest}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                {isGenerating ? '🔄' : '✨'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="w-1/4 bg-white border-l border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">Properties</h2>
        {selectedComponent ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Component: {selectedComponent}
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Styling
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Background color"
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Text color"
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Binding
              </label>
              <select className="w-full p-2 border border-gray-300 rounded text-sm">
                <option>Select data source...</option>
                <option>Users</option>
                <option>Products</option>
                <option>Orders</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actions
              </label>
              <div className="space-y-2">
                <button className="w-full p-2 bg-green-500 text-white rounded text-sm">
                  Add Event Handler
                </button>
                <button className="w-full p-2 bg-blue-500 text-white rounded text-sm">
                  Add Validation
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Select a component to edit its properties</p>
        )}
      </div>
    </div>
  );
} 