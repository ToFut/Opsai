import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'

interface BusinessProfile {
  businessName: string
  businessType: string
  industry: string
  detectedInfo: {
    description: string
    targetAudience: string
    businessModel: string
    estimatedRevenue: string
  }
  detectedPlatforms: Array<{
    name: string
    type: string
    confidence: number
  }>
  opportunities: Array<{
    title: string
    impact: string
    effort: string
  }>
  suggestedFeatures: string[]
}

interface GenerateCustomAppRequest {
  businessProfile: BusinessProfile
  integrations: string[]
  features: string[]
  userId?: string
  isAuthenticated: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateCustomAppRequest = await request.json()
    const { businessProfile, integrations, features, userId, isAuthenticated } = body
    
    console.log(`🚀 Generating custom app for ${businessProfile.businessName}`)
    console.log('📊 Business profile:', businessProfile)
    console.log('🔗 Integrations:', integrations)
    console.log('✨ Features:', features)
    
    // Create app directory
    const sanitizedAppName = businessProfile.businessName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const timestamp = Date.now()
    const appPath = path.join(process.cwd(), 'generated-apps', `${sanitizedAppName}-${timestamp}`)
    
    console.log(`📁 Creating app directory: ${appPath}`)
    await fs.mkdir(appPath, { recursive: true })
    console.log(`✅ Created app directory: ${appPath}`)
    
    // Generate customized app based on business profile
    console.log('🏗️ Starting app structure generation...')
    try {
      await generateCustomAppStructure({
        appPath,
        businessProfile,
        integrations,
        features,
        userId,
        isAuthenticated,
        timestamp
      })
      console.log('✅ App structure generated successfully')
    } catch (structureError) {
      console.error('❌ Error generating app structure:', structureError)
      console.error('Stack:', structureError instanceof Error ? structureError.stack : 'No stack')
      throw structureError
    }
    
    // Start the app
    const port = 8990 + Math.floor(Math.random() * 10)
    console.log(`🚀 Starting app on port ${port}...`)
    const success = await startGeneratedApp(appPath, port)
    
    if (!success) {
      console.error('❌ Failed to start the generated app')
    }
    
    return NextResponse.json({
      success: true,
      appId: `${sanitizedAppName}-${timestamp}`,
      appPath,
      port,
      appUrl: `http://localhost:${port}`,
      adminUrl: `http://localhost:${port}/admin`,
      editorUrl: `http://localhost:${port}/editor`,
      apiUrl: `http://localhost:${port}/api`,
      message: `✅ Custom app for ${businessProfile.businessName} is running on port ${port}`,
      requiresAuth: !isAuthenticated,
      features: {
        hasDatabase: true,
        hasAuth: true,
        hasAPI: true,
        hasAdmin: true,
        hasEditor: true,
        customBusinessLogic: true
      }
    })
  } catch (error) {
    console.error('❌ App generation error:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({
      success: false,
      error: 'App generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generateCustomAppStructure({
  appPath,
  businessProfile,
  integrations,
  features,
  userId,
  isAuthenticated,
  timestamp
}: any) {
  try {
    // Create package.json with necessary dependencies
    console.log('📦 Creating package.json...')
    await fs.writeFile(path.join(appPath, 'package.json'), JSON.stringify({
      name: businessProfile.businessName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      private: true,
      scripts: {
        dev: `next dev -p ${8990 + Math.floor(Math.random() * 10)}`,
        build: 'next build',
        start: 'next start',
        'db:push': 'prisma db push',
        'db:studio': 'prisma studio'
      },
      dependencies: {
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        '@prisma/client': '^5.7.0',
        'lucide-react': '^0.300.0',
        '@types/node': '^20.0.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        'typescript': '^5.0.0',
        'tailwindcss': '^3.3.0',
        'postcss': '^8.4.0',
        'autoprefixer': '^10.4.0',
        'bcryptjs': '^2.4.3',
        'jsonwebtoken': '^9.0.2',
        '@monaco-editor/react': '^4.6.0',
        'prisma': '^5.7.0',
        'swr': '^2.2.4',
        'zustand': '^4.4.7',
        'react-hot-toast': '^2.4.1',
        '@tanstack/react-query': '^5.17.0',
        'axios': '^1.6.0',
        'date-fns': '^3.0.0',
        'recharts': '^2.10.0'
      }
    }, null, 2))
    console.log('✅ package.json created')
    
    // Generate database schema based on business type
    console.log('🗄️ Generating database schema...')
    const dbSchema = generateDatabaseSchema(businessProfile)
    await fs.mkdir(path.join(appPath, 'prisma'), { recursive: true })
    await fs.writeFile(path.join(appPath, 'prisma/schema.prisma'), dbSchema)
    console.log('✅ Database schema created')
    
    // Create app structure
    console.log('📁 Creating directory structure...')
    await createDirectoryStructure(appPath)
    console.log('✅ Directory structure created')
    
    // Generate customized components based on business type
    console.log('🧩 Generating business components...')
    await generateBusinessComponents(appPath, businessProfile, integrations, features)
    console.log('✅ Business components created')
    
    // Generate API routes with business logic
    console.log('🔌 Generating API routes...')
    await generateBusinessLogicAPI(appPath, businessProfile, integrations)
    console.log('✅ API routes created')
    
    // Create authentication system
    console.log('🔐 Generating authentication system...')
    await generateAuthSystem(appPath, isAuthenticated)
    console.log('✅ Authentication system created')
    
    // Create in-app code editor
    console.log('✏️ Generating code editor...')
    await generateCodeEditor(appPath)
    console.log('✅ Code editor created')
    
    // Generate admin dashboard specific to business
    console.log('👨‍💼 Generating admin dashboard...')
    await generateCustomAdminDashboard(appPath, businessProfile, features)
    console.log('✅ Admin dashboard created')
    
    // Create configuration files
    console.log('⚙️ Creating configuration files...')
    await createConfigFiles(appPath, businessProfile)
    console.log('✅ Configuration files created')
  } catch (error) {
    console.error('❌ Error in generateCustomAppStructure:', error)
    throw error
  }
}

