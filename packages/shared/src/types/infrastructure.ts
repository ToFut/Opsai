// Infrastructure & Deployment Types for Scalable Architecture

export interface InfrastructureConfig {
  id: string
  projectId: string
  environment: 'development' | 'staging' | 'production'
  
  // Components
  database: DatabaseInfrastructure
  hosting: HostingInfrastructure
  sync: SyncInfrastructure
  monitoring: MonitoringInfrastructure
  
  // Scaling
  scaling: ScalingConfig
  
  // Security
  security: SecurityConfig
  
  // Cost management
  costLimits: CostLimits
  
  // Status
  status: InfrastructureStatus
}

export interface DatabaseInfrastructure {
  provider: 'supabase' | 'neon' | 'planetscale' | 'custom'
  
  // Connection details
  connection: {
    host: string
    port: number
    database: string
    ssl: boolean
  }
  
  // Credentials (encrypted)
  credentials: {
    username: string
    password: string // encrypted
    connectionString: string // encrypted
  }
  
  // Configuration
  config: {
    poolSize: number
    maxConnections: number
    statementTimeout: number
  }
  
  // Scaling
  scaling: {
    type: 'vertical' | 'horizontal' | 'serverless'
    minInstances: number
    maxInstances: number
    autoScale: boolean
  }
  
  // Backup
  backup: {
    enabled: boolean
    frequency: string // cron expression
    retention: number // days
    location: string
  }
}

export interface HostingInfrastructure {
  provider: 'vercel' | 'netlify' | 'aws' | 'gcp' | 'azure'
  
  // Deployment details
  deployment: {
    url: string
    customDomain?: string
    ssl: boolean
    cdn: boolean
  }
  
  // Environment
  environment: {
    nodeVersion: string
    framework: string
    buildCommand: string
    outputDirectory: string
  }
  
  // Resources
  resources: {
    memory: number
    cpu: number
    timeout: number
    concurrency: number
  }
  
  // Regions
  regions: DeploymentRegion[]
  
  // Edge functions
  edgeFunctions: EdgeFunction[]
}

export interface DeploymentRegion {
  name: string
  code: string
  primary: boolean
  latency: number
}

export interface EdgeFunction {
  name: string
  path: string
  regions: string[]
  memory: number
  timeout: number
}

export interface SyncInfrastructure {
  provider: 'airbyte' | 'fivetran' | 'stitch' | 'custom'
  
  // Instance details
  instance: {
    url: string
    apiKey: string // encrypted
    version: string
  }
  
  // Connections
  connections: SyncConnection[]
  
  // Resources
  resources: {
    workers: number
    memory: number
    storage: number
  }
  
  // Monitoring
  monitoring: {
    healthCheckUrl: string
    metricsUrl: string
    alerting: boolean
  }
}

export interface SyncConnection {
  id: string
  name: string
  
  // Source & destination
  source: {
    type: string
    connectionId: string
    config: Record<string, any>
  }
  
  destination: {
    type: string
    connectionId: string
    config: Record<string, any>
  }
  
  // Sync configuration
  sync: {
    mode: 'full_refresh' | 'incremental' | 'append'
    frequency: string // cron or 'realtime'
    streams: SyncStream[]
  }
  
  // Status
  status: {
    state: 'active' | 'paused' | 'error'
    lastSync?: Date
    nextSync?: Date
    recordsSynced: number
  }
}

export interface SyncStream {
  name: string
  enabled: boolean
  syncMode: 'full_refresh' | 'incremental'
  cursorField?: string
  primaryKey?: string[]
  transformations?: StreamTransformation[]
}

export interface StreamTransformation {
  type: 'rename' | 'cast' | 'filter' | 'compute' | 'custom'
  config: Record<string, any>
}

export interface MonitoringInfrastructure {
  provider: 'datadog' | 'newrelic' | 'sentry' | 'custom'
  
  // Configuration
  config: {
    apiKey: string // encrypted
    appName: string
    environment: string
  }
  
  // Features
  features: {
    apm: boolean
    logging: boolean
    metrics: boolean
    tracing: boolean
    profiling: boolean
  }
  
  // Alerts
  alerts: MonitoringAlert[]
  
  // Dashboards
  dashboards: MonitoringDashboard[]
}

export interface MonitoringAlert {
  name: string
  type: 'metric' | 'log' | 'error' | 'uptime'
  condition: string
  threshold: number
  channels: string[]
}

export interface MonitoringDashboard {
  name: string
  url: string
  widgets: string[]
}

