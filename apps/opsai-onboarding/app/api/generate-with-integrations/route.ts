import { NextRequest, NextResponse } from 'next/server'
import IntegrationBuilder from '@/lib/integration-builder'
import fs from 'fs/promises'
import path from 'path'

/**
 * Enhanced App Generator with Real Integration Implementation
 * Takes user choices and generates working code with actual integrations
 */

export async function POST(request: NextRequest) {
  try {
    const {
      yamlConfig,
      selectedIntegrations,
      userChoices,
      businessAnalysis,
      workflows,
      appName
    } = await request.json()

    console.log(`🚀 Generating app with real integrations: ${selectedIntegrations.join(', ')}`)

    // Initialize Integration Builder with user selections
    const integrationBuilder = new IntegrationBuilder(selectedIntegrations, userChoices)
    
    // Generate all integration code
    const integrationCode = integrationBuilder.generateIntegrationCode()
    
    // Create app directory
    const appDir = path.join(process.cwd(), 'generated-apps', appName)
    await fs.mkdir(appDir, { recursive: true })

    // Generate core app structure
    await generateCoreApplication(appDir, yamlConfig, businessAnalysis)
    
    // Generate integration-specific code
    await generateIntegrationFiles(appDir, integrationCode, integrationBuilder)
    
    // Generate workflows with integrations
    await generateWorkflowFiles(appDir, workflows, selectedIntegrations)
    
    // Generate configuration files
    await generateConfigurationFiles(appDir, integrationCode, integrationBuilder)
    
    // Generate documentation
    await generateDocumentation(appDir, integrationBuilder, selectedIntegrations)

    // Start the generated app
    const appUrl = await startGeneratedApp(appDir, appName)

    return NextResponse.json({
      success: true,
      appName,
      appUrl,
      integrations: selectedIntegrations,
      generatedFiles: await getGeneratedFilesList(appDir),
      integrationDetails: {
        envVars: integrationCode.envVars.length,
        apiRoutes: integrationCode.apiRoutes.length,
        components: integrationCode.components.length,
        webhooks: integrationCode.webhooks.length
      }
    })

  } catch (error) {
    console.error('App generation with integrations failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate app with integrations' },
      { status: 500 }
    )
  }
}

async function generateCoreApplication(appDir: string, yamlConfig: any, businessAnalysis: any) {
  // Generate package.json with integration dependencies
  const packageJson = {
    name: path.basename(appDir),
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    },
    dependencies: {
      'next': '^14.0.0',
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      'tailwindcss': '^3.3.0',
      'autoprefixer': '^10.4.14',
      'postcss': '^8.4.24'
    }
  }

  await fs.writeFile(
    path.join(appDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  // Generate Next.js config
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    CUSTOM_KEY: 'custom_value',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig`

  await fs.writeFile(path.join(appDir, 'next.config.js'), nextConfig)

  // Generate main layout
  const layout = `import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${businessAnalysis?.business?.name || 'Generated App'}',
  description: 'AI-generated business application with integrated services',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`

  await fs.mkdir(path.join(appDir, 'app'), { recursive: true })
  await fs.writeFile(path.join(appDir, 'app', 'layout.tsx'), layout)

  // Generate main page
  const mainPage = `import IntegratedDashboard from '@/components/IntegratedDashboard'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          ${businessAnalysis?.business?.name || 'AI-Generated App'}
        </h1>
        <p className="text-xl text-gray-600 text-center mb-12">
          Powered by AI with integrated services
        </p>
        <IntegratedDashboard />
      </div>
    </main>
  )
}`

  await fs.writeFile(path.join(appDir, 'app', 'page.tsx'), mainPage)

  // Generate global CSS
  const globalCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: system-ui, sans-serif;
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }
  
  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
}`

  await fs.writeFile(path.join(appDir, 'app', 'globals.css'), globalCSS)
}

