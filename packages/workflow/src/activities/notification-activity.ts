import { Context } from '@temporalio/activity';
import { BaseActivity } from './base-activity';
import { ActivityError } from '../errors';

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

export class NotificationActivity extends BaseActivity {
  async execute(input: NotificationActivityInput): Promise<any> {
    const context = Context.current();
    const { type, recipients, subject, message, template, templateData, tenantId } = input;
    
    try {
      console.log(`[Notification Activity] Sending ${type} notification to ${recipients.length} recipients`);
      
      context.heartbeat('Processing notification');
      
      let processedMessage = message;
      let processedSubject = subject;
      
      // Apply template if provided
      if (template && templateData) {
        processedMessage = this.applyTemplate(template, templateData);
        if (subject) {
          processedSubject = this.applyTemplate(subject, templateData);
        }
      }
      
      const results = [];
      
      // Send notification to each recipient
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        
        context.heartbeat(`Sending to recipient ${i + 1} of ${recipients.length}`);
        
        try {
          let result;
          
          switch (type) {
            case 'email':
              result = await this.sendEmail({
                to: recipient || '',
                subject: processedSubject || 'Notification',
                message: processedMessage,
                tenantId
              });
              break;
              
            case 'sms':
              result = await this.sendSMS({
                to: recipient || '',
                message: processedMessage,
                tenantId
              });
              break;
              
            case 'push':
              result = await this.sendPushNotification({
                to: recipient || '',
                title: processedSubject || 'Notification',
                message: processedMessage,
                tenantId
              });
              break;
              
            case 'webhook':
              if (!input.webhook?.url) {
                throw new ActivityError('Webhook URL is required for webhook notifications');
              }
              result = await this.sendWebhook({
                url: input.webhook.url,
                ...(input.webhook.headers && { headers: input.webhook.headers }),
                payload: {
                  recipient: recipient || '',
                  subject: processedSubject || '',
                  message: processedMessage,
                  timestamp: new Date().toISOString(),
                  tenantId
                }
              });
              break;
              
            case 'slack':
              if (!input.slack?.channel) {
                throw new ActivityError('Slack channel is required for Slack notifications');
              }
              result = await this.sendSlackMessage({
                channel: input.slack.channel,
                message: processedMessage,
                ...(input.slack.username && { username: input.slack.username }),
                ...(input.slack.iconEmoji && { iconEmoji: input.slack.iconEmoji }),
                tenantId
              });
              break;
              
            default:
              throw new ActivityError(`Unsupported notification type: ${type}`);
          }
          
          results.push({
            recipient,
            success: true,
            messageId: result.messageId,
            details: result.details
          });
          
        } catch (error) {
          console.error(`[Notification Activity] Failed to send to ${recipient}:`, error);
          
          results.push({
            recipient,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      return {
        success: failureCount === 0,
        type,
        results,
        summary: {
          total: recipients.length,
          successful: successCount,
          failed: failureCount
        }
      };
      
    } catch (error) {
      console.error(`[Notification Activity] Error sending ${type} notifications:`, error);
      
      if (error instanceof ActivityError) {
        throw error;
      }
      
      throw new ActivityError(
        `Notification activity failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          type,
          recipientCount: recipients.length,
          originalError: error
        }
      );
    }
  }
  
  /**
   * Send email notification
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    message: string;
    tenantId: string;
  }): Promise<any> {
    // In a real implementation, this would use a service like SendGrid, AWS SES, etc.
    console.log(`[Email] Sending to ${params.to}: ${params.subject}`);
    
    // Simulate email sending
    await this.sleep(100);
    
    return {
      messageId: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      details: {
        provider: 'mock',
        to: params.to,
        subject: params.subject
      }
    };
  }
  
  /**
   * Send SMS notification
   */
  private async sendSMS(params: {
    to: string;
    message: string;
    tenantId: string;
  }): Promise<any> {
    // In a real implementation, this would use a service like Twilio, AWS SNS, etc.
    console.log(`[SMS] Sending to ${params.to}: ${params.message.substring(0, 50)}...`);
    
    // Validate phone number format (basic validation)
    if (!/^\+?[1-9]\d{1,14}$/.test(params.to.replace(/[\s-()]/g, ''))) {
      throw new ActivityError('Invalid phone number format');
    }
    
    // Simulate SMS sending
    await this.sleep(200);
    
    return {
      messageId: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      details: {
        provider: 'mock',
        to: params.to,
        messageLength: params.message.length
      }
    };
  }
  
  /**
   * Send push notification
   */
  private async sendPushNotification(params: {
    to: string;
    title: string;
    message: string;
    tenantId: string;
  }): Promise<any> {
    // In a real implementation, this would use FCM, APNs, etc.
    console.log(`[Push] Sending to ${params.to}: ${params.title}`);
    
    // Simulate push notification sending
    await this.sleep(150);
    
    return {
      messageId: `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      details: {
        provider: 'mock',
        deviceToken: params.to,
        title: params.title
      }
    };
  }
  
  /**
   * Send webhook notification
   */
  private async sendWebhook(params: {
    url: string;
    headers?: Record<string, string>;
    payload: any;
  }): Promise<any> {
    console.log(`[Webhook] Sending to ${params.url}`);
    
    try {
      // Use fetch to send webhook
      const response = await fetch(params.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OPSAI-Workflow/1.0',
          ...params.headers
        },
        body: JSON.stringify(params.payload)
      });
      
      if (!response.ok) {
        throw new ActivityError(`Webhook failed with status ${response.status}: ${response.statusText}`);
      }
      
      return {
        messageId: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        details: {
          url: params.url,
          status: response.status,
          statusText: response.statusText
        }
      };
      
    } catch (error) {
      throw new ActivityError(
        `Webhook delivery failed: ${error instanceof Error ? error.message : String(error)}`,
        { url: params.url, originalError: error }
      );
    }
  }
  
  /**
   * Send Slack message
   */
  private async sendSlackMessage(params: {
    channel: string;
    message: string;
    username?: string;
    iconEmoji?: string;
    tenantId: string;
  }): Promise<any> {
    // In a real implementation, this would use the Slack Web API
    console.log(`[Slack] Sending to ${params.channel}: ${params.message.substring(0, 50)}...`);
    
    // Simulate Slack message sending
    await this.sleep(300);
    
    return {
      messageId: `slack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      details: {
        provider: 'mock',
        channel: params.channel,
        username: params.username || 'OPSAI Workflow'
      }
    };
  }
  
  /**
   * Apply template to message
   */
  private applyTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(data, key.trim());
      return value !== undefined ? String(value) : match;
    });
  }
  
  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
  
  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 