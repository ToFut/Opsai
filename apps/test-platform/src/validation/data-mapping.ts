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
          apiField: 'userId',
          dbField: 'userId',
          required: true,
          
          
        },
        
        {
          apiField: 'status',
          dbField: 'status',
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
    "name": "test-platform",
    "displayName": "Test Platform",
    "description": "Testing fixed schema generation",
    "version": "1.0.0",
    "author": "OPSAI",
    "license": "MIT"
  },
  "services": {
    "mode": "shared",
    "tenantId": "test-platform",
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
    "integrations": []
  },
  "database": {
    "type": "sqlite",
    "entities": [
      {
        "name": "User",
        "displayName": "Users",
        "description": "Application users",
        "fields": {
          "id": {
            "type": "string",
            "primary": true,
            "unique": true
          },
          "email": {
            "type": "string",
            "required": true,
            "unique": true
          },
          "name": {
            "type": "string",
            "required": true
          },
          "role": {
            "type": "string",
            "default": "user"
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
        }
      },
      {
        "name": "Project",
        "displayName": "Projects",
        "description": "User projects",
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
          "userId": {
            "type": "string",
            "required": true
          },
          "status": {
            "type": "string",
            "default": "active"
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
            "model": "User",
            "foreign_key": "userId"
          }
        ]
      }
    ]
  },
  "workflows": [],
  "ui": {
    "theme": {},
    "pages": []
  },
  "alerts": {
    "rules": []
  },
  "deployment": {},
  "features": {
    "authentication": true,
    "multiTenancy": false,
    "fileUpload": false,
    "notifications": false,
    "analytics": false,
    "workflows": false,
    "alerts": true,
    "integrations": false,
    "audit": false
  }
});