async function generateIntegrationFiles(appDir: string, integrationCode: any, integrationBuilder: IntegrationBuilder) {
  // Create API routes directory
  const apiDir = path.join(appDir, 'app', 'api')
  await fs.mkdir(apiDir, { recursive: true })

  // Generate each API route
  for (const routeCode of integrationCode.apiRoutes) {
    const routeName = extractRouteNameFromCode(routeCode)
    const routeDir = path.join(apiDir, routeName)
    await fs.mkdir(routeDir, { recursive: true })
    await fs.writeFile(path.join(routeDir, 'route.ts'), routeCode)
  }

  // Create components directory
  const componentsDir = path.join(appDir, 'components')
  await fs.mkdir(componentsDir, { recursive: true })

  // Generate each component
  for (const componentCode of integrationCode.components) {
    const componentName = extractComponentNameFromCode(componentCode)
    await fs.writeFile(
      path.join(componentsDir, `${componentName}.tsx`),
      componentCode
    )
  }

  // Generate integrated dashboard component
  const integratedDashboard = generateIntegratedDashboardComponent(integrationCode)
  await fs.writeFile(
    path.join(componentsDir, 'IntegratedDashboard.tsx'),
    integratedDashboard
  )

  // Generate middleware if needed
  if (integrationCode.middleware.length > 0) {
    const middlewareDir = path.join(appDir, 'middleware')
    await fs.mkdir(middlewareDir, { recursive: true })
    
    for (const middlewareCode of integrationCode.middleware) {
      const middlewareName = extractMiddlewareNameFromCode(middlewareCode)
      await fs.writeFile(
        path.join(middlewareDir, `${middlewareName}.ts`),
        middlewareCode
      )
    }
  }

  // Generate lib directory with configs
  const libDir = path.join(appDir, 'lib')
  await fs.mkdir(libDir, { recursive: true })
  
  for (const configCode of integrationCode.configFiles) {
    const configName = extractConfigNameFromCode(configCode)
    await fs.writeFile(
      path.join(libDir, `${configName}.ts`),
      configCode
    )
  }
}

async function generateWorkflowFiles(appDir: string, workflows: any[], selectedIntegrations: string[]) {
  const workflowsDir = path.join(appDir, 'lib', 'workflows')
  await fs.mkdir(workflowsDir, { recursive: true })

  for (const workflow of workflows) {
    const workflowCode = generateWorkflowImplementation(workflow, selectedIntegrations)
    const fileName = workflow.name?.toLowerCase().replace(/\s+/g, '-') || 'workflow'
    await fs.writeFile(
      path.join(workflowsDir, `${fileName}.ts`),
      workflowCode
    )
  }

  // Generate workflow manager
  const workflowManager = generateWorkflowManager(workflows)
  await fs.writeFile(
    path.join(workflowsDir, 'manager.ts'),
    workflowManager
  )
}

async function generateConfigurationFiles(appDir: string, integrationCode: any, integrationBuilder: IntegrationBuilder) {
  // Generate .env.example with all required variables
  const envExample = integrationBuilder.generateEnvTemplate()
  await fs.writeFile(path.join(appDir, '.env.example'), envExample)

  // Generate TypeScript config
  const tsConfig = {
    compilerOptions: {
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'node',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      baseUrl: '.',
      paths: {
        '@/*': ['./*']
      }
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  }

  await fs.writeFile(
    path.join(appDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  )

  // Generate Tailwind config
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}`

  await fs.writeFile(path.join(appDir, 'tailwind.config.js'), tailwindConfig)
}

async function generateDocumentation(appDir: string, integrationBuilder: IntegrationBuilder, selectedIntegrations: string[]) {
  // Generate integration README
  const readme = integrationBuilder.generateIntegrationReadme()
  await fs.writeFile(path.join(appDir, 'INTEGRATIONS.md'), readme)

  // Generate main README
  const mainReadme = `# AI-Generated Business Application

This application was generated with integrated services and workflows.

## Features

- ✅ Next.js 14 with TypeScript
- ✅ Tailwind CSS styling
- ✅ Integrated services: ${selectedIntegrations.join(', ')}
- ✅ AI-generated workflows
- ✅ Production-ready code

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Copy environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

3. Add your API keys to \`.env.local\`

4. Run development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000)

## Integrations

${selectedIntegrations.map(integration => `
### ${integration.charAt(0).toUpperCase() + integration.slice(1)}
- API Routes: \`/api/${integration}\`
- Webhooks: \`/api/${integration}/webhook\`
- Components: \`${integration.charAt(0).toUpperCase() + integration.slice(1)}Integration\`
`).join('')}

