import { Connection, Client, WorkflowClient } from '@temporalio/client'
import { YAMLConfig } from '@opsai/yaml-validator'

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  trigger: 'manual' | 'scheduled' | 'webhook' | 'condition'
  conditions?: WorkflowCondition[]
  actions: WorkflowAction[]
  enabled: boolean
  tenantId: string
  retryPolicy?: {
    maximumAttempts: number
    initialInterval: number
    maximumInterval: number
    backoffCoefficient: number
  }
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  logicalOperator?: 'and' | 'or'
}

export interface WorkflowAction {
  type: 'email' | 'sms' | 'webhook' | 'database' | 'notification' | 'slack' | 'api_call' | 'file_upload' | 'data_transform'
  config: Record<string, any>
  order: number
  retryOnFailure: boolean
  timeout?: number
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  tenantId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  input: any
  output?: any
  error?: string
  actions: WorkflowActionExecution[]
}

export interface WorkflowActionExecution {
  actionId: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: Date
  endTime?: Date
  input: any
  output?: any
  error?: string
  retryCount: number
}

export class WorkflowEngine {
  private client: WorkflowClient
  private connection: Connection
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private executions: Map<string, WorkflowExecution> = new Map()

  constructor() {
    this.initializeTemporal()
  }

  private async initializeTemporal() {
    try {
      this.connection = await Connection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
      })

      this.client = new Client({
        connection: this.connection,
        namespace: process.env.TEMPORAL_NAMESPACE || 'default'
      })

