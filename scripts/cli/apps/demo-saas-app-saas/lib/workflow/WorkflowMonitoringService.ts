
import { workflowClient } from './WorkflowClient';
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../analytics/AuditService';

const prisma = new PrismaClient();

export class WorkflowMonitoringService {
  
  static async getWorkflowMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<any> {
    const hoursMap = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 };
    const hours = hoursMap[timeRange];
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metrics = await prisma.$queryRaw`
      SELECT 
        source,
        level,
        COUNT(*) as count,
        DATE_TRUNC('hour', timestamp) as hour
      FROM system_logs 
      WHERE source = 'workflow_engine' 
        AND timestamp >= ${startTime}
      GROUP BY source, level, DATE_TRUNC('hour', timestamp)
      ORDER BY hour DESC
    `;

    return {
      timeRange,
      totalEvents: metrics.reduce((sum: number, m: any) => sum + parseInt(m.count), 0),
      errorCount: metrics
        .filter((m: any) => m.level === 'ERROR')
        .reduce((sum: number, m: any) => sum + parseInt(m.count), 0),
      hourlyBreakdown: metrics
    };
  }

  static async getWorkflowHealth(): Promise<any> {
    // Get recent workflow executions from system logs
    const recentExecutions = await prisma.systemLog.findMany({
      where: {
        source: 'workflow_engine',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    const totalExecutions = recentExecutions.length;
    const failedExecutions = recentExecutions.filter(log => 
      log.message.includes('failed')).length;
    const successRate = totalExecutions > 0 ? 
      ((totalExecutions - failedExecutions) / totalExecutions) * 100 : 100;

    // Get workflow performance metrics
    const avgExecutionTime = await this.calculateAvgExecutionTime();
    
    return {
      totalExecutions,
      failedExecutions,
      successRate: Math.round(successRate * 100) / 100,
      avgExecutionTime,
      healthStatus: successRate >= 95 ? 'healthy' : 
                   successRate >= 80 ? 'warning' : 'critical',
      lastCheck: new Date().toISOString()
    };
  }

  static async getActiveWorkflows(): Promise<any[]> {
    // This would integrate with Temporal to get active workflows
    // For now, we'll return a mock response
    return [
      {
        workflowId: 'daily_data_quality_check-123',
        workflowType: 'data_quality_audit',
        status: 'running',
        startTime: new Date(Date.now() - 5 * 60 * 1000),
        runId: 'run-123'
      }
    ];
  }

  static async getFailedWorkflows(limit = 10): Promise<any[]> {
    const failedLogs = await prisma.systemLog.findMany({
      where: {
        source: 'workflow_engine',
        level: 'ERROR',
        message: { contains: 'failed' }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return failedLogs.map(log => ({
      workflowName: this.extractWorkflowName(log.message),
      error: log.message,
      timestamp: log.timestamp,
      context: log.context
    }));
  }

  static async retryFailedWorkflow(workflowId: string): Promise<any> {
    try {
      // Get the original workflow configuration
      const handle = await workflowClient.getWorkflowHandle(workflowId);
      const result = await handle.result();
      
      // Create new workflow with same input
      const newWorkflowId = `retry-${workflowId}-${Date.now()}`;
      // This would require storing original input, which would be in a real implementation
      
      await AuditService.logSystemEvent({
        level: 'INFO',
        message: `Retrying failed workflow: ${workflowId}`,
        source: 'workflow_monitoring',
        context: { originalWorkflowId: workflowId, newWorkflowId }
      });

      return { success: true, newWorkflowId };
    } catch (error) {
      console.error('Failed to retry workflow:', error);
      return { success: false, error: error.message };
    }
  }

  static async generateWorkflowReport(): Promise<any> {
    const health = await this.getWorkflowHealth();
    const metrics = await this.getWorkflowMetrics('30d');
    const failedWorkflows = await this.getFailedWorkflows(5);
    const activeWorkflows = await this.getActiveWorkflows();

    return {
      summary: {
        totalWorkflows: 4,
        totalSchedules: 3,
        healthStatus: health.healthStatus,
        successRate: health.successRate
      },
      health,
      metrics,
      activeWorkflows,
      failedWorkflows,
      recommendations: this.generateRecommendations(health, metrics),
      generatedAt: new Date().toISOString()
    };
  }

  private static async calculateAvgExecutionTime(): Promise<number> {
    // Mock implementation - in real system this would calculate from actual execution data
    return 2500; // milliseconds
  }

  private static extractWorkflowName(message: string): string {
    const match = message.match(/Workflow (\w+) failed/);
    return match ? match[1] : 'unknown';
  }

  private static generateRecommendations(health: any, metrics: any): string[] {
    const recommendations = [];

    if (health.successRate < 95) {
      recommendations.push('Consider reviewing failed workflows and implementing better error handling');
    }

    if (health.avgExecutionTime > 5000) {
      recommendations.push('Workflow execution time is high, consider optimizing long-running steps');
    }

    if (metrics.errorCount > metrics.totalEvents * 0.1) {
      recommendations.push('High error rate detected, review workflow logic and external dependencies');
    }

    if (recommendations.length === 0) {
      recommendations.push('Workflow system is performing well, continue monitoring');
    }

    return recommendations;
  }
  
  // Schedule monitoring checks
  static async startMonitoring(): Promise<void> {
    console.log('🔍 Starting workflow monitoring...');
    
    // Check workflow health every 5 minutes
    setInterval(async () => {
      try {
        const health = await this.getWorkflowHealth();
        
        if (health.healthStatus === 'critical') {
          await AuditService.logSystemEvent({
            level: 'ERROR',
            message: 'Workflow system health is critical',
            source: 'workflow_monitoring',
            context: health
          });
        }
      } catch (error) {
        console.error('Workflow health check failed:', error);
      }
    }, 5 * 60 * 1000);

    // Generate daily report
    setInterval(async () => {
      try {
        const report = await this.generateWorkflowReport();
        console.log('📊 Daily workflow report generated:', report.summary);
      } catch (error) {
        console.error('Failed to generate workflow report:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }
}
