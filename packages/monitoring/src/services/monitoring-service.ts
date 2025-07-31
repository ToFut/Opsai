import { prisma } from '@opsai/database'
import { CacheService } from '@opsai/performance'
import { SecurityService } from '@opsai/security'

export interface Metric {
  name: string
  value: number
  type: 'counter' | 'gauge' | 'histogram' | 'summary'
  labels: Record<string, string>
  timestamp: Date
  tenantId?: string
}

export interface Trace {
  id: string
  parentId?: string
  name: string
  startTime: Date
  endTime: Date
  duration: number
  status: 'success' | 'error' | 'timeout'
  tags: Record<string, string>
  logs: TraceLog[]
  tenantId?: string
}

export interface TraceLog {
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: any
}

export interface HealthCheck {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  message: string
  timestamp: Date
  duration: number
  details?: any
}

export interface Alert {
  id: string
  name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'resolved' | 'acknowledged'
  source: string
  metric?: string
  threshold?: number
  currentValue?: number
  tenantId?: string
  createdAt: Date
  resolvedAt?: Date
}

export interface MonitoringConfig {
  enableTracing: boolean
  enableMetrics: boolean
  enableHealthChecks: boolean
  enableAlerts: boolean
  samplingRate: number
  retentionDays: number
}

export class MonitoringService {
  private cacheService: CacheService
  private securityService: SecurityService
  private config: MonitoringConfig
  private metrics: Map<string, Metric[]>
  private traces: Map<string, Trace[]>
  private healthChecks: Map<string, HealthCheck[]>
  private alerts: Map<string, Alert[]>

  constructor(
    config: MonitoringConfig,
    cacheService: CacheService,
    securityService: SecurityService
  ) {
    this.config = config
    this.cacheService = cacheService
    this.securityService = securityService
    this.metrics = new Map()
    this.traces = new Map()
    this.healthChecks = new Map()
    this.alerts = new Map()
  }

  /**
   * Record metric
   */
  recordMetric(
    name: string,
    value: number,
    type: 'counter' | 'gauge' | 'histogram' | 'summary',
    labels: Record<string, string> = {},
    tenantId?: string
  ): void {
    if (!this.config.enableMetrics) return

    const metric: Metric = {
      name,
      value,
      type,
      labels,
      timestamp: new Date(),
      tenantId
    }

    const key = `${tenantId || 'global'}:${name}`
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    this.metrics.get(key)!.push(metric)

    // Store in cache for real-time access
    this.cacheService.set(`metric:${key}`, metric, { ttl: 300 })
  }

  /**
   * Start trace
   */
  startTrace(
    name: string,
    tags: Record<string, string> = {},
    tenantId?: string
  ): string {
    if (!this.config.enableTracing) return ''

    const traceId = this.generateTraceId()
    const trace: Trace = {
      id: traceId,
      name,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      status: 'success',
      tags,
      logs: [],
      tenantId
    }

    const key = `${tenantId || 'global'}:${traceId}`
    this.traces.set(key, [trace])

    return traceId
  }

  /**
   * End trace
   */
  endTrace(
    traceId: string,
    status: 'success' | 'error' | 'timeout' = 'success',
    tenantId?: string
  ): void {
    if (!this.config.enableTracing || !traceId) return

    const key = `${tenantId || 'global'}:${traceId}`
    const traces = this.traces.get(key)
    
    if (traces && traces.length > 0) {
      const trace = traces[0]
      trace.endTime = new Date()
      trace.duration = trace.endTime.getTime() - trace.startTime.getTime()
      trace.status = status

      // Store trace in database
      this.storeTrace(trace)
    }
  }

