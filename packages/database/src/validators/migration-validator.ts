import { PrismaSchemaModel } from '../analyzers/schema-analyzer';
import { Logger } from '@opsai/shared';

export interface MigrationValidationConfig {
  allowBreakingChanges?: boolean;
  validateDataIntegrity?: boolean;
  checkPerformanceImpact?: boolean;
  estimateDowntime?: boolean;
}

export interface MigrationValidationResult {
  safe: boolean;
  breakingChanges: BreakingChange[];
  warnings: MigrationWarning[];
  steps: MigrationStep[];
  estimatedImpact: MigrationImpact;
  rollbackPlan: RollbackStep[];
}

export interface BreakingChange {
  type: 'column_removal' | 'type_change' | 'relation_removal' | 'constraint_change' | 'table_removal';
  model: string;
  field?: string;
  description: string;
  impact: 'data_loss' | 'incompatible' | 'performance';
  migrationStrategy?: string;
}

export interface MigrationWarning {
  type: string;
  model: string;
  field?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  recommendation?: string;
}

export interface MigrationStep {
  order: number;
  type: 'schema' | 'data' | 'index' | 'constraint';
  description: string;
  sql?: string;
  requiresDowntime: boolean;
  estimatedDuration: number; // in seconds
  validation?: string;
}

export interface MigrationImpact {
  requiresDowntime: boolean;
  estimatedDowntime: number; // in seconds
  dataVolume: 'low' | 'medium' | 'high';
  performanceImpact: 'minimal' | 'moderate' | 'significant';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RollbackStep {
  order: number;
  description: string;
  sql?: string;
  validation?: string;
}

export class MigrationValidator {
  private config: MigrationValidationConfig;
  private logger: Logger;

  constructor(config?: MigrationValidationConfig) {
    this.config = {
      allowBreakingChanges: false,
      validateDataIntegrity: true,
      checkPerformanceImpact: true,
      estimateDowntime: true,
      ...config
    };
    this.logger = new Logger('MigrationValidator');
  }

  /**
   * Validate migration compatibility between schemas
   */
  async validateMigration(
    currentSchema: PrismaSchemaModel[],
    targetSchema: PrismaSchemaModel[]
  ): Promise<MigrationValidationResult> {
    this.logger.info('Validating migration compatibility');

    const breakingChanges = this.detectBreakingChanges(currentSchema, targetSchema);
    const warnings = this.generateWarnings(currentSchema, targetSchema);
    const steps = this.generateMigrationSteps(currentSchema, targetSchema);
    const estimatedImpact = this.estimateImpact(steps, breakingChanges);
    const rollbackPlan = this.generateRollbackPlan(steps);

    const safe = breakingChanges.length === 0 || 
                 (this.config.allowBreakingChanges && this.hasValidMigrationStrategies(breakingChanges));

    return {
      safe,
      breakingChanges,
      warnings,
      steps,
      estimatedImpact,
      rollbackPlan
    };
  }

