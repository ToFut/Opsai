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
    
    // user mapping
    this.mappings.set('user', {
      entityName: 'user',
      fields: [
        
        {
          apiField: 'id',
          dbField: 'id',
          required: true,
          
          
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
          required: true,
          
          validation: (value) => ["admin","user","viewer"].includes(value),
        },
        
        {
          apiField: 'isActive',
          dbField: 'isActive',
          required: false,
          
          
        },
        
        {
          apiField: 'createdAt',
          dbField: 'createdAt',
          required: true,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        },
        
        {
          apiField: 'updatedAt',
          dbField: 'updatedAt',
          required: true,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        }
      ]
    });

    // project mapping
    this.mappings.set('project', {
      entityName: 'project',
      fields: [
        
        {
          apiField: 'id',
          dbField: 'id',
          required: true,
          
          
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
          apiField: 'ownerId',
          dbField: 'ownerId',
          required: true,
          
          
        },
        
        {
          apiField: 'status',
          dbField: 'status',
          required: false,
          
          validation: (value) => ["draft","active","completed","archived"].includes(value),
        },
        
        {
          apiField: 'createdAt',
          dbField: 'createdAt',
          required: true,
          transformation: (value) => typeof value === "string" ? new Date(value) : value,
          
        },
        
        {
          apiField: 'updatedAt',
          dbField: 'updatedAt',
          required: true,
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
    "name": "demo-saas-app",
    "displayName": "Demo SaaS Application",
    "description": "A demonstration SaaS application with core features",
    "version": "1.0.0",
    "author": "OpsAI Platform",
    "license": "MIT"
  },
  "services": {
    "mode": "shared",
    "tenantId": "demo-saas-app",
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
        "name": "email-service",
        "mode": "user-api-key"
      }
    ]
  },
  "database": {
    "type": "postgresql",
    "entities": [
      {
        "name": "user",
        "displayName": "Users",
        "description": "Application users",
        "fields": {
          "id": {
            "type": "string",
            "required": true,
            "unique": true,
            "ui": {
              "widget": "input",
              "label": "ID"
            }
          },
          "email": {
            "type": "string",
            "required": true,
            "unique": true,
            "validation": {
              "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
            },
            "ui": {
              "widget": "input",
              "label": "Email",
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
            "type": "string",
            "required": true,
            "default": "user",
            "validation": {
              "enum": [
                "admin",
                "user",
                "viewer"
              ]
            },
            "ui": {
              "widget": "select",
              "label": "Role",
              "options": [
                {
                  "label": "Administrator",
                  "value": "admin"
                },
                {
                  "label": "User",
                  "value": "user"
                },
                {
                  "label": "Viewer",
                  "value": "viewer"
                }
              ]
            }
          },
          "isActive": {
            "type": "boolean",
            "default": true,
            "ui": {
              "widget": "checkbox",
              "label": "Active"
            }
          },
          "createdAt": {
            "type": "date",
            "required": true,
            "ui": {
              "widget": "date",
              "label": "Created At"
            }
          },
          "updatedAt": {
            "type": "date",
            "required": true,
            "ui": {
              "widget": "date",
              "label": "Updated At"
            }
          }
        }
      },
      {
        "name": "project",
        "displayName": "Projects",
        "description": "User projects",
        "fields": {
          "id": {
            "type": "string",
            "required": true,
            "unique": true,
            "ui": {
              "widget": "input",
              "label": "ID"
            }
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
          "ownerId": {
            "type": "string",
            "required": true,
            "ui": {
              "widget": "select",
              "label": "Owner"
            }
          },
          "status": {
            "type": "string",
            "default": "draft",
            "validation": {
              "enum": [
                "draft",
                "active",
                "completed",
                "archived"
              ]
            },
            "ui": {
              "widget": "select",
              "label": "Status",
              "options": [
                {
                  "label": "Draft",
                  "value": "draft"
                },
                {
                  "label": "Active",
                  "value": "active"
                },
                {
                  "label": "Completed",
                  "value": "completed"
                },
                {
                  "label": "Archived",
                  "value": "archived"
                }
              ]
            }
          },
          "createdAt": {
            "type": "date",
            "required": true,
            "ui": {
              "widget": "date",
              "label": "Created At"
            }
          },
          "updatedAt": {
            "type": "date",
            "required": true,
            "ui": {
              "widget": "date",
              "label": "Updated At"
            }
          }
        }
      }
    ]
  },
  "workflows": [
    {
      "name": "user-onboarding",
      "description": "Onboard new users with welcome email",
      "trigger": {
        "type": "event",
        "config": {
          "event": "user.created"
        }
      },
      "steps": [
        {
          "name": "send-welcome-email",
          "type": "api-call",
          "config": {
            "integration": "email-service",
            "endpoint": "send-email",
            "template": "welcome-email"
          },
          "retry": {
            "attempts": 3,
            "delay": 5000
          }
        }
      ]
    }
  ],
  "ui": {
    "theme": "default",
    "pages": [
      {
        "name": "dashboard",
        "path": "/",
        "title": "Dashboard",
        "description": "Main dashboard",
        "layout": "default",
        "components": [
          {
            "type": "stats",
            "config": {
              "title": "Overview",
              "stats": [
                {
                  "label": "Total Users",
                  "value": "{{count('user')}}"
                },
                {
                  "label": "Active Projects",
                  "value": "{{count('project', {status: 'active'})}}"
                }
              ]
            }
          }
        ],
        "permissions": [
          "admin",
          "user",
          "viewer"
        ]
      },
      {
        "name": "users",
        "path": "/users",
        "title": "Users",
        "description": "Manage application users",
        "layout": "list",
        "components": [
          {
            "type": "table",
            "config": {
              "entity": "user",
              "columns": [
                "name",
                "email",
                "role",
                "isActive",
                "createdAt"
              ],
              "actions": [
                "create",
                "edit",
                "delete"
              ]
            }
          }
        ],
        "permissions": [
          "admin"
        ]
      },
      {
        "name": "projects",
        "path": "/projects",
        "title": "Projects",
        "description": "Manage projects",
        "layout": "list",
        "components": [
          {
            "type": "table",
            "config": {
              "entity": "project",
              "columns": [
                "name",
                "description",
                "status",
                "createdAt",
                "updatedAt"
              ],
              "actions": [
                "create",
                "edit",
                "delete"
              ]
            }
          }
        ],
        "permissions": [
          "admin",
          "user"
        ]
      }
    ]
  },
  "alerts": {
    "rules": []
  },
  "deployment": {},
  "features": {
    "authentication": true,
    "multiTenancy": false,
    "fileUpload": true,
    "notifications": true,
    "analytics": false,
    "workflows": true,
    "alerts": true,
    "integrations": true,
    "cron": false
  }
});