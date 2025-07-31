import { AlertRule } from '@opsai/alerts';

export const alertRules: AlertRule[] = [
  
  {
    id: 'high_budget_project',
    name: 'high_budget_project',
    description: 'Alert when project budget exceeds threshold',
    enabled: true,
    priority: 'medium',
    cooldown: '1h',
    conditions: [
      
      {
        field: 'project.budget',
        operator: 'greater_than',
        value: 100000,
        dataSource: 'database'
      }
    ],
    actions: [
      
      {
        type: 'email',
        template: 'high_budget_alert',
        to: ["finance@techcorp.com"],
        
        
        
        config: {}
      },
      
      {
        type: 'slack',
        
        
        channel: '#finance',
        
        
        config: {}
      }
    ]
  },
  
  {
    id: 'task_overdue',
    name: 'task_overdue',
    description: 'Alert when task is overdue',
    enabled: true,
    priority: 'medium',
    cooldown: '1h',
    conditions: [
      
      {
        field: 'task.dueDate',
        operator: 'less_than',
        value: "now()",
        dataSource: 'database'
      },
      
      {
        field: 'task.status',
        operator: 'not_equals',
        value: "completed",
        dataSource: 'database'
      }
    ],
    actions: [
      
      {
        type: 'email',
        template: 'task_overdue',
        to: ["{{task.assignedTo.email}}"],
        
        
        
        config: {}
      },
      
      {
        type: 'notification',
        
        
        channel: 'in_app',
        
        
        config: {}
      }
    ]
  },
  
  {
    id: 'subscription_expiring',
    name: 'subscription_expiring',
    description: 'Alert when subscription is expiring soon',
    enabled: true,
    priority: 'medium',
    cooldown: '1h',
    conditions: [
      
      {
        field: 'organization.subscriptionEndDate',
        operator: 'less_than',
        value: "now() + 30 days",
        dataSource: 'database'
      }
    ],
    actions: [
      
      {
        type: 'email',
        template: 'subscription_renewal',
        to: ["{{organization.billingEmail}}"],
        
        
        
        config: {}
      },
      
      {
        type: 'workflow',
        
        
        
        
        workflow: 'send_renewal_reminders',
        config: {}
      }
    ]
  }
];

// Export individual rules for easier testing

export const high_budget_projectRule = alertRules.find(r => r.name === 'high_budget_project')!;
export const task_overdueRule = alertRules.find(r => r.name === 'task_overdue')!;
export const subscription_expiringRule = alertRules.find(r => r.name === 'subscription_expiring')!;
