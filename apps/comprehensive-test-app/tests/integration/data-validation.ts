import { z } from 'zod';

/**
 * Data validation helpers for integration testing
 */


export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  organizationId: z.string(),
  isActive: z.boolean(),
  lastLogin: z.union([z.string(), z.date()]),
  preferences: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()])
});


export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  domain: z.string(),
  plan: z.string(),
  billingEmail: z.string(),
  settings: z.string(),
  isActive: z.boolean(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()])
});


export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  organizationId: z.string(),
  ownerId: z.string(),
  status: z.string(),
  priority: z.string(),
  budget: z.number(),
  startDate: z.union([z.string(), z.date()]),
  endDate: z.union([z.string(), z.date()]),
  tags: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()])
});


export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  projectId: z.string(),
  assignedTo: z.string(),
  createdBy: z.string(),
  status: z.string(),
  priority: z.string(),
  estimatedHours: z.number().int(),
  actualHours: z.number().int(),
  dueDate: z.union([z.string(), z.date()]),
  completedAt: z.union([z.string(), z.date()]),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()])
});

export class DataValidator {
  static validateApiResponse(data: any, entityType: string): boolean {
    try {
      switch (entityType) {
        
        case 'user':
          userSchema.parse(data);
          return true;
        case 'organization':
          organizationSchema.parse(data);
          return true;
        case 'project':
          projectSchema.parse(data);
          return true;
        case 'task':
          taskSchema.parse(data);
          return true;
        default:
          console.warn(`Unknown entity type for validation: ${entityType}`);
          return true;
      }
    } catch (error) {
      console.error(`Validation failed for ${entityType}:`, error);
      return false;
    }
  }

  static validateDatabaseRecord(record: any, entityType: string): boolean {
    // Database records should have additional fields like id, createdAt, etc.
    const extendedData = {
      ...record,
      id: record.id || 'test-id',
      createdAt: record.createdAt || new Date(),
      updatedAt: record.updatedAt || new Date()
    };

    return this.validateApiResponse(extendedData, entityType);
  }

  static findDataMismatches(apiData: any, dbData: any): string[] {
    const mismatches: string[] = [];
    
    Object.keys(apiData).forEach(key => {
      if (apiData[key] !== dbData[key]) {
        mismatches.push(`${key}: API='${apiData[key]}' vs DB='${dbData[key]}'`);
      }
    });

    return mismatches;
  }
}

export function generateTestData(entityType: string): any {
  switch (entityType) {
    
    case 'user':
      return {
      "email": "test@example.com",
      "name": "Test Name",
      "role": "Test role",
      "organizationId": "Test organizationId",
      "isActive": true,
      "lastLogin": "2025-07-31T00:28:06.766Z",
      "preferences": "Test preferences",
      "createdAt": "2025-07-31T00:28:06.766Z",
      "updatedAt": "2025-07-31T00:28:06.766Z"
};
    case 'organization':
      return {
      "name": "Test Name",
      "slug": "Test slug",
      "domain": "Test domain",
      "plan": "Test plan",
      "billingEmail": "test@example.com",
      "settings": "Test settings",
      "isActive": true,
      "createdAt": "2025-07-31T00:28:06.766Z",
      "updatedAt": "2025-07-31T00:28:06.766Z"
};
    case 'project':
      return {
      "name": "Test Name",
      "description": "Test description",
      "organizationId": "Test organizationId",
      "ownerId": "Test ownerId",
      "status": "Test status",
      "priority": "Test priority",
      "budget": 42,
      "startDate": "2025-07-31T00:28:06.766Z",
      "endDate": "2025-07-31T00:28:06.766Z",
      "tags": "Test tags",
      "createdAt": "2025-07-31T00:28:06.766Z",
      "updatedAt": "2025-07-31T00:28:06.766Z"
};
    case 'task':
      return {
      "title": "Test title",
      "description": "Test description",
      "projectId": "Test projectId",
      "assignedTo": "Test assignedTo",
      "createdBy": "Test createdBy",
      "status": "Test status",
      "priority": "Test priority",
      "estimatedHours": 1,
      "actualHours": 1,
      "dueDate": "2025-07-31T00:28:06.766Z",
      "completedAt": "2025-07-31T00:28:06.766Z",
      "createdAt": "2025-07-31T00:28:06.766Z",
      "updatedAt": "2025-07-31T00:28:06.766Z"
};
    default:
      return { name: 'Test Data', value: 'test' };
  }
}