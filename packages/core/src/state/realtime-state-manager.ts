import { EventEmitter } from 'events';
import { Logger } from '@opsai/shared';
import { createStateSynchronizer, StateSynchronizer } from '../sync/state-synchronizer';
import { createWorkflowUIBridge, WorkflowUIBridge } from '../bridges/workflow-ui-bridge';
import { discoveryContext } from '../context/discovery-context';

export interface RealtimeStateConfig {
  enableWebSocket?: boolean;
  enableServerSentEvents?: boolean;
  enableLongPolling?: boolean;
  heartbeatInterval?: number;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  enableCompression?: boolean;
  enableEncryption?: boolean;
}

export interface StateChannel {
  id: string;
  name: string;
  type: 'global' | 'tenant' | 'user' | 'workflow' | 'component';
  subscribers: Set<string>;
  state: ChannelState;
  permissions: ChannelPermissions;
  metadata: ChannelMetadata;
}

export interface ChannelState {
  data: Record<string, any>;
  version: number;
  lastUpdate: number;
  checksum: string;
}

export interface ChannelPermissions {
  read: string[];
  write: string[];
  admin: string[];
}

export interface ChannelMetadata {
  created: number;
  owner: string;
  tags: string[];
  ttl?: number;
  priority: 'low' | 'normal' | 'high';
}

export interface StateUpdate {
  channelId: string;
  updateId: string;
  timestamp: number;
  type: 'set' | 'merge' | 'delete' | 'increment' | 'append';
  path: string;
  value?: any;
  delta?: any;
  metadata: UpdateMetadata;
}

export interface UpdateMetadata {
  source: string;
  sourceType: 'user' | 'system' | 'workflow' | 'component';
  userId?: string;
  correlationId?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface StateSnapshot {
  id: string;
  channelId: string;
  timestamp: number;
  state: any;
  metadata: SnapshotMetadata;
}

export interface SnapshotMetadata {
  reason: string;
  createdBy: string;
  tags: string[];
  expiresAt?: number;
}

export interface StateSubscription {
  id: string;
  channelId: string;
  subscriberId: string;
  filter?: SubscriptionFilter;
  handler: StateUpdateHandler;
  options: SubscriptionOptions;
}

export interface SubscriptionFilter {
  paths?: string[];
  types?: string[];
  sources?: string[];
  minPriority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface SubscriptionOptions {
  buffering?: boolean;
  bufferSize?: number;
  bufferTimeout?: number;
  errorHandler?: (error: Error) => void;
}

export interface StateUpdateHandler {
  (update: StateUpdate, state: any): void | Promise<void>;
}

export interface RealtimeConnection {
  id: string;
  type: 'websocket' | 'sse' | 'longpoll';
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  client: any;
  channels: Set<string>;
  lastActivity: number;
}

export interface StateTransaction {
  id: string;
  channelId: string;
  operations: TransactionOperation[];
  status: 'pending' | 'committed' | 'rolled_back';
  metadata: TransactionMetadata;
}

export interface TransactionOperation {
  type: 'set' | 'merge' | 'delete';
  path: string;
  value?: any;
  previousValue?: any;
}

export interface TransactionMetadata {
  startTime: number;
  endTime?: number;
  initiator: string;
  reason?: string;
}

export interface StateMetrics {
  channelCount: number;
  subscriberCount: number;
  updateRate: number;
  averageLatency: number;
  memoryUsage: number;
  connectionCount: number;
}

export class RealtimeStateManager extends EventEmitter {
  private config: RealtimeStateConfig;
  private logger: Logger;
  private stateSynchronizer: StateSynchronizer;
  private workflowUIBridge: WorkflowUIBridge;
  private channels: Map<string, StateChannel> = new Map();
  private subscriptions: Map<string, StateSubscription> = new Map();
  private connections: Map<string, RealtimeConnection> = new Map();
  private snapshots: Map<string, StateSnapshot[]> = new Map();
  private transactions: Map<string, StateTransaction> = new Map();
  private updateBuffer: Map<string, StateUpdate[]> = new Map();
  private metricsCollector: MetricsCollector;
  private heartbeatTimer: NodeJS.Timer | null = null;

