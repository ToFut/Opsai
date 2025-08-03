import OpenAI from 'openai'
import { DataTypeMapper } from './data-type-mapper'
import { RelationshipDetector } from './relationship-detector'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export interface AnalyzedField {
  name: string
  type: string
  required: boolean
  unique: boolean
  defaultValue?: any
  attributes: string[]
  businessPurpose?: string
}

export interface AnalyzedModel {
  name: string
  tableName: string
  fields: AnalyzedField[]
  indexes: string[]
  businessPurpose?: string
}

export class SchemaAnalyzer {
  /**
   * Analyze sample data from multiple sources and generate unified schema
   */
  static async analyzeDataSources(dataSources: {
    source: string
    type: string
    data: any[]
    metadata?: any
  }[]): Promise<{
    models: AnalyzedModel[]
    relationships: any[]
    insights: any
  }> {
    console.log('🔍 Analyzing data from', dataSources.length, 'sources...')
    
    // Group data by entity type
    const entityMap = this.groupDataByEntity(dataSources)
    
    // Analyze each entity
    const models: AnalyzedModel[] = []
    for (const [entityName, entityData] of entityMap) {
      const model = await this.analyzeEntity(entityName, entityData)
      models.push(model)
    }
    
    // Detect relationships
    const relationships = RelationshipDetector.detectRelationships(entityMap)
    
    // Get AI insights
    const insights = await this.getAIInsights(models, relationships, dataSources)
    
    return { models, relationships, insights }
  }
  
  /**
   * Group data by business entity
   */
  private static groupDataByEntity(dataSources: any[]): Map<string, any> {
    const entityMap = new Map<string, any>()
    
    for (const source of dataSources) {
      // Extract entity name from source metadata or data structure
      const entities = this.identifyEntities(source)
      
      for (const entity of entities) {
        if (!entityMap.has(entity.name)) {
          entityMap.set(entity.name, {
            sources: [],
            sampleData: [],
            fields: new Map()
          })
        }
        
        const entityData = entityMap.get(entity.name)
        entityData.sources.push(source.source)
        entityData.sampleData.push(...entity.data)
        
        // Merge fields from different sources
        for (const item of entity.data) {
          for (const [field, value] of Object.entries(item)) {
            if (!entityData.fields.has(field)) {
              entityData.fields.set(field, {
                samples: [],
                sources: new Set()
              })
            }
            entityData.fields.get(field).samples.push(value)
            entityData.fields.get(field).sources.add(source.source)
          }
        }
      }
    }
    
    return entityMap
  }
  
  /**
   * Identify business entities in source data
   */
  private static identifyEntities(source: any): any[] {
    const entities: any[] = []
    
    // Handle different source types
    if (source.type === 'shopify') {
      if (source.data.products) entities.push({ name: 'Product', data: source.data.products })
      if (source.data.customers) entities.push({ name: 'Customer', data: source.data.customers })
      if (source.data.orders) entities.push({ name: 'Order', data: source.data.orders })
    } else if (source.type === 'stripe') {
      if (source.data.customers) entities.push({ name: 'Customer', data: source.data.customers })
      if (source.data.payments) entities.push({ name: 'Payment', data: source.data.payments })
      if (source.data.subscriptions) entities.push({ name: 'Subscription', data: source.data.subscriptions })
    } else if (source.type === 'postgres' || source.type === 'mysql') {
      // For databases, each table is an entity
      for (const [tableName, tableData] of Object.entries(source.data)) {
        entities.push({ 
          name: this.pascalCase(tableName), 
          data: Array.isArray(tableData) ? tableData : [tableData] 
        })
      }
    } else {
      // Generic handling
      if (Array.isArray(source.data)) {
        entities.push({ name: this.inferEntityName(source), data: source.data })
      } else {
        for (const [key, value] of Object.entries(source.data)) {
          if (Array.isArray(value)) {
            entities.push({ name: this.pascalCase(key), data: value })
          }
        }
      }
    }
    
    return entities
  }
  
