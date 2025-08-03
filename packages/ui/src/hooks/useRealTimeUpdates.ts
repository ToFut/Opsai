import { useEffect, useCallback, useRef } from 'react';
import { wsManager } from './useIntelligentState';

interface RealTimeConfig {
  channels: string[];
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface RealTimeMessage {
  type: string;
  channel: string;
  data: any;
  timestamp: Date;
  id: string;
}

export const useRealTimeUpdates = (config?: RealTimeConfig) => {
  const subscriptions = useRef<Map<string, Set<(message: any) => void>>>(new Map());
  
  const subscribe = useCallback((channel: string, callback: (message: any) => void) => {
    if (!subscriptions.current.has(channel)) {
      subscriptions.current.set(channel, new Set());
    }
    subscriptions.current.get(channel)!.add(callback);
    
    // Subscribe to WebSocket messages for this channel
    const handleMessage = (wsMessage: any) => {
      if (wsMessage.channel === channel || wsMessage.type === channel) {
        callback(wsMessage.data || wsMessage);
      }
    };
    
    wsManager.subscribe(channel, handleMessage);
    
    return () => {
      subscriptions.current.get(channel)?.delete(callback);
      wsManager.unsubscribe(channel, handleMessage);
    };
  }, []);
  
  const unsubscribe = useCallback((channel: string, callback: (message: any) => void) => {
    subscriptions.current.get(channel)?.delete(callback);
  }, []);
  
  const publish = useCallback((channel: string, data: any) => {
    const message = {
      type: 'realtime-update',
      storeId: channel,
      data,
      metadata: {
        version: 1,
        lastUpdated: new Date(),
        source: 'client'
      }
    };
    
    wsManager.send(message);
  }, []);
  
  // Auto-connect WebSocket
  useEffect(() => {
    wsManager.connect();
    
    return () => {
      // Clean up subscriptions
      subscriptions.current.clear();
    };
  }, []);
  
  return {
    subscribe,
    unsubscribe,
    publish,
    isConnected: () => wsManager !== null
  };
};