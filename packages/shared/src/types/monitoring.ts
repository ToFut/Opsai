// Monitoring & Analytics Types for Scalable Architecture

export interface MonitoringConfig {
  // Providers
  providers: MonitoringProvider[]
  
  // Metrics collection
  metrics: MetricsConfig
  
  // Logging
  logging: LoggingConfig
  
  // Tracing
  tracing: TracingConfig
  
  // Alerting
  alerting: AlertingConfig
  
  // Dashboards
  dashboards: DashboardConfig[]
  
  // Retention
  retention: RetentionConfig
}

export interface MonitoringProvider {
  type: 'datadog' | 'newrelic' | 'prometheus' | 'elastic' | 'custom'
  
  // Connection
  config: {
    apiKey?: string
    endpoint?: string
    region?: string
    namespace?: string
  }
  
  // Features
  features: {
    metrics: boolean
    logs: boolean
    traces: boolean
    profiling: boolean
    synthetics: boolean
  }
  
  // Integration
  integration: {
    autoInstrumentation: boolean
    customMetrics: boolean
    customEvents: boolean
  }
}

export interface MetricsConfig {
  // Collection interval
  interval: number // seconds
  
  // System metrics
  system: {
    cpu: boolean
    memory: boolean
    disk: boolean
    network: boolean
  }
  
  // Application metrics
  application: {
    requests: boolean
    errors: boolean
    latency: boolean
    throughput: boolean
  }
  
  // Business metrics
  business: {
    enabled: boolean
    custom: BusinessMetric[]
  }
  
  // Aggregations
  aggregations: MetricAggregation[]
}

export interface BusinessMetric {
  name: string
  description: string
  
  // Query
  query: {
    type: 'sql' | 'api' | 'computed'
    source: string
    expression: string
  }
  
  // Properties
  unit: string
  tags: string[]
  
  // Alerting
  thresholds?: MetricThreshold[]
}

export interface MetricAggregation {
  name: string
  metrics: string[]
  function: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'p50' | 'p95' | 'p99'
  window: string // '1m', '5m', '1h', etc.
  groupBy?: string[]
}

export interface MetricThreshold {
  condition: 'gt' | 'lt' | 'eq' | 'between'
  value: number | [number, number]
  duration: number // seconds
  severity: 'info' | 'warning' | 'error' | 'critical'
}

export interface LoggingConfig {
  // Log levels
  level: 'debug' | 'info' | 'warn' | 'error'
  
  // Structured logging
  structured: boolean
  
  // Log enrichment
  enrichment: {
    requestId: boolean
    userId: boolean
    tenantId: boolean
    traceId: boolean
    environment: boolean
  }
  
  // Sampling
  sampling: {
    enabled: boolean
    rate: number // 0-1
    rules: LogSamplingRule[]
  }
  
  // Redaction
  redaction: {
    enabled: boolean
    patterns: string[]
    fields: string[]
  }
}

export interface LogSamplingRule {
  condition: string
  rate: number
  maxPerSecond?: number
}

export interface TracingConfig {
  // Sampling
  sampling: {
    type: 'probabilistic' | 'adaptive' | 'rules'
    rate: number
    rules?: TraceSamplingRule[]
  }
  
  // Instrumentation
  instrumentation: {
    http: boolean
    database: boolean
    cache: boolean
    queue: boolean
    custom: string[]
  }
  
  // Propagation
  propagation: {
    format: 'w3c' | 'b3' | 'jaeger' | 'datadog'
    baggage: boolean
  }
  
  // Export
  export: {
    endpoint: string
    protocol: 'grpc' | 'http'
    compression: boolean
    timeout: number
  }
}

export interface TraceSamplingRule {
  service?: string
  operation?: string
  rate: number
  maxPerSecond?: number
}

export interface AlertingConfig {
  // Channels
  channels: AlertChannel[]
  
  // Rules
  rules: AlertRule[]
  
  // Routing
  routing: AlertRouting[]
  
  // Suppression
  suppression: {
    enabled: boolean
    window: number // seconds
    groupBy: string[]
  }
  
  // Escalation
  escalation: EscalationPolicy[]
}

export interface AlertChannel {
  id: string
  name: string
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms'
  
  // Configuration
  config: {
    // Email
    email?: {
      to: string[]
      from: string
      smtp?: any
    }
    
    // Slack
    slack?: {
      webhook: string
      channel: string
      username?: string
    }
    
    // PagerDuty
    pagerduty?: {
      routingKey: string
      severity: string
    }
    
    // Webhook
    webhook?: {
      url: string
      method: string
      headers?: Record<string, string>
    }
    
    // SMS
    sms?: {
      numbers: string[]
      provider: string
      apiKey: string
    }
  }
}

export interface AlertRule {
  id: string
  name: string
  description: string
  
  // Condition
  condition: {
    type: 'metric' | 'log' | 'error' | 'uptime' | 'custom'
    query: string
    threshold: MetricThreshold
  }
  
