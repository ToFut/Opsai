import { EventEmitter } from 'events';
import { Logger } from '@opsai/shared';
import { createStateSynchronizer, StateSynchronizer, UIComponentState } from '../sync/state-synchronizer';
import { discoveryContext } from '../context/discovery-context';

// Types from UI package - duplicated here to avoid circular dependency
export interface ComponentRegistry {
  get(componentId: string): any;
  register(component: any): Promise<void>;
}

export interface RegisteredComponent {
  id: string;
  name: string;
  type: string;
  category: string;
  version: string;
  description?: string;
  props: any[];
  events: any[];
  metadata: any;
  implementation: any;
}

export interface ComponentInstance {
  id: string;
  componentId: string;
  tenantId: string;
  version: string;
  config: any;
  state: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowUIBridgeConfig {
  enableAutoBinding?: boolean;
  enableStateValidation?: boolean;
  enableEventReplay?: boolean;
  syncMode?: 'realtime' | 'batch' | 'manual';
  batchInterval?: number;
  maxEventQueueSize?: number;
}

export interface BridgeConnection {
  id: string;
  workflowId: string;
  componentId: string;
  status: 'active' | 'paused' | 'disconnected';
  bindings: DataBinding[];
  eventMappings: EventMapping[];
  metadata: ConnectionMetadata;
}

export interface DataBinding {
  id: string;
  source: BindingSource;
  target: BindingTarget;
  transform?: TransformFunction;
  validation?: ValidationFunction;
  options: BindingOptions;
}

export interface BindingSource {
  type: 'workflow' | 'component';
  id: string;
  path: string;
}

export interface BindingTarget {
  type: 'workflow' | 'component';
  id: string;
  path: string;
}

export interface TransformFunction {
  (value: any, context?: TransformContext): any;
}

export interface ValidationFunction {
  (value: any, context?: ValidationContext): ValidationResult;
}

export interface TransformContext {
  source: any;
  target: any;
  metadata: Record<string, any>;
}

export interface ValidationContext {
  source: any;
  target: any;
  previousValue: any;
  metadata: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface BindingOptions {
  bidirectional?: boolean;
  debounce?: number;
  throttle?: number;
  filter?: (value: any) => boolean;
  errorHandler?: (error: Error) => void;
}

export interface EventMapping {
  id: string;
  sourceEvent: EventDescriptor;
  targetAction: ActionDescriptor;
  condition?: ConditionFunction;
  transform?: EventTransformFunction;
}

export interface EventDescriptor {
  type: 'workflow' | 'component';
  id: string;
  eventName: string;
  eventType?: string;
}

export interface ActionDescriptor {
  type: 'workflow' | 'component';
  id: string;
  actionName: string;
  parameters?: Record<string, any>;
}

export interface ConditionFunction {
  (event: any, context?: EventContext): boolean;
}

export interface EventTransformFunction {
  (event: any, context?: EventContext): any;
}

export interface EventContext {
  source: any;
  target: any;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface ConnectionMetadata {
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  tags: string[];
  description?: string;
  version: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
  variables: WorkflowVariable[];
  triggers: WorkflowTrigger[];
  outputs: WorkflowOutput[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  uiComponents?: string[];
}

export interface WorkflowVariable {
  name: string;
  type: string;
  defaultValue?: any;
  validation?: any;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'webhook';
  config: any;
}

export interface WorkflowOutput {
  name: string;
  type: string;
  mapping: string;
}

export interface ComponentDefinition {
  id: string;
  type: string;
  props: Record<string, any>;
  events: string[];
  methods: string[];
  state: Record<string, any>;
}

export interface BridgeEvent {
  type: 'connection:created' | 'connection:updated' | 'connection:removed' | 
        'binding:created' | 'binding:updated' | 'binding:removed' |
        'event:mapped' | 'event:unmapped' | 'sync:complete' | 'sync:error';
  connectionId: string;
  details: any;
}

export class WorkflowUIBridge extends EventEmitter {
  private config: WorkflowUIBridgeConfig;
  private logger: Logger;
  private stateSynchronizer: StateSynchronizer;
  private connections: Map<string, BridgeConnection> = new Map();
  private componentRegistry: ComponentRegistry | null = null;
  private workflowEngine: any | null = null; // Would be actual workflow engine
  private eventQueue: Map<string, any[]> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(
    config?: WorkflowUIBridgeConfig,
    stateSynchronizer?: StateSynchronizer
  ) {
    super();
    this.config = {
      enableAutoBinding: true,
      enableStateValidation: true,
      enableEventReplay: false,
      syncMode: 'realtime',
      batchInterval: 100,
      maxEventQueueSize: 1000,
      ...config
    };
    this.logger = new Logger('WorkflowUIBridge');
    this.stateSynchronizer = stateSynchronizer || createStateSynchronizer();
    
    this.initialize();
  }

  /**
   * Initialize bridge
   */
  private async initialize(): Promise<void> {
    if (this.config.syncMode === 'batch') {
      this.startBatchSync();
    }

    // Subscribe to state synchronizer events
    this.stateSynchronizer.on('sync:complete', this.handleSyncComplete.bind(this));
    this.stateSynchronizer.on('sync:error', this.handleSyncError.bind(this));
    this.stateSynchronizer.on('conflict:detected', this.handleConflict.bind(this));

    this.logger.info('Workflow-UI bridge initialized');
  }

  /**
   * Set component registry
   */
  setComponentRegistry(registry: ComponentRegistry): void {
    this.componentRegistry = registry;
  }

  /**
   * Set workflow engine
   */
  setWorkflowEngine(engine: any): void {
    this.workflowEngine = engine;
  }

  /**
   * Create connection between workflow and UI component
   */
  async createConnection(
    workflowId: string,
    componentId: string,
    options?: {
      bindings?: DataBinding[];
      eventMappings?: EventMapping[];
      metadata?: Partial<ConnectionMetadata>;
    }
  ): Promise<string> {
    const connectionId = this.generateConnectionId();
    
    // Validate workflow and component exist
    await this.validateWorkflowAndComponent(workflowId, componentId);

    const connection: BridgeConnection = {
      id: connectionId,
      workflowId,
      componentId,
      status: 'active',
      bindings: options?.bindings || [],
      eventMappings: options?.eventMappings || [],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'system',
        tags: [],
        version: 1,
        ...options?.metadata
      }
    };

    this.connections.set(connectionId, connection);

    // Auto-create bindings if enabled
    if (this.config.enableAutoBinding && connection.bindings.length === 0) {
      const autoBindings = await this.generateAutoBindings(workflowId, componentId);
      connection.bindings.push(...autoBindings);
    }

    // Setup bindings
    for (const binding of connection.bindings) {
      await this.setupBinding(connectionId, binding);
    }

    // Setup event mappings
    for (const mapping of connection.eventMappings) {
      await this.setupEventMapping(connectionId, mapping);
    }

    // Update discovery context
    discoveryContext.updateCustomData('bridgeConnections', {
      total: this.connections.size,
      latest: connectionId
    });

    this.emit('connection:created', {
      type: 'connection:created',
      connectionId,
      details: { workflowId, componentId }
    });

    return connectionId;
  }

  /**
   * Add data binding to connection
   */
  async addBinding(
    connectionId: string,
    binding: Omit<DataBinding, 'id'>
  ): Promise<string> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    const bindingId = this.generateBindingId();
    const fullBinding: DataBinding = {
      ...binding,
      id: bindingId
    };

    connection.bindings.push(fullBinding);
    connection.metadata.updatedAt = Date.now();

    await this.setupBinding(connectionId, fullBinding);

    this.emit('binding:created', {
      type: 'binding:created',
      connectionId,
      details: { bindingId }
    });

    return bindingId;
  }

