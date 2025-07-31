import { AppConfig } from '../../../../packages/shared/src/config/service-config';

export interface FieldMapping {
  apiField: string;
  dbField: string;
  required: boolean;
  transformation?: (value: any) => any;
  validation?: (value: any) => boolean;
}

export interface EntityMapping {
  entityName: string;
  fields: FieldMapping[];
}

export class DataMappingValidator {
  private config: AppConfig;
  private mappings: Map<string, EntityMapping> = new Map();

  constructor(config: AppConfig) {
    this.config = config;
    this.initializeMappings();
  }

  private initializeMappings(): void {
    
    // User mapping
    this.mappings.set('User', {
      entityName: 'User',
      fields: [
        
        {
          apiField: 'id',
          dbField: 'id',
          required: false,
          
          
        },
        
        {
          apiField: 'email',
          dbField: 'email',
          required: true,
          
          validation: (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        },
        
        {
          apiField: 'name',
          dbField: 'name',
          required: true,
          
          
        },
        
        {
          apiField: 'role',
          dbField: 'role',
          required: false,
          
          validation: (value) => ["admin","manager","user"].includes(value),
        },
        
        {
          apiField: 'organizationId',
          dbField: 'organizationId',
          required: true,
          
          
        },
        
        {
          apiField: 'isActive',
          dbField: 'isActive',
          required: false,
          
          
        },
        
        {
          apiField: 'lastLogin',
          dbField: 'lastLogin',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        },
        
        {
          apiField: 'preferences',
          dbField: 'preferences',
          required: false,
          
          
        },
        
        {
          apiField: 'createdAt',
          dbField: 'createdAt',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        },
        
        {
          apiField: 'updatedAt',
          dbField: 'updatedAt',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        }
      ]
    });

    // Organization mapping
    this.mappings.set('Organization', {
      entityName: 'Organization',
      fields: [
        
        {
          apiField: 'id',
          dbField: 'id',
          required: false,
          
          
        },
        
        {
          apiField: 'name',
          dbField: 'name',
          required: true,
          
          
        },
        
        {
          apiField: 'slug',
          dbField: 'slug',
          required: false,
          
          
        },
        
        {
          apiField: 'domain',
          dbField: 'domain',
          required: false,
          
          
        },
        
        {
          apiField: 'plan',
          dbField: 'plan',
          required: false,
          
          validation: (value) => ["starter","professional","enterprise"].includes(value),
        },
        
        {
          apiField: 'billingEmail',
          dbField: 'billingEmail',
          required: true,
          
          validation: (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        },
        
        {
          apiField: 'settings',
          dbField: 'settings',
          required: false,
          
          
        },
        
        {
          apiField: 'isActive',
          dbField: 'isActive',
          required: false,
          
          
        },
        
        {
          apiField: 'createdAt',
          dbField: 'createdAt',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        },
        
        {
          apiField: 'updatedAt',
          dbField: 'updatedAt',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        }
      ]
    });

    // Project mapping
    this.mappings.set('Project', {
      entityName: 'Project',
      fields: [
        
        {
          apiField: 'id',
          dbField: 'id',
          required: false,
          
          
        },
        
        {
          apiField: 'name',
          dbField: 'name',
          required: true,
          
          
        },
        
        {
          apiField: 'description',
          dbField: 'description',
          required: false,
          
          
        },
        
        {
          apiField: 'organizationId',
          dbField: 'organizationId',
          required: true,
          
          
        },
        
        {
          apiField: 'ownerId',
          dbField: 'ownerId',
          required: true,
          
          
        },
        
        {
          apiField: 'status',
          dbField: 'status',
          required: false,
          
          validation: (value) => ["planning","active","completed","archived"].includes(value),
        },
        
        {
          apiField: 'priority',
          dbField: 'priority',
          required: false,
          
          validation: (value) => ["low","medium","high","critical"].includes(value),
        },
        
        {
          apiField: 'budget',
          dbField: 'budget',
          required: false,
          transformation: (value) => typeof value === "string" ? parseFloat(value) : value,
          
        },
        
        {
          apiField: 'startDate',
          dbField: 'startDate',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        },
        
        {
          apiField: 'endDate',
          dbField: 'endDate',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        },
        
        {
          apiField: 'tags',
          dbField: 'tags',
          required: false,
          
          
        },
        
        {
          apiField: 'createdAt',
          dbField: 'createdAt',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        },
        
        {
          apiField: 'updatedAt',
          dbField: 'updatedAt',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        }
      ]
    });

    // Task mapping
    this.mappings.set('Task', {
      entityName: 'Task',
      fields: [
        
        {
          apiField: 'id',
          dbField: 'id',
          required: false,
          
          
        },
        
        {
          apiField: 'title',
          dbField: 'title',
          required: true,
          
          
        },
        
        {
          apiField: 'description',
          dbField: 'description',
          required: false,
          
          
        },
        
        {
          apiField: 'projectId',
          dbField: 'projectId',
          required: true,
          
          
        },
        
        {
          apiField: 'assignedTo',
          dbField: 'assignedTo',
          required: false,
          
          
        },
        
        {
          apiField: 'createdBy',
          dbField: 'createdBy',
          required: true,
          
          
        },
        
        {
          apiField: 'status',
          dbField: 'status',
          required: false,
          
          validation: (value) => ["todo","in_progress","review","completed"].includes(value),
        },
        
        {
          apiField: 'priority',
          dbField: 'priority',
          required: false,
          
          validation: (value) => ["low","medium","high","critical"].includes(value),
        },
        
        {
          apiField: 'estimatedHours',
          dbField: 'estimatedHours',
          required: false,
          transformation: (value) => typeof value === "string" ? parseInt(value, 10) : value,
          
        },
        
        {
          apiField: 'actualHours',
          dbField: 'actualHours',
          required: false,
          transformation: (value) => typeof value === "string" ? parseInt(value, 10) : value,
          
        },
        
        {
          apiField: 'dueDate',
          dbField: 'dueDate',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        },
        
        {
          apiField: 'completedAt',
          dbField: 'completedAt',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        },
        
        {
          apiField: 'createdAt',
          dbField: 'createdAt',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        },
        
        {
          apiField: 'updatedAt',
          dbField: 'updatedAt',
          required: false,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        }
      ]
    });
  }

  validateMapping(apiData: any, entityName: string): ValidationResult {
    const mapping = this.mappings.get(entityName);
    if (!mapping) {
      return {
        valid: false,
        errors: [`No mapping found for entity: ${entityName}`],
        transformedData: null
      };
    }

    const errors: string[] = [];
    const transformedData: any = {};
    const warnings: string[] = [];

    mapping.fields.forEach(fieldMapping => {
      const apiValue = apiData[fieldMapping.apiField];
      
      // Check required fields
      if (fieldMapping.required && (apiValue === null || apiValue === undefined)) {
        errors.push(`Required field '${fieldMapping.apiField}' is missing`);
        return;
      }

      // Apply transformation if needed
      let transformedValue = apiValue;
      if (fieldMapping.transformation && apiValue !== null && apiValue !== undefined) {
        try {
          transformedValue = fieldMapping.transformation(apiValue);
        } catch (error) {
          errors.push(`Transformation failed for '${fieldMapping.apiField}': ${error.message}`);
          return;
        }
      }

      // Apply validation if needed
      if (fieldMapping.validation && transformedValue !== null && transformedValue !== undefined) {
        if (!fieldMapping.validation(transformedValue)) {
          errors.push(`Validation failed for '${fieldMapping.apiField}'`);
          return;
        }
      }

      // Store transformed value
      transformedData[fieldMapping.dbField] = transformedValue;
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      transformedData
    };
  }

  getRequiredFields(entityName: string): string[] {
    const mapping = this.mappings.get(entityName);
    if (!mapping) return [];
    
    return mapping.fields
      .filter(field => field.required)
      .map(field => field.apiField);
  }

  getAllMappings(): EntityMapping[] {
    return Array.from(this.mappings.values());
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  transformedData: any;
}

// Export default instance
export const dataMappingValidator = new DataMappingValidator({
  "app": {
    "name": "comprehensive-test-app",
    "displayName": "Comprehensive Test Platform",
    "description": "Full-featured B2B SaaS platform testing all OPSAI generator capabilities",
    "version": "1.0.0",
    "author": "OPSAI Test Team",
    "license": "MIT"
  },
  "services": {
    "mode": "shared",
    "tenantId": "comprehensive-test-app",
    "environment": "development",
    "database": {
      "provider": "core-managed"
    },
    "auth": {
      "provider": "core-supabase"
    },
    "storage": {
      "provider": "core-supabase"
    },
    "integrations": [
      {
        "name": "email_service",
        "mode": "user-api-key",
        "baseUrl": "https://api.sendgrid.com/v3",
        "credentials": {
          "api_key": "${EMAIL_SERVICE_API_KEY}"
        },
        "rateLimits": {
          "requestsPerMinute": 600
        }
      },
      {
        "name": "slack_notifications",
        "mode": "user-api-key"
      }
    ]
  },
  "database": {
    "type": "sqlite",
    "entities": [
      {
        "name": "User",
        "displayName": "Users",
        "description": "Application users with authentication",
        "fields": {
          "id": {
            "type": "string",
            "primary": true,
            "unique": true
          },
          "email": {
            "type": "string",
            "required": true,
            "unique": true,
            "validation": {
              "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
            }
          },
          "name": {
            "type": "string",
            "required": true
          },
          "role": {
            "type": "string",
            "default": "user",
            "validation": {
              "enum": [
                "admin",
                "manager",
                "user"
              ]
            }
          },
          "organizationId": {
            "type": "string",
            "required": true
          },
          "isActive": {
            "type": "boolean",
            "default": true
          },
          "lastLogin": {
            "type": "datetime"
          },
          "preferences": {
            "type": "string"
          },
          "createdAt": {
            "type": "datetime",
            "default": "now"
          },
          "updatedAt": {
            "type": "datetime",
            "default": "now"
          }
        },
        "relationships": [
          {
            "type": "belongsTo",
            "model": "Organization",
            "foreign_key": "organizationId"
          },
          {
            "type": "hasMany",
            "model": "Task",
            "foreign_key": "assignedTo"
          }
        ]
      },
      {
        "name": "Organization",
        "displayName": "Organizations",
        "description": "Customer organizations",
        "fields": {
          "id": {
            "type": "string",
            "primary": true,
            "unique": true
          },
          "name": {
            "type": "string",
            "required": true
          },
          "slug": {
            "type": "string",
            "unique": true
          },
          "domain": {
            "type": "string",
            "unique": true
          },
          "plan": {
            "type": "string",
            "default": "starter",
            "validation": {
              "enum": [
                "starter",
                "professional",
                "enterprise"
              ]
            }
          },
          "billingEmail": {
            "type": "string",
            "required": true
          },
          "settings": {
            "type": "string"
          },
          "isActive": {
            "type": "boolean",
            "default": true
          },
          "createdAt": {
            "type": "datetime",
            "default": "now"
          },
          "updatedAt": {
            "type": "datetime",
            "default": "now"
          }
        },
        "relationships": [
          {
            "type": "hasMany",
            "model": "User",
            "foreign_key": "organizationId"
          },
          {
            "type": "hasMany",
            "model": "Project",
            "foreign_key": "organizationId"
          }
        ]
      },
      {
        "name": "Project",
        "displayName": "Projects",
        "description": "Organization projects",
        "fields": {
          "id": {
            "type": "string",
            "primary": true,
            "unique": true
          },
          "name": {
            "type": "string",
            "required": true
          },
          "description": {
            "type": "text"
          },
          "organizationId": {
            "type": "string",
            "required": true
          },
          "ownerId": {
            "type": "string",
            "required": true
          },
          "status": {
            "type": "string",
            "default": "planning",
            "validation": {
              "enum": [
                "planning",
                "active",
                "completed",
                "archived"
              ]
            }
          },
          "priority": {
            "type": "string",
            "default": "medium",
            "validation": {
              "enum": [
                "low",
                "medium",
                "high",
                "critical"
              ]
            }
          },
          "budget": {
            "type": "decimal"
          },
          "startDate": {
            "type": "date"
          },
          "endDate": {
            "type": "date"
          },
          "tags": {
            "type": "string"
          },
          "createdAt": {
            "type": "datetime",
            "default": "now"
          },
          "updatedAt": {
            "type": "datetime",
            "default": "now"
          }
        },
        "relationships": [
          {
            "type": "belongsTo",
            "model": "Organization",
            "foreign_key": "organizationId"
          },
          {
            "type": "belongsTo",
            "model": "User",
            "foreign_key": "ownerId"
          },
          {
            "type": "hasMany",
            "model": "Task",
            "foreign_key": "projectId"
          }
        ]
      },
      {
        "name": "Task",
        "displayName": "Tasks",
        "description": "Project tasks",
        "fields": {
          "id": {
            "type": "string",
            "primary": true,
            "unique": true
          },
          "title": {
            "type": "string",
            "required": true
          },
          "description": {
            "type": "text"
          },
          "projectId": {
            "type": "string",
            "required": true
          },
          "assignedTo": {
            "type": "string"
          },
          "createdBy": {
            "type": "string",
            "required": true
          },
          "status": {
            "type": "string",
            "default": "todo",
            "validation": {
              "enum": [
                "todo",
                "in_progress",
                "review",
                "completed"
              ]
            }
          },
          "priority": {
            "type": "string",
            "default": "medium",
            "validation": {
              "enum": [
                "low",
                "medium",
                "high",
                "critical"
              ]
            }
          },
          "estimatedHours": {
            "type": "integer"
          },
          "actualHours": {
            "type": "integer"
          },
          "dueDate": {
            "type": "datetime"
          },
          "completedAt": {
            "type": "datetime"
          },
          "createdAt": {
            "type": "datetime",
            "default": "now"
          },
          "updatedAt": {
            "type": "datetime",
            "default": "now"
          }
        },
        "relationships": [
          {
            "type": "belongsTo",
            "model": "Project",
            "foreign_key": "projectId"
          },
          {
            "type": "belongsTo",
            "model": "User",
            "foreign_key": "assignedTo"
          },
          {
            "type": "belongsTo",
            "model": "User",
            "foreign_key": "createdBy"
          }
        ]
      }
    ]
  },
  "workflows": [
    {
      "name": "user_onboarding",
      "description": "Welcome new users and set up their environment",
      "trigger": {
        "type": "event",
        "config": {
          "event": "user.created"
        }
      },
      "steps": [
        {
          "name": "send_welcome_email",
          "type": "api_call",
          "config": {
            "integration": "email_service",
            "endpoint": "send_email",
            "data": {
              "personalizations": [
                {
                  "to": [
                    {
                      "email": "{{user.email}}",
                      "name": "{{user.name}}"
                    }
                  ]
                }
              ],
              "from": {
                "email": "noreply@test.com",
                "name": "Test Platform"
              },
              "subject": "Welcome to Test Platform!",
              "content": [
                {
                  "type": "text/html",
                  "value": "<p>Welcome {{user.name}}! Get started with our platform.</p>"
                }
              ]
            }
          }
        },
        {
          "name": "notify_admin",
          "type": "webhook",
          "config": {
            "integration": "slack_notifications",
            "data": {
              "text": "New user registered: {{user.name}} ({{user.email}})",
              "channel": "#new-users"
            }
          }
        },
        {
          "name": "create_welcome_project",
          "type": "database_insert",
          "config": {
            "model": "Project",
            "data": {
              "name": "Welcome Project",
              "description": "Your first project to explore the platform",
              "organizationId": "{{user.organizationId}}",
              "ownerId": "{{user.id}}",
              "status": "active"
            }
          }
        }
      ]
    },
    {
      "name": "project_completion",
      "description": "Handle project completion workflow",
      "trigger": {
        "type": "api_call",
        "endpoint": "/api/projects/{id}/complete",
        "method": "POST"
      },
      "steps": [
        {
          "name": "update_project_status",
          "type": "database_update",
          "config": {
            "model": "Project",
            "where": "id = {{projectId}}",
            "data": {
              "status": "completed"
            }
          }
        },
        {
          "name": "notify_team",
          "type": "api_call",
          "config": {
            "integration": "email_service",
            "endpoint": "send_email",
            "template": "project_completion"
          }
        }
      ]
    }
  ],
  "ui": {
    "theme": {},
    "pages": []
  },
  "alerts": {
    "rules": [
      {
        "name": "overdue_tasks",
        "description": "Alert when tasks are overdue",
        "conditions": [
          {
            "field": "task.dueDate",
            "operator": "less_than",
            "value": "now()"
          },
          {
            "field": "task.status",
            "operator": "not_equals",
            "value": "completed"
          }
        ],
        "actions": [
          {
            "type": "email",
            "to": [
              "{{task.assignedTo.email}}"
            ],
            "template": "task_overdue"
          },
          {
            "type": "webhook",
            "integration": "slack_notifications",
            "data": {
              "text": "Overdue task: {{task.title}} assigned to {{task.assignedTo.name}}"
            }
          }
        ]
      },
      {
        "name": "project_budget_exceeded",
        "description": "Alert when project budget is exceeded",
        "conditions": [
          {
            "field": "project.actualCost",
            "operator": "greater_than",
            "value": "{{project.budget}}"
          }
        ],
        "actions": [
          {
            "type": "email",
            "to": [
              "{{project.owner.email}}"
            ],
            "template": "budget_exceeded"
          }
        ]
      }
    ]
  },
  "deployment": {
    "platform": "aws",
    "environment": "production",
    "resources": {
      "api": {
        "cpu": 1,
        "memory": "2Gi",
        "replicas": 2
      },
      "database": {
        "type": "sqlite",
        "storage": "10Gi"
      }
    },
    "environmentVariables": []
  },
  "features": {
    "authentication": true,
    "multiTenancy": false,
    "fileUpload": true,
    "notifications": true,
    "analytics": true,
    "workflows": true,
    "alerts": true,
    "integrations": true,
    "audit": true,
    "search": true,
    "caching": true
  }
});