  constructor(
    config?: RealtimeStateConfig,
    stateSynchronizer?: StateSynchronizer,
    workflowUIBridge?: WorkflowUIBridge
  ) {
    super();
    this.config = {
      enableWebSocket: true,
      enableServerSentEvents: true,
      enableLongPolling: true,
      heartbeatInterval: 30000,
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      enableCompression: true,
      enableEncryption: true,
      ...config
    };
    this.logger = new Logger('RealtimeStateManager');
    this.stateSynchronizer = stateSynchronizer || createStateSynchronizer();
    this.workflowUIBridge = workflowUIBridge || createWorkflowUIBridge();
    this.metricsCollector = new MetricsCollector();

    this.initialize();
  }

  /**
   * Initialize realtime state manager
   */
  private async initialize(): Promise<void> {
    // Setup heartbeat
    this.startHeartbeat();

    // Subscribe to state synchronizer events
    this.stateSynchronizer.on('sync:complete', this.handleStateSync.bind(this));

    // Subscribe to workflow-UI bridge events
    this.workflowUIBridge.on('sync:complete', this.handleBridgeSync.bind(this));

    // Create default channels
    await this.createDefaultChannels();

    this.logger.info('Realtime state manager initialized');
  }

  /**
   * Create or get state channel
   */
  async createChannel(
    name: string,
    type: StateChannel['type'],
    permissions?: ChannelPermissions,
    metadata?: Partial<ChannelMetadata>
  ): Promise<string> {
    const channelId = this.generateChannelId(name, type);
    
    if (this.channels.has(channelId)) {
      return channelId;
    }

    const channel: StateChannel = {
      id: channelId,
      name,
      type,
      subscribers: new Set(),
      state: {
        data: {},
        version: 1,
        lastUpdate: Date.now(),
        checksum: ''
      },
      permissions: permissions || {
        read: ['*'],
        write: ['*'],
        admin: ['admin']
      },
      metadata: {
        created: Date.now(),
        owner: 'system',
        tags: [],
        priority: 'normal',
        ...metadata
      }
    };

    this.channels.set(channelId, channel);

    // Initialize in state synchronizer
    await this.stateSynchronizer.setState(
      `channel:${channelId}`,
      'state',
      channel.state.data,
      {
        source: 'realtime-state-manager',
        sourceType: 'service'
      }
    );

    this.emit('channel:created', { channelId, name, type });

    return channelId;
  }

  /**
   * Update channel state
   */
  async updateState(
    channelId: string,
    path: string,
    value: any,
    options?: {
      type?: StateUpdate['type'];
      metadata?: Partial<UpdateMetadata>;
      broadcast?: boolean;
    }
  ): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    // Check write permissions
    const hasPermission = await this.checkWritePermission(
      channel,
      options?.metadata?.userId || 'system'
    );
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions to update state');
    }

    // Create state update
    const update: StateUpdate = {
      channelId,
      updateId: this.generateUpdateId(),
      timestamp: Date.now(),
      type: options?.type || 'set',
      path,
      value,
      metadata: {
        source: options?.metadata?.source || 'unknown',
        sourceType: options?.metadata?.sourceType || 'system',
        userId: options?.metadata?.userId,
        correlationId: options?.metadata?.correlationId,
        priority: options?.metadata?.priority || 'normal'
      }
    };

    // Apply update based on type
    const previousValue = this.getValueAtPath(channel.state.data, path);
    
    switch (update.type) {
      case 'set':
        this.setValueAtPath(channel.state.data, path, value);
        break;
      case 'merge':
        const existing = this.getValueAtPath(channel.state.data, path) || {};
        this.setValueAtPath(channel.state.data, path, { ...existing, ...value });
        break;
      case 'delete':
        this.deleteValueAtPath(channel.state.data, path);
        break;
      case 'increment':
        const current = this.getValueAtPath(channel.state.data, path) || 0;
        this.setValueAtPath(channel.state.data, path, current + (value || 1));
        break;
      case 'append':
        const array = this.getValueAtPath(channel.state.data, path) || [];
        this.setValueAtPath(channel.state.data, path, [...array, value]);
        break;
    }

    // Update channel metadata
    channel.state.version++;
    channel.state.lastUpdate = update.timestamp;
    channel.state.checksum = this.calculateChecksum(channel.state.data);

    // Buffer update
    this.bufferUpdate(channelId, update);

