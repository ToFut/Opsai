import { z } from 'zod';

/**
 * Data validation helpers for integration testing
 */


export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.any(),
  organizationId: z.string(),
  isActive: z.boolean(),
  lastLogin: z.union([z.string(), z.date()]),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()])
});


export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  plan: z.any(),
  billingEmail: z.string(),
  settings: z.any(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()])
});


export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  organizationId: z.string(),
  status: z.any(),
  budget: z.number(),
  startDate: z.union([z.string(), z.date()]),
  endDate: z.union([z.string(), z.date()]),
  createdBy: z.string(),
  tags: z.any(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()])
});


export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  projectId: z.string(),
  assignedTo: z.string(),
  priority: z.any(),
  status: z.any(),
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
      "role": "test-value",
      "organizationId": "Test organizationId",
      "isActive": true,
      "lastLogin": "2025-07-30T22:32:47.812Z",
      "createdAt": "2025-07-30T22:32:47.812Z",
      "updatedAt": "2025-07-30T22:32:47.812Z"
};
    case 'organization':
      return {
      "name": "Test Name",
      "domain": "Test domain",
      "plan": "test-value",
      "billingEmail": "test@example.com",
      "settings": "test-value",
      "createdAt": "2025-07-30T22:32:47.812Z",
      "updatedAt": "2025-07-30T22:32:47.812Z"
};
    case 'project':
      return {
      "name": "Test Name",
      "description": "Test description",
      "organizationId": "Test organizationId",
      "status": "test-value",
      "budget": 42,
      "startDate": "2025-07-30T22:32:47.812Z",
      "endDate": "2025-07-30T22:32:47.812Z",
      "createdBy": "Test createdBy",
      "tags": "test-value",
      "createdAt": "2025-07-30T22:32:47.812Z",
      "updatedAt": "2025-07-30T22:32:47.812Z"
};
    case 'task':
      return {
      "title": "Test title",
      "description": "Test description",
      "projectId": "Test projectId",
      "assignedTo": "Test assignedTo",
      "priority": "test-value",
      "status": "test-value",
      "dueDate": "2025-07-30T22:32:47.812Z",
      "completedAt": "2025-07-30T22:32:47.812Z",
      "createdAt": "2025-07-30T22:32:47.812Z",
      "updatedAt": "2025-07-30T22:32:47.812Z"
};
    default:
      return { name: 'Test Data', value: 'test' };
  }
}