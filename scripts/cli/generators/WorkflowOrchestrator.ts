import { YamlConfig } from '../../../packages/shared/src/types';
import * as fs from 'fs';
import * as path from 'path';

export interface WorkflowConfig {
  workflows: Array<{
    name: string;
    description: string;
    trigger: {
      type: 'api_call' | 'schedule' | 'event' | 'webhook' | 'manual';
      config: any;
    };
    steps: Array<{
      name: string;
      type: 'data_validation' | 'api_call' | 'database_operation' | 'notification' | 'calculation' | 'conditional' | 'parallel' | 'wait';
      config: any;
      errorHandling?: {
        retries: number;
        backoff: 'linear' | 'exponential';
        fallback?: any;
      };
    }>;
    timeout: number;
    retryPolicy: {
      maximumAttempts: number;
      backoffCoefficient: number;
    };
  }>;
  schedules: Array<{
    name: string;
    cronExpression: string;
    workflowName: string;
    timezone: string;
  }>;
}

export class WorkflowOrchestrator {
  constructor(private config: YamlConfig, private outputDir: string) {}

  async generateWorkflowSystem(): Promise<WorkflowConfig> {
    console.log('⚙️ Generating workflow orchestration system...');

    // Extract workflow requirements from YAML
    const workflowConfig = this.extractWorkflowConfig();
    
    // Generate Temporal workflow definitions
    await this.generateTemporalWorkflows(workflowConfig);
    
    // Generate worker configuration
    await this.generateWorkerConfig(workflowConfig);
    
    // Generate workflow client utilities
    await this.generateWorkflowClient(workflowConfig);
    
    // Generate workflow monitoring
    await this.generateWorkflowMonitoring(workflowConfig);
    
    // Generate Docker configuration for Temporal
    await this.generateTemporalDocker();
    
    // Generate workflow API endpoints
    await this.generateWorkflowAPI(workflowConfig);

    console.log('✅ Workflow orchestration system generated successfully');
    return workflowConfig;
  }

