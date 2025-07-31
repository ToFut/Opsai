import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

// Forward declarations for TypeScript
// (Remove if you move the function definitions above their usage)
declare function generateEnvironmentConfig(config: any, outputDir: string): Promise<void>;
declare function generateDeploymentConfig(config: any, outputDir: string): Promise<void>;

// Local implementations to replace broken imports
class LocalYamlProcessor {
  static parse(yamlString: string): any {
    try {
      // Simple YAML parsing - in production, use js-yaml
      if (yamlString.trim().startsWith('{')) {
        return JSON.parse(yamlString)
      }
      // Basic YAML-like parsing for demo
      return this.parseBasicYaml(yamlString)
    } catch (error) {
      throw new Error(`YAML parsing failed: ${error}`)
    }
  }

  private static parseBasicYaml(yamlString: string): any {
    const lines = yamlString.split('\n')
    const result: any = {}
    let currentSection: any = null
    let currentKey = ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      if (trimmed.endsWith(':')) {
        const sectionName = trimmed.slice(0, -1).trim()
        if (!result[sectionName]) {
          result[sectionName] = {}
        }
        currentSection = result[sectionName]
      } else if (trimmed.includes(':') && currentSection) {
        const [key, value] = trimmed.split(':', 2)
        currentSection[key.trim()] = value.trim()
      }
    }

    return result
  }
}

class LocalCacheService {
  private cache = new Map()

  async get(key: string): Promise<any> {
    return this.cache.get(key)
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.cache.set(key, value)
  }
}

class LocalSecurityService {
  async hashPassword(password: string): Promise<string> {
    // Simple hash for demo - in production, use bcrypt
    return Buffer.from(password).toString('base64')
  }

  generateToken(payload: any): string {
    // Simple token generation for demo - in production, use JWT
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }
}

class LocalAppGenerator {
  static async generate(config: any, appName: string, outputDir: string): Promise<void> {
    console.log(`Generating app: ${appName} in ${outputDir}`)
    // Implementation will be added below
  }
}

class LocalAuthService {
  constructor(config: any) {
    // Auth service configuration
  }

  async login(credentials: any): Promise<any> {
    // Simple login for demo
    return { token: 'demo-token', user: { id: '1', email: credentials.email } }
  }

  async register(userData: any): Promise<any> {
    // Simple registration for demo
    return { token: 'demo-token', user: { id: '1', email: userData.email } }
  }
}

class LocalAirbyteConnector {
  constructor(config: any) {
    // Airbyte configuration
  }

  async execute(action: string, params: any): Promise<any> {
    // Simple Airbyte simulation
    return { success: true, data: { id: 'demo-connection' } }
  }
}

class LocalTenantManager {
  static getInstance(): LocalTenantManager {
    return new LocalTenantManager()
  }

  async createTenant(data: any): Promise<any> {
    return { id: 'demo-tenant', name: data.name, slug: data.slug }
  }

  async getTenant(id: string): Promise<any> {
    return { id, name: 'Demo Tenant', slug: 'demo-tenant' }
  }
}

class LocalDeploymentManager {
  async deploy(config: any): Promise<any> {
    return { id: 'demo-deployment', status: 'deployed', url: 'https://demo-app.vercel.app' }
  }
}

// Temporary validation function until @opsai/shared is built
function validateYamlConfigSafe(config: any): { success: boolean; data?: any; errors?: string[] } {
  try {
    if (!config.vertical || !config.business || !config.database) {
      return { success: false, errors: ['Missing required sections: vertical, business, database'] }
    }
    return { success: true, data: config }
  } catch (error) {
    return { success: false, errors: ['Invalid configuration format'] }
  }
}

// Enhanced field type conversion with business-specific types
function convertFieldType(yamlType: string, businessType: string): string {
  const baseTypeMap: Record<string, string> = {
    'string': 'String',
    'number': 'Float',
    'integer': 'Int',
    'boolean': 'Boolean',
    'date': 'DateTime',
    'datetime': 'DateTime',
    'json': 'String', // SQLite compatible
    'enum': 'String'
  }

  // Business-specific type mappings
  const businessTypeMap: Record<string, Record<string, string>> = {
    'healthcare': {
      'medical_device_id': 'String',
      'compliance_status': 'String',
      'certification_date': 'DateTime',
      'regulatory_approval': 'String',
      'patient_data': 'String',
      'medical_license': 'String'
    },
    'ecommerce': {
      'product_sku': 'String',
      'inventory_count': 'Int',
      'price': 'Float',
      'category': 'String',
      'shipping_weight': 'Float',
      'order_status': 'String'
    },
    'real_estate': {
      'property_id': 'String',
      'square_feet': 'Int',
      'bedrooms': 'Int',
      'bathrooms': 'Int',
      'price': 'Float',
      'property_type': 'String',
      'listing_status': 'String'
    }
  }

  const businessTypes = businessTypeMap[businessType.toLowerCase()] || {}
  return businessTypes[yamlType.toLowerCase()] || baseTypeMap[yamlType.toLowerCase()] || 'String'
}

