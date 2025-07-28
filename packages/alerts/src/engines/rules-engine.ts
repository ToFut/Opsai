import { AlertRule, AlertCondition, AlertInstance } from '../types';
import { prisma } from '@opsai/database';
import { AlertProcessor } from '../processors/alert-processor';
import { AlertError } from '../errors';
import * as jsonpath from 'jsonpath';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export class RulesEngine {
  private ajv: Ajv;
  private alertProcessor: AlertProcessor;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.alertProcessor = new AlertProcessor();
  }

  /**
   * Evaluate all active rules for a tenant
   */
  async evaluateRules(tenantId: string, context?: any): Promise<AlertInstance[]> {
    try {
      // Get all active rules for tenant
      const rules = await prisma.alertRule.findMany({
        where: {
          tenantId,
          enabled: true
        },
        include: {
          conditions: true,
          actions: true
        }
      });

      const triggeredAlerts: AlertInstance[] = [];

      for (const rule of rules) {
        try {
          // Check if rule is in cooldown period
          if (await this.isInCooldown(rule.id)) {
            continue;
          }

          // Check schedule restrictions
          if (!this.isWithinSchedule(rule as any)) {
            continue;
          }

          // Evaluate rule conditions
          const shouldTrigger = await this.evaluateRuleConditions(
            rule as any,
            context
          );

          if (shouldTrigger.triggered) {
            // Create alert instance
            const alertInstance = await this.createAlertInstance(
              rule as any,
              shouldTrigger.triggerData
            );

            triggeredAlerts.push(alertInstance);

            // Process alert actions
            await this.alertProcessor.processAlert(alertInstance);
          }
        } catch (error) {
          console.error(`Error evaluating rule ${rule.id}:`, error);
          // Continue with other rules
        }
      }

      return triggeredAlerts;
    } catch (error) {
      console.error('Error in rules engine evaluation:', error);
      throw new AlertError('Rules evaluation failed', error);
    }
  }

  /**
   * Evaluate a specific rule
   */
  async evaluateRule(
    ruleId: string,
    tenantId: string,
    context?: any
  ): Promise<AlertInstance | null> {
    try {
      const rule = await prisma.alertRule.findUnique({
        where: { id: ruleId, tenantId },
        include: {
          conditions: true,
          actions: true
        }
      });

      if (!rule || !rule.enabled) {
        return null;
      }

      // Check cooldown and schedule
      if (await this.isInCooldown(rule.id) || !this.isWithinSchedule(rule as any)) {
        return null;
      }

      const shouldTrigger = await this.evaluateRuleConditions(rule as any, context);

      if (shouldTrigger.triggered) {
        const alertInstance = await this.createAlertInstance(
          rule as any,
          shouldTrigger.triggerData
        );

        await this.alertProcessor.processAlert(alertInstance);
        return alertInstance;
      }

      return null;
    } catch (error) {
      console.error(`Error evaluating specific rule ${ruleId}:`, error);
      throw new AlertError(`Rule evaluation failed for ${ruleId}`, error);
    }
  }

  /**
   * Evaluate conditions for a rule
   */
  private async evaluateRuleConditions(
    rule: AlertRule,
    context?: any
  ): Promise<{ triggered: boolean; triggerData?: any }> {
    const conditionResults = [];

    for (const condition of rule.conditions) {
      const result = await this.evaluateCondition(condition, rule.tenantId, context);
      conditionResults.push(result);
    }

    // Apply condition logic (AND/OR)
    const logic = rule.conditionLogic || 'AND';
    let triggered = false;
    let triggerData = null;

    if (logic === 'AND') {
      triggered = conditionResults.every(r => r.matched);
      if (triggered) {
        triggerData = conditionResults.find(r => r.matched)?.data;
      }
    } else if (logic === 'OR') {
      triggered = conditionResults.some(r => r.matched);
      if (triggered) {
        triggerData = conditionResults.find(r => r.matched)?.data;
      }
    }

    return { triggered, triggerData };
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: AlertCondition,
    tenantId: string,
    context?: any
  ): Promise<{ matched: boolean; data?: any }> {
    try {
      // Get data based on condition data source
      const data = await this.fetchConditionData(condition, tenantId, context);

      if (data === null || data === undefined) {
        // Handle absence conditions
        if (condition.type === 'absence') {
          return { matched: true, data };
        }
        return { matched: false };
      }

      // Apply aggregation if specified
      let evaluationValue = data;
      if (condition.aggregation && Array.isArray(data)) {
        evaluationValue = this.applyAggregation(data, condition.aggregation);
      }

      // Evaluate condition based on type
      switch (condition.type) {
        case 'threshold':
          return {
            matched: this.evaluateThreshold(evaluationValue, condition),
            data: { value: evaluationValue, condition }
          };

        case 'change':
          return await this.evaluateChange(condition, evaluationValue, tenantId);

        case 'absence':
          return { matched: false, data }; // Data exists, so absence condition fails

        case 'pattern':
          return {
            matched: this.evaluatePattern(evaluationValue, condition),
            data: { value: evaluationValue, condition }
          };

        case 'custom':
          return await this.evaluateCustomCondition(condition, evaluationValue, context);

        default:
          throw new AlertError(`Unsupported condition type: ${condition.type}`);
      }
    } catch (error) {
      console.error(`Error evaluating condition ${condition.id}:`, error);
      return { matched: false };
    }
  }

  /**
   * Fetch data for condition evaluation
   */
  private async fetchConditionData(
    condition: AlertCondition,
    tenantId: string,
    context?: any
  ): Promise<any> {
    switch (condition.dataSource.type) {
      case 'database':
        return await this.fetchDatabaseData(condition, tenantId);

      case 'metric':
        return await this.fetchMetricData(condition, tenantId);

      case 'api':
        return await this.fetchApiData(condition, context);

      case 'webhook':
        return context?.webhookData; // Data from webhook trigger

      case 'log':
        return await this.fetchLogData(condition, tenantId);

      default:
        throw new AlertError(`Unsupported data source type: ${condition.dataSource.type}`);
    }
  }

  /**
   * Fetch data from database
   */
  private async fetchDatabaseData(condition: AlertCondition, tenantId: string): Promise<any> {
    if (!condition.dataSource.table) {
      throw new AlertError('Table name required for database data source');
    }

    try {
      const table = condition.dataSource.table;
      const field = condition.dataSource.field;

      let query: any = {
        where: { tenantId }
      };

      // Apply time window if specified
      if (condition.timeWindow) {
        const timeField = 'createdAt'; // Assume createdAt field
        const windowStart = new Date(Date.now() - condition.timeWindow.duration * 60 * 1000);
        
        query.where[timeField] = {
          gte: windowStart
        };
      }

      // Use custom query if provided
      if (condition.dataSource.query) {
        // For custom SQL queries, use raw query
        return await prisma.$queryRaw`${condition.dataSource.query}`;
      }

      // Select specific field if specified
      if (field) {
        query.select = { [field]: true };
      }

      const results = await (prisma as any)[table].findMany(query);

      // Extract field values if field is specified
      if (field && results.length > 0) {
        return results.map((r: any) => r[field]);
      }

      return results;
    } catch (error) {
      console.error('Database fetch error:', error);
      throw new AlertError('Failed to fetch database data', error);
    }
  }

  /**
   * Fetch metric data
   */
  private async fetchMetricData(condition: AlertCondition, tenantId: string): Promise<any> {
    // This would integrate with your metrics system (Prometheus, etc.)
    // For now, return mock data
    console.log(`Fetching metric data for ${condition.dataSource.query} (tenant: ${tenantId})`);
    
    // Mock metric values
    const mockMetrics: Record<string, number> = {
      'cpu_usage': Math.random() * 100,
      'memory_usage': Math.random() * 100,
      'response_time': Math.random() * 1000,
      'error_rate': Math.random() * 10,
      'active_users': Math.floor(Math.random() * 1000)
    };

    return mockMetrics[condition.dataSource.query || ''] || 0;
  }

  /**
   * Fetch API data
   */
  private async fetchApiData(condition: AlertCondition, context?: any): Promise<any> {
    if (!condition.dataSource.endpoint) {
      throw new AlertError('Endpoint URL required for API data source');
    }

    try {
      const response = await fetch(condition.dataSource.endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OPSAI-Alerts/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Use JSONPath to extract specific field if specified
      if (condition.dataSource.field) {
        return jsonpath.query(data, condition.dataSource.field);
      }

      return data;
    } catch (error) {
      console.error('API fetch error:', error);
      throw new AlertError('Failed to fetch API data', error);
    }
  }

  /**
   * Fetch log data
   */
  private async fetchLogData(condition: AlertCondition, tenantId: string): Promise<any> {
    // This would integrate with your logging system
    // For now, return mock data
    console.log(`Fetching log data for ${condition.dataSource.query} (tenant: ${tenantId})`);
    return [];
  }

  /**
   * Apply aggregation to data array
   */
  private applyAggregation(data: any[], aggregationType: string): number {
    const numericData = data.filter(d => typeof d === 'number');

    switch (aggregationType) {
      case 'count':
        return data.length;
      case 'sum':
        return numericData.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return numericData.length > 0 ? numericData.reduce((sum, val) => sum + val, 0) / numericData.length : 0;
      case 'min':
        return numericData.length > 0 ? Math.min(...numericData) : 0;
      case 'max':
        return numericData.length > 0 ? Math.max(...numericData) : 0;
      case 'distinct_count':
        return new Set(data).size;
      default:
        return 0;
    }
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateThreshold(value: any, condition: AlertCondition): boolean {
    const { operator, value: threshold } = condition;

    switch (operator) {
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      case 'greater_than':
        return Number(value) > Number(threshold);
      case 'less_than':
        return Number(value) < Number(threshold);
      case 'greater_or_equal':
        return Number(value) >= Number(threshold);
      case 'less_or_equal':
        return Number(value) <= Number(threshold);
      case 'contains':
        return String(value).includes(String(threshold));
      case 'not_contains':
        return !String(value).includes(String(threshold));
      case 'regex_match':
        return condition.pattern ? new RegExp(condition.pattern).test(String(value)) : false;
      case 'in':
        return condition.values ? condition.values.includes(value) : false;
      case 'not_in':
        return condition.values ? !condition.values.includes(value) : true;
      case 'is_null':
        return value === null || value === undefined;
      case 'is_not_null':
        return value !== null && value !== undefined;
      default:
        return false;
    }
  }

  /**
   * Evaluate change condition
   */
  private async evaluateChange(
    condition: AlertCondition,
    currentValue: any,
    tenantId: string
  ): Promise<{ matched: boolean; data?: any }> {
    // Get previous value for comparison
    // This would typically involve storing historical values
    // For now, use a simplified approach
    
    try {
      const previousValue = await this.getPreviousValue(condition, tenantId);
      
      if (previousValue === null || previousValue === undefined) {
        return { matched: false };
      }

      const changePercent = ((currentValue - previousValue) / previousValue) * 100;
      const changeAbsolute = currentValue - previousValue;

      // Evaluate based on threshold
      const thresholdMet = this.evaluateThreshold(
        condition.aggregation === 'percent' ? changePercent : changeAbsolute,
        condition
      );

      return {
        matched: thresholdMet,
        data: {
          currentValue,
          previousValue,
          changePercent,
          changeAbsolute
        }
      };
    } catch (error) {
      console.error('Error evaluating change condition:', error);
      return { matched: false };
    }
  }

  /**
   * Evaluate pattern condition
   */
  private evaluatePattern(value: any, condition: AlertCondition): boolean {
    if (!condition.pattern) {
      return false;
    }

    try {
      const regex = new RegExp(condition.pattern);
      return regex.test(String(value));
    } catch (error) {
      console.error('Invalid regex pattern:', condition.pattern);
      return false;
    }
  }

  /**
   * Evaluate custom condition
   */
  private async evaluateCustomCondition(
    condition: AlertCondition,
    value: any,
    context?: any
  ): Promise<{ matched: boolean; data?: any }> {
    // Custom conditions would allow JavaScript evaluation
    // This is potentially dangerous and should be sandboxed in production
    
    try {
      if (!condition.value) {
        return { matched: false };
      }

      // Simple function evaluation (in production, use a proper sandbox)
      const evaluationFunction = new Function('value', 'context', condition.value as string);
      const result = evaluationFunction(value, context);

      return {
        matched: Boolean(result),
        data: { value, result, context }
      };
    } catch (error) {
      console.error('Error evaluating custom condition:', error);
      return { matched: false };
    }
  }

  /**
   * Get previous value for change detection
   */
  private async getPreviousValue(condition: AlertCondition, tenantId: string): Promise<any> {
    // This would typically query a time-series database or cache
    // For now, return a mock previous value
    return Math.random() * 100;
  }

  /**
   * Check if rule is in cooldown period
   */
  private async isInCooldown(ruleId: string): Promise<boolean> {
    try {
      const rule = await prisma.alertRule.findUnique({
        where: { id: ruleId }
      });

      if (!rule || !rule.cooldownPeriod || !rule.lastTriggered) {
        return false;
      }

      const cooldownEndTime = new Date(
        rule.lastTriggered.getTime() + rule.cooldownPeriod * 60 * 1000
      );

      return new Date() < cooldownEndTime;
    } catch (error) {
      console.error('Error checking cooldown:', error);
      return false;
    }
  }

  /**
   * Check if current time is within rule schedule
   */
  private isWithinSchedule(rule: AlertRule): boolean {
    if (!rule.scheduleRestrictions) {
      return true;
    }

    const now = new Date();
    const restrictions = rule.scheduleRestrictions;

    // Check day of week
    if (restrictions.daysOfWeek) {
      const currentDay = now.getDay();
      if (!restrictions.daysOfWeek.includes(currentDay)) {
        return false;
      }
    }

    // Check time of day
    if (restrictions.timeOfDay) {
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
      const { start, end } = restrictions.timeOfDay;

      if (start <= end) {
        // Same day range
        if (currentTime < start || currentTime > end) {
          return false;
        }
      } else {
        // Overnight range
        if (currentTime < start && currentTime > end) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Create alert instance
   */
  private async createAlertInstance(
    rule: AlertRule,
    triggerData: any
  ): Promise<AlertInstance> {
    const alertInstance: AlertInstance = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      tenantId: rule.tenantId,
      triggeredAt: new Date(),
      severity: rule.priority,
      status: 'active',
      triggerData: {
        condition: triggerData?.condition,
        actualValue: triggerData?.value,
        dataSnapshot: triggerData
      },
      actionResults: []
    };

    // Save to database
    await prisma.alertInstance.create({
      data: {
        id: alertInstance.id,
        ruleId: alertInstance.ruleId,
        tenantId: alertInstance.tenantId,
        triggeredAt: alertInstance.triggeredAt,
        severity: alertInstance.severity,
        status: alertInstance.status,
        triggerData: JSON.stringify(alertInstance.triggerData)
      }
    });

    // Update rule last triggered time and count
    await prisma.alertRule.update({
      where: { id: rule.id },
      data: {
        lastTriggered: new Date(),
        triggerCount: { increment: 1 }
      }
    });

    return alertInstance;
  }
}

// Export error class
export class AlertError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'AlertError';
  }
}