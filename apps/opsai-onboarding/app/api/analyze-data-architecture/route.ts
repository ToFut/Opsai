import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// Airbyte API configuration
const AIRBYTE_API_URL = process.env.AIRBYTE_API_URL || 'http://localhost:8000/api/v1'
const AIRBYTE_API_KEY = process.env.AIRBYTE_API_KEY

interface DataSource {
  provider: string
  credentialId: string
  accountName: string
  metadata: any
}

interface DataModel {
  name: string
  source: string
  fields: Field[]
  recordCount?: number
  sampleData?: any[]
  relationships?: Relationship[]
}

interface Field {
  name: string
  type: string
  required: boolean
  unique?: boolean
  description?: string
  businessReason?: string
}

interface Relationship {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  field: string
}

export async function POST(request: NextRequest) {
  try {
    const { dataSources, analysisId, tenantId } = await request.json()
    
    if (!dataSources || dataSources.length === 0) {
      return NextResponse.json(
        { error: 'No data sources provided' },
        { status: 400 }
      )
    }
    
    console.log(`📊 Analyzing data architecture for ${dataSources.length} sources`)
    
    // Stage 1: Discover schemas from each connected source
    const discoveredSchemas = await Promise.all(
      dataSources.map((source: DataSource) => discoverSchema(source))
    )
    
    // Stage 2: Analyze and merge schemas into unified data model
    const unifiedDataModel = await analyzeAndMergeSchemas(discoveredSchemas)
    
    // Stage 3: Generate relationships and business logic
    const enhancedModel = await enhanceDataModel(unifiedDataModel, dataSources)
    
    // Stage 4: Create Airbyte connections for real-time sync
    const syncConnections = await createAirbyteConnections(dataSources, enhancedModel)
    
    // Stage 5: Generate Prisma schema
    const prismaSchema = await generatePrismaSchema(enhancedModel)
    
    // Stage 6: Create data architecture record
    const dataArchitecture = {
      id: `arch_${Date.now()}`,
      analysisId,
      tenantId,
      sources: dataSources.map((s: DataSource) => ({
        provider: s.provider,
        accountName: s.accountName,
        tablesDiscovered: discoveredSchemas.find(d => d.source === s.provider)?.tables.length || 0
      })),
      unifiedModels: enhancedModel.models,
      relationships: enhancedModel.relationships,
      syncConnections,
      prismaSchema,
      metrics: {
        totalTables: enhancedModel.models.length,
        totalFields: enhancedModel.models.reduce((sum: number, m: any) => sum + m.fields.length, 0),
        totalRelationships: enhancedModel.relationships.length,
        estimatedRecords: enhancedModel.models.reduce((sum: number, m: any) => sum + (m.recordCount || 0), 0)
      },
      recommendations: [
        'Enable real-time sync for critical data',
        'Set up data validation rules',
        'Configure backup and recovery',
        'Implement data retention policies'
      ],
      createdAt: new Date()
    }
    
    console.log('✅ Data architecture analysis complete')
    return NextResponse.json(dataArchitecture)
    
  } catch (error) {
    console.error('Data architecture analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Discover schema from a data source
async function discoverSchema(source: DataSource) {
  console.log(`🔍 Discovering schema for ${source.provider}`)
  
  try {
    switch (source.provider) {
      case 'shopify':
        return await discoverShopifySchema(source)
      case 'stripe':
        return await discoverStripeSchema(source)
      case 'quickbooks':
        return await discoverQuickBooksSchema(source)
      case 'salesforce':
        return await discoverSalesforceSchema(source)
      case 'postgresql':
      case 'mysql':
      case 'mongodb':
        return await discoverDatabaseSchema(source)
      default:
        return await discoverGenericSchema(source)
    }
  } catch (error) {
    console.error(`Failed to discover schema for ${source.provider}:`, error)
    return {
      source: source.provider,
      tables: [],
      error: error instanceof Error ? error.message : 'Discovery failed'
    }
  }
}

// Shopify schema discovery
async function discoverShopifySchema(source: DataSource) {
  // Get OAuth credential (mocked for demo)
  const credential = { 
    id: source.credentialId,
    accessToken: 'mock_token',
    metadata: { shop: 'demo.myshopify.com' }
  }
  
  if (!credential) {
    throw new Error('Credential not found')
  }
  
  const shop = credential.metadata.shop
  const accessToken = credential.accessToken
  
  // Discover main entities
  const tables = [
    {
      name: 'products',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'string', required: false },
        { name: 'vendor', type: 'string', required: false },
        { name: 'product_type', type: 'string', required: false },
        { name: 'price', type: 'decimal', required: true },
        { name: 'inventory_quantity', type: 'integer', required: true },
        { name: 'created_at', type: 'datetime', required: true },
        { name: 'updated_at', type: 'datetime', required: true }
      ],
      recordCount: 1000 // Would fetch actual count
    },
    {
      name: 'orders',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'order_number', type: 'string', required: true, unique: true },
        { name: 'customer_id', type: 'string', required: true },
        { name: 'total_price', type: 'decimal', required: true },
        { name: 'subtotal_price', type: 'decimal', required: true },
        { name: 'total_tax', type: 'decimal', required: true },
        { name: 'financial_status', type: 'string', required: true },
        { name: 'fulfillment_status', type: 'string', required: false },
        { name: 'created_at', type: 'datetime', required: true }
      ],
      recordCount: 5000
    },
    {
      name: 'customers',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'email', type: 'string', required: true, unique: true },
        { name: 'first_name', type: 'string', required: true },
        { name: 'last_name', type: 'string', required: true },
        { name: 'phone', type: 'string', required: false },
        { name: 'total_spent', type: 'decimal', required: true },
        { name: 'orders_count', type: 'integer', required: true },
        { name: 'created_at', type: 'datetime', required: true }
      ],
      recordCount: 2000
    }
  ]
  
  return {
    source: 'shopify',
    shop,
    tables,
    apiVersion: '2024-01'
  }
}

