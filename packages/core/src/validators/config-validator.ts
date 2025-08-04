import { z } from 'zod'
import { YamlConfig, ValidationResult } from '../types'
import { Logger } from '../utils/logger'

// Zod schemas for validation
const FieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
  unique: z.boolean().optional()
})

const ModelSchema = z.object({
  name: z.string().min(1),
  fields: z.array(FieldSchema).min(1)
})

const IntegrationSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean()
})

const WorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string()
})

const ComponentSchema = z.object({
  type: z.string().min(1),
  dataSource: z.string().min(1),
  actions: z.array(z.string()).optional(),
  mode: z.string().optional()
})

const PageSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  components: z.array(ComponentSchema)
})

const YamlConfigSchema = z.object({
  vertical: z.object({
    name: z.string().min(1),
    description: z.string(),
    industry: z.string().min(1)
  }),
  business: z.object({
    name: z.string().min(1),
    type: z.string().min(1)
  }),
  database: z.object({
    models: z.array(ModelSchema).min(1)
  }),
  apis: z.object({
    integrations: z.array(IntegrationSchema)
  }),
  workflows: z.array(WorkflowSchema),
  ui: z.object({
    pages: z.array(PageSchema)
  })
})

export class ConfigValidator {
  private logger: Logger

  constructor() {
    this.logger = new Logger('ConfigValidator')
  }

  /**
   * Validate YAML configuration
   */
  validate(config: any): ValidationResult {
    try {
      this.logger.info('Validating configuration...')
      
      const result = YamlConfigSchema.safeParse(config)
      
      if (result.success) {
        this.logger.info('Configuration validation successful')
        return {
          success: true,
          data: result.data as YamlConfig
        }
      } else {
        const errors = result.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        )
        
        this.logger.error('Configuration validation failed', { errors })
        return {
          success: false,
          errors
        }
      }
    } catch (error) {
      this.logger.error('Validation error', error)
      return {
        success: false,
        errors: ['Validation process failed']
      }
    }
  }

  /**
   * Validate specific section of configuration
   */
  validateSection(section: string, data: any): ValidationResult {
    try {
      this.logger.info(`Validating section: ${section}`)
      
      let schema: z.ZodSchema
      
      switch (section) {
        case 'vertical':
          schema = YamlConfigSchema.shape.vertical
          break
        case 'business':
          schema = YamlConfigSchema.shape.business
          break
        case 'database':
          schema = YamlConfigSchema.shape.database
          break
        case 'apis':
          schema = YamlConfigSchema.shape.apis
          break
        case 'workflows':
          schema = YamlConfigSchema.shape.workflows
          break
        case 'ui':
          schema = YamlConfigSchema.shape.ui
          break
        default:
          return {
            success: false,
            errors: [`Unknown section: ${section}`]
          }
      }
      
      const result = schema.safeParse(data)
      
      if (result.success) {
        this.logger.info(`Section ${section} validation successful`)
        return {
          success: true,
          data: result.data
        }
      } else {
        const errors = result.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        )
        
        this.logger.error(`Section ${section} validation failed`, { errors })
        return {
          success: false,
          errors
        }
      }
    } catch (error) {
      this.logger.error(`Section ${section} validation error`, error)
      return {
        success: false,
        errors: [`${section} validation process failed`]
      }
    }
  }

  /**
   * Validate business-specific rules
   */
  validateBusinessRules(config: YamlConfig): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for required models based on business type
    const businessType = config.business.type.toLowerCase()
    
    if (businessType === 'healthcare') {
      const hasPatientModel = config.database.models.some(model => 
        model.name.toLowerCase().includes('patient')
      )
      if (!hasPatientModel) {
        warnings.push('Healthcare business should include a Patient model')
      }
    }
    
    if (businessType === 'ecommerce') {
      const hasProductModel = config.database.models.some(model => 
        model.name.toLowerCase().includes('product')
      )
      if (!hasProductModel) {
        warnings.push('Ecommerce business should include a Product model')
      }
    }
    
    if (businessType === 'real_estate') {
      const hasPropertyModel = config.database.models.some(model => 
        model.name.toLowerCase().includes('property')
      )
      if (!hasPropertyModel) {
        warnings.push('Real estate business should include a Property model')
      }
    }

    // Check for unique constraints on important fields
    config.database.models.forEach(model => {
      const hasIdField = model.fields.some(field => 
        field.name.toLowerCase() === 'id' && field.unique
      )
      if (!hasIdField) {
        warnings.push(`Model ${model.name} should have a unique ID field`)
      }
    })

    const result: { success: boolean; errors?: string[]; warnings?: string[] } = {
      success: errors.length === 0
    };
    
    if (errors.length > 0) {
      result.errors = errors;
    }
    
    if (warnings.length > 0) {
      result.warnings = warnings;
    }
    
    return result;
  }

  /**
   * Get validation schema for a specific field type
   */
  getFieldTypeSchema(fieldType: string): z.ZodSchema {
    switch (fieldType.toLowerCase()) {
      case 'string':
        return z.string()
      case 'number':
      case 'integer':
        return z.number()
      case 'boolean':
        return z.boolean()
      case 'date':
      case 'datetime':
        return z.string().datetime()
      case 'email':
        return z.string().email()
      case 'url':
        return z.string().url()
      default:
        return z.string()
    }
  }
} 