    // Sync with state synchronizer
    await this.stateSynchronizer.setState(
      `channel:${channelId}`,
      path,
      value,
      {
        source: update.metadata.source,
        sourceType: update.metadata.sourceType,
        correlationId: update.metadata.correlationId
      }
    );

    // Broadcast to subscribers if enabled
    if (options?.broadcast !== false) {
      await this.broadcastUpdate(channelId, update);
    }

    // Update metrics
    this.metricsCollector.recordUpdate(channelId, update);

    // Update discovery context
    discoveryContext.updateCustomData('lastStateUpdate', {
      channelId,
      path,
      timestamp: update.timestamp
    });
  }

  /**
   * Get channel state
   */
  getState(channelId: string, path?: string): any {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return undefined;
    }

    if (!path) {
      return channel.state.data;
    }

    return this.getValueAtPath(channel.state.data, path);
  }

  /**
   * Subscribe to channel updates
   */
  subscribe(
    channelId: string,
    subscriberId: string,
    handler: StateUpdateHandler,
    options?: {
      filter?: SubscriptionFilter;
      subscriptionOptions?: SubscriptionOptions;
    }
  ): string {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const subscriptionId = this.generateSubscriptionId();
    
    const subscription: StateSubscription = {
      id: subscriptionId,
      channelId,
      subscriberId,
      filter: options?.filter,
      handler,
      options: options?.subscriptionOptions || {}
    };

    this.subscriptions.set(subscriptionId, subscription);
    channel.subscribers.add(subscriberId);

    this.logger.info(`Subscription created: ${subscriptionId} for channel ${channelId}`);

    return subscriptionId;
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }

    const channel = this.channels.get(subscription.channelId);
    if (channel) {
      channel.subscribers.delete(subscription.subscriberId);
    }

    this.subscriptions.delete(subscriptionId);

    this.logger.info(`Subscription removed: ${subscriptionId}`);
  }

  /**
   * Create state snapshot
   */
  async createSnapshot(
    channelId: string,
    metadata?: Partial<SnapshotMetadata>
  ): Promise<string> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const snapshotId = this.generateSnapshotId();
    
    const snapshot: StateSnapshot = {
      id: snapshotId,
      channelId,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(channel.state.data)),
      metadata: {
        reason: metadata?.reason || 'manual',
        createdBy: metadata?.createdBy || 'system',
        tags: metadata?.tags || [],
        expiresAt: metadata?.expiresAt
      }
    };

    if (!this.snapshots.has(channelId)) {
      this.snapshots.set(channelId, []);
    }

    this.snapshots.get(channelId)!.push(snapshot);

    this.emit('snapshot:created', { snapshotId, channelId });

    return snapshotId;
  }

  /**
   * Restore from snapshot
   */
  async restoreSnapshot(snapshotId: string): Promise<void> {
    let targetSnapshot: StateSnapshot | null = null;
    let targetChannelId: string | null = null;

    // Find snapshot
    for (const [channelId, snapshots] of this.snapshots) {
      const snapshot = snapshots.find(s => s.id === snapshotId);
      if (snapshot) {
        targetSnapshot = snapshot;
        targetChannelId = channelId;
        break;
      }
    }

    if (!targetSnapshot || !targetChannelId) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const channel = this.channels.get(targetChannelId);
    if (!channel) {
      throw new Error(`Channel not found: ${targetChannelId}`);
    }

    // Create backup snapshot before restore
    await this.createSnapshot(targetChannelId, {
      reason: 'pre-restore-backup',
      createdBy: 'system',
      tags: ['backup', 'restore']
    });

    // Restore state
    channel.state.data = JSON.parse(JSON.stringify(targetSnapshot.state));
    channel.state.version++;
    channel.state.lastUpdate = Date.now();
    channel.state.checksum = this.calculateChecksum(channel.state.data);

    // Sync with state synchronizer
    await this.stateSynchronizer.setState(
      `channel:${targetChannelId}`,
      '',
      channel.state.data,
      {
        source: 'realtime-state-manager',
        sourceType: 'service'
      }
    );

    // Broadcast restore event
    const update: StateUpdate = {
      channelId: targetChannelId,
      updateId: this.generateUpdateId(),
      timestamp: Date.now(),
      type: 'set',
      path: '',
      value: channel.state.data,
      metadata: {
        source: 'snapshot-restore',
        sourceType: 'system',
        priority: 'high'
      }
    };

    await this.broadcastUpdate(targetChannelId, update);

    this.emit('snapshot:restored', { snapshotId, channelId: targetChannelId });
  }

  /**
   * Begin transaction
   */
  async beginTransaction(channelId: string, initiator: string): Promise<string> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const transactionId = this.generateTransactionId();
    
    const transaction: StateTransaction = {
      id: transactionId,
      channelId,
      operations: [],
      status: 'pending',
      metadata: {
        startTime: Date.now(),
        initiator
      }
    };

    this.transactions.set(transactionId, transaction);

    return transactionId;
  }

  /**
   * Add operation to transaction
   */
  addTransactionOperation(
    transactionId: string,
    operation: Omit<TransactionOperation, 'previousValue'>
  ): void {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (transaction.status !== 'pending') {
      throw new Error(`Transaction is not pending: ${transactionId}`);
    }

    const channel = this.channels.get(transaction.channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${transaction.channelId}`);
    }

    const previousValue = this.getValueAtPath(channel.state.data, operation.path);
    
    transaction.operations.push({
      ...operation,
      previousValue
    });
  }

  /**
   * Commit transaction
   */
  async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (transaction.status !== 'pending') {
      throw new Error(`Transaction is not pending: ${transactionId}`);
    }

    const channel = this.channels.get(transaction.channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${transaction.channelId}`);
    }

    try {
      // Apply all operations
      for (const operation of transaction.operations) {
        switch (operation.type) {
          case 'set':
            this.setValueAtPath(channel.state.data, operation.path, operation.value);
            break;
          case 'merge':
            const existing = this.getValueAtPath(channel.state.data, operation.path) || {};
            this.setValueAtPath(channel.state.data, operation.path, { ...existing, ...operation.value });
            break;
          case 'delete':
            this.deleteValueAtPath(channel.state.data, operation.path);
            break;
        }
      }

      // Update channel state
      channel.state.version++;
      channel.state.lastUpdate = Date.now();
      channel.state.checksum = this.calculateChecksum(channel.state.data);

      // Mark transaction as committed
      transaction.status = 'committed';
      transaction.metadata.endTime = Date.now();

      // Sync with state synchronizer
      await this.stateSynchronizer.setState(
        `channel:${transaction.channelId}`,
        '',
        channel.state.data,
        {
          source: 'transaction',
          sourceType: 'system',
          correlationId: transactionId
        }
      );

      // Broadcast transaction commit
      const update: StateUpdate = {
        channelId: transaction.channelId,
        updateId: this.generateUpdateId(),
        timestamp: Date.now(),
        type: 'merge',
        path: '',
        value: channel.state.data,
        metadata: {
          source: 'transaction-commit',
          sourceType: 'system',
          correlationId: transactionId,
          priority: 'high'
        }
      };

      await this.broadcastUpdate(transaction.channelId, update);

      this.emit('transaction:committed', { transactionId });

    } catch (error) {
      // Rollback on error
      await this.rollbackTransaction(transactionId);
      throw error;
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (transaction.status === 'rolled_back') {
      return;
    }

    const channel = this.channels.get(transaction.channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${transaction.channelId}`);
    }

    // Restore previous values
    for (const operation of transaction.operations.reverse()) {
      if (operation.previousValue !== undefined) {
        this.setValueAtPath(channel.state.data, operation.path, operation.previousValue);
      } else {
        this.deleteValueAtPath(channel.state.data, operation.path);
      }
    }

    // Update channel state
    channel.state.version++;
    channel.state.lastUpdate = Date.now();
    channel.state.checksum = this.calculateChecksum(channel.state.data);

    // Mark transaction as rolled back
    transaction.status = 'rolled_back';
    transaction.metadata.endTime = Date.now();

    this.emit('transaction:rolledback', { transactionId });
  }

  /**
   * Get state metrics
   */
  getMetrics(): StateMetrics {
    return {
      channelCount: this.channels.size,
      subscriberCount: this.subscriptions.size,
      updateRate: this.metricsCollector.getUpdateRate(),
      averageLatency: this.metricsCollector.getAverageLatency(),
      memoryUsage: this.metricsCollector.getMemoryUsage(),
      connectionCount: this.connections.size
    };
  }

  /**
   * Establish realtime connection
   */
  async connect(
    clientId: string,
    type: RealtimeConnection['type']
  ): Promise<string> {
    const connectionId = this.generateConnectionId();
    
    const connection: RealtimeConnection = {
      id: connectionId,
      type,
      status: 'connecting',
      client: null,
      channels: new Set(),
      lastActivity: Date.now()
    };

    this.connections.set(connectionId, connection);

    // Initialize connection based on type
    switch (type) {
      case 'websocket':
        await this.initializeWebSocket(connection);
        break;
      case 'sse':
        await this.initializeSSE(connection);
        break;
      case 'longpoll':
        await this.initializeLongPolling(connection);
        break;
    }

    connection.status = 'connected';

    this.emit('connection:established', { connectionId, clientId, type });

    return connectionId;
  }

  // Private helper methods

  private async createDefaultChannels(): Promise<void> {
    // Create global channel
    await this.createChannel('global', 'global', {
      read: ['*'],
      write: ['admin'],
      admin: ['admin']
    });

    // Create system channel
    await this.createChannel('system', 'global', {
      read: ['admin'],
      write: ['system'],
      admin: ['admin']
    });
  }

  private async checkWritePermission(channel: StateChannel, userId: string): Promise<boolean> {
    // Check if user has write permission
    return channel.permissions.write.includes('*') || 
           channel.permissions.write.includes(userId) ||
           channel.permissions.admin.includes(userId);
  }

  private bufferUpdate(channelId: string, update: StateUpdate): void {
    if (!this.updateBuffer.has(channelId)) {
      this.updateBuffer.set(channelId, []);
    }

    const buffer = this.updateBuffer.get(channelId)!;
    buffer.push(update);

    // Limit buffer size
    if (buffer.length > 1000) {
      buffer.shift();
    }
  }

  private async broadcastUpdate(channelId: string, update: StateUpdate): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    // Get relevant subscriptions
    const subscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.channelId === channelId);

    // Notify each subscriber
    for (const subscription of subscriptions) {
      if (this.matchesFilter(update, subscription.filter)) {
        try {
          await subscription.handler(update, channel.state.data);
        } catch (error) {
          this.logger.error(`Error in subscription handler ${subscription.id}:`, error);
          
          if (subscription.options.errorHandler) {
            subscription.options.errorHandler(error as Error);
          }
        }
      }
    }

    // Broadcast to realtime connections
    for (const connection of this.connections.values()) {
      if (connection.channels.has(channelId) && connection.status === 'connected') {
        await this.sendToConnection(connection, update);
      }
    }
  }

  private matchesFilter(update: StateUpdate, filter?: SubscriptionFilter): boolean {
    if (!filter) return true;

    if (filter.paths && !filter.paths.some(p => update.path.startsWith(p))) {
      return false;
    }

    if (filter.types && !filter.types.includes(update.type)) {
      return false;
    }

    if (filter.sources && !filter.sources.includes(update.metadata.source)) {
      return false;
    }

    if (filter.minPriority) {
      const priorities = ['low', 'normal', 'high', 'critical'];
      const minIndex = priorities.indexOf(filter.minPriority);
      const updateIndex = priorities.indexOf(update.metadata.priority);
      if (updateIndex < minIndex) {
        return false;
      }
    }

    return true;
  }

  private async initializeWebSocket(connection: RealtimeConnection): Promise<void> {
    // WebSocket initialization would go here
    this.logger.info(`WebSocket connection initialized: ${connection.id}`);
  }

  private async initializeSSE(connection: RealtimeConnection): Promise<void> {
    // Server-Sent Events initialization would go here
    this.logger.info(`SSE connection initialized: ${connection.id}`);
  }

  private async initializeLongPolling(connection: RealtimeConnection): Promise<void> {
    // Long polling initialization would go here
    this.logger.info(`Long polling connection initialized: ${connection.id}`);
  }

  private async sendToConnection(connection: RealtimeConnection, update: StateUpdate): Promise<void> {
    try {
      const message = JSON.stringify(update);
      
      switch (connection.type) {
        case 'websocket':
          // Send via WebSocket
          break;
        case 'sse':
          // Send via SSE
          break;
        case 'longpoll':
          // Queue for long poll response
          break;
      }

      connection.lastActivity = Date.now();
    } catch (error) {
      this.logger.error(`Error sending to connection ${connection.id}:`, error);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.checkConnectionHealth();
      this.cleanupExpiredSnapshots();
      this.cleanupOldTransactions();
    }, this.config.heartbeatInterval!);
  }

  private checkConnectionHealth(): void {
    const now = Date.now();
    const timeout = this.config.heartbeatInterval! * 2;

    for (const [id, connection] of this.connections) {
      if (now - connection.lastActivity > timeout) {
        connection.status = 'disconnected';
        this.emit('connection:lost', { connectionId: id });
      }
    }
  }

  private cleanupExpiredSnapshots(): void {
    const now = Date.now();

    for (const [channelId, snapshots] of this.snapshots) {
      const validSnapshots = snapshots.filter(s => 
        !s.metadata.expiresAt || s.metadata.expiresAt > now
      );
      
      if (validSnapshots.length !== snapshots.length) {
        this.snapshots.set(channelId, validSnapshots);
      }
    }
  }

  private cleanupOldTransactions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [id, transaction] of this.transactions) {
      if (transaction.status !== 'pending' && 
          transaction.metadata.endTime && 
          now - transaction.metadata.endTime > maxAge) {
        this.transactions.delete(id);
      }
    }
  }

  private calculateChecksum(data: any): string {
    // Simple checksum calculation - would use proper hashing in production
    return JSON.stringify(data).length.toString(16);
  }

  private getValueAtPath(obj: any, path: string): any {
    if (!path) return obj;
    
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
    if (!path) {
      Object.assign(obj, value);
      return;
    }

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

  private deleteValueAtPath(obj: any, path: string): void {
    if (!path) return;

    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        return;
      }
      current = current[part];
    }
    
    delete current[parts[parts.length - 1]];
  }

  private handleStateSync(event: any): void {
    // Handle state synchronizer events
    this.logger.info('State sync event:', event);
  }

  private handleBridgeSync(event: any): void {
    // Handle workflow-UI bridge events
    this.logger.info('Bridge sync event:', event);
  }

  private generateChannelId(name: string, type: string): string {
    return `${type}:${name}`;
  }

  private generateUpdateId(): string {
    return `update:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSnapshotId(): string {
    return `snap:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransactionId(): string {
    return `tx:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConnectionId(): string {
    return `conn:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.removeAllListeners();
    this.channels.clear();
    this.subscriptions.clear();
    this.connections.clear();
    this.snapshots.clear();
    this.transactions.clear();
    this.updateBuffer.clear();
  }
}

// Helper class for metrics collection
class MetricsCollector {
  private updateCount = 0;
  private latencies: number[] = [];
  private updateTimestamps: number[] = [];

  recordUpdate(channelId: string, update: StateUpdate): void {
    this.updateCount++;
    this.updateTimestamps.push(update.timestamp);
    
    // Keep only last 1000 timestamps
    if (this.updateTimestamps.length > 1000) {
      this.updateTimestamps.shift();
    }
  }

  recordLatency(latency: number): void {
    this.latencies.push(latency);
    
    // Keep only last 1000 latencies
    if (this.latencies.length > 1000) {
      this.latencies.shift();
    }
  }

  getUpdateRate(): number {
    if (this.updateTimestamps.length < 2) return 0;
    
    const duration = this.updateTimestamps[this.updateTimestamps.length - 1] - this.updateTimestamps[0];
    return (this.updateTimestamps.length / duration) * 1000; // Updates per second
  }

  getAverageLatency(): number {
    if (this.latencies.length === 0) return 0;
    
    const sum = this.latencies.reduce((a, b) => a + b, 0);
    return sum / this.latencies.length;
  }

  getMemoryUsage(): number {
    // Simplified memory usage calculation
    return process.memoryUsage().heapUsed / 1024 / 1024; // MB
  }
}

// Singleton instance
let managerInstance: RealtimeStateManager | null = null;

export function getRealtimeStateManager(
  config?: RealtimeStateConfig
): RealtimeStateManager {
  if (!managerInstance) {
    managerInstance = new RealtimeStateManager(config);
  }
  return managerInstance;
}

// Factory function
export function createRealtimeStateManager(
  config?: RealtimeStateConfig,
  stateSynchronizer?: StateSynchronizer,
  workflowUIBridge?: WorkflowUIBridge
): RealtimeStateManager {
  return new RealtimeStateManager(config, stateSynchronizer, workflowUIBridge);
}