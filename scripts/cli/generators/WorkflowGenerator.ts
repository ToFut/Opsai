import * as fs from 'fs';
import * as path from 'path';
import { AppConfig, Workflow } from './ConfigParser';

export class WorkflowGenerator {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async generateWorkflows(outputDir: string): Promise<void> {
    if (!this.config.workflows || this.config.workflows.length === 0) {
      console.log('ℹ️  No workflows to generate');
      return;
    }

    const workflowsDir = path.join(outputDir, 'src', 'workflows');
    fs.mkdirSync(workflowsDir, { recursive: true });

    // Generate workflow engine
    await this.generateWorkflowEngine(workflowsDir);

    // Generate workflow definitions
    for (const workflow of this.config.workflows) {
      await this.generateWorkflowDefinition(workflowsDir, workflow);
    }

    // Generate workflow scheduler
    await this.generateWorkflowScheduler(workflowsDir);

    // Generate workflow index
    await this.generateWorkflowIndex(workflowsDir);

    console.log('✅ Workflow engines generated');
  }

  private async generateWorkflowEngine(workflowsDir: string): Promise<void> {
    const engineContent = this.buildWorkflowEngine();
    const enginePath = path.join(workflowsDir, 'engine.ts');
    
    fs.writeFileSync(enginePath, engineContent);
    console.log(`📄 Generated workflow engine: ${enginePath}`);
  }

