import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'
import { npmInstall, runTypeCheck, runLint } from '@/lib/safe-exec'
import { requireAuth, validateBody, rateLimit, AuthRequest } from '@/lib/auth-middleware'
import { apiLogger } from '@/lib/logger'
import { auditLogger, AuditEventType, createAuditLog } from '@/lib/audit-logger'

// Helper function to safely write files by ensuring directories exist
async function safeWriteFile(filePath: string, content: string) {
  try {
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(filePath, content)
    apiLogger.debug(`Created file: ${path.basename(filePath)}`)
  } catch (error) {
    apiLogger.error(`Failed to write file ${filePath}:`, error)
    throw new Error(`Could not write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Mock Supabase admin client for project creation (simplified for demo)
// In production, this would use the Supabase Management API

interface GenerationRequest {
  tenantId: string
  analysisId: string
  appName: string
  businessProfile: any
  dataArchitecture: any
  integrations: Array<{
    provider: string
    credentialId: string
    config: any
  }>
  deploymentConfig: {
    platform: 'vercel' | 'netlify' | 'aws'
    customDomain?: string
    environment: 'production' | 'staging' | 'development'
  }
}

export async function POST(request: NextRequest) {
  // Check for demo mode
  const isDemoMode = request.headers.get('X-Demo-Mode') === 'true'
  
  if (isDemoMode) {
    // Handle demo mode without authentication
    try {
      const body: GenerationRequest = await request.json()
      
      // Validate minimal required fields for demo
      if (!body.tenantId || !body.appName) {
        return NextResponse.json(
          { error: 'Missing required fields: tenantId, appName' },
          { status: 400 }
        )
      }
      
      apiLogger.info(`Demo mode: generating production app for ${body.appName}`)
      
      // Continue with app generation logic (skip auth, rate limiting, and audit logging)
      return await generateAppLogic(body, { isDemoMode: true })
      
    } catch (error) {
      apiLogger.error('Demo app generation error:', error)
      return NextResponse.json(
        { error: 'Generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }
  
  // Standard authenticated flow
  return requireAuth(request, async (authRequest: AuthRequest) => {
    try {
      const body: GenerationRequest = await request.json()
      
      // Validate request body
      const validation = validateBody<GenerationRequest>(body, [
        'tenantId', 'analysisId', 'appName', 'businessProfile', 
        'dataArchitecture', 'deploymentConfig'
      ])
      
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid request', details: validation.errors },
          { status: 400 }
        )
      }
      
      // Rate limiting
      if (!rateLimit(authRequest.user!.id, 5, 3600000)) { // 5 requests per hour
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      
      apiLogger.info(`User ${authRequest.user!.email} starting production app generation for ${body.appName}`)
      
      // SOC 2 Audit Log
      const audit = createAuditLog(request, authRequest.user!.id, authRequest.user!.email)
      await audit.logSuccess('APP_GENERATION_STARTED', body.appName, {
        tenantId: body.tenantId,
        businessProfile: body.businessProfile.businessType,
        platform: body.deploymentConfig.platform
      })
      
      return await generateAppLogic(body, { isDemoMode: false, user: authRequest.user })
      
    } catch (error) {
      apiLogger.error('App generation error:', error)
      return NextResponse.json(
        { error: 'Generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  })
}

// Shared app generation logic
async function generateAppLogic(body: GenerationRequest, context: { isDemoMode: boolean; user?: any }) {
      // Stage 1: Provision Supabase project
      const supabaseProject = await provisionSupabaseProject(body)
      
      // Stage 2: Generate application code
    const appPath = await generateApplicationCode(body, supabaseProject)
    
    // Stage 3: Setup database schema
    await setupDatabaseSchema(supabaseProject, body.dataArchitecture)
    
    // Stage 4: Configure integrations
    await configureIntegrations(appPath, body.integrations)
    
    // Stage 5: Setup authentication
    await setupAuthentication(appPath, supabaseProject)
    
    // Stage 6: Generate API endpoints
    await generateAPIEndpoints(appPath, body.dataArchitecture, body.integrations)
    
    // Stage 7: Create admin dashboard
    await createAdminDashboard(appPath, body.businessProfile)
    
    // Stage 8: Setup monitoring
    const monitoring = await setupMonitoring(appPath, body.appName)
    
    // Stage 9: Create documentation
    await generateDocumentation(appPath, body)
    
    // Stage 10: Run tests
    const testResults = await runTests(appPath)
    
    // Create app record - simplified for demo (normally would save to database)
    const app = {
      id: `app_${Date.now()}`,
      tenantId: body.tenantId,
      analysisId: body.analysisId,
      name: body.appName,
      path: appPath,
      status: 'ready',
      supabaseProjectId: supabaseProject.id,
      supabaseUrl: supabaseProject.url,
      supabaseAnonKey: supabaseProject.anonKey,
      metadata: {
        businessProfile: body.businessProfile,
        dataArchitecture: body.dataArchitecture,
        integrations: body.integrations.map(i => ({ provider: i.provider })),
        monitoring,
        testResults
      }
    }
    
    apiLogger.info('Production app generation complete!')
    
    // Stage 11: Start local development server
    const port = Math.floor(Math.random() * (8100 - 7800 + 1)) + 7800
    console.log(`🚀 Auto-starting ${body.appName} on port ${port}...`)
    
    try {
      // Start the development server in the background
      await startLocalServer(appPath, port)
      console.log(`✅ App generation completed`)
      console.log(`🚀 Auto-starting ${body.appName} on port ${port}...`)
      console.log(`📦 Installing dependencies...`)
      
      return NextResponse.json({
        success: true,
        appId: app.id,
        appPath,
        port,
        appUrl: `http://localhost:${port}`,
        adminUrl: `http://localhost:${port}/admin`,
        localDeployment: true,
        supabase: {
          url: supabaseProject.url,
          anonKey: supabaseProject.anonKey,
          projectId: supabaseProject.id
        },
        monitoring,
        testResults,
        defaultCredentials: {
          adminEmail: 'admin@example.com',
          adminPassword: 'admin123'
        },
        nextSteps: [
          'Open admin panel to test functionality',
          'Configure real integrations',
          'Deploy to production when ready',
          'Setup custom domain',
          'Enable monitoring alerts'
        ]
      })
    } catch (error) {
      console.error('Failed to start local server:', error)
      
      return NextResponse.json({
        success: true,
        appId: app.id,
        appPath,
        port,
        appUrl: `http://localhost:${port}`,
        adminUrl: `http://localhost:${port}/admin`,
        localDeployment: false,
        error: 'App generated but failed to auto-start. You can start it manually with: npm run dev',
        supabase: {
          url: supabaseProject.url,
          anonKey: supabaseProject.anonKey,
          projectId: supabaseProject.id
        },
        monitoring,
        testResults,
        nextSteps: [
          'Navigate to app directory and run: npm install && npm run dev',
          'Open admin panel to test functionality',
          'Configure real integrations',
          'Deploy to production when ready'
        ]
      })
    }
}