// Stripe schema discovery
async function discoverStripeSchema(source: DataSource) {
  const tables = [
    {
      name: 'charges',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'amount', type: 'integer', required: true },
        { name: 'currency', type: 'string', required: true },
        { name: 'customer_id', type: 'string', required: false },
        { name: 'description', type: 'string', required: false },
        { name: 'status', type: 'string', required: true },
        { name: 'created', type: 'timestamp', required: true }
      ],
      recordCount: 10000
    },
    {
      name: 'customers',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'email', type: 'string', required: true, unique: true },
        { name: 'name', type: 'string', required: false },
        { name: 'phone', type: 'string', required: false },
        { name: 'created', type: 'timestamp', required: true }
      ],
      recordCount: 3000
    },
    {
      name: 'subscriptions',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'customer_id', type: 'string', required: true },
        { name: 'status', type: 'string', required: true },
        { name: 'current_period_start', type: 'timestamp', required: true },
        { name: 'current_period_end', type: 'timestamp', required: true },
        { name: 'created', type: 'timestamp', required: true }
      ],
      recordCount: 500
    }
  ]
  
  return {
    source: 'stripe',
    tables,
    apiVersion: 'v1'
  }
}

// QuickBooks schema discovery
async function discoverQuickBooksSchema(source: DataSource) {
  const tables = [
    {
      name: 'invoices',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'doc_number', type: 'string', required: true, unique: true },
        { name: 'customer_ref', type: 'string', required: true },
        { name: 'total_amount', type: 'decimal', required: true },
        { name: 'balance', type: 'decimal', required: true },
        { name: 'due_date', type: 'date', required: true },
        { name: 'created_time', type: 'datetime', required: true }
      ],
      recordCount: 8000
    },
    {
      name: 'customers',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'display_name', type: 'string', required: true },
        { name: 'company_name', type: 'string', required: false },
        { name: 'email', type: 'string', required: false },
        { name: 'phone', type: 'string', required: false },
        { name: 'balance', type: 'decimal', required: true }
      ],
      recordCount: 1500
    },
    {
      name: 'items',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'name', type: 'string', required: true },
        { name: 'sku', type: 'string', required: false },
        { name: 'unit_price', type: 'decimal', required: true },
        { name: 'type', type: 'string', required: true }
      ],
      recordCount: 500
    }
  ]
  
  return {
    source: 'quickbooks',
    tables,
    companyId: source.metadata.companyId
  }
}