// Generate business-specific UI pages based on YAML configuration
function generateCustomUIPages(config: any, businessType: string): any[] {
  const basePages = [
    {
      name: 'dashboard',
      path: '/',
      components: [
        { type: 'business_overview', dataSource: 'analytics' },
        { type: 'recent_activity', dataSource: 'activity_log' }
      ]
    }
  ]

  // Business-specific page generation
  const businessPages: Record<string, any[]> = {
    'healthcare': [
      {
        name: 'compliance',
        path: '/compliance',
        components: [
          { type: 'compliance_dashboard', dataSource: 'compliance_records' },
          { type: 'certification_tracker', dataSource: 'certifications' }
        ]
      },
      {
        name: 'medical_devices',
        path: '/medical-devices',
        components: [
          { type: 'device_inventory', dataSource: 'medical_devices' },
          { type: 'regulatory_status', dataSource: 'regulatory_records' }
        ]
      },
      {
        name: 'training',
        path: '/training',
        components: [
          { type: 'training_sessions', dataSource: 'training_records' },
          { type: 'certification_progress', dataSource: 'certifications' }
        ]
      }
    ],
    'ecommerce': [
      {
        name: 'products',
        path: '/products',
        components: [
          { type: 'product_catalog', dataSource: 'products' },
          { type: 'inventory_management', dataSource: 'inventory' }
        ]
      },
      {
        name: 'orders',
        path: '/orders',
        components: [
          { type: 'order_management', dataSource: 'orders' },
          { type: 'fulfillment_tracker', dataSource: 'fulfillment' }
        ]
      },
      {
        name: 'customers',
        path: '/customers',
        components: [
          { type: 'customer_management', dataSource: 'customers' },
          { type: 'loyalty_program', dataSource: 'loyalty' }
        ]
      }
    ],
    'real_estate': [
      {
        name: 'properties',
        path: '/properties',
        components: [
          { type: 'property_listings', dataSource: 'properties' },
          { type: 'market_analysis', dataSource: 'market_data' }
        ]
      },
      {
        name: 'clients',
        path: '/clients',
        components: [
          { type: 'client_management', dataSource: 'clients' },
          { type: 'lead_tracker', dataSource: 'leads' }
        ]
      },
      {
        name: 'transactions',
        path: '/transactions',
        components: [
          { type: 'transaction_history', dataSource: 'transactions' },
          { type: 'commission_tracker', dataSource: 'commissions' }
        ]
      }
    ]
  }

  // Add custom pages based on YAML models
  const customPages = (config.database?.models || []).map((model: any) => ({
    name: model.name.toLowerCase(),
    path: `/${model.name.toLowerCase()}s`,
    components: [
      { type: 'data_management', dataSource: model.name.toLowerCase(), actions: ['create', 'edit', 'delete', 'view'] }
    ]
  }))

  return [...basePages, ...(businessPages[businessType.toLowerCase()] || []), ...customPages]
}

// Generate business-specific navigation
function generateCustomNavigation(config: any, businessType: string): any[] {
  const baseNav = [
    { name: 'Dashboard', href: '/', icon: 'Home' }
  ]

  const businessNav: Record<string, any[]> = {
    'healthcare': [
      { name: 'Medical Devices', href: '/medical-devices', icon: 'Activity' },
      { name: 'Compliance', href: '/compliance', icon: 'Shield' },
      { name: 'Training', href: '/training', icon: 'GraduationCap' },
      { name: 'Certifications', href: '/certifications', icon: 'Award' }
    ],
    'ecommerce': [
      { name: 'Products', href: '/products', icon: 'Package' },
      { name: 'Orders', href: '/orders', icon: 'ShoppingCart' },
      { name: 'Customers', href: '/customers', icon: 'Users' },
      { name: 'Inventory', href: '/inventory', icon: 'Box' }
    ],
    'real_estate': [
      { name: 'Properties', href: '/properties', icon: 'Home' },
      { name: 'Clients', href: '/clients', icon: 'Users' },
      { name: 'Transactions', href: '/transactions', icon: 'DollarSign' },
      { name: 'Leads', href: '/leads', icon: 'Target' }
    ]
  }

  // Add custom navigation based on YAML models
  const customNav = (config.database?.models || []).map((model: any) => ({
    name: model.name.charAt(0).toUpperCase() + model.name.slice(1) + 's',
    href: `/${model.name.toLowerCase()}s`,
    icon: 'Database'
  }))

  return [...baseNav, ...(businessNav[businessType.toLowerCase()] || []), ...customNav]
}

interface YamlConfig {
  vertical: {
    name: string
    description: string
    industry: string
  }
  business: {
    name: string
    type: string
  }
  database: {
    models: Array<{
      name: string
      fields: Array<{
        name: string
        type: string
        required: boolean
        unique?: boolean
      }>
    }>
  }
  apis: {
    integrations: Array<{
      name: string
      enabled: boolean
    }>
  }
  workflows: Array<{
    name: string
    description: string
  }>
  ui: {
    pages: Array<{
      name: string
      path: string
      components: Array<{
        type: string
        dataSource: string
        actions?: string[]
        mode?: string
      }>
    }>
  }
}