// Provision a new Supabase project
async function provisionSupabaseProject(config: GenerationRequest) {
  console.log('🏗️ Provisioning Supabase project...')
  
  // Check if we have Supabase Management API configured
  const { supabaseManagement } = await import('@/lib/supabase-management')
  
  if (!supabaseManagement) {
    console.warn('⚠️ Supabase Management API not configured, using mock project')
    // Fallback to mock for development
    const projectId = `proj_${config.tenantId}_${Date.now()}`
    const project = {
      id: projectId,
      name: config.appName,
      url: `https://${projectId}.supabase.co`,
      anonKey: `eyJ${Buffer.from(JSON.stringify({ role: 'anon', iss: 'supabase' })).toString('base64')}`,
      serviceKey: `eyJ${Buffer.from(JSON.stringify({ role: 'service_role', iss: 'supabase' })).toString('base64')}`,
      databaseUrl: `postgresql://postgres:password@db.${projectId}.supabase.co:5432/postgres`
    }
    return project
  }
  
  try {
    // Create real Supabase project
    const organizationId = process.env.SUPABASE_ORGANIZATION_ID
    if (!organizationId) {
      throw new Error('SUPABASE_ORGANIZATION_ID not configured')
    }
    
    const project = await supabaseManagement.createProject({
      name: config.appName,
      organizationId,
      region: 'us-east-1',
      plan: 'free',
      databasePassword: generateSecurePassword()
    })
    
    console.log(`✅ Real Supabase project created: ${project.id}`)
    console.log(`🔗 Project URL: ${project.url}`)
    
    // Run initial schema migrations
    const schema = await fs.readFile(
      path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql'),
      'utf-8'
    )
    
    await supabaseManagement.runMigrations(project.id, schema)
    console.log('✅ Database schema applied')
    
    return project
  } catch (error) {
    console.error('Failed to create Supabase project:', error)
    throw new Error(`Supabase project creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Generate complete application code
async function generateApplicationCode(config: GenerationRequest, supabaseProject: any) {
  console.log('💻 Generating application code...')
  
  const sanitizedAppName = config.appName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const appPath = path.join(process.cwd(), 'generated-apps', `${sanitizedAppName}-${Date.now()}`)
  
  try {
    await fs.mkdir(appPath, { recursive: true })
    console.log(`📁 Created app directory: ${appPath}`)
  } catch (error) {
    console.error('Failed to create app directory:', error)
    throw new Error(`Could not create app directory: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  // Create Next.js project structure
  const structure = [
    'app',
    'app/api',
    'app/api/auth',
    'app/api/data',
    'app/(dashboard)',
    'app/(dashboard)/admin',
    'app/(dashboard)/users',
    'app/(dashboard)/analytics',
    'app/(auth)',
    'app/(auth)/login',
    'app/(auth)/register',
    'app/auth',
    'app/auth/login',
    'app/auth/register',
    'components',
    'components/ui',
    'components/dashboard',
    'components/auth',
    'lib',
    'lib/supabase',
    'lib/integrations',
    'lib/utils',
    'hooks',
    'types',
    'public',
    'public/icons',
    'styles',
    'prisma'
  ]
  
  for (const dir of structure) {
    try {
      await fs.mkdir(path.join(appPath, dir), { recursive: true })
      console.log(`📁 Created directory: ${dir}`)
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error)
      throw new Error(`Could not create directory ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  // Generate package.json
  await safeWriteFile(
    path.join(appPath, 'package.json'),
    JSON.stringify({
      name: config.appName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        test: 'jest',
        'test:e2e': 'playwright test',
        'db:push': 'prisma db push',
        'db:studio': 'prisma studio'
      },
      dependencies: {
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        '@supabase/supabase-js': '^2.39.0',
        '@supabase/auth-helpers-nextjs': '^0.8.0',
        '@prisma/client': '^5.0.0',
        'lucide-react': '^0.300.0',
        'recharts': '^2.10.0',
        'date-fns': '^3.0.0',
        'zod': '^3.22.0',
        'react-hook-form': '^7.48.0',
        '@hookform/resolvers': '^3.3.0',
        'sonner': '^1.2.0',
        'next-themes': '^0.2.1',
        '@radix-ui/react-dialog': '^1.0.0',
        '@radix-ui/react-dropdown-menu': '^2.0.0',
        '@radix-ui/react-tabs': '^1.0.0',
        'class-variance-authority': '^0.7.0',
        'clsx': '^2.0.0',
        'tailwind-merge': '^2.0.0',
        'tailwindcss-animate': '^1.0.0'
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        'typescript': '^5.0.0',
        'tailwindcss': '^3.3.0',
        'postcss': '^8.4.0',
        'autoprefixer': '^10.4.0',
        'eslint': '^8.0.0',
        'eslint-config-next': '^14.0.0',
        'prisma': '^5.0.0',
        'jest': '^29.0.0',
        '@testing-library/react': '^14.0.0',
        '@testing-library/jest-dom': '^6.0.0',
        '@playwright/test': '^1.40.0'
      }
    }, null, 2)
  )
  
  // Generate TypeScript config
  await fs.writeFile(
    path.join(appPath, 'tsconfig.json'),
    JSON.stringify({
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
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: {
          '@/*': ['./*']
        }
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules']
    }, null, 2)
  )
  
  // Generate .env.local
  await fs.writeFile(
    path.join(appPath, '.env.local'),
    `# Supabase
NEXT_PUBLIC_SUPABASE_URL=${supabaseProject.url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseProject.anonKey}
SUPABASE_SERVICE_KEY=${supabaseProject.serviceKey}

# Database
DATABASE_URL=${supabaseProject.databaseUrl}

# App
NEXT_PUBLIC_APP_NAME="${config.appName}"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Integrations
${config.integrations.map(i => `${i.provider.toUpperCase()}_API_KEY=your_key_here`).join('\n')}
`
  )
  
  // Generate main layout
  await safeWriteFile(
    path.join(appPath, 'app/layout.tsx'),
    `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { SupabaseProvider } from '@/lib/supabase/provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${config.appName}',
  description: 'AI-powered business application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
`
  )
  
  // Generate global styles
  await fs.writeFile(
    path.join(appPath, 'app/globals.css'),
    `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`
  )
  
  return appPath
}

// Setup database schema in Supabase
async function setupDatabaseSchema(supabaseProject: any, dataArchitecture: any) {
  console.log('🗄️ Setting up database schema...')
  
  // In production, this would execute SQL in Supabase
  // For now, we'll generate the SQL file
  
  const sqlStatements: string[] = []
  
  // Enable RLS
  sqlStatements.push('-- Enable Row Level Security')
  sqlStatements.push('ALTER DATABASE postgres SET "app.jwt_secret" TO \'your-jwt-secret\';')
  
  // Create tables from data architecture
  const models = dataArchitecture?.unifiedModels || [
    {
      name: 'Customer',
      fields: [
        { name: 'email', type: 'string', required: true, unique: true },
        { name: 'firstName', type: 'string', required: true },
        { name: 'lastName', type: 'string', required: true }
      ]
    },
    {
      name: 'Product',
      fields: [
        { name: 'name', type: 'string', required: true },
        { name: 'price', type: 'number', required: true },
        { name: 'description', type: 'text', required: false }
      ]
    }
  ]
  
  for (const model of models) {
    const tableName = model.name.toLowerCase() + 's'
    
    sqlStatements.push(`\n-- Create ${model.name} table`)
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS ${tableName} (`)
    sqlStatements.push('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
    sqlStatements.push('  tenant_id VARCHAR(50) NOT NULL,')
    
    for (const field of model.fields) {
      const sqlType = mapToSQLType(field.type)
      const nullable = field.required ? 'NOT NULL' : 'NULL'
      const unique = field.unique ? 'UNIQUE' : ''
      
      sqlStatements.push(`  ${field.name} ${sqlType} ${nullable} ${unique},`)
    }
    
    sqlStatements.push('  created_at TIMESTAMPTZ DEFAULT NOW(),')
    sqlStatements.push('  updated_at TIMESTAMPTZ DEFAULT NOW()')
    sqlStatements.push(');')
    
    // Create RLS policies
    sqlStatements.push(`\n-- Enable RLS for ${tableName}`)
    sqlStatements.push(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`)
    
    // Create policies
    sqlStatements.push(`\n-- Policies for ${tableName}`)
    sqlStatements.push(`CREATE POLICY "Users can view own ${tableName}" ON ${tableName}`)
    sqlStatements.push('  FOR SELECT USING (tenant_id = current_setting(\'app.current_tenant\')::VARCHAR);')
    
    sqlStatements.push(`CREATE POLICY "Users can insert own ${tableName}" ON ${tableName}`)
    sqlStatements.push('  FOR INSERT WITH CHECK (tenant_id = current_setting(\'app.current_tenant\')::VARCHAR);')
    
    sqlStatements.push(`CREATE POLICY "Users can update own ${tableName}" ON ${tableName}`)
    sqlStatements.push('  FOR UPDATE USING (tenant_id = current_setting(\'app.current_tenant\')::VARCHAR);')
    
    sqlStatements.push(`CREATE POLICY "Users can delete own ${tableName}" ON ${tableName}`)
    sqlStatements.push('  FOR DELETE USING (tenant_id = current_setting(\'app.current_tenant\')::VARCHAR);')
    
    // Create indexes
    sqlStatements.push(`\n-- Indexes for ${tableName}`)
    sqlStatements.push(`CREATE INDEX idx_${tableName}_tenant_id ON ${tableName}(tenant_id);`)
    sqlStatements.push(`CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at);`)
  }
  
  // Create relationships
  for (const relationship of dataArchitecture.relationships || []) {
    const fromTable = relationship.from.toLowerCase() + 's'
    const toTable = relationship.to.toLowerCase() + 's'
    
    sqlStatements.push(`\n-- Relationship: ${relationship.from} -> ${relationship.to}`)
    sqlStatements.push(`ALTER TABLE ${fromTable} ADD CONSTRAINT fk_${fromTable}_${toTable}`)
    sqlStatements.push(`  FOREIGN KEY (${relationship.field}) REFERENCES ${toTable}(id);`)
  }
  
  // Create auth schema extensions
  sqlStatements.push('\n-- Auth schema extensions')
  sqlStatements.push('CREATE TABLE IF NOT EXISTS auth.tenants (')
  sqlStatements.push('  id VARCHAR(50) PRIMARY KEY,')
  sqlStatements.push('  name VARCHAR(255) NOT NULL,')
  sqlStatements.push('  plan VARCHAR(50) DEFAULT \'free\',')
  sqlStatements.push('  created_at TIMESTAMPTZ DEFAULT NOW()')
  sqlStatements.push(');')
  
  sqlStatements.push('\nCREATE TABLE IF NOT EXISTS auth.user_tenants (')
  sqlStatements.push('  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,')
  sqlStatements.push('  tenant_id VARCHAR(50) REFERENCES auth.tenants(id) ON DELETE CASCADE,')
  sqlStatements.push('  role VARCHAR(50) DEFAULT \'member\',')
  sqlStatements.push('  created_at TIMESTAMPTZ DEFAULT NOW(),')
  sqlStatements.push('  PRIMARY KEY (user_id, tenant_id)')
  sqlStatements.push(');')
  
  return sqlStatements.join('\n')
}

// Configure integrations in the app
async function configureIntegrations(appPath: string, integrations: any[]) {
  console.log('🔌 Configuring integrations...')
  
  // Create integration clients
  for (const integration of integrations) {
    const clientCode = generateIntegrationClient(integration)
    await fs.writeFile(
      path.join(appPath, 'lib/integrations', `${integration.provider}.ts`),
      clientCode
    )
  }
  
  // Create unified integration service
  await fs.writeFile(
    path.join(appPath, 'lib/integrations/index.ts'),
    `${integrations.map(i => `import { ${i.provider}Client } from './${i.provider}'`).join('\n')}

export class IntegrationService {
  ${integrations.map(i => `${i.provider}: ${i.provider}Client`).join('\n  ')}
  
  constructor() {
    ${integrations.map(i => `this.${i.provider} = new ${i.provider}Client()`).join('\n    ')}
  }
  
  async syncAll() {
    const results = await Promise.allSettled([
      ${integrations.map(i => `this.${i.provider}.sync()`).join(',\n      ')}
    ])
    
    return results.map((result, index) => ({
      provider: '${integrations.map(i => i.provider).join("', '")}'.split(', ')[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  }
}

export const integrations = new IntegrationService()
`
  )
}

// Generate integration client code
function generateIntegrationClient(integration: any): string {
  const providerName = integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)
  
  return `import { createClient } from '@supabase/supabase-js'

export class ${integration.provider}Client {
  private apiKey: string
  private baseUrl: string
  
  constructor() {
    this.apiKey = process.env.${integration.provider.toUpperCase()}_API_KEY || ''
    this.baseUrl = this.getBaseUrl()
  }
  
  private getBaseUrl(): string {
    const urls: Record<string, string> = {
      'shopify': 'https://your-store.myshopify.com/admin/api/2024-01',
      'stripe': 'https://api.stripe.com/v1',
      'quickbooks': 'https://api.quickbooks.com/v3',
      'salesforce': 'https://your-instance.salesforce.com/services/data/v59.0'
    }
    return urls[this.provider] || ''
  }
  
  async sync() {
    try {
      // Fetch data from ${providerName}
      const data = await this.fetchData()
      
      // Transform data
      const transformed = this.transformData(data)
      
      // Save to Supabase
      await this.saveToSupabase(transformed)
      
      return { success: true, count: transformed.length }
    } catch (error) {
      console.error('${providerName} sync error:', error)
      throw error
    }
  }
  
  private async fetchData() {
    // Implement ${providerName}-specific data fetching
    return []
  }
  
  private transformData(data: any[]): any[] {
    // Transform ${providerName} data to unified format
    return data
  }
  
  private async saveToSupabase(data: any[]) {
    // Save transformed data to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    
    // Batch insert with conflict handling
    const { error } = await supabase
      .from('${integration.provider}_data')
      .upsert(data, { onConflict: 'id' })
    
    if (error) throw error
  }
}
`
}

// Setup authentication with Supabase
async function setupAuthentication(appPath: string, supabaseProject: any) {
  console.log('🔐 Setting up authentication...')
  
  // Create Supabase client
  await fs.writeFile(
    path.join(appPath, 'lib/supabase/client.ts'),
    `import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
`
  )
  
  // Create server client
  await fs.writeFile(
    path.join(appPath, 'lib/supabase/server.ts'),
    `import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
      },
    }
  )
}
`
  )
  
  // Create auth provider
  await fs.writeFile(
    path.join(appPath, 'lib/supabase/provider.tsx'),
    `'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from './client'
import type { User, Session } from '@supabase/supabase-js'

type SupabaseContext = {
  user: User | null
  session: Session | null
  loading: boolean
}

const Context = createContext<SupabaseContext>({
  user: null,
  session: null,
  loading: true
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Context.Provider value={{ user, session, loading }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}
`
  )
  
  // Create login page
  await safeWriteFile(
    path.join(appPath, 'app/(auth)/login/page.tsx'),
    `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      toast.success('Welcome back!')
      router.push('/admin')
    } catch (error) {
      toast.error('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
`
  )
}

// Generate API endpoints
async function generateAPIEndpoints(appPath: string, dataArchitecture: any, integrations: any[]) {
  console.log('🚀 Generating API endpoints...')
  
  // Generate CRUD endpoints for each model
  const models = dataArchitecture?.unifiedModels || [
    {
      name: 'Customer',
      fields: [
        { name: 'email', type: 'string', required: true, unique: true },
        { name: 'firstName', type: 'string', required: true },
        { name: 'lastName', type: 'string', required: true }
      ]
    },
    {
      name: 'Product', 
      fields: [
        { name: 'name', type: 'string', required: true },
        { name: 'price', type: 'number', required: true },
        { name: 'description', type: 'text', required: false }
      ]
    }
  ]
  
  for (const model of models) {
    const modelName = model.name.toLowerCase()
    const modelPath = path.join(appPath, 'app/api', modelName)
    await fs.mkdir(modelPath, { recursive: true })
    
    // List/Create endpoint
    await fs.writeFile(
      path.join(modelPath, 'route.ts'),
      generateCRUDEndpoint(model, 'list-create')
    )
    
    // Get/Update/Delete endpoint
    await fs.mkdir(path.join(modelPath, '[id]'), { recursive: true })
    await fs.writeFile(
      path.join(modelPath, '[id]/route.ts'),
      generateCRUDEndpoint(model, 'item')
    )
  }
  
  // Generate sync endpoint
  await fs.mkdir(path.join(appPath, 'app/api/sync'), { recursive: true })
  await fs.writeFile(
    path.join(appPath, 'app/api/sync/route.ts'),
    `import { NextRequest, NextResponse } from 'next/server'
import { integrations } from '@/lib/integrations'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const results = await integrations.syncAll()
    
    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
`
  )
}

// Generate CRUD endpoint code
function generateCRUDEndpoint(model: any, type: 'list-create' | 'item'): string {
  const tableName = model.name.toLowerCase() + 's'
  
  if (type === 'list-create') {
    return `import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ${model.name}Schema = z.object({
  ${model.fields.map((f: any) => `${f.name}: z.${getZodType(f.type)}()${f.required ? '' : '.optional()'}`).join(',\n  ')}
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    
    const { data, error, count } = await supabase
      .from('${tableName}')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({
      data,
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ${tableName}' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const validated = ${model.name}Schema.parse(body)
    
    const { data, error } = await supabase
      .from('${tableName}')
      .insert(validated)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create ${model.name.toLowerCase()}' },
      { status: 500 }
    )
  }
}
`
  } else {
    return `import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateSchema = z.object({
  ${model.fields.map((f: any) => `${f.name}: z.${getZodType(f.type)}().optional()`).join(',\n  ')}
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('${tableName}')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '${model.name} not found' },
          { status: 404 }
        )
      }
      throw error
    }
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ${model.name.toLowerCase()}' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const validated = UpdateSchema.parse(body)
    
    const { data, error } = await supabase
      .from('${tableName}')
      .update(validated)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '${model.name} not found' },
          { status: 404 }
        )
      }
      throw error
    }
    
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update ${model.name.toLowerCase()}' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('${tableName}')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '${model.name} not found' },
          { status: 404 }
        )
      }
      throw error
    }
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete ${model.name.toLowerCase()}' },
      { status: 500 }
    )
  }
}
`
  }
}

// Create admin dashboard
async function createAdminDashboard(appPath: string, businessProfile: any) {
  console.log('📊 Creating admin dashboard...')
  
  // Create dashboard layout
  await fs.writeFile(
    path.join(appPath, 'app/(dashboard)/layout.tsx'),
    `import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