function generateDatabaseSchema(businessProfile: BusinessProfile): string {
  const { businessType, industry } = businessProfile
  
  let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// Base User model for authentication
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  name          String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations based on business type
  ${businessType === 'E-commerce' ? 'orders Order[]' : ''}
  ${businessType === 'SaaS' ? 'subscription Subscription?' : ''}
  ${businessType === 'Healthcare' ? 'appointments Appointment[]' : ''}
}

enum Role {
  USER
  ADMIN
  MANAGER
}
`

  // Add business-specific models
  if (businessType === 'E-commerce') {
    schema += `
// E-commerce specific models
model Product {
  id            String    @id @default(uuid())
  name          String
  description   String?
  price         Float
  cost          Float?
  sku           String    @unique
  barcode       String?
  category      Category? @relation(fields: [categoryId], references: [id])
  categoryId    String?
  inventory     Int       @default(0)
  lowStockAlert Int       @default(10)
  images        String[]
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  orderItems    OrderItem[]
  analytics     ProductAnalytics[]
}

model Category {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Order {
  id              String    @id @default(uuid())
  orderNumber     String    @unique
  user            User      @relation(fields: [userId], references: [id])
  userId          String
  status          OrderStatus @default(PENDING)
  subtotal        Float
  tax             Float
  shipping        Float
  total           Float
  currency        String    @default("USD")
  paymentMethod   String?
  paymentStatus   PaymentStatus @default(PENDING)
  shippingAddress Json
  billingAddress  Json
  items           OrderItem[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model OrderItem {
  id        String   @id @default(uuid())
  order     Order    @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  quantity  Int
  price     Float
  total     Float
}

model ProductAnalytics {
  id          String   @id @default(uuid())
  product     Product  @relation(fields: [productId], references: [id])
  productId   String
  date        DateTime @default(now())
  views       Int      @default(0)
  addedToCart Int      @default(0)
  purchased   Int      @default(0)
  revenue     Float    @default(0)
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}
`
  } else if (businessType === 'SaaS') {
    schema += `
// SaaS specific models
model Subscription {
  id            String    @id @default(uuid())
  user          User      @relation(fields: [userId], references: [id])
  userId        String    @unique
  plan          Plan      @relation(fields: [planId], references: [id])
  planId        String
  status        SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelledAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  usage         Usage[]
  invoices      Invoice[]
}

model Plan {
  id            String    @id @default(uuid())
  name          String
  slug          String    @unique
  description   String?
  price         Float
  currency      String    @default("USD")
  interval      BillingInterval @default(MONTHLY)
  features      Json
  limits        Json
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  subscriptions Subscription[]
}

model Usage {
  id             String    @id @default(uuid())
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])
  subscriptionId String
  metric         String
  value          Float
  timestamp      DateTime  @default(now())
}

model Invoice {
  id             String    @id @default(uuid())
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])
  subscriptionId String
  amount         Float
  currency       String    @default("USD")
  status         InvoiceStatus @default(PENDING)
  dueDate        DateTime
  paidAt         DateTime?
  createdAt      DateTime  @default(now())
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  TRIALING
}

enum BillingInterval {
  MONTHLY
  YEARLY
}

enum InvoiceStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
}
`
  } else if (businessType === 'Healthcare') {
    schema += `
// Healthcare specific models
model Patient {
  id              String    @id @default(uuid())
  firstName       String
  lastName        String
  dateOfBirth     DateTime
  gender          String
  email           String    @unique
  phone           String
  address         Json
  medicalRecordNo String    @unique
  insurance       Json?
  emergencyContact Json
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  appointments    Appointment[]
  medicalRecords  MedicalRecord[]
}

