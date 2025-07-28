import { BaseActivity } from './base-activity';
interface NotificationActivityInput {
    type: 'email' | 'sms' | 'push' | 'webhook' | 'slack';
    recipients: string[];
    subject?: string;
    message: string;
    template?: string;
    templateData?: Record<string, any>;
    webhook?: {
        url: string;
        headers?: Record<string, string>;
    };
    slack?: {
        channel: string;
        username?: string;
        iconEmoji?: string;
    };
    tenantId: string;
}
export declare class NotificationActivity extends BaseActivity {
    execute(input: NotificationActivityInput): Promise<any>;
    /**
     * Send email notification
     */
    private sendEmail;
    /**
     * Send SMS notification
     */
    private sendSMS;
    /**
     * Send push notification
     */
    private sendPushNotification;
    /**
     * Send webhook notification
     */
    private sendWebhook;
    /**
     * Send Slack message
     */
    private sendSlackMessage;
    /**
     * Apply template to message
     */
    private applyTemplate;
    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue;
    /**
     * Sleep utility
     */
    private sleep;
}
export {};
//# sourceMappingURL=notification-activity.d.ts.map