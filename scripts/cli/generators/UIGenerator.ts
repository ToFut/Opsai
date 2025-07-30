import * as fs from 'fs';
import * as path from 'path';
import { AppConfig, Entity } from './ConfigParser';

export interface UIConfig {
  theme?: {
    primary_color?: string;
    secondary_color?: string;
    logo?: string;
    font?: string;
  };
  pages?: UIPage[];
  components?: UIComponent[];
  layout?: {
    header?: boolean;
    sidebar?: boolean;
    footer?: boolean;
  };
  features?: {
    authentication?: boolean;
    dashboard?: boolean;
    notifications?: boolean;
    search?: boolean;
  };
}

export interface UIPage {
  name: string;
  path: string;
  title?: string;
  components?: UIComponent[];
  layout?: string;
  permissions?: string[];
}

export interface UIComponent {
  type: string;
  name?: string;
  props?: Record<string, any>;
  data_source?: string;
  columns?: UIColumn[];
  actions?: UIAction[];
}

export interface UIColumn {
  field: string;
  label: string;
  type?: string;
  sortable?: boolean;
  filterable?: boolean;
}

export interface UIAction {
  label: string;
  action: string;
  target?: string;
  component?: string;
  permissions?: string[];
}

export class UIGenerator {
  private config: AppConfig;
  private uiConfig: UIConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.uiConfig = config.ui || {};
  }

  async generateUI(outputDir: string): Promise<void> {
    const uiDir = path.join(outputDir, 'ui');
    
    // Generate Next.js application structure using @opsai/ui
    await this.generateNextJSStructure(uiDir);
    
    // Generate base components FIRST
    await this.generateComponents(uiDir);
    
    // Generate pages from config
    await this.generatePages(uiDir);
    
    // Generate layouts
    await this.generateLayouts(uiDir);
    
    // Generate authentication if enabled
    if (this.uiConfig.features?.authentication) {
      await this.generateAuthComponents(uiDir);
    }
    
    // Generate configuration files
    await this.generateUIConfig(uiDir);
    
    console.log('✅ UI layer generated using @opsai/ui components');
  }

  private async generateNextJSStructure(uiDir: string): Promise<void> {
    // Create directory structure
    const dirs = [
      'app',
      'components',
      'components/ui',
      'components/forms',
      'components/tables',
      'lib',
      'public',
      'styles',
      'types'
    ];

    dirs.forEach(dir => {
      fs.mkdirSync(path.join(uiDir, dir), { recursive: true });
    });

    // Generate package.json with @opsai packages
    const packageJson = {
      name: `${this.config.app.name}-ui`,
      version: this.config.app.version || '1.0.0',
      description: `${this.config.app.displayName} - Frontend Application`,
      scripts: {
        dev: 'next dev -p 3001',
        build: 'next build',
        start: 'next start -p 3001',
        lint: 'next lint',
        'type-check': 'tsc --noEmit'
      },
      dependencies: {
        // React & Next.js core
        // Next.js and React
        'next': '^14.0.0',
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
        // Data fetching and state management
        '@tanstack/react-query': '^5.0.0',
        '@tanstack/react-table': '^8.0.0',
        'axios': '^1.6.0',
        // UI and styling
        'tailwindcss': '^3.3.0',
        'lucide-react': '^0.294.0',
        '@heroicons/react': '^2.0.0',
        'clsx': '^2.0.0',
        'tailwind-merge': '^2.0.0',
        // Forms and validation
        'react-hook-form': '^7.47.0',
        '@hookform/resolvers': '^3.3.0',
        'zod': '^3.22.0',
        // Radix UI components (used by @opsai/ui)
        '@radix-ui/react-dialog': '^1.0.5',
        '@radix-ui/react-dropdown-menu': '^2.0.6',
        '@radix-ui/react-select': '^2.0.0',
        '@radix-ui/react-toast': '^1.1.5',
        // Utilities
        'date-fns': '^2.30.0',
        'recharts': '^2.8.0',
        'react-hot-toast': '^2.4.0'
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        'typescript': '^5.3.0',
        'eslint': '^8.0.0',
        'eslint-config-next': '^14.0.0',
        'autoprefixer': '^10.4.0',
        'postcss': '^8.4.0'
      }
    };

    fs.writeFileSync(
      path.join(uiDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Generate Next.js config
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig`;

    fs.writeFileSync(path.join(uiDir, 'next.config.js'), nextConfig);

    // Generate Tailwind config
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '${this.uiConfig.theme?.primary_color || '#1e40af'}',
        secondary: '${this.uiConfig.theme?.secondary_color || '#64748b'}',
      },
    },
  },
  plugins: [],
}`;

    fs.writeFileSync(path.join(uiDir, 'tailwind.config.js'), tailwindConfig);

    // Generate TypeScript config
    const tsConfig = {
      compilerOptions: {
        target: 'es5',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
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
    };

    fs.writeFileSync(
      path.join(uiDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    console.log('📁 Generated Next.js project structure');
  }

  private async generatePages(uiDir: string): Promise<void> {
    // Generate root layout
    const layoutContent = this.generateRootLayout();
    fs.writeFileSync(path.join(uiDir, 'app', 'layout.tsx'), layoutContent);

    // Generate main page
    const pageContent = this.generateMainPage();
    fs.writeFileSync(path.join(uiDir, 'app', 'page.tsx'), pageContent);

    // Generate dashboard if specified
    if (this.uiConfig.features?.dashboard) {
      const dashboardContent = this.generateDashboardPage();
      fs.mkdirSync(path.join(uiDir, 'app', 'dashboard'), { recursive: true });
      fs.writeFileSync(path.join(uiDir, 'app', 'dashboard', 'page.tsx'), dashboardContent);
    }

    // Generate pages for each entity
    for (const entity of this.config.database.entities) {
      await this.generateEntityPages(uiDir, entity);
    }

    // Generate custom pages from config
    if (this.uiConfig.pages) {
      for (const page of this.uiConfig.pages) {
        await this.generateCustomPage(uiDir, page);
      }
    }

    console.log('📄 Generated UI pages');
  }

  private generateRootLayout(): string {
    return `import './globals.css'

export const metadata = {
  title: '${this.config.app.displayName}',
  description: '${this.config.app.description}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold">🏠 ${this.config.app.displayName}</span>
                </div>
                <div className="flex space-x-4">
                  <a href="/" className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600">Home</a>
                  ${this.config.database.entities.map(entity => 
                    `<a href="/${entity.name}" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">${entity.displayName}</a>`
                  ).join('\n                  ')}
                </div>
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}`;
  }

  private generateMainPage(): string {
    return `export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🚀 ${this.config.app.displayName}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          ${this.config.app.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${this.config.database.entities.map(entity => `
        <div className="p-6 bg-white rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-2">${entity.displayName}</h3>
          <p className="text-3xl font-bold text-blue-600 mb-4">0</p>
          <a href="/${entity.name}" className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Manage ${entity.displayName}
          </a>
        </div>`).join('')}
      </div>
      
      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🎉 Platform Features</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>✅ Enterprise Authentication</div>
          <div>✅ Workflow Engine (BullMQ + Temporal)</div>
          <div>✅ Alert System</div>
          <div>✅ API Integrations</div>
          <div>✅ Multi-tenant Architecture</div>
          <div>✅ Airbyte Fallback</div>
        </div>
      </div>
    </div>
  )
}`;
  }

  private generateDashboardPage(): string {
    return `'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Chart } from '@/components/dashboard/chart'

export default function DashboardPage() {
  const [data, setData] = useState<any>({})

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${this.config.database.entities.map(entity => `
        <StatsCard
          title="${entity.displayName}"
          value={data.${entity.name}?.total || 0}
          change={data.${entity.name}?.change || 0}
          href="/${entity.name}"
        />`).join('')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Overview</h3>
          <Chart data={data.activity || []} />
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-2">
            {(data.recent || []).map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{item.description}</span>
                <span className="text-sm text-gray-500">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}`;
  }

  private async generateEntityPages(uiDir: string, entity: Entity): Promise<void> {
    const entityDir = path.join(uiDir, 'app', entity.name);
    fs.mkdirSync(entityDir, { recursive: true });

    // List page
    const listContent = this.generateEntityListPage(entity);
    fs.writeFileSync(path.join(entityDir, 'page.tsx'), listContent);

    // Detail page
    fs.mkdirSync(path.join(entityDir, '[id]'), { recursive: true });
    const detailContent = this.generateEntityDetailPage(entity);
    fs.writeFileSync(path.join(entityDir, '[id]', 'page.tsx'), detailContent);

    // Create page
    fs.mkdirSync(path.join(entityDir, 'new'), { recursive: true });
    const createContent = this.generateEntityCreatePage(entity);
    fs.writeFileSync(path.join(entityDir, 'new', 'page.tsx'), createContent);
  }

  private generateEntityListPage(entity: Entity): string {
    return `'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '@/components/tables/data-table'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Plus } from '@heroicons/react/24/outline'

export default function ${entity.displayName}Page() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/${entity.name}')
      .then(res => res.json())
      .then(result => {
        setData(result.data || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Error:', error)
        setLoading(false)
      })
  }, [])

  const columns = [
    ${Object.entries(entity.fields).map(([fieldName, fieldConfig]: [string, any]) => `
    {
      accessorKey: '${fieldName}',
      header: '${fieldConfig.label || fieldName}',
      ${fieldConfig.type === 'date' ? "cell: ({ row }: any) => new Date(row.getValue('${fieldName}')).toLocaleDateString()," : ''}
    },`).join('')}
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Link href={\`/${entity.name}/\${row.original.id}\`}>
            <Button variant="outline" size="sm">View</Button>
          </Link>
          <Link href={\`/${entity.name}/\${row.original.id}/edit\`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">${entity.displayName}</h1>
        <Link href="/${entity.name}/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add ${entity.displayName}
          </Button>
        </Link>
      </div>

      <Card>
        <DataTable 
          columns={columns} 
          data={data} 
          loading={loading}
        />
      </Card>
    </div>
  )
}`;
  }

  private generateEntityDetailPage(entity: Entity): string {
    return `'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Edit } from '@heroicons/react/24/outline'

export default function ${entity.displayName}DetailPage() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetch(\`/api/${entity.name}/\${params.id}\`)
        .then(res => res.json())
        .then(result => {
          setData(result)
          setLoading(false)
        })
        .catch(error => {
          console.error('Error:', error)
          setLoading(false)
        })
    }
  }, [params.id])

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  if (!data) {
    return <div className="flex justify-center p-8">Not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/${entity.name}">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">${entity.displayName} Details</h1>
        </div>
        <Link href={\`/${entity.name}/\${params.id}/edit\`}>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${Object.entries(entity.fields).map(([fieldName, fieldConfig]: [string, any]) => `
          <div>
            <dt className="font-semibold text-gray-700">${fieldConfig.label || fieldName}</dt>
            <dd className="mt-1 text-gray-900">
              ${fieldConfig.type === 'date' ? 
                `{data.${fieldName} ? new Date(data.${fieldName}).toLocaleDateString() : '-'}` :
                `{data.${fieldName} || '-'}`
              }
            </dd>
          </div>`).join('')}
        </dl>
      </Card>
    </div>
  )
}`;
  }

  private generateEntityCreatePage(entity: Entity): string {
    return `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EntityForm } from '@/components/forms/${entity.name}-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Create${entity.displayName}Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/${entity.name}', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('${entity.displayName} created successfully')
        router.push('/${entity.name}')
      } else {
        toast.error('Failed to create ${entity.name}')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/${entity.name}">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create ${entity.displayName}</h1>
      </div>

      <Card className="p-6">
        <EntityForm 
          onSubmit={handleSubmit}
          loading={loading}
        />
      </Card>
    </div>
  )
}`;
  }

  private async generateCustomPage(uiDir: string, page: UIPage): Promise<void> {
    const pageDir = path.join(uiDir, 'app', ...page.path.split('/').filter(Boolean));
    fs.mkdirSync(pageDir, { recursive: true });

    const pageContent = `'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
${page.components?.map(comp => 
  comp.type === 'data_table' ? "import { DataTable } from '@/components/tables/data-table'" :
  comp.type === 'chart' ? "import { Chart } from '@/components/dashboard/chart'" :
  comp.type === 'stats_cards' ? "import { StatsCard } from '@/components/dashboard/stats-card'" :
  ""
).filter(Boolean).join('\n')}

export default function ${this.toPascalCase(page.name)}Page() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch page data
    Promise.all([
      ${page.components?.map(comp => 
        comp.data_source ? `fetch('/api/${comp.data_source}').then(res => res.json())` : 'Promise.resolve({})'
      ).join(',\n      ') || 'Promise.resolve({})'}
    ]).then(results => {
      setData({
        ${page.components?.map((comp, index) => 
          `${comp.data_source || `component${index}`}: results[${index}]`
        ).join(',\n        ') || ''}
      })
      setLoading(false)
    }).catch(error => {
      console.error('Error:', error)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">${page.title || page.name}</h1>
      
      ${page.components?.map(comp => {
        switch (comp.type) {
          case 'stats_cards':
            return `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(data.${comp.data_source} || []).map((stat: any, index: number) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>`;
          case 'data_table':
            return `<Card>
              <DataTable 
                columns={${JSON.stringify(comp.columns || [])}}
                data={data.${comp.data_source} || []}
                loading={loading}
              />
            </Card>`;
          case 'chart':
            return `<Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">${comp.name || 'Chart'}</h3>
              <Chart data={data.${comp.data_source} || []} type="${comp.props?.chart_type || 'line'}" />
            </Card>`;
          default:
            return `<Card className="p-6">
              <div>Component: ${comp.type}</div>
            </Card>`;
        }
      }).join('\n      ') || '<div>No components configured</div>'}
    </div>
  )
}`;

    fs.writeFileSync(path.join(pageDir, 'page.tsx'), pageContent);
  }

  private async generateComponents(uiDir: string): Promise<void> {
    // Generate base UI components
    await this.generateBaseComponents(uiDir);
    
    // Generate form components for each entity
    for (const entity of this.config.database.entities) {
      await this.generateEntityForm(uiDir, entity);
    }

    // Generate dashboard components
    await this.generateDashboardComponents(uiDir);

    console.log('🧩 Generated UI components');
  }

  private async generateBaseComponents(uiDir: string): Promise<void> {
    // Generate Button component
    const buttonComponent = `import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground shadow hover:bg-primary/90': variant === 'default',
            'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground': variant === 'outline',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          },
          {
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-9 px-4 py-2': size === 'default',
            'h-10 rounded-md px-8': size === 'lg',
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

export { Button }`;

    fs.writeFileSync(path.join(uiDir, 'components/ui/button.tsx'), buttonComponent);

    // Generate Card component
    const cardComponent = `import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

export { Card }`;

    fs.writeFileSync(path.join(uiDir, 'components/ui/card.tsx'), cardComponent);

    // Generate DataTable component
    const dataTableComponent = `'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'

interface DataTableProps {
  columns: any[]
  data: any[]
  loading?: boolean
}

export function DataTable({ columns, data, loading }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-3 text-left font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}`;

    fs.writeFileSync(path.join(uiDir, 'components/tables/data-table.tsx'), dataTableComponent);

    // Generate utility functions
    const utilsContent = `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;

    fs.writeFileSync(path.join(uiDir, 'lib/utils.ts'), utilsContent);
  }

  private async generateEntityForm(uiDir: string, entity: Entity): Promise<void> {
    // Generate form configuration for @opsai/ui FormGenerator
    const formConfig = {
      fields: Object.entries(entity.fields).map(([fieldName, fieldConfig]: [string, any]) => ({
        name: fieldName,
        label: fieldConfig.label || fieldName,
        type: this.mapFieldType(fieldConfig.type),
        required: fieldConfig.required || false,
        placeholder: fieldConfig.placeholder,
        validation: fieldConfig.validation
      }))
    };

    const formContent = `'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface EntityFormProps {
  onSubmit: (data: any) => void
  loading?: boolean
  defaultValues?: Record<string, any>
}

export function EntityForm({ onSubmit, loading, defaultValues }: EntityFormProps) {
  const form = useForm({ defaultValues })
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">${entity.displayName} Form</h2>
      ${Object.entries(entity.fields).map(([fieldName, fieldConfig]: [string, any]) => `
      <div>
        <label className="block text-sm font-medium mb-2">${fieldConfig.label || fieldName}</label>
        ${this.generateFormField(fieldName, fieldConfig)}
      </div>`).join('')}
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save ${entity.displayName}'}
      </button>
    </form>
  )
}`;

    fs.writeFileSync(path.join(uiDir, 'components/forms', `${entity.name}-form.tsx`), formContent);
  }

  private mapFieldType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'text',
      'number': 'number',
      'boolean': 'checkbox',
      'date': 'date',
      'datetime': 'date',
      'text': 'textarea'
    };
    return typeMap[type] || 'text';
  }

  private generateFormField(fieldName: string, fieldConfig: any): string {
    switch (fieldConfig.type) {
      case 'string':
        return `<input
          {...form.register('${fieldName}')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="${fieldConfig.placeholder || ''}"
        />`;
      case 'number':
        return `<input
          {...form.register('${fieldName}', { valueAsNumber: true })}
          type="number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="${fieldConfig.placeholder || ''}"
        />`;
      case 'boolean':
        return `<input
          {...form.register('${fieldName}')}
          type="checkbox"
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
        />`;
      case 'date':
        return `<input
          {...form.register('${fieldName}')}
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />`;
      case 'textarea':
        return `<textarea
          {...form.register('${fieldName}')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="${fieldConfig.placeholder || ''}"
        />`;
      default:
        return `<input
          {...form.register('${fieldName}')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="${fieldConfig.placeholder || ''}"
        />`;
    }
  }

  private async generateDashboardComponents(uiDir: string): Promise<void> {
    // Generate StatsCard component
    const statsCardContent = `import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface StatsCardProps {
  title: string
  value: number | string
  change?: number
  href?: string
}

export function StatsCard({ title, value, change, href }: StatsCardProps) {
  const content = (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {change !== undefined && (
          <p className={\`ml-2 text-sm \${change >= 0 ? 'text-green-600' : 'text-red-600'}\`}>
            {change >= 0 ? '+' : ''}{change}%
          </p>
        )}
      </div>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}`;

    fs.mkdirSync(path.join(uiDir, 'components/dashboard'), { recursive: true });
    fs.writeFileSync(path.join(uiDir, 'components/dashboard/stats-card.tsx'), statsCardContent);

    // Generate Chart component
    const chartContent = `'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface ChartProps {
  data: any[]
  type?: 'line' | 'bar'
  dataKey?: string
  xAxisDataKey?: string
}

export function Chart({ data, type = 'line', dataKey = 'value', xAxisDataKey = 'name' }: ChartProps) {
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisDataKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#1e40af" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisDataKey} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke="#1e40af" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}`;

    fs.writeFileSync(path.join(uiDir, 'components/dashboard/chart.tsx'), chartContent);
  }

  private async generateLayouts(uiDir: string): Promise<void> {
    // Generate Navigation component
    const navigationContent = `'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home' },
    ${this.uiConfig.features?.dashboard ? "{ href: '/dashboard', label: 'Dashboard' }," : ''}
    ${this.config.database.entities.map(entity => 
      `{ href: '/${entity.name}', label: '${entity.displayName}' }`
    ).join(',\n    ')}
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            ${this.uiConfig.theme?.logo ? 
              `<img src="${this.uiConfig.theme.logo}" alt="Logo" className="h-8 w-8" />` :
              '<div className="w-8 h-8 bg-primary rounded"></div>'
            }
            <span className="text-xl font-bold">${this.config.app.displayName}</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'default' : 'ghost'}
                  size="sm"
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}`;

    fs.writeFileSync(path.join(uiDir, 'components/navigation.tsx'), navigationContent);

    // Generate Providers component
    const providersContent = `'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}`;

    fs.writeFileSync(path.join(uiDir, 'components/providers.tsx'), providersContent);
  }

  private async generateAuthComponents(uiDir: string): Promise<void> {
    // Generate Login page
    fs.mkdirSync(path.join(uiDir, 'app/auth'), { recursive: true });
    
    const loginContent = `'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const form = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('Login successful')
        router.push('/dashboard')
      } else {
        toast.error('Invalid credentials')
      }
    } catch (error) {
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">${this.config.app.displayName}</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              {...form.register('email', { required: true })}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              {...form.register('password', { required: true })}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  )
}`;

    fs.writeFileSync(path.join(uiDir, 'app/auth/page.tsx'), loginContent);
  }

  private async generateUIConfig(uiDir: string): Promise<void> {
    // Generate global CSS
    const globalCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --primary: ${this.hexToHsl(this.uiConfig.theme?.primary_color || '#1e40af')};
    --secondary: ${this.hexToHsl(this.uiConfig.theme?.secondary_color || '#64748b')};
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50;
  }
}`;

    fs.writeFileSync(path.join(uiDir, 'app/globals.css'), globalCSS);

    // Generate environment variables template
    const envContent = `# API Configuration
API_BASE_URL=http://localhost:3000/api

# Authentication
JWT_SECRET=${this.config.app.name}_jwt_secret
NEXTAUTH_SECRET=${this.config.app.name}_nextauth_secret
NEXTAUTH_URL=http://localhost:3001

# Database (if needed by frontend)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${this.config.app.name}"`;

    fs.writeFileSync(path.join(uiDir, '.env.example'), envContent);

    // Generate README
    const readmeContent = `# ${this.config.app.displayName} - Frontend

${this.config.app.description}

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Copy environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Features

${this.config.database.entities.map(entity => `- ${entity.displayName} management`).join('\n')}
${this.uiConfig.features?.dashboard ? '- Dashboard with analytics' : ''}
${this.uiConfig.features?.authentication ? '- User authentication' : ''}

## Built With

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- React Query
- React Table
- React Hook Form

## Generated by CORE Platform
`;

    fs.writeFileSync(path.join(uiDir, 'README.md'), readmeContent);
  }

  private hexToHsl(hex: string): string {
    // Convert hex to HSL for CSS custom properties
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  private toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + this.toCamelCase(str).slice(1);
  }
}