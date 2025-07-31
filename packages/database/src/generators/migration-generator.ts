import { MigrationStep } from '@opsai/shared'
import { DatabaseModel as Model, DatabaseField as Field, Relation } from '@opsai/shared'

export class MigrationGenerator {
  private steps: MigrationStep[] = []

  addCreateTable(model: Model): void {
    this.steps.push({
      type: 'create_table',
      table: model.name,
      columns: model.fields.map(field => ({
        name: field.name,
        type: this.mapFieldType(field.type),
        nullable: !field.isRequired,
        unique: field.isUnique,
        primary: field.isPrimary,
        default: field.defaultValue
      }))
    })
  }

  addDropTable(modelName: string): void {
    this.steps.push({
      type: 'drop_table',
      table: modelName
    })
  }

  addCreateIndex(table: string, index: { name: string; fields: string[]; unique?: boolean }): void {
    this.steps.push({
      type: 'create_index',
      table: table,
      index: {
        name: index.name,
        columns: index.fields,
        unique: index.unique || false
      }
    })
  }

  addDropIndex(table: string, indexName: string): void {
    this.steps.push({
      type: 'drop_index',
      table: table,
      constraint: indexName
    })
  }

  addForeignKey(table: string, column: string, references: { table: string; column: string }): void {
    this.steps.push({
      type: 'add_foreign_key',
      table: table,
      column: column,
      references: references
    })
  }

  addDropForeignKey(table: string, constraintName: string): void {
    this.steps.push({
      type: 'drop_foreign_key',
      table: table,
      constraint: constraintName
    })
  }

  private mapFieldType(yamlType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'VARCHAR(255)',
      'number': 'DECIMAL(10,2)',
      'integer': 'INTEGER',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'TIMESTAMP',
      'json': 'JSONB',
      'enum': 'VARCHAR(50)'
    }
    return typeMap[yamlType] || 'VARCHAR(255)'
  }

  generateSQL(): string {
    return this.steps.map(step => this.stepToSQL(step)).join('\n')
  }

  private stepToSQL(step: MigrationStep): string {
    switch (step.type) {
      case 'create_table':
        const tableColumns = step.columns?.map(col => {
          let sql = `${col.name} ${col.type}`
          if (!col.nullable) sql += ' NOT NULL'
          if (col.unique) sql += ' UNIQUE'
          if (col.primary) sql += ' PRIMARY KEY'
          if (col.default !== undefined) sql += ` DEFAULT ${col.default}`
          return sql
        }).join(', ')
        return `CREATE TABLE ${step.table} (${tableColumns});`

      case 'drop_table':
        return `DROP TABLE IF EXISTS ${step.table};`

      case 'create_index':
        const unique = step.index?.unique ? 'UNIQUE ' : ''
        const indexColumns = step.index?.columns.join(', ')
        return `CREATE ${unique}INDEX ${step.index?.name} ON ${step.table} (${indexColumns});`

      case 'drop_index':
        return `DROP INDEX IF EXISTS ${step.index};`

      case 'add_foreign_key':
        return `ALTER TABLE ${step.table} ADD CONSTRAINT fk_${step.table}_${step.column} FOREIGN KEY (${step.column}) REFERENCES ${step.references?.table}(${step.references?.column});`

      case 'drop_foreign_key':
        return `ALTER TABLE ${step.table} DROP CONSTRAINT ${step.constraint};`

      default:
        return ''
    }
  }

  getSteps(): MigrationStep[] {
    return this.steps
  }

  clear(): void {
    this.steps = []
  }
} 