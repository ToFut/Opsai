/**
 * Maps data types from various sources to Prisma schema types
 */

export class DataTypeMapper {
  /**
   * Map source data type to Prisma type
   */
  static mapToPrismaType(sourceType: string, source: string): string {
    const normalizedType = sourceType.toLowerCase()
    
    // PostgreSQL types
    if (source === 'postgres') {
      const pgToPrisma: Record<string, string> = {
        'varchar': 'String',
        'character varying': 'String',
        'text': 'String',
        'char': 'String',
        'uuid': 'String @db.Uuid',
        'integer': 'Int',
        'int': 'Int',
        'bigint': 'BigInt',
        'smallint': 'Int',
        'decimal': 'Decimal',
        'numeric': 'Decimal',
        'real': 'Float',
        'double precision': 'Float',
        'boolean': 'Boolean',
        'bool': 'Boolean',
        'date': 'DateTime @db.Date',
        'timestamp': 'DateTime',
        'timestamptz': 'DateTime @db.Timestamptz',
        'time': 'String @db.Time',
        'json': 'Json',
        'jsonb': 'Json',
        'array': '[]', // Will be prefixed with element type
        'bytea': 'Bytes'
      }
      return pgToPrisma[normalizedType] || 'String'
    }
    
    // MySQL types
    if (source === 'mysql') {
      const mysqlToPrisma: Record<string, string> = {
        'varchar': 'String',
        'char': 'String',
        'text': 'String',
        'tinytext': 'String',
        'mediumtext': 'String',
        'longtext': 'String',
        'int': 'Int',
        'integer': 'Int',
        'tinyint': 'Int',
        'smallint': 'Int',
        'mediumint': 'Int',
        'bigint': 'BigInt',
        'decimal': 'Decimal',
        'float': 'Float',
        'double': 'Float',
        'boolean': 'Boolean',
        'date': 'DateTime @db.Date',
        'datetime': 'DateTime',
        'timestamp': 'DateTime',
        'time': 'String',
        'year': 'Int',
        'json': 'Json',
        'blob': 'Bytes',
        'binary': 'Bytes'
      }
      return mysqlToPrisma[normalizedType] || 'String'
    }
    
    // API/JSON types (from Stripe, Shopify, etc.)
    const jsonToPrisma: Record<string, string> = {
      'string': 'String',
      'number': 'Float',
      'integer': 'Int',
      'boolean': 'Boolean',
      'object': 'Json',
      'array': 'Json',
      'null': 'String?',
      'date': 'DateTime',
      'datetime': 'DateTime',
      'timestamp': 'DateTime',
      'email': 'String @db.Text',
      'url': 'String @db.Text',
      'uuid': 'String @db.Uuid',
      'money': 'Decimal',
      'currency': 'String',
      'percentage': 'Float'
    }
    
    return jsonToPrisma[normalizedType] || 'String'
  }
  
  /**
   * Infer type from sample data
   */
  static inferTypeFromValue(value: any): string {
    if (value === null || value === undefined) {
      return 'String?'
    }
    
    if (typeof value === 'string') {
      // Check for specific string patterns
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        return 'DateTime'
      }
      if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) {
        return 'String @db.Uuid'
      }
      if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        return 'String @db.Text'
      }
      if (/^https?:\/\//.test(value)) {
        return 'String @db.Text'
      }
      return 'String'
    }
    
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'Int' : 'Float'
    }
    
    if (typeof value === 'boolean') {
      return 'Boolean'
    }
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        const elementType = this.inferTypeFromValue(value[0])
        return elementType.replace(/[?@].*$/, '') + '[]'
      }
      return 'Json'
    }
    
    if (typeof value === 'object') {
      return 'Json'
    }
    
    return 'String'
  }
  
  /**
   * Determine if a field should be required based on sample data
   */
  static isFieldRequired(samples: any[], fieldName: string): boolean {
    if (samples.length === 0) return false
    
    // Check if field exists and is non-null in all samples
    const nonNullCount = samples.filter(sample => 
      sample[fieldName] !== null && 
      sample[fieldName] !== undefined &&
      sample[fieldName] !== ''
    ).length
    
    // If more than 90% of samples have the field, consider it required
    return nonNullCount / samples.length > 0.9
  }
  
  /**
   * Determine if a field should be unique based on sample data
   */
  static isFieldUnique(samples: any[], fieldName: string): boolean {
    if (samples.length < 2) return false
    
    const values = samples
      .map(sample => sample[fieldName])
      .filter(val => val !== null && val !== undefined)
    
    const uniqueValues = new Set(values)
    
    // If all values are unique and field name suggests uniqueness
    const uniqueFieldNames = ['id', 'email', 'username', 'slug', 'sku', 'code']
    const fieldNameSuggestsUnique = uniqueFieldNames.some(name => 
      fieldName.toLowerCase().includes(name)
    )
    
    return values.length > 0 && 
           uniqueValues.size === values.length && 
           fieldNameSuggestsUnique
  }
  
  /**
   * Get database-specific attributes
   */
  static getDatabaseAttributes(fieldName: string, dataType: string): string[] {
    const attributes: string[] = []
    
    // Add default values for timestamps
    if (fieldName === 'createdAt' || fieldName === 'created_at') {
      attributes.push('@default(now())')
    }
    
    if (fieldName === 'updatedAt' || fieldName === 'updated_at') {
      attributes.push('@updatedAt')
    }
    
    // Add database column mapping for snake_case
    if (fieldName.includes('_')) {
      attributes.push(`@map("${fieldName}")`)
    }
    
    return attributes
  }
}