// Generate a truly custom Next.js application based on YAML
async function generateCustomNextJSApp(config: YamlConfig, appName: string, outputDir: string) {
  console.log('🚀 Generating custom application based on YAML configuration...')
  
  // Create app structure
  const appDir = path.join(outputDir, 'app')
  const componentsDir = path.join(outputDir, 'components')
  const libDir = path.join(outputDir, 'lib')
  const prismaDir = path.join(outputDir, 'prisma')
  const apiDir = path.join(appDir, 'api')

  await fs.mkdir(appDir, { recursive: true })
  await fs.mkdir(componentsDir, { recursive: true })
  await fs.mkdir(libDir, { recursive: true })
  await fs.mkdir(prismaDir, { recursive: true })
  await fs.mkdir(apiDir, { recursive: true })

  // Generate custom Prisma schema based on YAML models
  await generateCustomPrismaSchema(config, prismaDir)
  
  // Generate custom app layout
  await generateCustomAppLayout(config, appDir)
  
  // Generate custom main page
  await generateCustomMainPage(config, appDir)
  
  // Generate custom dashboard components
  await generateCustomDashboardComponents(config, componentsDir)
  
  // Generate custom API routes
  await generateCustomAPIRoutes(config, apiDir)
  
  // Generate custom data pages
  await generateCustomDataPages(config, appDir)
  
  // Generate custom utility files
  await generateCustomUtilityFiles(config, libDir)
  
  // Generate authentication system
  await generateAuthenticationSystem(config, outputDir)
  
  // Generate integration configurations
  await generateIntegrationConfig(config, outputDir)
  
  // Generate package.json with business-specific dependencies
  await generateCustomPackageJson(config, outputDir)
  
  // Generate environment configuration
  await generateEnvironmentConfig(config, outputDir)
  
  // Generate deployment configuration
  await generateDeploymentConfig(config, outputDir)
  
  // Generate custom README
  await generateCustomREADME(config, outputDir)
  
  console.log('✅ Custom application generation completed!')
}

// Generate custom Prisma schema based on YAML models
async function generateCustomPrismaSchema(config: YamlConfig, prismaDir: string) {
  const businessType = config.vertical.industry.toLowerCase()
  
  let schemaContent = `// This is your Prisma schema file
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

`

  // Add tenant and user models first
  schemaContent += `model Tenant {
  id String @id @default(cuid())
  name String
  slug String @unique
  status String @default("active")
  settings Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  users User[]
  ${config.database.models.map(model => `${model.name.toLowerCase()}s ${model.name}[]`).join('\n  ')}
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

// Generate models based on YAML configuration with tenant isolation
`
  config.database.models.forEach(model => {
    schemaContent += `model ${model.name} {
  id String @unique @id @default(cuid())
  tenantId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
`
    
    // Add custom fields from YAML
    model.fields.forEach(field => {
      if (field.name !== 'id' && field.name !== 'createdAt' && field.name !== 'updatedAt' && field.name !== 'tenantId') {
        const fieldType = convertFieldType(field.type, businessType)
        const uniqueConstraint = field.unique ? ' @unique' : ''
        schemaContent += `  ${field.name} ${fieldType}${uniqueConstraint}\n`
      }
    })
    
    // Add tenant relation
    schemaContent += `  
  // Relations
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
}\n\n`
  })

  await fs.writeFile(path.join(prismaDir, 'schema.prisma'), schemaContent)
  console.log('📊 Custom Prisma schema generated')
}

// Generate custom app layout
async function generateCustomAppLayout(config: YamlConfig, appDir: string) {
  const navigation = generateCustomNavigation(config, config.vertical.industry)
  
  const layoutContent = `import './globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '${config.business.name} - Management Dashboard',
  description: '${config.vertical.description}',
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
}`

  await fs.writeFile(path.join(appDir, 'layout.tsx'), layoutContent)
  console.log('🎨 Custom app layout generated')
}

// Generate custom main page
async function generateCustomMainPage(config: YamlConfig, appDir: string) {
  const businessType = config.vertical.industry.toLowerCase()
  
  let dashboardContent = `import { Suspense } from 'react'
import StatsOverview from '@/components/StatsOverview'
import RecentActivity from '@/components/RecentActivity'
import ChartWidget from '@/components/ChartWidget'
`

  // Add business-specific imports
  if (businessType === 'healthcare') {
    dashboardContent += `import ComplianceOverview from '@/components/ComplianceOverview'
import MedicalDeviceStatus from '@/components/MedicalDeviceStatus'
`
  } else if (businessType === 'ecommerce') {
    dashboardContent += `import SalesOverview from '@/components/SalesOverview'
import InventoryStatus from '@/components/InventoryStatus'
`
  } else if (businessType === 'real_estate') {
    dashboardContent += `import PropertyOverview from '@/components/PropertyOverview'
import TransactionStatus from '@/components/TransactionStatus'
`
  }

  dashboardContent += `
export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">${config.business.name} Dashboard</h1>
        <p className="text-gray-600 mt-2">${config.vertical.description}</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsOverview />
`

  // Add business-specific components
  if (businessType === 'healthcare') {
    dashboardContent += `          <ComplianceOverview />
          <MedicalDeviceStatus />
`
  } else if (businessType === 'ecommerce') {
    dashboardContent += `          <SalesOverview />
          <InventoryStatus />
`
  } else if (businessType === 'real_estate') {
    dashboardContent += `          <PropertyOverview />
          <TransactionStatus />
`
  }

  dashboardContent += `        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWidget />
          <RecentActivity />
        </div>
      </Suspense>
    </div>
  )
}`

  await fs.writeFile(path.join(appDir, 'page.tsx'), dashboardContent)
  console.log('📄 Custom main page generated')
}