model Provider {
  id            String    @id @default(uuid())
  firstName     String
  lastName      String
  specialization String
  licenseNumber String    @unique
  email         String    @unique
  phone         String
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  appointments  Appointment[]
  schedules     Schedule[]
}

model Appointment {
  id          String    @id @default(uuid())
  patient     Patient   @relation(fields: [patientId], references: [id])
  patientId   String
  provider    Provider  @relation(fields: [providerId], references: [id])
  providerId  String
  user        User?     @relation(fields: [userId], references: [id])
  userId      String?
  type        AppointmentType
  status      AppointmentStatus @default(SCHEDULED)
  startTime   DateTime
  endTime     DateTime
  reason      String?
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model MedicalRecord {
  id          String    @id @default(uuid())
  patient     Patient   @relation(fields: [patientId], references: [id])
  patientId   String
  type        RecordType
  date        DateTime
  diagnosis   String?
  treatment   String?
  medications Json?
  vitals      Json?
  attachments String[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Schedule {
  id          String    @id @default(uuid())
  provider    Provider  @relation(fields: [providerId], references: [id])
  providerId  String
  dayOfWeek   Int
  startTime   String
  endTime     String
  isActive    Boolean   @default(true)
}

enum AppointmentType {
  CONSULTATION
  FOLLOWUP
  PROCEDURE
  EMERGENCY
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  COMPLETED
  CANCELLED
  NOSHOW
}

enum RecordType {
  CONSULTATION
  LAB_RESULT
  IMAGING
  PRESCRIPTION
  PROCEDURE
}
`
  }

  // Add integration-specific models
  if (integrations.includes('Stripe')) {
    schema += `
// Stripe integration
model StripeCustomer {
  id              String   @id @default(uuid())
  userId          String   @unique
  stripeCustomerId String  @unique
  createdAt       DateTime @default(now())
}
`
  }

  return schema
}

async function createDirectoryStructure(appPath: string) {
  const dirs = [
    'app',
    'app/api',
    'app/api/auth',
    'app/api/business',
    'app/api/admin',
    'app/api/editor',
    'app/auth',
    'app/auth/login',
    'app/auth/register',
    'app/admin',
    'app/editor',
    'app/dashboard',
    'components',
    'components/ui',
    'components/business',
    'components/editor',
    'components/auth',
    'lib',
    'lib/api',
    'lib/hooks',
    'lib/store',
    'public',
    'styles'
  ]
  
  for (const dir of dirs) {
    await fs.mkdir(path.join(appPath, dir), { recursive: true })
  }
  
  // Create globals.css
  await fs.writeFile(path.join(appPath, 'app/globals.css'), `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
  `.trim())
}

async function generateBusinessComponents(appPath: string, businessProfile: BusinessProfile, integrations: string[], features: string[]) {
  // First, generate UI components
  await generateUIComponents(appPath)
  
  // Generate main layout
  await fs.writeFile(
    path.join(appPath, 'app/layout.tsx'),
    generateMainLayout(businessProfile)
  )
  
  // Generate home page with business-specific content
  await fs.writeFile(
    path.join(appPath, 'app/page.tsx'),
    generateHomePage(businessProfile, features)
  )
  
  // Generate dashboard based on business type
  await fs.writeFile(
    path.join(appPath, 'app/dashboard/page.tsx'),
    generateDashboard(businessProfile, integrations, features)
  )
  
  // Generate business-specific components
  if (businessProfile.businessType === 'E-commerce') {
    await generateEcommerceComponents(appPath, businessProfile)
  } else if (businessProfile.businessType === 'SaaS') {
    await generateSaaSComponents(appPath, businessProfile)
  } else if (businessProfile.businessType === 'Healthcare') {
    await generateHealthcareComponents(appPath, businessProfile)
  }
}

async function generateBusinessLogicAPI(appPath: string, businessProfile: BusinessProfile, integrations: string[]) {
  // Generate CRUD APIs based on business models
  const apiPath = path.join(appPath, 'app/api/business')
  
  if (businessProfile.businessType === 'E-commerce') {
    // Product API
    await fs.writeFile(
      path.join(apiPath, 'products/route.ts'),
      generateProductAPI()
    )
    
    // Order API
    await fs.writeFile(
      path.join(apiPath, 'orders/route.ts'),
      generateOrderAPI()
    )
    
    // Analytics API
    await fs.writeFile(
      path.join(apiPath, 'analytics/route.ts'),
      generateEcommerceAnalyticsAPI()
    )
  }
  
  // Generate integration APIs
  for (const integration of integrations) {
    if (integration === 'Stripe') {
      await fs.writeFile(
        path.join(apiPath, 'stripe/route.ts'),
        generateStripeAPI()
      )
    }
  }
}

async function generateAuthSystem(appPath: string, isAuthenticated: boolean) {
  // Generate auth API routes
  await fs.writeFile(
    path.join(appPath, 'app/api/auth/login/route.ts'),
    generateLoginAPI()
  )
  
  await fs.writeFile(
    path.join(appPath, 'app/api/auth/register/route.ts'),
    generateRegisterAPI()
  )
  
  // Generate auth pages
  await fs.writeFile(
    path.join(appPath, 'app/auth/login/page.tsx'),
    generateLoginPage()
  )
  
  await fs.writeFile(
    path.join(appPath, 'app/auth/register/page.tsx'),
    generateRegisterPage()
  )
  
  // Generate auth middleware
  await fs.writeFile(
    path.join(appPath, 'lib/auth.ts'),
    generateAuthMiddleware()
  )
  
  // Generate auth components
  await fs.writeFile(
    path.join(appPath, 'components/auth/LoginForm.tsx'),
    generateLoginForm()
  )
}

async function generateCodeEditor(appPath: string) {
  // Generate Monaco-based code editor
  await fs.writeFile(
    path.join(appPath, 'app/editor/page.tsx'),
    generateEditorPage()
  )
  
  // Generate file browser component
  await fs.writeFile(
    path.join(appPath, 'components/editor/FileBrowser.tsx'),
    generateFileBrowser()
  )
  
  // Generate editor API for file operations
  await fs.writeFile(
    path.join(appPath, 'app/api/editor/files/route.ts'),
    generateFileAPI()
  )
}

async function generateCustomAdminDashboard(appPath: string, businessProfile: BusinessProfile, features: string[]) {
  await fs.writeFile(
    path.join(appPath, 'app/admin/page.tsx'),
    generateAdminDashboard(businessProfile, features)
  )
}

// REMOVED: Duplicate function - using the complete version below
async function createConfigFiles_REMOVED_DUPLICATE(appPath: string, businessProfile: BusinessProfile) {
  // Create Next.js config
  await fs.writeFile(path.join(appPath, 'next.config.js'), `/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
`)

  // Create TypeScript config
  await fs.writeFile(path.join(appPath, 'tsconfig.json'), JSON.stringify({
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
  }, null, 2))

  // Create Tailwind config
  await fs.writeFile(path.join(appPath, 'tailwind.config.js'), `/** @type {import('tailwindcss').Config} */
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
}`)

  // Create PostCSS config
  await fs.writeFile(path.join(appPath, 'postcss.config.js'), `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`)

  // Create environment variables template
  await fs.writeFile(path.join(appPath, '.env.local'), `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/${businessProfile.businessName.toLowerCase().replace(/\s+/g, '_')}"

# Authentication
JWT_SECRET="${generateRandomString(32)}"
NEXTAUTH_SECRET="${generateRandomString(32)}"
NEXTAUTH_URL="http://localhost:8990"

# Integrations
${businessProfile.detectedPlatforms.map(p => `${p.name.toUpperCase().replace(/\s+/g, '_')}_API_KEY=""`).join('\n')}

# App Configuration
APP_NAME="${businessProfile.businessName}"
APP_DESCRIPTION="${businessProfile.detectedInfo.description}"
BUSINESS_TYPE="${businessProfile.businessType}"
`)

  // Create globals.css
  await fs.writeFile(path.join(appPath, 'app/globals.css'), `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-gray-200;
  }
  body {
    @apply bg-white text-gray-900;
  }
}`)
}

// Helper function to generate random string
function generateRandomString(length: number): string {
  return Array.from({ length }, () => Math.random().toString(36).charAt(2)).join('')
}

// Generate UI components
async function generateUIComponents(appPath: string) {
  const uiPath = path.join(appPath, 'components/ui')
  
  // Button component
  await fs.writeFile(
    path.join(uiPath, 'button.tsx'),
    `import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'default',
            'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
            'border border-gray-300 bg-transparent hover:bg-gray-100': variant === 'outline',
            'hover:bg-gray-100 hover:text-gray-900': variant === 'ghost',
            'text-blue-600 underline-offset-4 hover:underline': variant === 'link',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 px-3': size === 'sm',
            'h-11 px-8': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }`
  )
  
  // Card component
  await fs.writeFile(
    path.join(uiPath, 'card.tsx'),
    `import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-white shadow-sm', className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-gray-600', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardDescription, CardContent }`
  )
  
  // Input component
  await fs.writeFile(
    path.join(uiPath, 'input.tsx'),
    `import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }`
  )
  
  // Label component
  await fs.writeFile(
    path.join(uiPath, 'label.tsx'),
    `import * as React from 'react'
