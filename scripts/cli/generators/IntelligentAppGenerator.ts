import { OAuthHubService } from '../../../packages/discovery/src/services/oauth-hub-service'
import { AirbyteDiscoveryService } from '../../../packages/discovery/src/services/airbyte-discovery-service'
import { SchemaInferenceService } from '../../../packages/discovery/src/services/schema-inference-service'
import { DynamicUIGenerator } from './DynamicUIGenerator'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

export class IntelligentAppGenerator {
  private oauthHub: OAuthHubService
  private airbyte: AirbyteDiscoveryService
  private schemaInference: SchemaInferenceService
  private uiGenerator: DynamicUIGenerator
  private openai: OpenAI
  private supabase: any

  constructor() {
    this.oauthHub = new OAuthHubService()
    this.airbyte = new AirbyteDiscoveryService()
    this.schemaInference = new SchemaInferenceService()
    this.uiGenerator = new DynamicUIGenerator()
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async generateApp(tenantId: string, businessInfo: any) {
    console.log('🚀 Starting Intelligent App Generation for tenant:', tenantId)

    // Phase 1: OAuth Connection Collection
    const connectedServices = await this.collectOAuthConnections(tenantId, businessInfo)
    
    // Phase 2: Data Discovery via Airbyte
    const discoveredData = await this.discoverDataSources(tenantId, connectedServices)
    
    // Phase 3: Schema Inference from Real Data
    const inferredSchema = await this.inferSchemaFromData(tenantId, discoveredData)
    
    // Phase 4: Business Logic Extraction
    const businessLogic = await this.extractBusinessLogic(discoveredData, inferredSchema)
    
    // Phase 5: Dynamic UI Generation
    const uiComponents = await this.generateDynamicUI(inferredSchema, businessLogic)
    
    // Phase 6: Deploy to Vercel
    const deployment = await this.deployToVercel(tenantId, {
      schema: inferredSchema,
      ui: uiComponents,
      businessLogic: businessLogic
    })

    return {
      tenantId,
      appUrl: deployment.url,
      status: 'deployed',
      features: {
        dataSources: connectedServices.length,
        entities: inferredSchema.entities.length,
        workflows: businessLogic.workflows.length,
        uiComponents: uiComponents.components.length
      }
    }
  }

  private async collectOAuthConnections(tenantId: string, businessInfo: any) {
    console.log('🔐 Collecting OAuth connections...')
    
    // Determine which services to connect based on business type
    const recommendedServices = await this.getRecommendedServices(businessInfo)
    
    const connections = []
    for (const service of recommendedServices) {
      try {
        // Check if already connected
        const existing = await this.oauthHub.getConnectedProviders(tenantId)
        if (existing.find(e => e.provider_id === service.id)) {
          connections.push(service)
          continue
        }

        // Initiate OAuth flow
        const { authUrl, state } = await this.oauthHub.initiateOAuthFlow(
          tenantId,
          service.id,
          `${process.env.NEXT_PUBLIC_APP_URL}/oauth/callback`
        )

        // Store pending connection
        await this.supabase
          .from('pending_connections')
          .insert({
            tenant_id: tenantId,
            provider_id: service.id,
            state: state,
            auth_url: authUrl
          })

        connections.push({
          ...service,
          status: 'pending',
          authUrl
        })
      } catch (error) {
        console.error(`Failed to connect ${service.id}:`, error)
      }
    }

    return connections
  }

  private async discoverDataSources(tenantId: string, services: any[]) {
    console.log('🔍 Discovering data sources via Airbyte...')
    
    const discoveries = []
    
    for (const service of services) {
      if (service.status !== 'connected') continue

      try {
        // Get credentials from secure storage
        const creds = await this.getServiceCredentials(tenantId, service.id)
        
        // Configure Airbyte source
        const sourceConfig = this.buildAirbyteSourceConfig(service, creds)
        
        // Discover schema
        const discovery = await this.airbyte.discoverSchema(sourceConfig)
        
        // Sample data from each stream
        const samples = {}
        for (const stream of discovery.streams) {
          samples[stream.name] = await this.airbyte.sampleData(
            sourceConfig.sourceId,
            stream.name,
            1000
          )
        }

        discoveries.push({
          service: service.id,
          schema: discovery,
          dataSamples: samples
        })

        // Create Airbyte connection for continuous sync
        await this.airbyte.createConnection(
          tenantId,
          sourceConfig,
          { type: 'postgres' }
        )
      } catch (error) {
        console.error(`Discovery failed for ${service.id}:`, error)
      }
    }

    return discoveries
  }

  private async inferSchemaFromData(tenantId: string, discoveries: any[]) {
    console.log('🧠 Inferring optimal schema from real data...')
    
    const entities = []
    const relationships = []

    for (const discovery of discoveries) {
      for (const [streamName, samples] of Object.entries(discovery.dataSamples)) {
        // Analyze data patterns
        const analysis = await this.analyzeDataPatterns(samples as any[])
        
        // Use AI to understand entity relationships
        const aiAnalysis = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'system',
            content: 'Analyze this data and suggest optimal database schema with relationships.'
          }, {
            role: 'user',
            content: JSON.stringify({
              streamName,
              sampleData: (samples as any[]).slice(0, 5),
              patterns: analysis
            })
          }],

        })