  private extractWorkflowConfig(): WorkflowConfig {
    const workflows = this.config.workflows || [];
    const entities = this.config.entities || {};
    const integrations = this.config.apis?.integrations || [];

    const generatedWorkflows: any[] = [];
    const schedules: any[] = [];

    // Generate workflows from YAML configuration
    workflows.forEach((workflow: any) => {
      const workflowDef = {
        name: workflow.name,
        description: workflow.description || `Automated workflow for ${workflow.name}`,
        trigger: workflow.trigger || { type: 'manual', config: {} },
        steps: this.generateWorkflowSteps(workflow, entities, integrations),
        timeout: workflow.timeout || 300000, // 5 minutes default
        retryPolicy: {
          maximumAttempts: workflow.retryPolicy?.maximumAttempts || 3,
          backoffCoefficient: workflow.retryPolicy?.backoffCoefficient || 2.0
        }
      };

      generatedWorkflows.push(workflowDef);

      // Add schedule if specified
      if (workflow.schedule) {
        schedules.push({
          name: `${workflow.name}_schedule`,
          cronExpression: workflow.schedule.cron || '0 0 * * *', // Daily at midnight
          workflowName: workflow.name,
          timezone: workflow.schedule.timezone || 'UTC'
        });
      }
    });

    // Generate default business workflows based on entities
    Object.entries(entities).forEach(([entityName, entity]: [string, any]) => {
      // Data validation workflow
      generatedWorkflows.push({
        name: `validate_${entityName.toLowerCase()}_data`,
        description: `Validate and clean ${entityName} data`,
        trigger: { type: 'event', config: { entityType: entityName, action: 'created' } },
        steps: [
          {
            name: 'validate_required_fields',
            type: 'data_validation',
            config: {
              entity: entityName,
              rules: this.generateValidationRules(entity)
            }
          },
          {
            name: 'enrich_data',
            type: 'api_call',
            config: {
              service: 'data_enrichment',
              endpoint: '/enrich',
              method: 'POST'
            }
          },
          {
            name: 'update_analytics',
            type: 'database_operation',
            config: {
              action: 'insert',
              table: 'analytics_events',
              data: {
                eventType: 'entity_created',
                entityType: entityName
              }
            }
          }
        ],
        timeout: 60000,
        retryPolicy: { maximumAttempts: 2, backoffCoefficient: 1.5 }
      });

      // Data sync workflow for external integrations
      if (integrations.length > 0) {
        generatedWorkflows.push({
          name: `sync_${entityName.toLowerCase()}_to_external`,
          description: `Sync ${entityName} data to external systems`,
          trigger: { type: 'event', config: { entityType: entityName, action: 'updated' } },
          steps: integrations.map((integration: any) => ({
            name: `sync_to_${integration.name}`,
            type: 'api_call',
            config: {
              service: integration.name,
              endpoint: integration.endpoints?.create || '/api/sync',
              method: 'POST',
              auth: integration.authentication
            },
            errorHandling: {
              retries: 3,
              backoff: 'exponential',
              fallback: { action: 'log_error', notify: true }
            }
          })),
          timeout: 180000,
          retryPolicy: { maximumAttempts: 3, backoffCoefficient: 2.0 }
        });
      }
    });

    // Generate scheduled workflows
    schedules.push(
      {
        name: 'daily_data_quality_check',
        cronExpression: '0 2 * * *', // 2 AM daily
        workflowName: 'data_quality_audit',
        timezone: 'UTC'
      },
      {
        name: 'weekly_analytics_report',
        cronExpression: '0 9 * * 1', // Monday 9 AM
        workflowName: 'generate_analytics_report',
        timezone: 'UTC'
      },
      {
        name: 'hourly_health_check',
        cronExpression: '0 * * * *', // Every hour
        workflowName: 'system_health_check',
        timezone: 'UTC'
      }
    );

    // Add system maintenance workflows
    generatedWorkflows.push(
      {
        name: 'data_quality_audit',
        description: 'Comprehensive data quality audit across all entities',
        trigger: { type: 'schedule', config: {} },
        steps: [
          {
            name: 'check_data_completeness',
            type: 'data_validation',
            config: { checkType: 'completeness' }
          },
          {
            name: 'check_data_consistency',
            type: 'data_validation',
            config: { checkType: 'consistency' }
          },
          {
            name: 'generate_quality_report',
            type: 'calculation',
            config: { operation: 'aggregate_quality_metrics' }
          },
          {
            name: 'send_quality_alert',
            type: 'notification',
            config: {
              condition: 'quality_score < 80',
              channels: ['email', 'slack'],
              severity: 'medium'
            }
          }
        ],
        timeout: 600000,
        retryPolicy: { maximumAttempts: 2, backoffCoefficient: 1.5 }
      },
      {
        name: 'generate_analytics_report',
        description: 'Generate comprehensive analytics and business intelligence report',
        trigger: { type: 'schedule', config: {} },
        steps: [
          {
            name: 'collect_metrics',
            type: 'database_operation',
            config: { action: 'aggregate', tables: ['analytics_events', 'business_metrics'] }
          },
          {
            name: 'generate_insights',
            type: 'calculation',
            config: { operation: 'business_intelligence_analysis' }
          },
          {
            name: 'create_report',
            type: 'api_call',
            config: { service: 'report_generator', endpoint: '/generate', method: 'POST' }
          },
          {
            name: 'distribute_report',
            type: 'notification',
            config: { channels: ['email'], recipients: ['admin', 'stakeholders'] }
          }
        ],
        timeout: 900000,
        retryPolicy: { maximumAttempts: 3, backoffCoefficient: 2.0 }
      },
      {
        name: 'system_health_check',
        description: 'Monitor system health and performance',
        trigger: { type: 'schedule', config: {} },
        steps: [
          {
            name: 'check_database_health',
            type: 'database_operation',
            config: { action: 'health_check' }
          },
          {
            name: 'check_api_endpoints',
            type: 'api_call',
            config: { service: 'health_monitor', endpoint: '/health', method: 'GET' }
          },
          {
            name: 'check_integration_status',
            type: 'parallel',
            config: {
              steps: integrations.map((integration: any) => ({
                name: `check_${integration.name}`,
                type: 'api_call',
                config: { service: integration.name, endpoint: '/health', method: 'GET' }
              }))
            }
          },
          {
            name: 'alert_on_issues',
            type: 'conditional',
            config: {
              condition: 'any_health_check_failed',
              then: {
                type: 'notification',
                config: { channels: ['slack', 'email'], severity: 'high' }
              }
            }
          }
        ],
        timeout: 120000,
        retryPolicy: { maximumAttempts: 2, backoffCoefficient: 1.5 }
      }
    );

    return {
      workflows: generatedWorkflows,
      schedules
    };
  }