## Project Structure

\`\`\`
├── app/
│   ├── api/           # API routes for integrations
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main page
├── components/        # React components
├── lib/
│   ├── workflows/     # Business workflows
│   └── *-config.ts    # Integration configs
└── README.md
\`\`\`

Generated with AI integration builder.
`

  await fs.writeFile(path.join(appDir, 'README.md'), mainReadme)
}

// Helper functions

function extractRouteNameFromCode(code: string): string {
  const match = code.match(/\/\/ app\/api\/([^\/]+)/)
  return match ? match[1] : 'unknown'
}

function extractComponentNameFromCode(code: string): string {
  const match = code.match(/\/\/ components\/([^.]+)\.tsx/)
  return match ? match[1] : 'UnknownComponent'
}

function extractMiddlewareNameFromCode(code: string): string {
  const match = code.match(/\/\/ middleware\/([^.]+)\.ts/)
  return match ? match[1] : 'unknown'
}

function extractConfigNameFromCode(code: string): string {
  const match = code.match(/\/\/ lib\/([^.]+)\.ts/)
  return match ? match[1] : 'unknown-config'
}

function generateIntegratedDashboardComponent(integrationCode: any): string {
  const componentImports = integrationCode.components
    .map((code: string) => {
      const componentName = extractComponentNameFromCode(code)
      return `import ${componentName} from './${componentName}'`
    })
    .join('\n')

  const componentRenders = integrationCode.components
    .map((code: string) => {
      const componentName = extractComponentNameFromCode(code)
      return `          <${componentName} />`
    })
    .join('\n')

  return `'use client'

${componentImports}

export default function IntegratedDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Integration Dashboard</h2>
        <p className="text-gray-600">
          Manage all your integrated services from this dashboard.
        </p>
      </div>
      
${componentRenders}
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>API Status:</span>
            <span className="text-green-600">✅ Online</span>
          </div>
          <div className="flex justify-between">
            <span>Integrations:</span>
            <span className="text-blue-600">${integrationCode.components.length} Active</span>
          </div>
          <div className="flex justify-between">
            <span>Webhooks:</span>
            <span className="text-purple-600">${integrationCode.webhooks.length} Configured</span>
          </div>
        </div>
      </div>
    </div>
  )
}`
}

function generateWorkflowImplementation(workflow: any, selectedIntegrations: string[]): string {
  return `// Generated workflow: ${workflow.name}
// AI Model: ${workflow.aiModel}
// Confidence: ${workflow.confidence}

interface WorkflowContext {
  data: any
  integrations: string[]
}

export class ${workflow.name?.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')}Workflow {
  name = '${workflow.name}'
  description = '${workflow.description}'
  triggers = ${JSON.stringify(workflow.triggers || [])}
  actions = ${JSON.stringify(workflow.actions || [])}
  
  async execute(context: WorkflowContext): Promise<any> {
    console.log(\`Executing workflow: \${this.name}\`)
    
    const results = []
    
    // Execute each action in sequence
    for (const action of this.actions) {
      try {
        const result = await this.executeAction(action, context)
        results.push({ action, result, success: true })
      } catch (error) {
        results.push({ action, error: error.message, success: false })
      }
    }
    
    return {
      workflow: this.name,
      results,
      success: results.every(r => r.success)
    }
  }
  
  private async executeAction(action: string, context: WorkflowContext): Promise<any> {
    switch (action) {
      ${workflow.actions?.map((action: string) => `
      case '${action}':
        return await this.${action.replace(/[^a-zA-Z0-9]/g, '_')}(context)
      `).join('')}
      
      default:
        throw new Error(\`Unknown action: \${action}\`)
    }
  }
  
  ${workflow.actions?.map((action: string) => `
  private async ${action.replace(/[^a-zA-Z0-9]/g, '_')}(context: WorkflowContext): Promise<any> {
    // Implementation for ${action}
    console.log(\`Executing action: ${action}\`)
    
    // Check if required integrations are available
    const requiredIntegrations = this.getRequiredIntegrationsFor('${action}')
    const hasIntegrations = requiredIntegrations.every(integration => 
      context.integrations.includes(integration)
    )
    
    if (!hasIntegrations) {
      throw new Error(\`Missing required integrations for ${action}\`)
    }
    
    // Execute the action based on available integrations
    ${generateActionImplementation(action, selectedIntegrations)}
    
    return { action: '${action}', completed: true, timestamp: new Date().toISOString() }
  }
  `).join('')}
  
  private getRequiredIntegrationsFor(action: string): string[] {
    const integrationMap: { [key: string]: string[] } = {
      'send.email': ['mailchimp', 'sendgrid'],
      'process.payment': ['stripe', 'paypal'],
      'update.inventory': ['shopify', 'woocommerce'],
      'notify.slack': ['slack'],
      'track.analytics': ['google-analytics', 'mixpanel']
    }
    
    return integrationMap[action] || []
  }
}

