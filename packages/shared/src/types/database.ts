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
  type: string;
  isRequired: boolean;
  isUnique: boolean;
  isPrimary: boolean;
  defaultValue?: any;
  relationName?: string;
  relationField?: string;
  relationModel?: string;
  relationType?: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
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