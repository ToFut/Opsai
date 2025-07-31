import { prisma } from '@opsai/database'
import { createClient } from '@supabase/supabase-js'
import { io, Socket } from 'socket.io-client'

export interface DashboardData {
  id: string
  tenantId: string
  name: string
  type: 'overview' | 'analytics' | 'activity' | 'custom'
  config: DashboardConfig
  data: any
  lastUpdated: Date
}

export interface DashboardConfig {
  refreshInterval: number // in seconds
  dataSources: DataSource[]
  charts: ChartConfig[]
  filters: FilterConfig[]
  permissions: string[]
}

export interface DataSource {
  id: string
  type: 'database' | 'api' | 'file' | 'integration'
  config: {
    table?: string
    query?: string
    endpoint?: string
    fileId?: string
    integrationId?: string
  }
  transformations: DataTransformation[]
}

export interface DataTransformation {
  type: 'filter' | 'sort' | 'aggregate' | 'join' | 'map'
  config: any
}

export interface ChartConfig {
  id: string
  type: 'line' | 'bar' | 'pie' | 'table' | 'gauge' | 'heatmap'
  dataSource: string
  config: {
    xAxis?: string
    yAxis?: string
    series?: string[]
    colors?: string[]
    options?: any
  }
}

export interface FilterConfig {
  id: string
  field: string
  type: 'date' | 'select' | 'text' | 'number' | 'boolean'
  defaultValue?: any
  options?: any[]
}

export interface RealTimeConfig {
  enabled: boolean
  channels: string[]
  events: string[]
}

