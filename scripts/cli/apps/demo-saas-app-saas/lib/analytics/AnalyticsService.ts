
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class AnalyticsService {
  static async trackEvent(data: {
    eventType: string
    entityType?: string
    entityId?: string
    userId?: string
    sessionId?: string
    properties?: any
    
  }) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          ...data,
          properties: data.properties ? JSON.stringify(data.properties) : null,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  static async getDailyMetrics(days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    return await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        event_type,
        COUNT(*) as count
      FROM analytics_events 
      WHERE timestamp >= ${startDate}
      GROUP BY DATE(timestamp), event_type
      ORDER BY date DESC
    `
  }

  static async getUserEngagement(days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    return await prisma.$queryRaw`
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as sessions,
        AVG(duration) as avg_duration,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_sessions 
      WHERE start_time >= ${startDate}
      GROUP BY DATE(start_time)
      ORDER BY date DESC
    `
  }

  static async recordBusinessMetric(data: {
    metricName: string
    metricValue: number
    period: 'daily' | 'weekly' | 'monthly'
    periodStart: Date
    periodEnd: Date
    dimensions?: any
    
  }) {
    return await prisma.businessMetric.upsert({
      where: {
        metricName_period_periodStart: {
          metricName: data.metricName,
          period: data.period,
          periodStart: data.periodStart,
          
        }
      },
      update: {
        metricValue: data.metricValue,
        dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null
      },
      create: {
        ...data,
        dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null
      }
    })
  }

  static async runDataQualityCheck(tableName: string, checkType: string, rule: string) {
    // This would contain actual data quality validation logic
    // For now, we'll create a placeholder implementation
    
    let passed = true
    let score = 100
    let details = {}
    
    try {
      // Example: Check for null values in required fields
      if (checkType === 'completeness') {
        // Implementation would go here
      }
      
      await prisma.dataQualityCheck.create({
        data: {
          tableName,
          checkType,
          checkRule: rule,
          passed,
          score,
          details: JSON.stringify(details),
          
        }
      })
    } catch (error) {
      console.error('Data quality check failed:', error)
    }
  }

  static async getDataQualitySummary() {
    return await prisma.$queryRaw`
      SELECT 
        table_name,
        AVG(score) as avg_score,
        COUNT(*) as total_checks,
        SUM(CASE WHEN passed THEN 1 ELSE 0 END)::float / COUNT(*) as pass_rate
      FROM data_quality_checks
      WHERE checked_at >= NOW() - INTERVAL '7 days'
      GROUP BY table_name
      ORDER BY avg_score ASC
    `
  }
}
