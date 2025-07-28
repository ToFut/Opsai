export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Condition definition
  conditions: AlertCondition[];
  conditionLogic?: 'AND' | 'OR'; // How to combine multiple conditions
  
  // Actions to take when alert triggers
  actions: AlertAction[];
  
  // Control settings
  cooldownPeriod?: number; // Minutes before alert can trigger again
  maxOccurrences?: number; // Max times this alert can trigger
  scheduleRestrictions?: {
    daysOfWeek?: number[]; // 0-6, Sunday=0
    timeOfDay?: {
      start: string; // HH:mm format
      end: string;   // HH:mm format
    };
    timezone?: string;
  };
  
  // Metadata
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface AlertCondition {
  id: string;
  type: 'threshold' | 'change' | 'absence' | 'pattern' | 'custom';
  
  // Data source
  dataSource: {
    type: 'database' | 'metric' | 'log' | 'api' | 'webhook';
    query?: string; // SQL query, metric path, etc.
    endpoint?: string; // For API data sources
    table?: string; // For database sources
    field?: string; // Specific field to monitor
  };
  
  // Condition specifics
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 
           'greater_or_equal' | 'less_or_equal' | 'contains' | 'not_contains' |
           'regex_match' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  
  value?: any; // The value to compare against
  values?: any[]; // For 'in' and 'not_in' operators
  pattern?: string; // For regex_match
  
  // Time-based conditions
  timeWindow?: {
    duration: number; // Minutes
    type: 'sliding' | 'tumbling';
  };
  
  // Aggregation for numeric data
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct_count';
  
  // Threshold crossing behavior
  thresholdBehavior?: 'breach' | 'recovery'; // Trigger on breach or recovery
}

export interface AlertAction {
  id: string;
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams' | 'pagerduty' | 'workflow' | 'database';
  
  // Common properties
  enabled: boolean;
  
  // Notification actions
  recipients?: string[];
  subject?: string;
  message: string;
  template?: string;
  templateData?: Record<string, any>;
  
  // Webhook action
  webhook?: {
    url: string;
    method?: 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
    payload?: any;
  };
  
  // Slack/Teams action
  channel?: string;
  
  // Workflow action
  workflowId?: string;
  workflowInput?: any;
  
  // Database action
  database?: {
    table: string;
    action: 'insert' | 'update';
    data: any;
    where?: any; // For updates
  };
  
  // Retry configuration
  retryConfig?: {
    maxRetries: number;
    retryDelay: number; // Seconds
    backoffMultiplier?: number;
  };
}

export interface AlertInstance {
  id: string;
  ruleId: string;
  tenantId: string;
  
  // Trigger details
  triggeredAt: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  
  // Data that triggered the alert
  triggerData: {
    condition: AlertCondition;
    actualValue: any;
    expectedValue?: any;
    dataSnapshot?: any;
  };
  
  // Action results
  actionResults: AlertActionResult[];
  
  // Resolution
  resolvedAt?: Date;
  resolvedBy?: string; // User ID
  resolutionNote?: string;
  
  // Acknowledgment
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  acknowledgmentNote?: string;
}

export interface AlertActionResult {
  actionId: string;
  actionType: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  executedAt: Date;
  completedAt?: Date;
  error?: string;
  response?: any;
  retryCount: number;
}

export interface AlertMetrics {
  ruleId: string;
  tenantId: string;
  
  // Time-based metrics
  period: {
    start: Date;
    end: Date;
  };
  
  // Counts
  totalTriggers: number;
  activeTriggers: number;
  resolvedTriggers: number;
  acknowledgedTriggers: number;
  suppressedTriggers: number;
  
  // Performance metrics
  averageResolutionTime: number; // Minutes
  averageAcknowledgmentTime: number; // Minutes
  
  // Action metrics
  actionSuccessRate: number; // Percentage
  actionFailureCount: number;
  
  // Severity breakdown
  severityBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface AlertSubscription {
  id: string;
  userId: string;
  tenantId: string;
  
  // Subscription filters
  ruleIds?: string[]; // Specific rules to subscribe to
  severities?: string[]; // Severity levels to receive
  tags?: string[]; // Rule tags to match
  
  // Delivery preferences
  channels: {
    email?: {
      enabled: boolean;
      address: string;
      immediateDelivery?: boolean;
    };
    sms?: {
      enabled: boolean;
      phoneNumber: string;
      severityThreshold?: 'medium' | 'high' | 'critical';
    };
    push?: {
      enabled: boolean;
      deviceTokens: string[];
    };
  };
  
  // Schedule preferences
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
    suppressionLevel: 'all' | 'low_medium' | 'low_only';
  };
  
  // Digest settings
  digest?: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    time?: string; // HH:mm for daily/weekly
    dayOfWeek?: number; // 0-6 for weekly
  };
}

export interface AlertTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'slack' | 'webhook';
  
  // Template content
  subject?: string; // For email
  body: string;
  
  // Available variables that can be used in template
  variables: {
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'object';
    required: boolean;
  }[];
  
  // Template metadata
  isSystem: boolean; // System templates vs user-created
  tenantId?: string; // Null for system templates
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertEscalation {
  id: string;
  ruleId: string;
  tenantId: string;
  
  // Escalation levels
  levels: {
    level: number;
    triggerAfter: number; // Minutes
    actions: AlertAction[];
  }[];
  
  // Settings
  enabled: boolean;
  maxLevel?: number; // Stop escalating after this level
}