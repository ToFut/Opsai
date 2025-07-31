import { YAMLConfig } from '@opsai/yaml-validator'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface DatabaseSchema {
  id: string
  tenantId: string
  name: string
  tables: DatabaseTable[]
  indexes: DatabaseIndex[]
  foreignKeys: DatabaseForeignKey[]
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseTable {
  name: string
  columns: DatabaseColumn[]
  primaryKey: string[]
  uniqueConstraints: string[][]
  checkConstraints: CheckConstraint[]
}

export interface DatabaseColumn {
  name: string
  type: string
  nullable: boolean
  defaultValue?: any
  isPrimaryKey: boolean
  isUnique: boolean
  isIndexed: boolean
  references?: {
    table: string
    column: string
  }
  check?: string
}

export interface DatabaseIndex {
  name: string
  table: string
  columns: string[]
  unique: boolean
  type: 'btree' | 'hash' | 'gin' | 'gist'
}

export interface DatabaseForeignKey {
  name: string
  table: string
  columns: string[]
  referencedTable: string
  referencedColumns: string[]
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
}

export interface CheckConstraint {
  name: string
  condition: string
}

export interface Migration {
  id: string
  tenantId: string
  version: string
  name: string
  sql: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: Date
  executedAt?: Date
  error?: string
}

export interface DatabaseConnection {
  id: string
  tenantId: string
  provider: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb'
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl: boolean
  poolSize: number
  createdAt: Date
  updatedAt: Date
}

export class DatabaseManager {
  private supabase: SupabaseClient
  private schemas: Map<string, DatabaseSchema[]> = new Map()
  private migrations: Map<string, Migration[]> = new Map()
  private connections: Map<string, DatabaseConnection[]> = new Map()

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    )
  }

  // Schema Management
  async createSchema(schemaData: Omit<DatabaseSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseSchema> {
    const schema: DatabaseSchema = {
      id: this.generateId(),
      ...schemaData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.schemas.has(schema.tenantId)) {
      this.schemas.set(schema.tenantId, [])
    }

    this.schemas.get(schema.tenantId)!.push(schema)
    return schema
  }

  async getSchema(schemaId: string): Promise<DatabaseSchema | null> {
    for (const [tenantId, schemas] of this.schemas.entries()) {
      const schema = schemas.find(s => s.id === schemaId)
      if (schema) return schema
    }
    return null
  }

  async getSchemasByTenant(tenantId: string): Promise<DatabaseSchema[]> {
    return this.schemas.get(tenantId) || []
  }

  // Setup Tenant Database
  async setupTenantDatabase(tenantId: string, config: YAMLConfig): Promise<void> {
    try {
      console.log(`Setting up database for tenant: ${tenantId}`)

      // Generate schema from YAML config
      const schema = await this.generateSchemaFromConfig(tenantId, config)

      // Create database schema
      await this.createDatabaseSchema(tenantId, schema)

      // Run migrations
      await this.runMigrations(tenantId)

      // Setup Row Level Security
      await this.setupRLS(tenantId, config)

      // Seed data if needed
      if (config.database.seed) {
        await this.seedDatabase(tenantId, config)
      }

      console.log(`✅ Database setup completed for tenant: ${tenantId}`)

    } catch (error) {
      console.error(`❌ Database setup failed: ${error}`)
      throw error
    }
  }

  private async generateSchemaFromConfig(tenantId: string, config: YAMLConfig): Promise<DatabaseSchema> {
    const tables: DatabaseTable[] = []

    // Generate tables from models
    for (const model of config.database.models) {
      const table = await this.generateTableFromModel(model)
      tables.push(table)
    }

    // Generate indexes and foreign keys
    const indexes = await this.generateIndexes(config.database.models)
    const foreignKeys = await this.generateForeignKeys(config.database.models)

    return {
      id: this.generateId(),
      tenantId,
      name: `tenant_${tenantId}_schema`,
      tables,
      indexes,
      foreignKeys,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private async generateTableFromModel(model: any): Promise<DatabaseTable> {
    const columns: DatabaseColumn[] = []
    const uniqueConstraints: string[][] = []
    const checkConstraints: CheckConstraint[] = []

    // Add standard columns
    columns.push({
      name: 'id',
      type: 'UUID',
      nullable: false,
      defaultValue: 'gen_random_uuid()',
      isPrimaryKey: true,
      isUnique: true,
      isIndexed: true
    })

    columns.push({
      name: 'tenant_id',
      type: 'UUID',
      nullable: false,
      isPrimaryKey: false,
      isUnique: false,
      isIndexed: true
    })

    columns.push({
      name: 'created_at',
      type: 'TIMESTAMP WITH TIME ZONE',
      nullable: false,
      defaultValue: 'NOW()',
      isPrimaryKey: false,
      isUnique: false,
      isIndexed: false
    })

    columns.push({
      name: 'updated_at',
      type: 'TIMESTAMP WITH TIME ZONE',
      nullable: false,
      defaultValue: 'NOW()',
      isPrimaryKey: false,
      isUnique: false,
      isIndexed: false
    })

    // Add model fields
    for (const field of model.fields) {
      const column = await this.generateColumnFromField(field)
      columns.push(column)

      // Add unique constraints
      if (field.unique) {
        uniqueConstraints.push([field.name])
      }
    }

    // Add soft delete if enabled
    if (model.softDelete) {
      columns.push({
        name: 'deleted_at',
        type: 'TIMESTAMP WITH TIME ZONE',
        nullable: true,
        isPrimaryKey: false,
        isUnique: false,
        isIndexed: true
      })
    }

    // Add audit fields if enabled
    if (model.audit) {
      columns.push({
        name: 'created_by',
        type: 'UUID',
        nullable: true,
        isPrimaryKey: false,
        isUnique: false,
        isIndexed: true
      })

      columns.push({
        name: 'updated_by',
        type: 'UUID',
        nullable: true,
        isPrimaryKey: false,
        isUnique: false,
        isIndexed: true
      })
    }

    return {
      name: model.name.toLowerCase(),
      columns,
      primaryKey: ['id'],
      uniqueConstraints,
      checkConstraints
    }
  }

  private async generateColumnFromField(field: any): Promise<DatabaseColumn> {
    const typeMapping: Record<string, string> = {
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'number': 'INTEGER',
      'float': 'REAL',
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'TIMESTAMP WITH TIME ZONE',
      'json': 'JSONB',
      'array': 'JSONB',
      'enum': 'VARCHAR(50)',
      'uuid': 'UUID',
      'email': 'VARCHAR(255)',
      'phone': 'VARCHAR(20)',
      'url': 'VARCHAR(500)'
    }

    const columnType = typeMapping[field.type] || 'VARCHAR(255)'

    return {
      name: field.name,
      type: columnType,
      nullable: !field.required,
      defaultValue: field.defaultValue,
      isPrimaryKey: false,
      isUnique: field.unique || false,
      isIndexed: field.unique || false,
      references: undefined,
      check: field.validation ? this.generateCheckConstraint(field.validation) : undefined
    }
  }

  private generateCheckConstraint(validation: string): string {
    // Convert validation rules to SQL check constraints
    if (validation.includes('email')) {
      return "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'"
    }
    if (validation.includes('phone')) {
      return "phone ~* '^[+]?[0-9\\s\\-\\(\\)]{10,}$'"
    }
    if (validation.includes('url')) {
      return "url ~* '^https?://.*'"
    }
    return undefined
  }

  private async generateIndexes(models: any[]): Promise<DatabaseIndex[]> {
    const indexes: DatabaseIndex[] = []

    for (const model of models) {
      // Primary key index
      indexes.push({
        name: `${model.name.toLowerCase()}_pkey`,
        table: model.name.toLowerCase(),
        columns: ['id'],
        unique: true,
        type: 'btree'
      })

      // Tenant index
      indexes.push({
        name: `${model.name.toLowerCase()}_tenant_id_idx`,
        table: model.name.toLowerCase(),
        columns: ['tenant_id'],
        unique: false,
        type: 'btree'
      })

      // Unique field indexes
      for (const field of model.fields) {
        if (field.unique) {
          indexes.push({
            name: `${model.name.toLowerCase()}_${field.name}_unique_idx`,
            table: model.name.toLowerCase(),
            columns: [field.name],
            unique: true,
            type: 'btree'
          })
        }
      }

      // Custom indexes
      if (model.indexes) {
        for (const index of model.indexes) {
          if (typeof index === 'string') {
            indexes.push({
              name: `${model.name.toLowerCase()}_${index}_idx`,
              table: model.name.toLowerCase(),
              columns: [index],
              unique: false,
              type: 'btree'
            })
          } else {
            indexes.push({
              name: index.name || `${model.name.toLowerCase()}_${index.fields.join('_')}_idx`,
              table: model.name.toLowerCase(),
              columns: index.fields,
              unique: index.unique || false,
              type: 'btree'
            })
          }
        }
      }
    }

    return indexes
  }

  private async generateForeignKeys(models: any[]): Promise<DatabaseForeignKey[]> {
    const foreignKeys: DatabaseForeignKey[] = []

    for (const model of models) {
      if (model.relationships) {
        for (const relationship of model.relationships) {
          if (typeof relationship === 'string') {
            // Simple string reference
            foreignKeys.push({
              name: `${model.name.toLowerCase()}_${relationship.toLowerCase()}_fkey`,
              table: model.name.toLowerCase(),
              columns: [`${relationship.toLowerCase()}_id`],
              referencedTable: relationship.toLowerCase(),
              referencedColumns: ['id'],
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            })
          } else {
            // Complex relationship object
            foreignKeys.push({
              name: relationship.foreignKey || `${model.name.toLowerCase()}_${relationship.model.toLowerCase()}_fkey`,
              table: model.name.toLowerCase(),
              columns: [relationship.foreignKey || `${relationship.model.toLowerCase()}_id`],
              referencedTable: relationship.model.toLowerCase(),
              referencedColumns: ['id'],
              onDelete: relationship.cascade ? 'CASCADE' : 'RESTRICT',
              onUpdate: 'CASCADE'
            })
          }
        }
      }
    }

    return foreignKeys
  }

  // Database Schema Creation
  private async createDatabaseSchema(tenantId: string, schema: DatabaseSchema): Promise<void> {
    try {
      // Create schema in Supabase
      const { error } = await this.supabase.rpc('create_tenant_schema', {
        schema_name: schema.name,
        tenant_id: tenantId
      })

      if (error) {
        throw new Error(`Failed to create schema: ${error.message}`)
      }

      // Create tables
      for (const table of schema.tables) {
        await this.createTable(tenantId, schema.name, table)
      }

      // Create indexes
      for (const index of schema.indexes) {
        await this.createIndex(tenantId, schema.name, index)
      }

      // Create foreign keys
      for (const foreignKey of schema.foreignKeys) {
        await this.createForeignKey(tenantId, schema.name, foreignKey)
      }

      console.log(`✅ Database schema created: ${schema.name}`)

    } catch (error) {
      console.error(`❌ Failed to create database schema: ${error}`)
      throw error
    }
  }

  private async createTable(tenantId: string, schemaName: string, table: DatabaseTable): Promise<void> {
    const columns = table.columns.map(col => {
      let definition = `${col.name} ${col.type}`
      
      if (!col.nullable) {
        definition += ' NOT NULL'
      }
      
      if (col.defaultValue !== undefined) {
        definition += ` DEFAULT ${col.defaultValue}`
      }
      
      if (col.check) {
        definition += ` CHECK (${col.check})`
      }
      
      return definition
    }).join(', ')

    const primaryKey = table.primaryKey.length > 0 ? `, PRIMARY KEY (${table.primaryKey.join(', ')})` : ''
    
    const uniqueConstraints = table.uniqueConstraints.map(constraint => 
      `, UNIQUE (${constraint.join(', ')})`
    ).join('')

    const checkConstraints = table.checkConstraints.map(constraint =>
      `, CONSTRAINT ${constraint.name} CHECK (${constraint.condition})`
    ).join('')

    const sql = `
      CREATE TABLE ${schemaName}.${table.name} (
        ${columns}${primaryKey}${uniqueConstraints}${checkConstraints}
      );
    `

    const { error } = await this.supabase.rpc('execute_sql', { sql })
    
    if (error) {
      throw new Error(`Failed to create table ${table.name}: ${error.message}`)
    }
  }

  private async createIndex(tenantId: string, schemaName: string, index: DatabaseIndex): Promise<void> {
    const sql = `
      CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${index.name}
      ON ${schemaName}.${index.table}
      USING ${index.type} (${index.columns.join(', ')});
    `

    const { error } = await this.supabase.rpc('execute_sql', { sql })
    
    if (error) {
      throw new Error(`Failed to create index ${index.name}: ${error.message}`)
    }
  }

  private async createForeignKey(tenantId: string, schemaName: string, foreignKey: DatabaseForeignKey): Promise<void> {
    const sql = `
      ALTER TABLE ${schemaName}.${foreignKey.table}
      ADD CONSTRAINT ${foreignKey.name}
      FOREIGN KEY (${foreignKey.columns.join(', ')})
      REFERENCES ${schemaName}.${foreignKey.referencedTable} (${foreignKey.referencedColumns.join(', ')})
      ON DELETE ${foreignKey.onDelete}
      ON UPDATE ${foreignKey.onUpdate};
    `

    const { error } = await this.supabase.rpc('execute_sql', { sql })
    
    if (error) {
      throw new Error(`Failed to create foreign key ${foreignKey.name}: ${error.message}`)
    }
  }

  // Row Level Security Setup
  private async setupRLS(tenantId: string, config: YAMLConfig): Promise<void> {
    try {
      // Enable RLS on all tables
      for (const model of config.database.models) {
        await this.enableRLSOnTable(tenantId, model.name.toLowerCase())
        await this.createRLSPolicies(tenantId, model)
      }

      console.log(`✅ RLS setup completed for tenant: ${tenantId}`)

    } catch (error) {
      console.error(`❌ RLS setup failed: ${error}`)
      throw error
    }
  }

  private async enableRLSOnTable(tenantId: string, tableName: string): Promise<void> {
    const sql = `
      ALTER TABLE tenant_${tenantId}_schema.${tableName}
      ENABLE ROW LEVEL SECURITY;
    `

    const { error } = await this.supabase.rpc('execute_sql', { sql })
    
    if (error) {
      throw new Error(`Failed to enable RLS on table ${tableName}: ${error.message}`)
    }
  }

  private async createRLSPolicies(tenantId: string, model: any): Promise<void> {
    const tableName = model.name.toLowerCase()
    const policies = []

    // Read policy
    policies.push(`
      CREATE POLICY "tenant_${tenantId}_${tableName}_read_policy"
      ON tenant_${tenantId}_schema.${tableName}
      FOR SELECT
      USING (tenant_id = '${tenantId}'::uuid);
    `)

    // Insert policy
    policies.push(`
      CREATE POLICY "tenant_${tenantId}_${tableName}_insert_policy"
      ON tenant_${tenantId}_schema.${tableName}
      FOR INSERT
      WITH CHECK (tenant_id = '${tenantId}'::uuid);
    `)

    // Update policy
    policies.push(`
      CREATE POLICY "tenant_${tenantId}_${tableName}_update_policy"
      ON tenant_${tenantId}_schema.${tableName}
      FOR UPDATE
      USING (tenant_id = '${tenantId}'::uuid)
      WITH CHECK (tenant_id = '${tenantId}'::uuid);
    `)

    // Delete policy
    policies.push(`
      CREATE POLICY "tenant_${tenantId}_${tableName}_delete_policy"
      ON tenant_${tenantId}_schema.${tableName}
      FOR DELETE
      USING (tenant_id = '${tenantId}'::uuid);
    `)

    // Execute policies
    for (const policy of policies) {
      const { error } = await this.supabase.rpc('execute_sql', { sql: policy })
      
      if (error) {
        throw new Error(`Failed to create policy: ${error.message}`)
      }
    }
  }

  // Migration Management
  async createMigration(migrationData: Omit<Migration, 'id' | 'createdAt'>): Promise<Migration> {
    const migration: Migration = {
      id: this.generateId(),
      ...migrationData,
      createdAt: new Date()
    }

    if (!this.migrations.has(migration.tenantId)) {
      this.migrations.set(migration.tenantId, [])
    }

    this.migrations.get(migration.tenantId)!.push(migration)
    return migration
  }

  async getMigrations(tenantId: string): Promise<Migration[]> {
    return this.migrations.get(tenantId) || []
  }

  async runMigrations(tenantId: string): Promise<void> {
    const migrations = await this.getMigrations(tenantId)
    const pendingMigrations = migrations.filter(m => m.status === 'pending')

    for (const migration of pendingMigrations) {
      try {
        migration.status = 'running'
        
        const { error } = await this.supabase.rpc('execute_sql', { sql: migration.sql })
        
        if (error) {
          migration.status = 'failed'
          migration.error = error.message
          throw new Error(`Migration failed: ${error.message}`)
        }

        migration.status = 'completed'
        migration.executedAt = new Date()

        console.log(`✅ Migration completed: ${migration.name}`)

      } catch (error) {
        console.error(`❌ Migration failed: ${migration.name} - ${error}`)
        throw error
      }
    }
  }

  // Database Seeding
  private async seedDatabase(tenantId: string, config: YAMLConfig): Promise<void> {
    try {
      console.log(`Seeding database for tenant: ${tenantId}`)

      // Generate seed data for each model
      for (const model of config.database.models) {
        await this.seedModel(tenantId, model)
      }

      console.log(`✅ Database seeding completed for tenant: ${tenantId}`)

    } catch (error) {
      console.error(`❌ Database seeding failed: ${error}`)
      throw error
    }
  }

  private async seedModel(tenantId: string, model: any): Promise<void> {
    // Generate sample data based on model fields
    const sampleData = this.generateSampleData(model)
    
    if (sampleData.length > 0) {
      const tableName = model.name.toLowerCase()
      const columns = Object.keys(sampleData[0]).join(', ')
      const values = sampleData.map(row => 
        `(${Object.values(row).map(val => 
          typeof val === 'string' ? `'${val}'` : val
        ).join(', ')})`
      ).join(', ')

      const sql = `
        INSERT INTO tenant_${tenantId}_schema.${tableName} (${columns})
        VALUES ${values};
      `

      const { error } = await this.supabase.rpc('execute_sql', { sql })
      
      if (error) {
        throw new Error(`Failed to seed table ${tableName}: ${error.message}`)
      }
    }
  }

  private generateSampleData(model: any): any[] {
    const sampleData = []
    const sampleCount = 5 // Generate 5 sample records

    for (let i = 0; i < sampleCount; i++) {
      const record: any = {
        tenant_id: '00000000-0000-0000-0000-000000000000', // Will be replaced with actual tenant ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      for (const field of model.fields) {
        record[field.name] = this.generateSampleValue(field)
      }

      sampleData.push(record)
    }

    return sampleData
  }

  private generateSampleValue(field: any): any {
    switch (field.type) {
      case 'string':
      case 'text':
        return `Sample ${field.name} ${Math.random().toString(36).substr(2, 5)}`
      case 'number':
      case 'integer':
        return Math.floor(Math.random() * 1000)
      case 'float':
        return Math.random() * 100
      case 'boolean':
        return Math.random() > 0.5
      case 'date':
        return new Date().toISOString().split('T')[0]
      case 'datetime':
        return new Date().toISOString()
      case 'email':
        return `user${Math.random().toString(36).substr(2, 5)}@example.com`
      case 'phone':
        return `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
      case 'url':
        return `https://example.com/${Math.random().toString(36).substr(2, 5)}`
      case 'json':
        return JSON.stringify({ key: 'value', number: Math.random() })
      case 'uuid':
        return '00000000-0000-0000-0000-000000000000'
      default:
        return `Sample ${field.name}`
    }
  }

  // Connection Management
  async createConnection(connectionData: Omit<DatabaseConnection, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseConnection> {
    const connection: DatabaseConnection = {
      id: this.generateId(),
      ...connectionData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.connections.has(connection.tenantId)) {
      this.connections.set(connection.tenantId, [])
    }

    this.connections.get(connection.tenantId)!.push(connection)
    return connection
  }

  async getConnections(tenantId: string): Promise<DatabaseConnection[]> {
    return this.connections.get(tenantId) || []
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
} 