import { YamlProcessor, GeneratedFile } from './yaml-processor'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface AppGeneratorConfig {
  outputPath: string
  enableGit: boolean
  enableDocker: boolean
  enableCI: boolean
  enableTesting: boolean
  enableDocumentation: boolean
}

export interface GeneratedApp {
  id: string
  name: string
  description: string
  tenantId: string
  status: 'generating' | 'generated' | 'deploying' | 'deployed' | 'failed'
  files: GeneratedFile[]
  metadata: {
    complexity: number
    estimatedDeploymentTime: number
    resourceRequirements: any
    generatedAt: Date
    deployedAt?: Date
    deploymentUrl?: string
  }
  config: any
}

export interface GenerationOptions {
  validateYaml?: boolean
  generateCode?: boolean
  createDeployment?: boolean
  customTemplates?: string[]
  enableGit?: boolean
  enableDocker?: boolean
  enableCI?: boolean
  enableTesting?: boolean
  enableDocumentation?: boolean
}

export class AppGenerator {
  private yamlProcessor: YamlProcessor
  private config: AppGeneratorConfig

  constructor(config: AppGeneratorConfig) {
    this.config = config
    this.yamlProcessor = new YamlProcessor({
      enableValidation: true,
      enableCaching: false,
      enableSecurity: false,
      maxFileSize: 10 * 1024 * 1024,
      allowedExtensions: ['.yaml', '.yml'],
      templatePath: './templates'
    })
  }

  /**
   * Generate complete application from YAML
   */
  async generateApp(
    yamlContent: string,
    tenantId: string,
    options: GenerationOptions = {}
  ): Promise<GeneratedApp> {
    const appId = this.generateAppId()
    const appName = this.extractAppName(yamlContent)
    
    // Create app record
    const app: GeneratedApp = {
      id: appId,
      name: appName,
      description: this.extractAppDescription(yamlContent),
      tenantId,
      status: 'generating',
      files: [],
      metadata: {
        complexity: 0,
        estimatedDeploymentTime: 0,
        resourceRequirements: {},
        generatedAt: new Date()
      },
      config: null
    }

    try {
      // Process YAML
      const processingResult = await this.yamlProcessor.processYaml(
        yamlContent,
        tenantId,
        {
          validate: options.validateYaml !== false,
          generateCode: options.generateCode !== false,
          createDeployment: options.createDeployment || false,
          customTemplates: options.customTemplates || []
        }
      )

      if (!processingResult.success) {
        app.status = 'failed'
        throw new Error(`YAML processing failed: ${processingResult.errors?.join(', ')}`)
      }

      app.config = processingResult.config
      app.metadata.complexity = processingResult.metadata!.complexity
      app.metadata.estimatedDeploymentTime = processingResult.metadata!.estimatedDeploymentTime
      app.metadata.resourceRequirements = processingResult.metadata!.resourceRequirements

      // Generate additional files based on options
      const additionalFiles = await this.generateAdditionalFiles(
        processingResult.config!,
        options
      )

      app.files = [...(processingResult.generatedFiles || []), ...additionalFiles]

      // Write files to disk
      await this.writeFilesToDisk(appId, app.files)

      // Initialize Git repository if enabled
      if (options.enableGit !== false && this.config.enableGit) {
        await this.initializeGitRepository(appId)
      }

      // Set status to generated
      app.status = 'generated'

      // Note: Database saving and deployment removed for simplified version

      return app

    } catch (error) {
      app.status = 'failed'
      throw error
    }
  }

  /**
   * Generate additional files based on options
   */
  private async generateAdditionalFiles(
    config: any,
    options: GenerationOptions
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = []

    // Generate package.json
    if (options.generateCode !== false) {
      files.push(this.generatePackageJson(config))
    }

    // Generate Docker files
    if (options.enableDocker !== false && this.config.enableDocker) {
      files.push(...this.generateDockerFiles(config))
    }

    // Generate CI/CD files
    if (options.enableCI !== false && this.config.enableCI) {
      files.push(...this.generateCIFiles(config))
    }

    // Generate test files
    if (options.enableTesting !== false && this.config.enableTesting) {
      files.push(...this.generateTestFiles(config))
    }

    // Generate documentation
    if (options.enableDocumentation !== false && this.config.enableDocumentation) {
      files.push(...this.generateDocumentationFiles(config))
    }

    // Generate environment files
    files.push(...this.generateEnvironmentFiles(config))

    return files
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(config: any): GeneratedFile {
    const dependencies = [
      'next',
      'react',
      'react-dom',
      '@prisma/client',
      'zod',
      '@opsai/shared',
      '@opsai/database',
      '@opsai/auth',
      '@opsai/ui'
    ]

    const devDependencies = [
      'typescript',
      '@types/node',
      '@types/react',
      'prisma',
      'tailwindcss',
      'autoprefixer',
      'postcss'
    ]

    const packageJson = {
      name: config.business?.name?.toLowerCase().replace(/\s+/g, '-') || 'generated-app',
      version: '1.0.0',
      description: config.business?.description || 'Generated application',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        'db:generate': 'prisma generate',
        'db:push': 'prisma db push',
        'db:migrate': 'prisma migrate dev',
        'db:studio': 'prisma studio'
      },
      dependencies: dependencies.reduce((acc, dep) => ({ ...acc, [dep]: 'latest' }), {}),
      devDependencies: devDependencies.reduce((acc, dep) => ({ ...acc, [dep]: 'latest' }), {})
    }

    return {
      path: 'package.json',
      content: JSON.stringify(packageJson, null, 2),
      type: 'config',
      language: 'json'
    }
  }