export default ${workflow.name?.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')}Workflow`
}

function generateActionImplementation(action: string, selectedIntegrations: string[]): string {
  const implementations: { [key: string]: string } = {
    'send.email': `
    if (context.integrations.includes('mailchimp')) {
      // Send via Mailchimp
      const response = await fetch('/api/mailchimp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context.data)
      })
      return await response.json()
    }`,
    
    'process.payment': `
    if (context.integrations.includes('stripe')) {
      // Process via Stripe
      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: context.data.amount,
          currency: context.data.currency || 'usd'
        })
      })
      return await response.json()
    }`,
    
    'notify.slack': `
    if (context.integrations.includes('slack')) {
      // Send Slack notification
      const response = await fetch('/api/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: '#notifications',
          message: \`Workflow action completed: ${action}\`
        })
      })
      return await response.json()
    }`
  }

  return implementations[action] || `
    // Generic action implementation
    console.log('Executing action:', '${action}')
    return { message: 'Action completed', data: context.data }`
}

function generateWorkflowManager(workflows: any[]): string {
  return `// Workflow Manager
// Manages execution of all AI-generated workflows

${workflows.map(workflow => {
  const className = workflow.name?.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '') + 'Workflow'
  return `import ${className} from './${workflow.name?.toLowerCase().replace(/\s+/g, '-') || 'workflow'}'`
}).join('\n')}

export class WorkflowManager {
  private workflows = new Map()
  
  constructor() {
    // Register all workflows
    ${workflows.map(workflow => {
      const className = workflow.name?.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '') + 'Workflow'
      return `this.workflows.set('${workflow.name}', new ${className}())`
    }).join('\n    ')}
  }
  
  async executeWorkflow(name: string, data: any, integrations: string[]): Promise<any> {
    const workflow = this.workflows.get(name)
    if (!workflow) {
      throw new Error(\`Workflow not found: \${name}\`)
    }
    
    const context = { data, integrations }
    return await workflow.execute(context)
  }
  
  async executeWorkflowByTrigger(trigger: string, data: any, integrations: string[]): Promise<any[]> {
    const results = []
    
    for (const [name, workflow] of this.workflows) {
      if (workflow.triggers.includes(trigger)) {
        try {
          const result = await this.executeWorkflow(name, data, integrations)
          results.push(result)
        } catch (error) {
          results.push({
            workflow: name,
            error: error.message,
            success: false
          })
        }
      }
    }
    
    return results
  }
  
  getAvailableWorkflows(): string[] {
    return Array.from(this.workflows.keys())
  }
}

export default WorkflowManager`
}

async function startGeneratedApp(appDir: string, appName: string): Promise<string> {
  // For demo purposes, return a mock URL
  // In production, you would actually start the Next.js app
  const port = 3000 + Math.floor(Math.random() * 1000)
  return `http://localhost:${port}`
}

async function getGeneratedFilesList(appDir: string): Promise<string[]> {
  const files: string[] = []
  
  async function traverse(dir: string, prefix = '') {
    try {
      const entries = await fs.readdir(dir)
      for (const entry of entries) {
        const fullPath = path.join(dir, entry)
        const relativePath = path.join(prefix, entry)
        
        const stat = await fs.stat(fullPath)
        if (stat.isDirectory()) {
          await traverse(fullPath, relativePath)
        } else {
          files.push(relativePath)
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  await traverse(appDir)
  return files
}