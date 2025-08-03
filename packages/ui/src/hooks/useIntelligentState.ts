import { useState, useEffect, useCallback, useRef } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware/persist';

// Types
interface IntelligentStateConfig {
  storeId: string;
  realTime: boolean;
  persistent: boolean;
  optimistic: boolean;
  conflictResolution: 'latest-wins' | 'merge' | 'manual';
  syncInterval?: number;
  maxRetries?: number;
}

interface StateMetadata {
  version: number;
  lastUpdated: Date;
  source: 'local' | 'remote' | 'sync';
  conflicts?: StateConflict[];
  predictions?: StatePrediction[];
}

interface StateConflict {
  id: string;
  field: string;
  localValue: any;
  remoteValue: any;
  timestamp: Date;
  resolved: boolean;
}

interface StatePrediction {
  field: string;
  predictedValue: any;
  confidence: number;
  reasoning: string;
  timestamp: Date;
}

interface WebSocketMessage {
  type: 'state-update' | 'state-sync' | 'state-conflict' | 'prediction';
  storeId: string;
  data: any;
  metadata: StateMetadata;
}

// Real-time WebSocket manager
class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(message: WebSocketMessage) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      this.connect();
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  private handleMessage(message: WebSocketMessage) {
    const subscribers = this.subscribers.get(message.storeId);
    if (subscribers) {
      subscribers.forEach(callback => callback(message));
    }
  }

  subscribe(storeId: string, callback: (message: WebSocketMessage) => void) {
    if (!this.subscribers.has(storeId)) {
      this.subscribers.set(storeId, new Set());
    }
    this.subscribers.get(storeId)!.add(callback);
  }

  unsubscribe(storeId: string, callback: (message: WebSocketMessage) => void) {
    const subscribers = this.subscribers.get(storeId);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(storeId);
      }
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Intelligent State Store Creator
export function createIntelligentStore<T extends Record<string, any>>(
  config: IntelligentStateConfig,
  initialState: T,
  actions?: (set: any, get: any) => Record<string, any>
) {
  const wsManager = WebSocketManager.getInstance();
  
  const middleware = [];

  // Add persistence middleware if configured
  if (config.persistent) {
    middleware.push(
      persist(
        (set, get) => ({
          ...initialState,
          ...actions?.(set, get),
          _metadata: {
            version: 1,
            lastUpdated: new Date(),
            source: 'local',
            conflicts: [],
            predictions: []
          } as StateMetadata
        }),
        {
          name: `intelligent-store-${config.storeId}`,
          version: 1
        }
      )
    );
  }

  // Add immer middleware for immutable updates
  middleware.push(immer);

  // Add subscription middleware for fine-grained updates
  middleware.push(subscribeWithSelector);

  // Create the store
  const useStore = create<T & { _metadata: StateMetadata }>()(
    // @ts-ignore - Middleware types are complex
    ...middleware,
    (set, get) => ({
      ...initialState,
      ...actions?.(set, get),
      _metadata: {
        version: 1,
        lastUpdated: new Date(),
        source: 'local',
        conflicts: [],
        predictions: []
      } as StateMetadata,

      // Enhanced update method with real-time sync
      updateState: (updates: Partial<T>, options?: { optimistic?: boolean; source?: string }) => {
        set((state: any) => {
          // Update the state
          Object.assign(state, updates);
          
          // Update metadata
          state._metadata = {
            ...state._metadata,
            version: state._metadata.version + 1,
            lastUpdated: new Date(),
            source: options?.source || 'local'
          };

          // Send real-time update if configured
          if (config.realTime) {
            wsManager.send({
              type: 'state-update',
              storeId: config.storeId,
              data: updates,
              metadata: state._metadata
            });
          }
        });
      },

      // Sync with remote state
      syncState: async () => {
        try {
          const response = await fetch(`/api/state/${config.storeId}`);
          const remoteState = await response.json();
          
          set((state: any) => {
            // Merge remote state with conflict detection
            const conflicts = detectConflicts(state, remoteState);
            
            if (conflicts.length > 0) {
              state._metadata.conflicts = conflicts;
              
              // Handle conflicts based on resolution strategy
              switch (config.conflictResolution) {
                case 'latest-wins':
                  Object.assign(state, remoteState.data);
                  break;
                case 'merge':
                  mergeStates(state, remoteState.data);
                  break;
                case 'manual':
                  // Leave conflicts for manual resolution
                  break;
              }
            } else {
              Object.assign(state, remoteState.data);
            }
            
            state._metadata = {
              ...state._metadata,
              version: Math.max(state._metadata.version, remoteState.metadata.version),
              lastUpdated: new Date(),
              source: 'sync'
            };
          });
        } catch (error) {
          console.error('Error syncing state:', error);
        }
      },

      // Resolve conflicts manually
      resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'custom', customValue?: any) => {
        set((state: any) => {
          const conflict = state._metadata.conflicts.find((c: StateConflict) => c.id === conflictId);
          if (conflict) {
            switch (resolution) {
              case 'local':
                // Keep local value, mark as resolved
                break;
              case 'remote':
                state[conflict.field] = conflict.remoteValue;
                break;
              case 'custom':
                if (customValue !== undefined) {
                  state[conflict.field] = customValue;
                }
                break;
            }
            
            conflict.resolved = true;
            state._metadata.conflicts = state._metadata.conflicts.filter(
              (c: StateConflict) => c.id !== conflictId || c.resolved
            );
          }
        });
      },

      // Add prediction
      addPrediction: (prediction: StatePrediction) => {
        set((state: any) => {
          state._metadata.predictions = state._metadata.predictions || [];
          state._metadata.predictions.push(prediction);
        });
      },

      // Apply prediction
      applyPrediction: (predictionId: string) => {
        set((state: any) => {
          const prediction = state._metadata.predictions.find(
            (p: StatePrediction) => p.field === predictionId
          );
          if (prediction) {
            state[prediction.field] = prediction.predictedValue;
            state._metadata.predictions = state._metadata.predictions.filter(
              (p: StatePrediction) => p.field !== predictionId
            );
          }
        });
      }
    })
  );

  // Set up real-time subscriptions
  if (config.realTime) {
    wsManager.connect();
    
    const handleWebSocketMessage = (message: WebSocketMessage) => {
      if (message.storeId === config.storeId) {
        const store = useStore.getState();
        
        switch (message.type) {
          case 'state-update':
            (store as any).updateState(message.data, { source: 'remote' });
            break;
          case 'state-sync':
            (store as any).syncState();
            break;
          case 'state-conflict':
            set((state: any) => {
              state._metadata.conflicts.push(message.data);
            });
            break;
          case 'prediction':
            (store as any).addPrediction(message.data);
            break;
        }
      }
    };

    wsManager.subscribe(config.storeId, handleWebSocketMessage);
  }

  return useStore;
}