  /**
   * Remove data binding
   */
  async removeBinding(connectionId: string, bindingId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    const bindingIndex = connection.bindings.findIndex(b => b.id === bindingId);
    if (bindingIndex === -1) {
      return;
    }

    const binding = connection.bindings[bindingIndex];
    if (!binding) {
      return;
    }
    await this.teardownBinding(connectionId, binding);

    connection.bindings.splice(bindingIndex, 1);
    connection.metadata.updatedAt = Date.now();

    this.emit('binding:removed', {
      type: 'binding:removed',
      connectionId,
      details: { bindingId }
    });
  }

  /**
   * Add event mapping to connection
   */
  async addEventMapping(
    connectionId: string,
    mapping: Omit<EventMapping, 'id'>
  ): Promise<string> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    const mappingId = this.generateMappingId();
    const fullMapping: EventMapping = {
      ...mapping,
      id: mappingId
    };

    connection.eventMappings.push(fullMapping);
    connection.metadata.updatedAt = Date.now();

    await this.setupEventMapping(connectionId, fullMapping);

    this.emit('event:mapped', {
      type: 'event:mapped',
      connectionId,
      details: { mappingId }
    });

    return mappingId;
  }

  /**
   * Execute workflow from UI component
   */
  async executeWorkflowFromUI(
    componentId: string,
    workflowId: string,
    inputs?: Record<string, any>
  ): Promise<any> {
    // Find connection
    const connection = this.findConnectionByIds(workflowId, componentId);
    if (!connection) {
      throw new Error(`No connection found between workflow ${workflowId} and component ${componentId}`);
    }

    // Get component state
    const componentState = await this.getComponentState(componentId);

    // Prepare workflow inputs
    const workflowInputs = await this.prepareWorkflowInputs(
      connection,
      componentState,
      inputs
    );

    // Execute workflow
    const result = await this.executeWorkflow(workflowId, workflowInputs);

    // Update component with results
    await this.updateComponentFromWorkflow(connection, componentId, result);

    return result;
  }