  /**
   * Generate Docker files
   */
  private generateDockerFiles(config: any): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // Dockerfile
    const dockerfile = `# Multi-stage build for ${config.business?.name || 'Application'}
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]`

    files.push({
      path: 'Dockerfile',
      content: dockerfile,
      type: 'config',
      language: 'dockerfile'
    })

    // docker-compose.yml
    const dockerCompose = `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/${config.business?.name?.toLowerCase().replace(/\s+/g, '_') || 'app'}
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=${config.business?.name?.toLowerCase().replace(/\s+/g, '_') || 'app'}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:`

    files.push({
      path: 'docker-compose.yml',
      content: dockerCompose,
      type: 'config',
      language: 'yaml'
    })

    return files
  }

  /**
   * Generate CI/CD files
   */
  private generateCIFiles(_config: any): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // GitHub Actions workflow
    const githubWorkflow = `name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Generate Prisma client
      run: npx prisma generate
    
    - name: Run database migrations
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    
    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    
    - name: Run linting
      run: npm run lint
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: \${{ secrets.ORG_ID }}
        vercel-project-id: \${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'`

    files.push({
      path: '.github/workflows/ci.yml',
      content: githubWorkflow,
      type: 'config',
      language: 'yaml'
    })

    return files
  }

  /**
   * Generate test files
   */
  private generateTestFiles(config: any): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // Jest configuration
    const jestConfig = `module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
}`

    files.push({
      path: 'jest.config.js',
      content: jestConfig,
      type: 'config',
      language: 'javascript'
    })

    // Test setup
    const jestSetup = `import '@testing-library/jest-dom'`

    files.push({
      path: 'jest.setup.js',
      content: jestSetup,
      type: 'code',
      language: 'javascript'
    })

    // Sample test
    const sampleTest = `import { render, screen } from '@testing-library/react'
import { describe, it, expect } from '@jest/globals'
import Home from '@/pages/index'

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', {
      name: /welcome to ${config.business?.name || 'our app'}/i,
    })
    
    expect(heading).toBeInTheDocument()
  })
})`

    files.push({
      path: '__tests__/pages/index.test.tsx',
      content: sampleTest,
      type: 'code',
      language: 'typescript',
      dependencies: ['@testing-library/react', '@testing-library/jest-dom', '@jest/globals']
    })

    return files
  }

  /**
   * Generate documentation files
   */
  private generateDocumentationFiles(config: any): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // API documentation
    const apiDocs = `# API Documentation

## Overview
This document describes the API endpoints for ${config.business?.name || 'the application'}.

## Authentication
All API endpoints require authentication using JWT tokens.

### Headers
\`\`\`
Authorization: Bearer <token>
Content-Type: application/json
\`\`\`

## Endpoints

${config.database?.models?.filter((model: any) => model.name).map((model: any) => `
### ${model.name}

#### GET /api/${model.name!.toLowerCase()}
Get all ${model.name!.toLowerCase()} records.

#### POST /api/${model.name!.toLowerCase()}
Create a new ${model.name!.toLowerCase()} record.

#### GET /api/${model.name!.toLowerCase()}/:id
Get a specific ${model.name!.toLowerCase()} record.

#### PUT /api/${model.name!.toLowerCase()}/:id
Update a ${model.name!.toLowerCase()} record.

