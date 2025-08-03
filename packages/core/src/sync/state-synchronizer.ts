import { EventEmitter } from 'events';
import { Logger } from '@opsai/shared';
import { discoveryContext } from '../context/discovery-context';
// ComponentInstance type defined locally to avoid circular dependency
interface ComponentInstance {
  id: string;
  componentId: string;
  tenantId: string;
  version: string;
  config: any;
  state: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface StateSynchronizerConfig {
  enableRealtime?: boolean;
  enableOptimisticUpdates?: boolean;
  enableConflictResolution?: boolean;
  syncInterval?: number;
  maxRetries?: number;
  enablePersistence?: boolean;
}

export interface SynchronizedState {
  id: string;
  namespace: string;
  version: number;
  data: Record<string, any>;
  metadata: StateMetadata;
  subscriptions: StateSubscription[];
  history: StateChange[];
}

export interface StateMetadata {
  createdAt: number;
  updatedAt: number;
  updatedBy: string;
  locked: boolean;
  lockedBy?: string;
  lockedAt?: number;
  checksum: string;
  tags: string[];
}

export interface StateSubscription {
  id: string;
  subscriberId: string;
  subscriberType: 'workflow' | 'ui-component' | 'service' | 'external';
  namespace: string;
  patterns: string[];
  filters?: StateFilter[];
  callback?: (change: StateChange) => void;
  options: SubscriptionOptions;
}

export interface StateFilter {
  path: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  value: any;
}

export interface SubscriptionOptions {
  debounce?: number;
  throttle?: number;
  immediate?: boolean;
  deep?: boolean;
  transform?: (data: any) => any;
}

export interface StateChange {
  id: string;
  timestamp: number;
  type: 'create' | 'update' | 'delete' | 'merge';
  namespace: string;
  path: string;
  previousValue: any;
  newValue: any;
  metadata: {
    source: string;
    sourceType: 'workflow' | 'ui-component' | 'service' | 'external';
    correlationId?: string;
    causationId?: string;
  };
}

export interface StateConflict {
  id: string;
  namespace: string;
  path: string;
  localValue: any;
  remoteValue: any;
  baseValue: any;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'custom';
  resolvedValue: any;
  resolvedBy: string;
  resolvedAt: number;
}

export interface StateSyncEvent {
  type: 'sync:start' | 'sync:complete' | 'sync:error' | 'conflict:detected' | 'conflict:resolved';
  namespace: string;
  details: any;
}

export interface WorkflowState {
  workflowId: string;
  instanceId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: string;
  variables: Record<string, any>;
  context: Record<string, any>;
  history: WorkflowEvent[];
}

export interface WorkflowEvent {
  timestamp: number;
  type: string;
  step: string;
  data: any;
}

export interface UIComponentState {
  componentId: string;
  instanceId: string;
  props: Record<string, any>;
  localState: Record<string, any>;
  validationState: ValidationState;
  interactionState: InteractionState;
}

export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  touched: string[];
  dirty: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface InteractionState {
  isLoading: boolean;
  isDisabled: boolean;
  isFocused: boolean;
  isHovered: boolean;
  interactions: UserInteraction[];
}

export interface UserInteraction {
  timestamp: number;
  type: 'click' | 'focus' | 'blur' | 'change' | 'submit';
  target: string;
  data?: any;
}

export class StateSynchronizer extends EventEmitter {
  private config: StateSynchronizerConfig;
  private logger: Logger;
  private states: Map<string, SynchronizedState> = new Map();
  private subscriptions: Map<string, StateSubscription> = new Map();
  private pendingChanges: Map<string, StateChange[]> = new Map();
  private syncTimer: NodeJS.Timer | null = null;
  private conflictResolver: ConflictResolver;
  private stateValidator: StateValidator;
  private persistenceManager: PersistenceManager;

  constructor(config?: StateSynchronizerConfig) {
    super();
    this.config = {
      enableRealtime: true,
      enableOptimisticUpdates: true,
      enableConflictResolution: true,
      syncInterval: 1000,
      maxRetries: 3,
      enablePersistence: true,
      ...config
    };
    this.logger = new Logger('StateSynchronizer');
    this.conflictResolver = new ConflictResolver();
    this.stateValidator = new StateValidator();
    this.persistenceManager = new PersistenceManager();
    
    this.initialize();
  }

