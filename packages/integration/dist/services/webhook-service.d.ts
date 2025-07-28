import { WebhookEvent } from '../types';
export declare class WebhookService {
    /**
     * Process incoming webhook
     */
    processWebhook(integrationId: string, eventType: string, payload: any): Promise<WebhookEvent>;
    /**
     * Register webhook endpoint
     */
    registerWebhook(integrationId: string, url: string, _events: string[]): Promise<void>;
    /**
     * Unregister webhook endpoint
     */
    unregisterWebhook(integrationId: string): Promise<void>;
}
//# sourceMappingURL=webhook-service.d.ts.map