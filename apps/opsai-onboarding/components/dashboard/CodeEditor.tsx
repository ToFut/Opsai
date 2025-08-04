'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code, Play, Save, Download, Upload, RefreshCw, 
  MessageSquare, Sparkles, FileText, Folder, 
  FolderOpen, Plus, X, Eye, Settings, Zap,
  Terminal, GitBranch, Cpu, Rocket
} from 'lucide-react'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  content?: string
  children?: FileNode[]
  language?: string
  isOpen?: boolean
  isNew?: boolean
}

interface AIGenerationRequest {
  prompt: string
  context: string
  targetFile?: string
  operation: 'create' | 'modify' | 'add_feature' | 'fix_bug' | 'optimize'
}

interface CodeEditorProps {
  appId: string
  initialFiles?: FileNode[]
  onSave?: (files: FileNode[]) => void
  onDeploy?: () => void
}

export default function CodeEditor({ appId, initialFiles = [], onSave, onDeploy }: CodeEditorProps) {
  const [files, setFiles] = useState<FileNode[]>(initialFiles)
  const [activeFile, setActiveFile] = useState<FileNode | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'ai', content: string}>>([])
  
  const editorRef = useRef<any>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Initialize with default project structure if no files provided
  useEffect(() => {
    if (files.length === 0) {
      setFiles(getDefaultProjectStructure())
    }
  }, [])

  // Load Monaco Editor
  useEffect(() => {
    const loadMonaco = async () => {
      if (typeof window !== 'undefined') {
        const monaco = await import('monaco-editor')
        
        // Configure Monaco themes
        monaco.editor.defineTheme('opsai-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#0f172a',
            'editor.foreground': '#f8fafc',
            'editorLineNumber.foreground': '#64748b'
          }
        })
        
        if (editorRef.current && activeFile) {
          const editor = monaco.editor.create(editorRef.current, {
            value: activeFile.content || '',
            language: getLanguageFromFile(activeFile.name),
            theme: 'opsai-dark',
            fontSize: 14,
            minimap: { enabled: true },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'on'
          })
          
          editor.onDidChangeModelContent(() => {
            if (activeFile) {
              updateFileContent(activeFile.id, editor.getValue())
            }
          })
        }
      }
    }
    
    loadMonaco()
  }, [activeFile])

  const getDefaultProjectStructure = (): FileNode[] => [
    {
      id: 'root',
      name: 'my-app',
      type: 'folder',
      path: '/',
      isOpen: true,
      children: [
        {
          id: 'src',
          name: 'src',
          type: 'folder',
          path: '/src',
          isOpen: true,
          children: [
            {
              id: 'app',
              name: 'App.tsx',
              type: 'file',
              path: '/src/App.tsx',
              language: 'typescript',
              content: `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Your AI-Generated App</h1>
        <p>Start editing to see changes!</p>
      </header>
    </div>
  )
}

export default App`
            },
            {
              id: 'index',
              name: 'index.tsx',
              type: 'file',
              path: '/src/index.tsx',
              language: 'typescript',
              content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`
            }
          ]
        },
        {
          id: 'public',
          name: 'public',
          type: 'folder',
          path: '/public',
          children: [
            {
              id: 'index-html',
              name: 'index.html',
              type: 'file',
              path: '/public/index.html',
              language: 'html',
              content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AI Generated App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
            }
          ]
        },
        {
          id: 'package',
          name: 'package.json',
          type: 'file',
          path: '/package.json',
          language: 'json',
          content: JSON.stringify({
            name: 'ai-generated-app',
            version: '1.0.0',
            dependencies: {
              'react': '^18.2.0',
              'react-dom': '^18.2.0',
              'typescript': '^4.9.5'
            },
            scripts: {
              start: 'react-scripts start',
              build: 'react-scripts build',
              test: 'react-scripts test'
            }
          }, null, 2)
        }
      ]
    }
  ]

  const getLanguageFromFile = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      'tsx': 'typescript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'js': 'javascript',
      'css': 'css',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'go': 'go',
      'rs': 'rust',
      'java': 'java'
    }
    return languageMap[ext || ''] || 'plaintext'
  }

  const updateFileContent = (fileId: string, content: string) => {
    setFiles(prev => updateFileInTree(prev, fileId, { content }))
  }

  const updateFileInTree = (nodes: FileNode[], targetId: string, updates: Partial<FileNode>): FileNode[] => {
    return nodes.map(node => {
      if (node.id === targetId) {
        return { ...node, ...updates }
      }
      if (node.children) {
        return { ...node, children: updateFileInTree(node.children, targetId, updates) }
      }
      return node
    })
  }

  const findFileById = (nodes: FileNode[], targetId: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === targetId) return node
      if (node.children) {
        const found = findFileById(node.children, targetId)
        if (found) return found
      }
    }
    return null
  }

  const toggleFolder = (folderId: string) => {
    setFiles(prev => updateFileInTree(prev, folderId, { isOpen: !findFileById(prev, folderId)?.isOpen }))
  }

  const selectFile = (file: FileNode) => {
    if (file.type === 'file') {
      setActiveFile(file)
    }
  }

  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) return
    
    setIsGenerating(true)
    setChatHistory(prev => [...prev, { role: 'user', content: aiPrompt }])
    
    try {
      const response = await fetch('/api/ai-generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          context: {
            appId,
            currentFiles: files,
            activeFile: activeFile?.path
          },
          operation: 'create'
        } as AIGenerationRequest)
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Apply generated changes
        if (result.files) {
          setFiles(result.files)
        }
        if (result.newFile) {
          setActiveFile(result.newFile)
        }
        
        setChatHistory(prev => [...prev, { 
          role: 'ai', 
          content: result.explanation || 'Code generated successfully!' 
        }])
      } else {
        throw new Error(result.error || 'Generation failed')
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }])
    } finally {
      setIsGenerating(false)
      setAiPrompt('')
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/apps/${appId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      })
      
      if (response.ok) {
        onSave?.(files)
      }
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    try {
      await handleSave() // Save first
      const response = await fetch(`/api/apps/${appId}/deploy`, {
        method: 'POST'
      })
      
      if (response.ok) {
        onDeploy?.()
      }
    } catch (error) {
      console.error('Deploy failed:', error)
    } finally {
      setIsDeploying(false)
    }
  }

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.id} style={{ marginLeft: level * 16 }}>
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer rounded text-sm ${
            activeFile?.id === node.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          onClick={() => node.type === 'folder' ? toggleFolder(node.id) : selectFile(node)}
        >
          {node.type === 'folder' ? (
            node.isOpen ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span className="flex-1">{node.name}</span>
          {node.isNew && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">NEW</span>}
        </div>
        {node.type === 'folder' && node.isOpen && node.children && (
          <div>
            {renderFileTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - File Tree */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold">Code Editor</h2>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showAIChat ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI Chat
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showPreview ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Files</div>
          {renderFileTree(files)}
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isDeploying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              Deploy
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="h-12 bg-white border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {activeFile && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{activeFile.name}</span>
                <span className="text-xs text-gray-500">{activeFile.path}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded">
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Terminal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex">
          {/* Code Editor */}
          <div className="flex-1">
            {activeFile ? (
              <div ref={editorRef} className="h-full" />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Code className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a file to start editing</p>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-1/2 border-l bg-white">
              <div className="h-8 bg-gray-100 border-b flex items-center px-4">
                <span className="text-sm font-medium">Live Preview</span>
                <button
                  onClick={() => setShowPreview(false)}
                  className="ml-auto p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <iframe
                ref={previewRef}
                src={`/preview/${appId}`}
                className="w-full h-full"
                title="App Preview"
              />
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {showAIChat && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white border-l flex flex-col"
          >
            <div className="h-12 border-b flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium">AI Assistant</span>
              </div>
              <button
                onClick={() => setShowAIChat(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((message, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-100 text-blue-900 ml-8'
                      : 'bg-gray-100 text-gray-900 mr-8'
                  }`}
                >
                  <div className="text-xs font-medium mb-1 opacity-70">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div className="text-sm">{message.content}</div>
                </div>
              ))}
              
              {isGenerating && (
                <div className="bg-gray-100 text-gray-900 mr-8 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Generating code...</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want to build..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAIGeneration()}
                />
                <button
                  onClick={handleAIGeneration}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                Try: "Add a login form", "Create a todo list", "Add dark mode"
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}