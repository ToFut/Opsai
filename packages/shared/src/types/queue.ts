// Queue & Job Processing Types for Scalable Architecture

export interface QueueConfig {
  // Provider
  provider: 'bullmq' | 'sqs' | 'pubsub' | 'rabbitmq' | 'kafka'
  
  // Connection
  connection: QueueConnection
  
  // Queues
  queues: QueueDefinition[]
  
  // Workers
  workers: WorkerConfig[]
  
  // Monitoring
  monitoring: QueueMonitoring
  
  // Scaling
  scaling: QueueScaling
}

export interface QueueConnection {
  // Redis (for BullMQ)
  redis?: {
    host: string
    port: number
    password?: string
    tls?: boolean
    cluster?: boolean
  }
  
  // AWS SQS
  sqs?: {
    region: string
    accessKeyId: string
    secretAccessKey: string
    queueUrl?: string
  }
  
  // Google Pub/Sub
  pubsub?: {
    projectId: string
    credentials: string // JSON credentials
  }
  
  // RabbitMQ
  rabbitmq?: {
    url: string
    username?: string
    password?: string
    vhost?: string
  }
  
  // Kafka
  kafka?: {
    brokers: string[]
    clientId: string
    ssl?: boolean
    sasl?: {
      mechanism: string
      username: string
      password: string
    }
  }
}

export interface QueueDefinition {
  name: string
  type: 'standard' | 'priority' | 'delayed' | 'fifo'
  
  // Configuration
  config: {
    // Message retention
    retention: number // seconds
    
    // Visibility timeout
    visibilityTimeout: number
    
    // Max retries
    maxRetries: number
    
    // Dead letter queue
    dlq?: {
      enabled: boolean
      maxReceiveCount: number
      queue: string
    }
    
    // Rate limiting
    rateLimit?: {
      max: number
      duration: number // ms
    }
  }
  
  // Priority settings
  priority?: {
    levels: number
    default: number
  }
  
  // FIFO settings
  fifo?: {
    deduplication: boolean
    contentBasedDeduplication: boolean
    messageGroupId?: string
  }
}

export interface WorkerConfig {
  name: string
  queue: string
  
  // Concurrency
  concurrency: number
  
  // Processing
  processor: string // module path
  
  // Options
  options: {
    // Max processing time
    timeout: number
    
    // Batch processing
    batch?: {
      enabled: boolean
      size: number
      timeout: number
    }
    
    // Rate limiting
    rateLimit?: {
      max: number
      duration: number
    }
    
    // Memory limits
    maxMemory?: number
  }
  
  // Scaling
  scaling: {
    min: number
    max: number
    autoScale: boolean
    metric: 'cpu' | 'memory' | 'queue-depth'
    threshold: number
  }
}

export interface QueueMonitoring {
  // Metrics
  metrics: {
    enabled: boolean
    interval: number
    retention: number
  }
  
  // Alerts
  alerts: QueueAlert[]
  
  // Dashboard
  dashboard: {
    enabled: boolean
    url?: string
  }
  
  // Tracing
  tracing: {
    enabled: boolean
    provider: 'jaeger' | 'zipkin' | 'datadog'
    samplingRate: number
  }
}

export interface QueueAlert {
  name: string
  metric: 'queue-depth' | 'processing-time' | 'error-rate' | 'dlq-messages'
  condition: 'gt' | 'lt' | 'eq'
  threshold: number
  duration: number // seconds
  channels: string[]
}

export interface QueueScaling {
  // Auto-scaling
  autoScale: {
    enabled: boolean
    minWorkers: number
    maxWorkers: number
    
    // Scaling rules
    rules: ScalingRule[]
  }
  
  // Manual scaling
  manual: {
    schedule?: ScalingSchedule[]
  }
}

export interface ScalingRule {
  metric: 'queue-depth' | 'processing-time' | 'cpu' | 'memory'
  threshold: number
  action: 'scale-up' | 'scale-down'
  amount: number
  cooldown: number // seconds
}

export interface ScalingSchedule {
  cron: string
  workers: number
  queues?: string[]
}

// Job types
export interface Job<T = any> {
  id: string
  queue: string
  
  // Job data
  data: T
  
  // Metadata
  metadata: JobMetadata
  
  // Processing
  status: JobStatus
  
  // Results
  result?: any
  error?: JobError
  
  // Timing
  timing: JobTiming
  
  // Attempts
  attempts: JobAttempt[]
}

export interface JobMetadata {
  // User/tenant context
  userId: string
  tenantId?: string
  projectId?: string
  