  // Properties
  severity: 'info' | 'warning' | 'error' | 'critical'
  enabled: boolean
  
  // Metadata
  tags: string[]
  annotations: Record<string, string>
}

export interface AlertRouting {
  rule: string
  channels: string[]
  
  // Conditions
  conditions?: {
    severity?: string[]
    tags?: string[]
    time?: TimeWindow[]
  }
  
  // Throttling
  throttle?: {
    count: number
    window: number // seconds
  }
}

export interface TimeWindow {
  days: string[] // ['monday', 'tuesday']
  start: string // '09:00'
  end: string // '17:00'
  timezone: string
}

export interface EscalationPolicy {
  name: string
  levels: EscalationLevel[]
}

export interface EscalationLevel {
  delay: number // minutes
  channels: string[]
  repeat?: number
}

export interface DashboardConfig {
  id: string
  name: string
  description: string
  
  // Layout
  layout: {
    type: 'grid' | 'flow'
    columns?: number
  }
  
  // Widgets
  widgets: DashboardWidget[]
  
  // Filters
  filters: DashboardFilter[]
  
  // Refresh
  refresh: {
    interval: number // seconds
    auto: boolean
  }
  
  // Access
  access: {
    public: boolean
    roles?: string[]
    users?: string[]
  }
}

export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'log' | 'map' | 'custom'
  
  // Position
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  
  // Configuration
  config: {
    title: string
    query: string
    visualization?: any
    options?: any
  }
  
  // Interactions
  interactions?: {
    drill?: string
    filter?: string[]
    export?: boolean
  }
}

export interface DashboardFilter {
  name: string
  type: 'time' | 'select' | 'multi-select' | 'text'
  parameter: string
  
  // Options
  options?: {
    values?: any[]
    default?: any
    required?: boolean
  }
}

export interface RetentionConfig {
  // Metrics
  metrics: {
    raw: number // days
    aggregated: {
      '1m': number
      '5m': number
      '1h': number
      '1d': number
    }
  }
  
  // Logs
  logs: {
    hot: number // days
    warm: number
    cold: number
    archive?: {
      enabled: boolean
      location: string
      compression: boolean
    }
  }
  
  // Traces
  traces: {
    complete: number // days
    sampled: number
  }
  
  // Cleanup
  cleanup: {
    schedule: string // cron
    batchSize: number
  }
}

// Analytics types
export interface AnalyticsEvent {
  id: string
  timestamp: Date
  
  // Event details
  name: string
  category: string
  
  // Context
  userId?: string
  tenantId?: string
  sessionId?: string
  
  // Properties
  properties: Record<string, any>
  
  // Technical
  source: string
  version: string
}

export interface AnalyticsMetric {
  name: string
  value: number
  timestamp: Date
  
  // Dimensions
  dimensions: Record<string, string>
  
  // Aggregation
  aggregation?: {
    type: 'sum' | 'avg' | 'min' | 'max' | 'count'
    window: string
  }
}

export interface AnalyticsQuery {
  // Time range
  timeRange: {
    start: Date
    end: Date
  }
  
  // Metrics
  metrics: string[]
  
  // Filters
  filters?: Record<string, any>
  
  // Group by
  groupBy?: string[]
  
  // Order
  orderBy?: {
    field: string
    direction: 'asc' | 'desc'
  }
  
  // Limit
  limit?: number
}

export interface AnalyticsResult {
  query: AnalyticsQuery
  
  // Results
  data: AnalyticsDataPoint[]
  
  // Metadata
  metadata: {
    executionTime: number
    totalRecords: number
    truncated: boolean
  }
}

export interface AnalyticsDataPoint {
  timestamp: Date
  dimensions: Record<string, string>
  metrics: Record<string, number>
}

// Performance monitoring
export interface PerformanceMetrics {
  // Response times
  responseTime: {
    p50: number
    p95: number
    p99: number
    avg: number
  }
  
  // Throughput
  throughput: {
    requests: number
    errors: number
    successRate: number
  }
  
  // Resources
  resources: {
    cpu: number
    memory: number
    connections: number
    threads: number
  }
  
  // Database
  database: {
    queryTime: number
    connections: number
    slowQueries: number
  }
  
  // Cache
  cache: {
    hitRate: number
    evictions: number
    memory: number
  }
}

// Cost monitoring
export interface CostMetrics {
  // Current costs
  current: {
    total: number
    breakdown: Record<string, number>
  }
  
  // Projected costs
  projected: {
    daily: number
    monthly: number
    yearly: number
  }
  
  // Trends
  trends: {
    daily: CostTrend[]
    monthly: CostTrend[]
  }
  
  // Optimization
  optimization: {
    potential: number
    recommendations: CostOptimization[]
  }
}

export interface CostTrend {
  date: Date
  cost: number
  change: number
  changePercent: number
}

export interface CostOptimization {
  type: string
  description: string
  potential: number
  effort: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
}