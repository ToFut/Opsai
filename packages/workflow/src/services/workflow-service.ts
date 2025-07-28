import { Client, WorkflowHandle, StartWorkflowOptions } from '@temporalio/client';
import { Queue, Worker, Job } from 'bullmq';
import { createClient } from 'redis';
import { prisma } from '@opsai/database';
import { WorkflowConfig, WorkflowExecution, WorkflowStep, WorkflowTrigger } from '../types';
import { WorkflowError } from '../errors';
import * as cron from 'node-cron';

export class WorkflowService {
  private temporalClient: Client;
  private workflowQueue: Queue;
  private workflowWorker: Worker;
  private redisClient: any;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.workflowQueue = new Queue('workflow-execution', {
      connection: this.redisClient
    });

    this.workflowWorker = new Worker(
      'workflow-execution',
      this.processWorkflowJob.bind(this),
      {
        connection: this.redisClient
      }
    );
  }

  async initialize(): Promise<void> {
    // Initialize Temporal client
    this.temporalClient = new Client({
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      connection: {
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
      }
    });

    console.log('Workflow service initialized');
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(config: WorkflowConfig, tenantId: string): Promise<any> {
    // Validate workflow configuration
    this.validateWorkflowConfig(config);

    const workflow = await prisma.workflow.create({
      data: {
        id: config.id,
        name: config.name,
        description: config.description,
        version: config.version || '1.0.0',
        config: config as any,
        status: 'active',
        tenantId
      }
    });

    // Setup triggers if configured
    if (config.triggers) {
      for (const trigger of config.triggers) {
        await this.setupTrigger(workflow.id, trigger, tenantId);
      }
    }

    return workflow;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(id: string, tenantId?: string): Promise<WorkflowConfig | null> {
    const whereClause = tenantId ? { id, tenantId } : { id };
    const workflow = await prisma.workflow.findUnique({
      where: whereClause
    });

    return workflow ? (workflow.config as WorkflowConfig) : null;
  }

  /**
   * Update workflow
   */
  async updateWorkflow(
    id: string,
    config: Partial<WorkflowConfig>,
    tenantId: string
  ): Promise<void> {
    // Validate configuration if provided
    if (config.steps || config.triggers) {
      this.validateWorkflowConfig(config as WorkflowConfig);
    }

    await prisma.workflow.update({
      where: { id, tenantId },
      data: {
        config: config as any,
        updatedAt: new Date()
      }
    });

    // Update triggers if changed
    if (config.triggers) {
      // Remove existing triggers
      await this.removeTriggers(id);
      
      // Setup new triggers
      for (const trigger of config.triggers) {
        await this.setupTrigger(id, trigger, tenantId);
      }
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string, tenantId: string): Promise<void> {
    // Remove triggers
    await this.removeTriggers(id);

    // Delete workflow
    await prisma.workflow.delete({
      where: { id, tenantId }
    });
  }

  /**
   * List workflows for tenant
   */
  async listWorkflows(
    tenantId: string,
    filters?: {
      status?: string;
      name?: string;
    }
  ): Promise<WorkflowConfig[]> {
    const where: any = { tenantId };
    
    if (filters?.status) where.status = filters.status;
    if (filters?.name) where.name = { contains: filters.name };

    const workflows = await prisma.workflow.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return workflows.map(w => w.config as WorkflowConfig);
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowId: string,
    input: any,
    tenantId: string,
    options?: {
      runId?: string;
      taskQueue?: string;
      searchAttributes?: Record<string, any>;
    }
  ): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflow(workflowId, tenantId);
    if (!workflow) {
      throw new WorkflowError('Workflow not found');
    }

    // Create workflow execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        tenantId,
        status: 'pending',
        input: input ? JSON.stringify(input) : null,
        runId: options?.runId || `run-${Date.now()}`
      }
    });

    try {
      // Start Temporal workflow
      const workflowOptions: StartWorkflowOptions = {
        taskQueue: options?.taskQueue || 'default',
        workflowId: `${workflowId}-${execution.id}`,
        args: [{
          executionId: execution.id,
          workflowConfig: workflow,
          input,
          tenantId
        }],
        searchAttributes: {
          tenantId: [tenantId],
          workflowId: [workflowId],
          executionId: [execution.id],
          ...options?.searchAttributes
        }
      };

      const handle = await this.temporalClient.workflow.start(
        'businessWorkflow', // This would be the Temporal workflow function name
        workflowOptions
      );

      // Update execution with Temporal workflow ID
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          temporalWorkflowId: handle.workflowId,
          status: 'running',
          startedAt: new Date()
        }
      });

      return {
        id: execution.id,
        workflowId,
        tenantId,
        status: 'running',
        startedAt: new Date(),
        input,
        steps: [],
        temporalWorkflowId: handle.workflowId
      };
    } catch (error) {
      // Update execution status to failed
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date()
        }
      });

      throw new WorkflowError('Failed to start workflow execution', error);
    }
  }

  /**
   * Get workflow execution status
   */
  async getWorkflowExecution(
    executionId: string,
    tenantId: string
  ): Promise<WorkflowExecution | null> {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId, tenantId },
      include: {
        steps: true
      }
    });

    if (!execution) return null;

    // Get latest status from Temporal if workflow is still running
    if (execution.temporalWorkflowId && execution.status === 'running') {
      try {
        const handle = this.temporalClient.workflow.getHandle(execution.temporalWorkflowId);
        const description = await handle.describe();
        
        // Update local status if different
        if (description.status.name !== execution.status) {
          const newStatus = this.mapTemporalStatus(description.status.name);
          await prisma.workflowExecution.update({
            where: { id: executionId },
            data: {
              status: newStatus,
              completedAt: newStatus === 'completed' || newStatus === 'failed' ? new Date() : undefined
            }
          });
          execution.status = newStatus;
        }
      } catch (error) {
        console.error('Failed to get Temporal workflow status:', error);
      }
    }

    return {
      id: execution.id,
      workflowId: execution.workflowId,
      tenantId: execution.tenantId,
      status: execution.status as any,
      startedAt: execution.startedAt || undefined,
      completedAt: execution.completedAt || undefined,
      input: execution.input ? JSON.parse(execution.input) : undefined,
      output: execution.output ? JSON.parse(execution.output) : undefined,
      error: execution.error || undefined,
      steps: execution.steps?.map(step => ({
        id: step.id,
        name: step.name,
        status: step.status as any,
        startedAt: step.startedAt || undefined,
        completedAt: step.completedAt || undefined,
        input: step.input ? JSON.parse(step.input) : undefined,
        output: step.output ? JSON.parse(step.output) : undefined,
        error: step.error || undefined
      })) || [],
      temporalWorkflowId: execution.temporalWorkflowId || undefined
    };
  }

  /**
   * Cancel workflow execution
   */
  async cancelWorkflowExecution(executionId: string, tenantId: string): Promise<void> {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId, tenantId }
    });

    if (!execution) {
      throw new WorkflowError('Workflow execution not found');
    }

    if (execution.temporalWorkflowId) {
      try {
        const handle = this.temporalClient.workflow.getHandle(execution.temporalWorkflowId);
        await handle.cancel();
      } catch (error) {
        console.error('Failed to cancel Temporal workflow:', error);
      }
    }

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'cancelled',
        completedAt: new Date()
      }
    });
  }

  /**
   * List workflow executions
   */
  async listWorkflowExecutions(
    tenantId: string,
    filters?: {
      workflowId?: string;
      status?: string;
      limit?: number;
    }
  ): Promise<WorkflowExecution[]> {
    const where: any = { tenantId };
    
    if (filters?.workflowId) where.workflowId = filters.workflowId;
    if (filters?.status) where.status = filters.status;

    const executions = await prisma.workflowExecution.findMany({
      where,
      include: { steps: true },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50
    });

    return executions.map(execution => ({
      id: execution.id,
      workflowId: execution.workflowId,
      tenantId: execution.tenantId,
      status: execution.status as any,
      startedAt: execution.startedAt || undefined,
      completedAt: execution.completedAt || undefined,
      input: execution.input ? JSON.parse(execution.input) : undefined,
      output: execution.output ? JSON.parse(execution.output) : undefined,
      error: execution.error || undefined,
      steps: execution.steps?.map(step => ({
        id: step.id,
        name: step.name,
        status: step.status as any,
        startedAt: step.startedAt || undefined,
        completedAt: step.completedAt || undefined,
        input: step.input ? JSON.parse(step.input) : undefined,
        output: step.output ? JSON.parse(step.output) : undefined,
        error: step.error || undefined
      })) || [],
      temporalWorkflowId: execution.temporalWorkflowId || undefined
    }));
  }

  /**
   * Validate workflow configuration
   */
  private validateWorkflowConfig(config: WorkflowConfig): void {
    if (!config.name) {
      throw new WorkflowError('Workflow name is required');
    }

    if (!config.steps || config.steps.length === 0) {
      throw new WorkflowError('Workflow must have at least one step');
    }

    // Validate steps
    for (const step of config.steps) {
      if (!step.name) {
        throw new WorkflowError('Step name is required');
      }
      if (!step.activity) {
        throw new WorkflowError(`Step '${step.name}' must specify an activity`);
      }
    }

    // Validate triggers
    if (config.triggers) {
      for (const trigger of config.triggers) {
        if (!trigger.type) {
          throw new WorkflowError('Trigger type is required');
        }
      }
    }
  }

  /**
   * Setup workflow trigger
   */
  private async setupTrigger(
    workflowId: string,
    trigger: WorkflowTrigger,
    tenantId: string
  ): Promise<void> {
    switch (trigger.type) {
      case 'schedule':
        if (trigger.schedule?.cron) {
          const task = cron.schedule(
            trigger.schedule.cron,
            async () => {
              await this.executeWorkflow(workflowId, trigger.input || {}, tenantId);
            },
            {
              scheduled: trigger.schedule.enabled !== false,
              timezone: trigger.schedule.timezone
            }
          );
          this.scheduledTasks.set(`${workflowId}-${trigger.id}`, task);
        }
        break;
        
      case 'api_call':
        // API triggers would be handled by the API layer
        // Store trigger configuration for API to use
        await prisma.workflowTrigger.create({
          data: {
            workflowId,
            tenantId,
            type: trigger.type,
            config: trigger as any
          }
        });
        break;
        
      case 'webhook':
        // Webhook triggers would be handled by webhook service
        await prisma.workflowTrigger.create({
          data: {
            workflowId,
            tenantId,
            type: trigger.type,
            config: trigger as any
          }
        });
        break;
        
      case 'event':
        // Event triggers would be handled by event system
        await prisma.workflowTrigger.create({
          data: {
            workflowId,
            tenantId,
            type: trigger.type,
            config: trigger as any
          }
        });
        break;
    }
  }

  /**
   * Remove workflow triggers
   */
  private async removeTriggers(workflowId: string): Promise<void> {
    // Remove scheduled tasks
    const tasksToRemove = Array.from(this.scheduledTasks.keys())
      .filter(key => key.startsWith(`${workflowId}-`));
    
    for (const taskKey of tasksToRemove) {
      const task = this.scheduledTasks.get(taskKey);
      if (task) {
        task.destroy();
        this.scheduledTasks.delete(taskKey);
      }
    }

    // Remove database triggers
    await prisma.workflowTrigger.deleteMany({
      where: { workflowId }
    });
  }

  /**
   * Map Temporal workflow status to our status
   */
  private mapTemporalStatus(temporalStatus: string): string {
    switch (temporalStatus.toLowerCase()) {
      case 'running':
        return 'running';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'cancelled':
        return 'cancelled';
      case 'terminated':
        return 'failed';
      case 'timed_out':
        return 'failed';
      default:
        return 'unknown';
    }
  }

  /**
   * Process workflow job (called by BullMQ worker)
   */
  private async processWorkflowJob(job: Job): Promise<void> {
    const { workflowId, input, tenantId } = job.data;
    
    try {
      await this.executeWorkflow(workflowId, input, tenantId);
    } catch (error) {
      console.error(`Workflow job failed:`, error);
      throw error;
    }
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    // Destroy all scheduled tasks
    for (const task of this.scheduledTasks.values()) {
      task.destroy();
    }
    this.scheduledTasks.clear();

    // Close worker and queue
    await this.workflowWorker.close();
    await this.workflowQueue.close();
    
    // Close Redis connection
    await this.redisClient.quit();

    // Close Temporal client
    await this.temporalClient.connection.close();
  }
} 