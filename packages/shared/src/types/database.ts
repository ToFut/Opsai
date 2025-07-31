export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
  };
}

export interface PrismaSchema {
  models: Model[];
  enums: Enum[];
  datasources: Datasource[];
  generators: Generator[];
}

export interface Model {
  name: string;
  fields: Field[];
  relations?: Relation[];
  indexes?: Index[];
  uniqueConstraints?: UniqueConstraint[];
}

export interface Field {
  name: string;
  type: string; // Supports both YAML types ('string', 'number', etc.) and Prisma types ('String', 'Int', etc.)
  isRequired: boolean;
  isUnique: boolean;
  isPrimary: boolean;
  defaultValue?: any;
  relationName?: string;
  relationField?: string;
  relationModel?: string;
  relationType?: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  // Optional properties for better compatibility
  required?: boolean; // Alias for isRequired
  unique?: boolean;   // Alias for isUnique
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface Relation {
  name: string;
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  modelA: string;
  modelB: string;
  fieldA: string;
  fieldB: string;
}

export interface Index {
  name: string;
  fields: string[];
  type?: 'unique' | 'fulltext' | 'spatial';
}

export interface UniqueConstraint {
  name: string;
  fields: string[];
}

export interface Enum {
  name: string;
  values: string[];
}

export interface Datasource {
  name: string;
  provider: string;
  url: string;
}

export interface Generator {
  name: string;
  provider: string;
  output?: string;
}

export interface Migration {
  id: string;
  name: string;
  appliedAt: Date;
  checksum: string;
  sql: string;
}

export interface MigrationStep {
  type: 'create_table' | 'drop_table' | 'create_index' | 'drop_index' | 'add_foreign_key' | 'drop_foreign_key';
  table: string;
  column?: string;
  constraint?: string;
  columns?: Array<{
    name: string;
    type: string;
    nullable: boolean;
    unique: boolean;
    primary: boolean;
    default?: any;
  }>;
  index?: {
    name: string;
    columns: string[];
    unique: boolean;
  };
  references?: {
    table: string;
    column: string;
  };
}

export interface SeedData {
  table: string;
  data: Record<string, any>[];
}

export interface BackupResult {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  status: 'completed' | 'failed' | 'in_progress';
}

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  databaseUrl: string;
  settings: Record<string, any>;
} 