export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldown: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  value: any;
  timeWindow?: string;
}

export interface AlertAction {
  type: 'email' | 'sms' | 'slack' | 'webhook' | 'push' | 'workflow';
  config: Record<string, any>;
  template?: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface AlertDelivery {
  id: string;
  alertId: string;
  channel: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  error?: string;
}

export interface EmailConfig {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface SMSConfig {
  to: string[];
  message: string;
  template?: string;
  data?: Record<string, any>;
}

export interface SlackConfig {
  channel: string;
  message: string;
  template?: string;
  data?: Record<string, any>;
  mentions?: string[];
}

export interface AlertWebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body: any;
}

export interface PushConfig {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface AlertTestResult {
  success: boolean;
  message: string;
  deliveredTo: string[];
  errors: string[];
} 