  /**
   * Analyze a single entity and generate model
   */
  private static async analyzeEntity(
    entityName: string, 
    entityData: any
  ): Promise<AnalyzedModel> {
    const fields: AnalyzedField[] = []
    
    // Always add an ID field
    fields.push({
      name: 'id',
      type: 'String @id @default(cuid())',
      required: true,
      unique: true,
      attributes: []
    })
    
    // Analyze each field
    for (const [fieldName, fieldData] of entityData.fields) {
      if (fieldName === 'id') continue // Skip, already added
      
      const samples = fieldData.samples.filter((s: any) => s !== null && s !== undefined)
      if (samples.length === 0) continue
      
      // Determine field type
      const fieldType = DataTypeMapper.inferTypeFromValue(samples[0])
      const isRequired = DataTypeMapper.isFieldRequired(entityData.sampleData, fieldName)
      const isUnique = DataTypeMapper.isFieldUnique(entityData.sampleData, fieldName)
      const attributes = DataTypeMapper.getDatabaseAttributes(fieldName, fieldType)
      
      fields.push({
        name: this.camelCase(fieldName),
        type: fieldType + (isRequired ? '' : '?'),
        required: isRequired,
        unique: isUnique,
        attributes: isUnique ? ['@unique', ...attributes] : attributes
      })
    }
    
    // Add timestamps
    if (!fields.find(f => f.name === 'createdAt')) {
      fields.push({
        name: 'createdAt',
        type: 'DateTime @default(now())',
        required: true,
        unique: false,
        attributes: []
      })
    }
    
    if (!fields.find(f => f.name === 'updatedAt')) {
      fields.push({
        name: 'updatedAt',
        type: 'DateTime @updatedAt',
        required: true,
        unique: false,
        attributes: []
      })
    }
    
    return {
      name: entityName,
      tableName: this.snakeCase(entityName) + 's',
      fields,
      indexes: this.generateIndexes(fields)
    }
  }
  
  /**
   * Get AI insights about the schema
   */
  private static async getAIInsights(
    models: AnalyzedModel[], 
    relationships: any[],
    dataSources: any[]
  ): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a database architect analyzing business data models. 
            Provide insights about the data structure, suggest optimizations, and identify business logic.`
          },
          {
            role: 'user',
            content: `Analyze this discovered schema:
            
            Models: ${JSON.stringify(models, null, 2)}
            Relationships: ${JSON.stringify(relationships, null, 2)}
            Data Sources: ${dataSources.map(s => s.source).join(', ')}
            
            Provide:
            1. Business logic insights
            2. Suggested computed fields
            3. Recommended indexes
            4. Data quality observations
            5. Integration opportunities`
          }
        ],
        response_format: { type: 'json_object' }
      })
      
      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      console.warn('AI insights failed, using defaults')
      return {
        businessLogic: ['Standard e-commerce data model detected'],
        computedFields: ['totalRevenue', 'customerLifetimeValue'],
        indexes: ['customer_email', 'order_status'],
        dataQuality: ['Good - consistent field naming'],
        integrations: ['Consider adding analytics tracking']
      }
    }
  }
  
  /**
   * Generate indexes based on fields
   */
  private static generateIndexes(fields: AnalyzedField[]): string[] {
    const indexes: string[] = []
    
    // Index foreign keys
    fields.forEach(field => {
      if (field.name.endsWith('Id') && field.name !== 'id') {
        indexes.push(`@@index([${field.name}])`)
      }
    })
    
    // Index commonly queried fields
    const commonQueryFields = ['email', 'status', 'type', 'createdAt']
    fields.forEach(field => {
      if (commonQueryFields.includes(field.name) && !field.unique) {
        indexes.push(`@@index([${field.name}])`)
      }
    })
    
    return indexes
  }
  
  // Utility functions
  private static pascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^./, char => char.toUpperCase())
  }
  
  private static camelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^./, char => char.toLowerCase())
  }
  
  private static snakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
  }
  
  private static inferEntityName(source: any): string {
    if (source.metadata?.entityName) return source.metadata.entityName
    if (source.type) return this.pascalCase(source.type)
    return 'Entity'
  }
}