  /**
   * Initialize state synchronizer
   */
  private async initialize(): Promise<void> {
    if (this.config.enablePersistence) {
      await this.loadPersistedStates();
    }

    if (this.config.enableRealtime) {
      this.startSyncTimer();
    }

    this.logger.info('State synchronizer initialized');
  }

  /**
   * Create or update state
   */
  async setState(
    namespace: string,
    path: string,
    value: any,
    metadata?: Partial<StateChange['metadata']>
  ): Promise<void> {
    const stateId = this.getStateId(namespace);
    let state = this.states.get(stateId);

    if (!state) {
      state = this.createState(namespace);
      this.states.set(stateId, state);
    }

    // Validate state change
    const validation = await this.stateValidator.validate(namespace, path, value);
    if (!validation.valid) {
      throw new Error(`Invalid state change: ${validation.errors.join(', ')}`);
    }

    // Check for locks
    if (state.metadata.locked && state.metadata.lockedBy !== metadata?.source) {
      throw new Error(`State is locked by ${state.metadata.lockedBy}`);
    }

    // Get previous value
    const previousValue = this.getValueAtPath(state.data, path);

    // Apply optimistic update if enabled
    if (this.config.enableOptimisticUpdates) {
      this.setValueAtPath(state.data, path, value);
      state.version++;
      state.metadata.updatedAt = Date.now();
      state.metadata.updatedBy = metadata?.source || 'system';
    }

    // Create state change
    const change: StateChange = {
      id: this.generateChangeId(),
      timestamp: Date.now(),
      type: previousValue === undefined ? 'create' : 'update',
      namespace,
      path,
      previousValue,
      newValue: value,
      metadata: {
        source: metadata?.source || 'unknown',
        sourceType: metadata?.sourceType || 'external',
        correlationId: metadata?.correlationId,
        causationId: metadata?.causationId
      }
    };

    // Add to history
    state.history.push(change);

    // Queue change for sync
    this.queueChange(namespace, change);

    // Notify subscribers
    await this.notifySubscribers(namespace, change);

    // Update discovery context
    discoveryContext.updateCustomData('lastStateChange', {
      namespace,
      path,
      timestamp: change.timestamp
    });
  }

