import { Queue, Worker } from 'bullmq';
import { createClient } from 'redis';
import * as cron from 'node-cron';
import { 
  AlertRule, 
  AlertInstance, 
  AlertSubscription, 
  AlertMetrics,
  AlertTemplate,
  AlertEscalation 
} from '../types';
import { RulesEngine } from '../engines/rules-engine';
import { AlertProcessor } from '../processors/alert-processor';
import { prisma } from '@opsai/database';
import { AlertError } from '../engines/rules-engine';

export class AlertService {
  private rulesEngine: RulesEngine;
  private alertProcessor: AlertProcessor;
  private evaluationQueue: Queue;
  private evaluationWorker: Worker;
  private redisClient: any;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.rulesEngine = new RulesEngine();
    this.alertProcessor = new AlertProcessor();
    
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.evaluationQueue = new Queue('alert-evaluation', {
      connection: this.redisClient
    });

    this.evaluationWorker = new Worker(
      'alert-evaluation',
      this.processEvaluation.bind(this),
      {
        connection: this.redisClient,
        concurrency: 5
      }
    );

    this.initializeScheduler();
  }

  /**
   * Initialize the alert scheduler
   */
  private initializeScheduler(): void {
    // Schedule periodic evaluation of all rules
    const evaluationTask = cron.schedule('*/1 * * * *', async () => {
      await this.scheduleRuleEvaluations();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.scheduledTasks.set('global-evaluation', evaluationTask);
    console.log('[Alert Service] Scheduler initialized');
  }

  /**
   * Create a new alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>): Promise<AlertRule> {
    try {
      // Validate rule configuration
      this.validateAlertRule(rule as AlertRule);

      const createdRule = await prisma.alertRule.create({
        data: {
          name: rule.name,
          description: rule.description,
          tenantId: rule.tenantId,
          enabled: rule.enabled,
          priority: rule.priority,
          conditions: JSON.stringify(rule.conditions),
          conditionLogic: rule.conditionLogic || 'AND',
          actions: JSON.stringify(rule.actions),
          cooldownPeriod: rule.cooldownPeriod,
          maxOccurrences: rule.maxOccurrences,
          scheduleRestrictions: rule.scheduleRestrictions ? JSON.stringify(rule.scheduleRestrictions) : null,
          tags: rule.tags,
          triggerCount: 0
        }
      });

      const alertRule: AlertRule = {
        id: createdRule.id,
        name: createdRule.name,
        description: createdRule.description,
        tenantId: createdRule.tenantId,
        enabled: createdRule.enabled,
        priority: createdRule.priority as any,
        conditions: JSON.parse(createdRule.conditions),
        conditionLogic: createdRule.conditionLogic as any,
        actions: JSON.parse(createdRule.actions),
        cooldownPeriod: createdRule.cooldownPeriod,
        maxOccurrences: createdRule.maxOccurrences,
        scheduleRestrictions: createdRule.scheduleRestrictions ? JSON.parse(createdRule.scheduleRestrictions) : undefined,
        tags: createdRule.tags,
        createdAt: createdRule.createdAt,
        updatedAt: createdRule.updatedAt,
        lastTriggered: createdRule.lastTriggered,
        triggerCount: createdRule.triggerCount
      };

      console.log(`[Alert Service] Created rule ${alertRule.id}: ${alertRule.name}`);
      return alertRule;
    } catch (error) {
      console.error('Error creating alert rule:', error);
      throw new AlertError('Failed to create alert rule', error);
    }
  }

  /**
   * Update an alert rule
   */
  async updateAlertRule(
    ruleId: string, 
    tenantId: string, 
    updates: Partial<AlertRule>
  ): Promise<AlertRule> {
    try {
      if (updates.conditions || updates.actions) {
        this.validateAlertRule({ ...updates, id: ruleId } as AlertRule);
      }

      const updateData: any = {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.enabled !== undefined && { enabled: updates.enabled }),
        ...(updates.priority && { priority: updates.priority }),
        ...(updates.conditions && { conditions: JSON.stringify(updates.conditions) }),
        ...(updates.conditionLogic && { conditionLogic: updates.conditionLogic }),
        ...(updates.actions && { actions: JSON.stringify(updates.actions) }),
        ...(updates.cooldownPeriod !== undefined && { cooldownPeriod: updates.cooldownPeriod }),
        ...(updates.maxOccurrences !== undefined && { maxOccurrences: updates.maxOccurrences }),
        ...(updates.scheduleRestrictions !== undefined && { 
          scheduleRestrictions: updates.scheduleRestrictions ? JSON.stringify(updates.scheduleRestrictions) : null 
        }),
        ...(updates.tags && { tags: updates.tags }),
        updatedAt: new Date()
      };

      const updatedRule = await prisma.alertRule.update({
        where: { id: ruleId, tenantId },
        data: updateData
      });

      return this.mapDatabaseRuleToAlertRule(updatedRule);
    } catch (error) {
      console.error(`Error updating alert rule ${ruleId}:`, error);
      throw new AlertError('Failed to update alert rule', error);
    }
  }

  /**
   * Delete an alert rule
   */
  async deleteAlertRule(ruleId: string, tenantId: string): Promise<void> {
    try {
      // Delete associated alert instances
      await prisma.alertInstance.deleteMany({
        where: { ruleId, tenantId }
      });

      // Delete the rule
      await prisma.alertRule.delete({
        where: { id: ruleId, tenantId }
      });

      console.log(`[Alert Service] Deleted rule ${ruleId}`);
    } catch (error) {
      console.error(`Error deleting alert rule ${ruleId}:`, error);
      throw new AlertError('Failed to delete alert rule', error);
    }
  }

  /**
   * Get alert rule by ID
   */
  async getAlertRule(ruleId: string, tenantId: string): Promise<AlertRule | null> {
    try {
      const rule = await prisma.alertRule.findUnique({
        where: { id: ruleId, tenantId }
      });

      return rule ? this.mapDatabaseRuleToAlertRule(rule) : null;
    } catch (error) {
      console.error(`Error getting alert rule ${ruleId}:`, error);
      throw new AlertError('Failed to get alert rule', error);
    }
  }

  /**
   * List alert rules for tenant
   */
  async listAlertRules(
    tenantId: string, 
    filters?: {
      enabled?: boolean;
      priority?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<AlertRule[]> {
    try {
      const where: any = { tenantId };
      
      if (filters?.enabled !== undefined) where.enabled = filters.enabled;
      if (filters?.priority) where.priority = filters.priority;
      if (filters?.tags) {
        where.tags = {
          hasSome: filters.tags
        };
      }

      const rules = await prisma.alertRule.findMany({
        where,
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { createdAt: 'desc' }
      });

      return rules.map(rule => this.mapDatabaseRuleToAlertRule(rule));
    } catch (error) {
      console.error('Error listing alert rules:', error);
      throw new AlertError('Failed to list alert rules', error);
    }
  }

  /**
   * Test an alert rule (evaluate without triggering actions)
   */
  async testAlertRule(ruleId: string, tenantId: string, testData?: any): Promise<{
    wouldTrigger: boolean;
    evaluationResults: any[];
    triggerData?: any;
  }> {
    try {
      const rule = await this.getAlertRule(ruleId, tenantId);
      if (!rule) {
        throw new AlertError('Alert rule not found');
      }

      // Temporarily disable the rule for testing
      const originalEnabled = rule.enabled;
      rule.enabled = false;

      // Evaluate conditions
      const results = [];
      for (const condition of rule.conditions) {
        // Mock evaluation result for testing
        const mockResult = {
          conditionId: condition.id,
          matched: Math.random() > 0.5, // Random for demo
          value: testData?.[condition.dataSource.field || 'test'] || Math.random() * 100
        };
        results.push(mockResult);
      }

      const wouldTrigger = rule.conditionLogic === 'AND' 
        ? results.every(r => r.matched)
        : results.some(r => r.matched);

      return {
        wouldTrigger,
        evaluationResults: results,
        triggerData: wouldTrigger ? results.find(r => r.matched) : undefined
      };
    } catch (error) {
      console.error(`Error testing alert rule ${ruleId}:`, error);
      throw new AlertError('Failed to test alert rule', error);
    }
  }

  /**
   * Manually trigger an alert rule
   */
  async triggerAlertRule(ruleId: string, tenantId: string, context?: any): Promise<AlertInstance | null> {
    try {
      return await this.rulesEngine.evaluateRule(ruleId, tenantId, context);
    } catch (error) {
      console.error(`Error triggering alert rule ${ruleId}:`, error);
      throw new AlertError('Failed to trigger alert rule', error);
    }
  }

  /**
   * Get alert instances
   */
  async getAlertInstances(
    tenantId: string,
    filters?: {
      ruleId?: string;
      status?: string;
      severity?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<AlertInstance[]> {
    try {
      const where: any = { tenantId };
      
      if (filters?.ruleId) where.ruleId = filters.ruleId;
      if (filters?.status) where.status = filters.status;
      if (filters?.severity) where.severity = filters.severity;
      if (filters?.startDate || filters?.endDate) {
        where.triggeredAt = {};
        if (filters.startDate) where.triggeredAt.gte = filters.startDate;
        if (filters.endDate) where.triggeredAt.lte = filters.endDate;
      }

      const instances = await prisma.alertInstance.findMany({
        where,
        include: {
          actionResults: true
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { triggeredAt: 'desc' }
      });

      return instances.map(instance => this.mapDatabaseInstanceToAlertInstance(instance));
    } catch (error) {
      console.error('Error getting alert instances:', error);
      throw new AlertError('Failed to get alert instances', error);
    }
  }

  /**
   * Acknowledge an alert instance
   */
  async acknowledgeAlert(
    instanceId: string, 
    tenantId: string, 
    userId: string, 
    note?: string
  ): Promise<void> {
    try {
      await prisma.alertInstance.update({
        where: { id: instanceId, tenantId },
        data: {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
          acknowledgmentNote: note
        }
      });

      console.log(`[Alert Service] Alert ${instanceId} acknowledged by ${userId}`);
    } catch (error) {
      console.error(`Error acknowledging alert ${instanceId}:`, error);
      throw new AlertError('Failed to acknowledge alert', error);
    }
  }

  /**
   * Resolve an alert instance
   */
  async resolveAlert(
    instanceId: string, 
    tenantId: string, 
    userId: string, 
    note?: string
  ): Promise<void> {
    try {
      await prisma.alertInstance.update({
        where: { id: instanceId, tenantId },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: userId,
          resolutionNote: note
        }
      });

      console.log(`[Alert Service] Alert ${instanceId} resolved by ${userId}`);
    } catch (error) {
      console.error(`Error resolving alert ${instanceId}:`, error);
      throw new AlertError('Failed to resolve alert', error);
    }
  }

  /**
   * Get alert metrics
   */
  async getAlertMetrics(
    tenantId: string,
    ruleId?: string,
    period?: { start: Date; end: Date }
  ): Promise<AlertMetrics> {
    try {
      const where: any = { tenantId };
      if (ruleId) where.ruleId = ruleId;
      if (period) {
        where.triggeredAt = {
          gte: period.start,
          lte: period.end
        };
      }

      const instances = await prisma.alertInstance.findMany({ where });

      const totalTriggers = instances.length;
      const activeTriggers = instances.filter(i => i.status === 'active').length;
      const resolvedTriggers = instances.filter(i => i.status === 'resolved').length;
      const acknowledgedTriggers = instances.filter(i => i.status === 'acknowledged').length;
      const suppressedTriggers = instances.filter(i => i.status === 'suppressed').length;

      // Calculate average resolution time
      const resolvedInstances = instances.filter(i => i.resolvedAt);
      const averageResolutionTime = resolvedInstances.length > 0
        ? resolvedInstances.reduce((sum, instance) => {
            const resolutionTime = (instance.resolvedAt!.getTime() - instance.triggeredAt.getTime()) / (1000 * 60);
            return sum + resolutionTime;
          }, 0) / resolvedInstances.length
        : 0;

      // Calculate average acknowledgment time
      const acknowledgedInstances = instances.filter(i => i.acknowledgedAt);
      const averageAcknowledgmentTime = acknowledgedInstances.length > 0
        ? acknowledgedInstances.reduce((sum, instance) => {
            const ackTime = (instance.acknowledgedAt!.getTime() - instance.triggeredAt.getTime()) / (1000 * 60);
            return sum + ackTime;
          }, 0) / acknowledgedInstances.length
        : 0;

      // Severity breakdown
      const severityBreakdown = {
        low: instances.filter(i => i.severity === 'low').length,
        medium: instances.filter(i => i.severity === 'medium').length,
        high: instances.filter(i => i.severity === 'high').length,
        critical: instances.filter(i => i.severity === 'critical').length
      };

      return {
        ruleId: ruleId || 'all',
        tenantId,
        period: period || {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        },
        totalTriggers,
        activeTriggers,
        resolvedTriggers,
        acknowledgedTriggers,
        suppressedTriggers,
        averageResolutionTime,
        averageAcknowledgmentTime,
        actionSuccessRate: 95, // Mock value - calculate from action results
        actionFailureCount: Math.floor(totalTriggers * 0.05),
        severityBreakdown
      };
    } catch (error) {
      console.error('Error getting alert metrics:', error);
      throw new AlertError('Failed to get alert metrics', error);
    }
  }

  /**
   * Schedule rule evaluations for all tenants
   */
  private async scheduleRuleEvaluations(): Promise<void> {
    try {
      // Get all tenants with active rules
      const tenants = await prisma.alertRule.findMany({
        select: { tenantId: true },
        where: { enabled: true },
        distinct: ['tenantId']
      });

      // Queue evaluation for each tenant
      for (const tenant of tenants) {
        await this.evaluationQueue.add(
          'evaluate-tenant',
          { tenantId: tenant.tenantId },
          { removeOnComplete: 10, removeOnFail: 5 }
        );
      }

      console.log(`[Alert Service] Scheduled evaluations for ${tenants.length} tenants`);
    } catch (error) {
      console.error('Error scheduling rule evaluations:', error);
    }
  }

  /**
   * Process evaluation job
   */
  private async processEvaluation(job: any): Promise<void> {
    const { tenantId } = job.data;
    
    try {
      console.log(`[Alert Service] Evaluating rules for tenant ${tenantId}`);
      
      const triggeredAlerts = await this.rulesEngine.evaluateRules(tenantId);
      
      if (triggeredAlerts.length > 0) {
        console.log(`[Alert Service] ${triggeredAlerts.length} alerts triggered for tenant ${tenantId}`);
      }
    } catch (error) {
      console.error(`Error evaluating rules for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Validate alert rule configuration
   */
  private validateAlertRule(rule: AlertRule): void {
    if (!rule.name) {
      throw new AlertError('Rule name is required');
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      throw new AlertError('At least one condition is required');
    }

    if (!rule.actions || rule.actions.length === 0) {
      throw new AlertError('At least one action is required');
    }

    // Validate conditions
    for (const condition of rule.conditions) {
      if (!condition.type) {
        throw new AlertError('Condition type is required');
      }
      if (!condition.dataSource) {
        throw new AlertError('Condition data source is required');
      }
    }

    // Validate actions
    for (const action of rule.actions) {
      if (!action.type) {
        throw new AlertError('Action type is required');
      }
      if (!action.message) {
        throw new AlertError('Action message is required');
      }
    }
  }

  /**
   * Map database rule to AlertRule type
   */
  private mapDatabaseRuleToAlertRule(dbRule: any): AlertRule {
    return {
      id: dbRule.id,
      name: dbRule.name,
      description: dbRule.description,
      tenantId: dbRule.tenantId,
      enabled: dbRule.enabled,
      priority: dbRule.priority,
      conditions: JSON.parse(dbRule.conditions),
      conditionLogic: dbRule.conditionLogic,
      actions: JSON.parse(dbRule.actions),
      cooldownPeriod: dbRule.cooldownPeriod,
      maxOccurrences: dbRule.maxOccurrences,
      scheduleRestrictions: dbRule.scheduleRestrictions ? JSON.parse(dbRule.scheduleRestrictions) : undefined,
      tags: dbRule.tags,
      createdAt: dbRule.createdAt,
      updatedAt: dbRule.updatedAt,
      lastTriggered: dbRule.lastTriggered,
      triggerCount: dbRule.triggerCount
    };
  }

  /**
   * Map database instance to AlertInstance type
   */
  private mapDatabaseInstanceToAlertInstance(dbInstance: any): AlertInstance {
    return {
      id: dbInstance.id,
      ruleId: dbInstance.ruleId,
      tenantId: dbInstance.tenantId,
      triggeredAt: dbInstance.triggeredAt,
      severity: dbInstance.severity,
      status: dbInstance.status,
      triggerData: JSON.parse(dbInstance.triggerData || '{}'),
      actionResults: dbInstance.actionResults?.map((ar: any) => ({
        actionId: ar.actionId,
        actionType: ar.actionType,
        status: ar.status,
        executedAt: ar.executedAt,
        completedAt: ar.completedAt,
        error: ar.error,
        response: ar.response ? JSON.parse(ar.response) : undefined,
        retryCount: ar.retryCount
      })) || [],
      resolvedAt: dbInstance.resolvedAt,
      resolvedBy: dbInstance.resolvedBy,
      resolutionNote: dbInstance.resolutionNote,
      acknowledgedAt: dbInstance.acknowledgedAt,
      acknowledgedBy: dbInstance.acknowledgedBy,
      acknowledgmentNote: dbInstance.acknowledgmentNote
    };
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    // Stop scheduled tasks
    for (const task of this.scheduledTasks.values()) {
      task.destroy();
    }
    this.scheduledTasks.clear();

    // Close workers and queues
    await this.evaluationWorker.close();
    await this.evaluationQueue.close();
    
    await this.alertProcessor.dispose();
    
    // Close Redis connection
    await this.redisClient.quit();

    console.log('[Alert Service] Disposed');
  }
}