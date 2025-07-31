import { AlertRule, AlertCondition, AlertAction, AlertTemplate } from '../types'
import { AlertService } from '../services/alert-service'

export interface AlertNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'aggregation' | 'correlation'
  name: string
  description: string
  position: { x: number; y: number }
  config: any
  connections: AlertConnection[]
  icon?: string
  color?: string
}

export interface AlertConnection {
  id: string
  sourceNodeId: string
  targetNodeId: string
  sourcePort: string
  targetPort: string
  condition?: string
  label?: string
}

export interface AlertCanvas {
  id: string
  name: string
  nodes: AlertNode[]
  connections: AlertConnection[]
  zoom: number
  pan: { x: number; y: number }
  selectedNodes: string[]
  selectedConnections: string[]
}

export interface AlertNodeTemplate {
  id: string
  type: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  configSchema: any
  defaultConfig: any
  inputs: AlertNodePort[]
  outputs: AlertNodePort[]
}

export interface AlertNodePort {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'event'
  required: boolean
  description: string
}

export interface AlertRuleBuilder {
  id: string
  name: string
  description: string
  tenantId: string
  canvas: AlertCanvas
  isActive: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export class VisualAlertBuilder {
  private alertService: AlertService
  private nodeTemplates: Map<string, AlertNodeTemplate>
  private ruleBuilders: Map<string, AlertRuleBuilder>

  constructor() {
    this.alertService = new AlertService()
    this.nodeTemplates = new Map()
    this.ruleBuilders = new Map()
    this.initializeNodeTemplates()
  }

  /**
   * Initialize node templates
   */
  private initializeNodeTemplates(): void {
    // Trigger templates
    this.addNodeTemplate({
      id: 'data-trigger',
      type: 'trigger',
      name: 'Data Trigger',
      description: 'Trigger on data changes',
      category: 'Triggers',
      icon: 'database',
      color: '#3B82F6',
      configSchema: {
        type: 'object',
        properties: {
          table: { type: 'string' },
          field: { type: 'string' },
          operation: { type: 'string', enum: ['insert', 'update', 'delete'] }
        }
      },
      defaultConfig: {
        table: '',
        field: '',
        operation: 'insert'
      },
      inputs: [],
      outputs: [
        { id: 'data', name: 'Data', type: 'object', required: true, description: 'Changed data' },
        { id: 'timestamp', name: 'Timestamp', type: 'string', required: true, description: 'Change timestamp' }
      ]
    })

    this.addNodeTemplate({
      id: 'metric-trigger',
      type: 'trigger',
      name: 'Metric Trigger',
      description: 'Trigger on metric thresholds',
      category: 'Triggers',
      icon: 'trending-up',
      color: '#10B981',
      configSchema: {
        type: 'object',
        properties: {
          metric: { type: 'string' },
          threshold: { type: 'number' },
          operator: { type: 'string', enum: ['>', '<', '>=', '<=', '==', '!='] },
          window: { type: 'number' }
        }
      },
      defaultConfig: {
        metric: '',
        threshold: 0,
        operator: '>',
        window: 300
      },
      inputs: [],
      outputs: [
        { id: 'value', name: 'Value', type: 'number', required: true, description: 'Current metric value' },
        { id: 'threshold', name: 'Threshold', type: 'number', required: true, description: 'Threshold value' }
      ]
    })

    this.addNodeTemplate({
      id: 'api-trigger',
      type: 'trigger',
      name: 'API Trigger',
      description: 'Trigger on API events',
      category: 'Triggers',
      icon: 'globe',
      color: '#F59E0B',
      configSchema: {
        type: 'object',
        properties: {
          endpoint: { type: 'string' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
          statusCodes: { type: 'array', items: { type: 'number' } }
        }
      },
      defaultConfig: {
        endpoint: '',
        method: 'GET',
        statusCodes: [500, 502, 503, 504]
      },
      inputs: [],
      outputs: [
        { id: 'request', name: 'Request', type: 'object', required: true, description: 'Request data' },
        { id: 'response', name: 'Response', type: 'object', required: true, description: 'Response data' }
      ]
    })

    // Condition templates
    this.addNodeTemplate({
      id: 'threshold-condition',
      type: 'condition',
      name: 'Threshold Condition',
      description: 'Check if value exceeds threshold',
      category: 'Conditions',
      icon: 'bar-chart',
      color: '#EF4444',
      configSchema: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          operator: { type: 'string', enum: ['>', '<', '>=', '<=', '==', '!=', 'contains', 'regex'] },
          value: { type: 'string' },
          duration: { type: 'number' }
        }
      },
      defaultConfig: {
        field: '',
        operator: '>',
        value: '',
        duration: 0
      },
      inputs: [
        { id: 'data', name: 'Data', type: 'object', required: true, description: 'Data to check' }
      ],
      outputs: [
        { id: 'true', name: 'True', type: 'object', required: true, description: 'Data if condition is true' },
        { id: 'false', name: 'False', type: 'object', required: true, description: 'Data if condition is false' }
      ]
    })

    this.addNodeTemplate({
      id: 'time-condition',
      type: 'condition',
      name: 'Time Condition',
      description: 'Check time-based conditions',
      category: 'Conditions',
      icon: 'clock',
      color: '#8B5CF6',
      configSchema: {
        type: 'object',
        properties: {
          timeField: { type: 'string' },
          operator: { type: 'string', enum: ['before', 'after', 'between', 'within'] },
          timeValue: { type: 'string' },
          timezone: { type: 'string' }
        }
      },
      defaultConfig: {
        timeField: 'timestamp',
        operator: 'within',
        timeValue: '1h',
        timezone: 'UTC'
      },
      inputs: [
        { id: 'data', name: 'Data', type: 'object', required: true, description: 'Data to check' }
      ],
      outputs: [
        { id: 'true', name: 'True', type: 'object', required: true, description: 'Data if condition is true' },
        { id: 'false', name: 'False', type: 'object', required: true, description: 'Data if condition is false' }
      ]
    })

    // Action templates
    this.addNodeTemplate({
      id: 'email-action',
      type: 'action',
      name: 'Send Email',
      description: 'Send email notification',
      category: 'Actions',
      icon: 'mail',
      color: '#06B6D4',
      configSchema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          template: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'normal', 'high'] }
        }
      },
      defaultConfig: {
        to: '',
        subject: 'Alert: {alert_name}',
        template: 'default',
        priority: 'normal'
      },
      inputs: [
        { id: 'data', name: 'Data', type: 'object', required: true, description: 'Alert data' }
      ],
      outputs: [
        { id: 'messageId', name: 'Message ID', type: 'string', required: true, description: 'Email message ID' },
        { id: 'status', name: 'Status', type: 'string', required: true, description: 'Send status' }
      ]
    })

    this.addNodeTemplate({
      id: 'slack-action',
      type: 'action',
      name: 'Slack Notification',
      description: 'Send Slack message',
      category: 'Actions',
      icon: 'message-circle',
      color: '#4F46E5',
      configSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string' },
          message: { type: 'string' },
          attachments: { type: 'boolean' }
        }
      },
      defaultConfig: {
        channel: '#alerts',
        message: 'Alert: {alert_name}',
        attachments: true
      },
      inputs: [
        { id: 'data', name: 'Data', type: 'object', required: true, description: 'Alert data' }
      ],
      outputs: [
        { id: 'ts', name: 'Timestamp', type: 'string', required: true, description: 'Message timestamp' },
        { id: 'status', name: 'Status', type: 'string', required: true, description: 'Send status' }
      ]
    })

    this.addNodeTemplate({
      id: 'webhook-action',
      type: 'action',
      name: 'Webhook',
      description: 'Send webhook notification',
      category: 'Actions',
      icon: 'webhook',
      color: '#EC4899',
      configSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT'] },
          headers: { type: 'object' },
          body: { type: 'string' }
        }
      },
      defaultConfig: {
        url: '',
        method: 'POST',
        headers: {},
        body: '{{data}}'
      },
      inputs: [
        { id: 'data', name: 'Data', type: 'object', required: true, description: 'Alert data' }
      ],
      outputs: [
        { id: 'response', name: 'Response', type: 'object', required: true, description: 'Webhook response' },
        { id: 'status', name: 'Status', type: 'number', required: true, description: 'Response status' }
      ]
    })

    // Aggregation templates
    this.addNodeTemplate({
      id: 'count-aggregation',
      type: 'aggregation',
      name: 'Count Events',
      description: 'Count events over time window',
      category: 'Aggregations',
      icon: 'hash',
      color: '#059669',
      configSchema: {
        type: 'object',
        properties: {
          window: { type: 'number' },
          groupBy: { type: 'string' },
          minCount: { type: 'number' }
        }
      },
      defaultConfig: {
        window: 300,
        groupBy: '',
        minCount: 1
      },
      inputs: [
        { id: 'events', name: 'Events', type: 'array', required: true, description: 'Events to count' }
      ],
      outputs: [
        { id: 'count', name: 'Count', type: 'number', required: true, description: 'Event count' },
        { id: 'groups', name: 'Groups', type: 'object', required: true, description: 'Grouped counts' }
      ]
    })

    this.addNodeTemplate({
      id: 'rate-aggregation',
      type: 'aggregation',
      name: 'Rate Calculation',
      description: 'Calculate event rate over time',
      category: 'Aggregations',
      icon: 'trending-up',
      color: '#DC2626',
      configSchema: {
        type: 'object',
        properties: {
          window: { type: 'number' },
          unit: { type: 'string', enum: ['second', 'minute', 'hour', 'day'] }
        }
      },
      defaultConfig: {
        window: 60,
        unit: 'minute'
      },
      inputs: [
        { id: 'events', name: 'Events', type: 'array', required: true, description: 'Events to calculate rate' }
      ],
      outputs: [
        { id: 'rate', name: 'Rate', type: 'number', required: true, description: 'Events per unit time' },
        { id: 'trend', name: 'Trend', type: 'string', required: true, description: 'Rate trend' }
      ]
    })

    // Correlation templates
    this.addNodeTemplate({
      id: 'correlation-node',
      type: 'correlation',
      name: 'Event Correlation',
      description: 'Correlate multiple events',
      category: 'Correlations',
      icon: 'link',
      color: '#7C3AED',
      configSchema: {
        type: 'object',
        properties: {
          correlationKey: { type: 'string' },
          timeWindow: { type: 'number' },
          minEvents: { type: 'number' }
        }
      },
      defaultConfig: {
        correlationKey: 'id',
        timeWindow: 300,
        minEvents: 2
      },
      inputs: [
        { id: 'events1', name: 'Events 1', type: 'array', required: true, description: 'First event set' },
        { id: 'events2', name: 'Events 2', type: 'array', required: true, description: 'Second event set' }
      ],
      outputs: [
        { id: 'correlated', name: 'Correlated', type: 'array', required: true, description: 'Correlated events' },
        { id: 'correlationScore', name: 'Score', type: 'number', required: true, description: 'Correlation score' }
      ]
    })
  }

  /**
   * Add node template
   */
  addNodeTemplate(template: AlertNodeTemplate): void {
    this.nodeTemplates.set(template.id, template)
  }

  /**
   * Get node templates by category
   */
  getNodeTemplatesByCategory(): Record<string, AlertNodeTemplate[]> {
    const categories: Record<string, AlertNodeTemplate[]> = {}

    for (const template of this.nodeTemplates.values()) {
      if (!categories[template.category]) {
        categories[template.category] = []
      }
      categories[template.category].push(template)
    }

    return categories
  }

  /**
   * Create new alert rule builder
   */
  createRuleBuilder(
    name: string,
    description: string,
    tenantId: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): AlertRuleBuilder {
    const canvas: AlertCanvas = {
      id: `canvas_${Date.now()}`,
      name,
      nodes: [],
      connections: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
      selectedNodes: [],
      selectedConnections: []
    }

    const ruleBuilder: AlertRuleBuilder = {
      id: `rule_${Date.now()}`,
      name,
      description,
      tenantId,
      canvas,
      isActive: false,
      priority,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.ruleBuilders.set(ruleBuilder.id, ruleBuilder)
    return ruleBuilder
  }

  /**
   * Add node to canvas
   */
  addNode(
    ruleBuilderId: string,
    templateId: string,
    position: { x: number; y: number },
    config?: any
  ): AlertNode {
    const ruleBuilder = this.ruleBuilders.get(ruleBuilderId)
    if (!ruleBuilder) {
      throw new Error('Rule builder not found')
    }

    const template = this.nodeTemplates.get(templateId)
    if (!template) {
      throw new Error('Node template not found')
    }

    const node: AlertNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.type as any,
      name: template.name,
      description: template.description,
      position,
      config: config || template.defaultConfig,
      connections: [],
      icon: template.icon,
      color: template.color
    }

    ruleBuilder.canvas.nodes.push(node)
    ruleBuilder.updatedAt = new Date()
    return node
  }

  /**
   * Connect nodes
   */
  connectNodes(
    ruleBuilderId: string,
    sourceNodeId: string,
    targetNodeId: string,
    sourcePort: string,
    targetPort: string,
    condition?: string
  ): AlertConnection {
    const ruleBuilder = this.ruleBuilders.get(ruleBuilderId)
    if (!ruleBuilder) {
      throw new Error('Rule builder not found')
    }

    const sourceNode = ruleBuilder.canvas.nodes.find(n => n.id === sourceNodeId)
    const targetNode = ruleBuilder.canvas.nodes.find(n => n.id === targetNodeId)

    if (!sourceNode || !targetNode) {
      throw new Error('Source or target node not found')
    }

    const connection: AlertConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceNodeId,
      targetNodeId,
      sourcePort,
      targetPort,
      condition,
      label: condition || `${sourcePort} → ${targetPort}`
    }

    ruleBuilder.canvas.connections.push(connection)
    sourceNode.connections.push(connection)
    ruleBuilder.updatedAt = new Date()

    return connection
  }

  /**
   * Remove node from canvas
   */
  removeNode(ruleBuilderId: string, nodeId: string): void {
    const ruleBuilder = this.ruleBuilders.get(ruleBuilderId)
    if (!ruleBuilder) {
      throw new Error('Rule builder not found')
    }

    // Remove node
    ruleBuilder.canvas.nodes = ruleBuilder.canvas.nodes.filter(n => n.id !== nodeId)

    // Remove connections
    ruleBuilder.canvas.connections = ruleBuilder.canvas.connections.filter(
      c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    )

    // Update node connections
    ruleBuilder.canvas.nodes.forEach(node => {
      node.connections = node.connections.filter(c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId)
    })

    ruleBuilder.updatedAt = new Date()
  }

  /**
   * Update node config
   */
  updateNodeConfig(ruleBuilderId: string, nodeId: string, config: any): void {
    const ruleBuilder = this.ruleBuilders.get(ruleBuilderId)
    if (!ruleBuilder) {
      throw new Error('Rule builder not found')
    }

    const node = ruleBuilder.canvas.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error('Node not found')
    }

    node.config = { ...node.config, ...config }
    ruleBuilder.updatedAt = new Date()
  }

  /**
   * Validate alert rule
   */
  validateAlertRule(ruleBuilderId: string): { valid: boolean; errors: string[] } {
    const ruleBuilder = this.ruleBuilders.get(ruleBuilderId)
    if (!ruleBuilder) {
      return { valid: false, errors: ['Rule builder not found'] }
    }

    const errors: string[] = []

    // Check for triggers
    const triggers = ruleBuilder.canvas.nodes.filter(n => n.type === 'trigger')
    if (triggers.length === 0) {
      errors.push('Alert rule must have at least one trigger')
    }

    // Check for actions
    const actions = ruleBuilder.canvas.nodes.filter(n => n.type === 'action')
    if (actions.length === 0) {
      errors.push('Alert rule must have at least one action')
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>()
    ruleBuilder.canvas.connections.forEach(conn => {
      connectedNodeIds.add(conn.sourceNodeId)
      connectedNodeIds.add(conn.targetNodeId)
    })

    const disconnectedNodes = ruleBuilder.canvas.nodes.filter(n => !connectedNodeIds.has(n.id))
    if (disconnectedNodes.length > 0) {
      errors.push(`Disconnected nodes: ${disconnectedNodes.map(n => n.name).join(', ')}`)
    }

    // Check for cycles
    if (this.hasCycles(ruleBuilder.canvas)) {
      errors.push('Alert rule contains cycles')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check for cycles in alert rule
   */
  private hasCycles(canvas: AlertCanvas): boolean {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true // Cycle detected
      }

      if (visited.has(nodeId)) {
        return false
      }

      visited.add(nodeId)
      recursionStack.add(nodeId)

      const outgoingConnections = canvas.connections.filter(c => c.sourceNodeId === nodeId)
      for (const conn of outgoingConnections) {
        if (dfs(conn.targetNodeId)) {
          return true
        }
      }

      recursionStack.delete(nodeId)
      return false
    }

    for (const node of canvas.nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Convert canvas to alert rule
   */
  async canvasToAlertRule(ruleBuilderId: string): Promise<AlertRule> {
    const ruleBuilder = this.ruleBuilders.get(ruleBuilderId)
    if (!ruleBuilder) {
      throw new Error('Rule builder not found')
    }

    // Validate alert rule
    const validation = this.validateAlertRule(ruleBuilderId)
    if (!validation.valid) {
      throw new Error(`Invalid alert rule: ${validation.errors.join(', ')}`)
    }

    // Convert nodes to conditions and actions
    const conditions: AlertCondition[] = ruleBuilder.canvas.nodes
      .filter(n => n.type === 'condition')
      .map(node => ({
        id: node.id,
        type: this.mapNodeTypeToConditionType(node.type),
        field: node.config.field || '',
        operator: node.config.operator || '==',
        value: node.config.value || '',
        duration: node.config.duration || 0
      }))

    const actions: AlertAction[] = ruleBuilder.canvas.nodes
      .filter(n => n.type === 'action')
      .map(node => ({
        id: node.id,
        type: this.mapNodeTypeToActionType(node.type),
        config: node.config,
        template: this.getActionTemplate(node.type, node.config)
      }))

    // Create alert rule
    const alertRule: AlertRule = {
      id: ruleBuilder.id,
      name: ruleBuilder.name,
      description: ruleBuilder.description,
      tenantId: ruleBuilder.tenantId,
      conditions,
      actions,
      isActive: ruleBuilder.isActive,
      priority: ruleBuilder.priority,
      tags: ruleBuilder.tags,
      createdAt: ruleBuilder.createdAt,
      updatedAt: new Date()
    }

    // Save alert rule
    return await this.alertService.createAlertRule(alertRule)
  }

  /**
   * Convert alert rule to canvas
   */
  alertRuleToCanvas(alertRule: AlertRule): AlertCanvas {
    const canvas: AlertCanvas = {
      id: `canvas_${alertRule.id}`,
      name: alertRule.name,
      nodes: [],
      connections: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
      selectedNodes: [],
      selectedConnections: []
    }

    // Add condition nodes
    alertRule.conditions.forEach((condition, index) => {
      const node: AlertNode = {
        id: condition.id,
        type: 'condition',
        name: `${condition.operator} ${condition.value}`,
        description: `Condition: ${condition.field} ${condition.operator} ${condition.value}`,
        position: { x: 300, y: 100 + index * 150 },
        config: {
          field: condition.field,
          operator: condition.operator,
          value: condition.value,
          duration: condition.duration
        },
        connections: [],
        icon: 'bar-chart',
        color: '#EF4444'
      }
      canvas.nodes.push(node)
    })

    // Add action nodes
    alertRule.actions.forEach((action, index) => {
      const node: AlertNode = {
        id: action.id,
        type: 'action',
        name: action.type,
        description: `Action: ${action.type}`,
        position: { x: 600, y: 100 + index * 150 },
        config: action.config,
        connections: [],
        icon: this.getActionIcon(action.type),
        color: this.getActionColor(action.type)
      }
      canvas.nodes.push(node)
    })

    // Add connections (simplified)
    for (let i = 0; i < canvas.nodes.length - 1; i++) {
      const connection: AlertConnection = {
        id: `conn_${i}`,
        sourceNodeId: canvas.nodes[i].id,
        targetNodeId: canvas.nodes[i + 1].id,
        sourcePort: 'output',
        targetPort: 'input',
        label: `${canvas.nodes[i].name} → ${canvas.nodes[i + 1].name}`
      }
      canvas.connections.push(connection)
      canvas.nodes[i].connections.push(connection)
    }

    return canvas
  }

  /**
   * Map node type to condition type
   */
  private mapNodeTypeToConditionType(nodeType: string): string {
    const mapping: Record<string, string> = {
      'condition': 'threshold',
      'aggregation': 'aggregation',
      'correlation': 'correlation'
    }
    return mapping[nodeType] || 'custom'
  }

  /**
   * Map node type to action type
   */
  private mapNodeTypeToActionType(nodeType: string): string {
    const mapping: Record<string, string> = {
      'action': 'email',
      'integration': 'webhook'
    }
    return mapping[nodeType] || 'custom'
  }

  /**
   * Get action template
   */
  private getActionTemplate(nodeType: string, config: any): AlertTemplate {
    switch (nodeType) {
      case 'action':
        if (config.to) {
          return {
            type: 'email',
            subject: config.subject || 'Alert: {alert_name}',
            body: config.template || 'default'
          }
        } else if (config.channel) {
          return {
            type: 'slack',
            channel: config.channel,
            message: config.message || 'Alert: {alert_name}'
          }
        } else if (config.url) {
          return {
            type: 'webhook',
            url: config.url,
            method: config.method || 'POST',
            headers: config.headers || {}
          }
        }
        break
    }

    return {
      type: 'custom',
      config
    }
  }

  /**
   * Get action icon
   */
  private getActionIcon(actionType: string): string {
    const icons: Record<string, string> = {
      'email': 'mail',
      'slack': 'message-circle',
      'webhook': 'webhook',
      'sms': 'phone',
      'custom': 'code'
    }
    return icons[actionType] || 'circle'
  }

  /**
   * Get action color
   */
  private getActionColor(actionType: string): string {
    const colors: Record<string, string> = {
      'email': '#06B6D4',
      'slack': '#4F46E5',
      'webhook': '#EC4899',
      'sms': '#059669',
      'custom': '#6B7280'
    }
    return colors[actionType] || '#6B7280'
  }

  /**
   * Get rule builder by ID
   */
  getRuleBuilder(ruleBuilderId: string): AlertRuleBuilder | null {
    return this.ruleBuilders.get(ruleBuilderId) || null
  }

  /**
   * List all rule builders
   */
  listRuleBuilders(): AlertRuleBuilder[] {
    return Array.from(this.ruleBuilders.values())
  }

  /**
   * Update rule builder
   */
  updateRuleBuilder(
    ruleBuilderId: string,
    updates: Partial<AlertRuleBuilder>
  ): AlertRuleBuilder {
    const ruleBuilder = this.ruleBuilders.get(ruleBuilderId)
    if (!ruleBuilder) {
      throw new Error('Rule builder not found')
    }

    Object.assign(ruleBuilder, updates, { updatedAt: new Date() })
    return ruleBuilder
  }

  /**
   * Delete rule builder
   */
  deleteRuleBuilder(ruleBuilderId: string): void {
    this.ruleBuilders.delete(ruleBuilderId)
  }

  /**
   * Test alert rule
   */
  async testAlertRule(ruleBuilderId: string, testData: any): Promise<{
    triggered: boolean
    conditions: { id: string; passed: boolean; value: any }[]
    actions: { id: string; executed: boolean; result: any }[]
  }> {
    const ruleBuilder = this.ruleBuilders.get(ruleBuilderId)
    if (!ruleBuilder) {
      throw new Error('Rule builder not found')
    }

    const results = {
      triggered: false,
      conditions: [] as { id: string; passed: boolean; value: any }[],
      actions: [] as { id: string; executed: boolean; result: any }[]
    }

    // Test conditions
    for (const node of ruleBuilder.canvas.nodes.filter(n => n.type === 'condition')) {
      const passed = this.evaluateCondition(node.config, testData)
      results.conditions.push({
        id: node.id,
        passed,
        value: this.extractValue(node.config.field, testData)
      })
    }

    // Check if all conditions passed
    results.triggered = results.conditions.every(c => c.passed)

    // Execute actions if triggered
    if (results.triggered) {
      for (const node of ruleBuilder.canvas.nodes.filter(n => n.type === 'action')) {
        try {
          const result = await this.executeAction(node.config, testData)
          results.actions.push({
            id: node.id,
            executed: true,
            result
          })
        } catch (error) {
          results.actions.push({
            id: node.id,
            executed: false,
            result: { error: error instanceof Error ? error.message : 'Unknown error' }
          })
        }
      }
    }

    return results
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(config: any, data: any): boolean {
    const value = this.extractValue(config.field, data)
    const operator = config.operator || '=='
    const expectedValue = config.value

    switch (operator) {
      case '==':
        return value == expectedValue
      case '!=':
        return value != expectedValue
      case '>':
        return Number(value) > Number(expectedValue)
      case '<':
        return Number(value) < Number(expectedValue)
      case '>=':
        return Number(value) >= Number(expectedValue)
      case '<=':
        return Number(value) <= Number(expectedValue)
      case 'contains':
        return String(value).includes(String(expectedValue))
      case 'regex':
        return new RegExp(expectedValue).test(String(value))
      default:
        return false
    }
  }

  /**
   * Extract value from data
   */
  private extractValue(field: string, data: any): any {
    if (!field) return data

    const keys = field.split('.')
    let value = data

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return undefined
      }
    }

    return value
  }

  /**
   * Execute action
   */
  private async executeAction(config: any, data: any): Promise<any> {
    // This would integrate with the actual action execution service
    // For now, return mock results
    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: { ...config, ...data }
    }
  }
} 