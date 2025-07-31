import * as yaml from 'js-yaml'
import { YamlConfig, ValidationResult } from '../types'
import { ConfigValidator } from '../validators/config-validator'
import { Logger } from '../utils/logger'

export class YamlProcessor {
  private validator: ConfigValidator
  private logger: Logger

  constructor() {
    this.validator = new ConfigValidator()
    this.logger = new Logger('YamlProcessor')
  }

  /**
   * Parse YAML string into configuration object
   */
  parse(yamlString: string): YamlConfig {
    try {
      this.logger.info('Parsing YAML configuration...')
      
      // Try YAML parsing first
      let config: any
      try {
        config = yaml.load(yamlString)
        this.logger.info('Successfully parsed YAML')
      } catch (yamlError) {
        this.logger.warn('YAML parsing failed, trying JSON fallback')
        // Fallback to JSON if YAML fails
        config = JSON.parse(yamlString)
        this.logger.info('Successfully parsed JSON')
      }

      // Validate the parsed configuration
      const validation = this.validator.validate(config)
      if (!validation.success) {
        throw new Error(`Configuration validation failed: ${validation.errors?.join(', ')}`)
      }

      return validation.data as YamlConfig
    } catch (error) {
      this.logger.error('Failed to parse configuration', error)
      throw new Error(`Configuration parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Convert configuration object back to YAML string
   */
  stringify(config: YamlConfig): string {
    try {
      this.logger.info('Converting configuration to YAML...')
      return yaml.dump(config, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
      })
    } catch (error) {
      this.logger.error('Failed to stringify configuration', error)
      throw new Error(`Configuration stringification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate YAML configuration
   */
  validate(config: any): ValidationResult {
    return this.validator.validate(config)
  }

  /**
   * Merge multiple YAML configurations
   */
  merge(configs: YamlConfig[]): YamlConfig {
    if (configs.length === 0) {
      throw new Error('No configurations provided for merging')
    }

    if (configs.length === 1) {
      return configs[0]
    }

    this.logger.info(`Merging ${configs.length} configurations...`)

    const merged: YamlConfig = {
      vertical: { ...configs[0].vertical },
      business: { ...configs[0].business },
      database: { models: [] },
      apis: { integrations: [] },
      workflows: [],
      ui: { pages: [] }
    }

    // Merge database models
    const modelMap = new Map<string, any>()
    configs.forEach(config => {
      config.database.models.forEach(model => {
        if (!modelMap.has(model.name)) {
          modelMap.set(model.name, { ...model, fields: [] })
        }
        const existingModel = modelMap.get(model.name)
        model.fields.forEach(field => {
          const existingField = existingModel.fields.find((f: any) => f.name === field.name)
          if (!existingField) {
            existingModel.fields.push(field)
          }
        })
      })
    })
    merged.database.models = Array.from(modelMap.values())

    // Merge integrations
    const integrationMap = new Map<string, any>()
    configs.forEach(config => {
      config.apis.integrations.forEach(integration => {
        if (!integrationMap.has(integration.name)) {
          integrationMap.set(integration.name, integration)
        }
      })
    })
    merged.apis.integrations = Array.from(integrationMap.values())

    // Merge workflows
    const workflowMap = new Map<string, any>()
    configs.forEach(config => {
      config.workflows.forEach(workflow => {
        if (!workflowMap.has(workflow.name)) {
          workflowMap.set(workflow.name, workflow)
        }
      })
    })
    merged.workflows = Array.from(workflowMap.values())

    // Merge UI pages
    const pageMap = new Map<string, any>()
    configs.forEach(config => {
      config.ui.pages.forEach(page => {
        if (!pageMap.has(page.path)) {
          pageMap.set(page.path, page)
        }
      })
    })
    merged.ui.pages = Array.from(pageMap.values())

    this.logger.info('Configuration merge completed')
    return merged
  }

  /**
   * Extract specific sections from YAML configuration
   */
  extract(config: YamlConfig, sections: string[]): Partial<YamlConfig> {
    const extracted: Partial<YamlConfig> = {}
    
    sections.forEach(section => {
      if (section in config) {
        (extracted as any)[section] = (config as any)[section]
      }
    })

    return extracted
  }
} 