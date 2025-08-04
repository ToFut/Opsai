import { z } from 'zod';

/**
 * Data validation helpers for integration testing
 */


export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  isActive: z.boolean(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()])
});


export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  ownerId: z.string(),
  status: z.string(),
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
        case 'project':
          projectSchema.parse(data);
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
      "isActive": true,
      "createdAt": "2025-08-01T18:15:37.561Z",
      "updatedAt": "2025-08-01T18:15:37.561Z"
};
    case 'project':
      return {
      "name": "Test Name",
      "description": "Test description",
      "ownerId": "Test ownerId",
      "status": "Test status",
      "createdAt": "2025-08-01T18:15:37.561Z",
      "updatedAt": "2025-08-01T18:15:37.561Z"
};
    default:
      return { name: 'Test Data', value: 'test' };
  }
}