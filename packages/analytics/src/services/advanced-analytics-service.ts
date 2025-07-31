import { prisma } from '@opsai/database'
import { DashboardDataService } from '@opsai/dashboard'

export interface AnalyticsQuery {
  id: string
  name: string
  description: string
  tenantId: string
  type: 'sql' | 'aggregation' | 'pipeline'
  query: string
  parameters: Record<string, any>
  schedule?: string
  createdAt: Date
  updatedAt: Date
}

export interface AnalyticsReport {
  id: string
  name: string
  description: string
  tenantId: string
  type: 'dashboard' | 'table' | 'chart' | 'export'
  config: ReportConfig
  data: any
  lastGenerated: Date
  schedule?: string
  recipients: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ReportConfig {
  queries: string[]
  visualizations: VisualizationConfig[]
  filters: FilterConfig[]
  exportFormats: string[]
  refreshInterval: number
}

export interface VisualizationConfig {
  id: string
  type: 'line' | 'bar' | 'pie' | 'table' | 'heatmap' | 'scatter' | 'gauge' | 'funnel'
  title: string
  dataSource: string
  config: any
  position: { x: number; y: number; width: number; height: number }
}

export interface FilterConfig {
  id: string
  name: string
  type: 'date' | 'select' | 'text' | 'number' | 'boolean'
  field: string
  defaultValue?: any
  options?: any[]
}

export interface BusinessMetric {
  id: string
  name: string
  description: string
  category: string
  calculation: string
  unit: string
  target?: number
  current: number
  trend: 'up' | 'down' | 'stable'
  change: number
  lastUpdated: Date
}

export interface PredictiveModel {
  id: string
  name: string
  description: string
  type: 'regression' | 'classification' | 'forecasting' | 'anomaly'
  status: 'training' | 'ready' | 'failed'
  accuracy: number
  lastTrained: Date
  config: ModelConfig
}

export interface ModelConfig {
  algorithm: string
  features: string[]
  target: string
  parameters: Record<string, any>
  trainingData: string
  validationSplit: number
}

export interface DataInsight {
  id: string
  type: 'trend' | 'anomaly' | 'correlation' | 'forecast' | 'recommendation'
  title: string
  description: string
  confidence: number
  data: any
  actionable: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
}

export class AdvancedAnalyticsService {
  private dashboardService: DashboardDataService

  constructor() {
    this.dashboardService = new DashboardDataService()
  }