  /**
   * Detect breaking changes between schemas
   */
  private detectBreakingChanges(
    currentSchema: PrismaSchemaModel[],
    targetSchema: PrismaSchemaModel[]
  ): BreakingChange[] {
    const breakingChanges: BreakingChange[] = [];
    const currentModels = new Map(currentSchema.map(m => [m.name, m]));
    const targetModels = new Map(targetSchema.map(m => [m.name, m]));

    // Check for removed models
    for (const [name, model] of currentModels) {
      if (!targetModels.has(name)) {
        breakingChanges.push({
          type: 'table_removal',
          model: name,
          description: `Table '${name}' will be removed`,
          impact: 'data_loss',
          migrationStrategy: `Archive data from ${name} table before removal`
        });
      }
    }

    // Check for changes in existing models
    for (const [name, currentModel] of currentModels) {
      const targetModel = targetModels.get(name);
      if (!targetModel) continue;

      // Check for removed fields
      const currentFields = new Map(currentModel.fields.map(f => [f.name, f]));
      const targetFields = new Map(targetModel.fields.map(f => [f.name, f]));

      for (const [fieldName, field] of currentFields) {
        if (!targetFields.has(fieldName)) {
          breakingChanges.push({
            type: 'column_removal',
            model: name,
            field: fieldName,
            description: `Column '${fieldName}' will be removed from '${name}'`,
            impact: 'data_loss',
            migrationStrategy: `Archive or migrate data from ${fieldName} column`
          });
        }
      }

      // Check for type changes
      for (const [fieldName, currentField] of currentFields) {
        const targetField = targetFields.get(fieldName);
        if (!targetField) continue;

        if (currentField.type !== targetField.type) {
          const compatible = this.areTypesCompatible(currentField.type, targetField.type);
          if (!compatible) {
            breakingChanges.push({
              type: 'type_change',
              model: name,
              field: fieldName,
              description: `Type change from ${currentField.type} to ${targetField.type}`,
              impact: 'incompatible',
              migrationStrategy: this.getTypeConversionStrategy(currentField.type, targetField.type)
            });
          }
        }

        // Check for nullability changes
        if (!currentField.isOptional && targetField.isOptional) {
          // This is safe - making required field optional
        } else if (currentField.isOptional && !targetField.isOptional) {
          breakingChanges.push({
            type: 'constraint_change',
            model: name,
            field: fieldName,
            description: `Field '${fieldName}' changing from optional to required`,
            impact: 'incompatible',
            migrationStrategy: `Ensure all existing records have non-null values for ${fieldName}`
          });
        }
      }

      // Check for removed relations
      const currentRelations = new Map(currentModel.relations.map(r => [r.name, r]));
      const targetRelations = new Map(targetModel.relations.map(r => [r.name, r]));

      for (const [relationName, relation] of currentRelations) {
        if (!targetRelations.has(relationName)) {
          breakingChanges.push({
            type: 'relation_removal',
            model: name,
            field: relationName,
            description: `Relation '${relationName}' will be removed`,
            impact: 'data_loss',
            migrationStrategy: `Handle orphaned records before removing relation`
          });
        }
      }
    }

    return breakingChanges;
  }