`
  )
  
  // Create dashboard home
  await fs.writeFile(
    path.join(appPath, 'app/(dashboard)/admin/page.tsx'),
    `import { Suspense } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        ${businessProfile.businessName} Dashboard
      </h1>
      
      <Suspense fallback={<div>Loading stats...</div>}>
        <StatsCards />
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Suspense fallback={<div>Loading chart...</div>}>
          <RevenueChart />
        </Suspense>
        
        <Suspense fallback={<div>Loading activity...</div>}>
          <RecentActivity />
        </Suspense>
      </div>
      
      <div className="mt-8">
        <QuickActions />
      </div>
    </div>
  )
}
`
  )
  
  // Create sidebar component
  await fs.mkdir(path.join(appPath, 'components/dashboard'), { recursive: true })
  await fs.writeFile(
    path.join(appPath, 'components/dashboard/sidebar.tsx'),
    `'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Package, BarChart3, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  return (
    <div className="flex flex-col w-64 bg-gray-900">
      <div className="flex h-16 items-center px-4 bg-gray-800">
        <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={\`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md
                \${isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              \`}
            >
              <item.icon
                className={\`
                  mr-3 h-5 w-5 flex-shrink-0
                  \${isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-gray-300'
                  }
                \`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
        <button
          onClick={handleLogout}
          className="flex-shrink-0 w-full group block"
        >
          <div className="flex items-center">
            <LogOut className="inline-block h-5 w-5 text-gray-400 group-hover:text-gray-300" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-300 group-hover:text-white">
                Logout
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
`
  )
}

