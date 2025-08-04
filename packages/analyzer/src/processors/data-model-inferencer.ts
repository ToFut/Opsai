import * as cheerio from 'cheerio'
import { OpenAI } from 'openai'
import { InferredDataModel, InferredField, InferredRelationship } from '@opsai/shared'

export class DataModelInferencer {
  private openai: OpenAI
  
  constructor(openai: OpenAI) {
    this.openai = openai
  }
  
  /**
   * Infer data models from website content
   */
  async inferDataModels(
    url: string,
    html: string,
    $: cheerio.CheerioAPI
  ): Promise<InferredDataModel[]> {
    const models: InferredDataModel[] = []
    
    // Extract different types of data
    const [
      formModels,
      tableModels,
      apiModels,
      contentModels
    ] = await Promise.all([
      this.inferFromForms($),
      this.inferFromTables($),
      this.inferFromAPIPatterns(html),
      this.inferFromContent($, url)
    ])
    
    // Merge all models
    models.push(...formModels, ...tableModels, ...apiModels, ...contentModels)
    
    // Deduplicate and enhance with AI
    const uniqueModels = this.deduplicateModels(models)
    const enhancedModels = await this.enhanceModelsWithAI(uniqueModels, url)
    
    // Infer relationships
    const modelsWithRelationships = this.inferRelationships(enhancedModels)
    
    return modelsWithRelationships
  }
  
  /**
   * Quick model inference for additional pages
   */
  async inferDataModelsQuick(
    url: string,
    html: string,
    $: cheerio.CheerioAPI
  ): Promise<InferredDataModel[]> {
    const models: InferredDataModel[] = []
    
    // Quick form analysis only
    const formModels = await this.inferFromForms($)
    models.push(...formModels)
    
    return models
  }
  
  /**
   * Infer models from forms
   */
  private async inferFromForms($: cheerio.CheerioAPI): Promise<InferredDataModel[]> {
    const models: InferredDataModel[] = []
    
    $('form').each((_, form) => {
      const $form = $(form)
      const formId = $form.attr('id') || $form.attr('name') || 'form'
      const modelName = this.inferModelNameFromForm(formId, $form)
      
      const fields: InferredField[] = []
      
      // Extract fields from inputs
      $form.find('input, select, textarea').each((_, element) => {
        const $el = $(element)
        const name = $el.attr('name')
        const type = $el.attr('type') || 'text'
        const id = $el.attr('id')
        
        if (name && !name.includes('[') && !name.includes('csrf')) {
          const field = this.createFieldFromInput(name, type, $el)
          if (field) {
            fields.push(field)
          }
        }
      })
      
      if (fields.length > 0) {
        models.push({
          name: modelName,
          source: 'ui',
          fields,
          relationships: [],
          businessPurpose: this.inferBusinessPurpose(modelName, fields),
          estimatedRecords: 1000, // Default estimate
          confidence: 0.8
        })
      }
    })
    
    return models
  }
  
  /**
   * Infer models from tables
   */
  private async inferFromTables($: cheerio.CheerioAPI): Promise<InferredDataModel[]> {
    const models: InferredDataModel[] = []
    
    $('table').each((_, table) => {
      const $table = $(table)
      const headers = $table.find('th').map((_, th) => $(th).text().trim()).get()
      
      if (headers.length > 0) {
        const modelName = this.inferModelNameFromTable($table)
        const fields = headers
          .filter(h => h && !h.includes('Action'))
          .map(header => this.createFieldFromTableHeader(header))
        
        if (fields.length > 0) {
          models.push({
            name: modelName,
            source: 'ui',
            fields,
            relationships: [],
            businessPurpose: this.inferBusinessPurpose(modelName, fields),
            estimatedRecords: $table.find('tbody tr').length * 100,
            confidence: 0.7
          })
        }
      }
    })
    
    return models
  }
  
