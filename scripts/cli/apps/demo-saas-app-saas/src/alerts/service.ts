import { AlertService } from '@opsai/alerts';
import { alertRules } from './rules';
import { emailTemplates } from './templates';

class AppAlertService {
  private alertService: AlertService;

  constructor() {
    this.alertService = new AlertService();
  }

  async initialize(): Promise<void> {
    // Initialize the alert service
    await this.alertService.initialize();

    // Register alert rules
    for (const rule of alertRules) {
      await this.alertService.createRule(rule);
    }

    // Register email templates
    for (const [name, template] of Object.entries(emailTemplates)) {
      await this.alertService.registerTemplate(name, template);
    }

    console.log(`Alert service initialized with ${alertRules.length} rules`);
  }

  async evaluateAlerts(data: any, context: any = {}): Promise<void> {
    await this.alertService.evaluateRules(data, context);
  }

  async testAlert(ruleName: string, testData: any): Promise<void> {
    const rule = alertRules.find(r => r.name === ruleName);
    if (!rule) {
      throw new Error(\`Alert rule '\${ruleName}' not found\`);
    }

    await this.alertService.testRule(rule, testData);
  }

  async getAlertHistory(limit: number = 100): Promise<any[]> {
    return this.alertService.getAlertHistory(limit);
  }

  async getAlertMetrics(): Promise<any> {
    return this.alertService.getMetrics();
  }
}

export const appAlertService = new AppAlertService();
export { AppAlertService };