// Setup monitoring
async function setupMonitoring(appPath: string, appName: string) {
  console.log('📈 Setting up monitoring...')
  
  const monitoring = {
    sentryDsn: `https://example@sentry.io/${appName}`,
    posthogKey: `phc_${Math.random().toString(36).substr(2, 9)}`,
    vercelAnalyticsId: `VA_${Math.random().toString(36).substr(2, 9)}`,
    uptimeUrl: `https://uptime.betterstack.com/${appName}`
  }
  
  // Create monitoring configuration
  await fs.writeFile(
    path.join(appPath, 'lib/monitoring.ts'),
    `import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { Analytics } from '@vercel/analytics/react'

// Initialize Sentry
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  })
}

// Initialize PostHog
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.opt_out_capturing()
    }
  })
}

export { Sentry, posthog, Analytics }
`
  )
  
  return monitoring
}

// Generate documentation
async function generateDocumentation(appPath: string, config: GenerationRequest) {
  console.log('📚 Generating documentation...')
  
  const readme = `# ${config.appName}

AI-powered business application generated by OpsAI.

## Features

- 🔐 **Authentication**: Secure login with Supabase Auth
- 🗄️ **Database**: PostgreSQL with Row Level Security
- 🔌 **Integrations**: Connected to ${config.integrations.map(i => i.provider).join(', ')}
- 📊 **Admin Dashboard**: Real-time analytics and management
- 🚀 **API**: RESTful endpoints with validation
- 📱 **Responsive**: Works on all devices
- 🌙 **Dark Mode**: Built-in theme support

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   - Copy \`.env.local.example\` to \`.env.local\`
   - Fill in your Supabase and integration credentials

3. Push database schema:
   \`\`\`bash
   npm run db:push
   \`\`\`

4. Run development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

This app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Azure Static Web Apps

## API Documentation

### Authentication

- \`POST /api/auth/login\` - User login
- \`POST /api/auth/logout\` - User logout
- \`GET /api/auth/user\` - Get current user

### Resources

${config.dataArchitecture.unifiedModels.map((model: any) => `
#### ${model.name}

- \`GET /api/${model.name.toLowerCase()}\` - List ${model.name}s
- \`POST /api/${model.name.toLowerCase()}\` - Create ${model.name}
- \`GET /api/${model.name.toLowerCase()}/:id\` - Get ${model.name}
- \`PATCH /api/${model.name.toLowerCase()}/:id\` - Update ${model.name}
- \`DELETE /api/${model.name.toLowerCase()}/:id\` - Delete ${model.name}
`).join('\n')}

