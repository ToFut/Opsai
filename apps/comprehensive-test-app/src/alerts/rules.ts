import { AlertRule } from '@opsai/alerts';

export const alertRules: AlertRule[] = [
  
  {
    id: 'overdue_tasks',
    name: 'overdue_tasks',
    description: 'Alert when tasks are overdue',
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
        type: 'webhook',
        
        
        
        
        
        config: {}
      }
    ]
  },
  
  {
    id: 'project_budget_exceeded',
    name: 'project_budget_exceeded',
    description: 'Alert when project budget is exceeded',
    enabled: true,
    priority: 'medium',
    cooldown: '1h',
    conditions: [
      
      {
        field: 'project.actualCost',
        operator: 'greater_than',
        value: "{{project.budget}}",
        dataSource: 'database'
      }
    ],
    actions: [
      
      {
        type: 'email',
        template: 'budget_exceeded',
        to: ["{{project.owner.email}}"],
        
        
        
        config: {}
      }
    ]
  }
];

// Export individual rules for easier testing

export const overdue_tasksRule = alertRules.find(r => r.name === 'overdue_tasks')!;
export const project_budget_exceededRule = alertRules.find(r => r.name === 'project_budget_exceeded')!;