  /**
   * Create analytics query
   */
  async createQuery(
    name: string,
    description: string,
    tenantId: string,
    type: string,
    query: string,
    parameters: Record<string, any> = {}
  ): Promise<AnalyticsQuery> {
    try {
      const analyticsQuery = await prisma.analyticsQuery.create({
        data: {
          name,
          description,
          tenantId,
          type: type as any,
          query,
          parameters,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return this.mapQueryToAnalyticsQuery(analyticsQuery)
    } catch (error) {
      console.error('Create analytics query error:', error)
      throw new Error('Failed to create analytics query')
    }
  }

  /**
   * Execute analytics query
   */
  async executeQuery(queryId: string, parameters: Record<string, any> = {}): Promise<any> {
    try {
      const query = await prisma.analyticsQuery.findUnique({
        where: { id: queryId }
      })

      if (!query) {
        throw new Error('Query not found')
      }

      switch (query.type) {
        case 'sql':
          return await this.executeSQLQuery(query.query, parameters)
        case 'aggregation':
          return await this.executeAggregationQuery(query.query, parameters)
        case 'pipeline':
          return await this.executePipelineQuery(query.query, parameters)
        default:
          throw new Error(`Unsupported query type: ${query.type}`)
      }
    } catch (error) {
      console.error('Execute query error:', error)
      throw new Error('Failed to execute query')
    }
  }

  /**
   * Execute SQL query
   */
  private async executeSQLQuery(query: string, parameters: Record<string, any>): Promise<any> {
    try {
      // Replace parameters in query
      let processedQuery = query
      for (const [key, value] of Object.entries(parameters)) {
        const placeholder = `:${key}`
        if (typeof value === 'string') {
          processedQuery = processedQuery.replace(new RegExp(placeholder, 'g'), `'${value}'`)
        } else {
          processedQuery = processedQuery.replace(new RegExp(placeholder, 'g'), String(value))
        }
      }

      // Execute query
      const result = await prisma.$queryRawUnsafe(processedQuery)
      return result
    } catch (error) {
      console.error('SQL query execution error:', error)
      throw new Error('SQL query execution failed')
    }
  }

  /**
   * Execute aggregation query
   */
  private async executeAggregationQuery(query: string, parameters: Record<string, any>): Promise<any> {
    try {
      const config = JSON.parse(query)
      const { table, aggregations, groupBy, filters } = config

      // Build aggregation query
      const selectClause = aggregations.map((agg: any) => {
        const func = agg.function.toUpperCase()
        const field = agg.field
        const alias = agg.alias || `${func}_${field}`
        return `${func}(${field}) as ${alias}`
      }).join(', ')

      let sqlQuery = `SELECT ${selectClause}`
      if (groupBy && groupBy.length > 0) {
        sqlQuery += `, ${groupBy.join(', ')}`
      }
      sqlQuery += ` FROM ${table}`

      if (filters && filters.length > 0) {
        const whereClause = filters.map((filter: any) => {
          const { field, operator, value } = filter
          return `${field} ${operator} ${typeof value === 'string' ? `'${value}'` : value}`
        }).join(' AND ')
        sqlQuery += ` WHERE ${whereClause}`
      }

      if (groupBy && groupBy.length > 0) {
        sqlQuery += ` GROUP BY ${groupBy.join(', ')}`
      }

      // Apply parameters
      for (const [key, value] of Object.entries(parameters)) {
        sqlQuery = sqlQuery.replace(new RegExp(`:${key}`, 'g'), String(value))
      }

      const result = await prisma.$queryRawUnsafe(sqlQuery)
      return result
    } catch (error) {
      console.error('Aggregation query execution error:', error)
      throw new Error('Aggregation query execution failed')
    }
  }

  /**
   * Execute pipeline query
   */
  private async executePipelineQuery(query: string, parameters: Record<string, any>): Promise<any> {
    try {
      const pipeline = JSON.parse(query)
      let data = await this.getPipelineData(pipeline.source, parameters)

      for (const step of pipeline.steps) {
        data = await this.executePipelineStep(step, data, parameters)
      }

      return data
    } catch (error) {
      console.error('Pipeline query execution error:', error)
      throw new Error('Pipeline query execution failed')
    }
  }

  /**
   * Get pipeline data
   */
  private async getPipelineData(source: any, parameters: Record<string, any>): Promise<any> {
    switch (source.type) {
      case 'table':
        return await prisma[source.name].findMany({
          where: source.filters ? this.buildWhereClause(source.filters, parameters) : undefined
        })
      case 'query':
        return await this.executeQuery(source.queryId, parameters)
      case 'api':
        return await this.fetchAPIData(source.endpoint, parameters)
      default:
        throw new Error(`Unsupported pipeline source: ${source.type}`)
    }
  }

  /**
   * Execute pipeline step
   */
  private async executePipelineStep(step: any, data: any, parameters: Record<string, any>): Promise<any> {
    switch (step.type) {
      case 'filter':
        return this.filterData(data, step.conditions, parameters)
      case 'transform':
        return this.transformData(data, step.transformations, parameters)
      case 'aggregate':
        return this.aggregateData(data, step.aggregations, parameters)
      case 'join':
        return await this.joinData(data, step.joinConfig, parameters)
      case 'sort':
        return this.sortData(data, step.sortConfig)
      case 'limit':
        return data.slice(0, step.limit)
      default:
        throw new Error(`Unsupported pipeline step: ${step.type}`)
    }
  }

  /**
   * Create analytics report
   */
  async createReport(
    name: string,
    description: string,
    tenantId: string,
    type: string,
    config: ReportConfig
  ): Promise<AnalyticsReport> {
    try {
      const report = await prisma.analyticsReport.create({
        data: {
          name,
          description,
          tenantId,
          type: type as any,
          config: config as any,
          data: {},
          lastGenerated: new Date(),
          recipients: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return this.mapReportToAnalyticsReport(report)
    } catch (error) {
      console.error('Create analytics report error:', error)
      throw new Error('Failed to create analytics report')
    }
  }

  /**
   * Generate report
   */
  async generateReport(reportId: string, parameters: Record<string, any> = {}): Promise<AnalyticsReport> {
    try {
      const report = await prisma.analyticsReport.findUnique({
        where: { id: reportId }
      })

      if (!report) {
        throw new Error('Report not found')
      }

      // Execute queries
      const queryResults: Record<string, any> = {}
      for (const queryId of report.config.queries) {
        queryResults[queryId] = await this.executeQuery(queryId, parameters)
      }

      // Generate visualizations
      const visualizations: Record<string, any> = {}
      for (const viz of report.config.visualizations) {
        const data = queryResults[viz.dataSource]
        visualizations[viz.id] = this.generateVisualization(data, viz)
      }

      // Update report
      const updatedReport = await prisma.analyticsReport.update({
        where: { id: reportId },
        data: {
          data: { queryResults, visualizations },
          lastGenerated: new Date(),
          updatedAt: new Date()
        }
      })

      return this.mapReportToAnalyticsReport(updatedReport)
    } catch (error) {
      console.error('Generate report error:', error)
      throw new Error('Failed to generate report')
    }
  }

  /**
   * Generate visualization
   */
  private generateVisualization(data: any, config: VisualizationConfig): any {
    switch (config.type) {
      case 'line':
        return this.generateLineChart(data, config.config)
      case 'bar':
        return this.generateBarChart(data, config.config)
      case 'pie':
        return this.generatePieChart(data, config.config)
      case 'table':
        return this.generateTable(data, config.config)
      case 'heatmap':
        return this.generateHeatmap(data, config.config)
      case 'scatter':
        return this.generateScatterPlot(data, config.config)
      case 'gauge':
        return this.generateGauge(data, config.config)
      case 'funnel':
        return this.generateFunnel(data, config.config)
      default:
        return data
    }
  }

  /**
   * Calculate business metrics
   */
  async calculateBusinessMetrics(tenantId: string): Promise<BusinessMetric[]> {
    try {
      const metrics: BusinessMetric[] = []

      // Revenue metrics
      const revenueData = await this.executeQuery('revenue_metrics', { tenantId })
      metrics.push({
        id: 'total_revenue',
        name: 'Total Revenue',
        description: 'Total revenue for the period',
        category: 'Revenue',
        calculation: 'SUM(amount)',
        unit: 'USD',
        current: revenueData.total || 0,
        trend: this.calculateTrend(revenueData.trend),
        change: revenueData.change || 0,
        lastUpdated: new Date()
      })

      // User metrics
      const userData = await this.executeQuery('user_metrics', { tenantId })
      metrics.push({
        id: 'active_users',
        name: 'Active Users',
        description: 'Number of active users',
        category: 'Users',
        calculation: 'COUNT(DISTINCT user_id)',
        unit: 'Users',
        current: userData.active || 0,
        trend: this.calculateTrend(userData.trend),
        change: userData.change || 0,
        lastUpdated: new Date()
      })

      // Performance metrics
      const performanceData = await this.executeQuery('performance_metrics', { tenantId })
      metrics.push({
        id: 'avg_response_time',
        name: 'Average Response Time',
        description: 'Average API response time',
        category: 'Performance',
        calculation: 'AVG(response_time)',
        unit: 'ms',
        target: 200,
        current: performanceData.avgResponseTime || 0,
        trend: this.calculateTrend(performanceData.trend),
        change: performanceData.change || 0,
        lastUpdated: new Date()
      })

      return metrics
    } catch (error) {
      console.error('Calculate business metrics error:', error)
      throw new Error('Failed to calculate business metrics')
    }
  }

  /**
   * Generate data insights
   */
  async generateInsights(tenantId: string): Promise<DataInsight[]> {
    try {
      const insights: DataInsight[] = []

      // Trend analysis
      const trends = await this.analyzeTrends(tenantId)
      insights.push(...trends)

      // Anomaly detection
      const anomalies = await this.detectAnomalies(tenantId)
      insights.push(...anomalies)

      // Correlation analysis
      const correlations = await this.analyzeCorrelations(tenantId)
      insights.push(...correlations)

      // Forecasts
      const forecasts = await this.generateForecasts(tenantId)
      insights.push(...forecasts)

      // Recommendations
      const recommendations = await this.generateRecommendations(tenantId)
      insights.push(...recommendations)

      return insights
    } catch (error) {
      console.error('Generate insights error:', error)
      throw new Error('Failed to generate insights')
    }
  }

  /**
   * Analyze trends
   */
  private async analyzeTrends(tenantId: string): Promise<DataInsight[]> {
    const insights: DataInsight[] = []

    try {
      // Revenue trend
      const revenueTrend = await this.executeQuery('revenue_trend', { tenantId })
      if (revenueTrend.trend === 'up' && revenueTrend.change > 10) {
        insights.push({
          id: `trend_${Date.now()}`,
          type: 'trend',
          title: 'Strong Revenue Growth',
          description: `Revenue increased by ${revenueTrend.change}% this month`,
          confidence: 0.85,
          data: revenueTrend,
          actionable: true,
          priority: 'high',
          createdAt: new Date()
        })
      }

      // User growth trend
      const userTrend = await this.executeQuery('user_growth_trend', { tenantId })
      if (userTrend.trend === 'up' && userTrend.change > 5) {
        insights.push({
          id: `trend_${Date.now()}_2`,
          type: 'trend',
          title: 'User Growth Accelerating',
          description: `User base grew by ${userTrend.change}% this month`,
          confidence: 0.80,
          data: userTrend,
          actionable: true,
          priority: 'medium',
          createdAt: new Date()
        })
      }
    } catch (error) {
      console.error('Analyze trends error:', error)
    }

    return insights
  }

  /**
   * Detect anomalies
   */
  private async detectAnomalies(tenantId: string): Promise<DataInsight[]> {
    const insights: DataInsight[] = []

    try {
      // Performance anomalies
      const performanceAnomalies = await this.executeQuery('performance_anomalies', { tenantId })
      for (const anomaly of performanceAnomalies) {
        insights.push({
          id: `anomaly_${Date.now()}`,
          type: 'anomaly',
          title: 'Performance Anomaly Detected',
          description: `Response time spike detected at ${anomaly.timestamp}`,
          confidence: anomaly.confidence || 0.75,
          data: anomaly,
          actionable: true,
          priority: 'high',
          createdAt: new Date()
        })
      }

      // Usage anomalies
      const usageAnomalies = await this.executeQuery('usage_anomalies', { tenantId })
      for (const anomaly of usageAnomalies) {
        insights.push({
          id: `anomaly_${Date.now()}_2`,
          type: 'anomaly',
          title: 'Usage Pattern Anomaly',
          description: `Unusual usage pattern detected: ${anomaly.description}`,
          confidence: anomaly.confidence || 0.70,
          data: anomaly,
          actionable: true,
          priority: 'medium',
          createdAt: new Date()
        })
      }
    } catch (error) {
      console.error('Detect anomalies error:', error)
    }

    return insights
  }

  /**
   * Analyze correlations
   */
  private async analyzeCorrelations(tenantId: string): Promise<DataInsight[]> {
    const insights: DataInsight[] = []

    try {
      const correlations = await this.executeQuery('correlation_analysis', { tenantId })
      for (const correlation of correlations) {
        if (correlation.strength > 0.7) {
          insights.push({
            id: `correlation_${Date.now()}`,
            type: 'correlation',
            title: 'Strong Correlation Found',
            description: `${correlation.variable1} and ${correlation.variable2} are strongly correlated (${correlation.strength})`,
            confidence: correlation.strength,
            data: correlation,
            actionable: true,
            priority: 'medium',
            createdAt: new Date()
          })
        }
      }
    } catch (error) {
      console.error('Analyze correlations error:', error)
    }

    return insights
  }

  /**
   * Generate forecasts
   */
  private async generateForecasts(tenantId: string): Promise<DataInsight[]> {
    const insights: DataInsight[] = []

    try {
      const forecasts = await this.executeQuery('forecast_analysis', { tenantId })
      for (const forecast of forecasts) {
        insights.push({
          id: `forecast_${Date.now()}`,
          type: 'forecast',
          title: `${forecast.metric} Forecast`,
          description: `Predicted ${forecast.metric} for next month: ${forecast.prediction}`,
          confidence: forecast.confidence || 0.65,
          data: forecast,
          actionable: true,
          priority: 'medium',
          createdAt: new Date()
        })
      }
    } catch (error) {
      console.error('Generate forecasts error:', error)
    }

    return insights
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(tenantId: string): Promise<DataInsight[]> {
    const insights: DataInsight[] = []

    try {
      const recommendations = await this.executeQuery('recommendation_engine', { tenantId })
      for (const rec of recommendations) {
        insights.push({
          id: `recommendation_${Date.now()}`,
          type: 'recommendation',
          title: rec.title,
          description: rec.description,
          confidence: rec.confidence || 0.60,
          data: rec,
          actionable: true,
          priority: rec.priority || 'medium',
          createdAt: new Date()
        })
      }
    } catch (error) {
      console.error('Generate recommendations error:', error)
    }

    return insights
  }

  /**
   * Export data
   */
  async exportData(
    queryId: string,
    format: 'csv' | 'json' | 'excel' | 'pdf',
    parameters: Record<string, any> = {}
  ): Promise<{ data: any; filename: string; contentType: string }> {
    try {
      const data = await this.executeQuery(queryId, parameters)
      
      switch (format) {
        case 'csv':
          return {
            data: this.convertToCSV(data),
            filename: `export_${Date.now()}.csv`,
            contentType: 'text/csv'
          }
        case 'json':
          return {
            data: JSON.stringify(data, null, 2),
            filename: `export_${Date.now()}.json`,
            contentType: 'application/json'
          }
        case 'excel':
          return {
            data: await this.convertToExcel(data),
            filename: `export_${Date.now()}.xlsx`,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        case 'pdf':
          return {
            data: await this.convertToPDF(data),
            filename: `export_${Date.now()}.pdf`,
            contentType: 'application/pdf'
          }
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error('Export data error:', error)
      throw new Error('Failed to export data')
    }
  }

  /**
   * Helper methods
   */
  private calculateTrend(data: any): 'up' | 'down' | 'stable' {
    if (data > 0.05) return 'up'
    if (data < -0.05) return 'down'
    return 'stable'
  }

  private buildWhereClause(filters: any[], parameters: Record<string, any>): any {
    const where: any = {}
    
    for (const filter of filters) {
      const value = parameters[filter.parameter] || filter.value
      where[filter.field] = { [filter.operator]: value }
    }
    
    return where
  }

  private filterData(data: any[], conditions: any[], parameters: Record<string, any>): any[] {
    return data.filter(item => {
      return conditions.every(condition => {
        const value = parameters[condition.parameter] || condition.value
        const itemValue = this.extractValue(condition.field, item)
        
        switch (condition.operator) {
          case 'equals':
            return itemValue == value
          case 'not_equals':
            return itemValue != value
          case 'greater_than':
            return Number(itemValue) > Number(value)
          case 'less_than':
            return Number(itemValue) < Number(value)
          case 'contains':
            return String(itemValue).includes(String(value))
          default:
            return true
        }
      })
    })
  }

  private transformData(data: any[], transformations: any[], parameters: Record<string, any>): any[] {
    return data.map(item => {
      const transformed = { ...item }
      
      for (const transform of transformations) {
        const value = this.extractValue(transform.source, item)
        transformed[transform.target] = this.applyTransformation(value, transform.operation, parameters)
      }
      
      return transformed
    })
  }

  private aggregateData(data: any[], aggregations: any[], parameters: Record<string, any>): any {
    const result: any = {}
    
    for (const agg of aggregations) {
      const values = data.map(item => this.extractValue(agg.field, item)).filter(v => v !== undefined)
      
      switch (agg.operation) {
        case 'sum':
          result[agg.alias] = values.reduce((sum, val) => sum + Number(val), 0)
          break
        case 'avg':
          result[agg.alias] = values.reduce((sum, val) => sum + Number(val), 0) / values.length
          break
        case 'count':
          result[agg.alias] = values.length
          break
        case 'min':
          result[agg.alias] = Math.min(...values.map(v => Number(v)))
          break
        case 'max':
          result[agg.alias] = Math.max(...values.map(v => Number(v)))
          break
      }
    }
    
    return result
  }

  private async joinData(data: any[], joinConfig: any, parameters: Record<string, any>): Promise<any[]> {
    const joinedData = await this.getPipelineData(joinConfig.source, parameters)
    
    return data.map(item => {
      const match = joinedData.find(joinItem => 
        joinItem[joinConfig.on] === item[joinConfig.on]
      )
      return { ...item, ...match }
    })
  }

  private sortData(data: any[], sortConfig: any): any[] {
    return data.sort((a, b) => {
      for (const sort of sortConfig) {
        const aVal = this.extractValue(sort.field, a)
        const bVal = this.extractValue(sort.field, b)
        
        if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  private extractValue(field: string, data: any): any {
    if (!field) return data
    
    const keys = field.split('.')
    let value = data
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return undefined
      }
    }
    
    return value
  }

  private applyTransformation(value: any, operation: string, parameters: Record<string, any>): any {
    switch (operation) {
      case 'multiply':
        return Number(value) * (parameters.factor || 1)
      case 'divide':
        return Number(value) / (parameters.divisor || 1)
      case 'add':
        return Number(value) + (parameters.addend || 0)
      case 'subtract':
        return Number(value) - (parameters.subtrahend || 0)
      case 'uppercase':
        return String(value).toUpperCase()
      case 'lowercase':
        return String(value).toLowerCase()
      case 'format_date':
        return new Date(value).toISOString()
      default:
        return value
    }
  }

  private async fetchAPIData(endpoint: string, parameters: Record<string, any>): Promise<any> {
    const url = new URL(endpoint)
    for (const [key, value] of Object.entries(parameters)) {
      url.searchParams.append(key, String(value))
    }
    
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    return await response.json()
  }

  private convertToCSV(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        return typeof value === 'string' ? `"${value}"` : value
      })
      csvRows.push(values.join(','))
    }
    
    return csvRows.join('\n')
  }

  private async convertToExcel(data: any[]): Promise<Buffer> {
    // This would use a library like xlsx to convert data to Excel format
    // For now, return a mock buffer
    return Buffer.from('mock excel data')
  }

  private async convertToPDF(data: any[]): Promise<Buffer> {
    // This would use a library like puppeteer or jsPDF to convert data to PDF
    // For now, return a mock buffer
    return Buffer.from('mock pdf data')
  }

  private generateLineChart(data: any[], config: any): any {
    // Implementation for line chart generation
    return { type: 'line', data, config }
  }

  private generateBarChart(data: any[], config: any): any {
    // Implementation for bar chart generation
    return { type: 'bar', data, config }
  }

  private generatePieChart(data: any[], config: any): any {
    // Implementation for pie chart generation
    return { type: 'pie', data, config }
  }

  private generateTable(data: any[], config: any): any {
    // Implementation for table generation
    return { type: 'table', data, config }
  }

  private generateHeatmap(data: any[], config: any): any {
    // Implementation for heatmap generation
    return { type: 'heatmap', data, config }
  }

  private generateScatterPlot(data: any[], config: any): any {
    // Implementation for scatter plot generation
    return { type: 'scatter', data, config }
  }

  private generateGauge(data: any[], config: any): any {
    // Implementation for gauge generation
    return { type: 'gauge', data, config }
  }

  private generateFunnel(data: any[], config: any): any {
    // Implementation for funnel generation
    return { type: 'funnel', data, config }
  }

  private mapQueryToAnalyticsQuery(query: any): AnalyticsQuery {
    return {
      id: query.id,
      name: query.name,
      description: query.description,
      tenantId: query.tenantId,
      type: query.type,
      query: query.query,
      parameters: query.parameters,
      schedule: query.schedule,
      createdAt: query.createdAt,
      updatedAt: query.updatedAt
    }
  }

  private mapReportToAnalyticsReport(report: any): AnalyticsReport {
    return {
      id: report.id,
      name: report.name,
      description: report.description,
      tenantId: report.tenantId,
      type: report.type,
      config: report.config,
      data: report.data,
      lastGenerated: report.lastGenerated,
      schedule: report.schedule,
      recipients: report.recipients,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    }
  }
} 