import { cn } from '@/lib/utils'

const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentPropsWithoutRef<'label'>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
))
Label.displayName = 'Label'

export { Label }`
  )
  
  // Badge component
  await fs.writeFile(
    path.join(uiPath, 'badge.tsx'),
    `import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-blue-100 text-blue-800': variant === 'default',
          'bg-gray-100 text-gray-800': variant === 'secondary',
          'border border-gray-300': variant === 'outline',
          'bg-green-100 text-green-800': variant === 'success',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }`
  )
  
  // Table components
  await fs.writeFile(
    path.join(uiPath, 'table.tsx'),
    `import * as React from 'react'
import { cn } from '@/lib/utils'

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('border-b', className)} {...props} />
  )
)
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
)
TableBody.displayName = 'TableBody'

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn('border-b transition-colors hover:bg-gray-50', className)} {...props} />
  )
)
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn('h-12 px-4 text-left align-middle font-medium text-gray-600', className)}
      {...props}
    />
  )
)
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('p-4 align-middle', className)} {...props} />
  )
)
TableCell.displayName = 'TableCell'

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }`
  )
  
  // Tabs component
  await fs.writeFile(
    path.join(uiPath, 'tabs.tsx'),
    `import * as React from 'react'
import { cn } from '@/lib/utils'