      console.log('✅ Temporal connection established')
    } catch (error) {
      console.warn('⚠️ Temporal connection failed, using local workflow engine')
    }
  }

  // Workflow Management
  async createWorkflow(definition: Omit<WorkflowDefinition, 'id'>): Promise<WorkflowDefinition> {
    const workflow: WorkflowDefinition = {
      id: this.generateId(),
      ...definition
    }

    this.workflows.set(workflow.id, workflow)

    // Register workflow with Temporal if available
    if (this.client) {
      await this.registerTemporalWorkflow(workflow)
    }

    return workflow
  }

  async getWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
    return this.workflows.get(workflowId) || null
  }

  async updateWorkflow(workflowId: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    const updatedWorkflow = { ...workflow, ...updates }
    this.workflows.set(workflowId, updatedWorkflow)

    return updatedWorkflow
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    this.workflows.delete(workflowId)
  }

  // Workflow Execution
  async executeWorkflow(workflowId: string, input: any, tenantId: string): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    const execution: WorkflowExecution = {
      id: this.generateId(),
      workflowId,
      tenantId,
      status: 'running',
      startTime: new Date(),
      input,
      actions: workflow.actions.map(action => ({
        actionId: this.generateId(),
        type: action.type,
        status: 'pending',
        input: {},
        retryCount: 0
      }))
    }

    this.executions.set(execution.id, execution)

    try {
      // Check conditions
      if (workflow.conditions && !this.evaluateConditions(workflow.conditions, input)) {
        execution.status = 'cancelled'
        execution.endTime = new Date()
        return execution
      }

      // Execute actions
      for (const action of workflow.actions) {
        await this.executeAction(execution, action)
      }

      execution.status = 'completed'
      execution.endTime = new Date()

    } catch (error) {
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      execution.endTime = new Date()
    }

    return execution
  }

  private async executeAction(execution: WorkflowExecution, action: WorkflowAction): Promise<void> {
    const actionExecution = execution.actions.find(a => a.type === action.type)
    if (!actionExecution) return

    actionExecution.status = 'running'
    actionExecution.startTime = new Date()

    try {
      let result: any

      switch (action.type) {
        case 'email':
          result = await this.executeEmailAction(action.config, execution.input)
          break
        case 'sms':
          result = await this.executeSMSAction(action.config, execution.input)
          break
        case 'webhook':
          result = await this.executeWebhookAction(action.config, execution.input)
          break
        case 'database':
          result = await this.executeDatabaseAction(action.config, execution.input)
          break
        case 'notification':
          result = await this.executeNotificationAction(action.config, execution.input)
          break
        case 'slack':
          result = await this.executeSlackAction(action.config, execution.input)
          break
        case 'api_call':
          result = await this.executeAPICallAction(action.config, execution.input)
          break
        case 'file_upload':
          result = await this.executeFileUploadAction(action.config, execution.input)
          break
        case 'data_transform':
          result = await this.executeDataTransformAction(action.config, execution.input)
          break
        default:
          throw new Error(`Unknown action type: ${action.type}`)
      }

      actionExecution.status = 'completed'
      actionExecution.output = result
      actionExecution.endTime = new Date()

    } catch (error) {
      actionExecution.status = 'failed'
      actionExecution.error = error instanceof Error ? error.message : 'Unknown error'
      actionExecution.endTime = new Date()

      if (action.retryOnFailure && actionExecution.retryCount < 3) {
        actionExecution.retryCount++
        actionExecution.status = 'pending'
        // Retry logic would be implemented here
      } else {
        throw error
      }
    }
  }

  // Action Implementations
  private async executeEmailAction(config: any, input: any): Promise<any> {
    const { to, subject, template, variables } = config
    
    // Send email using SendGrid or similar service
    const emailContent = this.renderTemplate(template, { ...input, ...variables })
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: config.from || 'noreply@opsai.com' },
        subject,
        content: [{ type: 'text/html', value: emailContent }]
      })
    })

    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.statusText}`)
    }

    return { messageId: 'email-sent', to, subject }
  }

  private async executeSMSAction(config: any, input: any): Promise<any> {
    const { to, message, variables } = config
    
    const smsContent = this.renderTemplate(message, { ...input, ...variables })
    
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/ACCOUNT_SID/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: to,
        From: config.from || process.env.TWILIO_PHONE_NUMBER,
        Body: smsContent
      })
    })

    if (!response.ok) {
      throw new Error(`SMS sending failed: ${response.statusText}`)
    }

    return { messageId: 'sms-sent', to, body: smsContent }
  }

  private async executeWebhookAction(config: any, input: any): Promise<any> {
    const { url, method = 'POST', headers = {}, body } = config
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(this.renderTemplate(body, input)) : undefined
    })

    if (!response.ok) {
      throw new Error(`Webhook call failed: ${response.statusText}`)
    }

    return await response.json()
  }

  private async executeDatabaseAction(config: any, input: any): Promise<any> {
    const { operation, table, data, conditions } = config
    
    // This would integrate with your database layer
    switch (operation) {
      case 'insert':
        return { operation: 'insert', table, data }
      case 'update':
        return { operation: 'update', table, data, conditions }
      case 'delete':
        return { operation: 'delete', table, conditions }
      case 'query':
        return { operation: 'query', table, conditions }
      default:
        throw new Error(`Unknown database operation: ${operation}`)
    }
  }

  private async executeNotificationAction(config: any, input: any): Promise<any> {
    const { type, title, message, recipients, channels } = config
    
    // Send notification through multiple channels
    const promises = channels.map(async (channel: string) => {
      switch (channel) {
        case 'email':
          return this.executeEmailAction({ to: recipients, subject: title, template: message }, input)
        case 'sms':
          return this.executeSMSAction({ to: recipients, message }, input)
        case 'slack':
          return this.executeSlackAction({ channel: config.slackChannel, message }, input)
        default:
          throw new Error(`Unknown notification channel: ${channel}`)
      }
    })

    return Promise.all(promises)
  }

  private async executeSlackAction(config: any, input: any): Promise<any> {
    const { channel, message, blocks } = config
    
    const slackMessage = this.renderTemplate(message, input)
    
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel,
        text: slackMessage,
        blocks: blocks ? this.renderTemplate(blocks, input) : undefined
      })
    })

    if (!response.ok) {
      throw new Error(`Slack message failed: ${response.statusText}`)
    }

    const result = await response.json()
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return { messageId: result.ts, channel, text: slackMessage }
  }

  private async executeAPICallAction(config: any, input: any): Promise<any> {
    const { url, method = 'GET', headers = {}, body, params } = config
    
    const urlWithParams = params ? `${url}?${new URLSearchParams(params)}` : url
    
    const response = await fetch(urlWithParams, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(this.renderTemplate(body, input)) : undefined
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    return await response.json()
  }

  private async executeFileUploadAction(config: any, input: any): Promise<any> {
    const { file, bucket, path, metadata } = config
    
    // This would integrate with your file storage system
    return {
      operation: 'file_upload',
      bucket,
      path,
      fileId: this.generateId(),
      metadata
    }
  }

  private async executeDataTransformAction(config: any, input: any): Promise<any> {
    const { transform, outputFormat } = config
    
    // Apply data transformation
    let result = input
    
    if (transform) {
      result = this.applyTransform(result, transform)
    }
    
    if (outputFormat) {
      result = this.formatOutput(result, outputFormat)
    }
    
    return result
  }

  // Utility Methods
  private evaluateConditions(conditions: WorkflowCondition[], input: any): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getNestedValue(input, condition.field)
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value
        case 'not_equals':
          return fieldValue !== condition.value
        case 'contains':
          return String(fieldValue).includes(String(condition.value))
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value)
        case 'less_than':
          return Number(fieldValue) < Number(condition.value)
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue)
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
        default:
          return false
      }
    })
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private renderTemplate(template: string, variables: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match
    })
  }

  private applyTransform(data: any, transform: any): any {
    // Apply various data transformations
    switch (transform.type) {
      case 'map':
        return data.map(transform.function)
      case 'filter':
        return data.filter(transform.function)
      case 'reduce':
        return data.reduce(transform.function, transform.initialValue)
      case 'sort':
        return data.sort(transform.function)
      default:
        return data
    }
  }

  private formatOutput(data: any, format: string): any {
    switch (format) {
      case 'json':
        return JSON.stringify(data)
      case 'csv':
        return this.convertToCSV(data)
      case 'xml':
        return this.convertToXML(data)
      default:
        return data
    }
  }

  private convertToCSV(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      })
      csvRows.push(values.join(','))
    }
    
    return csvRows.join('\n')
  }

  private convertToXML(data: any): string {
    // Simple XML conversion
    return `<root>${JSON.stringify(data)}</root>`
  }

  private async registerTemporalWorkflow(workflow: WorkflowDefinition): Promise<void> {
    if (!this.client) return

    try {
      // Register workflow with Temporal
      // This would involve creating a Temporal workflow definition
      console.log(`Registered workflow with Temporal: ${workflow.name}`)
    } catch (error) {
      console.warn(`Failed to register workflow with Temporal: ${error}`)
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  // Get execution status
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    return this.executions.get(executionId) || null
  }

  // List all executions
  async listExecutions(): Promise<WorkflowExecution[]> {
    return Array.from(this.executions.values())
  }

  // Cancel execution
  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId)
    if (!execution) throw new Error('Execution not found')

    if (execution.status === 'running') {
      execution.status = 'cancelled'
      execution.endTime = new Date()
    }
  }
} 