import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from './ConfigParser';

export interface AlertRule {
  name: string;
  description: string;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldown?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  enabled?: boolean;
}

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
  data_source?: string;
}

export interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'workflow' | 'sms';
  template?: string;
  to?: string | string[];
  channel?: string;
  url?: string;
  workflow?: string;
}

export class AlertGenerator {
  private config: AppConfig;
  private alertConfig: any;

  constructor(config: AppConfig) {
    this.config = config;
    this.alertConfig = config.alerts || {};
  }

  async generateAlerts(outputDir: string): Promise<void> {
    const alertDir = path.join(outputDir, 'src', 'alerts');
    fs.mkdirSync(alertDir, { recursive: true });

    // Generate alert rules configuration
    await this.generateAlertRules(alertDir);

    // Generate alert service initialization
    await this.generateAlertService(alertDir);

    // Generate alert templates
    await this.generateAlertTemplates(alertDir);

    // Generate alert middleware
    await this.generateAlertMiddleware(alertDir);

    console.log('✅ Alert system generated using @opsai/alerts');
  }

  private async generateAlertRules(alertDir: string): Promise<void> {
    const rules = this.alertConfig.rules || [];
    
    const rulesContent = `import { AlertRule } from '@opsai/alerts';

export const alertRules: AlertRule[] = [
  ${rules.map((rule: AlertRule) => `
  {
    id: '${rule.name}',
    name: '${rule.name}',
    description: '${rule.description}',
    enabled: ${rule.enabled !== false},
    priority: '${rule.priority || 'medium'}',
    cooldown: '${rule.cooldown || '1h'}',
    conditions: [
      ${rule.conditions.map(condition => `
      {
        field: '${condition.field}',
        operator: '${condition.operator}',
        value: ${JSON.stringify(condition.value)},
        dataSource: '${condition.data_source || 'database'}'
      }`).join(',\n      ')}
    ],
    actions: [
      ${rule.actions.map(action => `
      {
        type: '${action.type}',
        ${action.template ? `template: '${action.template}',` : ''}
        ${action.to ? `to: ${JSON.stringify(action.to)},` : ''}
        ${action.channel ? `channel: '${action.channel}',` : ''}
        ${action.url ? `url: '${action.url}',` : ''}
        ${action.workflow ? `workflow: '${action.workflow}',` : ''}
        config: {}
      }`).join(',\n      ')}
    ]
  }`).join(',\n  ')}
];

// Export individual rules for easier testing
${rules.map((rule: AlertRule) => `
export const ${this.toCamelCase(rule.name)}Rule = alertRules.find(r => r.name === '${rule.name}')!;`).join('')}
`;

    fs.writeFileSync(path.join(alertDir, 'rules.ts'), rulesContent);
  }

  private async generateAlertService(alertDir: string): Promise<void> {
    const serviceContent = `import { AlertService } from '@opsai/alerts';
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

    console.log(\`Alert service initialized with \${alertRules.length} rules\`);
  }

  async evaluateAlerts(data: any, context: any = {}): Promise<void> {
    await this.alertService.evaluateRules(data, context);
  }

  async testAlert(ruleName: string, testData: any): Promise<void> {
    const rule = alertRules.find(r => r.name === ruleName);
    if (!rule) {
      throw new Error(\\\`Alert rule '\\\${ruleName}' not found\\\`);
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
`;

    fs.writeFileSync(path.join(alertDir, 'service.ts'), serviceContent);
  }

  private async generateAlertTemplates(alertDir: string): Promise<void> {
    const templatesDir = path.join(alertDir, 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });

    // Generate email templates
    const emailTemplates: Record<string, any> = {};
    const rules = this.alertConfig.rules || [];

    // Extract unique templates from rules
    rules.forEach((rule: AlertRule) => {
      rule.actions.forEach(action => {
        if (action.type === 'email' && action.template) {
          emailTemplates[action.template] = {
            subject: `Alert: ${rule.name}`,
            html: this.generateEmailTemplate(rule),
            text: this.generateTextTemplate(rule)
          };
        }
      });
    });

    const templatesContent = `export const emailTemplates = {
  ${Object.entries(emailTemplates).map(([name, template]) => `
  '${name}': {
    subject: '${template.subject}',
    html: \`${template.html}\`,
    text: \`${template.text}\`
  }`).join(',\n  ')}
};

export const slackTemplates = {
  default: {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Alert Triggered*\\n{{description}}'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '*Rule:*\\n{{ruleName}}'
          },
          {
            type: 'mrkdwn',
            text: '*Priority:*\\n{{priority}}'
          },
          {
            type: 'mrkdwn',
            text: '*Time:*\\n{{timestamp}}'
          }
        ]
      }
    ]
  }
};

