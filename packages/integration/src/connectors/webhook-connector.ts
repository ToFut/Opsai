import * as crypto from 'crypto';
import WebSocket from 'ws';
import { BaseConnector } from './base-connector';
import { ConnectorConfig, WebhookConfig, WebhookEvent } from '../types';
import { IntegrationError } from '../errors';
import { EventEmitter } from 'events';

export class WebhookConnector extends BaseConnector {
  private webhookConfig?: WebhookConfig;
  private eventEmitter: EventEmitter;
  private webSocketConnections: Map<string, WebSocket> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private isProcessing = false;

  constructor(config: ConnectorConfig) {
    super(config);
    this.eventEmitter = new EventEmitter();
    // Webhook config would be passed separately or embedded in config
  }

  async initialize(): Promise<void> {
    console.log('Webhook connector initialized');
    // Setup event processing
    this.startEventProcessor();
  }

  async testConnection(): Promise<boolean> {
    // For webhooks, we can test by checking if we can reach the webhook URL
    if (!this.webhookConfig?.url) {
      return false;
    }

    try {
      // Send a test ping
      const testPayload = {
        type: 'test',
        timestamp: new Date().toISOString(),
        data: { message: 'Connection test' }
      };

      await this.sendWebhook(testPayload);
      return true;
    } catch (error) {
      console.error('Webhook connection test failed:', error);
      return false;
    }
  }

  async sendWebhook(payload: any, options?: {
    url?: string;
    headers?: Record<string, string>;
    secret?: string;
  }): Promise<any> {
    const webhookUrl = options?.url || this.webhookConfig?.url;
    if (!webhookUrl) {
      throw new IntegrationError('Webhook URL not configured');
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'OPSAI-Webhook/1.0',
        ...(this.webhookConfig?.headers || {}),
        ...(options?.headers || {})
      };

      // Add signature if secret is provided
      const secret = options?.secret || this.webhookConfig?.secret;
      if (secret) {
        const signature = this.generateSignature(payload, secret);
        headers['X-Hub-Signature-256'] = signature;
      }

      // Add timestamp
      headers['X-Timestamp'] = Date.now().toString();

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new IntegrationError(
          `Webhook delivery failed: ${response.status} ${response.statusText}`,
          'WEBHOOK_DELIVERY_FAILED'
        );
      }

      const responseText = await response.text();
      
      return {
        success: true,
        status: response.status,
        response: responseText,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      console.error('[Webhook] Delivery failed:', error);
      
      if (error instanceof IntegrationError) {
        throw error;
      }
      
      throw new IntegrationError('Webhook delivery failed', 'WEBHOOK_FAILED', error);
    }
  }

  async receiveWebhook(
    payload: any, 
    headers: Record<string, string>,
    signature?: string
  ): Promise<WebhookEvent> {
    // Verify signature if secret is configured
    if (this.webhookConfig?.secret && signature) {
      if (!this.verifySignature(payload, signature, this.webhookConfig.secret)) {
        throw new IntegrationError('Invalid webhook signature', 'INVALID_SIGNATURE');
      }
    }

    // Create webhook event
    const event: WebhookEvent = {
      id: crypto.randomUUID(),
      integrationId: this.config.name,
      eventType: payload.type || 'unknown',
      payload,
      receivedAt: new Date(),
      status: 'pending'
    };

    // Add to processing queue
    this.eventQueue.push(event);
    
    // Emit event for listeners
    this.eventEmitter.emit('webhook_received', event);
    
    return event;
  }

  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      console.log(`[Webhook] Processing event ${event.id} of type ${event.eventType}`);
      
      // Update status
      event.status = 'processed';
      event.processedAt = new Date();
      
      // Emit processed event
      this.eventEmitter.emit('webhook_processed', event);
      
    } catch (error) {
      console.error(`[Webhook] Failed to process event ${event.id}:`, error);
      
      event.status = 'failed';
      event.error = error instanceof Error ? error.message : String(error);
      
      this.eventEmitter.emit('webhook_failed', event);
    }
  }

  setupWebSocketConnection(url: string, protocols?: string[]): WebSocket {
    const ws = new WebSocket(url, protocols);
    const connectionId = crypto.randomUUID();
    
    ws.on('open', () => {
      console.log(`[WebSocket] Connected to ${url}`);
      this.webSocketConnections.set(connectionId, ws);
    });
    
    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        const event: WebhookEvent = {
          id: crypto.randomUUID(),
          integrationId: this.config.name,
          eventType: payload.type || 'websocket_message',
          payload,
          receivedAt: new Date(),
          status: 'pending'
        };
        
        this.eventQueue.push(event);
        this.eventEmitter.emit('websocket_message', event);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`[WebSocket] Error on connection ${connectionId}:`, error);
    });
    
    ws.on('close', () => {
      console.log(`[WebSocket] Connection ${connectionId} closed`);
      this.webSocketConnections.delete(connectionId);
    });
    
    return ws;
  }

  sendWebSocketMessage(connectionId: string, message: any): void {
    const ws = this.webSocketConnections.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new IntegrationError('WebSocket connection not available');
    }
    
    ws.send(JSON.stringify(message));
  }

  broadcastWebSocketMessage(message: any): void {
    const activeConnections = Array.from(this.webSocketConnections.values())
      .filter(ws => ws.readyState === WebSocket.OPEN);
    
    activeConnections.forEach(ws => {
      ws.send(JSON.stringify(message));
    });
  }

  onWebhookReceived(callback: (event: WebhookEvent) => void): void {
    this.eventEmitter.on('webhook_received', callback);
  }

  onWebhookProcessed(callback: (event: WebhookEvent) => void): void {
    this.eventEmitter.on('webhook_processed', callback);
  }

  onWebSocketMessage(callback: (event: WebhookEvent) => void): void {
    this.eventEmitter.on('websocket_message', callback);
  }

  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  private verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  private startEventProcessor(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    const processNext = async () => {
      if (this.eventQueue.length === 0) {
        setTimeout(processNext, 100); // Check again in 100ms
        return;
      }
      
      const event = this.eventQueue.shift();
      if (event) {
        await this.processWebhookEvent(event);
      }
      
      // Continue processing
      setTimeout(processNext, 10);
    };
    
    processNext();
  }

  async executeRequest(endpoint: string, method: string, data?: any): Promise<any> {
    // For webhooks, this would typically send a webhook
    return await this.sendWebhook({
      endpoint,
      method,
      data,
      timestamp: new Date().toISOString()
    });
  }

  async dispose(): Promise<void> {
    // Close all WebSocket connections
    for (const ws of this.webSocketConnections.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    this.webSocketConnections.clear();
    
    // Stop event processing
    this.isProcessing = false;
    
    // Remove all listeners
    this.eventEmitter.removeAllListeners();
  }
} 