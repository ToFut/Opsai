"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const client_1 = require("@temporalio/client");
const bullmq_1 = require("bullmq");
const redis_1 = require("redis");
const database_1 = require("@opsai/database");
const errors_1 = require("../errors");
const cron = __importStar(require("node-cron"));
class WorkflowService {
    constructor() {
        this.scheduledTasks = new Map();
        this.redisClient = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        this.workflowQueue = new bullmq_1.Queue('workflow-execution', {
            connection: this.redisClient
        });
        this.workflowWorker = new bullmq_1.Worker('workflow-execution', this.processWorkflowJob.bind(this), {
            connection: this.redisClient
        });
    }
    async initialize() {
        // Initialize Temporal client
        this.temporalClient = new client_1.Client({
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
    async createWorkflow(config, tenantId) {
        // Validate workflow configuration
        this.validateWorkflowConfig(config);
        const workflow = await database_1.prisma.workflow.create({
            data: {
                id: config.id,
                name: config.name,
                description: config.description,
                version: config.version || '1.0.0',
                config: config,
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
    async getWorkflow(id, tenantId) {
        const whereClause = tenantId ? { id, tenantId } : { id };
        const workflow = await database_1.prisma.workflow.findUnique({
            where: whereClause
        });
        return workflow ? workflow.config : null;
    }
    /**
     * Update workflow
     */
    async updateWorkflow(id, config, tenantId) {
        // Validate configuration if provided
        if (config.steps || config.triggers) {
            this.validateWorkflowConfig(config);
        }
        await database_1.prisma.workflow.update({
            where: { id, tenantId },
            data: {
                config: config,
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
    async deleteWorkflow(id, tenantId) {
        // Remove triggers
        await this.removeTriggers(id);
        // Delete workflow
        await database_1.prisma.workflow.delete({
            where: { id, tenantId }
        });
    }
    /**
     * List workflows for tenant
     */
    async listWorkflows(tenantId, filters) {
        const where = { tenantId };
        if (filters?.status)
            where.status = filters.status;
        if (filters?.name)
            where.name = { contains: filters.name };
        const workflows = await database_1.prisma.workflow.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        return workflows.map(w => w.config);
    }
    /**
     * Execute workflow
     */
    async executeWorkflow(workflowId, input, tenantId, options) {
        const workflow = await this.getWorkflow(workflowId, tenantId);
        if (!workflow) {
            throw new errors_1.WorkflowError('Workflow not found');
        }
        // Create workflow execution record
        const execution = await database_1.prisma.workflowExecution.create({
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
            const workflowOptions = {
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
            const handle = await this.temporalClient.workflow.start('businessWorkflow', // This would be the Temporal workflow function name
            workflowOptions);
            // Update execution with Temporal workflow ID
            await database_1.prisma.workflowExecution.update({
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
        }
        catch (error) {
            // Update execution status to failed
            await database_1.prisma.workflowExecution.update({
                where: { id: execution.id },
                data: {
                    status: 'failed',
                    error: error instanceof Error ? error.message : String(error),
                    completedAt: new Date()
                }
            });
            throw new errors_1.WorkflowError('Failed to start workflow execution', error);
        }
    }
    /**
     * Get workflow execution status
     */
    async getWorkflowExecution(executionId, tenantId) {
        const execution = await database_1.prisma.workflowExecution.findUnique({
            where: { id: executionId, tenantId },
            include: {
                steps: true
            }
        });
        if (!execution)
            return null;
        // Get latest status from Temporal if workflow is still running
        if (execution.temporalWorkflowId && execution.status === 'running') {
            try {
                const handle = this.temporalClient.workflow.getHandle(execution.temporalWorkflowId);
                const description = await handle.describe();
                // Update local status if different
                if (description.status.name !== execution.status) {
                    const newStatus = this.mapTemporalStatus(description.status.name);
                    await database_1.prisma.workflowExecution.update({
                        where: { id: executionId },
                        data: {
                            status: newStatus,
                            completedAt: newStatus === 'completed' || newStatus === 'failed' ? new Date() : undefined
                        }
                    });
                    execution.status = newStatus;
                }
            }
            catch (error) {
                console.error('Failed to get Temporal workflow status:', error);
            }
        }
        return {
            id: execution.id,
            workflowId: execution.workflowId,
            tenantId: execution.tenantId,
            status: execution.status,
            startedAt: execution.startedAt || undefined,
            completedAt: execution.completedAt || undefined,
            input: execution.input ? JSON.parse(execution.input) : undefined,
            output: execution.output ? JSON.parse(execution.output) : undefined,
            error: execution.error || undefined,
            steps: execution.steps?.map(step => ({
                id: step.id,
                name: step.name,
                status: step.status,
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
    async cancelWorkflowExecution(executionId, tenantId) {
        const execution = await database_1.prisma.workflowExecution.findUnique({
            where: { id: executionId, tenantId }
        });
        if (!execution) {
            throw new errors_1.WorkflowError('Workflow execution not found');
        }
        if (execution.temporalWorkflowId) {
            try {
                const handle = this.temporalClient.workflow.getHandle(execution.temporalWorkflowId);
                await handle.cancel();
            }
            catch (error) {
                console.error('Failed to cancel Temporal workflow:', error);
            }
        }
        await database_1.prisma.workflowExecution.update({
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
    async listWorkflowExecutions(tenantId, filters) {
        const where = { tenantId };
        if (filters?.workflowId)
            where.workflowId = filters.workflowId;
        if (filters?.status)
            where.status = filters.status;
        const executions = await database_1.prisma.workflowExecution.findMany({
            where,
            include: { steps: true },
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 50
        });
        return executions.map(execution => ({
            id: execution.id,
            workflowId: execution.workflowId,
            tenantId: execution.tenantId,
            status: execution.status,
            startedAt: execution.startedAt || undefined,
            completedAt: execution.completedAt || undefined,
            input: execution.input ? JSON.parse(execution.input) : undefined,
            output: execution.output ? JSON.parse(execution.output) : undefined,
            error: execution.error || undefined,
            steps: execution.steps?.map(step => ({
                id: step.id,
                name: step.name,
                status: step.status,
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
    validateWorkflowConfig(config) {
        if (!config.name) {
            throw new errors_1.WorkflowError('Workflow name is required');
        }
        if (!config.steps || config.steps.length === 0) {
            throw new errors_1.WorkflowError('Workflow must have at least one step');
        }
        // Validate steps
        for (const step of config.steps) {
            if (!step.name) {
                throw new errors_1.WorkflowError('Step name is required');
            }
            if (!step.activity) {
                throw new errors_1.WorkflowError(`Step '${step.name}' must specify an activity`);
            }
        }
        // Validate triggers
        if (config.triggers) {
            for (const trigger of config.triggers) {
                if (!trigger.type) {
                    throw new errors_1.WorkflowError('Trigger type is required');
                }
            }
        }
    }
    /**
     * Setup workflow trigger
     */
    async setupTrigger(workflowId, trigger, tenantId) {
        switch (trigger.type) {
            case 'schedule':
                if (trigger.schedule?.cron) {
                    const task = cron.schedule(trigger.schedule.cron, async () => {
                        await this.executeWorkflow(workflowId, trigger.input || {}, tenantId);
                    }, {
                        scheduled: trigger.schedule.enabled !== false,
                        timezone: trigger.schedule.timezone
                    });
                    this.scheduledTasks.set(`${workflowId}-${trigger.id}`, task);
                }
                break;
            case 'api_call':
                // API triggers would be handled by the API layer
                // Store trigger configuration for API to use
                await database_1.prisma.workflowTrigger.create({
                    data: {
                        workflowId,
                        tenantId,
                        type: trigger.type,
                        config: trigger
                    }
                });
                break;
            case 'webhook':
                // Webhook triggers would be handled by webhook service
                await database_1.prisma.workflowTrigger.create({
                    data: {
                        workflowId,
                        tenantId,
                        type: trigger.type,
                        config: trigger
                    }
                });
                break;
            case 'event':
                // Event triggers would be handled by event system
                await database_1.prisma.workflowTrigger.create({
                    data: {
                        workflowId,
                        tenantId,
                        type: trigger.type,
                        config: trigger
                    }
                });
                break;
        }
    }
    /**
     * Remove workflow triggers
     */
    async removeTriggers(workflowId) {
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
        await database_1.prisma.workflowTrigger.deleteMany({
            where: { workflowId }
        });
    }
    /**
     * Map Temporal workflow status to our status
     */
    mapTemporalStatus(temporalStatus) {
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
    async processWorkflowJob(job) {
        const { workflowId, input, tenantId } = job.data;
        try {
            await this.executeWorkflow(workflowId, input, tenantId);
        }
        catch (error) {
            console.error(`Workflow job failed:`, error);
            throw error;
        }
    }
    /**
     * Dispose resources
     */
    async dispose() {
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
exports.WorkflowService = WorkflowService;
//# sourceMappingURL=workflow-service.js.map