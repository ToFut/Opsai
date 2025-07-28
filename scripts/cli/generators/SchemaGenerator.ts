import * as fs from 'fs';
import * as path from 'path';
import { AppConfig, Entity } from './ConfigParser';

export class SchemaGenerator {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  async generateDatabaseSchema(outputDir: string): Promise<void> {
    const schemaDir = path.join(outputDir, 'prisma');
    fs.mkdirSync(schemaDir, { recursive: true });

    // Generate Prisma schema
    await this.generatePrismaSchema(schemaDir);
    
    // Generate database migrations
    await this.generateMigrations(schemaDir);
    
    // Generate seed data
    await this.generateSeedData(schemaDir);

    console.log('✅ Database schema generated');
  }

  private async generatePrismaSchema(schemaDir: string): Promise<void> {
    const schemaContent = this.buildPrismaSchema();
    const schemaPath = path.join(schemaDir, 'schema.prisma');
    
    fs.writeFileSync(schemaPath, schemaContent);
    console.log(`📄 Generated Prisma schema: ${schemaPath}`);
  }

  private buildPrismaSchema(): string {
    const generator = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${this.config.database.type}"
  url      = env("DATABASE_URL")
}
`;

    let models = '';

    // Add Tenant model if multi-tenancy is enabled
    if (this.config.features?.multiTenancy) {
      models += `
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  settings  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations to other models
${this.config.database.entities.map(entity => 
  `  ${this.toCamelCase(entity.name)}s ${this.toPascalCase(entity.name)}[]`
).join('\n')}

