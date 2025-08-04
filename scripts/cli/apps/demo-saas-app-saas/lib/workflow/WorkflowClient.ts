
import { Client, Connection, WorkflowHandle } from '@temporalio/client';
import { user-onboarding } from '../workflows/user-onboarding';
import { dataQualityAudit } from '../workflows/data-quality-audit';
import { generateAnalyticsReport } from '../workflows/generate-analytics-report';
import { systemHealthCheck } from '../workflows/system-health-check';

export class WorkflowClient {
  private client: Client;

  constructor() {
    this.client = new Client({
      connection: Connection.lazy(),
    });
  }

  // Start workflow methods

  async startUser-onboarding(input: any, options?: any): Promise<WorkflowHandle> {
    const workflowId = options?.workflowId || `${Date.now()}-user-onboarding`;
    
    return await this.client.workflow.start(user-onboarding, {
      workflowId,
      taskQueue: 'default',
      args: [input],
      ...options
    });
  }

  async executeUser-onboarding(input: any, options?: any): Promise<any> {
    const workflowId = options?.workflowId || `${Date.now()}-user-onboarding`;
    
    return await this.client.workflow.execute(user-onboarding, {
      workflowId,
      taskQueue: 'default',
      args: [input],
      ...options
    });
  }
  async startDataQualityAudit(input: any, options?: any): Promise<WorkflowHandle> {
    const workflowId = options?.workflowId || `${Date.now()}-data_quality_audit`;
    
    return await this.client.workflow.start(dataQualityAudit, {
      workflowId,
      taskQueue: 'default',
      args: [input],
      ...options
    });
  }

  async executeDataQualityAudit(input: any, options?: any): Promise<any> {
    const workflowId = options?.workflowId || `${Date.now()}-data_quality_audit`;
    
    return await this.client.workflow.execute(dataQualityAudit, {
      workflowId,
      taskQueue: 'default',
      args: [input],
      ...options
    });
  }
  async startGenerateAnalyticsReport(input: any, options?: any): Promise<WorkflowHandle> {
    const workflowId = options?.workflowId || `${Date.now()}-generate_analytics_report`;
    
    return await this.client.workflow.start(generateAnalyticsReport, {
      workflowId,
      taskQueue: 'default',
      args: [input],
      ...options
    });
  }

  async executeGenerateAnalyticsReport(input: any, options?: any): Promise<any> {
    const workflowId = options?.workflowId || `${Date.now()}-generate_analytics_report`;
    
    return await this.client.workflow.execute(generateAnalyticsReport, {
      workflowId,
      taskQueue: 'default',
      args: [input],
      ...options
    });
  }
  async startSystemHealthCheck(input: any, options?: any): Promise<WorkflowHandle> {
    const workflowId = options?.workflowId || `${Date.now()}-system_health_check`;
    
    return await this.client.workflow.start(systemHealthCheck, {
      workflowId,
      taskQueue: 'default',
      args: [input],
      ...options
    });
  }

  async executeSystemHealthCheck(input: any, options?: any): Promise<any> {
    const workflowId = options?.workflowId || `${Date.now()}-system_health_check`;
    
    return await this.client.workflow.execute(systemHealthCheck, {
      workflowId,
      taskQueue: 'default',
      args: [input],
      ...options
    });
  }

  // Workflow management methods
  async getWorkflowHandle(workflowId: string): Promise<WorkflowHandle> {
    return this.client.workflow.getHandle(workflowId);
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    const handle = await this.getWorkflowHandle(workflowId);
    await handle.cancel();
  }

  async terminateWorkflow(workflowId: string, reason?: string): Promise<void> {
    const handle = await this.getWorkflowHandle(workflowId);
    await handle.terminate(reason);
  }

  async getWorkflowStatus(workflowId: string): Promise<string> {
    const handle = await this.getWorkflowHandle(workflowId);
    return await handle.query('getWorkflowStatus');
  }

  async pauseWorkflow(workflowId: string): Promise<void> {
    const handle = await this.getWorkflowHandle(workflowId);
    await handle.signal('pauseWorkflow');
  }

  async resumeWorkflow(workflowId: string): Promise<void> {
    const handle = await this.getWorkflowHandle(workflowId);
    await handle.signal('resumeWorkflow');
  }

  // Scheduled workflow methods
  async startScheduledWorkflows(): Promise<void> {
    const schedules = [
  {
    "name": "daily_data_quality_check",
    "cronExpression": "0 2 * * *",
    "workflowName": "data_quality_audit",
    "timezone": "UTC"
  },
  {
    "name": "weekly_analytics_report",
    "cronExpression": "0 9 * * 1",
    "workflowName": "generate_analytics_report",
    "timezone": "UTC"
  },
  {
    "name": "hourly_health_check",
    "cronExpression": "0 * * * *",
    "workflowName": "system_health_check",
    "timezone": "UTC"
  }
];
    
    for (const schedule of schedules) {
      try {
        await this.client.schedule.create({
          scheduleId: schedule.name,
          spec: {
            cronExpressions: [schedule.cronExpression],
            timezone: schedule.timezone,
          },
          action: {
            type: 'startWorkflow',
            workflowType: schedule.workflowName,
            taskQueue: 'default',
            args: [{}],
          },
        });
        
        console.log(`✅ Created schedule: ${schedule.name}`);
      } catch (error) {
        console.error(`❌ Failed to create schedule ${schedule.name}:`, error);
      }
    }
  }

  async listSchedules(): Promise<any[]> {
    const schedules = [];
    for await (const schedule of this.client.schedule.list()) {
      schedules.push(schedule);
    }
    return schedules;
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    const handle = this.client.schedule.getHandle(scheduleId);
    await handle.delete();
  }
}

// Export singleton instance
export const workflowClient = new WorkflowClient();