#### DELETE /api/${model.name!.toLowerCase()}/:id
Delete a ${model.name!.toLowerCase()} record.
`).join('\n') || ''}

## Error Responses
All endpoints return standard HTTP status codes and error messages in JSON format.

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
\`\`\``

    files.push({
      path: 'docs/api.md',
      content: apiDocs,
      type: 'documentation',
      language: 'markdown'
    })

    // Development guide
    const devGuide = `# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Docker (optional)

### Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd ${config.business?.name?.toLowerCase().replace(/\s+/g, '-') || 'app'}
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Set up the database
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

5. Run the development server
\`\`\`bash
npm run dev
\`\`\`

## Project Structure

\`\`\`
src/
├── api/          # API routes
├── components/   # React components
├── pages/        # Next.js pages
├── styles/       # CSS styles
└── utils/        # Utility functions
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm test\` - Run tests
- \`npm run db:generate\` - Generate Prisma client
- \`npm run db:push\` - Push schema to database
- \`npm run db:migrate\` - Run database migrations
- \`npm run db:studio\` - Open Prisma Studio

## Deployment

This application can be deployed to various platforms:

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables
3. Deploy automatically on push to main branch

### Docker
\`\`\`bash
docker-compose up -d
\`\`\`

### Manual Deployment
1. Build the application: \`npm run build\`
2. Start the server: \`npm start\`
3. Set up reverse proxy (nginx recommended)`

    files.push({
      path: 'docs/development.md',
      content: devGuide,
      type: 'documentation',
      language: 'markdown'
    })

    return files
  }

  /**
   * Generate environment files
   */
  private generateEnvironmentFiles(config: any): GeneratedFile[] {
    const files: GeneratedFile[] = []

    // .env.example
    const envExample = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/${config.business?.name?.toLowerCase().replace(/\s+/g, '_') || 'app'}"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# File Storage (optional)
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# Email (optional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""

# Monitoring (optional)
SENTRY_DSN=""

# Analytics (optional)
GOOGLE_ANALYTICS_ID=""`

    files.push({
      path: '.env.example',
      content: envExample,
      type: 'config',
      language: 'env'
    })

    // .gitignore
    const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/

# Production
build/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Prisma
prisma/migrations/

# IDE
.vscode/
.idea/`

    files.push({
      path: '.gitignore',
      content: gitignore,
      type: 'config',
      language: 'gitignore'
    })

    return files
  }

  /**
   * Write files to disk
   */
  private async writeFilesToDisk(appId: string, files: GeneratedFile[]): Promise<void> {
    const appPath = path.join(this.config.outputPath, appId)
    
    // Create app directory
    await fs.mkdir(appPath, { recursive: true })

    // Write each file
    for (const file of files) {
      const filePath = path.join(appPath, file.path)
      const dirPath = path.dirname(filePath)
      
      // Create directory if it doesn't exist
      await fs.mkdir(dirPath, { recursive: true })
      
      // Write file
      await fs.writeFile(filePath, file.content, 'utf8')
    }
  }

  /**
   * Initialize Git repository
   */
  private async initializeGitRepository(appId: string): Promise<void> {
    const appPath = path.join(this.config.outputPath, appId)
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)

    try {
      await execAsync('git init', { cwd: appPath })
      await execAsync('git add .', { cwd: appPath })
      await execAsync('git commit -m "Initial commit - Generated by OPSAI"', { cwd: appPath })
    } catch (error) {
      console.warn('Failed to initialize Git repository:', error)
    }
  }


  /**
   * Utility methods
   */
  private generateAppId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private extractAppName(yamlContent: string): string {
    try {
      const yaml = require('js-yaml')
      const parsed = yaml.load(yamlContent)
      return parsed.business?.name || 'Generated App'
    } catch {
      return 'Generated App'
    }
  }

  private extractAppDescription(yamlContent: string): string {
    try {
      const yaml = require('js-yaml')
      const parsed = yaml.load(yamlContent)
      return parsed.business?.description || 'Application generated by OPSAI'
    } catch {
      return 'Application generated by OPSAI'
    }
  }

  /**
   * Public methods (simplified versions)
   */
  async getApp(appId: string): Promise<GeneratedApp | null> {
    // Simplified version - would normally query database
    console.log('Getting app:', appId)
    return null
  }

  async getAppsByTenant(tenantId: string): Promise<GeneratedApp[]> {
    // Simplified version - would normally query database
    console.log('Getting apps for tenant:', tenantId)
    return []
  }

  async deleteApp(appId: string): Promise<void> {
    try {
      // Delete files from disk
      const appPath = path.join(this.config.outputPath, appId)
      await fs.rm(appPath, { recursive: true, force: true })
      console.log('Deleted app files:', appId)
    } catch (error) {
      console.error('Failed to delete app:', error)
      throw error
    }
  }
} 