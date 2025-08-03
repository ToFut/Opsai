import { SchemaAnalyzer, AnalyzedModel } from './schema-analyzer'
import { RelationshipDetector } from './relationship-detector'
import * as fs from 'fs'
import * as path from 'path'

export interface SchemaGenerationOptions {
  databaseProvider: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb'
  multiTenant: boolean
  tenantId?: string
  outputPath: string
  includeSeeds?: boolean
}

export class DynamicSchemaGenerator {
  /**
   * Generate Prisma schema from analyzed data sources
   */
  static async generateFromDataSources(
    dataSources: any[],
    options: SchemaGenerationOptions
  ): Promise<{
    schema: string
    models: AnalyzedModel[]
    insights: any
  }> {
    console.log('🚀 Starting dynamic schema generation...')
    
    // Analyze data sources
    const { models, relationships, insights } = await SchemaAnalyzer.analyzeDataSources(dataSources)
    
    // Generate Prisma schema
    const schema = this.generatePrismaSchema(models, relationships, options)
    
    // Write schema to file
    await this.writeSchemaFile(schema, options.outputPath)
    
    // Generate seed data if requested
    if (options.includeSeeds) {
      await this.generateSeedData(models, dataSources, options)
    }
    
    return { schema, models, insights }
  }
  
  /**
   * Generate Prisma schema file content
   */
  private static generatePrismaSchema(
    models: AnalyzedModel[],
    relationships: any[],
    options: SchemaGenerationOptions
  ): string {
    const lines: string[] = []
    
    // Header
    lines.push('// This schema was automatically generated from your business data')
    lines.push(`// Generated at: ${new Date().toISOString()}`)
    lines.push('')
    
    // Generator
    lines.push('generator client {')
    lines.push('  provider = "prisma-client-js"')
    lines.push('}')
    lines.push('')
    
    // Datasource
    lines.push('datasource db {')
    lines.push(`  provider = "${options.databaseProvider}"`)
    lines.push('  url      = env("DATABASE_URL")')
    if (options.multiTenant && options.databaseProvider === 'postgresql') {
      lines.push('  schemas  = ["public", "tenant"]')
    }
    lines.push('}')
    lines.push('')
    
    // Models
    for (const model of models) {
      lines.push(`model ${model.name} {`)
      
      // Add tenant ID if multi-tenant
      if (options.multiTenant) {
        lines.push('  tenantId String')
      }
      
      // Fields
      for (const field of model.fields) {
        let fieldLine = `  ${field.name} ${field.type}`
        if (field.attributes.length > 0) {
          fieldLine += ' ' + field.attributes.join(' ')
        }
        lines.push(fieldLine)
      }
      
      // Add relationships
      const modelRelationships = relationships.filter(
        r => r.from === model.name || r.to === model.name
      )
      
      for (const rel of modelRelationships) {
        const relationDef = RelationshipDetector.generatePrismaRelation(rel)
        if (rel.from === model.name && relationDef.fromModel) {
          lines.push('  ' + relationDef.fromModel.split('\n').join('\n  '))
        }
        if (rel.to === model.name && relationDef.toModel) {
          lines.push('  ' + relationDef.toModel)
        }
      }
      
      // Indexes
      if (model.indexes.length > 0) {
        lines.push('')
        model.indexes.forEach(index => lines.push('  ' + index))
      }
      
      // Multi-tenant index
      if (options.multiTenant) {
        lines.push('')
        lines.push('  @@index([tenantId])')
      }
      
      // Table mapping
      if (model.tableName !== model.name.toLowerCase()) {
        lines.push('')
        lines.push(`  @@map("${model.tableName}")`)
      }
      
      lines.push('}')
      lines.push('')
    }
    
    // Add computed/view models if suggested by insights
    if (models.length > 0) {
      lines.push(this.generateComputedModels(models))
    }
    
    return lines.join('\n')
  }
  
  /**
   * Generate computed models for common patterns
   */
  private static generateComputedModels(models: AnalyzedModel[]): string {
    const lines: string[] = []
    
    // Check for e-commerce pattern
    const hasOrder = models.some(m => m.name.toLowerCase().includes('order'))
    const hasCustomer = models.some(m => m.name.toLowerCase().includes('customer'))
    
    if (hasOrder && hasCustomer) {
      lines.push('// Computed view for customer analytics')
      lines.push('model CustomerAnalytics {')
      lines.push('  id              String   @id @default(cuid())')
      lines.push('  customerId      String   @unique')
      lines.push('  totalOrders     Int      @default(0)')
      lines.push('  totalSpent      Decimal  @default(0)')
      lines.push('  averageOrder    Decimal  @default(0)')
      lines.push('  lastOrderDate   DateTime?')
      lines.push('  churnRisk       String?  // high, medium, low')
      lines.push('  lifetimeValue   Decimal  @default(0)')
      lines.push('  createdAt       DateTime @default(now())')
      lines.push('  updatedAt       DateTime @updatedAt')
      lines.push('  ')
      lines.push('  customer Customer @relation(fields: [customerId], references: [id])')
      lines.push('  ')
      lines.push('  @@map("customer_analytics")')
      lines.push('}')
      lines.push('')
    }
    
    return lines.join('\n')
  }
  