        const suggestion = JSON.parse(aiAnalysis.choices[0].message.content!)
        
        entities.push({
          name: suggestion.entityName || streamName,
          fields: suggestion.fields,
          indexes: suggestion.indexes,
          validations: suggestion.validations
        })

        if (suggestion.relationships) {
          relationships.push(...suggestion.relationships)
        }
      }
    }

    // Optimize schema
    return this.optimizeSchema({ entities, relationships })
  }

  private async extractBusinessLogic(discoveries: any[], schema: any) {
    console.log('⚡ Extracting business logic from data patterns...')
    
    const workflows = []
    const rules = []
    const calculations = []

    // Analyze API call patterns
    for (const discovery of discoveries) {
      // Look for common workflows
      const patterns = await this.detectWorkflowPatterns(discovery.dataSamples)
      
      // Use AI to understand business rules
      const aiRules = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{
          role: 'system',
          content: 'Identify business rules, calculations, and workflows from this data.'
        }, {
          role: 'user',
          content: JSON.stringify({
            dataPatterns: patterns,
            schema: schema
          })
        }],

      })

      const logic = JSON.parse(aiRules.choices[0].message.content!)
      
      workflows.push(...(logic.workflows || []))
      rules.push(...(logic.rules || []))
      calculations.push(...(logic.calculations || []))
    }

    return {
      workflows,
      rules,
      calculations,
      automations: this.identifyAutomationOpportunities(workflows, rules)
    }
  }

  private async generateDynamicUI(schema: any, businessLogic: any) {
    console.log('🎨 Generating dynamic UI components...')
    
    const components = []
    const pages = []
    const dashboards = []

    // Generate UI for each entity
    for (const entity of schema.entities) {
      // Smart form generation
      const form = await this.uiGenerator.generateSmartForm(entity, businessLogic.rules)
      
      // List/table view
      const listView = await this.uiGenerator.generateListView(entity)
      
      // Detail view
      const detailView = await this.uiGenerator.generateDetailView(entity)
      
      components.push({ form, listView, detailView })
      
      // Create CRUD pages
      pages.push({
        path: `/${entity.name.toLowerCase()}`,
        component: 'EntityPage',
        props: { entity: entity.name }
      })
    }

    // Generate dashboards based on data types
    for (const workflow of businessLogic.workflows) {
      const dashboard = await this.uiGenerator.generateDashboard(
        workflow,
        schema.entities
      )
      dashboards.push(dashboard)
    }

    return {
      components,
      pages,
      dashboards,
      theme: await this.generateTheme(schema.entities[0]?.industry)
    }
  }

  private async deployToVercel(tenantId: string, appConfig: any) {
    console.log('🚀 Deploying to Vercel...')
    
    // Create Vercel project
    const vercelResponse = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `opsai-${tenantId}`,
        framework: 'nextjs',
        publicSource: false,
        env: [
          { key: 'TENANT_ID', value: tenantId },
          { key: 'DATABASE_URL', value: `${process.env.DATABASE_URL}?schema=${tenantId}` },
          { key: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.SUPABASE_URL },
          { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.SUPABASE_ANON_KEY }
        ]
      })
    })

    const project = await vercelResponse.json()
    
    // Generate and deploy app code
    const appCode = await this.generateAppCode(appConfig)
    
    // Deploy to Vercel
    const deployment = await this.deployCode(project.id, appCode)
    
    return {
      url: `https://${project.name}.vercel.app`,
      projectId: project.id,
      deploymentId: deployment.id
    }
  }

  // Helper methods
  private async getRecommendedServices(businessInfo: any) {
    // Use AI to recommend services based on business type
    const recommendations = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{
        role: 'system',
        content: 'Recommend data sources and services for this business type.'
      }, {
        role: 'user',
        content: JSON.stringify(businessInfo)
      }]
    })

    // Return list of recommended OAuth providers
    return JSON.parse(recommendations.choices[0].message.content!)
  }

  private buildAirbyteSourceConfig(service: any, credentials: any) {
    // Build Airbyte source configuration based on service type
    const configs = {
      'salesforce': {
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
        start_date: '2020-01-01T00:00:00Z'
      },
      'shopify': {
        api_password: credentials.apiKey,
        shop: credentials.shopDomain,
        start_date: '2020-01-01T00:00:00Z'
      },
      'stripe': {
        account_id: credentials.accountId,
        client_secret: credentials.secretKey,
        start_date: '2020-01-01T00:00:00Z'
      }
    }

    return {
      type: service.id,
      connectionConfig: configs[service.id] || {},
      sourceId: `${service.id}_source`
    }
  }

  private async analyzeDataPatterns(samples: any[]) {
    // Analyze data for patterns
    return {
      recordCount: samples.length,
      fields: this.analyzeFields(samples),
      timeSeriesDetected: this.detectTimeSeries(samples),
      hierarchicalData: this.detectHierarchy(samples),
      financialData: this.detectFinancialData(samples)
    }
  }

  private analyzeFields(samples: any[]) {
    if (!samples.length) return []
    
    const fieldAnalysis = {}
    const sample = samples[0]
    
    Object.keys(sample).forEach(field => {
      fieldAnalysis[field] = {
        type: typeof sample[field],
        nullable: samples.some(s => s[field] === null),
        unique: new Set(samples.map(s => s[field])).size === samples.length,
        patterns: this.detectFieldPatterns(samples.map(s => s[field]))
      }
    })
    
    return fieldAnalysis
  }

  private detectTimeSeries(samples: any[]) {
    // Check for date/time fields
    return samples.some(s => 
      Object.values(s).some(v => 
        typeof v === 'string' && !isNaN(Date.parse(v))
      )
    )
  }

  private detectHierarchy(samples: any[]) {
    // Check for parent-child relationships
    return samples.some(s => 
      Object.keys(s).some(k => 
        k.includes('parent') || k.includes('child') || k.includes('_id')
      )
    )
  }

  private detectFinancialData(samples: any[]) {
    // Check for currency/financial fields
    return samples.some(s => 
      Object.keys(s).some(k => 
        k.includes('price') || k.includes('amount') || k.includes('currency') ||
        k.includes('balance') || k.includes('total')
      )
    )
  }

  private detectFieldPatterns(values: any[]) {
    // Detect common patterns in field values
    const patterns = {
      email: values.some(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)),
      phone: values.some(v => /^\+?[\d\s-()]+$/.test(v)),
      url: values.some(v => /^https?:\/\//.test(v)),
      currency: values.some(v => /^\$?[\d,]+\.?\d*$/.test(v))
    }
    
    return Object.keys(patterns).filter(k => patterns[k])
  }

  private async detectWorkflowPatterns(dataSamples: any) {
    // Analyze data for workflow patterns
    const patterns = []
    
    // Look for state transitions
    // Look for sequential operations
    // Look for approval flows
    
    return patterns
  }

  private identifyAutomationOpportunities(workflows: any[], rules: any[]) {
    // Identify what can be automated
    return {
      notifications: workflows.filter(w => w.type === 'notification'),
      dataSync: workflows.filter(w => w.type === 'sync'),
      calculations: rules.filter(r => r.type === 'calculation'),
      validations: rules.filter(r => r.type === 'validation')
    }
  }

  private async generateTheme(industry?: string) {
    // Generate theme based on industry
    const themes = {
      'finance': { primary: '#1e40af', secondary: '#1e293b' },
      'healthcare': { primary: '#059669', secondary: '#064e3b' },
      'retail': { primary: '#dc2626', secondary: '#7c2d12' },
      'technology': { primary: '#7c3aed', secondary: '#4c1d95' }
    }
    
    return themes[industry || 'technology']
  }

  private async getServiceCredentials(tenantId: string, serviceId: string) {
    // Retrieve encrypted credentials from Supabase
    const { data, error } = await this.supabase
      .from('tenant_integrations')
      .select('credentials')
      .eq('tenant_id', tenantId)
      .eq('provider_id', serviceId)
      .single()
    
    if (error) throw error
    
    // Decrypt credentials
    return JSON.parse(data.credentials)
  }

  private async optimizeSchema(rawSchema: any) {
    // Optimize schema for performance
    return {
      ...rawSchema,
      indexes: this.generateOptimalIndexes(rawSchema),
      partitioning: this.determinePartitioning(rawSchema),
      caching: this.defineCachingStrategy(rawSchema)
    }
  }

  private generateOptimalIndexes(schema: any) {
    // Generate indexes based on likely query patterns
    const indexes = []
    
    schema.entities.forEach(entity => {
      // Primary key index
      indexes.push({
        entity: entity.name,
        fields: ['id'],
        unique: true
      })
      
      // Foreign key indexes
      entity.fields
        .filter(f => f.name.endsWith('_id'))
        .forEach(f => {
          indexes.push({
            entity: entity.name,
            fields: [f.name],
            unique: false
          })
        })
      
      // Common query field indexes
      const commonFields = ['email', 'created_at', 'status', 'type']
      entity.fields
        .filter(f => commonFields.includes(f.name))
        .forEach(f => {
          indexes.push({
            entity: entity.name,
            fields: [f.name],
            unique: f.name === 'email'
          })
        })
    })
    
    return indexes
  }

  private determinePartitioning(schema: any) {
    // Determine if partitioning is needed
    const largeTables = schema.entities.filter(e => 
      e.estimatedRows > 1000000 || e.hasTimeSeries
    )
    
    return largeTables.map(table => ({
      entity: table.name,
      strategy: table.hasTimeSeries ? 'time-based' : 'hash',
      field: table.hasTimeSeries ? 'created_at' : 'id'
    }))
  }

  private defineCachingStrategy(schema: any) {
    // Define caching strategy
    return {
      redis: true,
      ttl: {
        default: 300,
        entities: schema.entities.reduce((acc, e) => {
          acc[e.name] = e.changeFrequency === 'low' ? 3600 : 300
          return acc
        }, {})
      }
    }
  }

  private async generateAppCode(config: any) {
    // Generate complete app code
    return {
      package: this.generatePackageJson(config),
      schema: this.generatePrismaSchema(config.schema),
      api: this.generateAPIEndpoints(config.schema),
      ui: this.generateUIComponents(config.ui),
      workflows: this.generateWorkflows(config.businessLogic)
    }
  }

  private generatePackageJson(config: any) {
    return {
      name: `opsai-app-${config.tenantId}`,
      version: '1.0.0',
      dependencies: {
        'next': '^14.0.0',
        'react': '^18.0.0',
        '@prisma/client': '^5.0.0',
        '@supabase/supabase-js': '^2.0.0',
        'tailwindcss': '^3.0.0'
      }
    }
  }

  private generatePrismaSchema(schema: any) {
    // Generate Prisma schema from discovered data
    let prismaSchema = 'datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\n\n'
    
    schema.entities.forEach(entity => {
      prismaSchema += `model ${entity.name} {\n`
      entity.fields.forEach(field => {
        prismaSchema += `  ${field.name} ${this.mapToPrismaType(field.type)}`
        if (field.required) prismaSchema += ' '
        if (field.unique) prismaSchema += ' @unique'
        prismaSchema += '\n'
      })
      prismaSchema += '}\n\n'
    })
    
    return prismaSchema
  }

  private mapToPrismaType(type: string) {
    const typeMap = {
      'string': 'String',
      'number': 'Int',
      'float': 'Float',
      'boolean': 'Boolean',
      'date': 'DateTime',
      'json': 'Json'
    }
    return typeMap[type] || 'String'
  }

  private generateAPIEndpoints(schema: any) {
    // Generate Next.js API routes
    const endpoints = {}
    
    schema.entities.forEach(entity => {
      endpoints[`/api/${entity.name.toLowerCase()}`] = this.generateCRUDEndpoint(entity)
    })
    
    return endpoints
  }

  private generateCRUDEndpoint(entity: any) {
    return `
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const records = await prisma.${entity.name.toLowerCase()}.findMany()
  return NextResponse.json(records)
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  const record = await prisma.${entity.name.toLowerCase()}.create({ data })
  return NextResponse.json(record)
}
    `
  }

  private generateUIComponents(uiConfig: any) {
    // Generate React components
    const components = {}
    
    uiConfig.components.forEach(comp => {
      components[comp.name] = this.generateReactComponent(comp)
    })
    
    return components
  }

  private generateReactComponent(component: any) {
    return `
import React from 'react'

export function ${component.name}({ data }) {
  return (
    <div className="${component.className}">
      ${component.template}
    </div>
  )
}
    `
  }

  private generateWorkflows(businessLogic: any) {
    // Generate workflow code
    const workflows = {}
    
    businessLogic.workflows.forEach(workflow => {
      workflows[workflow.name] = this.generateWorkflowCode(workflow)
    })
    
    return workflows
  }

  private generateWorkflowCode(workflow: any) {
    return `
export async function ${workflow.name}(input) {
  // ${workflow.description}
  ${workflow.steps.map(step => `
  // Step: ${step.name}
  const ${step.name}Result = await ${step.action}(input)
  `).join('\n')}
  
  return result
}
    `
  }

  private async deployCode(projectId: string, code: any) {
    // Deploy to Vercel
    const deployment = await fetch(`https://api.vercel.com/v13/deployments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: projectId,
        project: projectId,
        target: 'production',
        gitSource: {
          type: 'github',
          repo: 'opsai-generated-apps',
          ref: 'main'
        }
      })
    })
    
    return deployment.json()
  }
}