  /**
   * Generate migration warnings
   */
  private generateWarnings(
    currentSchema: PrismaSchemaModel[],
    targetSchema: PrismaSchemaModel[]
  ): MigrationWarning[] {
    const warnings: MigrationWarning[] = [];
    const targetModels = new Map(targetSchema.map(m => [m.name, m]));

    for (const targetModel of targetSchema) {
      // Warn about large table alterations
      const currentModel = currentSchema.find(m => m.name === targetModel.name);
      if (currentModel && currentModel.metadata?.estimatedRows > 1000000) {
        const hasNewIndex = this.hasNewIndexes(currentModel, targetModel);
        if (hasNewIndex) {
          warnings.push({
            type: 'performance',
            model: targetModel.name,
            message: `Adding index to large table (${currentModel.metadata.estimatedRows} rows)`,
            severity: 'high',
            recommendation: 'Consider adding index during low-traffic period'
          });
        }
      }

      // Warn about new required fields without defaults
      if (currentModel) {
        const newRequiredFields = targetModel.fields.filter(f => 
          !f.isOptional && 
          !f.defaultValue && 
          !currentModel.fields.some(cf => cf.name === f.name)
        );

        for (const field of newRequiredFields) {
          warnings.push({
            type: 'data_integrity',
            model: targetModel.name,
            field: field.name,
            message: `New required field '${field.name}' without default value`,
            severity: 'high',
            recommendation: `Add default value or make field optional initially`
          });
        }
      }

      // Warn about cascade deletes
      for (const relation of targetModel.relations) {
        if (relation.onDelete === 'Cascade') {
          warnings.push({
            type: 'data_integrity',
            model: targetModel.name,
            field: relation.name,
            message: `Cascade delete on relation '${relation.name}'`,
            severity: 'medium',
            recommendation: 'Ensure cascade delete is intentional'
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Generate migration steps
   */
  private generateMigrationSteps(
    currentSchema: PrismaSchemaModel[],
    targetSchema: PrismaSchemaModel[]
  ): MigrationStep[] {
    const steps: MigrationStep[] = [];
    let order = 1;

    // Step 1: Add new tables
    const currentModelNames = new Set(currentSchema.map(m => m.name));
    const newModels = targetSchema.filter(m => !currentModelNames.has(m.name));

    for (const model of newModels) {
      steps.push({
        order: order++,
        type: 'schema',
        description: `Create table ${model.tableName}`,
        sql: this.generateCreateTableSQL(model),
        requiresDowntime: false,
        estimatedDuration: 1,
        validation: `SELECT 1 FROM information_schema.tables WHERE table_name = '${model.tableName}'`
      });
    }

    // Step 2: Add new columns to existing tables
    for (const targetModel of targetSchema) {
      const currentModel = currentSchema.find(m => m.name === targetModel.name);
      if (!currentModel) continue;

      const currentFieldNames = new Set(currentModel.fields.map(f => f.name));
      const newFields = targetModel.fields.filter(f => !currentFieldNames.has(f.name));

      for (const field of newFields) {
        const requiresDowntime = !field.isOptional && !field.defaultValue;
        steps.push({
          order: order++,
          type: 'schema',
          description: `Add column ${field.name} to ${targetModel.tableName}`,
          sql: this.generateAddColumnSQL(targetModel, field),
          requiresDowntime,
          estimatedDuration: this.estimateColumnAddDuration(targetModel, field),
          validation: `SELECT 1 FROM information_schema.columns WHERE table_name = '${targetModel.tableName}' AND column_name = '${field.name}'`
        });
      }
    }

    // Step 3: Modify existing columns
    for (const targetModel of targetSchema) {
      const currentModel = currentSchema.find(m => m.name === targetModel.name);
      if (!currentModel) continue;

      for (const targetField of targetModel.fields) {
        const currentField = currentModel.fields.find(f => f.name === targetField.name);
        if (!currentField) continue;

        if (this.fieldNeedsModification(currentField, targetField)) {
          steps.push({
            order: order++,
            type: 'schema',
            description: `Modify column ${targetField.name} in ${targetModel.tableName}`,
            sql: this.generateAlterColumnSQL(targetModel, currentField, targetField),
            requiresDowntime: true,
            estimatedDuration: this.estimateColumnModifyDuration(targetModel, targetField),
            validation: `SELECT 1 FROM information_schema.columns WHERE table_name = '${targetModel.tableName}' AND column_name = '${targetField.name}'`
          });
        }
      }
    }

    // Step 4: Add new indexes
    for (const targetModel of targetSchema) {
      const currentModel = currentSchema.find(m => m.name === targetModel.name);
      if (!currentModel) continue;

      const newIndexes = this.getNewIndexes(currentModel, targetModel);
      for (const index of newIndexes) {
        steps.push({
          order: order++,
          type: 'index',
          description: `Create index on ${targetModel.tableName}(${index.fields.join(', ')})`,
          sql: this.generateCreateIndexSQL(targetModel, index),
          requiresDowntime: false,
          estimatedDuration: this.estimateIndexCreationDuration(targetModel),
          validation: `SELECT 1 FROM information_schema.statistics WHERE table_name = '${targetModel.tableName}' AND index_name = '${index.name}'`
        });
      }
    }

    // Step 5: Remove old columns (if allowed)
    if (this.config.allowBreakingChanges) {
      for (const currentModel of currentSchema) {
        const targetModel = targetSchema.find(m => m.name === currentModel.name);
        if (!targetModel) continue;

        const targetFieldNames = new Set(targetModel.fields.map(f => f.name));
        const removedFields = currentModel.fields.filter(f => !targetFieldNames.has(f.name));

        for (const field of removedFields) {
          steps.push({
            order: order++,
            type: 'schema',
            description: `Drop column ${field.name} from ${currentModel.tableName}`,
            sql: `ALTER TABLE ${currentModel.tableName} DROP COLUMN ${field.name}`,
            requiresDowntime: true,
            estimatedDuration: this.estimateColumnDropDuration(currentModel),
            validation: `SELECT COUNT(*) = 0 FROM information_schema.columns WHERE table_name = '${currentModel.tableName}' AND column_name = '${field.name}'`
          });
        }
      }
    }

    return steps;
  }

  /**
   * Estimate migration impact
   */
  private estimateImpact(
    steps: MigrationStep[],
    breakingChanges: BreakingChange[]
  ): MigrationImpact {
    const requiresDowntime = steps.some(s => s.requiresDowntime) || breakingChanges.length > 0;
    const estimatedDowntime = steps
      .filter(s => s.requiresDowntime)
      .reduce((sum, s) => sum + s.estimatedDuration, 0);

    const totalDuration = steps.reduce((sum, s) => sum + s.estimatedDuration, 0);
    
    let dataVolume: 'low' | 'medium' | 'high' = 'low';
    let performanceImpact: 'minimal' | 'moderate' | 'significant' = 'minimal';
    
    if (totalDuration > 300) {
      dataVolume = 'high';
      performanceImpact = 'significant';
    } else if (totalDuration > 60) {
      dataVolume = 'medium';
      performanceImpact = 'moderate';
    }

    const riskLevel = breakingChanges.length > 0 ? 'high' : 
                     requiresDowntime ? 'medium' : 'low';

    return {
      requiresDowntime,
      estimatedDowntime,
      dataVolume,
      performanceImpact,
      riskLevel
    };
  }

  /**
   * Generate rollback plan
   */
  private generateRollbackPlan(steps: MigrationStep[]): RollbackStep[] {
    const rollbackSteps: RollbackStep[] = [];
    
    // Reverse the steps
    const reversedSteps = [...steps].reverse();
    
    for (let i = 0; i < reversedSteps.length; i++) {
      const step = reversedSteps[i];
      const rollbackStep = this.generateRollbackStep(step, i + 1);
      if (rollbackStep) {
        rollbackSteps.push(rollbackStep);
      }
    }

    return rollbackSteps;
  }

  // Helper methods
  private hasValidMigrationStrategies(breakingChanges: BreakingChange[]): boolean {
    return breakingChanges.every(change => change.migrationStrategy != null);
  }

  private areTypesCompatible(fromType: string, toType: string): boolean {
    const compatibleMappings: Record<string, string[]> = {
      'Int': ['BigInt', 'Float', 'Decimal'],
      'Float': ['Decimal'],
      'String': ['Text'],
      'DateTime': ['String']
    };

    return compatibleMappings[fromType]?.includes(toType) || false;
  }

  private getTypeConversionStrategy(fromType: string, toType: string): string {
    const strategies: Record<string, string> = {
      'String->Int': 'Cast string values to integers, handle non-numeric values',
      'Int->String': 'Convert integer values to strings',
      'DateTime->String': 'Format datetime values as ISO strings',
      'String->DateTime': 'Parse string values as datetime, handle invalid formats'
    };

    return strategies[`${fromType}->${toType}`] || 
           `Create new column, migrate data with conversion, drop old column`;
  }

  private hasNewIndexes(current: PrismaSchemaModel, target: PrismaSchemaModel): boolean {
    const currentIndexes = current.directives?.filter(d => d.name === '@@index') || [];
    const targetIndexes = target.directives?.filter(d => d.name === '@@index') || [];
    return targetIndexes.length > currentIndexes.length;
  }

  private getNewIndexes(current: PrismaSchemaModel, target: PrismaSchemaModel): any[] {
    const currentIndexSigs = new Set(
      (current.directives?.filter(d => d.name === '@@index') || [])
        .map(idx => (idx.arguments?.fields || []).sort().join(','))
    );

    return (target.directives?.filter(d => d.name === '@@index') || [])
      .filter(idx => {
        const sig = (idx.arguments?.fields || []).sort().join(',');
        return !currentIndexSigs.has(sig);
      })
      .map(idx => ({
        name: `idx_${target.tableName}_${(idx.arguments?.fields || []).join('_')}`,
        fields: idx.arguments?.fields || []
      }));
  }

  private fieldNeedsModification(current: any, target: any): boolean {
    return current.type !== target.type ||
           current.isOptional !== target.isOptional ||
           current.defaultValue !== target.defaultValue;
  }

  private generateCreateTableSQL(model: PrismaSchemaModel): string {
    const columns = model.fields.map(f => {
      const nullable = f.isOptional ? 'NULL' : 'NOT NULL';
      const defaultVal = f.defaultValue ? ` DEFAULT ${f.defaultValue}` : '';
      return `  ${f.name} ${this.getSQLType(f.type)} ${nullable}${defaultVal}`;
    });

    const primaryKey = model.fields.find(f => f.isId);
    if (primaryKey) {
      columns.push(`  PRIMARY KEY (${primaryKey.name})`);
    }

    return `CREATE TABLE ${model.tableName} (\n${columns.join(',\n')}\n);`;
  }

  private generateAddColumnSQL(model: PrismaSchemaModel, field: any): string {
    const nullable = field.isOptional ? 'NULL' : 'NOT NULL';
    const defaultVal = field.defaultValue ? ` DEFAULT ${field.defaultValue}` : '';
    return `ALTER TABLE ${model.tableName} ADD COLUMN ${field.name} ${this.getSQLType(field.type)} ${nullable}${defaultVal};`;
  }

  private generateAlterColumnSQL(model: PrismaSchemaModel, currentField: any, targetField: any): string {
    const parts: string[] = [];
    
    if (currentField.type !== targetField.type) {
      parts.push(`ALTER TABLE ${model.tableName} ALTER COLUMN ${targetField.name} TYPE ${this.getSQLType(targetField.type)};`);
    }
    
    if (currentField.isOptional !== targetField.isOptional) {
      const action = targetField.isOptional ? 'DROP NOT NULL' : 'SET NOT NULL';
      parts.push(`ALTER TABLE ${model.tableName} ALTER COLUMN ${targetField.name} ${action};`);
    }
    
    return parts.join('\n');
  }

  private generateCreateIndexSQL(model: PrismaSchemaModel, index: any): string {
    return `CREATE INDEX ${index.name} ON ${model.tableName} (${index.fields.join(', ')});`;
  }

  private getSQLType(prismaType: string): string {
    const typeMap: Record<string, string> = {
      'String': 'VARCHAR(255)',
      'Int': 'INTEGER',
      'BigInt': 'BIGINT',
      'Float': 'DOUBLE PRECISION',
      'Decimal': 'DECIMAL(10,2)',
      'Boolean': 'BOOLEAN',
      'DateTime': 'TIMESTAMP',
      'Json': 'JSON'
    };
    return typeMap[prismaType] || 'VARCHAR(255)';
  }

  private estimateColumnAddDuration(model: PrismaSchemaModel, field: any): number {
    const rows = model.metadata?.estimatedRows || 0;
    if (rows < 10000) return 1;
    if (rows < 100000) return 5;
    if (rows < 1000000) return 30;
    return 120;
  }

  private estimateColumnModifyDuration(model: PrismaSchemaModel, field: any): number {
    const rows = model.metadata?.estimatedRows || 0;
    if (rows < 10000) return 2;
    if (rows < 100000) return 10;
    if (rows < 1000000) return 60;
    return 300;
  }

  private estimateColumnDropDuration(model: PrismaSchemaModel): number {
    const rows = model.metadata?.estimatedRows || 0;
    if (rows < 10000) return 1;
    if (rows < 100000) return 5;
    if (rows < 1000000) return 20;
    return 60;
  }

  private estimateIndexCreationDuration(model: PrismaSchemaModel): number {
    const rows = model.metadata?.estimatedRows || 0;
    if (rows < 10000) return 5;
    if (rows < 100000) return 30;
    if (rows < 1000000) return 300;
    return 1800;
  }

  private generateRollbackStep(step: MigrationStep, order: number): RollbackStep | null {
    switch (step.type) {
      case 'schema':
        if (step.description.startsWith('Create table')) {
          const tableName = step.description.match(/Create table (\w+)/)?.[1];
          return {
            order,
            description: `Drop table ${tableName}`,
            sql: `DROP TABLE IF EXISTS ${tableName};`,
            validation: `SELECT COUNT(*) = 0 FROM information_schema.tables WHERE table_name = '${tableName}'`
          };
        }
        if (step.description.startsWith('Add column')) {
          const match = step.description.match(/Add column (\w+) to (\w+)/);
          if (match) {
            return {
              order,
              description: `Drop column ${match[1]} from ${match[2]}`,
              sql: `ALTER TABLE ${match[2]} DROP COLUMN IF EXISTS ${match[1]};`,
              validation: `SELECT COUNT(*) = 0 FROM information_schema.columns WHERE table_name = '${match[2]}' AND column_name = '${match[1]}'`
            };
          }
        }
        break;
      case 'index':
        if (step.description.startsWith('Create index')) {
          const match = step.description.match(/Create index on (\w+)/);
          if (match) {
            return {
              order,
              description: `Drop index from ${match[1]}`,
              sql: step.sql?.replace('CREATE INDEX', 'DROP INDEX IF EXISTS').split(' ON ')[0] + ';',
              validation: step.validation?.replace('SELECT 1', 'SELECT COUNT(*) = 0')
            };
          }
        }
        break;
    }
    return null;
  }
}

// Factory function
export function createMigrationValidator(config?: MigrationValidationConfig): MigrationValidator {
  return new MigrationValidator(config);
}