### Integrations

- \`POST /api/sync\` - Sync all integrations
${config.integrations.map((i: any) => `- \`POST /api/sync/${i.provider}\` - Sync ${i.provider} data`).join('\n')}

## Architecture

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│  Supabase   │────▶│ PostgreSQL  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌─────────────┐     ┌─────────────┐
│Integrations │     │   Airbyte   │
└─────────────┘     └─────────────┘
\`\`\`

## Support

- Documentation: [docs.opsai.dev](https://docs.opsai.dev)
- Discord: [discord.gg/opsai](https://discord.gg/opsai)
- Email: support@opsai.dev

## License

Proprietary - © ${new Date().getFullYear()} OpsAI
`
  
  await fs.writeFile(path.join(appPath, 'README.md'), readme)
  
  // Create API documentation
  const apiDocs = {
    openapi: '3.0.0',
    info: {
      title: `${config.appName} API`,
      version: '1.0.0',
      description: 'Auto-generated API documentation'
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Development' },
      { url: `https://${config.appName.toLowerCase().replace(/\s+/g, '-')}.vercel.app/api`, description: 'Production' }
    ],
    paths: {} as any
  }
  
  // Add paths for each model
  const models = config.dataArchitecture?.unifiedModels || [
    { name: 'Customer', fields: [] },
    { name: 'Product', fields: [] }
  ]
  
  for (const model of models) {
    const basePath = `/${model.name.toLowerCase()}`
    
    apiDocs.paths[basePath] = {
      get: {
        summary: `List ${model.name}s`,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: `#/components/schemas/${model.name}` } },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: `Create ${model.name}`,
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${model.name}Input` }
            }
          }
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${model.name}` }
              }
            }
          }
        }
      }
    }
  }
  
  await fs.writeFile(
    path.join(appPath, 'api-docs.json'),
    JSON.stringify(apiDocs, null, 2)
  )
}

