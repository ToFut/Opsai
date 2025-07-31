"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataValidator = exports.taskSchema = exports.projectSchema = exports.organizationSchema = exports.userSchema = void 0;
exports.generateTestData = generateTestData;
const zod_1 = require("zod");
/**
 * Data validation helpers for integration testing
 */
exports.userSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    name: zod_1.z.string(),
    role: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    isActive: zod_1.z.boolean(),
    lastLogin: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    preferences: zod_1.z.string(),
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()])
});
exports.organizationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    slug: zod_1.z.string(),
    domain: zod_1.z.string(),
    plan: zod_1.z.string(),
    billingEmail: zod_1.z.string(),
    settings: zod_1.z.string(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()])
});
exports.projectSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    organizationId: zod_1.z.string(),
    ownerId: zod_1.z.string(),
    status: zod_1.z.string(),
    priority: zod_1.z.string(),
    budget: zod_1.z.number(),
    startDate: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    endDate: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    tags: zod_1.z.string(),
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()])
});
exports.taskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    projectId: zod_1.z.string(),
    assignedTo: zod_1.z.string(),
    createdBy: zod_1.z.string(),
    status: zod_1.z.string(),
    priority: zod_1.z.string(),
    estimatedHours: zod_1.z.number().int(),
    actualHours: zod_1.z.number().int(),
    dueDate: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    completedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()])
});
class DataValidator {
    static validateApiResponse(data, entityType) {
        try {
            switch (entityType) {
                case 'user':
                    exports.userSchema.parse(data);
                    return true;
                case 'organization':
                    exports.organizationSchema.parse(data);
                    return true;
                case 'project':
                    exports.projectSchema.parse(data);
                    return true;
                case 'task':
                    exports.taskSchema.parse(data);
                    return true;
                default:
                    console.warn(`Unknown entity type for validation: ${entityType}`);
                    return true;
            }
        }
        catch (error) {
            console.error(`Validation failed for ${entityType}:`, error);
            return false;
        }
    }
    static validateDatabaseRecord(record, entityType) {
        // Database records should have additional fields like id, createdAt, etc.
        const extendedData = {
            ...record,
            id: record.id || 'test-id',
            createdAt: record.createdAt || new Date(),
            updatedAt: record.updatedAt || new Date()
        };
        return this.validateApiResponse(extendedData, entityType);
    }
    static findDataMismatches(apiData, dbData) {
        const mismatches = [];
        Object.keys(apiData).forEach(key => {
            if (apiData[key] !== dbData[key]) {
                mismatches.push(`${key}: API='${apiData[key]}' vs DB='${dbData[key]}'`);
            }
        });
        return mismatches;
    }
}
exports.DataValidator = DataValidator;
function generateTestData(entityType) {
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
//# sourceMappingURL=data-validation.js.map