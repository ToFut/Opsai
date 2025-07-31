import React, { useState, useEffect } from 'react'
import { Play, FolderOpen, File, Code2, Database, Settings, Zap, CheckCircle, XCircle } from 'lucide-react'

interface CodeGenerationInterfaceProps {
  isGenerating: boolean
  yamlContent?: string
  onComplete: () => void
  businessProfile?: any
}

interface FileItem {
  name: string
  type: 'file' | 'folder'
  icon: React.ReactNode
  status: 'pending' | 'generating' | 'complete' | 'error'
  content?: string
  children?: FileItem[]
}

export default function CodeGenerationInterface({ 
  isGenerating, 
  yamlContent, 
  onComplete,
  businessProfile 
}: CodeGenerationInterfaceProps) {
  const [selectedFile, setSelectedFile] = useState<string>('config.yaml')
  const [terminalLogs, setTerminalLogs] = useState<string[]>([])
  const [fileStructure, setFileStructure] = useState<FileItem[]>([])

  // Initialize file structure
  useEffect(() => {
    const appName = businessProfile?.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'business-app'
    
    const structure: FileItem[] = [
      {
        name: appName,
        type: 'folder',
        icon: <FolderOpen className="w-4 h-4" />,
        status: 'pending',
        children: [
          {
            name: 'config.yaml',
            type: 'file',
            icon: <Settings className="w-4 h-4 text-orange-500" />,
            status: 'pending',
            content: yamlContent || '# Configuration loading...'
          },
          {
            name: 'database',
            type: 'folder',
            icon: <FolderOpen className="w-4 h-4" />,
            status: 'pending',
            children: [
              {
                name: 'schema.sql',
                type: 'file',
                icon: <Database className="w-4 h-4 text-blue-500" />,
                status: 'pending'
              },
              {
                name: 'migrations',
                type: 'folder',
                icon: <FolderOpen className="w-4 h-4" />,
                status: 'pending',
                children: []
              }
            ]
          },
          {
            name: 'src',
            type: 'folder',
            icon: <FolderOpen className="w-4 h-4" />,
            status: 'pending',
            children: [
              {
                name: 'api',
                type: 'folder',
                icon: <FolderOpen className="w-4 h-4" />,
                status: 'pending',
                children: [
                  {
                    name: 'routes.ts',
                    type: 'file',
                    icon: <Code2 className="w-4 h-4 text-green-500" />,
                    status: 'pending'
                  }
                ]
              },
              {
                name: 'components',
                type: 'folder',
                icon: <FolderOpen className="w-4 h-4" />,
                status: 'pending',
                children: [
                  {
                    name: 'Dashboard.tsx',
                    type: 'file',
                    icon: <Code2 className="w-4 h-4 text-blue-400" />,
                    status: 'pending'
                  }
                ]
              },
              {
                name: 'workflows',
                type: 'folder',
                icon: <FolderOpen className="w-4 h-4" />,
                status: 'pending',
                children: [
                  {
                    name: 'automation.ts',
                    type: 'file',
                    icon: <Zap className="w-4 h-4 text-yellow-500" />,
                    status: 'pending'
                  }
                ]
              }
            ]
          },
          {
            name: 'package.json',
            type: 'file',
            icon: <File className="w-4 h-4 text-green-600" />,
            status: 'pending'
          },
          {
            name: 'README.md',
            type: 'file',
            icon: <File className="w-4 h-4 text-gray-500" />,
            status: 'pending'
          }
        ]
      }
    ]
    
    setFileStructure(structure)
  }, [businessProfile, yamlContent])

  // Simulate file generation progress
  useEffect(() => {
    if (!isGenerating) return

    const logs = [
      '🚀 Starting application generation...',
      '📋 Parsing YAML configuration...',
      '🏗️  Creating project structure...',
      '💾 Generating database schema...',
      '🔗 Setting up API integrations...',
      '⚡ Configuring workflows...',
      '🎨 Creating UI components...',
      '📦 Installing dependencies...',
      '✅ Application generated successfully!'
    ]

    let logIndex = 0
    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        setTerminalLogs(prev => [...prev, logs[logIndex]])
        
        // Update file status based on progress
        setFileStructure(prev => updateFileStatus(prev, logIndex))
        
        logIndex++
      } else {
        clearInterval(interval)
        setTimeout(onComplete, 1000)
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [isGenerating, onComplete])

  const updateFileStatus = (files: FileItem[], progress: number): FileItem[] => {
    return files.map(file => {
      const newFile = { ...file }
      
      // Update status based on progress
      if (progress >= 2 && file.name.includes('config.yaml')) {
        newFile.status = 'complete'
      } else if (progress >= 3 && file.name.includes('database')) {
        newFile.status = 'complete'
      } else if (progress >= 4 && file.name.includes('api')) {
        newFile.status = 'complete'
      } else if (progress >= 5 && file.name.includes('workflows')) {
        newFile.status = 'complete'
      } else if (progress >= 6 && file.name.includes('components')) {
        newFile.status = 'complete'
      } else if (progress >= 7 && (file.name.includes('.json') || file.name.includes('.md'))) {
        newFile.status = 'complete'
      } else if (progress >= 1) {
        newFile.status = 'generating'
      }
      
      if (file.children) {
        newFile.children = updateFileStatus(file.children, progress)
      }
      
      return newFile
    })
  }

  const renderFileTree = (files: FileItem[], depth = 0) => {
    return files.map((file, index) => (
      <div key={`${file.name}-${index}`} className={`pl-${depth * 4}`}>
        <div 
          className={`flex items-center space-x-2 py-1 px-2 hover:bg-gray-100 cursor-pointer rounded text-sm ${
            selectedFile === file.name ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          onClick={() => file.type === 'file' && setSelectedFile(file.name)}
        >
          {file.icon}
          <span className="flex-1">{file.name}</span>
          {file.status === 'generating' && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
          {file.status === 'complete' && (
            <CheckCircle className="w-3 h-3 text-green-500" />
          )}
          {file.status === 'error' && (
            <XCircle className="w-3 h-3 text-red-500" />
          )}
        </div>
        {file.children && renderFileTree(file.children, depth + 1)}
      </div>
    ))
  }

  const getSelectedFileContent = () => {
    const findFile = (files: FileItem[]): FileItem | undefined => {
      for (const file of files) {
        if (file.name === selectedFile) return file
        if (file.children) {
          const found = findFile(file.children)
          if (found) return found
        }
      }
    }
    
    const file = findFile(fileStructure)
    return file?.content || '# File content will appear here...'
  }

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col z-50">
      {/* VS Code-like header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>
          <h1 className="text-sm font-medium">OPSAI Code Generator</h1>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>Generating: {businessProfile?.businessName || 'Business App'}</span>
          {isGenerating && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Building...</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-700 text-sm font-medium text-gray-300">
            EXPLORER
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {renderFileTree(fileStructure)}
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Tab bar */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-700 px-3 py-1 rounded-t text-sm flex items-center space-x-2">
                <Settings className="w-3 h-3" />
                <span>{selectedFile}</span>
              </div>
            </div>
          </div>

          {/* Editor content */}
          <div className="flex-1 bg-gray-900 p-4 overflow-y-auto">
            <pre className="text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
              {getSelectedFileContent()}
            </pre>
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div className="h-48 bg-black border-t border-gray-700 flex flex-col">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm font-medium text-gray-300 flex items-center space-x-2">
          <Play className="w-4 h-4" />
          <span>TERMINAL</span>
        </div>
        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
          {terminalLogs.map((log, index) => (
            <div key={index} className="mb-1 text-green-400">
              <span className="text-gray-500">$</span> {log}
            </div>
          ))}
          {isGenerating && (
            <div className="flex items-center space-x-2 text-green-400">
              <span className="text-gray-500">$</span>
              <span>Processing...</span>
              <div className="w-2 h-4 bg-green-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}