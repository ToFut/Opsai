import { YAMLConfig } from '@opsai/yaml-validator'
import { AlertManager } from './alert-manager'

export interface Metric {
  id: string
  tenantId: string
  name: string
  value: number
  unit: string
  tags: Record<string, string>
  timestamp: Date
  metadata?: Record<string, any>
}

export interface AlertRule {
  id: string
  tenantId: string
  name: string
  description: string
  metric: string
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains'
  threshold: number
  duration: number // seconds
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  actions: string[] // Action IDs to trigger
  createdAt: Date
  updatedAt: Date
}

export interface MonitoringDashboard {
  id: string
  tenantId: string
  name: string
  description: string
  panels: DashboardPanel[]
  refreshInterval: number
  createdAt: Date
  updatedAt: Date
}

export interface DashboardPanel {
  id: string
  title: string
  type: 'graph' | 'stat' | 'table' | 'heatmap' | 'gauge'
  metrics: string[]
  query: string
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  options: Record<string, any>
}

export interface HealthCheck {
  id: string
  tenantId: string
  name: string
  type: 'http' | 'tcp' | 'database' | 'custom'
  config: Record<string, any>
  status: 'healthy' | 'unhealthy' | 'unknown'
  lastCheck: Date
  responseTime: number
  error?: string
}

export class MonitoringManager {
  private metrics: Map<string, Metric[]> = new Map()
  private alertRules: Map<string, AlertRule[]> = new Map()
  private dashboards: Map<string, MonitoringDashboard[]> = new Map()
  private healthChecks: Map<string, HealthCheck[]> = new Map()
  private alertManager: AlertManager

  constructor() {
    this.alertManager = new AlertManager()
    this.startMetricsCollection()
    this.startHealthCheckScheduler()
  }

  // Metrics Management
  async recordMetric(tenantId: string, metric: Omit<Metric, 'id' | 'timestamp'>): Promise<void> {
    const newMetric: Metric = {
      id: this.generateId(),
      ...metric,
      timestamp: new Date()
    }

    if (!this.metrics.has(tenantId)) {
      this.metrics.set(tenantId, [])
    }

    this.metrics.get(tenantId)!.push(newMetric)

    // Check alert rules
    await this.checkAlertRules(tenantId, newMetric)

    // Store in time-series database (InfluxDB, Prometheus, etc.)
    await this.storeMetric(newMetric)
  }

  async getMetrics(tenantId: string, query: string, timeRange: { start: Date; end: Date }): Promise<Metric[]> {
    const tenantMetrics = this.metrics.get(tenantId) || []
    
    // Filter by time range
    return tenantMetrics.filter(metric => 
      metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    )
  }

  async getMetricAggregation(
    tenantId: string,
    metricName: string,
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count',
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    const metrics = await this.getMetrics(tenantId, `name="${metricName}"`, timeRange)
    
    if (metrics.length === 0) return 0

    switch (aggregation) {
      case 'sum':
        return metrics.reduce((sum, m) => sum + m.value, 0)
      case 'avg':
        return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
      case 'min':
        return Math.min(...metrics.map(m => m.value))
      case 'max':
        return Math.max(...metrics.map(m => m.value))
      case 'count':
        return metrics.length
      default:
        return 0
    }
  }

  // Alert Rules Management
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertRule> {
    const newRule: AlertRule = {
      id: this.generateId(),
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.alertRules.has(rule.tenantId)) {
      this.alertRules.set(rule.tenantId, [])
    }

    this.alertRules.get(rule.tenantId)!.push(newRule)
    return newRule
  }

  async getAlertRules(tenantId: string): Promise<AlertRule[]> {
    return this.alertRules.get(tenantId) || []
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    for (const [tenantId, rules] of this.alertRules.entries()) {
      const ruleIndex = rules.findIndex(r => r.id === ruleId)
      if (ruleIndex !== -1) {
        rules[ruleIndex] = { ...rules[ruleIndex], ...updates, updatedAt: new Date() }
        return rules[ruleIndex]
      }
    }
    throw new Error('Alert rule not found')
  }

  async deleteAlertRule(ruleId: string): Promise<void> {
    for (const [tenantId, rules] of this.alertRules.entries()) {
      const ruleIndex = rules.findIndex(r => r.id === ruleId)
      if (ruleIndex !== -1) {
        rules.splice(ruleIndex, 1)
        return
      }
    }
    throw new Error('Alert rule not found')
  }