  /**
   * Infer models from API patterns in JavaScript
   */
  private async inferFromAPIPatterns(html: string): Promise<InferredDataModel[]> {
    const models: InferredDataModel[] = []
    
    // Common API patterns
    const apiPatterns = [
      /fetch\(['"`]\/api\/(\w+)/g,
      /axios\.\w+\(['"`]\/api\/(\w+)/g,
      /\$\.ajax\(\{[^}]*url:\s*['"`]\/api\/(\w+)/g,
      /api\/v\d+\/(\w+)/g
    ]
    
    const foundEndpoints = new Set<string>()
    
    for (const pattern of apiPatterns) {
      let match
      while ((match = pattern.exec(html)) !== null) {
        foundEndpoints.add(match[1])
      }
    }
    
    // Create models from endpoints
    for (const endpoint of foundEndpoints) {
      const modelName = this.singularize(this.capitalize(endpoint))
      
      models.push({
        name: modelName,
        source: 'api',
        fields: this.inferFieldsFromEndpoint(endpoint),
        relationships: [],
        businessPurpose: `Manage ${endpoint}`,
        estimatedRecords: 1000,
        confidence: 0.6
      })
    }
    
    return models
  }
  
  /**
   * Infer models from content analysis
   */
  private async inferFromContent(
    $: cheerio.CheerioAPI,
    url: string
  ): Promise<InferredDataModel[]> {
    const models: InferredDataModel[] = []
    
    // Look for structured data
    const jsonLd = $('script[type="application/ld+json"]').map((_, el) => $(el).html()).get()
    
    for (const json of jsonLd) {
      try {
        const data = JSON.parse(json)
        const model = this.extractModelFromStructuredData(data)
        if (model) {
          models.push(model)
        }
      } catch {}
    }
    
    // Look for product patterns
    if (this.hasEcommercePatterns($)) {
      models.push(this.createEcommerceModels())
    }
    
    // Look for blog/content patterns
    if (this.hasContentPatterns($)) {
      models.push(this.createContentModels())
    }
    
    return models.flat()
  }
  
  /**
   * Enhance models with AI analysis
   */
  private async enhanceModelsWithAI(
    models: InferredDataModel[],
    url: string
  ): Promise<InferredDataModel[]> {
    if (models.length === 0) return models
    
    const prompt = `
Analyze these data models inferred from ${url} and enhance them:

${JSON.stringify(models, null, 2)}

For each model, provide:
1. Better field types (string, number, boolean, date, email, url, etc.)
2. Which fields should be required
3. Which fields should be unique
4. Validation rules
5. Missing fields that are commonly needed
6. Relationships between models

Respond in JSON format matching the input structure.
`
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
  
        temperature: 0.3
      })
      
      const enhanced = JSON.parse(response.choices[0].message.content || '[]')
      return enhanced
    } catch (error) {
      console.error('Failed to enhance models with AI:', error)
      return models
    }
  }
  
  /**
   * Infer relationships between models
   */
  private inferRelationships(models: InferredDataModel[]): InferredDataModel[] {
    const modelMap = new Map(models.map(m => [m.name.toLowerCase(), m]))
    
    for (const model of models) {
      for (const field of model.fields) {
        // Check for foreign key patterns
        if (field.name.endsWith('Id') || field.name.endsWith('_id')) {
          const relatedModelName = field.name.replace(/[_]?[iI]d$/, '')
          const relatedModel = modelMap.get(relatedModelName.toLowerCase())
          
          if (relatedModel) {
            model.relationships.push({
              from: model.name,
              to: relatedModel.name,
              type: 'many-to-one',
              foreignKey: field.name,
              confidence: 0.8
            })
          }
        }
        
        // Check for array/collection patterns
        if (field.type === 'array' && field.name.endsWith('s')) {
          const singularName = this.singularize(field.name)
          const relatedModel = modelMap.get(singularName.toLowerCase())
          
          if (relatedModel) {
            model.relationships.push({
              from: model.name,
              to: relatedModel.name,
              type: 'one-to-many',
              confidence: 0.7
            })
          }
        }
      }
    }
    
    return models
  }
  
  /**
   * Helper methods
   */
  
  private inferModelNameFromForm(formId: string, $form: cheerio.Cheerio): string {
    // Check for data attributes
    const dataModel = $form.attr('data-model') || $form.attr('data-entity')
    if (dataModel) return this.capitalize(dataModel)
    
    // Check form action
    const action = $form.attr('action')
    if (action) {
      const match = action.match(/\/(api\/)?([\w-]+)/i)
      if (match) return this.singularize(this.capitalize(match[2]))
    }
    
    // Check form class
    const classes = $form.attr('class') || ''
    const modelClass = classes.split(' ').find(c => 
      c.includes('form') || c.includes('modal') || c.includes('create') || c.includes('edit')
    )
    
    if (modelClass) {
      const name = modelClass.replace(/(form|modal|create|edit|-|_)/gi, '')
      if (name) return this.capitalize(name)
    }
    
    // Use form ID
    const cleanId = formId.replace(/(form|modal|create|edit|-|_)/gi, '')
    return this.capitalize(cleanId) || 'Model'
  }
  
  private inferModelNameFromTable($table: cheerio.Cheerio): string {
    // Check data attributes
    const dataModel = $table.attr('data-model') || $table.attr('data-entity')
    if (dataModel) return this.capitalize(dataModel)
    
    // Check table class/id
    const id = $table.attr('id') || ''
    const classes = $table.attr('class') || ''
    
    const identifier = (id + ' ' + classes).toLowerCase()
    
    // Common patterns
    const patterns = [
      'product', 'order', 'customer', 'user', 'invoice',
      'payment', 'subscription', 'item', 'category', 'post'
    ]
    
    for (const pattern of patterns) {
      if (identifier.includes(pattern)) {
        return this.capitalize(pattern)
      }
    }
    
    return 'Item'
  }
  
  private createFieldFromInput(
    name: string,
    type: string,
    $el: cheerio.Cheerio
  ): InferredField | null {
    const fieldName = this.normalizeFieldName(name)
    const fieldType = this.inferFieldType(name, type, $el)
    
    return {
      name: fieldName,
      type: fieldType,
      required: $el.attr('required') !== undefined,
      unique: name.includes('email') || name.includes('username'),
      validation: this.inferValidation(name, type, $el)
    }
  }
  
  private createFieldFromTableHeader(header: string): InferredField {
    const fieldName = this.normalizeFieldName(header)
    const fieldType = this.inferFieldTypeFromName(fieldName)
    
    return {
      name: fieldName,
      type: fieldType,
      required: ['id', 'name', 'title'].includes(fieldName.toLowerCase()),
      unique: fieldName === 'id' || fieldName === 'email'
    }
  }
  
  private inferFieldType(name: string, htmlType: string, $el: cheerio.Cheerio): string {
    const lowerName = name.toLowerCase()
    
    // Check HTML type
    if (htmlType === 'email') return 'email'
    if (htmlType === 'tel') return 'phone'
    if (htmlType === 'url') return 'url'
    if (htmlType === 'number') return 'number'
    if (htmlType === 'date') return 'date'
    if (htmlType === 'datetime-local') return 'datetime'
    if (htmlType === 'checkbox') return 'boolean'
    
    // Check select options
    if ($el.is('select')) {
      const options = $el.find('option').length
      if (options > 0 && options < 10) return 'enum'
      return 'string'
    }
    
    // Check textarea
    if ($el.is('textarea')) return 'text'
    
    // Infer from name
    return this.inferFieldTypeFromName(lowerName)
  }
  
  private inferFieldTypeFromName(name: string): string {
    const lowerName = name.toLowerCase()
    
    if (lowerName.includes('email')) return 'email'
    if (lowerName.includes('phone') || lowerName.includes('tel')) return 'phone'
    if (lowerName.includes('url') || lowerName.includes('website')) return 'url'
    if (lowerName.includes('price') || lowerName.includes('amount') || lowerName.includes('cost')) return 'decimal'
    if (lowerName.includes('quantity') || lowerName.includes('count')) return 'integer'
    if (lowerName.includes('date') || lowerName.includes('_at')) return 'datetime'
    if (lowerName.includes('description') || lowerName.includes('content') || lowerName.includes('body')) return 'text'
    if (lowerName.includes('status') || lowerName.includes('type')) return 'enum'
    if (lowerName.includes('is_') || lowerName.includes('has_')) return 'boolean'
    if (lowerName === 'id' || lowerName.includes('_id')) return 'id'
    
    return 'string'
  }
  
  private inferValidation(name: string, type: string, $el: cheerio.Cheerio): any {
    const validation: any = {}
    
    // HTML5 validation attributes
    const minLength = $el.attr('minlength')
    const maxLength = $el.attr('maxlength')
    const min = $el.attr('min')
    const max = $el.attr('max')
    const pattern = $el.attr('pattern')
    
    if (minLength) validation.minLength = parseInt(minLength)
    if (maxLength) validation.maxLength = parseInt(maxLength)
    if (min) validation.min = parseFloat(min)
    if (max) validation.max = parseFloat(max)
    if (pattern) validation.pattern = pattern
    
    // Common patterns
    const lowerName = name.toLowerCase()
    if (lowerName.includes('email')) {
      validation.pattern = '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
    } else if (lowerName.includes('phone')) {
      validation.pattern = '^\\+?[1-9]\\d{1,14}$'
    } else if (lowerName.includes('zip') || lowerName.includes('postal')) {
      validation.pattern = '^\\d{5}(-\\d{4})?$'
    }
    
    return Object.keys(validation).length > 0 ? validation : undefined
  }
  
  private inferBusinessPurpose(modelName: string, fields: InferredField[]): string {
    const fieldNames = fields.map(f => f.name.toLowerCase())
    
    // E-commerce patterns
    if (modelName.toLowerCase().includes('product') || fieldNames.includes('price')) {
      return 'Product catalog and inventory management'
    }
    if (modelName.toLowerCase().includes('order') || fieldNames.includes('total')) {
      return 'Order processing and fulfillment'
    }
    if (modelName.toLowerCase().includes('customer') || modelName.toLowerCase().includes('user')) {
      return 'Customer information and account management'
    }
    
    // Content patterns
    if (fieldNames.includes('title') && fieldNames.includes('content')) {
      return 'Content management and publishing'
    }
    
    // Default
    return `Manage ${modelName.toLowerCase()} data`
  }
  
  private inferFieldsFromEndpoint(endpoint: string): InferredField[] {
    // Common fields based on endpoint name
    const commonFields: InferredField[] = [
      { name: 'id', type: 'id', required: true, unique: true }
    ]
    
    const lowerEndpoint = endpoint.toLowerCase()
    
    if (lowerEndpoint.includes('user') || lowerEndpoint.includes('customer')) {
      commonFields.push(
        { name: 'email', type: 'email', required: true, unique: true },
        { name: 'name', type: 'string', required: true, unique: false },
        { name: 'createdAt', type: 'datetime', required: true, unique: false }
      )
    } else if (lowerEndpoint.includes('product')) {
      commonFields.push(
        { name: 'name', type: 'string', required: true, unique: false },
        { name: 'price', type: 'decimal', required: true, unique: false },
        { name: 'description', type: 'text', required: false, unique: false }
      )
    } else if (lowerEndpoint.includes('order')) {
      commonFields.push(
        { name: 'customerId', type: 'id', required: true, unique: false },
        { name: 'total', type: 'decimal', required: true, unique: false },
        { name: 'status', type: 'enum', required: true, unique: false }
      )
    } else {
      commonFields.push(
        { name: 'name', type: 'string', required: true, unique: false },
        { name: 'createdAt', type: 'datetime', required: true, unique: false }
      )
    }
    
    return commonFields
  }
  
  private extractModelFromStructuredData(data: any): InferredDataModel | null {
    if (!data['@type']) return null
    
    const type = data['@type']
    const fields: InferredField[] = []
    
    // Map schema.org types to models
    const typeMapping: Record<string, string> = {
      'Product': 'Product',
      'Person': 'User',
      'Organization': 'Company',
      'Article': 'Article',
      'Event': 'Event'
    }
    
    const modelName = typeMapping[type] || type
    
    // Extract fields from properties
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('@')) continue
      
      fields.push({
        name: key,
        type: this.inferFieldTypeFromValue(value),
        required: true,
        unique: false
      })
    }
    
    if (fields.length === 0) return null
    
    return {
      name: modelName,
      source: 'pattern',
      fields,
      relationships: [],
      businessPurpose: `${type} data from structured markup`,
      estimatedRecords: 100,
      confidence: 0.9
    }
  }
  
  private inferFieldTypeFromValue(value: any): string {
    if (typeof value === 'string') {
      if (value.includes('@')) return 'email'
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'date'
      if (value.match(/^https?:\/\//)) return 'url'
      return 'string'
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'decimal'
    }
    if (typeof value === 'boolean') return 'boolean'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object') return 'json'
    
    return 'string'
  }
  
  private hasEcommercePatterns($: cheerio.CheerioAPI): boolean {
    const patterns = [
      '.product', '.price', '.add-to-cart', '.shopping-cart',
      '[data-product]', '[data-price]', '.checkout'
    ]
    
    return patterns.some(pattern => $(pattern).length > 0)
  }
  
  private hasContentPatterns($: cheerio.CheerioAPI): boolean {
    const patterns = [
      'article', '.post', '.blog', '.content',
      '[itemtype*="Article"]', '.author', '.publish-date'
    ]
    
    return patterns.some(pattern => $(pattern).length > 0)
  }
  
  private createEcommerceModels(): InferredDataModel[] {
    return [
      {
        name: 'Product',
        source: 'pattern',
        fields: [
          { name: 'id', type: 'id', required: true, unique: true },
          { name: 'name', type: 'string', required: true, unique: false },
          { name: 'description', type: 'text', required: false, unique: false },
          { name: 'price', type: 'decimal', required: true, unique: false },
          { name: 'sku', type: 'string', required: true, unique: true },
          { name: 'stock', type: 'integer', required: true, unique: false },
          { name: 'categoryId', type: 'id', required: false, unique: false }
        ],
        relationships: [],
        businessPurpose: 'Product catalog management',
        estimatedRecords: 1000,
        confidence: 0.8
      },
      {
        name: 'Category',
        source: 'pattern',
        fields: [
          { name: 'id', type: 'id', required: true, unique: true },
          { name: 'name', type: 'string', required: true, unique: true },
          { name: 'slug', type: 'string', required: true, unique: true },
          { name: 'parentId', type: 'id', required: false, unique: false }
        ],
        relationships: [],
        businessPurpose: 'Product categorization',
        estimatedRecords: 50,
        confidence: 0.7
      }
    ]
  }
  
  private createContentModels(): InferredDataModel[] {
    return [
      {
        name: 'Article',
        source: 'pattern',
        fields: [
          { name: 'id', type: 'id', required: true, unique: true },
          { name: 'title', type: 'string', required: true, unique: false },
          { name: 'slug', type: 'string', required: true, unique: true },
          { name: 'content', type: 'text', required: true, unique: false },
          { name: 'authorId', type: 'id', required: true, unique: false },
          { name: 'publishedAt', type: 'datetime', required: false, unique: false },
          { name: 'tags', type: 'array', required: false, unique: false }
        ],
        relationships: [],
        businessPurpose: 'Content management and publishing',
        estimatedRecords: 500,
        confidence: 0.8
      }
    ]
  }
  
  private deduplicateModels(models: InferredDataModel[]): InferredDataModel[] {
    const modelMap = new Map<string, InferredDataModel>()
    
    for (const model of models) {
      const key = model.name.toLowerCase()
      const existing = modelMap.get(key)
      
      if (!existing || model.confidence > existing.confidence) {
        modelMap.set(key, model)
      } else if (existing) {
        // Merge fields
        const fieldMap = new Map(existing.fields.map(f => [f.name, f]))
        for (const field of model.fields) {
          if (!fieldMap.has(field.name)) {
            existing.fields.push(field)
          }
        }
      }
    }
    
    return Array.from(modelMap.values())
  }
  
  private normalizeFieldName(name: string): string {
    return name
      .replace(/[\[\]]/g, '')
      .replace(/[-\s]/g, '_')
      .replace(/[^\w]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase()
  }
  
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }
  
  private singularize(str: string): string {
    // Simple singularization
    if (str.endsWith('ies')) return str.slice(0, -3) + 'y'
    if (str.endsWith('es')) return str.slice(0, -2)
    if (str.endsWith('s')) return str.slice(0, -1)
    return str
  }
}