// Salesforce schema discovery
async function discoverSalesforceSchema(source: DataSource) {
  const tables = [
    {
      name: 'accounts',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'name', type: 'string', required: true },
        { name: 'type', type: 'string', required: false },
        { name: 'industry', type: 'string', required: false },
        { name: 'annual_revenue', type: 'decimal', required: false },
        { name: 'number_of_employees', type: 'integer', required: false }
      ],
      recordCount: 5000
    },
    {
      name: 'contacts',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'account_id', type: 'string', required: false },
        { name: 'first_name', type: 'string', required: true },
        { name: 'last_name', type: 'string', required: true },
        { name: 'email', type: 'string', required: true },
        { name: 'phone', type: 'string', required: false },
        { name: 'title', type: 'string', required: false }
      ],
      recordCount: 15000
    },
    {
      name: 'opportunities',
      fields: [
        { name: 'id', type: 'string', required: true, unique: true },
        { name: 'account_id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'stage', type: 'string', required: true },
        { name: 'amount', type: 'decimal', required: false },
        { name: 'close_date', type: 'date', required: true }
      ],
      recordCount: 3000
    }
  ]
  
  return {
    source: 'salesforce',
    tables,
    instanceUrl: source.metadata.instanceUrl
  }
}

// Database schema discovery (PostgreSQL, MySQL, MongoDB)
async function discoverDatabaseSchema(source: DataSource) {
  // This would connect to the actual database and introspect schema
  // For now, return generic schema
  return {
    source: source.provider,
    tables: [
      {
        name: 'users',
        fields: [
          { name: 'id', type: 'uuid', required: true, unique: true },
          { name: 'email', type: 'string', required: true, unique: true },
          { name: 'name', type: 'string', required: true },
          { name: 'created_at', type: 'timestamp', required: true }
        ],
        recordCount: 1000
      }
    ]
  }
}

// Generic schema discovery
async function discoverGenericSchema(source: DataSource) {
  return {
    source: source.provider,
    tables: [],
    message: 'Manual schema configuration required'
  }
}

// Analyze and merge schemas into unified data model
async function analyzeAndMergeSchemas(schemas: any[]) {
  console.log('🤝 Merging schemas into unified data model')
  
  const unifiedModels: DataModel[] = []
  const modelMap = new Map<string, DataModel>()
  
  // First pass: collect all models
  for (const schema of schemas) {
    if (!schema.tables) continue
    
    for (const table of schema.tables) {
      const modelName = normalizeModelName(table.name)
      
      if (!modelMap.has(modelName)) {
        modelMap.set(modelName, {
          name: modelName,
          source: schema.source,
          fields: [],
          recordCount: table.recordCount
        })
      }
      
      const model = modelMap.get(modelName)!
      
      // Merge fields
      for (const field of table.fields) {
        const existingField = model.fields.find(f => f.name === field.name)
        if (!existingField) {
          model.fields.push({
            ...field,
            businessReason: `From ${schema.source} ${table.name}`
          })
        } else {
          // Update field if more restrictive
          if (field.required && !existingField.required) {
            existingField.required = true
          }
          if (field.unique && !existingField.unique) {
            existingField.unique = true
          }
        }
      }
      
      // Update record count
      if (table.recordCount && (!model.recordCount || table.recordCount > model.recordCount)) {
        model.recordCount = table.recordCount
      }
    }
  }
  
  // Convert to array
  unifiedModels.push(...Array.from(modelMap.values()))
  
  // Use AI to enhance and validate the unified model (only if OpenAI API key is available)
  let enhanced
  if (process.env.OPENAI_API_KEY) {
    try {
      enhanced = await enhanceWithAI(unifiedModels, schemas)
    } catch (error) {
      console.warn('⚠️ AI enhancement failed, using basic model:', error)
      enhanced = {
        models: unifiedModels,
        relationships: [],
        recommendations: []
      }
    }
  } else {
    console.log('📋 Using basic data model (no OpenAI API key)')
    enhanced = {
      models: unifiedModels,
      relationships: [],
      recommendations: ['Enable OpenAI API for enhanced data model analysis']
    }
  }
  
  return enhanced
}

