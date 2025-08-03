'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  CheckCircle, 
  Clock, 
  Loader2, 
  ExternalLink, 
  Download, 
  Code, 
  Database, 
  Globe, 
  Palette,
  FolderOpen,
  File,
  Terminal,
  Play,
  Package,
  Settings,
  Layers,
  FileText,
  Folder,
  ChevronRight,
  ChevronDown,
  ChevronLeft
} from 'lucide-react'

interface AppGenerationProgressProps {
  yamlConfig: string
  appName: string
  onComplete: (appUrl: string) => void
  onBack: () => void
}

interface GenerationStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  duration?: number
  files?: string[]
  commands?: string[]
}

interface FileNode {
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  created?: boolean
  path: string
}

interface TerminalEntry {
  type: 'command' | 'output' | 'success' | 'error'
  content: string
  timestamp: number
}

export default function AppGenerationProgress({ yamlConfig, appName, onComplete, onBack }: AppGenerationProgressProps) {
  const [steps, setSteps] = useState<GenerationStep[]>([
    {
      id: 'setup',
      title: 'Initializing Project',
      description: 'Creating project structure and configuration files',
      icon: Settings,
      status: 'pending',
      files: ['package.json', 'tsconfig.json', 'next.config.js', 'tailwind.config.js'],
      commands: ['mkdir -p my-app', 'cd my-app', 'npm init -y']
    },
    {
      id: 'database',
      title: 'Setting up Database',
      description: 'Generating Prisma schema and database configuration',
      icon: Database,
      status: 'pending',
      files: ['prisma/schema.prisma', 'lib/prisma.ts'],
      commands: ['prisma generate', 'prisma db push']
    },
    {
      id: 'components',
      title: 'Building React Components',
      description: 'Creating UI components and dashboard pages',
      icon: Layers,
      status: 'pending',
      files: ['components/Sidebar.tsx', 'components/StatsOverview.tsx', 'components/ChartWidget.tsx', 'app/layout.tsx', 'app/page.tsx'],
      commands: ['Generating dashboard components...', 'Creating responsive layouts...']
    },
    {
      id: 'api',
      title: 'Creating API Routes',
      description: 'Building REST API endpoints and database operations',
      icon: Code,
      status: 'pending',
      files: ['app/api/orders/route.ts', 'app/api/customers/route.ts', 'app/api/orders/[id]/route.ts'],
      commands: ['Generating CRUD endpoints...', 'Setting up API middleware...']
    },
    {
      id: 'pages',
      title: 'Generating Pages',
      description: 'Creating data management and form pages',
      icon: FileText,
      status: 'pending',
      files: ['app/orders/page.tsx', 'app/customers/page.tsx', 'app/analytics/page.tsx'],
      commands: ['Building data tables...', 'Creating form components...']
    },
    {
      id: 'deploy',
      title: 'Starting Application',
      description: 'Installing dependencies and launching the app',
      icon: Play,
      status: 'pending',
      files: ['README.md', 'deploy.sh'],
      commands: ['npm install', 'npm run db:generate', 'npm run dev -- -p 7250']
    }
  ])

  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [generatedAppUrl, setGeneratedAppUrl] = useState<string | null>(null)
  const [generationLog, setGenerationLog] = useState<string[]>([])
  
  // New visual states
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([])
  const [currentFiles, setCurrentFiles] = useState<Set<string>>(new Set())
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('🎨 Loading OPSAI Visual Generation Interface v2.0')
    startGeneration()
  }, [])

  const addTerminalEntry = (type: TerminalEntry['type'], content: string) => {
    const entry: TerminalEntry = {
      type,
      content,
      timestamp: Date.now()
    }
    setTerminalEntries(prev => [...prev, entry])
    
    // Auto-scroll terminal
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      }
    }, 100)
  }

  const addFileToTree = async (filePath: string) => {
    const newFile = new Set(currentFiles)
    newFile.add(filePath)
    setCurrentFiles(newFile)
    
    // Simulate file creation with delay
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  const startGeneration = async () => {
    addTerminalEntry('output', '🚀 Starting application generation...')
    addTerminalEntry('output', `📱 Project: ${appName}`)
    addTerminalEntry('output', '─'.repeat(50))
    
    // Call the actual API to generate the app
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yamlConfig,
          appName
        })
      })

      const result = await response.json()
      
      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i)
        setSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index === i ? 'in_progress' : index < i ? 'completed' : 'pending'
        })))

        await simulateVisualGeneration(steps[i])

        setSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index <= i ? 'completed' : 'pending'
        })))
      }

      if (result.success) {
        setGeneratedAppUrl(result.appUrl || `http://localhost:${result.port}`)
        addTerminalEntry('success', `✅ ${result.message}`)
        addTerminalEntry('success', `🌐 App URL: ${result.appUrl || `http://localhost:${result.port}`}`)
        onComplete(result.appUrl || `http://localhost:${result.port}`)
      } else {
        addTerminalEntry('error', `❌ Generation failed: ${result.error}`)
        if (result.details) {
          addTerminalEntry('error', `📋 Details: ${JSON.stringify(result.details)}`)
        }
        console.error('Generation failed:', result)
      }
    } catch (error) {
      addTerminalEntry('error', `❌ Generation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Generation error:', error)
    }
  }

  const simulateVisualGeneration = async (step: GenerationStep) => {
    addTerminalEntry('command', `▶ ${step.title}`)
    addTerminalEntry('output', step.description)
    
    // Show commands being executed
    if (step.commands) {
      for (const command of step.commands) {
        addTerminalEntry('command', `$ ${command}`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    // Show files being created
    if (step.files) {
      for (const file of step.files) {
        addTerminalEntry('output', `  📄 Creating ${file}`)
        await addFileToTree(file)
      }
    }
    
    // Simulate step completion time
    await new Promise(resolve => setTimeout(resolve, 1500))
    addTerminalEntry('success', `✅ ${step.title} completed`)
  }

  // File tree rendering component
  const renderFileTree = () => {
    const allFiles = Array.from(currentFiles).map(path => {
      const parts = path.split('/')
      return {
        name: parts[parts.length - 1],
        path,
        type: path.includes('.') ? 'file' as const : 'folder' as const,
        created: true
      }
    })

    const groupedFiles = allFiles.reduce((acc, file) => {
      const folder = file.path.includes('/') ? file.path.split('/')[0] : 'root'
      if (!acc[folder]) acc[folder] = []
      acc[folder].push(file)
      return acc
    }, {} as Record<string, typeof allFiles>)

    return (
      <div className="space-y-1">
        <div className="flex items-center space-x-2 mb-3">
          <FolderOpen className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-gray-900">{appName.toLowerCase().replace(/\s+/g, '-')}</span>
        </div>
        {Object.entries(groupedFiles).map(([folder, files]) => (
          <div key={folder} className="ml-4">
            {folder !== 'root' && (
              <div className="flex items-center space-x-2 mb-1">
                <ChevronDown className="w-3 h-3 text-gray-400" />
                <Folder className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-700">{folder}</span>
              </div>
            )}
            {files.map(file => (
              <div 
                key={file.path} 
                className={`flex items-center space-x-2 py-1 px-2 rounded transition-all duration-300 ${
                  file.created ? 'bg-green-50 animate-pulse' : ''
                } ml-${folder === 'root' ? '0' : '6'}`}
              >
                <File className="w-3 h-3 text-gray-400" />
                <span className="text-xs font-mono text-gray-600">{file.name}</span>
                {file.created && <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  const downloadSourceCode = () => {
    // Create a mock source code download
    const sourceCode = `
// Generated by OPSAI Core
// ${appName} - Full Stack SaaS Application

// Package.json
{
  "name": "${appName.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0"
  }
}

// Generated based on your YAML configuration:
${yamlConfig}
    `.trim()

    const blob = new Blob([sourceCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}-source.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center px-3 py-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back
              </button>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-white">🚀 OPSAI Code Generator v2.0</h1>
                <p className="text-slate-400 text-sm">✨ Visual Generation • Building: {appName}</p>
              </div>
            </div>
            {generatedAppUrl && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={downloadSourceCode}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center text-sm transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
                <a
                  href={generatedAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg flex items-center text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open App
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          {/* Progress Steps - Left Column */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 h-full">
              <div className="flex items-center space-x-2 mb-6">
                <Settings className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Build Steps</h2>
              </div>
              <div className="space-y-3">{steps.map((step, index) => {
                const StepIcon = step.icon
                return (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                      step.status === 'in_progress' ? 'bg-blue-600/20 border border-blue-500/30' :
                      step.status === 'completed' ? 'bg-green-600/20 border border-green-500/30' :
                      'bg-slate-700/30 border border-slate-600/30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === 'in_progress' ? 'bg-blue-500 animate-pulse' :
                      step.status === 'completed' ? 'bg-green-500' :
                      'bg-slate-600'
                    }`}>
                      {step.status === 'in_progress' ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : step.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <StepIcon className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{step.title}</p>
                      <p className="text-xs text-slate-400 truncate">{step.description}</p>
                    </div>
                  </div>
                )
              })}</div>
            </div>
          </div>

          {/* File Tree - Middle Column */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 h-full">
              <div className="flex items-center space-x-2 mb-6">
                <FolderOpen className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">Project Files</h2>
                <div className="flex-1" />
                <div className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                  {currentFiles.size} files
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(100%-80px)] text-sm">
                {renderFileTree()}
              </div>
            </div>
          </div>

          {/* Terminal - Right Column */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 h-full overflow-hidden">
              <div className="flex items-center space-x-2 p-4 border-b border-slate-700">
                <Terminal className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">Terminal</h2>
                <div className="flex-1" />
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div 
                ref={terminalRef}
                className="p-4 h-[calc(100%-60px)] overflow-y-auto font-mono text-sm bg-slate-900/50"
              >
                {terminalEntries.map((entry, index) => (
                  <div key={index} className={`mb-1 ${
                    entry.type === 'command' ? 'text-cyan-400' :
                    entry.type === 'success' ? 'text-green-400' :
                    entry.type === 'error' ? 'text-red-400' :
                    'text-slate-300'
                  }`}>
                    {entry.type === 'command' && <span className="text-green-400">❯ </span>}
                    {entry.content}
                  </div>
                ))}
                {currentStepIndex >= 0 && currentStepIndex < steps.length && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-400 text-xs">Building...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {generatedAppUrl && (
          <div className="mt-8 bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">🎉 Application Generated Successfully!</h3>
                <p className="text-slate-300 mb-3">
                  🚀 Your SaaS application is auto-started and running on port 7250!
                </p>
                <div className="flex items-center space-x-4">
                  <a
                    href={generatedAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Open Live App
                  </a>
                  <span className="text-slate-400 font-mono text-sm">{generatedAppUrl}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
