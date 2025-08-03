import { PrismaSchemaModel, PrismaField } from '../analyzers/schema-analyzer';
import { Logger } from '@opsai/shared';

export interface SchemaValidationConfig {
  strict?: boolean;
  validateRelations?: boolean;
  validateIndexes?: boolean;
  validateBusinessRules?: boolean;
  maxErrors?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  metrics: ValidationMetrics;
}

export interface ValidationError {
  model?: string;
  field?: string;
  type: 'schema' | 'relation' | 'index' | 'business_rule' | 'naming' | 'type_mismatch';
  severity: 'error' | 'critical';
  message: string;
  details?: any;
  fix?: string;
}

export interface ValidationWarning {
  model?: string;
  field?: string;
  type: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
  recommendation?: string;
}

export interface ValidationSuggestion {
  model: string;
  type: 'performance' | 'security' | 'maintainability' | 'best_practice';
  message: string;
  implementation?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ValidationMetrics {
  totalModels: number;
  totalFields: number;
  totalRelations: number;
  totalIndexes: number;
  validationDuration: number;
  complexityScore: number;
}

export class SchemaValidator {
  private config: SchemaValidationConfig;
  private logger: Logger;
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private suggestions: ValidationSuggestion[] = [];

  constructor(config?: SchemaValidationConfig) {
    this.config = {
      strict: true,
      validateRelations: true,
      validateIndexes: true,
      validateBusinessRules: true,
      maxErrors: 100,
      ...config
    };
    this.logger = new Logger('SchemaValidator');
  }

  /**
   * Validate a complete schema
   */
  async validateSchema(models: PrismaSchemaModel[]): Promise<ValidationResult> {
    const startTime = Date.now();
    this.reset();

    this.logger.info(`Validating schema with ${models.length} models`);

    // Basic validation
    this.validateModelNames(models);
    this.validateFieldTypes(models);
    this.validateRequiredFields(models);

    // Relation validation
    if (this.config.validateRelations) {
      this.validateRelations(models);
      this.validateRelationConsistency(models);
    }

    // Index validation
    if (this.config.validateIndexes) {
      this.validateIndexes(models);
      this.validateIndexEfficiency(models);
    }

    // Business rule validation
    if (this.config.validateBusinessRules) {
      this.validateBusinessRules(models);
      this.validateDataIntegrity(models);
    }

    // Generate suggestions
    this.generatePerformanceSuggestions(models);
    this.generateSecuritySuggestions(models);
    this.generateMaintainabilitySuggestions(models);

    const metrics = this.calculateMetrics(models, startTime);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      suggestions: this.suggestions,
      metrics
    };
  }

  /**
   * Validate model names
   */
  private validateModelNames(models: PrismaSchemaModel[]): void {
    const modelNames = new Set<string>();

    for (const model of models) {
      // Check for duplicate names
      if (modelNames.has(model.name)) {
        this.addError({
          model: model.name,
          type: 'schema',
          severity: 'critical',
          message: `Duplicate model name: ${model.name}`,
          fix: `Rename one of the duplicate models`
        });
      }
      modelNames.add(model.name);

      // Check naming conventions
      if (!this.isValidModelName(model.name)) {
        this.addError({
          model: model.name,
          type: 'naming',
          severity: 'error',
          message: `Invalid model name: ${model.name}. Model names should be PascalCase`,
          fix: `Rename to ${this.toPascalCase(model.name)}`
        });
      }

      // Check reserved words
      if (this.isReservedWord(model.name)) {
        this.addError({
          model: model.name,
          type: 'naming',
          severity: 'error',
          message: `Model name '${model.name}' is a reserved word`,
          fix: `Rename to ${model.name}Model or choose a different name`
        });
      }
    }
  }