const Tabs = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('w-full', className)} {...props} />
  )
)
Tabs.displayName = 'Tabs'

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1', className)}
      {...props}
    />
  )
)
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:shadow-sm',
        className
      )}
      {...props}
    />
  )
)
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-2', className)} {...props} />
  )
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }`
  )
  
  // Create utils file
  await fs.writeFile(
    path.join(appPath, 'lib/utils.ts'),
    `import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`
  )
  
  // Update package.json to include missing dependencies
  const packageJsonPath = path.join(appPath, 'package.json')
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
  packageJson.dependencies = {
    ...packageJson.dependencies,
    'clsx': '^2.0.0',
    'tailwind-merge': '^2.0.0'
  }
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

// Component generation functions
function generateMainLayout(businessProfile: BusinessProfile): string {
  return `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${businessProfile.businessName} - ${businessProfile.businessType} Platform',
  description: '${businessProfile.detectedInfo.description}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}`
}

function generateHomePage(businessProfile: BusinessProfile, features: string[]): string {
  return `'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  TrendingUp,
  Settings,
  Code,
  LogIn
} from 'lucide-react'

export default function HomePage() {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token and get user info
      fetch('/api/auth/me', {
        headers: { Authorization: \`Bearer \${token}\` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) setUser(data.user)
        })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg" />
              <h1 className="text-xl font-bold">${businessProfile.businessName}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Link href="/admin">
                    <Button variant="ghost">Admin</Button>
                  </Link>
                  <Link href="/editor">
                    <Button variant="ghost">
                      <Code className="w-4 h-4 mr-2" />
                      Code Editor
                    </Button>
                  </Link>
                  <div className="text-sm text-gray-600">
                    {user.email}
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem('token')
                      window.location.reload()
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button>
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ${businessProfile.businessType} Management Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ${businessProfile.detectedInfo.description}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          ${features.slice(0, 3).map((feature, index) => `
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ${index === 0 ? '<BarChart3 className="w-5 h-5 text-blue-600" />' : ''}
                ${index === 1 ? '<Users className="w-5 h-5 text-green-600" />' : ''}
                ${index === 2 ? '<TrendingUp className="w-5 h-5 text-purple-600" />' : ''}
                ${feature}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced ${feature.toLowerCase()} capabilities tailored for ${businessProfile.industry}.
              </p>
            </CardContent>
          </Card>`).join('')}
        </div>

        {/* Business Metrics */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Platform Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  ${businessProfile.detectedPlatforms.length}
                </div>
                <div className="text-sm text-gray-600">Integrations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ${features.length}
                </div>
                <div className="text-sm text-gray-600">Features</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  Real-time
                </div>
                <div className="text-sm text-gray-600">Analytics</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  Secure
                </div>
                <div className="text-sm text-gray-600">& Compliant</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          {user ? (
            <Link href="/dashboard">
              <Button size="lg">
                Go to Dashboard
                <BarChart3 className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="lg">
                Get Started
                <LogIn className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}`
}