  /**
   * Get state value
   */
  getState(namespace: string, path?: string): any {
    const stateId = this.getStateId(namespace);
    const state = this.states.get(stateId);

    if (!state) {
      return undefined;
    }

    if (!path) {
      return state.data;
    }

    return this.getValueAtPath(state.data, path);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(subscription: Omit<StateSubscription, 'id'>): string {
    const subscriptionId = this.generateSubscriptionId();
    const fullSubscription: StateSubscription = {
      ...subscription,
      id: subscriptionId
    };

    this.subscriptions.set(subscriptionId, fullSubscription);

    // Add subscription to state
    const stateId = this.getStateId(subscription.namespace);
    let state = this.states.get(stateId);
    
    if (!state) {
      state = this.createState(subscription.namespace);
      this.states.set(stateId, state);
    }
    
    state.subscriptions.push(fullSubscription);

    this.logger.info(`Subscription created: ${subscriptionId} for ${subscription.namespace}`);

    return subscriptionId;
  }

  /**
   * Unsubscribe from state changes
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    // Remove from subscriptions map
    this.subscriptions.delete(subscriptionId);

    // Remove from state subscriptions
    const stateId = this.getStateId(subscription.namespace);
    const state = this.states.get(stateId);
    
    if (state) {
      state.subscriptions = state.subscriptions.filter(s => s.id !== subscriptionId);
    }

    this.logger.info(`Subscription removed: ${subscriptionId}`);
  }

  /**
   * Sync workflow state with UI
   */
  async syncWorkflowState(workflowState: WorkflowState): Promise<void> {
    const namespace = `workflow:${workflowState.workflowId}`;
    
    // Update workflow state
    await this.setState(namespace, 'status', workflowState.status, {
      source: workflowState.instanceId,
      sourceType: 'workflow'
    });

    await this.setState(namespace, 'currentStep', workflowState.currentStep, {
      source: workflowState.instanceId,
      sourceType: 'workflow'
    });

    await this.setState(namespace, 'variables', workflowState.variables, {
      source: workflowState.instanceId,
      sourceType: 'workflow'
    });

    // Find related UI components
    const relatedComponents = await this.findRelatedUIComponents(workflowState.workflowId);
    
    // Update UI components
    for (const component of relatedComponents) {
      await this.updateUIComponent(component, workflowState);
    }
  }

  /**
   * Sync UI component state with workflow
   */
  async syncUIComponentState(componentState: UIComponentState): Promise<void> {
    const namespace = `ui:${componentState.componentId}`;
    
    // Update component state
    await this.setState(namespace, 'props', componentState.props, {
      source: componentState.instanceId,
      sourceType: 'ui-component'
    });

    await this.setState(namespace, 'localState', componentState.localState, {
      source: componentState.instanceId,
      sourceType: 'ui-component'
    });

    // Find related workflows
    const relatedWorkflows = await this.findRelatedWorkflows(componentState.componentId);
    
    // Update workflows
    for (const workflow of relatedWorkflows) {
      await this.updateWorkflow(workflow, componentState);
    }
  }

  /**
   * Handle state conflicts
   */
  async resolveConflict(conflict: StateConflict): Promise<ConflictResolution> {
    if (!this.config.enableConflictResolution) {
      throw new Error('Conflict resolution is disabled');
    }

    const resolution = await this.conflictResolver.resolve(conflict);
    
    // Apply resolution
    await this.setState(conflict.namespace, conflict.path, resolution.resolvedValue, {
      source: resolution.resolvedBy,
      sourceType: 'service'
    });

    // Emit conflict resolved event
    this.emit('conflict:resolved', {
      conflict,
      resolution
    });

    return resolution;
  }

  /**
   * Lock state for exclusive access
   */
  async lockState(namespace: string, lockerId: string, duration?: number): Promise<void> {
    const stateId = this.getStateId(namespace);
    const state = this.states.get(stateId);

    if (!state) {
      throw new Error(`State not found: ${namespace}`);
    }

    if (state.metadata.locked && state.metadata.lockedBy !== lockerId) {
      throw new Error(`State is already locked by ${state.metadata.lockedBy}`);
    }

    state.metadata.locked = true;
    state.metadata.lockedBy = lockerId;
    state.metadata.lockedAt = Date.now();

    // Auto-unlock after duration
    if (duration) {
      setTimeout(() => {
        this.unlockState(namespace, lockerId);
      }, duration);
    }
  }

  /**
   * Unlock state
   */
  async unlockState(namespace: string, lockerId: string): Promise<void> {
    const stateId = this.getStateId(namespace);
    const state = this.states.get(stateId);

    if (!state) {
      return;
    }

    if (state.metadata.lockedBy === lockerId) {
      state.metadata.locked = false;
      state.metadata.lockedBy = undefined;
      state.metadata.lockedAt = undefined;
    }
  }

  /**
   * Get state history
   */
  getStateHistory(namespace: string, options?: {
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): StateChange[] {
    const stateId = this.getStateId(namespace);
    const state = this.states.get(stateId);

    if (!state) {
      return [];
    }

    let history = state.history;

    if (options?.startTime) {
      history = history.filter(h => h.timestamp >= options.startTime!);
    }

    if (options?.endTime) {
      history = history.filter(h => h.timestamp <= options.endTime!);
    }

    if (options?.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  /**
   * Create bidirectional binding between workflow and UI
   */
  async createBinding(
    workflowId: string,
    componentId: string,
    mappings: StateMapping[]
  ): Promise<string> {
    const bindingId = this.generateBindingId();
    
    // Subscribe to workflow changes
    const workflowSubId = this.subscribe({
      subscriberId: bindingId,
      subscriberType: 'service',
      namespace: `workflow:${workflowId}`,
      patterns: mappings.map(m => m.workflowPath),
      callback: async (change) => {
        const mapping = mappings.find(m => m.workflowPath === change.path);
        if (mapping) {
          await this.setState(
            `ui:${componentId}`,
            mapping.componentPath,
            mapping.transform ? mapping.transform(change.newValue) : change.newValue,
            {
              source: bindingId,
              sourceType: 'service',
              correlationId: change.id
            }
          );
        }
      },
      options: { immediate: true }
    });

    // Subscribe to component changes
    const componentSubId = this.subscribe({
      subscriberId: bindingId,
      subscriberType: 'service',
      namespace: `ui:${componentId}`,
      patterns: mappings.map(m => m.componentPath),
      callback: async (change) => {
        const mapping = mappings.find(m => m.componentPath === change.path);
        if (mapping) {
          await this.setState(
            `workflow:${workflowId}`,
            mapping.workflowPath,
            mapping.reverseTransform ? mapping.reverseTransform(change.newValue) : change.newValue,
            {
              source: bindingId,
              sourceType: 'service',
              correlationId: change.id
            }
          );
        }
      },
      options: { immediate: true }
    });

    // Store binding info
    await this.setState('bindings', bindingId, {
      id: bindingId,
      workflowId,
      componentId,
      mappings,
      subscriptions: [workflowSubId, componentSubId],
      createdAt: Date.now()
    });

    return bindingId;
  }

  /**
   * Remove binding
   */
  async removeBinding(bindingId: string): Promise<void> {
    const binding = this.getState('bindings', bindingId);
    if (!binding) {
      return;
    }

    // Unsubscribe from state changes
    for (const subId of binding.subscriptions) {
      this.unsubscribe(subId);
    }

    // Remove binding info
    await this.setState('bindings', bindingId, undefined);
  }

  // Private helper methods

  private createState(namespace: string): SynchronizedState {
    return {
      id: this.getStateId(namespace),
      namespace,
      version: 1,
      data: {},
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        updatedBy: 'system',
        locked: false,
        checksum: '',
        tags: []
      },
      subscriptions: [],
      history: []
    };
  }

  private getStateId(namespace: string): string {
    return `state:${namespace}`;
  }

  private generateChangeId(): string {
    return `change:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBindingId(): string {
    return `binding:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
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
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  private async notifySubscribers(namespace: string, change: StateChange): Promise<void> {
    const stateId = this.getStateId(namespace);
    const state = this.states.get(stateId);
    
    if (!state) {
      return;
    }

    for (const subscription of state.subscriptions) {
      if (this.matchesSubscription(change, subscription)) {
        try {
          if (subscription.callback) {
            // Apply options
            if (subscription.options.transform) {
              const transformedChange = {
                ...change,
                newValue: subscription.options.transform(change.newValue)
              };
              await subscription.callback(transformedChange);
            } else {
              await subscription.callback(change);
            }
          }
        } catch (error) {
          this.logger.error(`Error notifying subscriber ${subscription.id}:`, error);
        }
      }
    }
  }

  private matchesSubscription(change: StateChange, subscription: StateSubscription): boolean {
    // Check namespace
    if (change.namespace !== subscription.namespace) {
      return false;
    }

    // Check patterns
    if (subscription.patterns.length > 0) {
      const matches = subscription.patterns.some(pattern => {
        if (pattern === '*') return true;
        if (pattern.endsWith('*')) {
          return change.path.startsWith(pattern.slice(0, -1));
        }
        return change.path === pattern;
      });
      
      if (!matches) return false;
    }

    // Check filters
    if (subscription.filters) {
      for (const filter of subscription.filters) {
        const value = this.getValueAtPath({ [change.path]: change.newValue }, filter.path);
        if (!this.matchesFilter(value, filter)) {
          return false;
        }
      }
    }

    return true;
  }

  private matchesFilter(value: any, filter: StateFilter): boolean {
    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'contains':
        return String(value).includes(String(filter.value));
      case 'startsWith':
        return String(value).startsWith(String(filter.value));
      case 'endsWith':
        return String(value).endsWith(String(filter.value));
      case 'regex':
        return new RegExp(filter.value).test(String(value));
      default:
        return false;
    }
  }

  private queueChange(namespace: string, change: StateChange): void {
    if (!this.pendingChanges.has(namespace)) {
      this.pendingChanges.set(namespace, []);
    }
    
    this.pendingChanges.get(namespace)!.push(change);
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      return;
    }

    this.syncTimer = setInterval(() => {
      this.processPendingChanges();
    }, this.config.syncInterval!);
  }

  private async processPendingChanges(): Promise<void> {
    for (const [namespace, changes] of this.pendingChanges) {
      if (changes.length === 0) continue;

      try {
        await this.syncChanges(namespace, changes);
        this.pendingChanges.set(namespace, []);
      } catch (error) {
        this.logger.error(`Error syncing changes for ${namespace}:`, error);
      }
    }
  }

  private async syncChanges(namespace: string, changes: StateChange[]): Promise<void> {
    // This would sync to external systems, databases, etc.
    this.emit('sync:complete', {
      type: 'sync:complete',
      namespace,
      details: { changeCount: changes.length }
    });
  }

  private async loadPersistedStates(): Promise<void> {
    try {
      const persistedStates = await this.persistenceManager.loadStates();
      for (const state of persistedStates) {
        this.states.set(state.id, state);
      }
      this.logger.info(`Loaded ${persistedStates.length} persisted states`);
    } catch (error) {
      this.logger.error('Error loading persisted states:', error);
    }
  }

  private async findRelatedUIComponents(workflowId: string): Promise<ComponentInstance[]> {
    // This would query component registry for related components
    return [];
  }

  private async findRelatedWorkflows(componentId: string): Promise<WorkflowState[]> {
    // This would query workflow engine for related workflows
    return [];
  }

  private async updateUIComponent(component: ComponentInstance, workflowState: WorkflowState): Promise<void> {
    // Update component based on workflow state
    const namespace = `ui:${component.componentId}`;
    
    // Map workflow state to component props
    const mappedProps = this.mapWorkflowStateToProps(workflowState, component);
    
    await this.setState(namespace, 'props', mappedProps, {
      source: workflowState.instanceId,
      sourceType: 'workflow'
    });
  }

  private async updateWorkflow(workflow: WorkflowState, componentState: UIComponentState): Promise<void> {
    // Update workflow based on component state
    const namespace = `workflow:${workflow.workflowId}`;
    
    // Map component state to workflow variables
    const mappedVariables = this.mapComponentStateToVariables(componentState, workflow);
    
    await this.setState(namespace, 'variables', mappedVariables, {
      source: componentState.instanceId,
      sourceType: 'ui-component'
    });
  }

  private mapWorkflowStateToProps(workflowState: WorkflowState, component: ComponentInstance): Record<string, any> {
    // Default mapping - would be customized per component type
    return {
      ...component.props,
      workflowStatus: workflowState.status,
      currentStep: workflowState.currentStep,
      isLoading: workflowState.status === 'running',
      isDisabled: ['completed', 'failed', 'cancelled'].includes(workflowState.status)
    };
  }

  private mapComponentStateToVariables(componentState: UIComponentState, workflow: WorkflowState): Record<string, any> {
    // Default mapping - would be customized per workflow type
    return {
      ...workflow.variables,
      uiState: componentState.localState,
      validationState: componentState.validationState
    };
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
    this.states.clear();
    this.subscriptions.clear();
    this.pendingChanges.clear();
  }
}

// Helper classes
class ConflictResolver {
  async resolve(conflict: StateConflict): Promise<ConflictResolution> {
    // Default resolution strategy - last write wins
    return {
      strategy: 'remote',
      resolvedValue: conflict.remoteValue,
      resolvedBy: 'system',
      resolvedAt: Date.now()
    };
  }
}

class StateValidator {
  async validate(namespace: string, path: string, value: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Basic validation
    if (namespace === '' || path === '') {
      errors.push('Namespace and path are required');
    }
    
    // Type-specific validation could be added here
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

class PersistenceManager {
  async loadStates(): Promise<SynchronizedState[]> {
    // Load from database or storage
    return [];
  }
  
  async saveState(state: SynchronizedState): Promise<void> {
    // Save to database or storage
  }
}

// Type definitions
interface StateMapping {
  workflowPath: string;
  componentPath: string;
  transform?: (value: any) => any;
  reverseTransform?: (value: any) => any;
}

// Singleton instance
let synchronizerInstance: StateSynchronizer | null = null;

export function getStateSynchronizer(config?: StateSynchronizerConfig): StateSynchronizer {
  if (!synchronizerInstance) {
    synchronizerInstance = new StateSynchronizer(config);
  }
  return synchronizerInstance;
}

// Factory function
export function createStateSynchronizer(config?: StateSynchronizerConfig): StateSynchronizer {
  return new StateSynchronizer(config);
}