  /**
   * Validate field types
   */
  private validateFieldTypes(models: PrismaSchemaModel[]): void {
    for (const model of models) {
      const fieldNames = new Set<string>();

      for (const field of model.fields) {
        // Check duplicate field names
        if (fieldNames.has(field.name)) {
          this.addError({
            model: model.name,
            field: field.name,
            type: 'schema',
            severity: 'critical',
            message: `Duplicate field name in model ${model.name}: ${field.name}`
          });
        }
        fieldNames.add(field.name);

        // Validate field type
        if (!this.isValidFieldType(field.type)) {
          this.addError({
            model: model.name,
            field: field.name,
            type: 'type_mismatch',
            severity: 'error',
            message: `Invalid field type '${field.type}' for field ${field.name}`,
            fix: `Use a valid Prisma type like String, Int, Float, Boolean, DateTime, Json`
          });
        }

        // Check field naming
        if (!this.isValidFieldName(field.name)) {
          this.addWarning({
            model: model.name,
            field: field.name,
            type: 'naming',
            message: `Field name '${field.name}' should be camelCase`,
            impact: 'low',
            recommendation: `Rename to ${this.toCamelCase(field.name)}`
          });
        }

        // Validate list fields
        if (field.isList && !field.relation) {
          if (!['String', 'Int', 'Float', 'Boolean', 'Json'].includes(field.type)) {
            this.addError({
              model: model.name,
              field: field.name,
              type: 'type_mismatch',
              severity: 'error',
              message: `List fields can only be primitive types or relations`
            });
          }
        }
      }
    }
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(models: PrismaSchemaModel[]): void {
    for (const model of models) {
      // Check for ID field
      const idField = model.fields.find(f => f.isId);
      if (!idField) {
        this.addError({
          model: model.name,
          type: 'schema',
          severity: 'critical',
          message: `Model ${model.name} is missing an ID field`,
          fix: `Add 'id String @id @default(cuid())' or similar`
        });
      }

      // Check for tenant isolation
      const hasTenantField = model.fields.some(f => f.name === 'tenantId');
      if (!hasTenantField && model.metadata?.requiresTenantIsolation !== false) {
        this.addWarning({
          model: model.name,
          type: 'security',
          message: `Model ${model.name} may need tenant isolation field`,
          impact: 'high',
          recommendation: `Add 'tenantId String' field if this model contains tenant-specific data`
        });
      }

      // Check for audit fields
      const hasCreatedAt = model.fields.some(f => f.name === 'createdAt');
      const hasUpdatedAt = model.fields.some(f => f.name === 'updatedAt');
      
      if (!hasCreatedAt || !hasUpdatedAt) {
        this.addSuggestion({
          model: model.name,
          type: 'best_practice',
          message: `Add audit timestamp fields to ${model.name}`,
          implementation: `createdAt DateTime @default(now())\nupdatedAt DateTime @updatedAt`,
          priority: 'medium'
        });
      }
    }
  }

  /**
   * Validate relations
   */
  private validateRelations(models: PrismaSchemaModel[]): void {
    const modelMap = new Map(models.map(m => [m.name, m]));

    for (const model of models) {
      for (const relation of model.relations) {
        const relatedModel = modelMap.get(relation.model);
        
        if (!relatedModel) {
          this.addError({
            model: model.name,
            field: relation.name,
            type: 'relation',
            severity: 'critical',
            message: `Related model '${relation.model}' not found`,
            details: { relation }
          });
          continue;
        }

        // Check for reverse relation
        const reverseRelation = relatedModel.relations.find(r => 
          r.model === model.name && r.name === relation.fields?.[0]
        );

        if (!reverseRelation && relation.type !== 'implicit') {
          this.addWarning({
            model: model.name,
            field: relation.name,
            type: 'relation',
            message: `Missing reverse relation in ${relation.model}`,
            impact: 'medium',
            recommendation: `Add reverse relation field in ${relation.model} model`
          });
        }

        // Validate relation fields exist
        if (relation.fields) {
          for (const fieldName of relation.fields) {
            const field = model.fields.find(f => f.name === fieldName);
            if (!field) {
              this.addError({
                model: model.name,
                field: relation.name,
                type: 'relation',
                severity: 'error',
                message: `Relation field '${fieldName}' not found in model`
              });
            }
          }
        }
      }
    }
  }

  /**
   * Validate relation consistency
   */
  private validateRelationConsistency(models: PrismaSchemaModel[]): void {
    for (const model of models) {
      // Check for orphaned foreign keys
      const relationFields = new Set(
        model.relations.flatMap(r => r.fields || [])
      );

      for (const field of model.fields) {
        if (field.name.endsWith('Id') && !field.isId) {
          if (!relationFields.has(field.name) && !field.relation) {
            this.addWarning({
              model: model.name,
              field: field.name,
              type: 'relation',
              message: `Field '${field.name}' looks like a foreign key but has no relation`,
              impact: 'medium',
              recommendation: `Add a relation or rename the field if it's not a foreign key`
            });
          }
        }
      }
    }
  }

  /**
   * Validate indexes
   */
  private validateIndexes(models: PrismaSchemaModel[]): void {
    for (const model of models) {
      const indexes = model.directives?.filter(d => d.name === '@@index') || [];
      
      // Check for duplicate indexes
      const indexSignatures = new Set<string>();
      for (const index of indexes) {
        const fields = index.arguments?.fields || [];
        const signature = fields.sort().join(',');
        
        if (indexSignatures.has(signature)) {
          this.addWarning({
            model: model.name,
            type: 'index',
            message: `Duplicate index on fields: ${signature}`,
            impact: 'low',
            recommendation: `Remove duplicate index`
          });
        }
        indexSignatures.add(signature);
      }

      // Check for missing indexes on foreign keys
      for (const relation of model.relations) {
        if (relation.fields && relation.fields.length > 0) {
          const hasIndex = indexes.some(idx => {
            const indexFields = idx.arguments?.fields || [];
            return relation.fields!.every(f => indexFields.includes(f));
          });

          if (!hasIndex) {
            this.addSuggestion({
              model: model.name,
              type: 'performance',
              message: `Add index for foreign key ${relation.fields.join(', ')}`,
              implementation: `@@index([${relation.fields.join(', ')}])`,
              priority: 'high'
            });
          }
        }
      }
    }
  }

  /**
   * Validate index efficiency
   */
  private validateIndexEfficiency(models: PrismaSchemaModel[]): void {
    for (const model of models) {
      const indexes = model.directives?.filter(d => d.name === '@@index') || [];
      
      // Check for redundant indexes
      for (let i = 0; i < indexes.length; i++) {
        for (let j = i + 1; j < indexes.length; j++) {
          const fields1 = indexes[i].arguments?.fields || [];
          const fields2 = indexes[j].arguments?.fields || [];
          
          // Check if one index is a prefix of another
          if (this.isIndexPrefix(fields1, fields2)) {
            this.addWarning({
              model: model.name,
              type: 'index',
              message: `Index on [${fields1.join(', ')}] may be redundant with [${fields2.join(', ')}]`,
              impact: 'medium',
              recommendation: `Consider removing the shorter index`
            });
          }
        }
      }

      // Check for over-indexing
      if (indexes.length > model.fields.length * 0.5) {
        this.addWarning({
          model: model.name,
          type: 'index',
          message: `Model has too many indexes (${indexes.length} indexes for ${model.fields.length} fields)`,
          impact: 'medium',
          recommendation: `Review and remove unnecessary indexes`
        });
      }
    }
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(models: PrismaSchemaModel[]): void {
    for (const model of models) {
      // Validate status fields
      const statusField = model.fields.find(f => 
        f.name === 'status' || f.name.endsWith('Status')
      );
      
      if (statusField && statusField.type === 'String' && !statusField.validation?.includes('@db.VarChar')) {
        this.addSuggestion({
          model: model.name,
          type: 'best_practice',
          message: `Consider using an enum for status field '${statusField.name}'`,
          implementation: `enum ${model.name}Status { ACTIVE INACTIVE PENDING }`,
          priority: 'medium'
        });
      }

      // Validate monetary fields
      const moneyFields = model.fields.filter(f => 
        f.name.includes('price') || f.name.includes('amount') || 
        f.name.includes('cost') || f.name.includes('fee')
      );

      for (const field of moneyFields) {
        if (field.type === 'Float') {
          this.addWarning({
            model: model.name,
            field: field.name,
            type: 'business_rule',
            message: `Monetary field '${field.name}' uses Float type`,
            impact: 'high',
            recommendation: `Use Decimal type for monetary values: Decimal @db.Decimal(10, 2)`
          });
        }
      }

      // Validate email fields
      const emailFields = model.fields.filter(f => f.name.includes('email'));
      for (const field of emailFields) {
        if (!field.validation?.some(v => v.includes('email'))) {
          this.addSuggestion({
            model: model.name,
            type: 'maintainability',
            message: `Add email validation for field '${field.name}'`,
            implementation: `Add validation in application layer`,
            priority: 'medium'
          });
        }
      }
    }
  }

  /**
   * Validate data integrity rules
   */
  private validateDataIntegrity(models: PrismaSchemaModel[]): void {
    for (const model of models) {
      // Check for soft delete pattern
      const hasDeletedAt = model.fields.some(f => f.name === 'deletedAt');
      if (hasDeletedAt) {
        // Ensure all unique constraints exclude soft-deleted records
        const uniqueConstraints = model.directives?.filter(d => 
          d.name === '@@unique'
        ) || [];

        for (const constraint of uniqueConstraints) {
          const fields = constraint.arguments?.fields || [];
          if (!fields.includes('deletedAt')) {
            this.addWarning({
              model: model.name,
              type: 'business_rule',
              message: `Unique constraint doesn't account for soft deletes`,
              impact: 'high',
              recommendation: `Include deletedAt in unique constraint or use partial index`
            });
          }
        }
      }

      // Check for cascade delete safety
      for (const relation of model.relations) {
        if (relation.onDelete === 'Cascade' && model.metadata?.isCore) {
          this.addWarning({
            model: model.name,
            field: relation.name,
            type: 'business_rule',
            message: `Cascade delete on core entity relation`,
            impact: 'high',
            recommendation: `Consider using SetNull or Restrict for safer deletion`
          });
        }
      }
    }
  }

  /**
   * Generate performance suggestions
   */
  private generatePerformanceSuggestions(models: PrismaSchemaModel[]): void {
    for (const model of models) {
      // Suggest composite indexes for common query patterns
      const relatedFields = model.relations
        .filter(r => r.fields && r.fields.length === 1)
        .map(r => r.fields![0]);

      if (relatedFields.length > 1) {
        this.addSuggestion({
          model: model.name,
          type: 'performance',
          message: `Consider composite index for related fields`,
          implementation: `@@index([${relatedFields.join(', ')}])`,
          priority: 'medium'
        });
      }

      // Suggest indexes for frequently queried fields
      const queryableFields = model.fields.filter(f => 
        f.businessMeaning === 'status' || 
        f.businessMeaning === 'date' ||
        f.name.includes('code') ||
        f.name.includes('number')
      );

      for (const field of queryableFields) {
        const hasIndex = model.directives?.some(d => 
          d.name === '@@index' && d.arguments?.fields?.includes(field.name)
        );

        if (!hasIndex && !field.isId) {
          this.addSuggestion({
            model: model.name,
            type: 'performance',
            message: `Add index for frequently queried field '${field.name}'`,
            implementation: `@@index([${field.name}])`,
            priority: 'medium'
          });
        }
      }
    }
  }

  /**
   * Generate security suggestions
   */
  private generateSecuritySuggestions(models: PrismaSchemaModel[]): void {
    for (const model of models) {
      // Check for PII fields without encryption
      const piiFields = model.fields.filter(f => 
        f.name.includes('ssn') || f.name.includes('password') || 
        f.name.includes('creditCard') || f.name.includes('bankAccount')
      );

      for (const field of piiFields) {
        this.addSuggestion({
          model: model.name,
          type: 'security',
          message: `Sensitive field '${field.name}' should be encrypted`,
          implementation: `Implement field-level encryption in application layer`,
          priority: 'high'
        });
      }

      // Check for missing access control fields
      if (model.metadata?.requiresAccessControl) {
        const hasOwnerField = model.fields.some(f => 
          f.name === 'ownerId' || f.name === 'userId' || f.name === 'createdBy'
        );

        if (!hasOwnerField) {
          this.addSuggestion({
            model: model.name,
            type: 'security',
            message: `Add ownership field for access control`,
            implementation: `ownerId String\nowner User @relation(fields: [ownerId], references: [id])`,
            priority: 'high'
          });
        }
      }
    }
  }

  /**
   * Generate maintainability suggestions
   */
  private generateMaintainabilitySuggestions(models: PrismaSchemaModel[]): void {
    for (const model of models) {
      // Suggest documentation
      if (!model.documentation) {
        this.addSuggestion({
          model: model.name,
          type: 'maintainability',
          message: `Add documentation for model ${model.name}`,
          implementation: `/// ${model.metadata?.businessEntity || model.name} entity documentation`,
          priority: 'low'
        });
      }

      // Check field documentation for complex fields
      const complexFields = model.fields.filter(f => 
        f.type === 'Json' || f.relation || f.validation?.length > 2
      );

      for (const field of complexFields) {
        if (!field.documentation) {
          this.addSuggestion({
            model: model.name,
            type: 'maintainability',
            message: `Document complex field '${field.name}'`,
            implementation: `/// ${field.businessMeaning || 'Field description'}`,
            priority: 'low'
          });
        }
      }
    }
  }

  // Helper methods
  private reset(): void {
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
  }

  private addError(error: ValidationError): void {
    if (this.errors.length < this.config.maxErrors!) {
      this.errors.push(error);
    }
  }

  private addWarning(warning: ValidationWarning): void {
    this.warnings.push(warning);
  }

  private addSuggestion(suggestion: ValidationSuggestion): void {
    this.suggestions.push(suggestion);
  }

  private isValidModelName(name: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name);
  }

  private isValidFieldName(name: string): boolean {
    return /^[a-z][a-zA-Z0-9]*$/.test(name);
  }

  private isValidFieldType(type: string): boolean {
    const validTypes = [
      'String', 'Boolean', 'Int', 'BigInt', 'Float', 'Decimal',
      'DateTime', 'Json', 'Bytes'
    ];
    return validTypes.includes(type) || /^[A-Z][a-zA-Z0-9]*$/.test(type);
  }

  private isReservedWord(word: string): boolean {
    const reserved = ['User', 'Account', 'Session', 'model', 'enum'];
    return reserved.includes(word);
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      word.toUpperCase()
    ).replace(/[\s-_]+/g, '');
  }

  private toCamelCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    ).replace(/[\s-_]+/g, '');
  }

  private isIndexPrefix(fields1: string[], fields2: string[]): boolean {
    if (fields1.length >= fields2.length) return false;
    return fields1.every((field, index) => field === fields2[index]);
  }

  private calculateMetrics(models: PrismaSchemaModel[], startTime: number): ValidationMetrics {
    const totalFields = models.reduce((sum, m) => sum + m.fields.length, 0);
    const totalRelations = models.reduce((sum, m) => sum + m.relations.length, 0);
    const totalIndexes = models.reduce((sum, m) => 
      sum + (m.directives?.filter(d => d.name === '@@index').length || 0), 0
    );

    const complexityScore = (
      models.length * 1 +
      totalFields * 0.5 +
      totalRelations * 2 +
      totalIndexes * 0.3
    ) / models.length;

    return {
      totalModels: models.length,
      totalFields,
      totalRelations,
      totalIndexes,
      validationDuration: Date.now() - startTime,
      complexityScore: Math.round(complexityScore * 10) / 10
    };
  }
}

// Factory function
export function createSchemaValidator(config?: SchemaValidationConfig): SchemaValidator {
  return new SchemaValidator(config);
}