// Normalize model names across different sources
function normalizeModelName(name: string): string {
  const mappings: Record<string, string> = {
    'customers': 'Customer',
    'customer': 'Customer',
    'users': 'User',
    'user': 'User',
    'products': 'Product',
    'product': 'Product',
    'items': 'Product',
    'orders': 'Order',
    'order': 'Order',
    'invoices': 'Invoice',
    'invoice': 'Invoice',
    'charges': 'Payment',
    'payments': 'Payment',
    'subscriptions': 'Subscription',
    'subscription': 'Subscription'
  }
  
  const normalized = mappings[name.toLowerCase()] || name
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

// Enhance data model with AI
async function enhanceWithAI(models: DataModel[], schemas: any[]) {
  const prompt = `
Analyze this unified data model and enhance it:

Models:
${JSON.stringify(models, null, 2)}

Original schemas from:
${schemas.map(s => `- ${s.source}: ${s.tables?.length || 0} tables`).join('\n')}

Provide enhanced model in this JSON format:
{
  "models": [
    {
      "name": "ModelName",
      "source": "primary source",
      "description": "Business purpose",
      "fields": [...existing fields...],
      "recordCount": estimated count,
      "businessImportance": "critical|high|medium|low"
    }
  ],
  "relationships": [
    {
      "from": "Model1",
      "to": "Model2",
      "type": "one-to-many",
      "field": "model2_id",
      "description": "Business relationship"
    }
  ],
  "recommendations": [
    "Specific recommendations for this data architecture"
  ]
}

Focus on:
1. Identifying relationships between models
2. Adding business context and descriptions
3. Recommending additional fields or models
4. Prioritizing models by business importance
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
    
    const content = response.choices[0].message.content || '{}'
    // Handle markdown-formatted JSON
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
    const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
    return JSON.parse(jsonContent)
  } catch (error) {
    console.error('AI enhancement error:', error)
    return {
      models,
      relationships: [],
      recommendations: []
    }
  }
}

// Enhance data model with business logic
async function enhanceDataModel(unifiedModel: any, dataSources: DataSource[]) {
  console.log('🔧 Enhancing data model with business logic')
  
  // Add computed fields
  for (const model of unifiedModel.models) {
    if (model.name === 'Customer') {
      model.fields.push({
        name: 'lifetime_value',
        type: 'decimal',
        required: false,
        computed: true,
        description: 'Total value of all customer orders'
      })
    }
    
    if (model.name === 'Product') {
      model.fields.push({
        name: 'profit_margin',
        type: 'decimal',
        required: false,
        computed: true,
        description: 'Calculated profit margin percentage'
      })
    }
  }
  
  // Add audit fields to all models
  for (const model of unifiedModel.models) {
    const hasCreatedAt = model.fields.some((f: Field) => 
      f.name === 'created_at' || f.name === 'createdAt'
    )
    const hasUpdatedAt = model.fields.some((f: Field) => 
      f.name === 'updated_at' || f.name === 'updatedAt'
    )
    
    if (!hasCreatedAt) {
      model.fields.push({
        name: 'createdAt',
        type: 'datetime',
        required: true,
        description: 'Record creation timestamp'
      })
    }
    
    if (!hasUpdatedAt) {
      model.fields.push({
        name: 'updatedAt',
        type: 'datetime',
        required: true,
        description: 'Last update timestamp'
      })
    }
  }
  
  return unifiedModel
}

// Create Airbyte connections for real-time sync
async function createAirbyteConnections(dataSources: DataSource[], dataModel: any) {
  console.log('🔄 Setting up Airbyte sync connections')
  
  const connections = []
  
  for (const source of dataSources) {
    try {
      const connection = await createAirbyteConnection(source, dataModel)
      connections.push(connection)
    } catch (error) {
      console.error(`Failed to create Airbyte connection for ${source.provider}:`, error)
      connections.push({
        provider: source.provider,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Connection failed'
      })
    }
  }
  
  return connections
}

// Create individual Airbyte connection
async function createAirbyteConnection(source: DataSource, dataModel: any) {
  // In production, this would call Airbyte API
  // For now, simulate connection creation
  
  const connectionConfig = {
    sourceId: `src_${source.provider}_${Date.now()}`,
    destinationId: `dest_postgres_${Date.now()}`,
    provider: source.provider,
    accountName: source.accountName,
    syncMode: 'incremental',
    frequency: 'realtime', // or '5min', '1hour', etc.
    streams: dataModel.models
      .filter((m: DataModel) => m.source === source.provider)
      .map((m: DataModel) => ({
        name: m.name.toLowerCase(),
        syncMode: 'incremental_deduped',
        primaryKey: [['id']],
        cursorField: ['updated_at']
      })),
    status: 'active',
    lastSync: null,
    nextSync: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  }
  
  return connectionConfig
}

// Generate Prisma schema from unified data model
async function generatePrismaSchema(dataModel: any) {
  console.log('📝 Generating Prisma schema')
  
  let schema = `// Generated Prisma Schema\n// Created: ${new Date().toISOString()}\n\n`
  schema += `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n`
  schema += `generator client {\n  provider = "prisma-client-js"\n}\n\n`
  
  // Add enum definitions
  const enums = new Set<string>()
  for (const model of dataModel.models) {
    for (const field of model.fields) {
      if (field.name.includes('status') || field.name.includes('type')) {
        enums.add(field.name)
      }
    }
  }
  
  // Generate models
  for (const model of dataModel.models) {
    schema += `model ${model.name} {\n`
    schema += `  id        String   @id @default(cuid())\n`
    schema += `  tenantId  String   @db.VarChar(50)\n`
    
    // Add fields
    for (const field of model.fields) {
      if (field.name === 'id') continue // Already added
      
      const fieldType = mapToPrismaType(field.type)
      const isOptional = !field.required ? '?' : ''
      const isUnique = field.unique ? ' @unique' : ''
      
      schema += `  ${field.name} ${fieldType}${isOptional}${isUnique}\n`
    }
    
    // Add timestamps if not present
    if (!model.fields.some((f: Field) => f.name === 'createdAt')) {
      schema += `  createdAt DateTime @default(now())\n`
    }
    if (!model.fields.some((f: Field) => f.name === 'updatedAt')) {
      schema += `  updatedAt DateTime @updatedAt\n`
    }
    
    // Add relationships
    const relationships = dataModel.relationships.filter(
      (r: Relationship) => r.from === model.name
    )
    
    for (const rel of relationships) {
      if (rel.type === 'one-to-many') {
        schema += `  ${rel.to.toLowerCase()}s ${rel.to}[]\n`
      } else if (rel.type === 'many-to-one') {
        schema += `  ${rel.to.toLowerCase()} ${rel.to}? @relation(fields: [${rel.field}], references: [id])\n`
      }
    }
    
    // Add indexes
    schema += `\n  @@index([tenantId])\n`
    schema += `  @@map("${model.name.toLowerCase()}s")\n`
    schema += `}\n\n`
  }
  
  return schema
}

// Map field types to Prisma types
function mapToPrismaType(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'String',
    'integer': 'Int',
    'number': 'Float',
    'decimal': 'Decimal',
    'boolean': 'Boolean',
    'date': 'DateTime',
    'datetime': 'DateTime',
    'timestamp': 'DateTime',
    'json': 'Json',
    'uuid': 'String',
    'text': 'String @db.Text'
  }
  
  return typeMap[type.toLowerCase()] || 'String'
}