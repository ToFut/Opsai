/**
 * Detects relationships between data models based on field names and data
 */

interface Relationship {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  fromField: string
  toField: string
  onDelete?: 'Cascade' | 'SetNull' | 'Restrict'
}

export class RelationshipDetector {
  /**
   * Detect relationships between models based on field names and data
   */
  static detectRelationships(models: Map<string, any>): Relationship[] {
    const relationships: Relationship[] = []
    const modelNames = Array.from(models.keys())
    
    for (const [modelName, modelData] of models) {
      const fields = Object.keys(modelData.sampleData[0] || {})
      
      for (const field of fields) {
        // Check for foreign key patterns
        const relationship = this.detectForeignKey(field, modelName, modelNames)
        if (relationship) {
          relationships.push(relationship)
        }
        
        // Check for array fields that might indicate relationships
        const arrayRelation = this.detectArrayRelationship(
          field, 
          modelName, 
          modelData.sampleData
        )
        if (arrayRelation) {
          relationships.push(arrayRelation)
        }
      }
    }
    
    // Detect many-to-many relationships
    const manyToMany = this.detectManyToManyRelationships(models)
    relationships.push(...manyToMany)
    
    return this.deduplicateRelationships(relationships)
  }
  
  /**
   * Detect foreign key based on field naming patterns
   */
  private static detectForeignKey(
    fieldName: string, 
    currentModel: string, 
    allModels: string[]
  ): Relationship | null {
    // Common patterns: userId, user_id, customerId, customer_id
    const fkPattern = /^(.+?)(_id|Id|ID)$/
    const match = fieldName.match(fkPattern)
    
    if (match) {
      const referencedModel = match[1]
      const normalizedRef = this.normalizeModelName(referencedModel)
      
      // Check if referenced model exists
      const targetModel = allModels.find(model => 
        this.normalizeModelName(model) === normalizedRef
      )
      
      if (targetModel && targetModel !== currentModel) {
        return {
          from: currentModel,
          to: targetModel,
          type: 'one-to-many',
          fromField: fieldName,
          toField: 'id',
          onDelete: 'Cascade'
        }
      }
    }
    
    return null
  }
  
  /**
   * Detect relationships from array fields
   */
  private static detectArrayRelationship(
    fieldName: string,
    modelName: string,
    sampleData: any[]
  ): Relationship | null {
    if (sampleData.length === 0) return null
    
    const firstSample = sampleData[0]
    const fieldValue = firstSample[fieldName]
    
    // Check if it's an array of IDs
    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
      if (typeof fieldValue[0] === 'string' || typeof fieldValue[0] === 'number') {
        // Likely an array of IDs
        const singularName = this.singularize(fieldName)
        return {
          from: modelName,
          to: this.capitalize(singularName),
          type: 'many-to-many',
          fromField: fieldName,
          toField: 'id'
        }
      }
    }
    
    return null
  }
  
  /**
   * Detect many-to-many relationships through junction tables
   */
  private static detectManyToManyRelationships(
    models: Map<string, any>
  ): Relationship[] {
    const relationships: Relationship[] = []
    
    for (const [modelName, modelData] of models) {
      // Check if this might be a junction table
      const fields = Object.keys(modelData.sampleData[0] || {})
      const fkFields = fields.filter(f => f.endsWith('_id') || f.endsWith('Id'))
      
      if (fkFields.length === 2) {
        // Likely a junction table
        const [field1, field2] = fkFields
        const model1 = this.extractModelFromFK(field1)
        const model2 = this.extractModelFromFK(field2)
        
        if (model1 && model2) {
          relationships.push({
            from: model1,
            to: model2,
            type: 'many-to-many',
            fromField: field1,
            toField: field2
          })
        }
      }
    }
    
    return relationships
  }
  
  /**
   * Extract model name from foreign key field
   */
  private static extractModelFromFK(fieldName: string): string {
    const cleaned = fieldName.replace(/(_id|Id|ID)$/, '')
    return this.capitalize(cleaned)
  }
  
  /**
   * Normalize model name for comparison
   */
  private static normalizeModelName(name: string): string {
    return name.toLowerCase().replace(/[_-]/g, '')
  }
  
  /**
   * Capitalize first letter
   */
  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
  
  /**
   * Simple singularization
   */
  private static singularize(str: string): string {
    if (str.endsWith('ies')) {
      return str.slice(0, -3) + 'y'
    }
    if (str.endsWith('es')) {
      return str.slice(0, -2)
    }
    if (str.endsWith('s')) {
      return str.slice(0, -1)
    }
    return str
  }
  
  /**
   * Remove duplicate relationships
   */
  private static deduplicateRelationships(
    relationships: Relationship[]
  ): Relationship[] {
    const seen = new Set<string>()
    return relationships.filter(rel => {
      const key = `${rel.from}-${rel.to}-${rel.fromField}-${rel.toField}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  
  /**
   * Generate Prisma relation syntax
   */
  static generatePrismaRelation(relationship: Relationship): {
    fromModel: string
    toModel: string
  } {
    const { from, to, type, fromField, toField, onDelete } = relationship
    
    if (type === 'one-to-many') {
      return {
        fromModel: `${fromField} String\n  ${to.toLowerCase()} ${to} @relation(fields: [${fromField}], references: [${toField}]${onDelete ? `, onDelete: ${onDelete}` : ''})`,
        toModel: `${from.toLowerCase()}s ${from}[]`
      }
    }
    
    if (type === 'one-to-one') {
      return {
        fromModel: `${fromField} String @unique\n  ${to.toLowerCase()} ${to} @relation(fields: [${fromField}], references: [${toField}])`,
        toModel: `${from.toLowerCase()} ${from}?`
      }
    }
    
    // Many-to-many
    return {
      fromModel: `${to.toLowerCase()}s ${to}[]`,
      toModel: `${from.toLowerCase()}s ${from}[]`
    }
  }
}