export const webhookTemplates = {
  default: {
    event: 'alert.triggered',
    data: {
      rule: '{{ruleName}}',
      description: '{{description}}',
      priority: '{{priority}}',
      timestamp: '{{timestamp}}',
      data: '{{alertData}}'
    }
  }
};
`;

    fs.writeFileSync(path.join(templatesDir, 'index.ts'), templatesContent);
  }

  private generateEmailTemplate(rule: AlertRule): string {
    return `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #f8f9fa; padding: 20px; border-bottom: 2px solid #dee2e6; }
    .content { padding: 20px; }
    .priority-high { color: #dc3545; font-weight: bold; }
    .priority-medium { color: #fd7e14; font-weight: bold; }
    .priority-low { color: #28a745; }
    .footer { background-color: #f8f9fa; padding: 10px; font-size: 12px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 Alert: ${rule.name}</h1>
  </div>
  <div class="content">
    <p><strong>Description:</strong> ${rule.description}</p>
    <p><strong>Priority:</strong> <span class="priority-{{priority}}">{{priority}}</span></p>
    <p><strong>Triggered at:</strong> {{timestamp}}</p>
    <p><strong>Details:</strong></p>
    <ul>
      {{#each conditions}}
      <li>{{field}} {{operator}} {{value}}</li>
      {{/each}}
    </ul>
    <p><strong>Data:</strong></p>
    <pre>{{alertData}}</pre>
  </div>
  <div class="footer">
    <p>This alert was generated by ${this.config.app.displayName}</p>
  </div>
</body>
</html>`;
  }

  private generateTextTemplate(rule: AlertRule): string {
    return `
🚨 ALERT: ${rule.name}

Description: ${rule.description}
Priority: {{priority}}
Triggered at: {{timestamp}}

Conditions:
${rule.conditions.map(c => `- ${c.field} ${c.operator} ${c.value}`).join('\n')}

Data: {{alertData}}

---
Generated by ${this.config.app.displayName}
    `.trim();
  }

  private async generateAlertMiddleware(alertDir: string): Promise<void> {
    const middlewareContent = `import { Request, Response, NextFunction } from 'express';
import { appAlertService } from './service';

/**
 * Middleware to automatically evaluate alerts on data changes
 */
export function alertMiddleware(options: { 
  entities?: string[]; 
  operations?: ('create' | 'update' | 'delete')[] 
} = {}) {
  const { entities = [], operations = ['create', 'update', 'delete'] } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to intercept responses
    res.json = function(body: any) {
      // Check if this is a data modification operation
      const method = req.method.toLowerCase();
      const isDataOperation = ['post', 'put', 'patch', 'delete'].includes(method);
      
      if (isDataOperation && res.statusCode < 400) {
        // Extract entity from URL path
        const pathParts = req.path.split('/');
        const entityName = pathParts[2]; // assuming /api/entity-name pattern

        if (entities.length === 0 || entities.includes(entityName)) {
          // Prepare alert context
          const alertContext = {
            entity: entityName,
            operation: method === 'post' ? 'create' : 
                      method === 'delete' ? 'delete' : 'update',
            userId: req.user?.id,
            tenantId: req.tenant?.id,
            timestamp: new Date().toISOString(),
            requestData: req.body,
            responseData: body
          };

          // Evaluate alerts asynchronously (don't block response)
          setImmediate(async () => {
            try {
              await appAlertService.evaluateAlerts(body, alertContext);
            } catch (error) {
              console.error('Alert evaluation failed:', error);
            }
          });
        }
      }

      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Route handler for manual alert evaluation
 */
export async function evaluateAlerts(req: Request, res: Response) {
  try {
    const { data, context } = req.body;
    await appAlertService.evaluateAlerts(data, context);
    res.json({ success: true, message: 'Alerts evaluated successfully' });
  } catch (error) {
    console.error('Manual alert evaluation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Route handler for testing alerts
 */
export async function testAlert(req: Request, res: Response) {
  try {
    const { ruleName } = req.params;
    const testData = req.body;
    
    await appAlertService.testAlert(ruleName, testData);
    res.json({ success: true, message: \`Alert '\${ruleName}' tested successfully\` });
  } catch (error) {
    console.error('Alert test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Route handler for alert history
 */
export async function getAlertHistory(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const history = await appAlertService.getAlertHistory(limit);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Failed to get alert history:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

/**
 * Route handler for alert metrics
 */
export async function getAlertMetrics(req: Request, res: Response) {
  try {
    const metrics = await appAlertService.getAlertMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Failed to get alert metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
`;

    fs.writeFileSync(path.join(alertDir, 'middleware.ts'), middlewareContent);

    // Generate alert routes
    const routesContent = `import { Router } from 'express';
import { 
  evaluateAlerts, 
  testAlert, 
  getAlertHistory, 
  getAlertMetrics 
} from './middleware';

const router = Router();

// Manual alert evaluation
router.post('/evaluate', evaluateAlerts);

// Test specific alert rule
router.post('/test/:ruleName', testAlert);

// Get alert history
router.get('/history', getAlertHistory);

// Get alert metrics
router.get('/metrics', getAlertMetrics);

export { router as alertRouter };
`;

    fs.writeFileSync(path.join(alertDir, 'routes.ts'), routesContent);
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  }
}