  private generateWorkflowSteps(workflow: any, entities: any, integrations: any[]): any[] {
    if (workflow.steps) {
      return workflow.steps.map((step: any) => ({
        name: step.name,
        type: step.type || 'api_call',
        config: step.config || {},
        errorHandling: step.errorHandling || {
          retries: 3,
          backoff: 'exponential',
          fallback: { action: 'log_error' }
        }
      }));
    }

    // Generate default steps based on workflow type
    const defaultSteps = [];

    if (workflow.type === 'data_processing') {
      defaultSteps.push(
        { name: 'validate_input', type: 'data_validation', config: {} },
        { name: 'process_data', type: 'calculation', config: {} },
        { name: 'save_results', type: 'database_operation', config: {} }
      );
    } else if (workflow.type === 'integration_sync') {
      defaultSteps.push(
        { name: 'fetch_data', type: 'database_operation', config: {} },
        { name: 'transform_data', type: 'calculation', config: {} },
        { name: 'sync_to_external', type: 'api_call', config: {} }
      );
    }

    return defaultSteps;
  }

  private generateValidationRules(entity: any): any {
    const rules: any = {};

    if (entity.fields) {
      Object.entries(entity.fields).forEach(([fieldName, field]: [string, any]) => {
        if (field.required) {
          rules[fieldName] = { required: true };
        }
        if (field.unique) {
          rules[fieldName] = { ...rules[fieldName], unique: true };
        }
        if (field.validation) {
          rules[fieldName] = { ...rules[fieldName], ...field.validation };
        }
      });
    }

    return rules;
  }