  /**
   * Add log to trace
   */
  addTraceLog(
    traceId: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any,
    tenantId?: string
  ): void {
    if (!this.config.enableTracing || !traceId) return

    const key = `${tenantId || 'global'}:${traceId}`
    const traces = this.traces.get(key)
    
    if (traces && traces.length > 0) {
      const trace = traces[0]
      trace.logs.push({
        timestamp: new Date(),
        level,
        message,
        data
      })
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck(name: string, check: () => Promise<boolean>): Promise<HealthCheck> {
    const startTime = Date.now()
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    let message = 'Health check passed'
    let details: any = {}

    try {
      const result = await check()
      if (!result) {
        status = 'unhealthy'
        message = 'Health check failed'
      }
    } catch (error) {
      status = 'unhealthy'
      message = `Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      details = { error: error instanceof Error ? error.stack : error }
    }

    const duration = Date.now() - startTime
    const healthCheck: HealthCheck = {
      name,
      status,
      message,
      timestamp: new Date(),
      duration,
      details
    }

    // Store health check
    if (!this.healthChecks.has(name)) {
      this.healthChecks.set(name, [])
    }
    this.healthChecks.get(name)!.push(healthCheck)

    // Check for alerts
    if (status === 'unhealthy') {
      await this.createAlert({
        name: `Health Check Failed: ${name}`,
        description: message,
        severity: 'high',
        source: 'health_check',
        metric: name,
        currentValue: duration,
        tenantId: undefined
      })
    }

    return healthCheck
  }

  /**
   * Create alert
   */
  async createAlert(alertData: Omit<Alert, 'id' | 'status' | 'createdAt'>): Promise<Alert> {
    if (!this.config.enableAlerts) {
      throw new Error('Alerts are not enabled')
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      ...alertData,
      status: 'active',
      createdAt: new Date()
    }

    // Store alert
    const key = `${alertData.tenantId || 'global'}:${alert.id}`
    this.alerts.set(key, [alert])

    // Store in database
    await this.storeAlert(alert)

    // Send notifications (would integrate with notification service)
    await this.sendAlertNotification(alert)

    return alert
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, tenantId?: string): Promise<void> {
    const key = `${tenantId || 'global'}:${alertId}`
    const alerts = this.alerts.get(key)
    
    if (alerts && alerts.length > 0) {
      const alert = alerts[0]
      alert.status = 'resolved'
      alert.resolvedAt = new Date()

      // Update in database
      await this.updateAlert(alert)
    }
  }

  /**
   * Get metrics
   */
  async getMetrics(
    name?: string,
    tenantId?: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<Metric[]> {
    try {
      const where: any = {}
      
      if (name) where.name = name
      if (tenantId) where.tenantId = tenantId
      if (startTime || endTime) {
        where.timestamp = {}
        if (startTime) where.timestamp.gte = startTime
        if (endTime) where.timestamp.lte = endTime
      }

      const metrics = await prisma.metric.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 1000
      })

      return metrics
    } catch (error) {
      console.error('Get metrics error:', error)
      return []
    }
  }

  /**
   * Get traces
   */
  async getTraces(
    name?: string,
    tenantId?: string,
    startTime?: Date,
    endTime?: Date,
    status?: string
  ): Promise<Trace[]> {
    try {
      const where: any = {}
      
      if (name) where.name = name
      if (tenantId) where.tenantId = tenantId
      if (status) where.status = status
      if (startTime || endTime) {
        where.startTime = {}
        if (startTime) where.startTime.gte = startTime
        if (endTime) where.startTime.lte = endTime
      }

      const traces = await prisma.trace.findMany({
        where,
        orderBy: { startTime: 'desc' },
        take: 100
      })

      return traces
    } catch (error) {
      console.error('Get traces error:', error)
      return []
    }
  }

  /**
   * Get health checks
   */
  async getHealthChecks(name?: string, limit: number = 50): Promise<HealthCheck[]> {
    try {
      const where: any = {}
      if (name) where.name = name

      const healthChecks = await prisma.healthCheck.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit
      })

      return healthChecks
    } catch (error) {
      console.error('Get health checks error:', error)
      return []
    }
  }

  /**
   * Get alerts
   */
  async getAlerts(
    tenantId?: string,
    status?: string,
    severity?: string,
    limit: number = 50
  ): Promise<Alert[]> {
    try {
      const where: any = {}
      
      if (tenantId) where.tenantId = tenantId
      if (status) where.status = status
      if (severity) where.severity = severity

      const alerts = await prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return alerts
    } catch (error) {
      console.error('Get alerts error:', error)
      return []
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy'
    services: Array<{ name: string; status: string; lastCheck: Date }>
    metrics: { total: number; errors: number }
    alerts: { active: number; resolved: number }
  }> {
    try {
      // Get latest health checks
      const healthChecks = await this.getHealthChecks(undefined, 100)
      const latestChecks = healthChecks.reduce((acc, check) => {
        if (!acc[check.name] || acc[check.name].timestamp < check.timestamp) {
          acc[check.name] = check
        }
        return acc
      }, {} as Record<string, HealthCheck>)

      // Calculate overall status
      const statuses = Object.values(latestChecks).map(check => check.status)
      let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      
      if (statuses.includes('unhealthy')) {
        overall = 'unhealthy'
      } else if (statuses.includes('degraded')) {
        overall = 'degraded'
      }

      // Get alert counts
      const alerts = await this.getAlerts(undefined, undefined, undefined, 1000)
      const activeAlerts = alerts.filter(alert => alert.status === 'active')
      const resolvedAlerts = alerts.filter(alert => alert.status === 'resolved')

      // Get metric counts
      const metrics = await this.getMetrics(undefined, undefined, new Date(Date.now() - 24 * 60 * 60 * 1000))
      const errorMetrics = metrics.filter(metric => metric.labels.error === 'true')

      return {
        overall,
        services: Object.values(latestChecks).map(check => ({
          name: check.name,
          status: check.status,
          lastCheck: check.timestamp
        })),
        metrics: {
          total: metrics.length,
          errors: errorMetrics.length
        },
        alerts: {
          active: activeAlerts.length,
          resolved: resolvedAlerts.length
        }
      }
    } catch (error) {
      console.error('Get system status error:', error)
      return {
        overall: 'unhealthy',
        services: [],
        metrics: { total: 0, errors: 0 },
        alerts: { active: 0, resolved: 0 }
      }
    }
  }

  /**
   * Export monitoring data
   */
  async exportMonitoringData(
    type: 'metrics' | 'traces' | 'alerts',
    format: 'json' | 'csv',
    filters: any = {}
  ): Promise<{ data: string; filename: string }> {
    try {
      let data: any[] = []

      switch (type) {
        case 'metrics':
          data = await this.getMetrics(filters.name, filters.tenantId, filters.startTime, filters.endTime)
          break
        case 'traces':
          data = await this.getTraces(filters.name, filters.tenantId, filters.startTime, filters.endTime, filters.status)
          break
        case 'alerts':
          data = await this.getAlerts(filters.tenantId, filters.status, filters.severity)
          break
      }

      if (format === 'csv') {
        const csv = this.convertToCSV(data)
        return {
          data: csv,
          filename: `${type}_export_${Date.now()}.csv`
        }
      } else {
        return {
          data: JSON.stringify(data, null, 2),
          filename: `${type}_export_${Date.now()}.json`
        }
      }
    } catch (error) {
      console.error('Export monitoring data error:', error)
      throw new Error('Failed to export monitoring data')
    }
  }

  /**
   * Helper methods
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async storeTrace(trace: Trace): Promise<void> {
    try {
      await prisma.trace.create({
        data: {
          id: trace.id,
          parentId: trace.parentId,
          name: trace.name,
          startTime: trace.startTime,
          endTime: trace.endTime,
          duration: trace.duration,
          status: trace.status,
          tags: trace.tags,
          logs: trace.logs,
          tenantId: trace.tenantId
        }
      })
    } catch (error) {
      console.error('Store trace error:', error)
    }
  }

  private async storeAlert(alert: Alert): Promise<void> {
    try {
      await prisma.alert.create({
        data: {
          id: alert.id,
          name: alert.name,
          description: alert.description,
          severity: alert.severity,
          status: alert.status,
          source: alert.source,
          metric: alert.metric,
          threshold: alert.threshold,
          currentValue: alert.currentValue,
          tenantId: alert.tenantId,
          createdAt: alert.createdAt,
          resolvedAt: alert.resolvedAt
        }
      })
    } catch (error) {
      console.error('Store alert error:', error)
    }
  }

  private async updateAlert(alert: Alert): Promise<void> {
    try {
      await prisma.alert.update({
        where: { id: alert.id },
        data: {
          status: alert.status,
          resolvedAt: alert.resolvedAt
        }
      })
    } catch (error) {
      console.error('Update alert error:', error)
    }
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    // This would integrate with notification service
    console.log(`Alert notification: ${alert.name} - ${alert.description}`)
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const rows = data.map(item => headers.map(header => {
      const value = item[header]
      return typeof value === 'string' ? `"${value}"` : value
    }))

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }
} 