// Generate custom dashboard components
async function generateCustomDashboardComponents(config: YamlConfig, componentsDir: string) {
  const businessType = config.vertical.industry.toLowerCase()
  const navigation = generateCustomNavigation(config, businessType)
  
  // Generate custom sidebar
  const sidebarContent = `'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ${navigation.map(nav => nav.icon).join(', ')} } from 'lucide-react'

const navigation = [
${navigation.map(nav => `  { name: '${nav.name}', href: '${nav.href}', icon: ${nav.icon} }`).join(',\n')}
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-xl font-bold text-white">${config.business.name}</h1>
      </div>
      <nav className="flex flex-1 flex-col px-6 pb-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={\`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold \${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }\`}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}`

  await fs.writeFile(path.join(componentsDir, 'Sidebar.tsx'), sidebarContent)

  // Generate business-specific components
  if (businessType === 'healthcare') {
    await generateHealthcareComponents(componentsDir)
  } else if (businessType === 'ecommerce') {
    await generateEcommerceComponents(componentsDir)
  } else if (businessType === 'real_estate') {
    await generateRealEstateComponents(componentsDir)
  }

  // Generate generic components
  await generateGenericComponents(componentsDir)
  
  console.log('🧩 Custom dashboard components generated')
}

// Generate healthcare-specific components
async function generateHealthcareComponents(componentsDir: string) {
  const complianceOverview = `'use client'

import { useEffect, useState } from 'react'
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'

export default function ComplianceOverview() {
  const [complianceData, setComplianceData] = useState({
    totalDevices: 0,
    compliantDevices: 0,
    pendingCertifications: 0,
    expiredCertifications: 0
  })

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Shield className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Compliance Status
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {complianceData.compliantDevices}/{complianceData.totalDevices} Devices
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className="text-red-600 font-medium">{complianceData.expiredCertifications} Expired</span>
          <span className="mx-2">•</span>
          <span className="text-yellow-600 font-medium">{complianceData.pendingCertifications} Pending</span>
        </div>
      </div>
    </div>
  )
}`

  await fs.writeFile(path.join(componentsDir, 'ComplianceOverview.tsx'), complianceOverview)
}

// Generate ecommerce-specific components
async function generateEcommerceComponents(componentsDir: string) {
  const salesOverview = `'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, ShoppingCart } from 'lucide-react'

export default function SalesOverview() {
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    conversionRate: 0
  })

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DollarSign className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Revenue
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                $0
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className="text-green-600 font-medium">0 Orders</span>
          <span className="mx-2">•</span>
          <span className="text-blue-600 font-medium">$0 Avg Order</span>
        </div>
      </div>
    </div>
  )
}`

  await fs.writeFile(path.join(componentsDir, 'SalesOverview.tsx'), salesOverview)
}

// Generate real estate-specific components
async function generateRealEstateComponents(componentsDir: string) {
  const propertyOverview = `'use client'

import { useEffect, useState } from 'react'
import { Home, MapPin, DollarSign } from 'lucide-react'

export default function PropertyOverview() {
  const [propertyData, setPropertyData] = useState({
    totalProperties: 0,
    activeListings: 0,
    totalValue: 0,
    averagePrice: 0
  })

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Home className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Active Listings
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {propertyData.activeListings} Properties
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className="text-green-600 font-medium">$0 Total Value</span>
          <span className="mx-2">•</span>
          <span className="text-blue-600 font-medium">$0 Avg Price</span>
        </div>
      </div>
    </div>
  )
}`

  await fs.writeFile(path.join(componentsDir, 'PropertyOverview.tsx'), propertyOverview)
}

// Generate generic components
async function generateGenericComponents(componentsDir: string) {
  const statsOverview = `'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, Activity, DollarSign } from 'lucide-react'

export default function StatsOverview() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalOrders: 0,
    growthRate: 0
  })

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingUp className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                Growth Rate
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {stats.growthRate}%
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}`

  const recentActivity = `'use client'

import { useEffect, useState } from 'react'

export default function RecentActivity() {
  const [activities, setActivities] = useState([])

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Recent Activity
        </h3>
        <div className="mt-5">
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {activities.length === 0 ? (
                <li className="text-gray-500 text-sm">No recent activity</li>
              ) : (
                activities.map((activity, index) => (
                  <li key={index} className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                          <span className="text-white text-sm">•</span>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.description}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}`

  const chartWidget = `'use client'

import { useEffect, useState } from 'react'

export default function ChartWidget() {
  const [chartData, setChartData] = useState([])

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Analytics Overview
        </h3>
        <div className="mt-5">
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart visualization will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  )
}`

  await fs.writeFile(path.join(componentsDir, 'StatsOverview.tsx'), statsOverview)
  await fs.writeFile(path.join(componentsDir, 'RecentActivity.tsx'), recentActivity)
  await fs.writeFile(path.join(componentsDir, 'ChartWidget.tsx'), chartWidget)
}