// Run tests
async function runTests(appPath: string) {
  console.log('🧪 Running tests...')
  
  try {
    // Install dependencies safely
    await npmInstall(appPath)
    
    // Run type checking safely
    await runTypeCheck(appPath)
    
    // Run linting safely
    await runLint(appPath)
    
    return {
      passed: true,
      typeCheck: 'passed',
      linting: 'passed',
      unitTests: 'skipped',
      e2eTests: 'skipped'
    }
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : 'Test failed'
    }
  }
}

// Helper functions
function mapToSQLType(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'VARCHAR(255)',
    'text': 'TEXT',
    'number': 'NUMERIC',
    'integer': 'INTEGER',
    'boolean': 'BOOLEAN',
    'date': 'DATE',
    'datetime': 'TIMESTAMPTZ',
    'json': 'JSONB',
    'uuid': 'UUID'
  }
  return typeMap[type.toLowerCase()] || 'VARCHAR(255)'
}

function getZodType(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'text': 'string',
    'number': 'number',
    'integer': 'number',
    'boolean': 'boolean',
    'date': 'string',
    'datetime': 'string',
    'json': 'any',
    'uuid': 'string'
  }
  return typeMap[type.toLowerCase()] || 'string'
}

// Start local development server
async function startLocalServer(appPath: string, port: number) {
  const { spawn } = require('child_process')
  const fs = require('fs')
  const path = require('path')
  
  console.log('📦 Installing dependencies...')
  
  // Create a simple start script to make the app easier to run
  const startScript = `#!/bin/bash
echo "🚀 Starting ${path.basename(appPath)} on port ${port}..."
cd "${appPath}"
npm install --silent
npm run dev -- --port ${port}
`
  
  const scriptPath = path.join(appPath, 'start-local.sh')
  await fs.promises.writeFile(scriptPath, startScript)
  await fs.promises.chmod(scriptPath, '755')
  
  // Install dependencies first (but don't wait too long)
  return new Promise((resolve, reject) => {
    const install = spawn('npm', ['install', '--silent'], {
      cwd: appPath,
      stdio: 'pipe'
    })
    
    let installTimeout = setTimeout(() => {
      install.kill()
      console.log('⚠️ Install taking too long, starting anyway...')
      startServer()
    }, 30000) // 30 second timeout
    
    install.on('close', (code) => {
      clearTimeout(installTimeout)
      if (code === 0) {
        console.log('✅ Dependencies installed')
      } else {
        console.log('⚠️ Install had issues, but continuing...')
      }
      startServer()
    })
    
    install.on('error', (error) => {
      clearTimeout(installTimeout)
      console.log('⚠️ Install error, but continuing...', error.message)
      startServer()
    })
    
    function startServer() {
      console.log('🚀 Starting development server...')
      
      // Try to start the development server
      try {
        const server = spawn('npm', ['run', 'dev', '--', '--port', port.toString()], {
          cwd: appPath,
          detached: true,
          stdio: ['ignore', 'ignore', 'ignore']
        })
        
        // Don't wait for the server to close, it should run in background
        server.unref()
        
        console.log(`✅ Server startup initiated on http://localhost:${port}`)
        console.log(`📁 App directory: ${appPath}`)
        console.log(`📜 Start script created: ${scriptPath}`)
        
        // Give it a moment to start
        setTimeout(() => {
          resolve(true)
        }, 1000)
      } catch (error) {
        console.log('⚠️ Server startup failed:', error)
        resolve(false) // Don't reject, just indicate failure
      }
    }
  })
}