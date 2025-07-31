import { WorkflowService } from '@opsai/workflow';
import { workflowDefinitions } from './definitions';
import { customActivities } from './activities';

class AppWorkflowService {
  private workflowService: WorkflowService;

  constructor() {
    this.workflowService = new WorkflowService();
  }

  async initialize(): Promise<void> {
    // Initialize the workflow service with BullMQ and Temporal
    await this.workflowService.initialize();

    // Register custom activities
    for (const [name, activity] of Object.entries(customActivities)) {
      await this.workflowService.registerActivity(name, activity);
    }

    // Register workflow definitions
    for (const definition of workflowDefinitions) {
      await this.workflowService.createWorkflow(definition, process.env.TENANT_ID || 'default');
    }

    console.log('Workflow service initialized with ${workflowDefinitions.length} workflows');
  }

  async executeWorkflow(workflowName: string, input: any, options: any = {}): Promise<string> {
    return this.workflowService.executeWorkflow(workflowName, input, options);
  }

  async getWorkflowExecution(executionId: string): Promise<any> {
    return this.workflowService.getExecution(executionId);
  }

  async pauseWorkflow(executionId: string): Promise<void> {
    await this.workflowService.pauseExecution(executionId);
  }

  async resumeWorkflow(executionId: string): Promise<void> {
    await this.workflowService.resumeExecution(executionId);
  }

  async cancelWorkflow(executionId: string): Promise<void> {
    await this.workflowService.cancelExecution(executionId);
  }

  async getWorkflowHistory(workflowName?: string, limit: number = 100): Promise<any[]> {
    return this.workflowService.getExecutionHistory(workflowName, limit);
  }
}

export const appWorkflowService = new AppWorkflowService();
export { AppWorkflowService };
