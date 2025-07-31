import { YAMLConfig } from '@opsai/yaml-validator'

export interface Alert {
  id: string
  tenantId: string
  type: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  source: string
  metadata: Record<string, any>
  status: 'active' | 'acknowledged' | 'resolved'
  createdAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
  acknowledgedBy?: string
  resolvedBy?: string
}

export interface AlertChannel {
  id: string
  tenantId: string
  name: string
  type: 'email' | 'slack' | 'sms' | 'webhook' | 'pagerduty' | 'discord'
  config: Record<string, any>
  enabled: boolean
  filters: AlertFilter[]
  createdAt: Date
  updatedAt: Date
}

export interface AlertFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  logicalOperator?: 'and' | 'or'
}

export interface AlertTemplate {
  id: string
  tenantId: string
  name: string
  type: string
  subject: string
  body: string
  variables: string[]
  channels: string[]
  createdAt: Date
  updatedAt: Date
}

export interface AlertRule {
  id: string
  tenantId: string
  name: string
  description: string
  conditions: AlertCondition[]
  actions: AlertAction[]
  enabled: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number // seconds
  lastTriggered?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AlertCondition {
  metric: string
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains'
  threshold: number
  duration: number // seconds
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count'
}

export interface AlertAction {
  type: 'create_alert' | 'send_notification' | 'webhook' | 'escalate'
  config: Record<string, any>
  delay?: number // seconds
  retryCount?: number
}

export class AlertManager {
  private alerts: Map<string, Alert[]> = new Map()
  private channels: Map<string, AlertChannel[]> = new Map()
  private templates: Map<string, AlertTemplate[]> = new Map()
  private rules: Map<string, AlertRule[]> = new Map()

  constructor() {
    this.initializeDefaultTemplates()
  }

  // Alert Management
  async createAlert(alertData: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    const alert: Alert = {
      id: this.generateId(),
      ...alertData,
      createdAt: new Date()
    }

    if (!this.alerts.has(alert.tenantId)) {
      this.alerts.set(alert.tenantId, [])
    }

    this.alerts.get(alert.tenantId)!.push(alert)

    // Process alert through rules
    await this.processAlertRules(alert)

    // Send notifications
    await this.sendNotifications(alert)

    console.log(`🚨 Alert created: ${alert.title} (${alert.type})`)
    return alert
  }

  async getAlerts(tenantId: string, filters: Record<string, any> = {}): Promise<Alert[]> {
    const tenantAlerts = this.alerts.get(tenantId) || []
    
    return tenantAlerts.filter(alert => {
      if (filters.status && alert.status !== filters.status) return false
      if (filters.type && alert.type !== filters.type) return false
      if (filters.source && alert.source !== filters.source) return false
      return true
    })
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    for (const [tenantId, alerts] of this.alerts.entries()) {
      const alertIndex = alerts.findIndex(a => a.id === alertId)
      if (alertIndex !== -1) {
        alerts[alertIndex].status = 'acknowledged'
        alerts[alertIndex].acknowledgedAt = new Date()
        alerts[alertIndex].acknowledgedBy = userId
        return alerts[alertIndex]
      }
    }
    throw new Error('Alert not found')
  }

  async resolveAlert(alertId: string, userId: string): Promise<Alert> {
    for (const [tenantId, alerts] of this.alerts.entries()) {
      const alertIndex = alerts.findIndex(a => a.id === alertId)
      if (alertIndex !== -1) {
        alerts[alertIndex].status = 'resolved'
        alerts[alertIndex].resolvedAt = new Date()
        alerts[alertIndex].resolvedBy = userId
        return alerts[alertIndex]
      }
    }
    throw new Error('Alert not found')
  }