// Generate custom API routes
async function generateCustomAPIRoutes(config: YamlConfig, apiDir: string) {
  // Generate API routes for each model with tenant isolation
  for (const model of config.database.models) {
    const apiRoute = `import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get tenant ID from headers (set by middleware)
    const tenantId = request.headers.get('x-tenant-id')
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }
    
    const ${model.name.toLowerCase()}s = await prisma.${model.name.toLowerCase()}.findMany({
      where: { tenantId },
      include: {
        tenant: {
          select: { name: true, slug: true }
        }
      }
    })
    return NextResponse.json(${model.name.toLowerCase()}s)
  } catch (error) {
    console.error('Error fetching ${model.name}s:', error)
    return NextResponse.json({ error: 'Failed to fetch ${model.name}s' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get tenant ID from headers (set by middleware)
    const tenantId = request.headers.get('x-tenant-id')
    const userId = request.headers.get('x-user-id')
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }
    
    const data = await request.json()
    
    // Ensure tenant isolation
    const ${model.name.toLowerCase()} = await prisma.${model.name.toLowerCase()}.create({
      data: {
        ...data,
        tenantId // Always set tenant ID
      },
      include: {
        tenant: {
          select: { name: true, slug: true }
        }
      }
    })
    return NextResponse.json(${model.name.toLowerCase()})
  } catch (error) {
    console.error('Error creating ${model.name}:', error)
    return NextResponse.json({ error: 'Failed to create ${model.name}' }, { status: 500 })
  }
}`

    const modelApiDir = path.join(apiDir, model.name.toLowerCase() + 's')
    await fs.mkdir(modelApiDir, { recursive: true })
    await fs.writeFile(path.join(modelApiDir, 'route.ts'), apiRoute)
  }
  
  // Generate tenant management API
  const tenantApiRoute = `import { NextRequest, NextResponse } from 'next/server'
import { TenantManager } from '@opsai/multi-tenant'
import { AuthService } from '@opsai/auth'

const tenantManager = TenantManager.getInstance(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { name, slug } = await request.json()
    
    const tenant = await tenantManager.createTenant({
      name,
      slug,
      status: 'active',
      settings: {
        timezone: 'UTC',
        currency: 'USD',
        language: 'en'
      },
      config: {} // Will be set later
    })
    
    // Setup tenant database schema
    await tenantManager.setupTenantDatabase(tenant.id, {} as any)
    
    // Enable row-level security
    await tenantManager.enableRLS(tenant.id)
    
    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id')
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
    }
    
    const tenant = await tenantManager.getTenant(tenantId)
    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 })
  }
}`
  
  const tenantApiDir = path.join(apiDir, 'tenants')
  await fs.mkdir(tenantApiDir, { recursive: true })
  await fs.writeFile(path.join(tenantApiDir, 'route.ts'), tenantApiRoute)
  
  // Generate auth API routes
  const authApiRoute = `import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@opsai/auth'
import { TenantManager } from '@opsai/multi-tenant'

const authService = new AuthService({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  jwtSecret: process.env.JWT_SECRET!
})

const tenantManager = TenantManager.getInstance(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()
    
    switch (action) {
      case 'login':
        const loginResult = await authService.login(data)
        return NextResponse.json(loginResult)
        
      case 'register':
        const registerResult = await authService.register(data)
        return NextResponse.json(registerResult)
        
      case 'logout':
        await authService.logout(data.token)
        return NextResponse.json({ success: true })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}`
  
  const authApiDir = path.join(apiDir, 'auth')
  await fs.mkdir(authApiDir, { recursive: true })
  await fs.writeFile(path.join(authApiDir, 'route.ts'), authApiRoute)

  console.log('🔌 Custom API routes generated')
}

// Generate custom data pages
async function generateCustomDataPages(config: YamlConfig, appDir: string) {
  for (const model of config.database.models) {
    const modelPage = `'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2 } from 'lucide-react'

interface ${model.name} {
  id: string
  ${model.fields.map(field => `${field.name}: ${field.type === 'DateTime' ? 'string' : 'string'}`).join('\n  ')}
}

export default function ${model.name}List() {
  const [${model.name.toLowerCase()}s, set${model.name}s] = useState<${model.name}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/${model.name.toLowerCase()}s')
      .then(res => res.json())
      .then(data => {
        set${model.name}s(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching ${model.name}s:', error)
        setLoading(false)
      })
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this ${model.name}?')) {
      try {
        await fetch(\`/api/${model.name.toLowerCase()}s/\${id}\`, { method: 'DELETE' })
        set${model.name}s(${model.name.toLowerCase()}s.filter(item => item.id !== id))
      } catch (error) {
        console.error('Error deleting ${model.name}:', error)
      }
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">${model.name}s</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your ${model.name}s
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/${model.name.toLowerCase()}s/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add ${model.name}
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-my-2 -mx-6 overflow-x-auto lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    ${model.fields.map(field => `<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        ${field.name}
                      </th>`).join('\n                    ')}
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {${model.name.toLowerCase()}s.map((${model.name.toLowerCase()}) => (
                    <tr key={${model.name.toLowerCase()}.id}>
                      ${model.fields.map(field => `<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {${model.name.toLowerCase()}.${field.name}}
                        </td>`).join('\n                      ')}
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleDelete(${model.name.toLowerCase()}.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}`

    const modelPageDir = path.join(appDir, model.name.toLowerCase() + 's')
    await fs.mkdir(modelPageDir, { recursive: true })
    await fs.writeFile(path.join(modelPageDir, 'page.tsx'), modelPage)
  }

  console.log('📄 Custom data pages generated')
}

