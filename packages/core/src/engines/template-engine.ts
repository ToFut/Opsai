import { Logger } from '../utils/logger'

export class TemplateEngine {
  private logger: Logger
  private templates: Map<string, string>

  constructor() {
    this.logger = new Logger('TemplateEngine')
    this.templates = new Map()
    this.loadDefaultTemplates()
  }

  /**
   * Render a template with data
   */
  render(templateName: string, data: Record<string, any>): string {
    const template = this.templates.get(templateName)
    if (!template) {
      this.logger.error(`Template not found: ${templateName}`)
      throw new Error(`Template not found: ${templateName}`)
    }

    try {
      return this.interpolate(template, data)
    } catch (error) {
      this.logger.error(`Template rendering failed: ${templateName}`, error)
      throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Register a custom template
   */
  registerTemplate(name: string, template: string): void {
    this.templates.set(name, template)
    this.logger.info(`Registered template: ${name}`)
  }

  /**
   * Interpolate template with data
   */
  private interpolate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key.trim())
      return value !== undefined ? String(value) : match
    })
  }

  /**
   * Get nested object value by path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    // App Layout Template
    this.templates.set('app-layout', `import './globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '{{businessName}} - Management Dashboard',
  description: '{{description}}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}`)

    // Main Page Template
    this.templates.set('main-page', `import { Suspense } from 'react'
import StatsOverview from '@/components/StatsOverview'
import RecentActivity from '@/components/RecentActivity'
import DataTable from '@/components/DataTable'

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{{businessName}} Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your {{businessName}} management system</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsOverview />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataTable />
          <RecentActivity />
        </div>
      </Suspense>
    </div>
  )
}`)

    // Prisma Schema Template
    this.templates.set('prisma-schema', `// This is your Prisma schema file
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Tenant {
  id String @id @default(cuid())
  name String
  slug String @unique
  status String @default("active")
  settings Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  users User[]
{{#models}}
  {{name}}s {{name}}[]
{{/models}}
}

model User {
  id String @id @default(cuid()) 
  email String @unique
  firstName String
  lastName String
  role String @default("user")
  status String @default("active")
  tenantId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastLoginAt DateTime?
  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
}

{{#models}}
model {{name}} {
  id String @unique @id @default(cuid())
  tenantId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
{{#fields}}
  {{name}} {{type}}{{#unique}} @unique{{/unique}}
{{/fields}}
  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
}

{{/models}}`)

    // API Route Template
    this.templates.set('api-route', `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }
    
    const {{modelName}}s = await prisma.{{modelName}}.findMany({
      where: { tenantId },
      include: {
        tenant: {
          select: { name: true, slug: true }
        }
      }
    })
    return NextResponse.json({{modelName}}s)
  } catch (error) {
    console.error('Error fetching {{modelName}}s:', error)
    return NextResponse.json({ error: 'Failed to fetch {{modelName}}s' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }
    
    const data = await request.json()
    
    const {{modelName}} = await prisma.{{modelName}}.create({
      data: {
        ...data,
        tenantId
      },
      include: {
        tenant: {
          select: { name: true, slug: true }
        }
      }
    })
    return NextResponse.json({{modelName}})
  } catch (error) {
    console.error('Error creating {{modelName}}:', error)
    return NextResponse.json({ error: 'Failed to create {{modelName}}' }, { status: 500 })
  }
}`)

    // Data Table Template
    this.templates.set('data-table', `'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function DataTable() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch data from API
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Data Management
        </h3>
        <div className="mt-5">
          <p className="text-gray-500">Data table will be implemented here</p>
        </div>
      </div>
    </div>
  )
}`)

    // Login Page Template
    this.templates.set('login-page', `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Login logic here
      router.push('/')
    } catch (err) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-6">Login to {{appName}}</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}`)

    // Auth Middleware Template
    this.templates.set('auth-middleware', `import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register', '/api/auth']
  
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check for auth token
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // Add user info to headers for API routes
  const response = NextResponse.next()
  response.headers.set('x-user-id', 'user-id')
  response.headers.set('x-tenant-id', 'tenant-id')
  
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}`)

    // TypeScript Config Template
    this.templates.set('tsconfig', `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`)

    // Tailwind Config Template
    this.templates.set('tailwind-config', `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}`)

    // Environment Example Template
    this.templates.set('env-example', `# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db"

# Authentication
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
JWT_SECRET="your-jwt-secret-key"

# App Configuration
NEXT_PUBLIC_APP_NAME="{{appName}}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"`)

    // README Template
    this.templates.set('readme', `# {{appName}}

This is a generated Next.js application powered by OPSAI.

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

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- Complete dashboard with analytics
- CRUD operations for all data models
- API endpoints for integrations
- Responsive design with Tailwind CSS
- Database integration with Prisma

## Generated Models

{{#models}}
- {{name}}
{{/models}}

## API Endpoints

{{#models}}
- \`/api/{{name}}s\` - CRUD operations for {{name}}
{{/models}}

Generated by OPSAI on {{generatedDate}}`)

    this.logger.info('Default templates loaded')
  }
} 