  // Channel Management
  async createChannel(channelData: Omit<AlertChannel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertChannel> {
    const channel: AlertChannel = {
      id: this.generateId(),
      ...channelData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.channels.has(channel.tenantId)) {
      this.channels.set(channel.tenantId, [])
    }

    this.channels.get(channel.tenantId)!.push(channel)
    return channel
  }

  async getChannels(tenantId: string): Promise<AlertChannel[]> {
    return this.channels.get(tenantId) || []
  }

  async updateChannel(channelId: string, updates: Partial<AlertChannel>): Promise<AlertChannel> {
    for (const [tenantId, channels] of this.channels.entries()) {
      const channelIndex = channels.findIndex(c => c.id === channelId)
      if (channelIndex !== -1) {
        channels[channelIndex] = { ...channels[channelIndex], ...updates, updatedAt: new Date() }
        return channels[channelIndex]
      }
    }
    throw new Error('Channel not found')
  }

  // Template Management
  async createTemplate(templateData: Omit<AlertTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertTemplate> {
    const template: AlertTemplate = {
      id: this.generateId(),
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.templates.has(template.tenantId)) {
      this.templates.set(template.tenantId, [])
    }

    this.templates.get(template.tenantId)!.push(template)
    return template
  }

  async getTemplates(tenantId: string): Promise<AlertTemplate[]> {
    return this.templates.get(tenantId) || []
  }

  // Rule Management
  async createRule(ruleData: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertRule> {
    const rule: AlertRule = {
      id: this.generateId(),
      ...ruleData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (!this.rules.has(rule.tenantId)) {
      this.rules.set(rule.tenantId, [])
    }

    this.rules.get(rule.tenantId)!.push(rule)
    return rule
  }

  async getRules(tenantId: string): Promise<AlertRule[]> {
    return this.rules.get(tenantId) || []
  }

  async updateRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    for (const [tenantId, rules] of this.rules.entries()) {
      const ruleIndex = rules.findIndex(r => r.id === ruleId)
      if (ruleIndex !== -1) {
        rules[ruleIndex] = { ...rules[ruleIndex], ...updates, updatedAt: new Date() }
        return rules[ruleIndex]
      }
    }
    throw new Error('Rule not found')
  }

  // Setup Alerts
  async setupAlerts(tenantId: string, config: YAMLConfig): Promise<void> {
    try {
      console.log(`Setting up alerts for tenant: ${tenantId}`)

      // Create default channels
      await this.setupDefaultChannels(tenantId)

      // Create default templates
      await this.setupDefaultTemplates(tenantId)

      // Create default rules
      await this.setupDefaultRules(tenantId)

      console.log(`✅ Alert setup completed for tenant: ${tenantId}`)

    } catch (error) {
      console.error(`❌ Alert setup failed: ${error}`)
      throw error
    }
  }

  private async setupDefaultChannels(tenantId: string): Promise<void> {
    const defaultChannels = [
      {
        name: 'Email Notifications',
        type: 'email' as const,
        config: {
          recipients: ['admin@example.com'],
          from: 'alerts@opsai.com'
        },
        enabled: true,
        filters: []
      },
      {
        name: 'Slack Notifications',
        type: 'slack' as const,
        config: {
          channel: '#alerts',
          webhookUrl: process.env.SLACK_WEBHOOK_URL
        },
        enabled: true,
        filters: []
      }
    ]

    for (const channel of defaultChannels) {
      await this.createChannel({
        tenantId,
        ...channel
      })
    }
  }

  private async setupDefaultTemplates(tenantId: string): Promise<void> {
    const defaultTemplates = [
      {
        name: 'System Error',
        type: 'error',
        subject: '🚨 System Error Alert',
        body: `
Alert: {{title}}
Message: {{message}}
Source: {{source}}
Time: {{createdAt}}
Severity: {{type}}

Please investigate immediately.
        `,
        variables: ['title', 'message', 'source', 'createdAt', 'type'],
        channels: ['email', 'slack']
      },
      {
        name: 'Performance Warning',
        type: 'warning',
        subject: '⚠️ Performance Warning',
        body: `
Warning: {{title}}
Message: {{message}}
Metric: {{metadata.metric}}
Value: {{metadata.value}}
Threshold: {{metadata.threshold}}

Monitor closely.
        `,
        variables: ['title', 'message', 'metadata'],
        channels: ['slack']
      }
    ]

    for (const template of defaultTemplates) {
      await this.createTemplate({
        tenantId,
        ...template
      })
    }
  }

  private async setupDefaultRules(tenantId: string): Promise<void> {
    const defaultRules = [
      {
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds threshold',
        conditions: [
          {
            metric: 'error_rate',
            operator: 'greater_than',
            threshold: 5,
            duration: 300,
            aggregation: 'avg'
          }
        ],
        actions: [
          {
            type: 'create_alert',
            config: {
              type: 'error',
              title: 'High Error Rate Detected',
              message: 'Error rate has exceeded the threshold',
              source: 'monitoring'
            }
          },
          {
            type: 'send_notification',
            config: {
              channels: ['email', 'slack'],
              template: 'System Error'
            }
          }
        ],
        enabled: true,
        priority: 'high',
        cooldown: 300
      },
      {
        name: 'High Response Time',
        description: 'Alert when API response time is too high',
        conditions: [
          {
            metric: 'api_response_time',
            operator: 'greater_than',
            threshold: 2000,
            duration: 60,
            aggregation: 'avg'
          }
        ],
        actions: [
          {
            type: 'create_alert',
            config: {
              type: 'warning',
              title: 'High Response Time',
              message: 'API response time has increased significantly',
              source: 'monitoring'
            }
          },
          {
            type: 'send_notification',
            config: {
              channels: ['slack'],
              template: 'Performance Warning'
            }
          }
        ],
        enabled: true,
        priority: 'medium',
        cooldown: 300
      }
    ]

    for (const rule of defaultRules) {
      await this.createRule({
        tenantId,
        ...rule
      })
    }
  }

  // Alert Processing
  private async processAlertRules(alert: Alert): Promise<void> {
    const rules = this.rules.get(alert.tenantId) || []
    
    for (const rule of rules) {
      if (!rule.enabled) continue

      // Check cooldown
      if (rule.lastTriggered && 
          Date.now() - rule.lastTriggered.getTime() < rule.cooldown * 1000) {
        continue
      }

      const shouldTrigger = await this.evaluateRuleConditions(rule, alert)
      
      if (shouldTrigger) {
        await this.executeRuleActions(rule, alert)
        rule.lastTriggered = new Date()
      }
    }
  }

  private async evaluateRuleConditions(rule: AlertRule, alert: Alert): Promise<boolean> {
    // This would evaluate conditions against metrics
    // For now, we'll use a simple evaluation
    return rule.conditions.every(condition => {
      // Simple condition evaluation
      return true // Placeholder
    })
  }

  private async executeRuleActions(rule: AlertRule, alert: Alert): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'create_alert':
            await this.createAlert({
              tenantId: alert.tenantId,
              type: action.config.type,
              title: action.config.title,
              message: action.config.message,
              source: action.config.source,
              metadata: { triggeredBy: rule.name, originalAlert: alert.id }
            })
            break

          case 'send_notification':
            await this.sendNotification(action.config, alert)
            break

          case 'webhook':
            await this.sendWebhook(action.config, alert)
            break

          case 'escalate':
            await this.escalateAlert(alert, action.config)
            break
        }
      } catch (error) {
        console.error(`Failed to execute action ${action.type}: ${error}`)
      }
    }
  }

