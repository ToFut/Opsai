
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '../lib/analytics/AnalyticsService';
import { AuditService } from '../lib/analytics/AuditService';

const prisma = new PrismaClient();

export interface StepInput {
  stepName: string;
  stepType: string;
  config: any;
  input: any;
  previousResult: any;
}

export interface StepResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: any;
}

export const WorkflowActivities = {
  async validateData(params: StepInput): Promise<StepResult> {
    try {
      console.log('Validating data for step:', params.stepName);
      
      const { config, input } = params;
      const validationRules = config.rules || {};
      
      // Perform validation based on rules
      const errors: string[] = [];
      
      if (config.entity && input.data) {
        Object.entries(validationRules).forEach(([field, rules]: [string, any]) => {
          const value = input.data[field];
          
          if (rules.required && (!value || value === '')) {
            errors.push(`Field ${field} is required`);
          }
          
          if (rules.unique && value) {
            // Check uniqueness in database (simplified)
            // In real implementation, this would check the database
          }
          
          if (rules.min && typeof value === 'number' && value < rules.min) {
            errors.push(`Field ${field} must be at least ${rules.min}`);
          }
          
          if (rules.max && typeof value === 'number' && value > rules.max) {
            errors.push(`Field ${field} must be at most ${rules.max}`);
          }
        });
      }
      
      const isValid = errors.length === 0;
      
      // Log validation result
      await AuditService.logSystemEvent({
        level: isValid ? 'INFO' : 'WARN',
        message: `Data validation ${isValid ? 'passed' : 'failed'} for step ${params.stepName}`,
        source: 'workflow_engine',
        context: { errors, stepName: params.stepName }
      });
      
      return {
        success: isValid,
        data: { valid: isValid, errors },
        error: isValid ? undefined : `Validation failed: ${errors.join(', ')}`
      };
      
    } catch (error) {
      console.error('Data validation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async makeApiCall(params: StepInput): Promise<StepResult> {
    try {
      console.log('Making API call for step:', params.stepName);
      
      const { config } = params;
      const { service, endpoint, method = 'GET', auth, headers = {} } = config;
      
      // Build request configuration
      const requestConfig: any = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };
      
      // Add authentication
      if (auth) {
        if (auth.type === 'bearer') {
          requestConfig.headers['Authorization'] = `Bearer ${auth.token}`;
        } else if (auth.type === 'api_key') {
          requestConfig.headers[auth.header || 'X-API-Key'] = auth.key;
        }
      }
      
      // Add request body for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        requestConfig.body = JSON.stringify(params.input.data || {});
      }
      
      // Make the API call
      const baseUrl = process.env[`${service.toUpperCase()}_BASE_URL`] || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}${endpoint}`, requestConfig);
      
      const responseData = await response.text();
      let parsedData;
      
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = responseData;
      }
      
      const success = response.ok;
      
      // Log API call result
      await AuditService.logSystemEvent({
        level: success ? 'INFO' : 'ERROR',
        message: `API call ${success ? 'succeeded' : 'failed'} for step ${params.stepName}`,
        source: 'workflow_engine',
        context: {
          service,
          endpoint,
          method,
          statusCode: response.status,
          stepName: params.stepName
        }
      });
      
      return {
        success,
        data: parsedData,
        error: success ? undefined : `API call failed: ${response.status} ${response.statusText}`,
        metadata: {
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      };
      
    } catch (error) {
      console.error('API call error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async performDatabaseOperation(params: StepInput): Promise<StepResult> {
    try {
      console.log('Performing database operation for step:', params.stepName);
      
      const { config, input } = params;
      const { action, table, data, conditions } = config;
      
      let result;
      
      switch (action) {
        case 'insert':
          result = await (prisma as any)[table].create({
            data: { ...data, ...input.data }
          });
          break;
          
        case 'update':
          result = await (prisma as any)[table].update({
            where: conditions || { id: input.entityId },
            data: { ...data, ...input.data }
          });
          break;
          
        case 'delete':
          result = await (prisma as any)[table].delete({
            where: conditions || { id: input.entityId }
          });
          break;
          
        case 'select':
        case 'find':
          result = await (prisma as any)[table].findMany({
            where: conditions || {}
          });
          break;
          
        case 'aggregate':
          result = await (prisma as any)[table].aggregate({
            _count: { _all: true },
            _avg: config.avgFields || {},
            _sum: config.sumFields || {},
            _min: config.minFields || {},
            _max: config.maxFields || {}
          });
          break;
          
        case 'health_check':
          result = await prisma.$queryRaw`SELECT 1 as health_check`;
          break;
          
        default:
          throw new Error(`Unsupported database action: ${action}`);
      }
      
      // Log database operation
      await AuditService.logSystemEvent({
        level: 'INFO',
        message: `Database operation ${action} completed for step ${params.stepName}`,
        source: 'workflow_engine',
        context: { action, table, stepName: params.stepName }
      });
      
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      console.error('Database operation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async sendNotification(params: StepInput): Promise<StepResult> {
    try {
      console.log('Sending notification for step:', params.stepName);
      
      const { config, input } = params;
      const { channels = [], recipients = [], message, subject, severity = 'info' } = config;
      
      const notifications: any[] = [];
      
      // Check condition if specified
      if (config.condition) {
        const shouldSend = await this.evaluateCondition({
          stepName: 'notification_condition',
          stepType: 'conditional',
          config: { condition: config.condition },
          input,
          previousResult: params.previousResult
        });
        
        if (!shouldSend.success || !shouldSend.data.result) {
          return {
            success: true,
            data: { skipped: true, reason: 'Condition not met' }
          };
        }
      }
      
      // Send notifications through different channels
      for (const channel of channels) {
        try {
          let notificationResult;
          
          switch (channel) {
            case 'email':
              // Email notification implementation
              notificationResult = await this.sendEmailNotification({
                recipients,
                subject: subject || `Workflow Notification: ${params.stepName}`,
                message: message || `Step ${params.stepName} completed`,
                severity
              });
              break;
              
            case 'slack':
              // Slack notification implementation
              notificationResult = await this.sendSlackNotification({
                message: message || `Step ${params.stepName} completed`,
                severity
              });
              break;
              
            case 'webhook':
              // Webhook notification implementation
              notificationResult = await this.sendWebhookNotification({
                url: config.webhookUrl,
                data: { stepName: params.stepName, input, severity }
              });
              break;
              
            default:
              console.warn(`Unsupported notification channel: ${channel}`);
          }
          
          notifications.push({
            channel,
            success: !!notificationResult,
            result: notificationResult
          });
          
        } catch (error) {
          console.error(`Failed to send ${channel} notification:`, error);
          notifications.push({
            channel,
            success: false,
            error: error.message
          });
        }
      }
      
      const allSuccessful = notifications.every(n => n.success);
      
      return {
        success: allSuccessful,
        data: { notifications },
        error: allSuccessful ? undefined : 'Some notifications failed to send'
      };
      
    } catch (error) {
      console.error('Notification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async performCalculation(params: StepInput): Promise<StepResult> {
    try {
      console.log('Performing calculation for step:', params.stepName);
      
      const { config, input, previousResult } = params;
      const { operation, fields = [], aggregation } = config;
      
      let result;
      
      switch (operation) {
        case 'sum':
          result = fields.reduce((acc: number, field: string) => 
            acc + (input.data[field] || 0), 0);
          break;
          
        case 'average':
          const sum = fields.reduce((acc: number, field: string) => 
            acc + (input.data[field] || 0), 0);
          result = sum / fields.length;
          break;
          
        case 'business_intelligence_analysis':
          result = await this.performBIAnalysis(input, previousResult);
          break;
          
        case 'aggregate_quality_metrics':
          result = await this.aggregateQualityMetrics();
          break;
          
        default:
          result = input.data;
      }
      
      return {
        success: true,
        data: { result, operation }
      };
      
    } catch (error) {
      console.error('Calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async evaluateCondition(params: StepInput): Promise<StepResult> {
    try {
      console.log('Evaluating condition for step:', params.stepName);
      
      const { config, input, previousResult } = params;
      const { condition } = config;
      
      let result = false;
      
      // Simple condition evaluation (can be extended)
      if (condition === 'any_health_check_failed') {
        result = previousResult?.some((r: any) => !r.success);
      } else if (condition === 'quality_score < 80') {
        const qualityScore = previousResult?.data?.averageScore || 100;
        result = qualityScore < 80;
      } else if (condition.includes('==')) {
        const [left, right] = condition.split('==').map((s: string) => s.trim());
        result = input.data[left] == right;
      } else if (condition.includes('>')) {
        const [left, right] = condition.split('>').map((s: string) => s.trim());
        result = parseFloat(input.data[left]) > parseFloat(right);
      }
      
      return {
        success: true,
        data: { result, condition }
      };
      
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async executeParallel(params: StepInput): Promise<StepResult> {
    try {
      console.log('Executing parallel steps for:', params.stepName);
      
      const { config } = params;
      const { steps = [] } = config;
      
      const promises = steps.map(async (step: any) => {
        const activityMethod = this[this.getActivityMethodName(step.type)];
        if (activityMethod) {
          return await activityMethod({
            stepName: step.name,
            stepType: step.type,
            config: step.config,
            input: params.input,
            previousResult: params.previousResult
          });
        }
        return { success: false, error: `Unknown step type: ${step.type}` };
      });
      
      const results = await Promise.allSettled(promises);
      const successfulResults = [];
      const errors = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulResults.push(result.value);
        } else {
          errors.push(`Step ${steps[index].name}: ${result.reason}`);
        }
      });
      
      const allSuccessful = errors.length === 0;
      
      return {
        success: allSuccessful,
        data: { results: successfulResults },
        error: allSuccessful ? undefined : `Parallel execution errors: ${errors.join(', ')}`
      };
      
    } catch (error) {
      console.error('Parallel execution error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async waitForDuration(params: StepInput): Promise<StepResult> {
    const { config } = params;
    const duration = config.duration || 1000;
    
    console.log(`Waiting for ${duration}ms`);
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return {
      success: true,
      data: { waited: duration }
    };
  },

  async executeGenericStep(params: StepInput): Promise<StepResult> {
    console.log('Executing generic step:', params.stepName);
    
    return {
      success: true,
      data: { message: `Generic step ${params.stepName} executed` }
    };
  },

  async logWorkflowEvent(params: {
    workflowName: string;
    eventType: string;
    error?: string;
    input?: any;
  }): Promise<void> {
    await AuditService.logSystemEvent({
      level: params.error ? 'ERROR' : 'INFO',
      message: `Workflow event: ${params.eventType}`,
      source: 'workflow_engine',
      context: {
        workflowName: params.workflowName,
        eventType: params.eventType,
        error: params.error,
        input: params.input
      }
    });
  },

  // Helper methods
  getActivityMethodName(stepType: string): string {
    const methodMap: { [key: string]: string } = {
      'data_validation': 'validateData',
      'api_call': 'makeApiCall',
      'database_operation': 'performDatabaseOperation',
      'notification': 'sendNotification',
      'calculation': 'performCalculation',
      'conditional': 'evaluateCondition',
      'parallel': 'executeParallel',
      'wait': 'waitForDuration'
    };
    
    return methodMap[stepType] || 'executeGenericStep';
  },

  async sendEmailNotification(config: any): Promise<any> {
    // Email implementation would go here
    console.log('Sending email notification:', config);
    return { sent: true, method: 'email' };
  },

  async sendSlackNotification(config: any): Promise<any> {
    // Slack implementation would go here
    console.log('Sending Slack notification:', config);
    return { sent: true, method: 'slack' };
  },

  async sendWebhookNotification(config: any): Promise<any> {
    // Webhook implementation would go here
    console.log('Sending webhook notification:', config);
    return { sent: true, method: 'webhook' };
  },

  async performBIAnalysis(input: any, previousResult: any): Promise<any> {
    // Business intelligence analysis implementation
    return {
      insights: ['Sample insight 1', 'Sample insight 2'],
      metrics: { engagement: 85, retention: 92 }
    };
  },

  async aggregateQualityMetrics(): Promise<any> {
    // Aggregate data quality metrics
    return {
      averageScore: 88,
      totalChecks: 150,
      passedChecks: 132
    };
  }
};

export type WorkflowActivities = typeof WorkflowActivities;
