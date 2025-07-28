"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaGenerator = void 0;
class SchemaGenerator {
    /**
     * Generate a Prisma schema from API response
     */
    generateFromAPI(apiResponse) {
        const models = [];
        const enums = [];
        const datasources = [
            {
                name: 'db',
                provider: 'postgresql',
                url: 'env("DATABASE_URL")'
            }
        ];
        const generators = [
            {
                name: 'client',
                provider: 'prisma-client-js'
            }
        ];
        // Extract models from API response
        if (apiResponse.endpoints) {
            for (const [endpointName, endpoint] of Object.entries(apiResponse.endpoints)) {
                const model = this.createModelFromEndpoint(endpointName, endpoint);
                if (model) {
                    models.push(model);
                }
            }
        }
        return {
            models,
            enums,
            datasources,
            generators
        };
    }
    /**
     * Generate a Prisma schema from vertical configuration
     */
    generateFromConfig(config) {
        const models = [];
        const enums = [];
        const datasources = [
            {
                name: 'db',
                provider: 'postgresql',
                url: 'env("DATABASE_URL")'
            }
        ];
        const generators = [
            {
                name: 'client',
                provider: 'prisma-client-js'
            }
        ];
        // Add base models
        models.push(...this.getBaseModels());
        // Add configured models
        if (config.database?.models) {
            for (const modelConfig of config.database.models) {
                const model = this.createModelFromConfig(modelConfig);
                models.push(model);
            }
        }
        return {
            models,
            enums,
            datasources,
            generators
        };
    }
    /**
     * Merge multiple schemas into one
     */
    mergeSchemas(schemas) {
        const mergedModels = [];
        const mergedEnums = [];
        const datasources = [
            {
                name: 'db',
                provider: 'postgresql',
                url: 'env("DATABASE_URL")'
            }
        ];
        const generators = [
            {
                name: 'client',
                provider: 'prisma-client-js'
            }
        ];
        // Merge models
        for (const schema of schemas) {
            for (const model of schema.models) {
                const existingModel = mergedModels.find(m => m.name === model.name);
                if (existingModel) {
                    // Merge fields
                    for (const field of model.fields) {
                        const existingField = existingModel.fields.find(f => f.name === field.name);
                        if (!existingField) {
                            existingModel.fields.push(field);
                        }
                    }
                }
                else {
                    mergedModels.push(model);
                }
            }
            // Merge enums
            mergedEnums.push(...schema.enums);
        }
        return {
            models: mergedModels,
            enums: mergedEnums,
            datasources,
            generators
        };
    }
    /**
     * Apply tenant isolation to schema
     */
    applyTenantIsolation(schema) {
        const updatedModels = schema.models.map(model => {
            // Skip base models that already have tenant isolation
            if (['Tenant', 'User', 'Session', 'File', 'AuditLog'].includes(model.name)) {
                return model;
            }
            // Add tenantId field if not present
            const hasTenantId = model.fields.some(field => field.name === 'tenantId');
            if (!hasTenantId) {
                model.fields.push({
                    name: 'tenantId',
                    type: 'String',
                    isRequired: true,
                    isUnique: false,
                    isPrimary: false,
                    relationModel: 'Tenant',
                    relationType: 'manyToOne'
                });
                // Add relation to Tenant
                if (!model.relations) {
                    model.relations = [];
                }
                model.relations.push({
                    name: 'tenant',
                    type: 'manyToOne',
                    modelA: model.name,
                    modelB: 'Tenant',
                    fieldA: 'tenantId',
                    fieldB: 'id'
                });
            }
            return model;
        });
        return {
            ...schema,
            models: updatedModels
        };
    }
    /**
     * Create a model from API endpoint configuration
     */
    createModelFromEndpoint(endpointName, endpoint) {
        const modelName = this.capitalizeFirst(endpointName);
        const fields = [
            {
                name: 'id',
                type: 'String',
                isRequired: true,
                isUnique: true,
                isPrimary: true
            }
        ];
        // Add fields based on request/response schema
        if (endpoint.request_schema) {
            const requestFields = this.extractFieldsFromSchema(endpoint.request_schema);
            fields.push(...requestFields);
        }
        if (endpoint.response_schema) {
            const responseFields = this.extractFieldsFromSchema(endpoint.response_schema);
            fields.push(...responseFields);
        }
        // Add standard fields
        fields.push({
            name: 'createdAt',
            type: 'DateTime',
            isRequired: true,
            isUnique: false,
            isPrimary: false,
            defaultValue: 'now()'
        }, {
            name: 'updatedAt',
            type: 'DateTime',
            isRequired: true,
            isUnique: false,
            isPrimary: false
        });
        return {
            name: modelName,
            fields,
            relations: [],
            indexes: [],
            uniqueConstraints: []
        };
    }
    /**
     * Create a model from configuration
     */
    createModelFromConfig(modelConfig) {
        const fields = [
            {
                name: 'id',
                type: 'String',
                isRequired: true,
                isUnique: true,
                isPrimary: true
            }
        ];
        // Add configured fields
        for (const fieldConfig of modelConfig.fields) {
            fields.push({
                name: fieldConfig.name,
                type: this.mapFieldType(fieldConfig.type),
                isRequired: fieldConfig.required || false,
                isUnique: fieldConfig.unique || false,
                isPrimary: false,
                defaultValue: fieldConfig.defaultValue
            });
        }
        // Add standard fields
        fields.push({
            name: 'createdAt',
            type: 'DateTime',
            isRequired: true,
            isUnique: false,
            isPrimary: false,
            defaultValue: 'now()'
        }, {
            name: 'updatedAt',
            type: 'DateTime',
            isRequired: true,
            isUnique: false,
            isPrimary: false
        });
        // Add relationships
        const relations = [];
        if (modelConfig.relationships) {
            for (const relConfig of modelConfig.relationships) {
                relations.push({
                    name: `${modelConfig.name.toLowerCase()}_${relConfig.model.toLowerCase()}`,
                    type: relConfig.type,
                    modelA: modelConfig.name,
                    modelB: relConfig.model,
                    fieldA: relConfig.foreignKey,
                    fieldB: 'id'
                });
            }
        }
        // Add indexes
        const indexes = [];
        if (modelConfig.indexes) {
            for (const indexConfig of modelConfig.indexes) {
                indexes.push({
                    name: indexConfig.name,
                    fields: indexConfig.fields,
                    type: indexConfig.type
                });
            }
        }
        // Add unique constraints
        const uniqueConstraints = [];
        if (modelConfig.uniqueConstraints) {
            for (const constraintConfig of modelConfig.uniqueConstraints) {
                uniqueConstraints.push({
                    name: constraintConfig.name,
                    fields: constraintConfig.fields
                });
            }
        }
        return {
            name: modelConfig.name,
            fields,
            relations,
            indexes,
            uniqueConstraints
        };
    }
    /**
     * Get base models for the platform
     */
    getBaseModels() {
        return [
            {
                name: 'Tenant',
                fields: [
                    { name: 'id', type: 'String', isRequired: true, isUnique: true, isPrimary: true },
                    { name: 'name', type: 'String', isRequired: true, isUnique: false, isPrimary: false },
                    { name: 'slug', type: 'String', isRequired: true, isUnique: true, isPrimary: false },
                    { name: 'domain', type: 'String', isRequired: false, isUnique: false, isPrimary: false },
                    { name: 'settings', type: 'Json', isRequired: false, isUnique: false, isPrimary: false },
                    { name: 'isActive', type: 'Boolean', isRequired: true, isUnique: false, isPrimary: false, defaultValue: true },
                    { name: 'createdAt', type: 'DateTime', isRequired: true, isUnique: false, isPrimary: false, defaultValue: 'now()' },
                    { name: 'updatedAt', type: 'DateTime', isRequired: true, isUnique: false, isPrimary: false }
                ],
                relations: [],
                indexes: [],
                uniqueConstraints: []
            }
        ];
    }
    /**
     * Extract fields from JSON schema
     */
    extractFieldsFromSchema(schema) {
        const fields = [];
        if (schema.properties) {
            for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
                fields.push({
                    name: fieldName,
                    type: this.mapJsonSchemaType(fieldSchema),
                    isRequired: schema.required?.includes(fieldName) || false,
                    isUnique: false,
                    isPrimary: false
                });
            }
        }
        return fields;
    }
    /**
     * Map JSON schema types to Prisma types
     */
    mapJsonSchemaType(schema) {
        switch (schema.type) {
            case 'string':
                if (schema.format === 'date-time')
                    return 'DateTime';
                if (schema.format === 'email')
                    return 'String';
                return 'String';
            case 'number':
            case 'integer':
                return 'Int';
            case 'boolean':
                return 'Boolean';
            case 'array':
                return 'Json'; // Arrays stored as JSON
            case 'object':
                return 'Json';
            default:
                return 'String';
        }
    }
    /**
     * Map configuration field types to Prisma types
     */
    mapFieldType(type) {
        const typeMap = {
            'string': 'String',
            'number': 'Int',
            'decimal': 'Decimal',
            'boolean': 'Boolean',
            'datetime': 'DateTime',
            'date': 'DateTime',
            'json': 'Json',
            'text': 'String',
            'email': 'String',
            'url': 'String',
            'uuid': 'String'
        };
        return typeMap[type] || 'String';
    }
    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
exports.SchemaGenerator = SchemaGenerator;
//# sourceMappingURL=schema-generator.js.map