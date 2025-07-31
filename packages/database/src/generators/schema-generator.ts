import { DatabaseModel as Model, DatabaseField as Field, Relation } from '@opsai/shared'

export interface PrismaSchema {
  models: Model[]
  enums: any[]
  datasources: any[]
  generators: any[]
}

export class SchemaGenerator {
  private models: Model[] = []
  private enums: any[] = []
  private datasources: any[] = []
  private generators: any[] = []

  addModel(model: Model): void {
    this.models.push(model)
  }

  addEnum(enumDef: any): void {
    this.enums.push(enumDef)
  }

  addDatasource(datasource: any): void {
    this.datasources.push(datasource)
  }

  addGenerator(generator: any): void {
    this.generators.push(generator)
  }

  generateSchema(): PrismaSchema {
    return {
      models: this.models,
      enums: this.enums,
      datasources: this.datasources,
      generators: this.generators
    }
  }

  generatePrismaSchema(): string {
    let schema = ''

    // Add datasources
    for (const datasource of this.datasources) {
      schema += `datasource ${datasource.name} {\n`
      schema += `  provider = "${datasource.provider}"\n`
      schema += `  url      = env("${datasource.url}")\n`
      schema += '}\n\n'
    }

    // Add generators
    for (const generator of this.generators) {
      schema += `generator ${generator.name} {\n`
      schema += `  provider = "${generator.provider}"\n`
      if (generator.output) {
        schema += `  output   = "${generator.output}"\n`
      }
      schema += '}\n\n'
    }

    // Add enums
    for (const enumDef of this.enums) {
      schema += `enum ${enumDef.name} {\n`
      for (const value of enumDef.values) {
        schema += `  ${value}\n`
      }
      schema += '}\n\n'
    }

    // Add models
    for (const model of this.models) {
      schema += `model ${model.name} {\n`
      
      for (const field of model.fields) {
        let fieldDef = `  ${field.name}  ${this.mapFieldType(field.type)}`
        
        if (field.isRequired || field.required) {
          fieldDef += ' @required'
        }
        
        if (field.isUnique || field.unique) {
          fieldDef += ' @unique'
        }
        
        if (field.isPrimary) {
          fieldDef += ' @id'
        }
        
        if (field.defaultValue !== undefined) {
          fieldDef += ` @default(${field.defaultValue})`
        }
        
        if (field.relationName) {
          fieldDef += ` @relation(name: "${field.relationName}")`
        }
        
        schema += fieldDef + '\n'
      }
      
      schema += '}\n\n'
    }

    return schema
  }

  private mapFieldType(yamlType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'String',
      'number': 'Float',
      'integer': 'Int',
      'boolean': 'Boolean',
      'date': 'DateTime',
      'datetime': 'DateTime',
      'json': 'Json',
      'enum': 'String'
    }
    return typeMap[yamlType] || 'String'
  }

  clear(): void {
    this.models = []
    this.enums = []
    this.datasources = []
    this.generators = []
  }
} 