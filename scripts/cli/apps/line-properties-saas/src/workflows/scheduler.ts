import { workflowEngine } from './engine';

export interface ScheduledWorkflow {
  workflowId: string;
  schedule: string; // cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class WorkflowScheduler {
  private scheduledWorkflows = new Map<string, ScheduledWorkflow>();
  private intervals = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.initializeSchedules();
  }

  private async initializeSchedules(): Promise<void> {
    // Initialize scheduled workflows from configuration
    
  }

  scheduleWorkflow(workflowId: string, cronExpression: string): void {
    const scheduled: ScheduledWorkflow = {
      workflowId,
      schedule: cronExpression,
      enabled: true,
      nextRun: this.getNextRunTime(cronExpression)
    };

    this.scheduledWorkflows.set(workflowId, scheduled);
    this.setupInterval(workflowId, scheduled);
    
    console.log(`⏰ Scheduled workflow ${workflowId} with cron: ${cronExpression}`);
  }

  unscheduleWorkflow(workflowId: string): void {
    const interval = this.intervals.get(workflowId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(workflowId);
    }
    
    this.scheduledWorkflows.delete(workflowId);
    console.log(`⏰ Unscheduled workflow ${workflowId}`);
  }

  private setupInterval(workflowId: string, scheduled: ScheduledWorkflow): void {
    // Simple interval-based scheduling (in production, use a proper cron library)
    const interval = setInterval(async () => {
      if (!scheduled.enabled) return;

      const now = new Date();
      if (scheduled.nextRun && now >= scheduled.nextRun) {
        try {
          console.log(`⚡ Executing scheduled workflow: ${workflowId}`);
          await workflowEngine.executeWorkflow(workflowId, { 
            triggered: 'schedule', 
            scheduledAt: now 
          });
          
          scheduled.lastRun = now;
          scheduled.nextRun = this.getNextRunTime(scheduled.schedule);
          
        } catch (error) {
          console.error(`❌ Scheduled workflow execution failed: ${workflowId}`, error);
        }
      }
    }, 60000); // Check every minute

    this.intervals.set(workflowId, interval);
  }

  private getNextRunTime(cronExpression: string): Date {
    // Simple implementation - in production, use a proper cron parser
    const now = new Date();
    
    // Parse basic cron expressions
    if (cronExpression === '0 * * * *') { // Every hour
      const next = new Date(now);
      next.setHours(next.getHours() + 1, 0, 0, 0);
      return next;
    }
    
    if (cronExpression === '0 0 * * *') { // Daily at midnight
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      return next;
    }
    
    if (cronExpression === '*/5 * * * *') { // Every 5 minutes
      const next = new Date(now);
      next.setMinutes(next.getMinutes() + 5, 0, 0);
      return next;
    }
    
    // Default: next hour
    const next = new Date(now);
    next.setHours(next.getHours() + 1, 0, 0, 0);
    return next;
  }

  getScheduledWorkflows(): ScheduledWorkflow[] {
    return Array.from(this.scheduledWorkflows.values());
  }

  enableWorkflow(workflowId: string): void {
    const scheduled = this.scheduledWorkflows.get(workflowId);
    if (scheduled) {
      scheduled.enabled = true;
      console.log(`✅ Enabled scheduled workflow: ${workflowId}`);
    }
  }

  disableWorkflow(workflowId: string): void {
    const scheduled = this.scheduledWorkflows.get(workflowId);
    if (scheduled) {
      scheduled.enabled = false;
      console.log(`⏸️  Disabled scheduled workflow: ${workflowId}`);
    }
  }
}

// Export singleton instance
export const workflowScheduler = new WorkflowScheduler();