// Website & Data Analysis Types for Scalable Architecture

export interface WebsiteAnalysis {
  id: string
  url: string
  timestamp: Date
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  
  // Business insights
  business: BusinessProfile
  
  // Technical analysis
  technology: TechnologyStack
  
  // Discovered integrations
  integrations: DiscoveredIntegration[]
  
  // Inferred data models
  dataModels: InferredDataModel[]
  
  // User journeys
  userJourneys: UserJourney[]
  
  // Performance metrics
  metrics: AnalysisMetrics
  
  // Caching
  cacheKey: string
  ttl: number
}

export interface BusinessProfile {
  name: string
  type: 'ecommerce' | 'saas' | 'marketplace' | 'service' | 'content' | 'other'
  industry: string
  description: string
  
  // Business metrics
  estimatedRevenue?: string
  estimatedCustomers?: number
  estimatedTransactions?: number
  
  // Features detected
  features: string[]
  
  // AI confidence score
  confidenceScore: number
}

export interface TechnologyStack {
  frontend: Technology[]
  backend: Technology[]
  database: Technology[]
  hosting: Technology[]
  analytics: Technology[]
  payments: Technology[]
  marketing: Technology[]
  
  // Overall stack type
  stackType: 'jamstack' | 'traditional' | 'serverless' | 'hybrid'
}

export interface Technology {
  name: string
  version?: string
  category: string
  confidence: number
  detectionMethod: 'header' | 'dom' | 'script' | 'api' | 'pattern'
}

export interface DiscoveredIntegration {
  id: string
  provider: string
  type: 'payment' | 'crm' | 'email' | 'analytics' | 'ecommerce' | 'social' | 'other'
  
  // OAuth requirements
  authType: 'oauth2' | 'oauth1' | 'apikey' | 'basic'
  scopes?: string[]
  
  // Detected usage
  detectedEndpoints: string[]
  estimatedApiCalls: number
  dataTypes: string[]
  
  // Priority for connection
  priority: 'required' | 'recommended' | 'optional'
}

export interface InferredDataModel {
  name: string
  source: 'ui' | 'api' | 'database' | 'pattern'
  
  // Inferred fields
  fields: InferredField[]
  
  // Relationships
  relationships: InferredRelationship[]
  
  // Business context
  businessPurpose: string
  estimatedRecords: number
  
  // Confidence
  confidence: number
}

export interface InferredField {
  name: string
  type: string
  required: boolean
  unique: boolean
  
  // Sample values found
  sampleValues?: any[]
  
  // Validation rules inferred
  validation?: {
    pattern?: string
    min?: number
    max?: number
    enum?: string[]
  }
}

export interface InferredRelationship {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  foreignKey?: string
  confidence: number
}

export interface UserJourney {
  name: string
  description: string
  
  // Journey steps
  steps: JourneyStep[]
  
  // Conversion points
  conversions: ConversionPoint[]
  
  // Estimated traffic
  estimatedTraffic: number
  
  // Priority
  priority: 'critical' | 'important' | 'nice-to-have'
}

export interface JourneyStep {
  order: number
  action: string
  page: string
  
  // UI elements involved
  elements: string[]
  
  // Data operations
  dataOperations: string[]
}

export interface ConversionPoint {
  name: string
  type: 'signup' | 'purchase' | 'subscribe' | 'contact' | 'other'
  estimatedRate: number
}

export interface AnalysisMetrics {
  // Performance
  analysisTime: number
  pagesAnalyzed: number
  apisDiscovered: number
  
  // Quality
  coverageScore: number
  confidenceScore: number
  
  // Resource usage
  memoryUsed: number
  apiCallsMade: number
}

// Schema unification types
export interface UnifiedSchema {
  id: string
  projectId: string
  version: number
  
  // Unified models
  models: UnifiedModel[]
  
  // Global settings
  settings: SchemaSettings
  
  // Conflict resolutions
  resolutions: ConflictResolution[]
  
  // Metadata
  metadata: SchemaMetadata
}

export interface UnifiedModel {
  name: string
  tableName: string
  
  // Unified fields
  fields: UnifiedField[]
  
  // Relationships
  relationships: ModelRelationship[]
  
  // Source mapping
  sources: ModelSource[]
  
  // Business rules
  businessRules: BusinessRule[]
  
  // Computed fields
  computedFields: ComputedField[]
}

export interface ModelRelationship {
  name: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  targetModel: string
  foreignKey?: string
  cascade?: boolean
}

export interface FieldValidation {
  type: 'required' | 'unique' | 'pattern' | 'range' | 'custom'
  value?: any
  message?: string
}

export interface FieldTransformation {
  type: 'format' | 'convert' | 'calculate' | 'custom'
  operation: string
  parameters?: Record<string, any>
}

export interface UnifiedField {
  name: string
  type: string
  required: boolean
  unique: boolean
  
  // Source mapping
  sources: FieldSource[]
  
  // Conflict resolution
  conflictStrategy: 'latest' | 'merge' | 'priority' | 'custom'
  
  // Validation
  validation?: FieldValidation
  
  // Transformations
  transformations?: FieldTransformation[]
}

export interface ModelSource {
  integration: string
  originalModel: string
  fieldMappings: Record<string, string>
  priority: number
}

export interface FieldSource {
  integration: string
  originalField: string
  lastUpdated?: Date
  priority: number
}

export interface ConflictResolution {
  fieldPath: string
  strategy: 'latest' | 'merge' | 'priority' | 'manual'
  resolution?: any
  reason?: string
}

export interface BusinessRule {
  name: string
  description: string
  type: 'validation' | 'calculation' | 'trigger'
  implementation: string
}

export interface ComputedField {
  name: string
  type: string
  computation: string
  dependencies: string[]
  updateTrigger: 'realtime' | 'batch' | 'ondemand'
}

export interface SchemaSettings {
  // Deduplication
  deduplicationStrategy: 'email' | 'phone' | 'composite' | 'custom'
  deduplicationFields: string[]
  
  // Sync settings
  syncMode: 'realtime' | 'batch' | 'hybrid'
  syncFrequency?: string
  
  // Data retention
  retentionPolicy: {
    days: number
    archiveStrategy: 'delete' | 'archive' | 'aggregate'
  }
}

export interface SchemaMetadata {
  created: Date
  updated: Date
  analyzedAt: Date
  
  // Statistics
  totalRecords: number
  totalDuplicates: number
  dataSources: number
  
  // Quality metrics
  dataQualityScore: number
  completenessScore: number
}

// Analysis job types for queue processing
export interface AnalysisJob {
  id: string
  type: 'website' | 'data' | 'schema' | 'integration'
  
  // Job details
  input: any
  priority: 'high' | 'normal' | 'low'
  
  // Processing
  status: 'queued' | 'processing' | 'completed' | 'failed'
  attempts: number
  
  // Results
  result?: any
  error?: string
  
  // Timing
  queuedAt: Date
  startedAt?: Date
  completedAt?: Date
  
  // Resource limits
  maxMemory?: number
  timeout?: number
}

export interface AnalysisWorkerConfig {
  // Concurrency
  maxConcurrent: number
  maxPerUser: number
  
  // Resource limits
  maxMemoryPerJob: number
  maxTimePerJob: number
  
  // Retry policy
  maxRetries: number
  retryDelay: number
  
  // Scaling
  autoScale: boolean
  minWorkers: number
  maxWorkers: number
}