  private async generateTemporalWorkflows(workflowConfig: WorkflowConfig): Promise<void> {
    const workflowsDir = path.join(this.outputDir, 'workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });

    // Generate workflow definitions
    workflowConfig.workflows.forEach(workflow => {
      const workflowCode = `
import { proxyActivities, defineQuery, defineSignal, setHandler, condition } from '@temporalio/workflow';
import type { WorkflowActivities } from '../activities/workflow-activities';

const activities = proxyActivities<WorkflowActivities>({
  startToCloseTimeout: '${workflow.timeout}ms',
  retry: {
    maximumAttempts: ${workflow.retryPolicy.maximumAttempts},
    backoffCoefficient: ${workflow.retryPolicy.backoffCoefficient},
  },
});

// Queries and signals for workflow interaction
export const getWorkflowStatusQuery = defineQuery<string>('getWorkflowStatus');
export const pauseWorkflowSignal = defineSignal<void>('pauseWorkflow');
export const resumeWorkflowSignal = defineSignal<void>('resumeWorkflow');
export const cancelWorkflowSignal = defineSignal<void>('cancelWorkflow');

interface ${this.toPascalCase(workflow.name)}Input {
  entityId?: string;
  data?: any;
  metadata?: any;
}

export async function ${this.toCamelCase(workflow.name)}(input: ${this.toPascalCase(workflow.name)}Input): Promise<any> {
  let workflowStatus = 'running';
  let isPaused = false;
  let isCancelled = false;

  // Set up query and signal handlers
  setHandler(getWorkflowStatusQuery, () => workflowStatus);
  
  setHandler(pauseWorkflowSignal, () => {
    isPaused = true;
    workflowStatus = 'paused';
  });
  
  setHandler(resumeWorkflowSignal, () => {
    isPaused = false;
    workflowStatus = 'running';
  });
  
  setHandler(cancelWorkflowSignal, () => {
    isCancelled = true;
    workflowStatus = 'cancelled';
  });

  try {
    console.log('Starting workflow: ${workflow.name}', input);
    
${workflow.steps.map((step, index) => `
    // Step ${index + 1}: ${step.name}
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: '${step.name}' };
    }
    
    // Wait if paused
    await condition(() => !isPaused || isCancelled);
    
    if (isCancelled) {
      workflowStatus = 'cancelled';
      return { status: 'cancelled', step: '${step.name}' };
    }
    
    console.log('Executing step: ${step.name}');
    const step${index + 1}Result = await activities.${this.getActivityMethod(step)}({
      stepName: '${step.name}',
      stepType: '${step.type}',
      config: ${JSON.stringify(step.config)},
      input: input,
      previousResult: ${index > 0 ? `step${index}Result` : 'null'}
    });
    
    if (!step${index + 1}Result.success) {
      console.error('Step ${step.name} failed:', step${index + 1}Result.error);
      ${step.errorHandling ? 'throw new Error(`Step ${step.name} failed: ${step${index + 1}Result.error}`);' : ''}
    }
`).join('')}
    
    workflowStatus = 'completed';
    console.log('Workflow ${workflow.name} completed successfully');
    
    return {
      status: 'completed',
      workflowName: '${workflow.name}',
      input: input,
      results: {
${workflow.steps.map((_, index) => `        step${index + 1}: step${index + 1}Result`).join(',\n')}
      }
    };
    
  } catch (error) {
    workflowStatus = 'failed';
    console.error('Workflow ${workflow.name} failed:', error);
    
    // Log workflow failure
    await activities.logWorkflowEvent({
      workflowName: '${workflow.name}',
      eventType: 'workflow_failed',
      error: error.message,
      input: input
    });
    
    throw error;
  }
}
`;

      fs.writeFileSync(
        path.join(workflowsDir, `${this.toKebabCase(workflow.name)}.ts`),
        workflowCode
      );
    });

