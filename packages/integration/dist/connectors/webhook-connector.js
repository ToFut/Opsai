"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookConnector = void 0;
const crypto = __importStar(require("crypto"));
const ws_1 = __importDefault(require("ws"));
const base_connector_1 = require("./base-connector");
const errors_1 = require("../errors");
const events_1 = require("events");
class WebhookConnector extends base_connector_1.BaseConnector {
    constructor(config) {
        super(config);
        this.webSocketConnections = new Map();
        this.eventQueue = [];
        this.isProcessing = false;
        this.eventEmitter = new events_1.EventEmitter();
        // Webhook config would be passed separately or embedded in config
    }
    async initialize() {
        console.log('Webhook connector initialized');
        // Setup event processing
        this.startEventProcessor();
    }
    async testConnection() {
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
        }
        catch (error) {
            console.error('Webhook connection test failed:', error);
            return false;
        }
    }
    async sendWebhook(payload, options) {
        const webhookUrl = options?.url || this.webhookConfig?.url;
        if (!webhookUrl) {
            throw new errors_1.IntegrationError('Webhook URL not configured');
        }
        try {
            const headers = {
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
                throw new errors_1.IntegrationError(`Webhook delivery failed: ${response.status} ${response.statusText}`, 'WEBHOOK_DELIVERY_FAILED');
            }
            const responseText = await response.text();
            return {
                success: true,
                status: response.status,
                response: responseText,
                headers: Object.fromEntries(response.headers.entries())
            };
        }
        catch (error) {
            console.error('[Webhook] Delivery failed:', error);
            if (error instanceof errors_1.IntegrationError) {
                throw error;
            }
            throw new errors_1.IntegrationError('Webhook delivery failed', 'WEBHOOK_FAILED', error);
        }
    }
    async receiveWebhook(payload, headers, signature) {
        // Verify signature if secret is configured
        if (this.webhookConfig?.secret && signature) {
            if (!this.verifySignature(payload, signature, this.webhookConfig.secret)) {
                throw new errors_1.IntegrationError('Invalid webhook signature', 'INVALID_SIGNATURE');
            }
        }
        // Create webhook event
        const event = {
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
    async processWebhookEvent(event) {
        try {
            console.log(`[Webhook] Processing event ${event.id} of type ${event.eventType}`);
            // Update status
            event.status = 'processed';
            event.processedAt = new Date();
            // Emit processed event
            this.eventEmitter.emit('webhook_processed', event);
        }
        catch (error) {
            console.error(`[Webhook] Failed to process event ${event.id}:`, error);
            event.status = 'failed';
            event.error = error instanceof Error ? error.message : String(error);
            this.eventEmitter.emit('webhook_failed', event);
        }
    }
    setupWebSocketConnection(url, protocols) {
        const ws = new ws_1.default(url, protocols);
        const connectionId = crypto.randomUUID();
        ws.on('open', () => {
            console.log(`[WebSocket] Connected to ${url}`);
            this.webSocketConnections.set(connectionId, ws);
        });
        ws.on('message', (data) => {
            try {
                const payload = JSON.parse(data.toString());
                const event = {
                    id: crypto.randomUUID(),
                    integrationId: this.config.name,
                    eventType: payload.type || 'websocket_message',
                    payload,
                    receivedAt: new Date(),
                    status: 'pending'
                };
                this.eventQueue.push(event);
                this.eventEmitter.emit('websocket_message', event);
            }
            catch (error) {
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
    sendWebSocketMessage(connectionId, message) {
        const ws = this.webSocketConnections.get(connectionId);
        if (!ws || ws.readyState !== ws_1.default.OPEN) {
            throw new errors_1.IntegrationError('WebSocket connection not available');
        }
        ws.send(JSON.stringify(message));
    }
    broadcastWebSocketMessage(message) {
        const activeConnections = Array.from(this.webSocketConnections.values())
            .filter(ws => ws.readyState === ws_1.default.OPEN);
        activeConnections.forEach(ws => {
            ws.send(JSON.stringify(message));
        });
    }
    onWebhookReceived(callback) {
        this.eventEmitter.on('webhook_received', callback);
    }
    onWebhookProcessed(callback) {
        this.eventEmitter.on('webhook_processed', callback);
    }
    onWebSocketMessage(callback) {
        this.eventEmitter.on('websocket_message', callback);
    }
    generateSignature(payload, secret) {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        return `sha256=${hmac.digest('hex')}`;
    }
    verifySignature(payload, signature, secret) {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    startEventProcessor() {
        if (this.isProcessing)
            return;
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
    async executeRequest(endpoint, method, data) {
        // For webhooks, this would typically send a webhook
        return await this.sendWebhook({
            endpoint,
            method,
            data,
            timestamp: new Date().toISOString()
        });
    }
    async dispose() {
        // Close all WebSocket connections
        for (const ws of this.webSocketConnections.values()) {
            if (ws.readyState === ws_1.default.OPEN) {
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
exports.WebhookConnector = WebhookConnector;
//# sourceMappingURL=webhook-connector.js.map