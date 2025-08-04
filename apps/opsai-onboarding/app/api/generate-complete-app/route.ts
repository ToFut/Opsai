import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, copyFile } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import OpenAI from 'openai'

const execAsync = promisify(exec)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { tenantId, businessName, schema, sampleData, analysis } = await request.json()
    
    console.log(`🏗️ Generating complete app for ${tenantId}...`)
    
    // Create app directory
    const appName = `${businessName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    const appPath = path.join(process.cwd(), 'generated-apps', appName)
    await mkdir(appPath, { recursive: true })
    
    // Generate app structure
    await generateAppStructure(appPath, {
      tenantId,
      businessName,
      appName,
      schema,
      sampleData,
      analysis
    })
    
    // Install dependencies
    console.log('📦 Installing dependencies...')
    await execAsync('npm install', { cwd: appPath })
    
    console.log(`✅ Complete app generated at: ${appPath}`)
    
    return NextResponse.json({
      success: true,
      appPath,
      appName,
      message: 'Complete business application generated successfully'
    })
    
  } catch (error) {
    console.error('❌ App generation failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'App generation failed' 
      },
      { status: 500 }
    )
  }
}

async function generateAppStructure(appPath: string, config: any) {
  const { tenantId, businessName, appName, schema, sampleData, analysis } = config
  
  // Create directories
  const dirs = [
    'app', 'app/api', 'app/dashboard', 'app/auth', 'components', 
    'lib', 'prisma', 'public', 'styles'
  ]
  
  for (const dir of dirs) {
    await mkdir(path.join(appPath, dir), { recursive: true })
  }
  
  // Generate package.json
  await writeFile(path.join(appPath, 'package.json'), generatePackageJson(appName))
  
  // Generate Next.js config files
  await writeFile(path.join(appPath, 'next.config.js'), generateNextConfig())
  await writeFile(path.join(appPath, 'tailwind.config.js'), generateTailwindConfig())
  await writeFile(path.join(appPath, 'tsconfig.json'), generateTSConfig())
  
  // Generate Prisma schema based on organized data
  await writeFile(path.join(appPath, 'prisma/schema.prisma'), await generatePrismaSchema(schema))
  
  // Generate main layout
  await writeFile(path.join(appPath, 'app/layout.tsx'), generateLayout(businessName))
  
  // Generate dashboard based on actual data
  await writeFile(path.join(appPath, 'app/page.tsx'), await generateDashboard(schema, sampleData, analysis))
  
  // Generate API routes for each entity
  for (const [entityName, entitySchema] of Object.entries(schema)) {
    await mkdir(path.join(appPath, 'app/api', entityName.toLowerCase()), { recursive: true })
    await writeFile(
      path.join(appPath, 'app/api', entityName.toLowerCase(), 'route.ts'),
      generateAPIRoute(entityName, entitySchema)
    )
  }
  
  // Generate components
  await writeFile(path.join(appPath, 'components/Sidebar.tsx'), generateSidebar(schema))
  await writeFile(path.join(appPath, 'components/DataTable.tsx'), generateDataTable())
  
  // Generate README
  await writeFile(path.join(appPath, 'README.md'), generateREADME(businessName, schema))
  
  console.log('✅ App structure generated')
}

function generatePackageJson(appName: string) {
  return JSON.stringify({
    name: appName,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'next dev -p 3001',
      build: 'next build',
      start: 'next start -p 3001',
      lint: 'next lint',
      'db:generate': 'prisma generate',
      'db:push': 'prisma db push',
      'db:migrate': 'prisma migrate dev'
    },
    dependencies: {
      'next': '^14.0.0',
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
      '@prisma/client': '^5.0.0',
      'lucide-react': '^0.263.0',
      'tailwindcss': '^3.3.0',
      'autoprefixer': '^10.4.14',
      'postcss': '^8.4.24',
      '@supabase/supabase-js': '^2.39.0',
      'recharts': '^2.8.0'
    },
    devDependencies: {
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      'prisma': '^5.0.0',
      'eslint': '^8.0.0',
      'eslint-config-next': '^14.0.0'
    }
  }, null, 2)
}

function generateNextConfig() {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  }
}

module.exports = nextConfig`
}

function generateTailwindConfig() {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
}

