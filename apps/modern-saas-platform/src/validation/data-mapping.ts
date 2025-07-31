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
          apiField: 'domain',
          dbField: 'domain',
          required: false,
          
          
        },
        
        {
          apiField: 'plan',
          dbField: 'plan',
          required: false,
          
          
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
          apiField: 'status',
          dbField: 'status',
          required: false,
          
          
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
          apiField: 'createdBy',
          dbField: 'createdBy',
          required: true,
          
          
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
          apiField: 'priority',
          dbField: 'priority',
          required: false,
          
          
        },
        
        {
          apiField: 'status',
          dbField: 'status',
          required: false,
          
          
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
    "name": "techcorp-platform",
    "displayName": "TechCorp Platform",
    "description": "A comprehensive B2B SaaS platform with full API integrations, authentication, and modern UI",
    "version": "1.0.0",
    "author": "TechCorp Solutions",
    "license": "MIT"
  },
  "services": {
    "mode": "shared",
    "tenantId": "techcorp-platform",
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
        "name": "stripe_payments",
        "mode": "user-api-key",
        "baseUrl": "https://api.stripe.com/v1",
        "rateLimits": {
          "requestsPerMinute": 100,
          "burstLimit": 20
        }
      },
      {
        "name": "sendgrid_email",
        "mode": "user-api-key",
        "baseUrl": "https://api.sendgrid.com/v3",
        "credentials": {
          "api_key": "${SENDGRID_EMAIL_API_KEY}"
        },
        "rateLimits": {
          "requestsPerMinute": 600
        }
      },
      {
        "name": "slack_notifications",
        "mode": "user-api-key"
      },
      {
        "name": "analytics_db",
        "mode": "user-api-key"
      }
    ]
  },
  "database": {
    "type": "postgresql",
    "entities": [
      {
        "name": "User",
        "displayName": "Users",
        "description": "Platform users with authentication",
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
            },
            "ui": {
              "widget": "email",
              "label": "Email Address",
              "placeholder": "user@example.com"
            }
          },
          "name": {
            "type": "string",
            "required": true,
            "ui": {
              "widget": "input",
              "label": "Full Name"
            }
          },
          "role": {
            "type": "enum",
            "values": [
              "admin",
              "manager",
              "user"
            ],
            "default": "user",
            "ui": {
              "widget": "select",
              "label": "User Role"
            }
          },
          "organizationId": {
            "type": "string",
            "required": true,
            "ui": {
              "widget": "relation_select",
              "model": "Organization"
            }
          },
          "isActive": {
            "type": "boolean",
            "default": true,
            "ui": {
              "widget": "toggle",
              "label": "Active Status"
            }
          },
          "lastLogin": {
            "type": "datetime",
            "ui": {
              "widget": "datetime",
              "label": "Last Login"
            }
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
            "model": "Project",
            "foreign_key": "createdBy"
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
            "required": true,
            "ui": {
              "widget": "input",
              "label": "Organization Name"
            }
          },
          "domain": {
            "type": "string",
            "unique": true,
            "ui": {
              "widget": "input",
              "label": "Domain",
              "placeholder": "company.com"
            }
          },
          "plan": {
            "type": "enum",
            "values": [
              "starter",
              "professional",
              "enterprise"
            ],
            "default": "starter",
            "ui": {
              "widget": "select",
              "label": "Subscription Plan"
            }
          },
          "billingEmail": {
            "type": "string",
            "required": true,
            "ui": {
              "widget": "email",
              "label": "Billing Email"
            }
          },
          "settings": {
            "type": "json",
            "ui": {
              "widget": "json-editor",
              "label": "Organization Settings"
            }
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
            "required": true,
            "ui": {
              "widget": "input",
              "label": "Project Name"
            }
          },
          "description": {
            "type": "text",
            "ui": {
              "widget": "textarea",
              "label": "Description"
            }
          },
          "organizationId": {
            "type": "string",
            "required": true
          },
          "status": {
            "type": "enum",
            "values": [
              "planning",
              "active",
              "completed",
              "archived"
            ],
            "default": "planning",
            "ui": {
              "widget": "select",
              "label": "Status"
            }
          },
          "budget": {
            "type": "decimal",
            "ui": {
              "widget": "currency",
              "label": "Budget"
            }
          },
          "startDate": {
            "type": "date",
            "ui": {
              "widget": "date",
              "label": "Start Date"
            }
          },
          "endDate": {
            "type": "date",
            "ui": {
              "widget": "date",
              "label": "End Date"
            }
          },
          "createdBy": {
            "type": "string",
            "required": true
          },
          "tags": {
            "type": "json",
            "ui": {
              "widget": "tags",
              "label": "Tags"
            }
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
            "foreign_key": "createdBy"
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
            "required": true,
            "ui": {
              "widget": "input",
              "label": "Task Title"
            }
          },
          "description": {
            "type": "text",
            "ui": {
              "widget": "textarea",
              "label": "Description"
            }
          },
          "projectId": {
            "type": "string",
            "required": true
          },
          "assignedTo": {
            "type": "string",
            "ui": {
              "widget": "relation_select",
              "model": "User"
            }
          },
          "priority": {
            "type": "enum",
            "values": [
              "low",
              "medium",
              "high",
              "critical"
            ],
            "default": "medium",
            "ui": {
              "widget": "select",
              "label": "Priority"
            }
          },
          "status": {
            "type": "enum",
            "values": [
              "todo",
              "in_progress",
              "review",
              "completed"
            ],
            "default": "todo",
            "ui": {
              "widget": "select",
              "label": "Status"
            }
          },
          "dueDate": {
            "type": "datetime",
            "ui": {
              "widget": "datetime",
              "label": "Due Date"
            }
          },
          "completedAt": {
            "type": "datetime",
            "ui": {
              "widget": "datetime",
              "label": "Completed At"
            }
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
          }
        ]
      }
    ]
  },
  "workflows": [
    {
      "name": "user_onboarding",
      "description": "Complete user onboarding process",
      "trigger": {
        "type": "event",
        "config": {
          "event": "user.created"
        }
      },
      "steps": [
        {
          "name": "create_stripe_customer",
          "type": "api_call",
          "config": {
            "integration": "stripe_payments",
            "endpoint": "create_customer",
            "data": {
              "email": "{{user.email}}",
              "name": "{{user.name}}",
              "metadata": {
                "userId": "{{user.id}}",
                "organizationId": "{{user.organizationId}}"
              }
            }
          },
          "retry": {
            "attempts": 3,
            "delay": 5000
          }
        },
        {
          "name": "send_welcome_email",
          "type": "api_call",
          "config": {
            "integration": "sendgrid_email",
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
                "email": "noreply@techcorp.com",
                "name": "TechCorp Platform"
              },
              "subject": "Welcome to TechCorp Platform!",
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
          "name": "notify_slack",
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
          "name": "create_default_project",
          "type": "database_insert",
          "config": {
            "model": "Project",
            "data": {
              "name": "Getting Started",
              "description": "Your first project to explore the platform",
              "organizationId": "{{user.organizationId}}",
              "createdBy": "{{user.id}}",
              "status": "active"
            }
          }
        }
      ]
    },
    {
      "name": "project_completion",
      "description": "Handle project completion",
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
              "status": "completed",
              "completedAt": "{{now()}}"
            }
          }
        },
        {
          "name": "calculate_metrics",
          "type": "custom",
          "config": {
            "function": "calculateProjectMetrics",
            "params": {
              "projectId": "{{projectId}}"
            }
          }
        },
        {
          "name": "send_completion_report",
          "type": "api_call",
          "config": {
            "integration": "sendgrid_email",
            "endpoint": "send_email",
            "template": "project_completion_report"
          }
        },
        {
          "name": "archive_data",
          "type": "api_call",
          "config": {
            "integration": "analytics_db",
            "endpoint": "archive_project",
            "data": {
              "projectId": "{{projectId}}",
              "metrics": "{{metrics}}"
            }
          }
        }
      ]
    },
    {
      "name": "daily_analytics_sync",
      "description": "Sync analytics data daily",
      "trigger": {
        "type": "schedule",
        "cron": "0 2 * * *"
      },
      "steps": [
        {
          "name": "export_data",
          "type": "database_query",
          "config": {
            "query": "SELECT * FROM projects \nWHERE updatedAt >= NOW() - INTERVAL '1 day'\n"
          }
        },
        {
          "name": "transform_data",
          "type": "transformation",
          "config": {
            "rules": [
              {
                "type": "aggregate",
                "groupBy": [
                  "organizationId",
                  "status"
                ],
                "metrics": [
                  {
                    "count": "id"
                  },
                  {
                    "sum": "budget"
                  }
                ]
              }
            ]
          }
        },
        {
          "name": "sync_to_analytics",
          "type": "api_call",
          "config": {
            "integration": "analytics_db",
            "endpoint": "bulk_insert",
            "data": "{{transformedData}}"
          }
        }
      ]
    }
  ],
  "ui": {
    "theme": {
      "primaryColor": "#3B82F6",
      "secondaryColor": "#10B981",
      "accentColor": "#F59E0B",
      "font": "Inter",
      "mode": "system"
    },
    "pages": [
      {
        "name": "dashboard",
        "path": "/",
        "title": "Dashboard",
        "layout": "sidebar",
        "components": [
          {
            "type": "stats_grid",
            "data_source": "dashboard_stats",
            "cards": [
              {
                "title": "Total Projects",
                "metric": "total_projects",
                "icon": "folder",
                "trend": true
              },
              {
                "title": "Active Tasks",
                "metric": "active_tasks",
                "icon": "check-circle",
                "trend": true
              },
              {
                "title": "Team Members",
                "metric": "team_members",
                "icon": "users"
              },
              {
                "title": "Monthly Budget",
                "metric": "monthly_budget",
                "icon": "dollar-sign",
                "format": "currency"
              }
            ]
          },
          {
            "type": "chart_widget",
            "title": "Project Progress",
            "chartType": "bar",
            "data_source": "project_progress",
            "dimensions": {
              "x": "month",
              "y": "completed_projects"
            }
          },
          {
            "type": "activity_feed",
            "title": "Recent Activity",
            "data_source": "recent_activities",
            "limit": 10
          }
        ]
      },
      {
        "name": "projects",
        "path": "/projects",
        "title": "Projects",
        "components": [
          {
            "type": "page_header",
            "title": "Projects",
            "actions": [
              {
                "label": "New Project",
                "action": "modal",
                "modal": "create_project",
                "icon": "plus"
              }
            ]
          },
          {
            "type": "data_table",
            "data_source": "projects",
            "columns": [
              {
                "field": "name",
                "label": "Project Name",
                "sortable": true,
                "searchable": true
              },
              {
                "field": "organization.name",
                "label": "Organization"
              },
              {
                "field": "status",
                "label": "Status",
                "type": "badge",
                "colors": {
                  "planning": "blue",
                  "active": "green",
                  "completed": "gray",
                  "archived": "red"
                }
              },
              {
                "field": "budget",
                "label": "Budget",
                "type": "currency",
                "sortable": true
              },
              {
                "field": "progress",
                "label": "Progress",
                "type": "progress"
              },
              {
                "field": "endDate",
                "label": "Due Date",
                "type": "date",
                "sortable": true
              }
            ],
            "actions": [
              {
                "label": "View",
                "action": "navigate",
                "target": "/projects/{id}"
              },
              {
                "label": "Edit",
                "action": "modal",
                "modal": "edit_project"
              },
              {
                "label": "Archive",
                "action": "api_call",
                "endpoint": "/api/projects/{id}/archive",
                "confirm": true
              }
            ],
            "filters": [
              {
                "field": "status",
                "type": "select",
                "options": [
                  "planning",
                  "active",
                  "completed",
                  "archived"
                ]
              },
              {
                "field": "organizationId",
                "type": "relation",
                "model": "Organization"
              },
              {
                "field": "dateRange",
                "type": "date_range"
              }
            ]
          }
        ]
      },
      {
        "name": "users",
        "path": "/users",
        "title": "User Management",
        "permissions": [
          "admin",
          "manager"
        ],
        "components": [
          {
            "type": "page_header",
            "title": "Users",
            "actions": [
              {
                "label": "Invite User",
                "action": "modal",
                "modal": "invite_user",
                "icon": "user-plus"
              }
            ]
          },
          {
            "type": "user_grid",
            "data_source": "users",
            "layout": "cards",
            "fields": [
              "name",
              "email",
              "role",
              "lastLogin",
              "isActive"
            ]
          }
        ]
      },
      {
        "name": "settings",
        "path": "/settings",
        "title": "Settings",
        "layout": "tabs",
        "tabs": [
          {
            "name": "organization",
            "title": "Organization",
            "components": [
              {
                "type": "form",
                "data_source": "current_organization",
                "fields": [
                  {
                    "name": "name",
                    "type": "text",
                    "label": "Organization Name"
                  },
                  {
                    "name": "domain",
                    "type": "text",
                    "label": "Domain"
                  },
                  {
                    "name": "billingEmail",
                    "type": "email",
                    "label": "Billing Email"
                  },
                  {
                    "name": "plan",
                    "type": "select",
                    "label": "Subscription Plan",
                    "options": [
                      "starter",
                      "professional",
                      "enterprise"
                    ]
                  }
                ]
              }
            ]
          },
          {
            "name": "integrations",
            "title": "Integrations",
            "components": [
              {
                "type": "integration_list",
                "integrations": [
                  "stripe_payments",
                  "sendgrid_email",
                  "slack_notifications"
                ]
              }
            ]
          },
          {
            "name": "security",
            "title": "Security",
            "components": [
              {
                "type": "security_settings",
                "features": [
                  "mfa",
                  "session_management",
                  "audit_logs"
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "alerts": {
    "rules": [
      {
        "name": "high_budget_project",
        "description": "Alert when project budget exceeds threshold",
        "conditions": [
          {
            "field": "project.budget",
            "operator": "greater_than",
            "value": 100000
          }
        ],
        "actions": [
          {
            "type": "email",
            "to": [
              "finance@techcorp.com"
            ],
            "template": "high_budget_alert"
          },
          {
            "type": "slack",
            "channel": "#finance"
          }
        ]
      },
      {
        "name": "task_overdue",
        "description": "Alert when task is overdue",
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
            "type": "notification",
            "channel": "in_app",
            "priority": "high"
          }
        ]
      },
      {
        "name": "subscription_expiring",
        "description": "Alert when subscription is expiring soon",
        "conditions": [
          {
            "field": "organization.subscriptionEndDate",
            "operator": "less_than",
            "value": "now() + 30 days"
          }
        ],
        "actions": [
          {
            "type": "email",
            "to": [
              "{{organization.billingEmail}}"
            ],
            "template": "subscription_renewal"
          },
          {
            "type": "workflow",
            "workflow": "send_renewal_reminders"
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
        "type": "ecs",
        "cpu": 2,
        "memory": "4Gi",
        "replicas": 3,
        "autoscaling": {
          "enabled": true,
          "minReplicas": 2,
          "maxReplicas": 10,
          "targetCPU": 70
        }
      },
      "database": {
        "type": "rds",
        "instance": "db.r5.large",
        "storage": "100Gi",
        "multiAZ": true,
        "backups": {
          "enabled": true,
          "retention": 30
        }
      },
      "cache": {
        "type": "elasticache",
        "engine": "redis",
        "instance": "cache.m5.large"
      },
      "storage": {
        "type": "s3",
        "versioning": true,
        "lifecycle": [
          {
            "rule": "archive_old_files",
            "days": 90,
            "storageClass": "GLACIER"
          }
        ]
      }
    },
    "environmentVariables": []
  },
  "features": {
    "authentication": true,
    "multiTenancy": true,
    "fileUpload": true,
    "notifications": true,
    "analytics": true,
    "workflows": true,
    "alerts": true,
    "integrations": true,
    "audit": true,
    "search": true,
    "realtime": true,
    "ai": true,
    "caching": true,
    "queues": true
  }
});