export interface ScalingConfig {
  // Auto-scaling
  autoScale: {
    enabled: boolean
    minInstances: number
    maxInstances: number
    targetCpu: number
    targetMemory: number
  }
  
  // Load balancing
  loadBalancer: {
    enabled: boolean
    algorithm: 'round-robin' | 'least-connections' | 'ip-hash'
    healthCheck: string
  }
  
  // Caching
  cache: {
    provider: 'redis' | 'memcached' | 'cloudflare'
    size: number
    ttl: number
    regions: string[]
  }
  
  // Queue
  queue: {
    provider: 'bullmq' | 'sqs' | 'pubsub' | 'rabbitmq'
    workers: number
    concurrency: number
  }
}

export interface SecurityConfig {
  // Authentication
  auth: {
    provider: 'supabase' | 'auth0' | 'firebase' | 'custom'
    methods: string[]
    mfa: boolean
  }
  
  // Encryption
  encryption: {
    atRest: boolean
    inTransit: boolean
    keyManagement: 'aws-kms' | 'gcp-kms' | 'azure-kv' | 'vault'
  }
  
  // Network
  network: {
    vpc: boolean
    privateSubnets: boolean
    waf: boolean
    ddosProtection: boolean
  }
  
  // Compliance
  compliance: {
    standards: string[] // ['GDPR', 'HIPAA', 'SOC2']
    dataResidency: string[]
    auditLogging: boolean
  }
}

export interface CostLimits {
  // Monthly limits
  monthly: {
    total: number
    database: number
    hosting: number
    sync: number
    monitoring: number
  }
  
  // Alerts
  alerts: {
    thresholds: number[] // [50, 80, 90]
    recipients: string[]
  }
  
  // Actions
  actions: {
    autoScale: boolean
    autoShutdown: boolean
    notifyOnly: boolean
  }
}

export interface InfrastructureStatus {
  // Overall health
  health: 'healthy' | 'degraded' | 'unhealthy'
  
  // Component status
  components: {
    database: ComponentStatus
    hosting: ComponentStatus
    sync: ComponentStatus
    monitoring: ComponentStatus
  }
  
  // Metrics
  metrics: {
    uptime: number
    responseTime: number
    errorRate: number
    throughput: number
  }
  
  // Costs
  costs: {
    current: number
    projected: number
    trend: 'increasing' | 'stable' | 'decreasing'
  }
}

export interface ComponentStatus {
  status: 'operational' | 'degraded' | 'outage'
  message?: string
  lastChecked: Date
  uptime: number
}

// Provisioning types
export interface ProvisioningRequest {
  id: string
  userId: string
  projectId: string
  
  // What to provision
  components: {
    database: boolean
    hosting: boolean
    sync: boolean
    monitoring: boolean
  }
  
  // Configuration
  config: {
    environment: 'development' | 'staging' | 'production'
    region: string
    size: 'small' | 'medium' | 'large' | 'custom'
  }
  
  // Status
  status: 'pending' | 'provisioning' | 'completed' | 'failed'
  
  // Progress
  progress: {
    current: number
    total: number
    currentStep: string
  }
  
  // Results
  infrastructure?: InfrastructureConfig
  error?: string
  
  // Timing
  requestedAt: Date
  startedAt?: Date
  completedAt?: Date
}

export interface ProvisioningStep {
  name: string
  description: string
  
  // Execution
  execute: () => Promise<any>
  rollback?: () => Promise<void>
  
  // Dependencies
  dependsOn: string[]
  
  // Retry policy
  maxRetries: number
  retryDelay: number
  
  // Timeout
  timeout: number
}

export interface InfrastructureTemplate {
  id: string
  name: string
  description: string
  
  // Use case
  category: 'ecommerce' | 'saas' | 'marketplace' | 'enterprise'
  size: 'small' | 'medium' | 'large'
  
  // Components
  components: {
    database: DatabaseTemplate
    hosting: HostingTemplate
    sync: SyncTemplate
    monitoring: MonitoringTemplate
  }
  
  // Estimated costs
  estimatedCosts: {
    monthly: number
    setup: number
  }
  
  // Performance
  performance: {
    rps: number // requests per second
    storage: number // GB
    bandwidth: number // GB/month
  }
}

export interface DatabaseTemplate {
  provider: string
  plan: string
  config: Record<string, any>
}

export interface HostingTemplate {
  provider: string
  plan: string
  regions: string[]
  config: Record<string, any>
}

export interface SyncTemplate {
  provider: string
  connectors: string[]
  frequency: string
}

export interface MonitoringTemplate {
  provider: string
  features: string[]
  alerts: string[]
}