    console.log(`📝 Generated ${workflowConfig.workflows.length} workflow definitions`);
  }

  private getActivityMethod(step: any): string {
    switch (step.type) {
      case 'data_validation': return 'validateData';
      case 'api_call': return 'makeApiCall';
      case 'database_operation': return 'performDatabaseOperation';
      case 'notification': return 'sendNotification';
      case 'calculation': return 'performCalculation';
      case 'conditional': return 'evaluateCondition';
      case 'parallel': return 'executeParallel';
      case 'wait': return 'waitForDuration';
      default: return 'executeGenericStep';
    }
  }

  private async generateWorkerConfig(workflowConfig: WorkflowConfig): Promise<void> {
    const activitiesCode = `
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
            errors.push(\`Field \${field} is required\`);
          }
          
          if (rules.unique && value) {
            // Check uniqueness in database (simplified)
            // In real implementation, this would check the database
          }
          
          if (rules.min && typeof value === 'number' && value < rules.min) {
            errors.push(\`Field \${field} must be at least \${rules.min}\`);
          }
          
          if (rules.max && typeof value === 'number' && value > rules.max) {
            errors.push(\`Field \${field} must be at most \${rules.max}\`);
          }
        });
      }
      
      const isValid = errors.length === 0;
      
      // Log validation result
      await AuditService.logSystemEvent({
        level: isValid ? 'INFO' : 'WARN',
        message: \`Data validation \${isValid ? 'passed' : 'failed'} for step \${params.stepName}\`,
        source: 'workflow_engine',
        context: { errors, stepName: params.stepName }
      });
      
      return {
        success: isValid,
        data: { valid: isValid, errors },
        error: isValid ? undefined : \`Validation failed: \${errors.join(', ')}\`
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
          requestConfig.headers['Authorization'] = \`Bearer \${auth.token}\`;
        } else if (auth.type === 'api_key') {
          requestConfig.headers[auth.header || 'X-API-Key'] = auth.key;
        }
      }
      
      // Add request body for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        requestConfig.body = JSON.stringify(params.input.data || {});
      }
      
      // Make the API call
      const baseUrl = process.env[\`\${service.toUpperCase()}_BASE_URL\`] || 'http://localhost:3000';
      const response = await fetch(\`\${baseUrl}\${endpoint}\`, requestConfig);
      
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
        message: \`API call \${success ? 'succeeded' : 'failed'} for step \${params.stepName}\`,
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
        error: success ? undefined : \`API call failed: \${response.status} \${response.statusText}\`,
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
          result = await prisma.$queryRaw\`SELECT 1 as health_check\`;
          break;
          
        default:
          throw new Error(\`Unsupported database action: \${action}\`);
      }
      
      // Log database operation
      await AuditService.logSystemEvent({
        level: 'INFO',
        message: \`Database operation \${action} completed for step \${params.stepName}\`,
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
                subject: subject || \`Workflow Notification: \${params.stepName}\`,
                message: message || \`Step \${params.stepName} completed\`,
                severity
              });
              break;
              
            case 'slack':
              // Slack notification implementation
              notificationResult = await this.sendSlackNotification({
                message: message || \`Step \${params.stepName} completed\`,
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
              console.warn(\`Unsupported notification channel: \${channel}\`);
          }
          
          notifications.push({
            channel,
            success: !!notificationResult,
            result: notificationResult
          });
          
        } catch (error) {
          console.error(\`Failed to send \${channel} notification:\`, error);
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
        return { success: false, error: \`Unknown step type: \${step.type}\` };
      });
      
      const results = await Promise.allSettled(promises);
      const successfulResults = [];
      const errors = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulResults.push(result.value);
        } else {
          errors.push(\`Step \${steps[index].name}: \${result.reason}\`);
        }
      });
      
      const allSuccessful = errors.length === 0;
      
      return {
        success: allSuccessful,
        data: { results: successfulResults },
        error: allSuccessful ? undefined : \`Parallel execution errors: \${errors.join(', ')}\`
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
    
    console.log(\`Waiting for \${duration}ms\`);
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
      data: { message: \`Generic step \${params.stepName} executed\` }
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
      message: \`Workflow event: \${params.eventType}\`,
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
`;

    const activitiesPath = path.join(this.outputDir, 'activities');
    fs.mkdirSync(activitiesPath, { recursive: true });
    fs.writeFileSync(
      path.join(activitiesPath, 'workflow-activities.ts'),
      activitiesCode
    );

    // Generate worker configuration
    const workerCode = `
import { Worker } from '@temporalio/worker';
import { WorkflowActivities } from './workflow-activities';
import * as workflows from '../workflows';

async function runWorker() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('../workflows'),
    activities: WorkflowActivities,
    taskQueue: 'default',
    // Configure worker options
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 10,
  });

  console.log('🚀 Temporal worker started');
  await worker.run();
}

runWorker().catch((err) => {
  console.error('❌ Worker failed:', err);
  process.exit(1);
});
`;

    fs.writeFileSync(
      path.join(activitiesPath, 'worker.ts'),
      workerCode
    );

    console.log('⚙️ Generated workflow activities and worker configuration');
  }

  private async generateWorkflowClient(workflowConfig: WorkflowConfig): Promise<void> {
    const clientCode = `
import { Client, Connection, WorkflowHandle } from '@temporalio/client';
${workflowConfig.workflows.map(workflow => 
  `import { ${this.toCamelCase(workflow.name)} } from '../workflows/${this.toKebabCase(workflow.name)}';`
).join('\n')}

export class WorkflowClient {
  private client: Client;

  constructor() {
    this.client = new Client({
      connection: Connection.lazy(),
    });
  }

  // Start workflow methods
${workflowConfig.workflows.map(workflow => `
  async start${this.toPascalCase(workflow.name)}(input: any, options?: any): Promise<WorkflowHandle> {
    const workflowId = options?.workflowId || \`\${Date.now()}-${workflow.name}\`;
    
    return await this.client.workflow.start(${this.toCamelCase(workflow.name)}, {
      workflowId,
      taskQueue: 'default',
      args: [input],
      ...options
    });
  }

  async execute${this.toPascalCase(workflow.name)}(input: any, options?: any): Promise<any> {
    const workflowId = options?.workflowId || \`\${Date.now()}-${workflow.name}\`;
    
    return await this.client.workflow.execute(${this.toCamelCase(workflow.name)}, {
      workflowId,
      taskQueue: 'default',
      args: [input],
      ...options
    });
  }`).join('')}

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
    const schedules = ${JSON.stringify(workflowConfig.schedules, null, 2)};
    
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
        
        console.log(\`✅ Created schedule: \${schedule.name}\`);
      } catch (error) {
        console.error(\`❌ Failed to create schedule \${schedule.name}:\`, error);
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
`;

    const clientDir = path.join(this.outputDir, 'lib', 'workflow');
    fs.mkdirSync(clientDir, { recursive: true });
    fs.writeFileSync(
      path.join(clientDir, 'WorkflowClient.ts'),
      clientCode
    );

    console.log('📱 Generated workflow client utilities');
  }

  private async generateWorkflowMonitoring(workflowConfig: WorkflowConfig): Promise<void> {
    const monitoringCode = `
import { workflowClient } from './WorkflowClient';
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../analytics/AuditService';

const prisma = new PrismaClient();

export class WorkflowMonitoringService {
  
  static async getWorkflowMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<any> {
    const hoursMap = { '1h': 1, '24h': 24, '7d': 168, '30d': 720 };
    const hours = hoursMap[timeRange];
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metrics = await prisma.$queryRaw\`
      SELECT 
        source,
        level,
        COUNT(*) as count,
        DATE_TRUNC('hour', timestamp) as hour
      FROM system_logs 
      WHERE source = 'workflow_engine' 
        AND timestamp >= \${startTime}
      GROUP BY source, level, DATE_TRUNC('hour', timestamp)
      ORDER BY hour DESC
    \`;

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
      const newWorkflowId = \`retry-\${workflowId}-\${Date.now()}\`;
      // This would require storing original input, which would be in a real implementation
      
      await AuditService.logSystemEvent({
        level: 'INFO',
        message: \`Retrying failed workflow: \${workflowId}\`,
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
        totalWorkflows: ${workflowConfig.workflows.length},
        totalSchedules: ${workflowConfig.schedules.length},
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
    const match = message.match(/Workflow (\\w+) failed/);
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
`;

    const clientDir = path.join(this.outputDir, 'lib', 'workflow');
    fs.writeFileSync(
      path.join(clientDir, 'WorkflowMonitoringService.ts'),
      monitoringCode
    );

    console.log('📊 Generated workflow monitoring service');
  }

  private async generateTemporalDocker(): Promise<void> {
    const dockerCompose = `
version: '3.8'

services:
  temporal:
    container_name: temporal
    depends_on:
      - postgresql
      - elasticsearch
    environment:
      - DB=postgresql
      - DB_PORT=5432
      - POSTGRES_USER=temporal
      - POSTGRES_PWD=temporal
      - POSTGRES_SEEDS=postgresql
      - DYNAMIC_CONFIG_FILE_PATH=config/dynamicconfig/development-sql.yaml
      - ENABLE_ES=true
      - ES_SEEDS=elasticsearch
      - ES_VERSION=v7
    image: temporalio/auto-setup:1.20.0
    networks:
      - temporal-network
    ports:
      - 7233:7233
    volumes:
      - ./dynamicconfig:/etc/temporal/config/dynamicconfig

  temporal-ui:
    container_name: temporal-ui
    depends_on:
      - temporal
    environment:
      - TEMPORAL_ADDRESS=temporal:7233
      - TEMPORAL_CORS_ORIGINS=http://localhost:3000
    image: temporalio/ui:2.10.3
    networks:
      - temporal-network
    ports:
      - 8080:8080

  postgresql:
    container_name: temporal-postgresql
    environment:
      POSTGRES_PASSWORD: temporal
      POSTGRES_USER: temporal
    image: postgres:13
    networks:
      - temporal-network
    ports:
      - 5432:5432
    volumes:
      - temporal_postgresql:/var/lib/postgresql/data

  elasticsearch:
    container_name: temporal-elasticsearch
    environment:
      - cluster.routing.allocation.disk.threshold_enabled=true
      - cluster.routing.allocation.disk.watermark.low=512mb
      - cluster.routing.allocation.disk.watermark.high=256mb
      - cluster.routing.allocation.disk.watermark.flood_stage=128mb
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms256m -Xmx256m
      - xpack.security.enabled=false
    image: elasticsearch:7.16.2
    networks:
      - temporal-network
    ports:
      - 9200:9200
    volumes:
      - temporal_elasticsearch:/usr/share/elasticsearch/data

networks:
  temporal-network:
    driver: bridge
    name: temporal-network

volumes:
  temporal_postgresql:
  temporal_elasticsearch:
`;

    const temporalDir = path.join(this.outputDir, 'temporal');
    fs.mkdirSync(temporalDir, { recursive: true });
    
    fs.writeFileSync(
      path.join(temporalDir, 'docker-compose.yml'),
      dockerCompose
    );

    // Generate dynamic config
    const dynamicConfig = `
system.forceSearchAttributesCacheRefreshOnRead:
  - value: true
    constraints: {}

system.enableLoggerRateLimiting:
  - value: true
    constraints: {}
`;

    const dynamicConfigDir = path.join(temporalDir, 'dynamicconfig');
    fs.mkdirSync(dynamicConfigDir, { recursive: true });
    
    fs.writeFileSync(
      path.join(dynamicConfigDir, 'development-sql.yaml'),
      dynamicConfig
    );

    // Add scripts to package.json
    const packageJsonPath = path.join(this.outputDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      packageJson.scripts = {
        ...packageJson.scripts,
        'temporal:start': 'cd temporal && docker-compose up -d',
        'temporal:stop': 'cd temporal && docker-compose down',
        'temporal:logs': 'cd temporal && docker-compose logs -f',
        'temporal:reset': 'cd temporal && docker-compose down -v && docker-compose up -d',
        'temporal:worker': 'ts-node activities/worker.ts',
        'temporal:ui': 'open http://localhost:8080'
      };
      
      // Add Temporal dependencies
      packageJson.dependencies = {
        ...packageJson.dependencies,
        '@temporalio/client': '^1.8.0',
        '@temporalio/worker': '^1.8.0',
        '@temporalio/workflow': '^1.8.0',
        '@temporalio/activity': '^1.8.0'
      };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    console.log('🐳 Generated Temporal Docker configuration');
  }

  private async generateWorkflowAPI(workflowConfig: WorkflowConfig): Promise<void> {
    const apiDir = path.join(this.outputDir, 'app', 'api', 'workflows');
    fs.mkdirSync(apiDir, { recursive: true });

    // Generate workflow management API
    const workflowApiCode = `
import { NextRequest, NextResponse } from 'next/server';
import { workflowClient } from '../../../../lib/workflow/WorkflowClient';
import { WorkflowMonitoringService } from '../../../../lib/workflow/WorkflowMonitoringService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const workflowId = searchParams.get('workflowId');

    switch (action) {
      case 'health':
        const health = await WorkflowMonitoringService.getWorkflowHealth();
        return NextResponse.json(health);

      case 'metrics':
        const timeRange = searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h';
        const metrics = await WorkflowMonitoringService.getWorkflowMetrics(timeRange);
        return NextResponse.json(metrics);

      case 'active':
        const activeWorkflows = await WorkflowMonitoringService.getActiveWorkflows();
        return NextResponse.json(activeWorkflows);

      case 'failed':
        const limit = parseInt(searchParams.get('limit') || '10');
        const failedWorkflows = await WorkflowMonitoringService.getFailedWorkflows(limit);
        return NextResponse.json(failedWorkflows);

      case 'report':
        const report = await WorkflowMonitoringService.generateWorkflowReport();
        return NextResponse.json(report);

      case 'status':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        const status = await workflowClient.getWorkflowStatus(workflowId);
        return NextResponse.json({ workflowId, status });

      case 'schedules':
        const schedules = await workflowClient.listSchedules();
        return NextResponse.json(schedules);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Workflow API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workflowName, workflowId, input = {} } = body;

    switch (action) {
      case 'start':
        if (!workflowName) {
          return NextResponse.json({ error: 'workflowName required' }, { status: 400 });
        }

        let result;
        switch (workflowName) {
${workflowConfig.workflows.map(workflow => `
          case '${workflow.name}':
            result = await workflowClient.start${this.toPascalCase(workflow.name)}(input, { workflowId });
            break;`).join('')}
          default:
            return NextResponse.json({ error: 'Unknown workflow' }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          workflowId: result.workflowId,
          runId: result.firstExecutionRunId
        });

      case 'execute':
        if (!workflowName) {
          return NextResponse.json({ error: 'workflowName required' }, { status: 400 });
        }

        let executeResult;
        switch (workflowName) {
${workflowConfig.workflows.map(workflow => `
          case '${workflow.name}':
            executeResult = await workflowClient.execute${this.toPascalCase(workflow.name)}(input, { workflowId });
            break;`).join('')}
          default:
            return NextResponse.json({ error: 'Unknown workflow' }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          result: executeResult
        });

      case 'cancel':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        await workflowClient.cancelWorkflow(workflowId);
        return NextResponse.json({ success: true, message: 'Workflow cancelled' });

      case 'terminate':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        await workflowClient.terminateWorkflow(workflowId, body.reason);
        return NextResponse.json({ success: true, message: 'Workflow terminated' });

      case 'pause':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        await workflowClient.pauseWorkflow(workflowId);
        return NextResponse.json({ success: true, message: 'Workflow paused' });

      case 'resume':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        await workflowClient.resumeWorkflow(workflowId);
        return NextResponse.json({ success: true, message: 'Workflow resumed' });

      case 'retry':
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        const retryResult = await WorkflowMonitoringService.retryFailedWorkflow(workflowId);
        return NextResponse.json(retryResult);

      case 'setup_schedules':
        await workflowClient.startScheduledWorkflows();
        return NextResponse.json({ success: true, message: 'Schedules created' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Workflow API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
`;

    fs.writeFileSync(path.join(apiDir, 'route.ts'), workflowApiCode);

    console.log('🔌 Generated workflow management API');
  }

  // Utility methods
  private toPascalCase(str: string): string {
    return str.replace(/(^|_)(\w)/g, (_, __, letter) => letter.toUpperCase());
  }

  private toCamelCase(str: string): string {
    return str.replace(/_(\w)/g, (_, letter) => letter.toUpperCase());
  }

  private toKebabCase(str: string): string {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '').replace(/_/g, '-');
  }
}