  // Priority
  priority: number
  
  // Scheduling
  delay?: number
  repeat?: JobRepeat
  
  // Dependencies
  dependsOn?: string[]
  
  // Timeout
  timeout?: number
  
  // Unique key (for deduplication)
  uniqueKey?: string
  
  // Tags (for filtering/searching)
  tags?: string[]
}

export interface JobStatus {
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused'
  progress?: number
  stage?: string
  message?: string
}

export interface JobError {
  message: string
  code?: string
  stack?: string
  details?: any
}

export interface JobTiming {
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  
  // Processing time
  processingTime?: number
  
  // Wait time
  waitTime?: number
  
  // Next retry
  nextRetryAt?: Date
}

export interface JobAttempt {
  attemptNumber: number
  startedAt: Date
  completedAt?: Date
  error?: JobError
  worker: string
}

export interface JobRepeat {
  pattern: string // cron expression
  limit?: number
  endDate?: Date
  timezone?: string
}

// Specific job types for our system
export interface AnalysisJobData {
  type: 'website-analysis'
  url: string
  depth: number
  options: {
    analyzeTech: boolean
    analyzeData: boolean
    analyzeIntegrations: boolean
    analyzePerformance: boolean
  }
}

export interface SchemaGenerationJobData {
  type: 'schema-generation'
  analysisId: string
  dataSources: string[]
  options: {
    deduplication: boolean
    relationships: boolean
    computedFields: boolean
  }
}

export interface DataMigrationJobData {
  type: 'data-migration'
  schemaId: string
  source: {
    type: string
    config: any
  }
  destination: {
    type: string
    config: any
  }
  options: {
    batchSize: number
    parallel: boolean
    validateData: boolean
  }
}

export interface DeploymentJobData {
  type: 'deployment'
  projectId: string
  appPath: string
  provider: 'vercel' | 'netlify' | 'aws'
  environment: 'development' | 'staging' | 'production'
  options: {
    customDomain?: string
    environmentVariables: Record<string, string>
    regions?: string[]
  }
}

export interface SyncJobData {
  type: 'data-sync'
  connectionId: string
  streams: string[]
  mode: 'full' | 'incremental'
  options: {
    parallel: boolean
    validateData: boolean
    transformations?: any[]
  }
}

// Job results
export interface JobResult<T = any> {
  success: boolean
  data?: T
  error?: JobError
  
  // Metrics
  metrics?: {
    itemsProcessed?: number
    duration?: number
    memoryUsed?: number
  }
  
  // Artifacts
  artifacts?: JobArtifact[]
}

export interface JobArtifact {
  name: string
  type: string
  url: string
  size: number
  metadata?: any
}

// Worker types
export interface Worker {
  id: string
  name: string
  queue: string
  
  // Status
  status: 'idle' | 'busy' | 'paused' | 'stopped'
  
  // Current job
  currentJob?: string
  
  // Stats
  stats: WorkerStats
  
  // Health
  health: WorkerHealth
}

export interface WorkerStats {
  processed: number
  failed: number
  avgProcessingTime: number
  uptime: number
}

export interface WorkerHealth {
  status: 'healthy' | 'unhealthy'
  cpu: number
  memory: number
  lastHeartbeat: Date
}

// Queue manager interface
export interface QueueManager {
  // Queue operations
  createQueue(name: string, config: QueueDefinition): Promise<void>
  deleteQueue(name: string): Promise<void>
  
  // Job operations
  addJob<T>(queue: string, data: T, options?: JobMetadata): Promise<Job<T>>
  getJob(id: string): Promise<Job | null>
  removeJob(id: string): Promise<void>
  
  // Bulk operations
  addBulkJobs<T>(queue: string, jobs: Array<{ data: T; options?: JobMetadata }>): Promise<Job<T>[]>
  
  // Worker operations
  startWorker(config: WorkerConfig): Promise<Worker>
  stopWorker(id: string): Promise<void>
  pauseWorker(id: string): Promise<void>
  resumeWorker(id: string): Promise<void>
  
  // Monitoring
  getQueueStats(queue: string): Promise<QueueStats>
  getWorkerStats(worker: string): Promise<WorkerStats>
  
  // Cleanup
  cleanQueue(queue: string, grace: number): Promise<number>
  obliterateQueue(queue: string): Promise<void>
}

export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: number
  
  // Rates
  completedRate: number // per minute
  failedRate: number
  
  // Performance
  avgWaitTime: number
  avgProcessingTime: number
}