// Generate custom utility files
async function generateCustomUtilityFiles(config: YamlConfig, libDir: string) {
  const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`

  await fs.writeFile(path.join(libDir, 'globals.css'), globalsCss)
  console.log('🎨 Custom utility files generated')
}

// Generate custom package.json
async function generateCustomPackageJson(config: YamlConfig, outputDir: string) {
  const businessType = config.vertical.industry.toLowerCase()
  
  let dependencies: Record<string, string> = {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@prisma/client": "^5.0.0",
    "lucide-react": "^0.263.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    // OpsAI Core packages
    "@opsai/auth": "workspace:*",
    "@opsai/integration": "workspace:*",
    "@opsai/database": "workspace:*",
    "@opsai/ui": "workspace:*",
    "@opsai/shared": "workspace:*",
    "@supabase/supabase-js": "^2.39.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3"
  }

  // Add business-specific dependencies
  if (businessType === 'healthcare') {
    dependencies = {
      ...dependencies,
      "chart.js": "^4.0.0",
      "react-chartjs-2": "^5.0.0",
      "date-fns": "^2.30.0"
    }
  } else if (businessType === 'ecommerce') {
    dependencies = {
      ...dependencies,
      "stripe": "^12.0.0",
      "react-hook-form": "^7.45.0",
      "zod": "^3.22.0"
    }
  } else if (businessType === 'real_estate') {
    dependencies = {
      ...dependencies,
      "leaflet": "^1.9.0",
      "react-leaflet": "^4.2.0",
      "react-datepicker": "^4.16.0"
    }
  }

  const packageJson = {
    name: config.vertical.name.toLowerCase().replace(/\s+/g, '-'),
    version: "1.0.0",
    private: true,
    scripts: {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "db:generate": "prisma generate",
      "db:push": "prisma db push"
    },
    dependencies,
    devDependencies: {
      "typescript": "^5.0.0",
      "@types/node": "^20.0.0",
      "@types/react": "^18.0.0",
      "@types/react-dom": "^18.0.0",
      "prisma": "^5.0.0",
      "eslint": "^8.0.0",
      "eslint-config-next": "^14.0.0"
    }
  }

  await fs.writeFile(path.join(outputDir, 'package.json'), JSON.stringify(packageJson, null, 2))
  console.log('📦 Custom package.json generated')
}

// Generate custom README
async function generateCustomREADME(config: YamlConfig, outputDir: string) {
  const readmeContent = `# ${config.business.name}

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

${config.database.models.map(model => `- ${model.name}`).join('\n')}

## API Endpoints

${config.database.models.map(model => `- \`/api/${model.name.toLowerCase()}s\` - CRUD operations for ${model.name}`).join('\n')}

Generated by OPSAI on ${new Date().toISOString()}
`

  await fs.writeFile(path.join(outputDir, 'README.md'), readmeContent)
  console.log('📖 Custom README generated')
}

// Generate authentication system
async function generateAuthenticationSystem(config: YamlConfig, outputDir: string) {
  const authDir = path.join(outputDir, 'app', 'auth')
  const middlewareDir = path.join(outputDir, 'middleware')
  
  await fs.mkdir(authDir, { recursive: true })
  await fs.mkdir(middlewareDir, { recursive: true })
  
  // Generate login page
  const loginPage = `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@opsai/auth'
import { Card } from '@opsai/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  
  const authService = new AuthService({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    jwtSecret: process.env.JWT_SECRET!
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authService.login({ email, password })
      if (response.token) {
        localStorage.setItem('auth_token', response.token)
        router.push('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Login to ${config.business.name}</h1>
        
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
        
        <p className="text-center mt-4 text-sm text-gray-600">
          Don't have an account? <a href="/auth/register" className="text-blue-600 hover:underline">Register</a>
        </p>
      </Card>
    </div>
  )
}`
  
  await fs.writeFile(path.join(authDir, 'login', 'page.tsx'), loginPage)
  
  // Generate register page
  const registerPage = `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@opsai/auth'
import { Card } from '@opsai/ui'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    tenantName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  
  const authService = new AuthService({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    jwtSecret: process.env.JWT_SECRET!
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create tenant first
      const tenantId = await createTenant(formData.tenantName)
      
      // Register user with tenant
      const response = await authService.register({
        ...formData,
        tenantId,
        role: 'admin'
      })
      
      if (response.token) {
        localStorage.setItem('auth_token', response.token)
        router.push('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }
  
  const createTenant = async (name: string): Promise<string> => {
    // This would call the tenant creation API
    const response = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug: name.toLowerCase().replace(/\s+/g, '-') })
    })
    const data = await response.json()
    return data.id
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Create Your Account</h1>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              value={formData.tenantName}
              onChange={(e) => setFormData({...formData, tenantName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        
        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account? <a href="/auth/login" className="text-blue-600 hover:underline">Login</a>
        </p>
      </Card>
    </div>
  )
}`
  
  await fs.mkdir(path.join(authDir, 'register'), { recursive: true })
  await fs.writeFile(path.join(authDir, 'register', 'page.tsx'), registerPage)
  
  // Generate middleware for auth protection
  const middleware = `import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@opsai/auth/utils/jwt-utils'

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
  
  try {
    // Verify token
    const decoded = verifyToken(token, process.env.JWT_SECRET!)
    
    // Add user info to headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', decoded.userId)
    response.headers.set('x-tenant-id', decoded.tenantId)
    
    return response
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}`
  
  await fs.writeFile(path.join(outputDir, 'middleware.ts'), middleware)
  
  console.log('🔐 Authentication system generated')
}

// Generate integration configuration
async function generateIntegrationConfig(config: YamlConfig, outputDir: string) {
  const integrationsDir = path.join(outputDir, 'lib', 'integrations')
  await fs.mkdir(integrationsDir, { recursive: true })
  
  // Generate Airbyte integration
  const airbyteIntegration = `import { createAirbyteConnector } from '@opsai/integration'
import { prisma } from '@opsai/database'

export class DataSyncService {
  private airbyte = createAirbyteConnector({
    apiKey: process.env.AIRBYTE_API_KEY,
    baseUrl: process.env.AIRBYTE_BASE_URL || 'http://localhost:8000',
    workspaceId: process.env.AIRBYTE_WORKSPACE_ID
  })
  
  async syncDataSource(sourceConfig: any, tenantId: string) {
    try {
      // Create Airbyte source
      const source = await this.airbyte.execute('create_source', {
        name: \`\${tenantId}-\${sourceConfig.name}\`,
        sourceType: sourceConfig.type,
        configuration: sourceConfig.config
      })
      
      // Create destination (our database)
      const destination = await this.airbyte.execute('create_destination', {
        name: \`\${tenantId}-database\`,
        destinationType: 'postgres',
        configuration: {
          host: process.env.DATABASE_URL,
          database: \`tenant_\${tenantId}\`,
          schema: 'synced_data'
        }
      })
      
      // Create connection
      const connection = await this.airbyte.execute('create_connection', {
        sourceId: source.sourceId,
        destinationId: destination.destinationId,
        schedule: { timeUnit: 'hours', units: 1 }
      })
      
      // Trigger initial sync
      const syncJob = await this.airbyte.execute('trigger_sync', {
        connectionId: connection.connectionId
      })
      
      // Save sync configuration
      await prisma.integration.create({
        data: {
          tenantId,
          provider: sourceConfig.type,
          connectionId: connection.connectionId,
          status: 'active',
          config: sourceConfig
        }
      })
      
      return { success: true, syncJobId: syncJob.jobId }
    } catch (error) {
      console.error('Sync failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  async getSyncStatus(jobId: string) {
    return this.airbyte.execute('get_sync_status', { jobId })
  }
}`
  
  await fs.writeFile(path.join(integrationsDir, 'data-sync.ts'), airbyteIntegration)
  
  // Generate API integrations based on business type
  const integrations = config.apis?.integrations || []
  for (const integration of integrations) {
    if (integration.enabled) {
      const integrationCode = generateIntegrationCode(integration.name, config.vertical.industry)
      await fs.writeFile(
        path.join(integrationsDir, integration.name + '-integration.ts'),
        integrationCode
      )
    }
  }
  
  console.log('🔌 Integration configurations generated')
}

// Helper function to generate integration code
function generateIntegrationCode(integrationName: string, businessType: string): string {
  const integrationMap: Record<string, string> = {
    'stripe': `import Stripe from 'stripe'

export class StripeIntegration {
  private stripe: Stripe
  
  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' })
  }
  
  async createCustomer(email: string, name: string) {
    return this.stripe.customers.create({ email, name })
  }
  
  async createPaymentIntent(amount: number, currency: string = 'usd') {
    return this.stripe.paymentIntents.create({ amount, currency })
  }
  
  async createSubscription(customerId: string, priceId: string) {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }]
    })
  }
}\`,
    'quickbooks': \`import { OAuthManager } from '@opsai/integration/auth'

export class QuickBooksIntegration {
  private oauth: OAuthManager
  
  constructor() {
    this.oauth = new OAuthManager('quickbooks')
  }
  
  async connect(tenantId: string) {
    return this.oauth.getAuthorizationUrl(tenantId)
  }
  
  async syncInvoices(accessToken: string) {
    // QuickBooks invoice sync logic
  }
}\`,
    'shopify': \`import { RestConnector } from '@opsai/integration'

export class ShopifyIntegration {
  private connector: RestConnector
  
  constructor(shop: string, accessToken: string) {
    this.connector = new RestConnector({
      baseURL: \`https://\${shop}.myshopify.com/admin/api/2024-01\`,
      headers: { 'X-Shopify-Access-Token': accessToken }
    })
  }
  
  async getProducts() {
    return this.connector.get('/products.json')
  }
  
  async getOrders() {
    return this.connector.get('/orders.json')
  }
}\`
  }
  
  return integrationMap[integrationName] || \`// \${integrationName} integration placeholder\`
}

// Generate environment configuration
async function generateEnvironmentConfig(config: YamlConfig, outputDir: string) {
  const envExample = `# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db"

# Authentication
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
JWT_SECRET="your-jwt-secret-key"

# App Configuration
NEXT_PUBLIC_APP_NAME="${config.business.name}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"`

  await fs.writeFile(path.join(outputDir, '.env.example'), envExample)
  console.log('🌍 Environment configuration generated')
}

// Generate deployment configuration
async function generateDeploymentConfig(config: YamlConfig, outputDir: string) {
  const vercelConfig = {
    "name": config.business.name.toLowerCase().replace(/\s+/g, '-'),
    "framework": "nextjs",
    "buildCommand": "npm run build",
    "outputDirectory": ".next",
    "installCommand": "npm install",
    "devCommand": "npm run dev"
  }
  
  await fs.writeFile(path.join(outputDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2))
  console.log('🚀 Deployment configuration generated')
}

export async function POST(request: NextRequest) {
  try {
    const { yamlConfig, appName } = await request.json()

    if (!yamlConfig || !appName) {
      return NextResponse.json(
        { error: 'Missing yamlConfig or appName' },
        { status: 400 }
      )
    }

    // Parse and validate YAML configuration
    let config: YamlConfig
    try {
      console.log('🔍 Parsing YAML config:', yamlConfig.substring(0, 500))
      
      // Try to parse the YAML config as YAML first
      let parsedConfig
      try {
        // Import yaml parser
        const yaml = require('js-yaml')
        parsedConfig = yaml.load(yamlConfig)
        console.log('✅ Successfully parsed YAML')
      } catch (yamlError) {
        console.log('❌ YAML parse failed, trying JSON fallback')
        // If YAML parsing fails, the yamlConfig might already be JSON
        parsedConfig = JSON.parse(yamlConfig)
      }
      
      console.log('📊 Parsed config structure:', JSON.stringify(parsedConfig, null, 2).substring(0, 1000))
      
      // Validate the parsed configuration using Zod
      const validationResult = validateYamlConfigSafe(parsedConfig)
      if (!validationResult.success) {
        console.error('❌ YAML validation failed:', validationResult.errors)
        return NextResponse.json(
          { 
            error: 'Invalid YAML configuration',
            details: validationResult.errors
          },
          { status: 400 }
        )
      }
      
      config = validationResult.data!
      console.log('✅ YAML validation successful')
      console.log('🎯 Final config for app generation:', JSON.stringify(config, null, 2).substring(0, 1000))
    } catch (parseError) {
      console.error('Config parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid YAML configuration' },
        { status: 400 }
      )
    }

    // Create output directory
    const timestamp = Date.now()
    const sanitizedAppName = appName.toLowerCase().replace(/\s+/g, '-')
    const outputDir = path.join(process.cwd(), 'generated-apps', sanitizedAppName + '-' + timestamp)
    
    await fs.mkdir(outputDir, { recursive: true })

    // Generate the complete custom Next.js application
    await generateCustomNextJSApp(config, appName, outputDir)

    // Auto-start the generated application
    const port = 3000 + Math.floor(Math.random() * 1000)
    console.log('🚀 Auto-starting ' + appName + ' on port ' + port + '...')
    
    try {
      // Install dependencies
      console.log('📦 Installing dependencies...')
      await execAsync('npm install', { cwd: outputDir })
      
      // Set up database
      console.log('💾 Setting up database...')
      await execAsync('npm run db:generate', { cwd: outputDir })
      await execAsync('npm run db:push', { cwd: outputDir })
      
      // Start the application
      console.log('🚀 Starting application on port ' + port + '...')
      execAsync('npm run dev -- -p ' + port, { cwd: outputDir })
        .then(() => console.log('✅ Application started successfully on port ' + port))
        .catch((error) => console.error('❌ Failed to start application:', error))
      
    } catch (error) {
      console.error('Auto-setup error:', error)
    }

    return NextResponse.json({
      success: true,
      appName,
      outputDir,
      port,
      message: 'Application generated successfully! Access it at http://localhost:' + port
    })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate application' },
      { status: 500 }
    )
  }
}

// Generate environment configuration
async function generateEnvironmentConfig(config: YamlConfig, outputDir: string) {
  const envExample = `# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db"

# Authentication
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
JWT_SECRET="your-jwt-secret-key"

# App Configuration
NEXT_PUBLIC_APP_NAME="${config.business.name}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"`

  await fs.writeFile(path.join(outputDir, '.env.example'), envExample)
  console.log('🌍 Environment configuration generated')
}

// Generate deployment configuration
async function generateDeploymentConfig(config: YamlConfig, outputDir: string) {
  const vercelConfig = {
    "name": config.business.name.toLowerCase().replace(/\s+/g, '-'),
    "framework": "nextjs",
    "buildCommand": "npm run build",
    "outputDirectory": ".next",
    "installCommand": "npm install",
    "devCommand": "npm run dev"
  }
  
  await fs.writeFile(path.join(outputDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2))
  console.log('🚀 Deployment configuration generated')
}

// Generate integration code
function generateIntegrationCode(integrationName: string, businessType: string): string {
  return `// ${integrationName} integration for ${businessType}
export class ${integrationName}Integration {
  constructor(config: any) {
    // Integration configuration
  }
  
  async connect(): Promise<any> {
    // Connection logic
    return { success: true }
  }
  
  async sync(): Promise<any> {
    // Sync logic
    return { success: true, data: [] }
  }
}`
}

export async function GET() {
  return NextResponse.json({
    message: 'App generation API is running',
    endpoints: {
      POST: '/api/generate - Generate a new application from YAML config'
    }
  })
}