  @@map("tenants")
}
`;
    }

    models += this.config.database.entities.map(entity => 
      this.buildPrismaModel(entity)
    ).join('\n\n');

    return generator + models;
  }

  private buildPrismaModel(entity: Entity): string {
    const modelName = this.toPascalCase(entity.name);
    const tableName = this.toSnakeCase(entity.name);

    let modelContent = `model ${modelName} {\n`;

    // Add fields, handling relations properly
    Object.entries(entity.fields).forEach(([fieldName, field]) => {
      if (field.type === 'relation' && field.relation) {
        // For relations, add both foreign key field and relation field
        const relatedModel = this.toPascalCase(field.relation.entity);
        const foreignKeyField = field.relation.foreignKey || `${fieldName}Id`;
        
        if (field.relation.type === 'one-to-one') {
          // Add foreign key field
          const fkType = field.required ? 'String' : 'String?';
          modelContent += `  ${foreignKeyField} ${fkType}\n`;
          
          // Add relation field with different name
          const relationFieldName = fieldName.endsWith('Id') ? fieldName.slice(0, -2) : fieldName;
          modelContent += `  ${relationFieldName} ${relatedModel}${field.required ? '' : '?'} @relation(fields: [${foreignKeyField}], references: [id])\n`;
        } else {
          // One-to-many or many-to-many
          modelContent += `  ${fieldName} ${relatedModel}[]\n`;
        }
      } else {
        // Regular field
        const prismaField = this.buildPrismaField(fieldName, field, entity);
        modelContent += `  ${prismaField}\n`;
      }
    });

    // Add reverse relations for one-to-one relationships
    this.config.database.entities.forEach(otherEntity => {
      if (otherEntity.name !== entity.name) {
        Object.entries(otherEntity.fields).forEach(([fieldName, field]) => {
          if (field.type === 'relation' && field.relation?.entity === entity.name && field.relation.type === 'one-to-one') {
            // Add reverse relation
            const relatedModel = this.toPascalCase(otherEntity.name);
            modelContent += `  ${this.toCamelCase(otherEntity.name)}s ${relatedModel}[]\n`;
          }
        });
      }
    });

    // Add multi-tenancy if enabled
    if (this.config.features?.multiTenancy) {
      modelContent += `  tenantId  String\n`;
      modelContent += `  tenant    Tenant @relation(fields: [tenantId], references: [id])\n`;
    }

    // Add audit fields only if not already present
    if (!entity.fields.createdAt && !entity.fields.created_at) {
      modelContent += `  createdAt DateTime @default(now())\n`;
    }
    if (!entity.fields.updatedAt && !entity.fields.updated_at) {
      modelContent += `  updatedAt DateTime @updatedAt\n`;
    }

    // Add table mapping
    modelContent += `\n  @@map("${tableName}")\n`;

    // Add indexes
    const indexes = this.buildPrismaIndexes(entity);
    if (indexes.length > 0) {
      modelContent += indexes.map(index => `  ${index}`).join('\n') + '\n';
    }

    modelContent += '}';

    return modelContent;
  }

  private buildPrismaField(fieldName: string, field: any, entity: Entity): string {
    const dbFieldName = this.toSnakeCase(fieldName);
    let prismaType = this.mapToPrismaType(field.type);
    let attributes = [];

    // Relations are handled in buildPrismaModel, skip them here
    if (field.type === 'relation') {
      return ''; // This should not be called for relations anymore
    }

    // Handle required fields
    if (field.required && !prismaType.includes('?') && !prismaType.includes('[]')) {
      // prismaType is already required by default
    } else if (!field.required && !prismaType.includes('?') && !prismaType.includes('[]')) {
      prismaType += '?';
    }

    // Handle unique fields - use @id for id fields, @unique for others
    if (field.unique) {
      if (fieldName === 'id') {
        attributes.push('@id @default(cuid())');
      } else {
        attributes.push('@unique');
      }
    }

    // Handle default values
    if (field.default !== undefined) {
      if (typeof field.default === 'string') {
        attributes.push(`@default("${field.default}")`);
      } else if (field.type === 'date' && field.default === 'now') {
        attributes.push(`@default(now())`);
      } else {
        attributes.push(`@default(${field.default})`);
      }
    }

    // Handle database field mapping
    if (dbFieldName !== fieldName) {
      attributes.push(`@map("${dbFieldName}")`);
    }

    const attributeString = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
    return `${fieldName} ${prismaType}${attributeString}`;
  }

  private buildPrismaIndexes(entity: Entity): string[] {
    const indexes: string[] = [];

    // Don't add @@unique for fields that already have @unique attribute
    // since they're already handled in buildPrismaField

    // Add multi-tenancy index
    if (this.config.features?.multiTenancy) {
      indexes.push(`@@index([tenantId])`);
    }

    return indexes;
  }

  private mapToPrismaType(fieldType: string): string {
    switch (fieldType) {
      case 'string': return 'String';
      case 'number': return 'Float';
      case 'integer': return 'Int';
      case 'decimal': return 'Decimal';
      case 'boolean': return 'Boolean';
      case 'date': return 'DateTime';
      case 'datetime': return 'DateTime';
      case 'json': 
        // Use String for SQLite since it doesn't support JSON
        return this.config.database.type === 'sqlite' ? 'String' : 'Json';
      default: return 'String';
    }
  }

  private async generateMigrations(schemaDir: string): Promise<void> {
    const migrationsDir = path.join(schemaDir, 'migrations');
    fs.mkdirSync(migrationsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const migrationDir = path.join(migrationsDir, `${timestamp}_init`);
    fs.mkdirSync(migrationDir, { recursive: true });

    // Generate initial migration SQL
    const migrationSQL = this.buildInitialMigrationSQL();
    const migrationPath = path.join(migrationDir, 'migration.sql');
    
    fs.writeFileSync(migrationPath, migrationSQL);
    console.log(`📄 Generated migration: ${migrationPath}`);
  }

  private buildInitialMigrationSQL(): string {
    let sql = '';

    // Add multi-tenancy table if enabled
    if (this.config.features?.multiTenancy) {
      sql += `
CREATE TABLE "tenants" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "settings" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");
`;
    }

    // Generate table creation SQL for each entity
    this.config.database.entities.forEach(entity => {
      sql += this.buildEntityTableSQL(entity) + '\n\n';
    });

    return sql.trim();
  }

  private buildEntityTableSQL(entity: Entity): string {
    const tableName = this.toSnakeCase(entity.name);
    let sql = `CREATE TABLE "${tableName}" (\n`;

    const columns: string[] = [];

    // Add entity fields
    Object.entries(entity.fields).forEach(([fieldName, field]) => {
      if (field.type !== 'relation' || field.relation?.type === 'one-to-one') {
        const column = this.buildColumnSQL(fieldName, field);
        columns.push(`  ${column}`);
      }
    });

    // Add multi-tenancy column
    if (this.config.features?.multiTenancy) {
      columns.push(`  "tenant_id" TEXT NOT NULL`);
    }

    // Add audit columns
    columns.push(`  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    columns.push(`  "updated_at" TIMESTAMP(3) NOT NULL`);

    // Add primary key
    const primaryKey = Object.entries(entity.fields).find(([_, field]) => 
      field.unique && (field.type === 'string' || field.type === 'number')
    );
    
    if (primaryKey) {
      columns.push(`  CONSTRAINT "${tableName}_pkey" PRIMARY KEY ("${this.toSnakeCase(primaryKey[0])}")`);
    }

    sql += columns.join(',\n') + '\n';
    sql += ');\n';

    // Add indexes
    Object.entries(entity.fields).forEach(([fieldName, field]) => {
      if (field.unique) {
        const dbFieldName = this.toSnakeCase(fieldName);
        sql += `CREATE UNIQUE INDEX "${tableName}_${dbFieldName}_idx" ON "${tableName}"("${dbFieldName}");\n`;
      }
    });

    // Add multi-tenancy index
    if (this.config.features?.multiTenancy) {
      sql += `CREATE INDEX "${tableName}_tenant_id_idx" ON "${tableName}"("tenant_id");\n`;
    }

    return sql;
  }

  private buildColumnSQL(fieldName: string, field: any): string {
    const dbFieldName = this.toSnakeCase(fieldName);
    let sqlType = this.mapToSQLType(field.type);
    let constraints = [];

    if (field.required) {
      constraints.push('NOT NULL');
    }

    if (field.unique) {
      constraints.push('UNIQUE');
    }

    if (field.default !== undefined) {
      if (typeof field.default === 'string') {
        constraints.push(`DEFAULT '${field.default}'`);
      } else {
        constraints.push(`DEFAULT ${field.default}`);
      }
    }

    const constraintString = constraints.length > 0 ? ` ${constraints.join(' ')}` : '';
    return `"${dbFieldName}" ${sqlType}${constraintString}`;
  }

  private mapToSQLType(fieldType: string): string {
    switch (fieldType) {
      case 'string': return 'TEXT';
      case 'number': return 'DOUBLE PRECISION';
      case 'boolean': return 'BOOLEAN';
      case 'date': return 'TIMESTAMP(3)';
      case 'json': return 'JSONB';
      default: return 'TEXT';
    }
  }

  private async generateSeedData(schemaDir: string): Promise<void> {
    const seedPath = path.join(schemaDir, 'seed.ts');
    const seedContent = this.buildSeedFile();
    
    fs.writeFileSync(seedPath, seedContent);
    console.log(`📄 Generated seed file: ${seedPath}`);
  }

  private buildSeedFile(): string {
    return `
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  ${this.config.features?.multiTenancy ? `
  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      id: 'tenant-default',
      name: 'Default Tenant',
      slug: 'default',
      settings: {}
    }
  });

  console.log('✅ Created default tenant:', tenant.name);
  ` : ''}

  ${this.buildEntitySeedData()}

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
  }

  private buildEntitySeedData(): string {
    return this.config.database.entities.map(entity => {
      const modelName = this.toCamelCase(entity.name);
      const displayName = entity.displayName;
      
      return `
  // Seed ${displayName}
  const sample${this.toPascalCase(entity.name)} = await prisma.${modelName}.upsert({
    where: { id: 'sample-${entity.name}' },
    update: {},
    create: {
      id: 'sample-${entity.name}',
      ${this.buildSampleEntityData(entity)}
      ${this.config.features?.multiTenancy ? 'tenantId: tenant.id,' : ''}
    }
  });

  console.log('✅ Created sample ${displayName}:', sample${this.toPascalCase(entity.name)}.id);`;
    }).join('\n');
  }

  private buildSampleEntityData(entity: Entity): string {
    const sampleData: string[] = [];

    Object.entries(entity.fields).forEach(([fieldName, field]) => {
      if (fieldName === 'id') return; // Skip ID field
      if (field.type === 'relation') return; // Skip relations for now

      let sampleValue = this.generateSampleValue(field);
      if (typeof sampleValue === 'string') {
        sampleData.push(`${fieldName}: '${sampleValue}',`);
      } else {
        sampleData.push(`${fieldName}: ${sampleValue},`);
      }
    });

    return sampleData.join('\n      ');
  }

  private generateSampleValue(field: any): any {
    if (field.default !== undefined) {
      return field.default;
    }

    switch (field.type) {
      case 'string':
        if (field.validation?.enum) {
          return field.validation.enum[0];
        }
        return 'Sample Value';
      case 'number':
        return 42;
      case 'boolean':
        return true;
      case 'date':
        return 'new Date()';
      case 'json':
        return '{}';
      default:
        return 'Sample Value';
    }
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }
}