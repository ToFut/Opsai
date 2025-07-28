import { PrismaSchema } from '@opsai/shared';
export declare class SchemaGenerator {
    /**
     * Generate a Prisma schema from API response
     */
    generateFromAPI(apiResponse: any): PrismaSchema;
    /**
     * Generate a Prisma schema from vertical configuration
     */
    generateFromConfig(config: any): PrismaSchema;
    /**
     * Merge multiple schemas into one
     */
    mergeSchemas(schemas: PrismaSchema[]): PrismaSchema;
    /**
     * Apply tenant isolation to schema
     */
    applyTenantIsolation(schema: PrismaSchema): PrismaSchema;
    /**
     * Create a model from API endpoint configuration
     */
    private createModelFromEndpoint;
    /**
     * Create a model from configuration
     */
    private createModelFromConfig;
    /**
     * Get base models for the platform
     */
    private getBaseModels;
    /**
     * Extract fields from JSON schema
     */
    private extractFieldsFromSchema;
    /**
     * Map JSON schema types to Prisma types
     */
    private mapJsonSchemaType;
    /**
     * Map configuration field types to Prisma types
     */
    private mapFieldType;
    /**
     * Capitalize first letter
     */
    private capitalizeFirst;
}
//# sourceMappingURL=schema-generator.d.ts.map