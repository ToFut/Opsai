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
    console.log(`📋 Registered workflow: ${workflow.name}`);
  }

  async executeWorkflow(workflowId: string, triggerData: any = {}): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.active) {
      throw new Error(`Workflow is not active: ${workflow.name}`);
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
    this.log(execution, 'info', `Starting workflow execution: ${workflow.name}`);

    try {
      await this.executeStep(execution, workflow.trigger);
      execution.status = 'completed';
      execution.completedAt = new Date();
      this.log(execution, 'info', 'Workflow completed successfully');
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      this.log(execution, 'error', `Workflow failed: ${error.message}`, undefined, error);
    }

    return executionId;
  }

  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    execution.currentStep = step.id;
    this.log(execution, 'info', `Executing step: ${step.name}`, step.id);

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
          throw new Error(`Unknown step type: ${step.type}`);
      }

      this.log(execution, 'info', `Step completed: ${step.name}`, step.id, result);

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
      this.log(execution, 'error', `Step failed: ${step.name}`, step.id, error);
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
        throw new Error(`Unknown action type: ${actionType}`);
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
        throw new Error(`Unknown condition type: ${conditionType}`);
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
        throw new Error(`Unknown database operation: ${operation}`);
    }
  }

  private async executeAPIAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { integration, method, endpoint, data } = config;
    
    const client = (integrations as any)[integration];
    if (!client) {
      throw new Error(`Integration not found: ${integration}`);
    }

    const resolvedData = this.resolveVariables(data, execution.context);
    
    // Call the appropriate method on the integration client
    if (typeof client[method] === 'function') {
      return await client[method](resolvedData);
    } else {
      throw new Error(`Method not found on integration ${integration}: ${method}`);
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
      console.log(`📧 Email would be sent to ${resolvedTo}: ${resolvedSubject}`);
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
      return template.replace(/{{([^}]+)}}/g, (match, path) => {
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
    console.log(`[${level.toUpperCase()}] ${execution.id}: ${message}`);
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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