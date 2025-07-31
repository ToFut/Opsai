import { YAMLSchema, validateYAML, validateYAMLWithErrors, YAMLConfig } from './schema'
import { parse } from 'yaml'

export interface ValidationError {
  path: string[]
  message: string
  code: string
}

export interface ValidationResult {
  valid: boolean
  data?: YAMLConfig
  errors: ValidationError[]
  warnings: string[]
}

export class YAMLValidator {
  private static instance: YAMLValidator

  static getInstance(): YAMLValidator {
    if (!YAMLValidator.instance) {
      YAMLValidator.instance = new YAMLValidator()
    }
    return YAMLValidator.instance
  }

  validateYAMLString(yamlString: string): ValidationResult {
    try {
      const parsed = parse(yamlString)
      return this.validateYAMLObject(parsed)
    } catch (error) {
      return {
        valid: false,
        errors: [{
          path: [],
          message: `Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'PARSE_ERROR'
        }],
        warnings: []
      }
    }
  }

  validateYAMLObject(data: any): ValidationResult {
    const result = validateYAMLWithErrors(data)
    
    if (result.success) {
      const warnings = this.generateWarnings(result.data)
      return {
        valid: true,
        data: result.data,
        errors: [],
        warnings
      }
    } else {
      const errors = this.formatZodErrors(result.error)
      return {
        valid: false,
        errors,
        warnings: []
      }
    }
  }

  private formatZodErrors(error: any): ValidationError[] {
    const errors: ValidationError[] = []
    
    if (error.issues) {
      error.issues.forEach((issue: any) => {
        errors.push({
          path: issue.path,
          message: issue.message,
          code: issue.code
        })
      })
    }
    
    return errors
  }

  private generateWarnings(data: YAMLConfig): string[] {
    const warnings: string[] = []
    
    // Check for missing auth configuration
    if (!data.auth) {
      warnings.push('No authentication configuration found. Consider adding auth providers.')
    }
    
    // Check for missing integrations
    if (!data.integrations || data.integrations.length === 0) {
      warnings.push('No integrations configured. Consider adding external service connections.')
    }
    
    // Check for missing billing
    if (!data.billing) {
      warnings.push('No billing configuration found. Consider adding pricing plans.')
    }
    
    // Check for missing deployment
    if (!data.deployment) {
      warnings.push('No deployment configuration found. Consider adding deployment settings.')
    }
    
    // Check for models without permissions
    data.database.models.forEach(model => {
      if (!model.permissions) {
        warnings.push(`Model '${model.name}' has no permissions defined.`)
      }
    })
    
    return warnings
  }

  // Business logic validation
  validateBusinessLogic(data: YAMLConfig): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []
    
    // Check for circular relationships
    const circularRefs = this.findCircularReferences(data.database.models)
    if (circularRefs.length > 0) {
      errors.push({
        path: ['database', 'models'],
        message: `Circular references detected: ${circularRefs.join(', ')}`,
        code: 'CIRCULAR_REFERENCE'
      })
    }
    
    // Check for orphaned models
    const orphanedModels = this.findOrphanedModels(data.database.models)
    if (orphanedModels.length > 0) {
      warnings.push(`Orphaned models found: ${orphanedModels.join(', ')}`)
    }
    
    // Check for missing required fields in relationships
    data.database.models.forEach(model => {
      model.relationships?.forEach(rel => {
        const targetModel = data.database.models.find(m => m.name === (typeof rel === 'string' ? rel : rel.model))
        if (!targetModel) {
          errors.push({
            path: ['database', 'models', model.name, 'relationships'],
            message: `Relationship target model '${typeof rel === 'string' ? rel : rel.model}' not found`,
            code: 'MISSING_MODEL'
          })
        }
      })
    })
    
    return {
      valid: errors.length === 0,
      data,
      errors,
      warnings
    }
  }

  private findCircularReferences(models: any[]): string[] {
    // Implementation for detecting circular references
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const circularRefs: string[] = []
    
    const dfs = (modelName: string, path: string[] = []) => {
      if (recursionStack.has(modelName)) {
        circularRefs.push([...path, modelName].join(' -> '))
        return
      }
      
      if (visited.has(modelName)) return
      
      visited.add(modelName)
      recursionStack.add(modelName)
      
      const model = models.find(m => m.name === modelName)
      if (model?.relationships) {
        model.relationships.forEach((rel: any) => {
          const targetModel = typeof rel === 'string' ? rel : rel.model
          dfs(targetModel, [...path, modelName])
        })
      }
      
      recursionStack.delete(modelName)
    }
    
    models.forEach(model => {
      if (!visited.has(model.name)) {
        dfs(model.name)
      }
    })
    
    return circularRefs
  }

  private findOrphanedModels(models: any[]): string[] {
    const referencedModels = new Set<string>()
    
    models.forEach(model => {
      model.relationships?.forEach((rel: any) => {
        const targetModel = typeof rel === 'string' ? rel : rel.model
        referencedModels.add(targetModel)
      })
    })
    
    return models
      .filter(model => !referencedModels.has(model.name))
      .map(model => model.name)
  }
} 