import { Workflow, WorkflowStep, WorkflowTrigger } from '../types'
import { WorkflowService } from '../services/workflow-service'

export interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'integration' | 'custom'
  name: string
  description: string
  position: { x: number; y: number }
  config: any
  connections: WorkflowConnection[]
  icon?: string
  color?: string
}

export interface WorkflowConnection {
  id: string
  sourceNodeId: string
  targetNodeId: string
  sourcePort: string
  targetPort: string
  condition?: string
  label?: string
}

export interface WorkflowCanvas {
  id: string
  name: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  zoom: number
  pan: { x: number; y: number }
  selectedNodes: string[]
  selectedConnections: string[]
}

export interface NodeTemplate {
  id: string
  type: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  configSchema: any
  defaultConfig: any
  inputs: NodePort[]
  outputs: NodePort[]
}

export interface NodePort {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
}

export class VisualWorkflowBuilder {
  private workflowService: WorkflowService
  private nodeTemplates: Map<string, NodeTemplate>
  private canvases: Map<string, WorkflowCanvas>

  constructor() {
    this.workflowService = new WorkflowService()
    this.nodeTemplates = new Map()
    this.canvases = new Map()
    this.initializeNodeTemplates()
  }

  /**
   * Initialize node templates
   */
  private initializeNodeTemplates(): void {
    // Trigger templates
    this.addNodeTemplate({
      id: 'webhook-trigger',
      type: 'trigger',
      name: 'Webhook',
      description: 'Trigger workflow on webhook call',
      category: 'Triggers',
      icon: 'webhook',
      color: '#3B82F6',
      configSchema: {
        type: 'object',
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
          path: { type: 'string' },
          headers: { type: 'object' }
        }
      },
      defaultConfig: {
        method: 'POST',
        path: '/webhook',
        headers: {}
      },
      inputs: [],
      outputs: [
        { id: 'payload', name: 'Payload', type: 'object', required: true, description: 'Webhook payload' },
        { id: 'headers', name: 'Headers', type: 'object', required: false, description: 'Request headers' }
      ]
    })

    this.addNodeTemplate({
      id: 'schedule-trigger',
      type: 'trigger',
      name: 'Schedule',
      description: 'Trigger workflow on schedule',
      category: 'Triggers',
      icon: 'clock',
      color: '#10B981',
      configSchema: {
        type: 'object',
        properties: {
          cron: { type: 'string' },
          timezone: { type: 'string' }
        }
      },
      defaultConfig: {
        cron: '0 0 * * *',
        timezone: 'UTC'
      },
      inputs: [],
      outputs: [
        { id: 'timestamp', name: 'Timestamp', type: 'string', required: true, description: 'Current timestamp' }
      ]
    })