  private buildWorkflowEngine(): string {
    return `
import { PrismaClient } from '@prisma/client';
import { integrations } from '../integrations';

const prisma = new PrismaClient();

export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  name: string;
  config: any;
  nextSteps?: string[];
  conditions?: any;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowStep;
  steps: WorkflowStep[];
  active: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  currentStep?: string;
  context: any;
  logs: WorkflowLog[];
}

export interface WorkflowLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  stepId?: string;
  data?: any;
}

export class WorkflowEngine {
  private executions = new Map<string, WorkflowExecution>();
  private workflows = new Map<string, WorkflowDefinition>();

  constructor() {
    this.initializeWorkflows();
  }

  private async initializeWorkflows(): Promise<void> {
    // Load workflow definitions from database or config
    // This will be populated by generated workflow definitions
  }

  async registerWorkflow(workflow: WorkflowDefinition): Promise<void> {
    this.workflows.set(workflow.id, workflow);
    console.log(\`📋 Registered workflow: \${workflow.name}\`);
  }

  async executeWorkflow(workflowId: string, triggerData: any = {}): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(\`Workflow not found: \${workflowId}\`);
    }

    if (!workflow.active) {
      throw new Error(\`Workflow is not active: \${workflow.name}\`);
    }

    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startedAt: new Date(),
      context: triggerData,
      logs: []
    };

    this.executions.set(executionId, execution);
    this.log(execution, 'info', \`Starting workflow execution: \${workflow.name}\`);

    try {
      await this.executeStep(execution, workflow.trigger);
      execution.status = 'completed';
      execution.completedAt = new Date();
      this.log(execution, 'info', 'Workflow completed successfully');
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      this.log(execution, 'error', \`Workflow failed: \${error.message}\`, undefined, error);
    }

    return executionId;
  }

  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    execution.currentStep = step.id;
    this.log(execution, 'info', \`Executing step: \${step.name}\`, step.id);

    let result: any;

    try {
      switch (step.type) {
        case 'trigger':
          result = await this.executeTrigger(execution, step);
          break;
        case 'action':
          result = await this.executeAction(execution, step);
          break;
        case 'condition':
          result = await this.executeCondition(execution, step);
          break;
        default:
          throw new Error(\`Unknown step type: \${step.type}\`);
      }

      this.log(execution, 'info', \`Step completed: \${step.name}\`, step.id, result);

      // Execute next steps
      if (step.nextSteps) {
        const workflow = this.workflows.get(execution.workflowId)!;
        for (const nextStepId of step.nextSteps) {
          const nextStep = workflow.steps.find(s => s.id === nextStepId);
          if (nextStep) {
            await this.executeStep(execution, nextStep);
          }
        }
      }

      return result;
    } catch (error) {
      this.log(execution, 'error', \`Step failed: \${step.name}\`, step.id, error);
      throw error;
    }
  }

  private async executeTrigger(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    // Triggers are typically handled by external events
    // This method processes the trigger data
    return execution.context;
  }

  private async executeAction(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { actionType, config } = step.config;

    switch (actionType) {
      case 'database':
        return await this.executeDatabaseAction(execution, config);
      
      case 'api':
        return await this.executeAPIAction(execution, config);
      
      case 'email':
        return await this.executeEmailAction(execution, config);
      
      case 'webhook':
        return await this.executeWebhookAction(execution, config);
      
      case 'delay':
        return await this.executeDelayAction(execution, config);
      
      default:
        throw new Error(\`Unknown action type: \${actionType}\`);
    }
  }

  private async executeCondition(execution: WorkflowExecution, step: WorkflowStep): Promise<boolean> {
    const { conditionType, config } = step.config;

    switch (conditionType) {
      case 'value':
        return this.evaluateValueCondition(execution.context, config);
      
      case 'database':
        return await this.evaluateDatabaseCondition(execution, config);
      
      case 'api':
        return await this.evaluateAPICondition(execution, config);
      
      default:
        throw new Error(\`Unknown condition type: \${conditionType}\`);
    }
  }

  private async executeDatabaseAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { operation, model, data, where } = config;

    switch (operation) {
      case 'create':
        return await (prisma as any)[model].create({ data: this.resolveVariables(data, execution.context) });
      
      case 'update':
        return await (prisma as any)[model].update({
          where: this.resolveVariables(where, execution.context),
          data: this.resolveVariables(data, execution.context)
        });
      
      case 'delete':
        return await (prisma as any)[model].delete({
          where: this.resolveVariables(where, execution.context)
        });
      
      case 'findMany':
        return await (prisma as any)[model].findMany({
          where: this.resolveVariables(where, execution.context)
        });
      
      default:
        throw new Error(\`Unknown database operation: \${operation}\`);
    }
  }

  private async executeAPIAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { integration, method, endpoint, data } = config;
    
    const client = (integrations as any)[integration];
    if (!client) {
      throw new Error(\`Integration not found: \${integration}\`);
    }

    const resolvedData = this.resolveVariables(data, execution.context);
    
    // Call the appropriate method on the integration client
    if (typeof client[method] === 'function') {
      return await client[method](resolvedData);
    } else {
      throw new Error(\`Method not found on integration \${integration}: \${method}\`);
    }
  }

  private async executeEmailAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { to, subject, body, template } = config;
    
    const resolvedTo = this.resolveVariables(to, execution.context);
    const resolvedSubject = this.resolveVariables(subject, execution.context);
    const resolvedBody = this.resolveVariables(body, execution.context);

    // Use email service integration
    const emailService = (integrations as any).emailService;
    if (emailService) {
      return await emailService.sendEmail({
        to: resolvedTo,
        subject: resolvedSubject,
        body: resolvedBody,
        template
      });
    } else {
      console.log(\`📧 Email would be sent to \${resolvedTo}: \${resolvedSubject}\`);
      return { sent: true, to: resolvedTo };
    }
  }

  private async executeWebhookAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { url, method, headers, data } = config;
    
    const resolvedUrl = this.resolveVariables(url, execution.context);
    const resolvedData = this.resolveVariables(data, execution.context);

    const response = await fetch(resolvedUrl, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(resolvedData)
    });

    return await response.json();
  }

  private async executeDelayAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { duration } = config;
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ delayed: duration });
      }, duration);
    });
  }

  private evaluateValueCondition(context: any, config: any): boolean {
    const { field, operator, value } = config;
    const fieldValue = this.getNestedValue(context, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return fieldValue > value;
      case 'less_than':
        return fieldValue < value;
      case 'contains':
        return String(fieldValue).includes(value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  private async evaluateDatabaseCondition(execution: WorkflowExecution, config: any): Promise<boolean> {
    const { model, where, operation = 'exists' } = config;
    
    const resolvedWhere = this.resolveVariables(where, execution.context);
    
    switch (operation) {
      case 'exists':
        const record = await (prisma as any)[model].findFirst({ where: resolvedWhere });
        return !!record;
      case 'count':
        const count = await (prisma as any)[model].count({ where: resolvedWhere });
        return count > 0;
      default:
        return false;
    }
  }

  private async evaluateAPICondition(execution: WorkflowExecution, config: any): Promise<boolean> {
    const { integration, method, expectedValue } = config;
    
    try {
      const result = await this.executeAPIAction(execution, config);
      return result === expectedValue;
    } catch (error) {
      return false;
    }
  }

  private resolveVariables(template: any, context: any): any {
    if (typeof template === 'string') {
      return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        return this.getNestedValue(context, path.trim()) || match;
      });
    } else if (Array.isArray(template)) {
      return template.map(item => this.resolveVariables(item, context));
    } else if (typeof template === 'object' && template !== null) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(template)) {
        resolved[key] = this.resolveVariables(value, context);
      }
      return resolved;
    }
    return template;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private log(execution: WorkflowExecution, level: 'info' | 'warn' | 'error', message: string, stepId?: string, data?: any): void {
    const log: WorkflowLog = {
      timestamp: new Date(),
      level,
      message,
      stepId,
      data
    };
    
    execution.logs.push(log);
    console.log(\`[\${level.toUpperCase()}] \${execution.id}: \${message}\`);
  }

  private generateExecutionId(): string {
    return \`exec_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  getWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();
`.trim();
  }

