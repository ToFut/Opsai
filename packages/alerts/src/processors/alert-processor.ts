import { Queue, Worker, Job } from 'bullmq';
import { createClient } from 'redis';
import { AlertInstance, AlertAction, AlertActionResult } from '../types';
import { prisma } from '@opsai/database';
import { WorkflowService } from '@opsai/workflow';
import { AlertError } from '../engines/rules-engine';

export class AlertProcessor {
  private actionQueue: Queue;
  private actionWorker: Worker;
  private redisClient: any;
  private workflowService: WorkflowService;

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.actionQueue = new Queue('alert-actions', {
      connection: this.redisClient
    });

    this.actionWorker = new Worker(
      'alert-actions',
      this.processAlertAction.bind(this),
      {
        connection: this.redisClient,
        concurrency: 10
      }
    );

    this.workflowService = new WorkflowService();
  }

  /**
   * Process an alert instance by executing all its actions
   */
  async processAlert(alertInstance: AlertInstance): Promise<void> {
    try {
      console.log(`[Alert Processor] Processing alert ${alertInstance.id}`);

      // Get the rule and its actions
      const rule = await prisma.alertRule.findUnique({
        where: { id: alertInstance.ruleId },
        include: { actions: true }
      });

      if (!rule) {
        throw new AlertError('Alert rule not found');
      }

      // Queue actions for processing
      for (const action of rule.actions) {
        if (action.enabled) {
          await this.queueAction(alertInstance, action as any);
        }
      }

      console.log(`[Alert Processor] Queued ${rule.actions.length} actions for alert ${alertInstance.id}`);
    } catch (error) {
      console.error(`[Alert Processor] Error processing alert ${alertInstance.id}:`, error);
      
      // Update alert instance with error
      await this.updateAlertStatus(alertInstance.id, 'active', {
        processingError: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Queue an action for processing
   */
  private async queueAction(alertInstance: AlertInstance, action: AlertAction): Promise<void> {
    const jobData = {
      alertInstanceId: alertInstance.id,
      actionId: action.id,
      action,
      alertData: alertInstance
    };

    // Add to queue with retry configuration
    await this.actionQueue.add(
      'execute-action',
      jobData,
      {
        attempts: (action.retryConfig?.maxRetries || 3) + 1,
        backoff: {
          type: 'exponential',
          delay: (action.retryConfig?.retryDelay || 30) * 1000,
          settings: {
            multiplier: action.retryConfig?.backoffMultiplier || 2
          }
        },
        removeOnComplete: 100,
        removeOnFail: 50
      }
    );
  }

  /**
   * Process alert action (called by BullMQ worker)
   */
  private async processAlertAction(job: Job): Promise<void> {
    const { alertInstanceId, actionId, action, alertData } = job.data;

    try {
      console.log(`[Alert Processor] Executing action ${actionId} for alert ${alertInstanceId}`);

      // Create action result record
      const actionResult: AlertActionResult = {
        actionId,
        actionType: action.type,
        status: 'pending',
        executedAt: new Date(),
        retryCount: job.attemptsMade - 1
      };

      // Update alert instance with action result
      await this.addActionResult(alertInstanceId, actionResult);

      // Execute the action
      let result: any;
      
      switch (action.type) {
        case 'email':
          result = await this.executeEmailAction(action, alertData);
          break;
        case 'sms':
          result = await this.executeSMSAction(action, alertData);
          break;
        case 'webhook':
          result = await this.executeWebhookAction(action, alertData);
          break;
        case 'slack':
          result = await this.executeSlackAction(action, alertData);
          break;
        case 'teams':
          result = await this.executeTeamsAction(action, alertData);
          break;
        case 'pagerduty':
          result = await this.executePagerDutyAction(action, alertData);
          break;
        case 'workflow':
          result = await this.executeWorkflowAction(action, alertData);
          break;
        case 'database':
          result = await this.executeDatabaseAction(action, alertData);
          break;
        default:
          throw new AlertError(`Unsupported action type: ${action.type}`);
      }

      // Update action result with success
      actionResult.status = 'success';
      actionResult.completedAt = new Date();
      actionResult.response = result;

      await this.updateActionResult(alertInstanceId, actionResult);

      console.log(`[Alert Processor] Action ${actionId} completed successfully`);
    } catch (error) {
      console.error(`[Alert Processor] Action ${actionId} failed:`, error);

      // Update action result with failure
      const actionResult: AlertActionResult = {
        actionId,
        actionType: action.type,
        status: 'failed',
        executedAt: new Date(),
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
        retryCount: job.attemptsMade - 1
      };

      await this.updateActionResult(alertInstanceId, actionResult);

      // Re-throw to trigger retry if configured
      throw error;
    }
  }

  /**
   * Execute email action
   */
  private async executeEmailAction(action: AlertAction, alertData: AlertInstance): Promise<any> {
    console.log(`[Email Action] Sending alert email to ${action.recipients?.join(', ')}`);

    // Process message template
    const processedMessage = this.processTemplate(
      action.message,
      this.buildTemplateContext(alertData, action)
    );

    const processedSubject = action.subject 
      ? this.processTemplate(action.subject, this.buildTemplateContext(alertData, action))
      : `Alert: ${alertData.ruleId}`;

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    const mockEmailResult = {
      messageId: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipients: action.recipients,
      subject: processedSubject,
      deliveredAt: new Date(),
      provider: 'mock'
    };

    // Simulate email delivery delay
    await this.sleep(500);

    return mockEmailResult;
  }

  /**
   * Execute SMS action
   */
  private async executeSMSAction(action: AlertAction, alertData: AlertInstance): Promise<any> {
    console.log(`[SMS Action] Sending alert SMS to ${action.recipients?.join(', ')}`);

    const processedMessage = this.processTemplate(
      action.message,
      this.buildTemplateContext(alertData, action)
    );

    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    const mockSMSResult = {
      messageId: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipients: action.recipients,
      message: processedMessage.substring(0, 160), // SMS character limit
      deliveredAt: new Date(),
      provider: 'mock'
    };

    await this.sleep(300);
    return mockSMSResult;
  }

  /**
   * Execute webhook action
   */
  private async executeWebhookAction(action: AlertAction, alertData: AlertInstance): Promise<any> {
    if (!action.webhook?.url) {
      throw new AlertError('Webhook URL is required');
    }

    console.log(`[Webhook Action] Sending to ${action.webhook.url}`);

    const payload = action.webhook.payload || {
      alertId: alertData.id,
      ruleId: alertData.ruleId,
      severity: alertData.severity,
      status: alertData.status,
      triggeredAt: alertData.triggeredAt,
      triggerData: alertData.triggerData,
      message: this.processTemplate(action.message, this.buildTemplateContext(alertData, action))
    };

    const response = await fetch(action.webhook.url, {
      method: action.webhook.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OPSAI-Alerts/1.0',
        ...action.webhook.headers
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new AlertError(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.text();

    return {
      url: action.webhook.url,
      status: response.status,
      statusText: response.statusText,
      response: responseData,
      deliveredAt: new Date()
    };
  }

  /**
   * Execute Slack action
   */
  private async executeSlackAction(action: AlertAction, alertData: AlertInstance): Promise<any> {
    console.log(`[Slack Action] Sending to channel ${action.channel}`);

    const processedMessage = this.processTemplate(
      action.message,
      this.buildTemplateContext(alertData, action)
    );

    // In production, use Slack Web API
    const mockSlackResult = {
      messageId: `slack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channel: action.channel,
      message: processedMessage,
      deliveredAt: new Date(),
      provider: 'mock'
    };

    await this.sleep(200);
    return mockSlackResult;
  }

  /**
   * Execute Teams action
   */
  private async executeTeamsAction(action: AlertAction, alertData: AlertInstance): Promise<any> {
    console.log(`[Teams Action] Sending Teams notification`);

    const processedMessage = this.processTemplate(
      action.message,
      this.buildTemplateContext(alertData, action)
    );

    // In production, use Microsoft Teams webhook or Graph API
    const mockTeamsResult = {
      messageId: `teams-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: processedMessage,
      deliveredAt: new Date(),
      provider: 'mock'
    };

    await this.sleep(300);
    return mockTeamsResult;
  }

  /**
   * Execute PagerDuty action
   */
  private async executePagerDutyAction(action: AlertAction, alertData: AlertInstance): Promise<any> {
    console.log(`[PagerDuty Action] Creating incident`);

    const processedMessage = this.processTemplate(
      action.message,
      this.buildTemplateContext(alertData, action)
    );

    // In production, use PagerDuty Events API
    const mockPagerDutyResult = {
      incidentId: `pd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'triggered',
      message: processedMessage,
      severity: alertData.severity,
      createdAt: new Date(),
      provider: 'mock'
    };

    await this.sleep(400);
    return mockPagerDutyResult;
  }

  /**
   * Execute workflow action
   */
  private async executeWorkflowAction(action: AlertAction, alertData: AlertInstance): Promise<any> {
    if (!action.workflowId) {
      throw new AlertError('Workflow ID is required');
    }

    console.log(`[Workflow Action] Triggering workflow ${action.workflowId}`);

    const workflowInput = {
      ...action.workflowInput,
      alertData,
      triggeredBy: 'alert_system'
    };

    const execution = await this.workflowService.executeWorkflow(
      action.workflowId,
      workflowInput,
      alertData.tenantId
    );

    return {
      workflowId: action.workflowId,
      executionId: execution.id,
      status: execution.status,
      startedAt: execution.startedAt
    };
  }

  /**
   * Execute database action
   */
  private async executeDatabaseAction(action: AlertAction, alertData: AlertInstance): Promise<any> {
    if (!action.database?.table) {
      throw new AlertError('Database table is required');
    }

    console.log(`[Database Action] ${action.database.action} on ${action.database.table}`);

    const processedData = this.processTemplateObject(
      action.database.data,
      this.buildTemplateContext(alertData, action)
    );

    let result;
    const table = action.database.table;

    switch (action.database.action) {
      case 'insert':
        result = await (prisma as any)[table].create({
          data: {
            ...processedData,
            tenantId: alertData.tenantId
          }
        });
        break;

      case 'update':
        if (!action.database.where) {
          throw new AlertError('Where clause is required for update action');
        }

        const processedWhere = this.processTemplateObject(
          action.database.where,
          this.buildTemplateContext(alertData, action)
        );

        result = await (prisma as any)[table].updateMany({
          where: {
            ...processedWhere,
            tenantId: alertData.tenantId
          },
          data: processedData
        });
        break;

      default:
        throw new AlertError(`Unsupported database action: ${action.database.action}`);
    }

    return {
      table,
      action: action.database.action,
      result,
      executedAt: new Date()
    };
  }

  /**
   * Build template context for message processing
   */
  private buildTemplateContext(alertData: AlertInstance, action: AlertAction): Record<string, any> {
    return {
      alert: {
        id: alertData.id,
        ruleId: alertData.ruleId,
        severity: alertData.severity,
        status: alertData.status,
        triggeredAt: alertData.triggeredAt,
        triggerValue: alertData.triggerData.actualValue,
        expectedValue: alertData.triggerData.expectedValue
      },
      action: {
        id: action.id,
        type: action.type
      },
      tenant: {
        id: alertData.tenantId
      },
      timestamp: new Date().toISOString(),
      ...action.templateData
    };
  }

  /**
   * Process template string with context variables
   */
  private processTemplate(template: string, context: Record<string, any>): string {
    return template.replace(/\\{\\{([^}]+)\\}\\}/g, (match, path) => {
      const value = this.getNestedValue(context, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Process template object (recursive template processing)
   */
  private processTemplateObject(obj: any, context: Record<string, any>): any {
    if (typeof obj === 'string') {
      return this.processTemplate(obj, context);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.processTemplateObject(item, context));
    }

    if (obj && typeof obj === 'object') {
      const processed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        processed[key] = this.processTemplateObject(value, context);
      }
      return processed;
    }

    return obj;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Add action result to alert instance
   */
  private async addActionResult(alertInstanceId: string, actionResult: AlertActionResult): Promise<void> {
    await prisma.alertActionResult.create({
      data: {
        alertInstanceId,
        actionId: actionResult.actionId,
        actionType: actionResult.actionType,
        status: actionResult.status,
        executedAt: actionResult.executedAt,
        retryCount: actionResult.retryCount
      }
    });
  }

  /**
   * Update action result
   */
  private async updateActionResult(alertInstanceId: string, actionResult: AlertActionResult): Promise<void> {
    await prisma.alertActionResult.updateMany({
      where: {
        alertInstanceId,
        actionId: actionResult.actionId
      },
      data: {
        status: actionResult.status,
        completedAt: actionResult.completedAt,
        error: actionResult.error,
        response: actionResult.response ? JSON.stringify(actionResult.response) : null,
        retryCount: actionResult.retryCount
      }
    });
  }

  /**
   * Update alert status
   */
  private async updateAlertStatus(alertInstanceId: string, status: string, metadata?: any): Promise<void> {
    await prisma.alertInstance.update({
      where: { id: alertInstanceId },
      data: {
        status,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      }
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    await this.actionWorker.close();
    await this.actionQueue.close();
    await this.redisClient.quit();
  }
}