  // Dashboard Management
  async createDashboard(dashboard: Omit<MonitoringDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<MonitoringDashboard> {
    const newDashboard: MonitoringDashboard = {
      id: this.generateId(),
      ...dashboard,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.dashboards.has(dashboard.tenantId)) {
      this.dashboards.set(dashboard.tenantId, [])
    }

    this.dashboards.get(dashboard.tenantId)!.push(newDashboard)
    return newDashboard
  }

  async getDashboards(tenantId: string): Promise<MonitoringDashboard[]> {
    return this.dashboards.get(tenantId) || []
  }

  async updateDashboard(dashboardId: string, updates: Partial<MonitoringDashboard>): Promise<MonitoringDashboard> {
    for (const [tenantId, dashboards] of this.dashboards.entries()) {
      const dashboardIndex = dashboards.findIndex(d => d.id === dashboardId)
      if (dashboardIndex !== -1) {
        dashboards[dashboardIndex] = { ...dashboards[dashboardIndex], ...updates, updatedAt: new Date() }
        return dashboards[dashboardIndex]
      }
    }
    throw new Error('Dashboard not found')
  }

  // Health Check Management
  async createHealthCheck(healthCheck: Omit<HealthCheck, 'id' | 'status' | 'lastCheck'>): Promise<HealthCheck> {
    const newHealthCheck: HealthCheck = {
      id: this.generateId(),
      ...healthCheck,
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0
    }

    if (!this.healthChecks.has(healthCheck.tenantId)) {
      this.healthChecks.set(healthCheck.tenantId, [])
    }

    this.healthChecks.get(healthCheck.tenantId)!.push(newHealthCheck)
    return newHealthCheck
  }

  async getHealthChecks(tenantId: string): Promise<HealthCheck[]> {
    return this.healthChecks.get(tenantId) || []
  }

  async runHealthCheck(healthCheckId: string): Promise<HealthCheck> {
    for (const [tenantId, checks] of this.healthChecks.entries()) {
      const checkIndex = checks.findIndex(c => c.id === healthCheckId)
      if (checkIndex !== -1) {
        const check = checks[checkIndex]
        const result = await this.performHealthCheck(check)
        checks[checkIndex] = result
        return result
      }
    }
    throw new Error('Health check not found')
  }

  // Setup Monitoring
  async setupMonitoring(tenantId: string, config: YAMLConfig): Promise<void> {
    try {
      console.log(`Setting up monitoring for tenant: ${tenantId}`)

      // Create default metrics
      await this.setupDefaultMetrics(tenantId)

      // Create default alert rules
      await this.setupDefaultAlertRules(tenantId)

      // Create default dashboard
      await this.setupDefaultDashboard(tenantId)

      // Setup health checks
      await this.setupHealthChecks(tenantId)

      console.log(`✅ Monitoring setup completed for tenant: ${tenantId}`)

    } catch (error) {
      console.error(`❌ Monitoring setup failed: ${error}`)
      throw error
    }
  }

  private async setupDefaultMetrics(tenantId: string): Promise<void> {
    const defaultMetrics = [
      { name: 'api_requests_total', unit: 'count', description: 'Total API requests' },
      { name: 'api_response_time', unit: 'ms', description: 'API response time' },
      { name: 'database_connections', unit: 'count', description: 'Active database connections' },
      { name: 'memory_usage', unit: 'bytes', description: 'Memory usage' },
      { name: 'cpu_usage', unit: 'percent', description: 'CPU usage' },
      { name: 'disk_usage', unit: 'bytes', description: 'Disk usage' },
      { name: 'error_rate', unit: 'percent', description: 'Error rate' },
      { name: 'user_sessions', unit: 'count', description: 'Active user sessions' }
    ]

    for (const metric of defaultMetrics) {
      await this.recordMetric(tenantId, {
        tenantId,
        name: metric.name,
        value: 0,
        unit: metric.unit,
        tags: { description: metric.description },
        metadata: { default: true }
      })
    }
  }

  private async setupDefaultAlertRules(tenantId: string): Promise<void> {
    const defaultRules = [
      {
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds 5%',
        metric: 'error_rate',
        condition: 'greater_than' as const,
        threshold: 5,
        duration: 300, // 5 minutes
        severity: 'high' as const,
        enabled: true,
        actions: ['email_admin', 'slack_notification']
      },
      {
        name: 'High Response Time',
        description: 'Alert when API response time exceeds 2 seconds',
        metric: 'api_response_time',
        condition: 'greater_than' as const,
        threshold: 2000,
        duration: 60, // 1 minute
        severity: 'medium' as const,
        enabled: true,
        actions: ['email_admin']
      },
      {
        name: 'High Memory Usage',
        description: 'Alert when memory usage exceeds 80%',
        metric: 'memory_usage',
        condition: 'greater_than' as const,
        threshold: 80,
        duration: 300, // 5 minutes
        severity: 'high' as const,
        enabled: true,
        actions: ['email_admin', 'slack_notification']
      }
    ]

    for (const rule of defaultRules) {
      await this.createAlertRule({
        tenantId,
        ...rule
      })
    }
  }

  private async setupDefaultDashboard(tenantId: string): Promise<void> {
    const dashboard = await this.createDashboard({
      tenantId,
      name: 'System Overview',
      description: 'Default system monitoring dashboard',
      refreshInterval: 30,
      panels: [
        {
          id: this.generateId(),
          title: 'API Requests',
          type: 'graph',
          metrics: ['api_requests_total'],
          query: 'SELECT sum(value) FROM metrics WHERE name="api_requests_total" GROUP BY time(1m)',
          position: { x: 0, y: 0, width: 6, height: 4 },
          options: { type: 'line' }
        },
        {
          id: this.generateId(),
          title: 'Response Time',
          type: 'graph',
          metrics: ['api_response_time'],
          query: 'SELECT avg(value) FROM metrics WHERE name="api_response_time" GROUP BY time(1m)',
          position: { x: 6, y: 0, width: 6, height: 4 },
          options: { type: 'line' }
        },
        {
          id: this.generateId(),
          title: 'Error Rate',
          type: 'gauge',
          metrics: ['error_rate'],
          query: 'SELECT last(value) FROM metrics WHERE name="error_rate"',
          position: { x: 0, y: 4, width: 4, height: 3 },
          options: { min: 0, max: 100, thresholds: [5, 10] }
        },
        {
          id: this.generateId(),
          title: 'Memory Usage',
          type: 'gauge',
          metrics: ['memory_usage'],
          query: 'SELECT last(value) FROM metrics WHERE name="memory_usage"',
          position: { x: 4, y: 4, width: 4, height: 3 },
          options: { min: 0, max: 100, thresholds: [70, 90] }
        },
        {
          id: this.generateId(),
          title: 'Active Sessions',
          type: 'stat',
          metrics: ['user_sessions'],
          query: 'SELECT last(value) FROM metrics WHERE name="user_sessions"',
          position: { x: 8, y: 4, width: 4, height: 3 },
          options: { colorMode: 'value' }
        }
      ]
    })
  }

  private async setupHealthChecks(tenantId: string): Promise<void> {
    const defaultHealthChecks = [
      {
        name: 'API Health Check',
        type: 'http' as const,
        config: {
          url: `https://api.${tenantId}.opsai.com/health`,
          method: 'GET',
          timeout: 5000,
          expectedStatus: 200
        }
      },
      {
        name: 'Database Health Check',
        type: 'database' as const,
        config: {
          query: 'SELECT 1',
          timeout: 3000
        }
      }
    ]

    for (const check of defaultHealthChecks) {
      await this.createHealthCheck({
        tenantId,
        ...check
      })
    }
  }

  // Alert Rule Checking
  private async checkAlertRules(tenantId: string, metric: Metric): Promise<void> {
    const rules = this.alertRules.get(tenantId) || []
    
    for (const rule of rules) {
      if (!rule.enabled || rule.metric !== metric.name) continue

      const isTriggered = await this.evaluateAlertRule(rule, metric)
      
      if (isTriggered) {
        await this.triggerAlert(rule, metric)
      }
    }
  }

  private async evaluateAlertRule(rule: AlertRule, metric: Metric): Promise<boolean> {
    // Get recent metrics for the duration window
    const startTime = new Date(Date.now() - rule.duration * 1000)
    const recentMetrics = await this.getMetrics(rule.tenantId, `name="${rule.metric}"`, {
      start: startTime,
      end: new Date()
    })

    if (recentMetrics.length === 0) return false

    // Calculate aggregated value based on condition
    let aggregatedValue: number
    switch (rule.condition) {
      case 'greater_than':
      case 'less_than':
        aggregatedValue = Math.max(...recentMetrics.map(m => m.value))
        break
      case 'equals':
      case 'not_equals':
        aggregatedValue = recentMetrics[recentMetrics.length - 1].value
        break
      default:
        aggregatedValue = recentMetrics[recentMetrics.length - 1].value
    }

    // Check condition
    switch (rule.condition) {
      case 'greater_than':
        return aggregatedValue > rule.threshold
      case 'less_than':
        return aggregatedValue < rule.threshold
      case 'equals':
        return aggregatedValue === rule.threshold
      case 'not_equals':
        return aggregatedValue !== rule.threshold
      default:
        return false
    }
  }

  private async triggerAlert(rule: AlertRule, metric: Metric): Promise<void> {
    console.log(`🚨 Alert triggered: ${rule.name} - ${metric.name} = ${metric.value}`)

    // Execute alert actions
    for (const actionId of rule.actions) {
      await this.alertManager.executeAction(actionId, {
        rule,
        metric,
        tenantId: rule.tenantId,
        severity: rule.severity,
        timestamp: new Date()
      })
    }
  }

  // Health Check Execution
  private async performHealthCheck(check: HealthCheck): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      let isHealthy = false

      switch (check.type) {
        case 'http':
          isHealthy = await this.performHttpHealthCheck(check.config)
          break
        case 'tcp':
          isHealthy = await this.performTcpHealthCheck(check.config)
          break
        case 'database':
          isHealthy = await this.performDatabaseHealthCheck(check.config)
          break
        case 'custom':
          isHealthy = await this.performCustomHealthCheck(check.config)
          break
        default:
          throw new Error(`Unknown health check type: ${check.type}`)
      }

      return {
        ...check,
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: isHealthy ? undefined : 'Health check failed'
      }

    } catch (error) {
      return {
        ...check,
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async performHttpHealthCheck(config: any): Promise<boolean> {
    const response = await fetch(config.url, {
      method: config.method || 'GET',
      signal: AbortSignal.timeout(config.timeout || 5000)
    })

    return response.status === (config.expectedStatus || 200)
  }

  private async performTcpHealthCheck(config: any): Promise<boolean> {
    // TCP health check implementation
    console.log(`Performing TCP health check: ${config.host}:${config.port}`)
    return true
  }

  private async performDatabaseHealthCheck(config: any): Promise<boolean> {
    // Database health check implementation
    console.log(`Performing database health check: ${config.query}`)
    return true
  }

  private async performCustomHealthCheck(config: any): Promise<boolean> {
    // Custom health check implementation
    console.log(`Performing custom health check: ${config.script}`)
    return true
  }

  // Background Tasks
  private startMetricsCollection(): void {
    // Start collecting system metrics
    setInterval(() => {
      this.collectSystemMetrics()
    }, 60000) // Every minute
  }

  private startHealthCheckScheduler(): void {
    // Run health checks periodically
    setInterval(() => {
      this.runAllHealthChecks()
    }, 300000) // Every 5 minutes
  }

  private async collectSystemMetrics(): Promise<void> {
    // Collect system-level metrics
    const metrics = [
      { name: 'memory_usage', value: process.memoryUsage().heapUsed / 1024 / 1024 },
      { name: 'cpu_usage', value: process.cpuUsage().user / 1000000 },
      { name: 'uptime', value: process.uptime() }
    ]

    for (const metric of metrics) {
      // Record for all tenants or specific tenant
      await this.recordMetric('system', {
        tenantId: 'system',
        name: metric.name,
        value: metric.value,
        unit: metric.name === 'memory_usage' ? 'MB' : metric.name === 'cpu_usage' ? 'ms' : 'seconds',
        tags: { source: 'system' }
      })
    }
  }

  private async runAllHealthChecks(): Promise<void> {
    for (const [tenantId, checks] of this.healthChecks.entries()) {
      for (const check of checks) {
        await this.runHealthCheck(check.id)
      }
    }
  }

  private async storeMetric(metric: Metric): Promise<void> {
    // Store metric in time-series database
    // This would integrate with InfluxDB, Prometheus, or similar
    console.log(`Storing metric: ${metric.name} = ${metric.value}`)
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
} 