function generateDashboard(businessProfile: BusinessProfile, integrations: string[], features: string[]): string {
  // Generate a comprehensive dashboard based on business type
  return `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch business metrics
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/business/analytics', {
        headers: {
          Authorization: \`Bearer \${localStorage.getItem('token')}\`
        }
      })
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">${businessProfile.businessName} Dashboard</h1>
        
        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          ${businessProfile.businessType === 'E-commerce' ? `
          <MetricCard
            title="Total Revenue"
            value="$${metrics.revenue?.toLocaleString() || '0'}"
            change={metrics.revenueChange || 0}
            icon={<DollarSign className="w-6 h-6" />}
            color="text-green-600"
          />
          <MetricCard
            title="Active Customers"
            value={metrics.customers?.toLocaleString() || '0'}
            change={metrics.customerChange || 0}
            icon={<Users className="w-6 h-6" />}
            color="text-blue-600"
          />
          <MetricCard
            title="Total Orders"
            value={metrics.orders?.toLocaleString() || '0'}
            change={metrics.orderChange || 0}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="text-purple-600"
          />
          <MetricCard
            title="Low Stock Items"
            value={metrics.lowStock || '0'}
            icon={<Package className="w-6 h-6" />}
            color="text-orange-600"
            showChange={false}
          />` : ''}
          
          ${businessProfile.businessType === 'SaaS' ? `
          <MetricCard
            title="MRR"
            value="$${metrics.mrr?.toLocaleString() || '0'}"
            change={metrics.mrrChange || 0}
            icon={<DollarSign className="w-6 h-6" />}
            color="text-green-600"
          />
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers?.toLocaleString() || '0'}
            change={metrics.userChange || 0}
            icon={<Users className="w-6 h-6" />}
            color="text-blue-600"
          />
          <MetricCard
            title="Churn Rate"
            value="${metrics.churnRate || '0'}%"
            change={metrics.churnChange || 0}
            icon={<TrendingDown className="w-6 h-6" />}
            color="text-red-600"
            invertChange
          />
          <MetricCard
            title="Trial Conversions"
            value="${metrics.trialConversion || '0'}%"
            change={metrics.conversionChange || 0}
            icon={<CheckCircle className="w-6 h-6" />}
            color="text-purple-600"
          />` : ''}
        </div>

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            ${integrations.length > 0 ? '<TabsTrigger value="integrations">Integrations</TabsTrigger>' : ''}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics.revenueData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics.categoryData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(metrics.categoryData || []).map((entry: any, index: number) => (
                          <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            {/* Add more analytics content based on business type */}
          </TabsContent>

          <TabsContent value="operations">
            {/* Add operations content */}
          </TabsContent>

          {integrations.length > 0 && (
            <TabsContent value="integrations">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${integrations.map(integration => `
                <Card>
                  <CardHeader>
                    <CardTitle>${integration}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <Badge variant="success">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Last Sync</span>
                        <span className="text-sm">2 minutes ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>`).join('')}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

function MetricCard({ title, value, change, icon, color, showChange = true, invertChange = false }: any) {
  const isPositive = invertChange ? change < 0 : change > 0
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {showChange && (
              <div className={\`flex items-center gap-1 mt-2 text-sm \${isPositive ? 'text-green-600' : 'text-red-600'}\`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          <div className={\`p-3 rounded-full bg-gray-100 \${color}\`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}`
}

// Generate E-commerce specific components
async function generateEcommerceComponents(appPath: string, businessProfile: BusinessProfile) {
  // Product management component
  await fs.writeFile(
    path.join(appPath, 'components/business/ProductManager.tsx'),
    `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash, AlertCircle } from 'lucide-react'

export function ProductManager() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/business/products', {
        headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
      })
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Product Management</CardTitle>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product: any) => (
              <TableRow key={product.id}>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category?.name || '-'}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {product.inventory}
                    {product.inventory <= product.lowStockAlert && (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.isActive ? 'success' : 'secondary'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}`
  )
}

// Generate SaaS specific components
async function generateSaaSComponents(appPath: string, businessProfile: BusinessProfile) {
  // Subscription management component
  await fs.writeFile(
    path.join(appPath, 'components/business/SubscriptionManager.tsx'),
    `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState([])
  
  useEffect(() => {
    // Fetch subscriptions
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Subscription management UI */}
      </CardContent>
    </Card>
  )
}`
  )
}

// Generate Healthcare specific components
async function generateHealthcareComponents(appPath: string, businessProfile: BusinessProfile) {
  // Appointment management component
  await fs.writeFile(
    path.join(appPath, 'components/business/AppointmentManager.tsx'),
    `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AppointmentManager() {
  const [appointments, setAppointments] = useState([])
  
  useEffect(() => {
    // Fetch appointments
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Appointment management UI */}
      </CardContent>
    </Card>
  )
}`
  )
}

// API generation functions
function generateProductAPI(): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        analytics: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    })

    return NextResponse.json({ products })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        cost: data.cost,
        sku: data.sku,
        barcode: data.barcode,
        categoryId: data.categoryId,
        inventory: data.inventory || 0,
        lowStockAlert: data.lowStockAlert || 10,
        images: data.images || [],
        isActive: data.isActive ?? true
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}`
}

function generateOrderAPI(): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: user.role === 'USER' ? { userId: user.id } : {},
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Start transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: \`ORD-\${Date.now()}\`,
          userId: user.id,
          status: 'PENDING',
          subtotal: data.subtotal,
          tax: data.tax,
          shipping: data.shipping,
          total: data.total,
          currency: data.currency || 'USD',
          paymentMethod: data.paymentMethod,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
          items: {
            create: data.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      // Update inventory
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              decrement: item.quantity
            }
          }
        })
      }

      return newOrder
    })

    return NextResponse.json({ order })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}`
}