export class DashboardDataService {
  private supabase: any
  private socket: Socket | null = null
  private cache: Map<string, { data: any; timestamp: Date; ttl: number }> = new Map()

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )
  }

  /**
   * Get dashboard data with caching and real-time updates
   */
  async getDashboardData(
    dashboardId: string,
    tenantId: string,
    filters?: Record<string, any>
  ): Promise<DashboardData> {
    try {
      // Check cache first
      const cacheKey = `${dashboardId}:${tenantId}:${JSON.stringify(filters)}`
      const cached = this.cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl * 1000) {
        return cached.data
      }

      // Get dashboard configuration
      const dashboard = await prisma.dashboard.findFirst({
        where: { id: dashboardId, tenantId }
      })

      if (!dashboard) {
        throw new Error('Dashboard not found')
      }

      // Fetch data from all sources
      const data = await this.fetchDataFromSources(dashboard.config.dataSources, filters)

      // Apply transformations
      const transformedData = await this.applyTransformations(data, dashboard.config.dataSources)

      // Generate charts data
      const chartsData = await this.generateChartsData(transformedData, dashboard.config.charts)

      const result: DashboardData = {
        id: dashboard.id,
        tenantId: dashboard.tenantId,
        name: dashboard.name,
        type: dashboard.type as any,
        config: dashboard.config as any,
        data: {
          raw: transformedData,
          charts: chartsData,
          summary: this.generateSummary(transformedData)
        },
        lastUpdated: new Date()
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: new Date(),
        ttl: dashboard.config.refreshInterval || 300 // 5 minutes default
      })

      return result
    } catch (error) {
      console.error('Get dashboard data error:', error)
      throw new Error('Failed to get dashboard data')
    }
  }

  /**
   * Fetch data from multiple sources
   */
  private async fetchDataFromSources(
    dataSources: DataSource[],
    filters?: Record<string, any>
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {}

    for (const source of dataSources) {
      try {
        switch (source.type) {
          case 'database':
            results[source.id] = await this.fetchFromDatabase(source, filters)
            break
          case 'api':
            results[source.id] = await this.fetchFromAPI(source, filters)
            break
          case 'file':
            results[source.id] = await this.fetchFromFile(source, filters)
            break
          case 'integration':
            results[source.id] = await this.fetchFromIntegration(source, filters)
            break
        }
      } catch (error) {
        console.error(`Error fetching from source ${source.id}:`, error)
        results[source.id] = { error: 'Failed to fetch data' }
      }
    }

    return results
  }

  /**
   * Fetch data from database
   */
  private async fetchFromDatabase(source: DataSource, filters?: Record<string, any>): Promise<any> {
    const { table, query } = source.config

    if (query) {
      // Execute custom query
      return await prisma.$queryRawUnsafe(query)
    } else if (table) {
      // Build dynamic query based on table
      const whereClause: any = {}
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            whereClause[key] = value
          }
        })
      }

      // Use dynamic table access (this is a simplified approach)
      const model = this.getModelFromTable(table)
      if (model) {
        return await model.findMany({ where: whereClause })
      }
    }

    throw new Error('Invalid database source configuration')
  }

  /**
   * Fetch data from API
   */
  private async fetchFromAPI(source: DataSource, filters?: Record<string, any>): Promise<any> {
    const { endpoint } = source.config

    if (!endpoint) {
      throw new Error('API endpoint not configured')
    }

    const url = new URL(endpoint)
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Fetch data from file
   */
  private async fetchFromFile(source: DataSource, filters?: Record<string, any>): Promise<any> {
    const { fileId } = source.config

    if (!fileId) {
      throw new Error('File ID not configured')
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      throw new Error('File not found')
    }

    // Return file metadata and extracted data
    return {
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: file.createdAt
      },
      extractedData: file.metadata?.extractedData,
      ocrText: file.metadata?.ocrText
    }
  }

  /**
   * Fetch data from integration
   */
  private async fetchFromIntegration(source: DataSource, filters?: Record<string, any>): Promise<any> {
    const { integrationId } = source.config

    if (!integrationId) {
      throw new Error('Integration ID not configured')
    }

    // This would integrate with the integration service
    // For now, return mock data
    return {
      integrationId,
      data: [],
      lastSync: new Date()
    }
  }

  /**
   * Apply data transformations
   */
  private async applyTransformations(
    data: Record<string, any>,
    dataSources: DataSource[]
  ): Promise<Record<string, any>> {
    const transformed: Record<string, any> = {}

    for (const source of dataSources) {
      let sourceData = data[source.id]

      for (const transformation of source.transformations) {
        sourceData = this.applyTransformation(sourceData, transformation)
      }

      transformed[source.id] = sourceData
    }

    return transformed
  }

  /**
   * Apply single transformation
   */
  private applyTransformation(data: any, transformation: DataTransformation): any {
    switch (transformation.type) {
      case 'filter':
        return this.filterData(data, transformation.config)
      case 'sort':
        return this.sortData(data, transformation.config)
      case 'aggregate':
        return this.aggregateData(data, transformation.config)
      case 'join':
        return this.joinData(data, transformation.config)
      case 'map':
        return this.mapData(data, transformation.config)
      default:
        return data
    }
  }

  /**
   * Filter data
   */
  private filterData(data: any[], config: any): any[] {
    if (!Array.isArray(data)) return data

    return data.filter(item => {
      for (const [field, condition] of Object.entries(config)) {
        const value = item[field]
        
        if (typeof condition === 'object') {
          if (condition.operator === 'equals' && value !== condition.value) return false
          if (condition.operator === 'not_equals' && value === condition.value) return false
          if (condition.operator === 'greater_than' && value <= condition.value) return false
          if (condition.operator === 'less_than' && value >= condition.value) return false
          if (condition.operator === 'contains' && !String(value).includes(condition.value)) return false
        } else {
          if (value !== condition) return false
        }
      }
      return true
    })
  }

  /**
   * Sort data
   */
  private sortData(data: any[], config: any): any[] {
    if (!Array.isArray(data)) return data

    return data.sort((a, b) => {
      for (const { field, direction } of config) {
        const aVal = a[field]
        const bVal = b[field]
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1
        if (aVal > bVal) return direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  /**
   * Aggregate data
   */
  private aggregateData(data: any[], config: any): any {
    if (!Array.isArray(data)) return data

    const result: any = {}

    for (const { field, operation, alias } of config) {
      const values = data.map(item => item[field]).filter(v => v !== undefined && v !== null)
      
      switch (operation) {
        case 'sum':
          result[alias || field] = values.reduce((sum, val) => sum + Number(val), 0)
          break
        case 'avg':
          result[alias || field] = values.reduce((sum, val) => sum + Number(val), 0) / values.length
          break
        case 'count':
          result[alias || field] = values.length
          break
        case 'min':
          result[alias || field] = Math.min(...values.map(v => Number(v)))
          break
        case 'max':
          result[alias || field] = Math.max(...values.map(v => Number(v)))
          break
      }
    }

    return result
  }

  /**
   * Join data
   */
  private joinData(data: any[], config: any): any[] {
    // Implement data joining logic
    return data
  }

  /**
   * Map data
   */
  private mapData(data: any[], config: any): any[] {
    if (!Array.isArray(data)) return data

    return data.map(item => {
      const mapped: any = {}
      for (const [newField, expression] of Object.entries(config)) {
        if (typeof expression === 'string') {
          mapped[newField] = item[expression]
        } else if (typeof expression === 'function') {
          mapped[newField] = expression(item)
        }
      }
      return mapped
    })
  }

  /**
   * Generate charts data
   */
  private async generateChartsData(
    data: Record<string, any>,
    charts: ChartConfig[]
  ): Promise<Record<string, any>> {
    const chartsData: Record<string, any> = {}

    for (const chart of charts) {
      const sourceData = data[chart.dataSource]
      
      if (!sourceData) {
        chartsData[chart.id] = { error: 'Data source not found' }
        continue
      }

      chartsData[chart.id] = this.generateChartData(sourceData, chart)
    }

    return chartsData
  }

  /**
   * Generate single chart data
   */
  private generateChartData(data: any, chart: ChartConfig): any {
    switch (chart.type) {
      case 'line':
        return this.generateLineChartData(data, chart.config)
      case 'bar':
        return this.generateBarChartData(data, chart.config)
      case 'pie':
        return this.generatePieChartData(data, chart.config)
      case 'table':
        return this.generateTableData(data, chart.config)
      case 'gauge':
        return this.generateGaugeData(data, chart.config)
      case 'heatmap':
        return this.generateHeatmapData(data, chart.config)
      default:
        return data
    }
  }

  /**
   * Generate line chart data
   */
  private generateLineChartData(data: any[], config: any): any {
    if (!Array.isArray(data)) return { labels: [], datasets: [] }

    const labels = data.map(item => item[config.xAxis || 'date'])
    const datasets = (config.series || []).map((series: string, index: number) => ({
      label: series,
      data: data.map(item => item[series]),
      borderColor: config.colors?.[index] || `hsl(${index * 60}, 70%, 50%)`,
      backgroundColor: config.colors?.[index] || `hsla(${index * 60}, 70%, 50%, 0.1)`
    }))

    return { labels, datasets }
  }

  /**
   * Generate bar chart data
   */
  private generateBarChartData(data: any[], config: any): any {
    if (!Array.isArray(data)) return { labels: [], datasets: [] }

    const labels = data.map(item => item[config.xAxis || 'category'])
    const datasets = (config.series || []).map((series: string, index: number) => ({
      label: series,
      data: data.map(item => item[series]),
      backgroundColor: config.colors?.[index] || `hsl(${index * 60}, 70%, 50%)`
    }))

    return { labels, datasets }
  }

  /**
   * Generate pie chart data
   */
  private generatePieChartData(data: any[], config: any): any {
    if (!Array.isArray(data)) return { labels: [], datasets: [] }

    const labels = data.map(item => item[config.xAxis || 'label'])
    const values = data.map(item => item[config.yAxis || 'value'])

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: config.colors || labels.map((_, i) => `hsl(${i * 360 / labels.length}, 70%, 50%)`)
      }]
    }
  }

  /**
   * Generate table data
   */
  private generateTableData(data: any[], config: any): any {
    if (!Array.isArray(data)) return { columns: [], rows: [] }

    const columns = config.columns || Object.keys(data[0] || {})
    const rows = data.map(item => columns.map(col => item[col]))

    return { columns, rows }
  }

  /**
   * Generate gauge data
   */
  private generateGaugeData(data: any, config: any): any {
    const value = Array.isArray(data) ? data[0]?.[config.value] : data[config.value]
    const max = config.max || 100
    const min = config.min || 0

    return {
      value: Number(value) || 0,
      max,
      min,
      percentage: ((Number(value) - min) / (max - min)) * 100
    }
  }

  /**
   * Generate heatmap data
   */
  private generateHeatmapData(data: any[], config: any): any {
    // Implement heatmap data generation
    return data
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(data: Record<string, any>): any {
    const summary: any = {}

    for (const [sourceId, sourceData] of Object.entries(data)) {
      if (Array.isArray(sourceData)) {
        summary[sourceId] = {
          count: sourceData.length,
          total: sourceData.reduce((sum, item) => sum + (item.amount || 0), 0),
          average: sourceData.length > 0 ? sourceData.reduce((sum, item) => sum + (item.amount || 0), 0) / sourceData.length : 0
        }
      } else if (typeof sourceData === 'object') {
        summary[sourceId] = sourceData
      }
    }

    return summary
  }

  /**
   * Setup real-time updates
   */
  async setupRealTimeUpdates(
    dashboardId: string,
    tenantId: string,
    config: RealTimeConfig,
    callback: (data: any) => void
  ): Promise<void> {
    if (!config.enabled) return

    // Connect to WebSocket
    this.socket = io(process.env.WEBSOCKET_URL || 'ws://localhost:3001')

    // Subscribe to channels
    for (const channel of config.channels) {
      this.socket.emit('subscribe', { channel, tenantId })
    }

    // Listen for events
    for (const event of config.events) {
      this.socket.on(event, (data) => {
        // Invalidate cache
        this.invalidateCache(dashboardId, tenantId)
        
        // Call callback with updated data
        callback(data)
      })
    }
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(dashboardId: string, tenantId: string): void {
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${dashboardId}:${tenantId}:`)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Get model from table name (simplified)
   */
  private getModelFromTable(table: string): any {
    // This is a simplified approach - in production you'd have proper model mapping
    const modelMap: Record<string, any> = {
      'users': prisma.user,
      'files': prisma.file,
      'sessions': prisma.session
    }

    return modelMap[table]
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.cache.clear()
  }
} 