  private async generateWorkflowDefinition(workflowsDir: string, workflow: Workflow): Promise<void> {
    const workflowContent = this.buildWorkflowDefinition(workflow);
    const workflowPath = path.join(workflowsDir, `${workflow.name}.ts`);
    
    fs.writeFileSync(workflowPath, workflowContent);
    console.log(`📄 Generated workflow definition: ${workflow.name}`);
  }

  private buildWorkflowDefinition(workflow: Workflow): string {
    const workflowName = this.toPascalCase(workflow.name);
    
    return `
import { WorkflowDefinition, workflowEngine } from './engine';

export const ${this.toCamelCase(workflow.name)}Workflow: WorkflowDefinition = {
  id: '${workflow.name}',
  name: '${workflow.displayName || workflow.name}',
  description: '${workflow.description || `Generated workflow: ${workflow.name}`}',
  active: true,
  trigger: ${JSON.stringify(workflow.trigger, null, 2)},
  steps: ${JSON.stringify(workflow.steps || [], null, 2)}
};

// Auto-register workflow
workflowEngine.registerWorkflow(${this.toCamelCase(workflow.name)}Workflow);

export default ${this.toCamelCase(workflow.name)}Workflow;
`.trim();
  }

  private async generateWorkflowScheduler(workflowsDir: string): Promise<void> {
    const schedulerContent = this.buildWorkflowScheduler();
    const schedulerPath = path.join(workflowsDir, 'scheduler.ts');
    
    fs.writeFileSync(schedulerPath, schedulerContent);
    console.log(`📄 Generated workflow scheduler`);
  }

  private buildWorkflowScheduler(): string {
    return `
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
    ${this.config.workflows?.filter(w => w.schedule).map(workflow => `
    this.scheduleWorkflow('${workflow.name}', '${workflow.schedule}');`).join('') || ''}
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
    
    console.log(\`⏰ Scheduled workflow \${workflowId} with cron: \${cronExpression}\`);
  }

  unscheduleWorkflow(workflowId: string): void {
    const interval = this.intervals.get(workflowId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(workflowId);
    }
    
    this.scheduledWorkflows.delete(workflowId);
    console.log(\`⏰ Unscheduled workflow \${workflowId}\`);
  }

  private setupInterval(workflowId: string, scheduled: ScheduledWorkflow): void {
    // Simple interval-based scheduling (in production, use a proper cron library)
    const interval = setInterval(async () => {
      if (!scheduled.enabled) return;

      const now = new Date();
      if (scheduled.nextRun && now >= scheduled.nextRun) {
        try {
          console.log(\`⚡ Executing scheduled workflow: \${workflowId}\`);
          await workflowEngine.executeWorkflow(workflowId, { 
            triggered: 'schedule', 
            scheduledAt: now 
          });
          
          scheduled.lastRun = now;
          scheduled.nextRun = this.getNextRunTime(scheduled.schedule);
          
        } catch (error) {
          console.error(\`❌ Scheduled workflow execution failed: \${workflowId}\`, error);
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
      console.log(\`✅ Enabled scheduled workflow: \${workflowId}\`);
    }
  }

  disableWorkflow(workflowId: string): void {
    const scheduled = this.scheduledWorkflows.get(workflowId);
    if (scheduled) {
      scheduled.enabled = false;
      console.log(\`⏸️  Disabled scheduled workflow: \${workflowId}\`);
    }
  }
}

// Export singleton instance
export const workflowScheduler = new WorkflowScheduler();
`.trim();
  }

  private async generateWorkflowIndex(workflowsDir: string): Promise<void> {
    const exports = this.config.workflows?.map(workflow => {
      const workflowName = this.toCamelCase(workflow.name) + 'Workflow';
      return `export { ${workflowName} } from './${workflow.name}';`;
    }).join('\n') || '';

    const indexContent = `
// Auto-generated workflow exports
export { WorkflowEngine, workflowEngine } from './engine';
export { WorkflowScheduler, workflowScheduler } from './scheduler';

${exports}

// Re-export all workflows as a single object
export const workflows = {
${this.config.workflows?.map(workflow => 
  `  ${this.toCamelCase(workflow.name)}: ${this.toCamelCase(workflow.name)}Workflow`
).join(',\n') || ''}
};
`.trim();

    fs.writeFileSync(path.join(workflowsDir, 'index.ts'), indexContent);
  }

  private toPascalCase(str: string): string {
    return str.replace(/(^|[-_])(.)/g, (_, __, char) => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}