  /**
   * Write schema to file
   */
  private static async writeSchemaFile(schema: string, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(outputPath, schema)
    console.log(`✅ Schema written to ${outputPath}`)
  }
  
  /**
   * Generate seed data based on sample data
   */
  private static async generateSeedData(
    models: AnalyzedModel[],
    dataSources: any[],
    options: SchemaGenerationOptions
  ): Promise<void> {
    const seedPath = path.join(path.dirname(options.outputPath), 'seed.ts')
    
    const lines: string[] = []
    lines.push("import { PrismaClient } from '@prisma/client'")
    lines.push('')
    lines.push('const prisma = new PrismaClient()')
    lines.push('')
    lines.push('async function main() {')
    
    if (options.multiTenant && options.tenantId) {
      lines.push(`  const tenantId = '${options.tenantId}'`)
      lines.push('')
    }
    
    // Generate seed data for each model
    for (const model of models) {
      lines.push(`  // Seed ${model.name}`)
      lines.push(`  console.log('Seeding ${model.name}...')`)
      
      // Find sample data for this model
      const sampleData = this.findSampleData(model.name, dataSources)
      if (sampleData && sampleData.length > 0) {
        const sample = sampleData[0]
        const fields = model.fields
          .filter(f => !['id', 'createdAt', 'updatedAt'].includes(f.name))
          .filter(f => sample[f.name] !== undefined)
        
        lines.push(`  await prisma.${model.name.toLowerCase()}.create({`)
        lines.push('    data: {')
        if (options.multiTenant) {
          lines.push('      tenantId,')
        }
        fields.forEach(field => {
          const value = this.formatSeedValue(sample[field.name], field.type)
          lines.push(`      ${field.name}: ${value},`)
        })
        lines.push('    }')
        lines.push('  })')
      }
      lines.push('')
    }
    
    lines.push('}')
    lines.push('')
    lines.push('main()')
    lines.push('  .catch(console.error)')
    lines.push('  .finally(async () => await prisma.$disconnect())')
    
    fs.writeFileSync(seedPath, lines.join('\n'))
    console.log(`✅ Seed file written to ${seedPath}`)
  }
  
  /**
   * Find sample data for a model
   */
  private static findSampleData(modelName: string, dataSources: any[]): any[] {
    for (const source of dataSources) {
      // Check various data locations
      if (Array.isArray(source.data)) {
        return source.data.slice(0, 5) // Return first 5 samples
      }
      
      const plural = modelName.toLowerCase() + 's'
      const singular = modelName.toLowerCase()
      
      if (source.data[plural]) return source.data[plural].slice(0, 5)
      if (source.data[singular]) return [source.data[singular]].slice(0, 5)
      
      // Check nested structures
      for (const [key, value] of Object.entries(source.data)) {
        if (Array.isArray(value) && key.toLowerCase().includes(singular)) {
          return value.slice(0, 5)
        }
      }
    }
    
    return []
  }
  
  /**
   * Format value for seed data
   */
  private static formatSeedValue(value: any, type: string): string {
    if (value === null || value === undefined) return 'null'
    
    if (type.includes('String') || type.includes('Text')) {
      return `'${String(value).replace(/'/g, "\\'")}'`
    }
    
    if (type.includes('Int') || type.includes('Float') || type.includes('Decimal')) {
      return String(value)
    }
    
    if (type.includes('Boolean')) {
      return String(Boolean(value))
    }
    
    if (type.includes('DateTime')) {
      return `new Date('${value}')`
    }
    
    if (type.includes('Json')) {
      return JSON.stringify(value)
    }
    
    return `'${value}'`
  }
  
  /**
   * Validate generated schema
   */
  static async validateSchema(schemaPath: string): Promise<{
    valid: boolean
    errors: string[]
  }> {
    try {
      // In production, you'd run: npx prisma validate
      const { execSync } = require('child_process')
      execSync(`npx prisma validate --schema=${schemaPath}`, { stdio: 'pipe' })
      return { valid: true, errors: [] }
    } catch (error: any) {
      return { 
        valid: false, 
        errors: [error.message || 'Schema validation failed'] 
      }
    }
  }
}