function generateEcommerceAnalyticsAPI(): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { subDays, startOfDay, endOfDay } from 'date-fns'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const thirtyDaysAgo = subDays(today, 30)

    // Revenue metrics
    const revenueData = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
          lte: today
        },
        status: 'DELIVERED'
      },
      _sum: {
        total: true
      }
    })

    // Customer metrics
    const totalCustomers = await prisma.user.count({
      where: { role: 'USER' }
    })

    const newCustomers = await prisma.user.count({
      where: {
        role: 'USER',
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Order metrics
    const totalOrders = await prisma.order.count()
    const recentOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })

    // Low stock items
    const lowStockProducts = await prisma.product.count({
      where: {
        inventory: {
          lte: prisma.product.fields.lowStockAlert
        }
      }
    })

    // Category distribution
    const categoryData = await prisma.product.groupBy({
      by: ['categoryId'],
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      revenue: revenueData.reduce((sum, day) => sum + (day._sum.total || 0), 0),
      revenueChange: 12.5, // Calculate actual change
      customers: totalCustomers,
      customerChange: 8.3,
      orders: totalOrders,
      orderChange: 15.2,
      lowStock: lowStockProducts,
      revenueData: revenueData.map(day => ({
        date: day.createdAt,
        revenue: day._sum.total || 0
      })),
      categoryData: categoryData.map(cat => ({
        name: \`Category \${cat.categoryId}\`,
        value: cat._count.id
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}`
}

function generateStripeAPI(): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, currency = 'usd' } = await request.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: user.id
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    })
  } catch (error) {
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}`
}

function generateLoginAPI(): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}`
}

function generateRegisterAPI(): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER'
      }
    })

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}`
}

function generateAuthMiddleware(): string {
  return `import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export async function verifyToken(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) return null

    const token = authorization.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}`
}

function generateLoginPage(): string {
  return `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        router.push('/dashboard')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
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
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
  `.trim()
}

function generateRegisterPage(): string {
  return `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        })
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/auth/login')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="First name"
              />
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Last name"
              />
            </div>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Confirm password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
  `.trim()
}

function generateLoginForm(): string {
  return `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        toast.success('Login successful!')
        router.push('/dashboard')
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}`
}

function generateEditorPage(): string {
  return `'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileBrowser } from '@/components/editor/FileBrowser'