  // Notification Sending
  private async sendNotifications(alert: Alert): Promise<void> {
    const channels = this.channels.get(alert.tenantId) || []
    
    for (const channel of channels) {
      if (!channel.enabled) continue

      // Check if alert matches channel filters
      if (!this.matchesChannelFilters(alert, channel.filters)) continue

      try {
        await this.sendToChannel(channel, alert)
      } catch (error) {
        console.error(`Failed to send to channel ${channel.name}: ${error}`)
      }
    }
  }

  private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmail(channel.config, alert)
        break
      case 'slack':
        await this.sendSlack(channel.config, alert)
        break
      case 'sms':
        await this.sendSMS(channel.config, alert)
        break
      case 'webhook':
        await this.sendWebhook(channel.config, alert)
        break
      case 'pagerduty':
        await this.sendPagerDuty(channel.config, alert)
        break
      case 'discord':
        await this.sendDiscord(channel.config, alert)
        break
      default:
        throw new Error(`Unknown channel type: ${channel.type}`)
    }
  }

  private async sendEmail(config: any, alert: Alert): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: config.recipients.map((email: string) => ({ email })) }],
        from: { email: config.from },
        subject: `🚨 ${alert.title}`,
        content: [{ type: 'text/html', value: this.formatAlertMessage(alert) }]
      })
    })

    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.statusText}`)
    }
  }

  private async sendSlack(config: any, alert: Alert): Promise<void> {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: config.channel,
        text: `🚨 *${alert.title}*\n${alert.message}\nSource: ${alert.source}`,
        attachments: [
          {
            color: this.getAlertColor(alert.type),
            fields: [
              { title: 'Type', value: alert.type, short: true },
              { title: 'Source', value: alert.source, short: true },
              { title: 'Time', value: alert.createdAt.toISOString(), short: true }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Slack sending failed: ${response.statusText}`)
    }
  }

  private async sendSMS(config: any, alert: Alert): Promise<void> {
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/ACCOUNT_SID/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: config.phoneNumber,
        From: process.env.TWILIO_PHONE_NUMBER,
        Body: `🚨 ${alert.title}: ${alert.message}`
      })
    })

    if (!response.ok) {
      throw new Error(`SMS sending failed: ${response.statusText}`)
    }
  }

  private async sendWebhook(config: any, alert: Alert): Promise<void> {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert,
        timestamp: new Date().toISOString(),
        signature: this.generateWebhookSignature(alert, config.secret)
      })
    })

    if (!response.ok) {
      throw new Error(`Webhook sending failed: ${response.statusText}`)
    }
  }

  private async sendPagerDuty(config: any, alert: Alert): Promise<void> {
    const response = await fetch('https://api.pagerduty.com/incidents', {
      method: 'POST',
      headers: {
        'Authorization': `Token token=${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        incident: {
          type: 'incident',
          title: alert.title,
          service: { id: config.serviceId, type: 'service_reference' },
          urgency: alert.type === 'critical' ? 'high' : 'low',
          body: { type: 'incident_body', details: alert.message }
        }
      })
    })

    if (!response.ok) {
      throw new Error(`PagerDuty sending failed: ${response.statusText}`)
    }
  }

  private async sendDiscord(config: any, alert: Alert): Promise<void> {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: alert.title,
            description: alert.message,
            color: this.getDiscordColor(alert.type),
            fields: [
              { name: 'Type', value: alert.type, inline: true },
              { name: 'Source', value: alert.source, inline: true },
              { name: 'Time', value: alert.createdAt.toISOString(), inline: true }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Discord sending failed: ${response.statusText}`)
    }
  }

  // Utility Methods
  private matchesChannelFilters(alert: Alert, filters: AlertFilter[]): boolean {
    if (filters.length === 0) return true

    return filters.every(filter => {
      const value = this.getNestedValue(alert, filter.field)
      
      switch (filter.operator) {
        case 'equals':
          return value === filter.value
        case 'not_equals':
          return value !== filter.value
        case 'contains':
          return String(value).includes(String(filter.value))
        case 'greater_than':
          return Number(value) > Number(filter.value)
        case 'less_than':
          return Number(value) < Number(filter.value)
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value)
        case 'not_in':
          return Array.isArray(filter.value) && !filter.value.includes(value)
        default:
          return false
      }
    })
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private formatAlertMessage(alert: Alert): string {
    return `
      <h2>🚨 ${alert.title}</h2>
      <p><strong>Message:</strong> ${alert.message}</p>
      <p><strong>Type:</strong> ${alert.type}</p>
      <p><strong>Source:</strong> ${alert.source}</p>
      <p><strong>Time:</strong> ${alert.createdAt.toISOString()}</p>
      ${Object.entries(alert.metadata).map(([key, value]) => 
        `<p><strong>${key}:</strong> ${JSON.stringify(value)}</p>`
      ).join('')}
    `
  }

  private getAlertColor(type: string): string {
    switch (type) {
      case 'critical': return '#ff0000'
      case 'error': return '#ff6b6b'
      case 'warning': return '#ffa726'
      case 'info': return '#42a5f5'
      default: return '#757575'
    }
  }

  private getDiscordColor(type: string): number {
    switch (type) {
      case 'critical': return 0xff0000
      case 'error': return 0xff6b6b
      case 'warning': return 0xffa726
      case 'info': return 0x42a5f5
      default: return 0x757575
    }
  }

  private generateWebhookSignature(alert: Alert, secret: string): string {
    const payload = JSON.stringify(alert)
    const crypto = require('crypto')
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }

  private async escalateAlert(alert: Alert, config: any): Promise<void> {
    // Implement escalation logic
    console.log(`Escalating alert: ${alert.id}`)
  }

  private async sendNotification(config: any, alert: Alert): Promise<void> {
    // Send notification using specified channels and template
    console.log(`Sending notification for alert: ${alert.id}`)
  }

  private initializeDefaultTemplates(): void {
    // Initialize with default templates
    console.log('Initializing default alert templates')
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
} 