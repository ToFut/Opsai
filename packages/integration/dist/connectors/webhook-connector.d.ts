import WebSocket from 'ws';
import { BaseConnector } from './base-connector';
import { ConnectorConfig, WebhookEvent } from '../types';
export declare class WebhookConnector extends BaseConnector {
    private webhookConfig?;
    private eventEmitter;
    private webSocketConnections;
    private eventQueue;
    private isProcessing;
    constructor(config: ConnectorConfig);
    initialize(): Promise<void>;
    testConnection(): Promise<boolean>;
    sendWebhook(payload: any, options?: {
        url?: string;
        headers?: Record<string, string>;
        secret?: string;
    }): Promise<any>;
    receiveWebhook(payload: any, headers: Record<string, string>, signature?: string): Promise<WebhookEvent>;
    processWebhookEvent(event: WebhookEvent): Promise<void>;
    setupWebSocketConnection(url: string, protocols?: string[]): WebSocket;
    sendWebSocketMessage(connectionId: string, message: any): void;
    broadcastWebSocketMessage(message: any): void;
    onWebhookReceived(callback: (event: WebhookEvent) => void): void;
    onWebhookProcessed(callback: (event: WebhookEvent) => void): void;
    onWebSocketMessage(callback: (event: WebhookEvent) => void): void;
    private generateSignature;
    private verifySignature;
    private startEventProcessor;
    executeRequest(endpoint: string, method: string, data?: any): Promise<any>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=webhook-connector.d.ts.map