import { Save, Play, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

export default function EditorPage() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [saving, setSaving] = useState(false)

  const loadFile = async (path: string) => {
    try {
      const response = await fetch(\`/api/editor/files?path=\${encodeURIComponent(path)}\`, {
        headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
      })
      const data = await response.json()
      setFileContent(data.content)
      setOriginalContent(data.content)
      setSelectedFile(path)
    } catch (error) {
      toast.error('Failed to load file')
    }
  }

  const saveFile = async () => {
    if (!selectedFile) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/editor/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${localStorage.getItem('token')}\`
        },
        body: JSON.stringify({
          path: selectedFile,
          content: fileContent
        })
      })

      if (response.ok) {
        setOriginalContent(fileContent)
        toast.success('File saved successfully')
      } else {
        toast.error('Failed to save file')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = fileContent !== originalContent

  return (
    <div className="flex h-screen bg-gray-50">
      {/* File Browser */}
      <div className="w-64 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Project Files</h2>
        </div>
        <FileBrowser onSelectFile={loadFile} />
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{selectedFile}</span>
                {hasChanges && <span className="text-xs text-orange-600">• Modified</span>}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFileContent(originalContent)}
                  disabled={!hasChanges}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={saveFile}
                  disabled={!hasChanges || saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <MonacoEditor
                height="100%"
                language={getLanguageFromPath(selectedFile)}
                value={fileContent}
                onChange={(value) => setFileContent(value || '')}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a file to edit
          </div>
        )}
      </div>
    </div>
  )
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    css: 'css',
    html: 'html',
    md: 'markdown',
    prisma: 'sql'
  }
  return languageMap[ext || ''] || 'plaintext'
}`
}

function generateFileBrowser(): string {
  return `'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
}

export function FileBrowser({ onSelectFile }: { onSelectFile: (path: string) => void }) {
  const [files, setFiles] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/editor/files/tree', {
        headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
      })
      const data = await response.json()
      setFiles(data.files)
    } catch (error) {
      console.error('Failed to fetch files:', error)
    }
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    
    return (
      <div key={node.path}>
        <div
          className={\`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer\`}
          style={{ paddingLeft: \`\${level * 16 + 8}px\` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path)
            } else {
              onSelectFile(node.path)
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Folder className="w-4 h-4 text-blue-600" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <File className="w-4 h-4 text-gray-600" />
            </>
          )}
          <span className="text-sm">{node.name}</span>
        </div>
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-y-auto">
      {files.map(file => renderNode(file))}
    </div>
  )
}`
}

function generateFileAPI(): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 })
    }

    // Security: Ensure path is within app directory
    const fullPath = path.join(process.cwd(), filePath)
    if (!fullPath.startsWith(process.cwd())) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const content = await fs.readFile(fullPath, 'utf-8')
    
    return NextResponse.json({ content })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { path: filePath, content } = await request.json()

    if (!filePath) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 })
    }

    // Security: Ensure path is within app directory
    const fullPath = path.join(process.cwd(), filePath)
    if (!fullPath.startsWith(process.cwd())) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    await fs.writeFile(fullPath, content)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 })
  }
}`
}

function generateAdminDashboard(businessProfile: BusinessProfile, features: string[]): string {
  return `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Settings, 
  Database, 
  BarChart3,
  Shield,
  Zap,
  Code,
  Globe
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({})
  
  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
      })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">${businessProfile.businessName} Admin</h1>
          <p className="text-gray-600">Manage your ${businessProfile.businessType} platform</p>
        </div>

        {/* Admin Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Database Records</p>
                  <p className="text-2xl font-bold">{stats.totalRecords || 0}</p>
                </div>
                <Database className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">API Calls Today</p>
                  <p className="text-2xl font-bold">{stats.apiCalls || 0}</p>
                </div>
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Features</p>
                  <p className="text-2xl font-bold">${features.length}</p>
                </div>
                <Settings className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {/* User management UI */}
                <p>Manage users, roles, and permissions</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Data management UI based on business type */}
                <p>Manage your ${businessProfile.businessType} data</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Connected Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  ${businessProfile.detectedPlatforms.map(platform => `
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">${platform.name}</h4>
                        <p className="text-sm text-gray-600">${platform.type}</p>
                      </div>
                      <Button size="sm">Configure</Button>
                    </div>
                  </div>`).join('')}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Settings UI */}
                <p>Configure your application settings</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Security settings UI */}
                <p>Manage security settings and access controls</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}`
}

// Duplicate function removed - already defined above

async function createConfigFiles(appPath: string, businessProfile: BusinessProfile) {
  // Create next.config.js
  await fs.writeFile(path.join(appPath, 'next.config.js'), `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
  `.trim())
  
  // Create tsconfig.json
  await fs.writeFile(path.join(appPath, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: "es5",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "node",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      paths: {
        "@/*": ["./*"]
      }
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
    exclude: ["node_modules"]
  }, null, 2))
  
  // Create tailwind.config.js
  await fs.writeFile(path.join(appPath, 'tailwind.config.js'), `
/** @type {import('tailwindcss').Config} */
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
}
  `.trim())
  
  // Create postcss.config.js
  await fs.writeFile(path.join(appPath, 'postcss.config.js'), `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
  `.trim())
  
  // Create .env.example
  await fs.writeFile(path.join(appPath, '.env.example'), `
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret-here"
NEXT_PUBLIC_APP_NAME="${businessProfile.businessName}"
  `.trim())
  
  // Create .gitignore
  await fs.writeFile(path.join(appPath, '.gitignore'), `
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
prisma/*.db
prisma/*.db-journal
  `.trim())
}

async function startGeneratedApp(appPath: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`📦 Installing dependencies for app at ${appPath}...`)
    
    // Install dependencies with timeout
    const install = spawn('npm', ['install', '--silent'], {
      cwd: appPath,
      stdio: 'pipe'
    })
    
    const installTimeout = setTimeout(() => {
      install.kill()
      console.log('⚠️ Install timeout, starting anyway...')
      startDevServer()
    }, 60000) // 60 second timeout
    
    install.on('close', (code) => {
      clearTimeout(installTimeout)
      console.log(code === 0 ? '✅ Dependencies installed' : '⚠️ Install had issues, continuing...')
      startDevServer()
    })
    
    install.on('error', (error) => {
      clearTimeout(installTimeout)
      console.log('⚠️ Install error:', error.message)
      startDevServer()
    })
    
    function startDevServer() {
      console.log(`🚀 Starting dev server on port ${port}...`)
      
      try {
        const server = spawn('npm', ['run', 'dev'], {
          cwd: appPath,
          detached: true,
          stdio: ['ignore', 'ignore', 'ignore']
        })
        
        server.unref()
        
        // Give server time to start
        setTimeout(() => {
          console.log(`✅ Server started on http://localhost:${port}`)
          resolve(true)
        }, 5000)
        
      } catch (error) {
        console.log('⚠️ Server startup failed:', error)
        resolve(false)
      }
    }
  })
}