  /**
   * Update UI component from workflow
   */
  async updateUIFromWorkflow(
    workflowId: string,
    componentId: string,
    updates: Record<string, any>
  ): Promise<void> {
    const connection = this.findConnectionByIds(workflowId, componentId);
    if (!connection) {
      throw new Error(`No connection found between workflow ${workflowId} and component ${componentId}`);
    }

    // Apply bindings
    for (const binding of connection.bindings) {
      if (binding.source.type === 'workflow' && binding.target.type === 'component') {
        const value = this.getValueAtPath(updates, binding.source.path);
        if (value !== undefined) {
          const transformedValue = binding.transform ? 
            binding.transform(value, { source: updates, target: {}, metadata: {} }) : 
            value;

          await this.updateComponentProperty(
            componentId,
            binding.target.path,
            transformedValue
          );
        }
      }
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(connectionId: string): BridgeConnection | null {
    return this.connections.get(connectionId) || null;
  }

  /**
   * Pause connection
   */
  pauseConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = 'paused';
      this.logger.info(`Connection ${connectionId} paused`);
    }
  }

  /**
   * Resume connection
   */
  resumeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = 'active';
      this.logger.info(`Connection ${connectionId} resumed`);
    }
  }

  /**
   * Remove connection
   */
  async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    // Teardown all bindings
    for (const binding of connection.bindings) {
      await this.teardownBinding(connectionId, binding);
    }

    // Teardown all event mappings
    for (const mapping of connection.eventMappings) {
      await this.teardownEventMapping(connectionId, mapping);
    }

    this.connections.delete(connectionId);

    this.emit('connection:removed', {
      type: 'connection:removed',
      connectionId,
      details: {}
    });
  }

  // Private helper methods

  private async validateWorkflowAndComponent(
    workflowId: string,
    componentId: string
  ): Promise<void> {
    // Validate workflow exists
    if (this.workflowEngine) {
      const workflowExists = await this.workflowEngine.workflowExists(workflowId);
      if (!workflowExists) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }
    }

    // Validate component exists
    if (this.componentRegistry) {
      const component = this.componentRegistry.get(componentId);
      if (!component) {
        throw new Error(`Component not found: ${componentId}`);
      }
    }
  }

  private async generateAutoBindings(
    workflowId: string,
    componentId: string
  ): Promise<DataBinding[]> {
    const bindings: DataBinding[] = [];

    // Get workflow definition
    const workflowDef = await this.getWorkflowDefinition(workflowId);
    
    // Get component definition
    const componentDef = await this.getComponentDefinition(componentId);

    // Match workflow variables to component props
    for (const variable of workflowDef.variables) {
      const matchingProp = componentDef.props[variable.name];
      if (matchingProp !== undefined) {
        bindings.push({
          id: this.generateBindingId(),
          source: {
            type: 'workflow',
            id: workflowId,
            path: `variables.${variable.name}`
          },
          target: {
            type: 'component',
            id: componentId,
            path: `props.${variable.name}`
          },
          options: {
            bidirectional: true
          }
        });
      }
    }

    // Match workflow outputs to component state
    for (const output of workflowDef.outputs) {
      if (componentDef.state[output.name] !== undefined) {
        bindings.push({
          id: this.generateBindingId(),
          source: {
            type: 'workflow',
            id: workflowId,
            path: `outputs.${output.name}`
          },
          target: {
            type: 'component',
            id: componentId,
            path: `state.${output.name}`
          },
          options: {
            bidirectional: false
          }
        });
      }
    }

    return bindings;
  }

  private async setupBinding(connectionId: string, binding: DataBinding): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Create state synchronizer binding
    const mappings = [{
      workflowPath: binding.source.type === 'workflow' ? binding.source.path : binding.target.path,
      componentPath: binding.source.type === 'component' ? binding.source.path : binding.target.path,
      ...(binding.transform && { transform: binding.transform }),
      ...(binding.options.bidirectional && binding.transform && { reverseTransform: binding.transform })
    }];

    const syncBindingId = await this.stateSynchronizer.createBinding(
      connection.workflowId,
      connection.componentId,
      mappings
    );

    // Store sync binding ID for cleanup
    (binding as any)._syncBindingId = syncBindingId;
  }

  private async teardownBinding(_connectionId: string, binding: DataBinding): Promise<void> {
    const syncBindingId = (binding as any)._syncBindingId;
    if (syncBindingId) {
      await this.stateSynchronizer.removeBinding(syncBindingId);
    }
  }

  private async setupEventMapping(connectionId: string, mapping: EventMapping): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (mapping.sourceEvent.type === 'component') {
      // Subscribe to component events
      this.subscribeToComponentEvent(
        mapping.sourceEvent.id,
        mapping.sourceEvent.eventName,
        async (event) => {
          if (connection.status !== 'active') return;
          
          if (mapping.condition && !mapping.condition(event, this.createEventContext())) {
            return;
          }

          const transformedEvent = mapping.transform ? 
            mapping.transform(event, this.createEventContext()) : 
            event;

          await this.triggerWorkflowAction(
            mapping.targetAction.id,
            mapping.targetAction.actionName,
            transformedEvent
          );
        }
      );
    } else {
      // Subscribe to workflow events
      this.subscribeToWorkflowEvent(
        mapping.sourceEvent.id,
        mapping.sourceEvent.eventName,
        async (event) => {
          if (connection.status !== 'active') return;
          
          if (mapping.condition && !mapping.condition(event, this.createEventContext())) {
            return;
          }

          const transformedEvent = mapping.transform ? 
            mapping.transform(event, this.createEventContext()) : 
            event;

          await this.triggerComponentAction(
            mapping.targetAction.id,
            mapping.targetAction.actionName,
            transformedEvent
          );
        }
      );
    }
  }

  private async teardownEventMapping(_connectionId: string, mapping: EventMapping): Promise<void> {
    // Unsubscribe from events
    if (mapping.sourceEvent.type === 'component') {
      this.unsubscribeFromComponentEvent(
        mapping.sourceEvent.id,
        mapping.sourceEvent.eventName
      );
    } else {
      this.unsubscribeFromWorkflowEvent(
        mapping.sourceEvent.id,
        mapping.sourceEvent.eventName
      );
    }
  }

  private findConnectionByIds(workflowId: string, componentId: string): BridgeConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.workflowId === workflowId && connection.componentId === componentId) {
        return connection;
      }
    }
    return null;
  }

  private async getWorkflowDefinition(workflowId: string): Promise<WorkflowDefinition> {
    // This would get actual workflow definition
    return {
      id: workflowId,
      name: 'Sample Workflow',
      steps: [],
      variables: [],
      triggers: [],
      outputs: []
    };
  }

  private async getComponentDefinition(componentId: string): Promise<ComponentDefinition> {
    // This would get actual component definition
    return {
      id: componentId,
      type: 'form',
      props: {},
      events: [],
      methods: [],
      state: {}
    };
  }

  private async getComponentState(componentId: string): Promise<UIComponentState> {
    const state = this.stateSynchronizer.getState(`ui:${componentId}`);
    return state || {
      componentId,
      instanceId: '',
      props: {},
      localState: {},
      validationState: {
        isValid: true,
        errors: [],
        warnings: [],
        touched: [],
        dirty: []
      },
      interactionState: {
        isLoading: false,
        isDisabled: false,
        isFocused: false,
        isHovered: false,
        interactions: []
      }
    };
  }

  private async prepareWorkflowInputs(
    connection: BridgeConnection,
    componentState: UIComponentState,
    additionalInputs?: Record<string, any>
  ): Promise<Record<string, any>> {
    const inputs: Record<string, any> = { ...additionalInputs };

    // Apply bindings to prepare inputs
    for (const binding of connection.bindings) {
      if (binding.source.type === 'component' && binding.target.type === 'workflow') {
        const value = this.getValueAtPath(componentState, binding.source.path);
        if (value !== undefined) {
          const transformedValue = binding.transform ? 
            binding.transform(value, { source: componentState, target: inputs, metadata: {} }) : 
            value;
          
          this.setValueAtPath(inputs, binding.target.path, transformedValue);
        }
      }
    }

    return inputs;
  }

  private async executeWorkflow(workflowId: string, inputs: Record<string, any>): Promise<any> {
    if (this.workflowEngine) {
      return await this.workflowEngine.execute(workflowId, inputs);
    }
    
    // Simulate workflow execution
    return {
      success: true,
      outputs: { ...inputs, processed: true }
    };
  }

  private async updateComponentFromWorkflow(
    connection: BridgeConnection,
    componentId: string,
    workflowResult: any
  ): Promise<void> {
    // Apply output bindings
    for (const binding of connection.bindings) {
      if (binding.source.type === 'workflow' && binding.target.type === 'component') {
        const value = this.getValueAtPath(workflowResult, binding.source.path);
        if (value !== undefined) {
          const transformedValue = binding.transform ? 
            binding.transform(value, { source: workflowResult, target: {}, metadata: {} }) : 
            value;

          await this.updateComponentProperty(
            componentId,
            binding.target.path,
            transformedValue
          );
        }
      }
    }
  }

  private async updateComponentProperty(
    componentId: string,
    path: string,
    value: any
  ): Promise<void> {
    await this.stateSynchronizer.setState(
      `ui:${componentId}`,
      path,
      value,
      {
        source: 'workflow-ui-bridge',
        sourceType: 'service'
      }
    );
  }

  private subscribeToComponentEvent(
    componentId: string,
    eventName: string,
    handler: (event: any) => void
  ): void {
    // This would subscribe to actual component events
    const eventKey = `${componentId}:${eventName}`;
    if (!this.eventQueue.has(eventKey)) {
      this.eventQueue.set(eventKey, []);
    }
    this.eventQueue.get(eventKey)!.push(handler);
  }

  private unsubscribeFromComponentEvent(
    componentId: string,
    eventName: string
  ): void {
    const eventKey = `${componentId}:${eventName}`;
    this.eventQueue.delete(eventKey);
  }

  private subscribeToWorkflowEvent(
    workflowId: string,
    eventName: string,
    handler: (event: any) => void
  ): void {
    // This would subscribe to actual workflow events
    const eventKey = `${workflowId}:${eventName}`;
    if (!this.eventQueue.has(eventKey)) {
      this.eventQueue.set(eventKey, []);
    }
    this.eventQueue.get(eventKey)!.push(handler);
  }

  private unsubscribeFromWorkflowEvent(
    workflowId: string,
    eventName: string
  ): void {
    const eventKey = `${workflowId}:${eventName}`;
    this.eventQueue.delete(eventKey);
  }

  private async triggerWorkflowAction(
    workflowId: string,
    _actionName: string,
    _data: any
  ): Promise<void> {
    if (this.workflowEngine) {
      await this.workflowEngine.triggerAction(workflowId, _actionName, _data);
    }
  }

  private async triggerComponentAction(
    componentId: string,
    _actionName: string,
    _data: any
  ): Promise<void> {
    // This would trigger actual component actions
    const component = this.componentRegistry?.get(componentId);
    if (component) {
      // Trigger component method
    }
  }

  private createEventContext(): EventContext {
    return {
      source: {},
      target: {},
      timestamp: Date.now(),
      metadata: {}
    };
  }

  private getValueAtPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  private setValueAtPath(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!part) continue; // Skip empty parts
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      current[lastPart] = value;
    }
  }

  private startBatchSync(): void {
    this.syncTimer = setInterval(() => {
      this.processBatchEvents();
    }, this.config.batchInterval!);
  }

  private processBatchEvents(): void {
    // Process queued events in batch
    // TODO: Implement batch event processing
  }

  private handleSyncComplete(event: any): void {
    this.logger.info('Sync completed:', event);
  }

  private handleSyncError(event: any): void {
    this.logger.error('Sync error:', event);
  }

  private handleConflict(event: any): void {
    this.logger.warn('Conflict detected:', event);
  }

  private generateConnectionId(): string {
    return `conn:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBindingId(): string {
    return `bind:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMappingId(): string {
    return `map:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.removeAllListeners();
    this.connections.clear();
    this.eventQueue.clear();
  }
}

// Factory function
export function createWorkflowUIBridge(
  config?: WorkflowUIBridgeConfig,
  stateSynchronizer?: StateSynchronizer
): WorkflowUIBridge {
  return new WorkflowUIBridge(config, stateSynchronizer);
}