// Hook for using intelligent state
export function useIntelligentState<T>(
  storeId: string,
  initialState: T,
  config?: Partial<IntelligentStateConfig>
) {
  const fullConfig: IntelligentStateConfig = {
    storeId,
    realTime: true,
    persistent: true,
    optimistic: true,
    conflictResolution: 'latest-wins',
    syncInterval: 5000,
    maxRetries: 3,
    ...config
  };

  // Create or get existing store
  const [store] = useState(() => 
    createIntelligentStore(fullConfig, initialState)
  );

  const state = store();
  const wsManager = WebSocketManager.getInstance();

  // Predictive state updates
  const predictNextState = useCallback(async (currentState: T, userAction: string) => {
    try {
      const response = await fetch('/api/ai/predict-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentState,
          userAction,
          storeId,
          context: {
            timestamp: new Date(),
            userRole: getCurrentUserRole(),
            businessContext: getBusinessContext()
          }
        })
      });

      const prediction = await response.json();
      
      if (prediction.confidence > 0.7) {
        (state as any).addPrediction({
          field: prediction.field,
          predictedValue: prediction.value,
          confidence: prediction.confidence,
          reasoning: prediction.reasoning,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error predicting state:', error);
    }
  }, [state, storeId]);

  // Auto-sync with configurable interval
  useEffect(() => {
    if (!fullConfig.realTime) return;

    const interval = setInterval(() => {
      (state as any).syncState?.();
    }, fullConfig.syncInterval);

    return () => clearInterval(interval);
  }, [fullConfig.realTime, fullConfig.syncInterval, state]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect as other components might be using it
      // wsManager.disconnect();
    };
  }, []);

  return {
    state: state as T,
    updateState: (state as any).updateState,
    syncState: (state as any).syncState,
    resolveConflict: (state as any).resolveConflict,
    predictNextState,
    metadata: (state as any)._metadata,
    conflicts: (state as any)._metadata?.conflicts || [],
    predictions: (state as any)._metadata?.predictions || []
  };
}

// Helper functions
function detectConflicts<T>(localState: T, remoteState: { data: T; metadata: StateMetadata }): StateConflict[] {
  const conflicts: StateConflict[] = [];
  
  for (const [key, localValue] of Object.entries(localState)) {
    if (key === '_metadata') continue;
    
    const remoteValue = (remoteState.data as any)[key];
    
    if (localValue !== remoteValue && remoteValue !== undefined) {
      conflicts.push({
        id: `${key}-${Date.now()}`,
        field: key,
        localValue,
        remoteValue,
        timestamp: new Date(),
        resolved: false
      });
    }
  }
  
  return conflicts;
}

function mergeStates<T>(localState: T, remoteState: T): void {
  // Simple merge strategy - can be enhanced
  for (const [key, remoteValue] of Object.entries(remoteState)) {
    if (key === '_metadata') continue;
    
    if ((localState as any)[key] === undefined) {
      (localState as any)[key] = remoteValue;
    }
  }
}

function getCurrentUserRole(): string {
  // Get current user role from auth context
  return 'user'; // Placeholder
}

function getBusinessContext(): any {
  // Get current business context
  return {}; // Placeholder
}

// Export singleton instance
export const wsManager = WebSocketManager.getInstance();