    // Action templates
    this.addNodeTemplate({
      id: 'http-action',
      type: 'action',
      name: 'HTTP Request',
      description: 'Make HTTP request',
      category: 'Actions',
      icon: 'globe',
      color: '#F59E0B',
      configSchema: {
        type: 'object',
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
          url: { type: 'string' },
          headers: { type: 'object' },
          body: { type: 'string' }
        }
      },
      defaultConfig: {
        method: 'GET',
        url: '',
        headers: {},
        body: ''
      },
      inputs: [
        { id: 'url', name: 'URL', type: 'string', required: true, description: 'Request URL' },
        { id: 'headers', name: 'Headers', type: 'object', required: false, description: 'Request headers' },
        { id: 'body', name: 'Body', type: 'object', required: false, description: 'Request body' }
      ],
      outputs: [
        { id: 'response', name: 'Response', type: 'object', required: true, description: 'HTTP response' },
        { id: 'status', name: 'Status', type: 'number', required: true, description: 'Response status' }
      ]
    })

    this.addNodeTemplate({
      id: 'database-action',
      type: 'action',
      name: 'Database Query',
      description: 'Execute database query',
      category: 'Actions',
      icon: 'database',
      color: '#8B5CF6',
      configSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string', enum: ['select', 'insert', 'update', 'delete'] },
          table: { type: 'string' },
          query: { type: 'string' }
        }
      },
      defaultConfig: {
        operation: 'select',
        table: '',
        query: ''
      },
      inputs: [
        { id: 'data', name: 'Data', type: 'object', required: false, description: 'Data to insert/update' },
        { id: 'where', name: 'Where', type: 'object', required: false, description: 'Where conditions' }
      ],
      outputs: [
        { id: 'result', name: 'Result', type: 'array', required: true, description: 'Query result' },
        { id: 'affected', name: 'Affected', type: 'number', required: true, description: 'Affected rows' }
      ]
    })

    // Condition templates
    this.addNodeTemplate({
      id: 'condition-node',
      type: 'condition',
      name: 'Condition',
      description: 'Check condition and branch',
      category: 'Logic',
      icon: 'git-branch',
      color: '#EF4444',
      configSchema: {
        type: 'object',
        properties: {
          operator: { type: 'string', enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'regex'] },
          field: { type: 'string' },
          value: { type: 'string' }
        }
      },
      defaultConfig: {
        operator: 'equals',
        field: '',
        value: ''
      },
      inputs: [
        { id: 'data', name: 'Data', type: 'object', required: true, description: 'Data to check' }
      ],
      outputs: [
        { id: 'true', name: 'True', type: 'object', required: true, description: 'Data if condition is true' },
        { id: 'false', name: 'False', type: 'object', required: true, description: 'Data if condition is false' }
      ]
    })

    // Integration templates
    this.addNodeTemplate({
      id: 'email-action',
      type: 'action',
      name: 'Send Email',
      description: 'Send email via integration',
      category: 'Integrations',
      icon: 'mail',
      color: '#06B6D4',
      configSchema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          template: { type: 'string' }
        }
      },
      defaultConfig: {
        to: '',
        subject: '',
        template: ''
      },
      inputs: [
        { id: 'to', name: 'To', type: 'string', required: true, description: 'Recipient email' },
        { id: 'subject', name: 'Subject', type: 'string', required: true, description: 'Email subject' },
        { id: 'body', name: 'Body', type: 'string', required: true, description: 'Email body' }
      ],
      outputs: [
        { id: 'messageId', name: 'Message ID', type: 'string', required: true, description: 'Email message ID' },
        { id: 'status', name: 'Status', type: 'string', required: true, description: 'Send status' }
      ]
    })

    this.addNodeTemplate({
      id: 'slack-action',
      type: 'action',
      name: 'Slack Message',
      description: 'Send Slack message',
      category: 'Integrations',
      icon: 'message-circle',
      color: '#4F46E5',
      configSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string' },
          message: { type: 'string' }
        }
      },
      defaultConfig: {
        channel: '',
        message: ''
      },
      inputs: [
        { id: 'channel', name: 'Channel', type: 'string', required: true, description: 'Slack channel' },
        { id: 'message', name: 'Message', type: 'string', required: true, description: 'Message text' }
      ],
      outputs: [
        { id: 'ts', name: 'Timestamp', type: 'string', required: true, description: 'Message timestamp' },
        { id: 'status', name: 'Status', type: 'string', required: true, description: 'Send status' }
      ]
    })
  }

  /**
   * Add node template
   */
  addNodeTemplate(template: NodeTemplate): void {
    this.nodeTemplates.set(template.id, template)
  }

  /**
   * Get node templates by category
   */
  getNodeTemplatesByCategory(): Record<string, NodeTemplate[]> {
    const categories: Record<string, NodeTemplate[]> = {}

    for (const template of this.nodeTemplates.values()) {
      if (!categories[template.category]) {
        categories[template.category] = []
      }
      categories[template.category].push(template)
    }

    return categories
  }

  /**
   * Create new workflow canvas
   */
  createCanvas(name: string): WorkflowCanvas {
    const canvas: WorkflowCanvas = {
      id: `canvas_${Date.now()}`,
      name,
      nodes: [],
      connections: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
      selectedNodes: [],
      selectedConnections: []
    }

    this.canvases.set(canvas.id, canvas)
    return canvas
  }

  /**
   * Add node to canvas
   */
  addNode(
    canvasId: string,
    templateId: string,
    position: { x: number; y: number },
    config?: any
  ): WorkflowNode {
    const canvas = this.canvases.get(canvasId)
    if (!canvas) {
      throw new Error('Canvas not found')
    }

    const template = this.nodeTemplates.get(templateId)
    if (!template) {
      throw new Error('Node template not found')
    }

    const node: WorkflowNode = {
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

    canvas.nodes.push(node)
    return node
  }

  /**
   * Connect nodes
   */
  connectNodes(
    canvasId: string,
    sourceNodeId: string,
    targetNodeId: string,
    sourcePort: string,
    targetPort: string,
    condition?: string
  ): WorkflowConnection {
    const canvas = this.canvases.get(canvasId)
    if (!canvas) {
      throw new Error('Canvas not found')
    }

    const sourceNode = canvas.nodes.find(n => n.id === sourceNodeId)
    const targetNode = canvas.nodes.find(n => n.id === targetNodeId)

    if (!sourceNode || !targetNode) {
      throw new Error('Source or target node not found')
    }

    const connection: WorkflowConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceNodeId,
      targetNodeId,
      sourcePort,
      targetPort,
      condition,
      label: condition || `${sourcePort} → ${targetPort}`
    }

    canvas.connections.push(connection)
    sourceNode.connections.push(connection)

    return connection
  }

  /**
   * Remove node from canvas
   */
  removeNode(canvasId: string, nodeId: string): void {
    const canvas = this.canvases.get(canvasId)
    if (!canvas) {
      throw new Error('Canvas not found')
    }

    // Remove node
    canvas.nodes = canvas.nodes.filter(n => n.id !== nodeId)

    // Remove connections
    canvas.connections = canvas.connections.filter(
      c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    )

    // Update node connections
    canvas.nodes.forEach(node => {
      node.connections = node.connections.filter(c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId)
    })
  }

  /**
   * Remove connection from canvas
   */
  removeConnection(canvasId: string, connectionId: string): void {
    const canvas = this.canvases.get(canvasId)
    if (!canvas) {
      throw new Error('Canvas not found')
    }

    canvas.connections = canvas.connections.filter(c => c.id !== connectionId)

    // Update node connections
    canvas.nodes.forEach(node => {
      node.connections = node.connections.filter(c => c.id !== connectionId)
    })
  }

  /**
   * Update node position
   */
  updateNodePosition(canvasId: string, nodeId: string, position: { x: number; y: number }): void {
    const canvas = this.canvases.get(canvasId)
    if (!canvas) {
      throw new Error('Canvas not found')
    }

    const node = canvas.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error('Node not found')
    }

    node.position = position
  }

  /**
   * Update node config
   */
  updateNodeConfig(canvasId: string, nodeId: string, config: any): void {
    const canvas = this.canvases.get(canvasId)
    if (!canvas) {
      throw new Error('Canvas not found')
    }

    const node = canvas.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error('Node not found')
    }

    node.config = { ...node.config, ...config }
  }

  /**
   * Validate workflow
   */
  validateWorkflow(canvasId: string): { valid: boolean; errors: string[] } {
    const canvas = this.canvases.get(canvasId)
    if (!canvas) {
      return { valid: false, errors: ['Canvas not found'] }
    }

    const errors: string[] = []

    // Check for triggers
    const triggers = canvas.nodes.filter(n => n.type === 'trigger')
    if (triggers.length === 0) {
      errors.push('Workflow must have at least one trigger')
    }

    // Check for actions
    const actions = canvas.nodes.filter(n => n.type === 'action')
    if (actions.length === 0) {
      errors.push('Workflow must have at least one action')
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>()
    canvas.connections.forEach(conn => {
      connectedNodeIds.add(conn.sourceNodeId)
      connectedNodeIds.add(conn.targetNodeId)
    })

    const disconnectedNodes = canvas.nodes.filter(n => !connectedNodeIds.has(n.id))
    if (disconnectedNodes.length > 0) {
      errors.push(`Disconnected nodes: ${disconnectedNodes.map(n => n.name).join(', ')}`)
    }

    // Check for cycles
    if (this.hasCycles(canvas)) {
      errors.push('Workflow contains cycles')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check for cycles in workflow
   */
  private hasCycles(canvas: WorkflowCanvas): boolean {
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
   * Convert canvas to workflow
   */
  async canvasToWorkflow(canvasId: string, name: string, tenantId: string): Promise<Workflow> {
    const canvas = this.canvases.get(canvasId)
    if (!canvas) {
      throw new Error('Canvas not found')
    }

    // Validate workflow
    const validation = this.validateWorkflow(canvasId)
    if (!validation.valid) {
      throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`)
    }

    // Convert nodes to steps
    const steps: WorkflowStep[] = canvas.nodes
      .filter(n => n.type !== 'trigger')
      .map(node => ({
        id: node.id,
        name: node.name,
        type: this.mapNodeTypeToStepType(node.type),
        config: node.config,
        conditions: this.getNodeConditions(node.id, canvas.connections)
      }))

    // Convert triggers
    const triggers: WorkflowTrigger[] = canvas.nodes
      .filter(n => n.type === 'trigger')
      .map(node => ({
        id: node.id,
        type: this.mapNodeTypeToTriggerType(node.type),
        config: node.config
      }))

    // Create workflow
    const workflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name,
      description: `Generated from visual builder: ${canvas.name}`,
      version: '1.0.0',
      tenantId,
      steps,
      triggers,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save workflow
    return await this.workflowService.createWorkflow(workflow)
  }

  /**
   * Convert workflow to canvas
   */
  workflowToCanvas(workflow: Workflow): WorkflowCanvas {
    const canvas: WorkflowCanvas = {
      id: `canvas_${workflow.id}`,
      name: workflow.name,
      nodes: [],
      connections: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
      selectedNodes: [],
      selectedConnections: []
    }

    // Add trigger nodes
    workflow.triggers.forEach((trigger, index) => {
      const node: WorkflowNode = {
        id: trigger.id,
        type: 'trigger',
        name: trigger.type,
        description: `Trigger: ${trigger.type}`,
        position: { x: 100, y: 100 + index * 150 },
        config: trigger.config,
        connections: [],
        icon: this.getTriggerIcon(trigger.type),
        color: '#3B82F6'
      }
      canvas.nodes.push(node)
    })

    // Add step nodes
    workflow.steps.forEach((step, index) => {
      const node: WorkflowNode = {
        id: step.id,
        type: this.mapStepTypeToNodeType(step.type),
        name: step.name,
        description: `Step: ${step.name}`,
        position: { x: 400, y: 100 + index * 150 },
        config: step.config,
        connections: [],
        icon: this.getStepIcon(step.type),
        color: this.getStepColor(step.type)
      }
      canvas.nodes.push(node)
    })

    // Add connections (simplified - would need more complex logic for real workflows)
    for (let i = 0; i < canvas.nodes.length - 1; i++) {
      const connection: WorkflowConnection = {
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
   * Map node type to step type
   */
  private mapNodeTypeToStepType(nodeType: string): string {
    const mapping: Record<string, string> = {
      'action': 'http',
      'condition': 'condition',
      'integration': 'integration',
      'custom': 'custom'
    }
    return mapping[nodeType] || 'custom'
  }

  /**
   * Map step type to node type
   */
  private mapStepTypeToNodeType(stepType: string): string {
    const mapping: Record<string, string> = {
      'http': 'action',
      'condition': 'condition',
      'integration': 'action',
      'custom': 'custom'
    }
    return mapping[stepType] || 'custom'
  }

  /**
   * Map node type to trigger type
   */
  private mapNodeTypeToTriggerType(nodeType: string): string {
    return nodeType === 'trigger' ? 'webhook' : 'manual'
  }

  /**
   * Get node conditions
   */
  private getNodeConditions(nodeId: string, connections: WorkflowConnection[]): any[] {
    return connections
      .filter(c => c.targetNodeId === nodeId && c.condition)
      .map(c => ({ condition: c.condition, sourceNodeId: c.sourceNodeId }))
  }

  /**
   * Get trigger icon
   */
  private getTriggerIcon(triggerType: string): string {
    const icons: Record<string, string> = {
      'webhook': 'webhook',
      'schedule': 'clock',
      'manual': 'play'
    }
    return icons[triggerType] || 'zap'
  }

  /**
   * Get step icon
   */
  private getStepIcon(stepType: string): string {
    const icons: Record<string, string> = {
      'http': 'globe',
      'database': 'database',
      'email': 'mail',
      'slack': 'message-circle',
      'condition': 'git-branch',
      'custom': 'code'
    }
    return icons[stepType] || 'circle'
  }

  /**
   * Get step color
   */
  private getStepColor(stepType: string): string {
    const colors: Record<string, string> = {
      'http': '#F59E0B',
      'database': '#8B5CF6',
      'email': '#06B6D4',
      'slack': '#4F46E5',
      'condition': '#EF4444',
      'custom': '#6B7280'
    }
    return colors[stepType] || '#6B7280'
  }

  /**
   * Get canvas by ID
   */
  getCanvas(canvasId: string): WorkflowCanvas | null {
    return this.canvases.get(canvasId) || null
  }

  /**
   * List all canvases
   */
  listCanvases(): WorkflowCanvas[] {
    return Array.from(this.canvases.values())
  }

  /**
   * Delete canvas
   */
  deleteCanvas(canvasId: string): void {
    this.canvases.delete(canvasId)
  }
} 