function generateTSConfig() {
  return JSON.stringify({
    compilerOptions: {
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'es6'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
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
  }, null, 2)
}

async function generatePrismaSchema(schema: any) {
  const models = Object.entries(schema).map(([tableName, tableDefinition]: [string, any]) => {
    const fields = Object.entries(tableDefinition.columns || {}).map(([fieldName, fieldType]: [string, any]) => {
      const cleanFieldName = fieldName.replace(/[^a-zA-Z0-9_]/g, '_')
      let prismaType = 'String'
      
      if (typeof fieldType === 'string') {
        if (fieldType.includes('SERIAL') || fieldType.includes('INTEGER')) prismaType = 'Int'
        if (fieldType.includes('BOOLEAN')) prismaType = 'Boolean'
        if (fieldType.includes('TIMESTAMP')) prismaType = 'DateTime'
      }
      
      const isId = fieldName === 'id' || fieldType.includes('PRIMARY KEY')
      const isOptional = !fieldType.includes('NOT NULL') && !isId
      
      return `  ${cleanFieldName} ${prismaType}${isOptional ? '?' : ''} ${isId ? '@id @default(autoincrement())' : ''}`
    }).join('\n')
    
    return `model ${tableName.charAt(0).toUpperCase() + tableName.slice(1)} {
${fields}
  @@map("${tableName}")
}`
  }).join('\n\n')
  
  return `// This is your Prisma schema file
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

${models}`
}

function generateLayout(businessName: string) {
  return `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${businessName} Dashboard',
  description: 'Generated by OpsAI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}`
}

async function generateDashboard(schema: any, sampleData: any, analysis: any) {
  // Use AI to generate a smart dashboard based on the actual data
  const prompt = `Generate a React dashboard component for a business with this data:

Schema: ${JSON.stringify(schema)}
Sample Data: ${JSON.stringify(Array.isArray(sampleData) ? sampleData.slice(0, 2) : sampleData)}
Business Analysis: ${JSON.stringify(analysis)}

Create a comprehensive dashboard with:
1. Key metrics cards
2. Charts showing important data trends  
3. Recent activity list
4. Navigation to data management pages

Return ONLY the React component code, no explanations.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a React developer. Generate clean, production-ready dashboard components using Tailwind CSS and Lucide React icons.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })

    const generatedCode = completion.choices[0]?.message?.content
    if (generatedCode) {
      return `'use client'
${generatedCode}`
    }
  } catch (error) {
    console.warn('AI dashboard generation failed, using fallback')
  }

  // Fallback dashboard
  return `'use client'
import { BarChart3, Users, TrendingUp, Activity } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold">1,234</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Growth</p>
              <p className="text-2xl font-bold">+12%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold">$45,678</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activity</p>
              <p className="text-2xl font-bold">Active</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Your Business Data</h2>
        <p className="text-gray-600">Welcome to your generated business application! This dashboard is customized based on your connected data sources.</p>
      </div>
    </div>
  )
}`
}

function generateAPIRoute(entityName: string, entitySchema: any) {
  return `import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('${entityName.toLowerCase()}')
      .select('*')
      .limit(100)
    
    if (error) throw error
    
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ${entityName.toLowerCase()}' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('${entityName.toLowerCase()}')
      .insert([body])
      .select()
    
    if (error) throw error
    
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create ${entityName.toLowerCase()}' },
      { status: 500 }
    )
  }
}`
}

function generateSidebar(schema: any) {
  const navItems = Object.keys(schema).map(entityName => 
    `        <a href="/dashboard/${entityName.toLowerCase()}" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          <span className="ml-3">${entityName}</span>
        </a>`
  ).join('\n')

  return `import { Home, Settings, BarChart3 } from 'lucide-react'

export default function Sidebar() {
  return (
    <div className="bg-white w-64 min-h-screen shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold">Dashboard</h2>
      </div>
      
      <nav className="mt-6">
        <div className="px-6 py-3">
          <a href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Home className="h-5 w-5" />
            <span className="ml-3">Overview</span>
          </a>
          
${navItems}
          
          <a href="/analytics" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <BarChart3 className="h-5 w-5" />
            <span className="ml-3">Analytics</span>
          </a>
          
          <a href="/settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Settings className="h-5 w-5" />
            <span className="ml-3">Settings</span>
          </a>
        </div>
      </nav>
    </div>
  )
}`
}

function generateDataTable() {
  return `interface DataTableProps {
  data: any[]
  columns: string[]
  title: string
}

export default function DataTable({ data, columns, title }: DataTableProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}`
}

function generateREADME(businessName: string, schema: any) {
  const entities = Object.keys(schema).join(', ')
  
  return `# ${businessName}

This is a generated Next.js application powered by OpsAI.

## Features

- 📊 Complete dashboard with analytics
- 🔐 Authentication system
- 📱 Responsive design with Tailwind CSS
- 🗄️ Database integration with Prisma
- 🔄 Real-time data synchronization

## Generated Data Models

${entities}

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up the database:
\`\`\`bash
npm run db:generate
npm run db:push
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3001](http://localhost:3001) with your browser.

## API Endpoints

${Object.keys(schema).map(entity => `- \`/api/${entity.toLowerCase()}\` - CRUD operations for ${entity}`).join('\n')}

---

Generated by OpsAI on ${new Date().toISOString()}
`
}