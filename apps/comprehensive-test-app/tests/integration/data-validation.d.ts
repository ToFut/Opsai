import { z } from 'zod';
/**
 * Data validation helpers for integration testing
 */
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodString;
    organizationId: z.ZodString;
    isActive: z.ZodBoolean;
    lastLogin: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    preferences: z.ZodString;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    id: string;
    role: string;
    organizationId: string;
    isActive: boolean;
    lastLogin: string | Date;
    preferences: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}, {
    email: string;
    name: string;
    id: string;
    role: string;
    organizationId: string;
    isActive: boolean;
    lastLogin: string | Date;
    preferences: string;
    createdAt: string | Date;
    updatedAt: string | Date;
}>;
export declare const organizationSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    domain: z.ZodString;
    plan: z.ZodString;
    billingEmail: z.ZodString;
    settings: z.ZodString;
    isActive: z.ZodBoolean;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    isActive: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    slug: string;
    domain: string;
    plan: string;
    billingEmail: string;
    settings: string;
}, {
    name: string;
    id: string;
    isActive: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    slug: string;
    domain: string;
    plan: string;
    billingEmail: string;
    settings: string;
}>;
export declare const projectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    organizationId: z.ZodString;
    ownerId: z.ZodString;
    status: z.ZodString;
    priority: z.ZodString;
    budget: z.ZodNumber;
    startDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    endDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    tags: z.ZodString;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    organizationId: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    status: string;
    description: string;
    ownerId: string;
    priority: string;
    budget: number;
    startDate: string | Date;
    endDate: string | Date;
    tags: string;
}, {
    name: string;
    id: string;
    organizationId: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    status: string;
    description: string;
    ownerId: string;
    priority: string;
    budget: number;
    startDate: string | Date;
    endDate: string | Date;
    tags: string;
}>;
export declare const taskSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    projectId: z.ZodString;
    assignedTo: z.ZodString;
    createdBy: z.ZodString;
    status: z.ZodString;
    priority: z.ZodString;
    estimatedHours: z.ZodNumber;
    actualHours: z.ZodNumber;
    dueDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    completedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    updatedAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    status: string;
    description: string;
    priority: string;
    title: string;
    projectId: string;
    assignedTo: string;
    createdBy: string;
    estimatedHours: number;
    actualHours: number;
    dueDate: string | Date;
    completedAt: string | Date;
}, {
    id: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    status: string;
    description: string;
    priority: string;
    title: string;
    projectId: string;
    assignedTo: string;
    createdBy: string;
    estimatedHours: number;
    actualHours: number;
    dueDate: string | Date;
    completedAt: string | Date;
}>;
export declare class DataValidator {
    static validateApiResponse(data: any, entityType: string): boolean;
    static validateDatabaseRecord(record: any, entityType: string): boolean;
    static findDataMismatches(apiData: any, dbData: any): string[];
}
export declare function generateTestData(entityType: string): any;
//# sourceMappingURL=data-validation.d.ts.map