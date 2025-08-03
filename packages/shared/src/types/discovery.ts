// Discovery types
export interface DiscoveredDataSource {
  id: string;
  name: string;
  type: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  metadata: Record<string, any>;
  catalog?: any;
}

export interface DiscoveredSchema {
  schemas?: DiscoveredTable[];
  tables?: DiscoveredTable[]; // Alias for schemas
  relationships: SchemaRelationship[];
  metadata?: Record<string, any>;
  businessContext?: any;
}

export interface DiscoveredTable {
  name: string;
  schema?: string;
  columns: DiscoveredColumn[];
  indexes?: TableIndex[];
  constraints?: TableConstraint[];
  rowCount?: number;
  metadata?: Record<string, any>;
  displayName?: string;
  businessEntity?: {
    suggestedName?: string;
    type?: string;
    confidence?: number;
  };
  primaryKey?: string[];
}

export interface DiscoveredColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: boolean;
  unique?: boolean;
  defaultValue?: any;
  metadata?: Record<string, any>;
  displayName?: string;
  businessMeaning?: {
    category?: string;
    confidence?: number;
  };
  validation?: {
    required?: boolean;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface TableIndex {
  name: string;
  columns: string[];
  unique: boolean;
  type?: string;
}

export interface TableConstraint {
  name: string;
  type: 'primary' | 'foreign' | 'unique' | 'check';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
}

export interface SchemaRelationship {
  name: string;
  from: {
    table: string;
    column: string;
  };
  to: {
    table: string;
    column: string;
  };
  type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one';
  metadata?: Record<string, any>;
}

export interface BusinessEntity {
  name: string;
  type: 'core' | 'lookup' | 'transaction' | 'audit';
  tables: string[];
  keyAttributes: string[];
  count?: number;
  confidence?: number;
}