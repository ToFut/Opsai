import { AlertRule } from '@opsai/alerts';

export const alertRules: AlertRule[] = [
  
  {
    id: 'reservation_confirmed',
    name: 'reservation_confirmed',
    description: 'Alert when reservation is confirmed',
    enabled: true,
    priority: 'medium',
    cooldown: '1h',
    conditions: [
      
      {
        field: 'status',
        operator: 'equals',
        value: "confirmed",
        dataSource: 'database'
      }
    ],
    actions: [
      
      {
        type: 'email',
        template: 'reservation_confirmed',
        to: "{{guest.email}}",
        
        
        
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
    id: 'property_availability_change',
    name: 'property_availability_change',
    description: 'Alert when property becomes available',
    enabled: true,
    priority: 'low',
    cooldown: '24h',
    conditions: [
      
      {
        field: 'status',
        operator: 'equals',
        value: "available",
        dataSource: 'database'
      }
    ],
    actions: [
      
      {
        type: 'email',
        template: 'property_available',
        to: "{{interested_users}}",
        
        
        
        config: {}
      }
    ]
  },
  
  {
    id: 'api_token_expiring',
    name: 'api_token_expiring',
    description: 'Alert when Guesty API token expires soon',
    enabled: true,
    priority: 'high',
    cooldown: '12h',
    conditions: [
      
      {
        field: 'token_expires_at',
        operator: 'less_than',
        value: "now() + 24 hours",
        dataSource: 'database'
      }
    ],
    actions: [
      
      {
        type: 'email',
        template: 'token_expiry_warning',
        to: ["admin@lineproperties.com"],
        
        
        
        config: {}
      },
      
      {
        type: 'workflow',
        
        
        
        
        workflow: 'refresh_guesty_token',
        config: {}
      }
    ]
  }
];

// Export individual rules for easier testing

export const reservation_confirmedRule = alertRules.find(r => r.name === 'reservation_confirmed')!;
export const property_availability_changeRule = alertRules.find(r => r.name === 'property_availability_change')!;
export const api_token_expiringRule = alertRules.find(r => r.name === 'api_token_expiring')!;
