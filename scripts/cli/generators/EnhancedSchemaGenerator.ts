import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '../../../packages/shared/src/config/service-config';
import { ServiceResolver } from '../../../packages/shared/src/services/service-resolver';

interface EntityField {
  type: string;
  required?: boolean;
  unique?: boolean;
  primary?: boolean;
  default?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
  ui?: {
    label?: string;
    widget?: string;
    placeholder?: string;
  };
}

interface Entity {
  name: string;
  displayName: string;
  description?: string;
  fields: Record<string, EntityField>;
  relationships?: Array<{
    type: 'hasMany' | 'belongsTo' | 'hasOne' | 'manyToMany';
    model: string;
    foreignKey?: string;
    through?: string;
  }>;
}

export class EnhancedSchemaGenerator {
  private config: AppConfig;
  private serviceResolver: ServiceResolver;

  constructor(config: AppConfig) {
    this.config = config;
    this.serviceResolver = new ServiceResolver(config.services);
  }

  async generateDatabaseSchema(outputDir: string): Promise<void> {
    const schemaDir = path.join(outputDir, 'prisma');
    fs.mkdirSync(schemaDir, { recursive: true });

    // Generate Prisma schema with analytics models
    await this.generatePrismaSchema(schemaDir);
    
    // Generate database migrations with audit trails
    await this.generateMigrations(schemaDir);
    
    // Generate seed data with sample analytics
    await this.generateSeedData(schemaDir);
    
    // Generate analytics and BI schemas
    await this.generateAnalyticsSchema(schemaDir);
    
    // Generate audit trail system
    await this.generateAuditSystem(schemaDir);
    
    // Generate business intelligence views
    await this.generateBIViews(schemaDir);
    
    // Generate data transformation utilities
    await this.generateDataTransformUtils(outputDir);

    console.log('✅ Enhanced database schema with analytics generated');
  }

  private async generatePrismaSchema(schemaDir: string): Promise<void> {
    const schemaContent = this.buildPrismaSchema();
    const schemaPath = path.join(schemaDir, 'schema.prisma');
    
    fs.writeFileSync(schemaPath, schemaContent);
    console.log(`📄 Generated Prisma schema: ${schemaPath}`);
  }

  private buildPrismaSchema(): string {
    const databaseType = this.getDatabaseType();
    
    const generator = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${databaseType}"
  url      = env("DATABASE_URL")
}
`;

    let models = '';

    // Add Tenant model if multi-tenancy is enabled
    if (this.config.features?.multiTenancy) {
      models += this.buildTenantModel(databaseType);
    }

    // Check if User model is defined in entities, if not add default User model for authentication
    const hasUserEntity = this.config.database.entities.some(entity => 
      entity.name.toLowerCase() === 'user'
    );

    if (this.config.features?.authentication && !hasUserEntity) {
      models += this.buildUserModel(databaseType);
    }

    // Add entity models (including User if defined in entities)
    models += this.config.database.entities.map(entity => 
      this.buildPrismaModel(entity, databaseType)
    ).join('\n\n');

    return generator + models;
  }

  private getDatabaseType(): string {
    // Check both possible config locations for database type
    const provider = this.config.services?.database?.provider || 
                    this.config.database?.type || 
                    this.config.database?.provider;
    
    console.log(`🔍 Database provider detected: ${provider}`);
    
    switch (provider) {
      case 'core-managed':
      case 'user-postgresql':
      case 'postgresql':
        return 'postgresql';
      case 'user-mysql':
      case 'mysql':
        return 'mysql';
      case 'user-sqlite':
      case 'sqlite':
        return 'sqlite';
      default:
        return 'sqlite'; // Default to SQLite for easier development
    }
  }

  private buildTenantModel(databaseType: string): string {
    const settingsType = databaseType === 'sqlite' ? 'String?' : 'Json?';
    
    return `
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  settings  ${settingsType}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations to other models
${this.config.database.entities.map(entity => 
  `  ${this.toCamelCase(entity.name)}s ${this.toPascalCase(entity.name)}[]`
).join('\n')}

  // User relations
  users     User[]

  @@map("tenants")
}
`;
  }

  private buildUserModel(databaseType: string): string {
    return `
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String?
  lastName  String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

${this.config.features?.multiTenancy ? `
  // Multi-tenancy
  tenantId  String
  tenant    Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
` : ''}
  @@map("users")
}
`;
  }

  private buildPrismaModel(entity: Entity, databaseType: string): string {
    const modelName = this.toPascalCase(entity.name);
    const tableName = this.toSnakeCase(entity.name);

    let modelContent = `model ${modelName} {\n`;

    // Always add id field first if not present
    const hasIdField = Object.keys(entity.fields).some(key => key === 'id');
    if (!hasIdField) {
      modelContent += `  id String @id @default(cuid())\n`;
    }

    // Add entity fields
    Object.entries(entity.fields).forEach(([fieldName, field]) => {
      const prismaField = this.buildPrismaField(fieldName, field, databaseType);
      if (prismaField) {
        modelContent += `  ${prismaField}\n`;
      }
    });

    // Add relationships
    if (entity.relationships) {
      entity.relationships.forEach(relationship => {
        const relationField = this.buildRelationshipField(relationship, entity);
        if (relationField) {
          modelContent += `  ${relationField}\n`;
        }
      });
    }

    // Add multi-tenancy if enabled
    if (this.config.features?.multiTenancy) {
      modelContent += `  tenantId  String\n`;
      modelContent += `  tenant    Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)\n`;
    }

    // Add audit fields only if not already present
    if (!entity.fields.createdAt && !entity.fields.created_at) {
      modelContent += `  createdAt DateTime @default(now())\n`;
    }
    if (!entity.fields.updatedAt && !entity.fields.updated_at) {
      modelContent += `  updatedAt DateTime @updatedAt\n`;
    }

    // Add indexes
    const indexes = this.buildPrismaIndexes(entity);
    if (indexes.length > 0) {
      modelContent += '\n' + indexes.map(index => `  ${index}`).join('\n') + '\n';
    }

    // Add table mapping
    modelContent += `\n  @@map("${tableName}")\n`;

    modelContent += '}';

    return modelContent;
  }

  private buildPrismaField(fieldName: string, field: EntityField, databaseType: string): string {
    let prismaType = this.mapToPrismaType(field.type, databaseType);
    let attributes: string[] = [];

    // Handle primary key first
    if (field.primary || (fieldName === 'id' && field.unique)) {
      attributes.push('@id @default(cuid())');
      // Primary keys are always required
    } else {
      // Handle required/optional fields for non-primary keys
      if (!field.required && !prismaType.includes('?') && !prismaType.includes('[]')) {
        prismaType += '?';
      }
      
      // Handle unique fields
      if (field.unique) {
        attributes.push('@unique');
      }
    }

    // Handle default values
    if (field.default !== undefined) {
      if (field.type === 'datetime' && field.default === 'now') {
        attributes.push('@default(now())');
      } else if (field.type === 'datetime' && field.default === 'updated') {
        attributes.push('@updatedAt');
      } else if (typeof field.default === 'string') {
        attributes.push(`@default("${field.default}")`);
      } else if (typeof field.default === 'boolean' || typeof field.default === 'number') {
        attributes.push(`@default(${field.default})`);
      }
    }

    // Handle database field mapping if needed
    const dbFieldName = this.toSnakeCase(fieldName);
    if (dbFieldName !== fieldName) {
      attributes.push(`@map("${dbFieldName}")`);
    }

    const attributeString = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
    return `${fieldName} ${prismaType}${attributeString}`;
  }

  private buildRelationshipField(relationship: any, entity: Entity): string {
    // Handle both 'target' (new format) and 'model' (legacy format)
    const relatedModelName = relationship.target || relationship.model;
    
    if (!relatedModelName) {
      console.warn(`⚠️  Relationship missing target/model for entity ${entity.name}:`, relationship);
      return '';
    }
    
    const relatedModel = this.toPascalCase(relatedModelName);

    switch (relationship.type) {
      case 'hasMany':
        const relationName = relationship.name || `${this.toCamelCase(relatedModelName)}s`;
        return `${relationName} ${relatedModel}[]`;
      
      case 'belongsTo':
        const foreignKeyField = relationship.field || relationship.foreign_key || `${this.toCamelCase(relatedModelName)}Id`;
        // Check if foreign key field already exists in entity fields to avoid duplicates
        const hasExistingForeignKey = Object.keys(entity.fields).includes(foreignKeyField);
        
        let relationshipFields = '';
        if (!hasExistingForeignKey) {
          relationshipFields += `${foreignKeyField} String\n  `;
        }
        
        // Create a unique relation field name that doesn't conflict with the foreign key
        let relationFieldName = this.toCamelCase(foreignKeyField.replace('Id', ''));
        
        // If the relation field name is the same as an existing field, modify it
        if (Object.keys(entity.fields).includes(relationFieldName)) {
          relationFieldName = relationFieldName + 'Relation';
        }
        
        relationshipFields += `${relationFieldName} ${relatedModel} @relation(fields: [${foreignKeyField}], references: [id])`;
        return relationshipFields;
      
      case 'hasOne':
        return `${this.toCamelCase(relatedModelName)} ${relatedModel}?`;
      
      case 'manyToMany':
        return `${this.toCamelCase(relatedModelName)}s ${relatedModel}[]`;
      
      default:
        return '';
    }
  }

  private buildPrismaIndexes(entity: Entity): string[] {
    const indexes: string[] = [];

    // Add multi-tenancy index
    if (this.config.features?.multiTenancy) {
      indexes.push('@@index([tenantId])');
    }

    // Add indexes for foreign keys
    if (entity.relationships) {
      entity.relationships.forEach(relationship => {
        if (relationship.type === 'belongsTo' && relationship.foreignKey) {
          indexes.push(`@@index([${relationship.foreignKey}])`);
        }
      });
    }

    return indexes;
  }

  private mapToPrismaType(fieldType: string, databaseType: string): string {
    switch (fieldType) {
      case 'string':
        return 'String';
      case 'text':
        return 'String';
      case 'number':
      case 'float':
        return 'Float';
      case 'integer':
      case 'int':
        return 'Int';
      case 'decimal':
        return 'Decimal';
      case 'boolean':
      case 'bool':
        return 'Boolean';
      case 'date':
      case 'datetime':
      case 'timestamp':
        return 'DateTime';
      case 'json':
        // Use String for SQLite since it doesn't support JSON natively
        return databaseType === 'sqlite' ? 'String' : 'Json';
      case 'enum':
        return 'String'; // Simplified - could be enhanced to generate proper enums
      default:
        return 'String';
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
    const databaseType = this.getDatabaseType();
    let sql = `-- Generated migration for ${databaseType}\n-- Created: ${new Date().toISOString()}\n\n`;

    if (databaseType === 'postgresql') {
      sql += this.buildPostgreSQLMigration();
    } else if (databaseType === 'sqlite') {
      sql += this.buildSQLiteMigration();
    } else if (databaseType === 'mysql') {
      sql += this.buildMySQLMigration();
    }

    return sql;
  }

  private buildPostgreSQLMigration(): string {
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

CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenants"("slug");
`;
    }

    // Add users table if authentication is enabled
    if (this.config.features?.authentication) {
      sql += `
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "first_name" TEXT,
  "last_name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  ${this.config.features?.multiTenancy ? '"tenant_id" TEXT NOT NULL,' : ''}
  
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_idx" ON "users"("email");
${this.config.features?.multiTenancy ? 'CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");' : ''}
`;
    }

    // Generate table creation SQL for each entity
    this.config.database.entities.forEach(entity => {
      sql += this.buildEntityTableSQL(entity, 'postgresql') + '\n\n';
    });

    return sql.trim();
  }

  private buildSQLiteMigration(): string {
    // Similar structure but with SQLite syntax
    let sql = '';
    
    if (this.config.features?.multiTenancy) {
      sql += `
CREATE TABLE "tenants" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "settings" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;
    }

    // Add entity tables
    this.config.database.entities.forEach(entity => {
      sql += this.buildEntityTableSQL(entity, 'sqlite') + '\n\n';
    });

    return sql.trim();
  }

  private buildMySQLMigration(): string {
    // MySQL-specific migration
    let sql = '';
    
    if (this.config.features?.multiTenancy) {
      sql += `
CREATE TABLE \`tenants\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`slug\` VARCHAR(191) NOT NULL UNIQUE,
  \`settings\` JSON,
  \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (\`id\`)
);
`;
    }

    this.config.database.entities.forEach(entity => {
      sql += this.buildEntityTableSQL(entity, 'mysql') + '\n\n';
    });

    return sql.trim();
  }

  private buildEntityTableSQL(entity: Entity, databaseType: string): string {
    const tableName = this.toSnakeCase(entity.name);
    const quotes = databaseType === 'mysql' ? '`' : '"';
    
    let sql = `CREATE TABLE ${quotes}${tableName}${quotes} (\n`;
    const columns: string[] = [];

    // Add ID field if not present
    const hasIdField = Object.keys(entity.fields).some(key => key === 'id');
    if (!hasIdField) {
      if (databaseType === 'postgresql') {
        columns.push(`  ${quotes}id${quotes} TEXT NOT NULL`);
      } else if (databaseType === 'sqlite') {
        columns.push(`  ${quotes}id${quotes} TEXT NOT NULL PRIMARY KEY`);
      } else if (databaseType === 'mysql') {
        columns.push(`  ${quotes}id${quotes} VARCHAR(191) NOT NULL`);
      }
    }

    // Add entity fields
    Object.entries(entity.fields).forEach(([fieldName, field]) => {
      const column = this.buildColumnSQL(fieldName, field, databaseType);
      columns.push(`  ${column}`);
    });

    // Add multi-tenancy column
    if (this.config.features?.multiTenancy) {
      if (databaseType === 'mysql') {
        columns.push(`  ${quotes}tenant_id${quotes} VARCHAR(191) NOT NULL`);
      } else {
        columns.push(`  ${quotes}tenant_id${quotes} TEXT NOT NULL`);
      }
    }

    // Add audit columns
    if (databaseType === 'postgresql') {
      columns.push(`  ${quotes}created_at${quotes} TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
      columns.push(`  ${quotes}updated_at${quotes} TIMESTAMP(3) NOT NULL`);
    } else if (databaseType === 'sqlite') {
      columns.push(`  ${quotes}created_at${quotes} DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
      columns.push(`  ${quotes}updated_at${quotes} DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    } else if (databaseType === 'mysql') {
      columns.push(`  ${quotes}created_at${quotes} DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)`);
      columns.push(`  ${quotes}updated_at${quotes} DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`);
    }

    // Add primary key constraint for PostgreSQL and MySQL
    if (databaseType !== 'sqlite') {
      if (databaseType === 'mysql') {
        columns.push(`  PRIMARY KEY (${quotes}id${quotes})`);
      } else {
        columns.push(`  CONSTRAINT ${quotes}${tableName}_pkey${quotes} PRIMARY KEY (${quotes}id${quotes})`);
      }
    }

    sql += columns.join(',\n') + '\n';
    sql += ');';

    return sql;
  }

  private buildColumnSQL(fieldName: string, field: EntityField, databaseType: string): string {
    const dbFieldName = this.toSnakeCase(fieldName);
    const quotes = databaseType === 'mysql' ? '`' : '"';
    let sqlType = this.mapToSQLType(field.type, databaseType);
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
    return `${quotes}${dbFieldName}${quotes} ${sqlType}${constraintString}`;
  }

  private mapToSQLType(fieldType: string, databaseType: string): string {
    switch (fieldType) {
      case 'string':
        return databaseType === 'mysql' ? 'VARCHAR(191)' : 'TEXT';
      case 'text':
        return 'TEXT';
      case 'number':
      case 'float':
        return databaseType === 'mysql' ? 'DOUBLE' : 'DOUBLE PRECISION';
      case 'integer':
      case 'int':
        return 'INTEGER';
      case 'decimal':
        return 'DECIMAL(10,2)';
      case 'boolean':
      case 'bool':
        return 'BOOLEAN';
      case 'date':
      case 'datetime':
      case 'timestamp':
        if (databaseType === 'mysql') return 'DATETIME(3)';
        if (databaseType === 'sqlite') return 'DATETIME';
        return 'TIMESTAMP(3)';
      case 'json':
        if (databaseType === 'mysql') return 'JSON';
        if (databaseType === 'sqlite') return 'TEXT';
        return 'JSONB';
      default:
        return databaseType === 'mysql' ? 'VARCHAR(191)' : 'TEXT';
    }
  }

  private async generateSeedData(schemaDir: string): Promise<void> {
    const seedPath = path.join(schemaDir, 'seed.ts');
    const seedContent = this.buildSeedFile();
    
    fs.writeFileSync(seedPath, seedContent);
    console.log(`📄 Generated seed file: ${seedPath}`);
  }

  private buildSeedFile(): string {
    const entitySeeds = this.config.database.entities.map(entity => {
      return this.buildEntitySeedData(entity);
    }).join('\n\n');

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
      settings: ${this.getDatabaseType() === 'sqlite' ? '"{}"' : '{}'}
    }
  });

  console.log('✅ Created default tenant:', tenant.name);
  ` : ''}

  ${this.config.features?.authentication ? `
  // Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@${this.config.app.name}.com' },
    update: {},
    create: {
      id: 'user-admin',
      email: 'admin@${this.config.app.name}.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      ${this.config.features?.multiTenancy ? 'tenantId: tenant.id,' : ''}
    }
  });

  console.log('✅ Created admin user:', adminUser.email);
  ` : ''}

  ${entitySeeds}

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

  private buildEntitySeedData(entity: Entity): string {
    const modelName = this.toCamelCase(entity.name);
    const sampleRecords = this.generateSampleRecords(entity, 3);
    
    return `
  // Seed ${entity.displayName}
  ${sampleRecords.map((record, index) => `
  const sample${this.toPascalCase(entity.name)}${index + 1} = await prisma.${modelName}.upsert({
    where: { id: 'sample-${entity.name.toLowerCase()}-${index + 1}' },
    update: {},
    create: {
      id: 'sample-${entity.name.toLowerCase()}-${index + 1}',
      ${record.join(',\n      ')},
      ${this.config.features?.multiTenancy ? 'tenantId: tenant.id,' : ''}
    }
  });`).join('\n')}

  console.log('✅ Created ${sampleRecords.length} ${entity.displayName} records');`;
  }

  private generateSampleRecords(entity: Entity, count: number): string[][] {
    const records: string[][] = [];
    
    for (let i = 0; i < count; i++) {
      const record: string[] = [];
      
      Object.entries(entity.fields).forEach(([fieldName, field]) => {
        if (fieldName === 'id') return; // Skip ID field
        
        const sampleValue = this.generateSampleValue(fieldName, field, entity.name, i);
        if (sampleValue !== null) {
          if (typeof sampleValue === 'string') {
            record.push(`${fieldName}: "${sampleValue}"`);
          } else {
            record.push(`${fieldName}: ${sampleValue}`);
          }
        }
      });
      
      records.push(record);
    }
    
    return records;
  }

  private generateSampleValue(fieldName: string, field: EntityField, entityName: string, index: number): any {
    // Generate domain-specific sample data based on field name and entity type
    const fname = fieldName.toLowerCase();
    const ename = entityName.toLowerCase();
    
    // Handle default values
    if (field.default !== undefined) {
      return field.default;
    }
    
    // Handle enum values
    if (field.validation?.enum) {
      return field.validation.enum[index % field.validation.enum.length];
    }
    
    // Generate type-specific samples
    switch (field.type) {
      case 'string':
      case 'text':
        return this.generateStringValue(fname, ename, index);
      case 'number':
      case 'float':
      case 'integer':
      case 'int':
        return this.generateNumberValue(fname, ename, index);
      case 'decimal':
        return this.generateDecimalValue(fname, ename, index);
      case 'boolean':
      case 'bool':
        return index % 2 === 0;
      case 'date':
      case 'datetime':
      case 'timestamp':
        return null; // Will use default timestamps
      case 'json':
        return this.getDatabaseType() === 'sqlite' ? '"{}"' : null;
      default:
        return `Sample ${fname}`;
    }
  }

  private generateStringValue(fieldName: string, entityName: string, index: number): string {
    // Domain-specific string generation
    if (fieldName.includes('name') || fieldName.includes('title')) {
      const samples = [`Sample ${entityName} ${index + 1}`, `Test ${entityName}`, `Demo ${entityName}`];
      return samples[index % samples.length];
    }
    
    if (fieldName.includes('email')) {
      return `sample${index + 1}@${entityName}.com`;
    }
    
    if (fieldName.includes('phone')) {
      return `+1-555-010${index + 1}`;
    }
    
    if (fieldName.includes('address')) {
      const addresses = ['123 Main St', '456 Oak Ave', '789 Pine Rd'];
      return addresses[index % addresses.length];
    }
    
    if (fieldName.includes('city')) {
      const cities = ['New York', 'Los Angeles', 'Chicago'];
      return cities[index % cities.length];
    }
    
    if (fieldName.includes('description')) {
      return `This is a sample description for ${entityName} ${index + 1}`;
    }
    
    return `Sample ${fieldName} ${index + 1}`;
  }

  private generateNumberValue(fieldName: string, entityName: string, index: number): number {
    if (fieldName.includes('price') || fieldName.includes('cost')) {
      return (index + 1) * 100;
    }
    
    if (fieldName.includes('quantity') || fieldName.includes('count')) {
      return index + 1;
    }
    
    if (fieldName.includes('age')) {
      return 25 + index;
    }
    
    return (index + 1) * 10;
  }

  private generateDecimalValue(fieldName: string, entityName: string, index: number): number {
    if (fieldName.includes('price') || fieldName.includes('cost')) {
      return parseFloat(((index + 1) * 99.99).toFixed(2));
    }
    
    if (fieldName.includes('rate')) {
      return parseFloat((4.5 - index * 0.1).toFixed(1));
    }
    
    return parseFloat(((index + 1) * 10.50).toFixed(2));
  }

  private async generateAnalyticsSchema(schemaDir: string): Promise<void> {
    const analyticsModels = `
// Analytics and Business Intelligence Models

model AnalyticsEvent {
  id            String   @id @default(cuid())
  eventType     String   // 'page_view', 'action', 'conversion', etc.
  entityType    String?  // Related entity type
  entityId      String?  // Related entity ID
  userId        String?
  sessionId     String?
  properties    ${this.getDatabaseType() === 'sqlite' ? 'String?' : 'Json?'}
  timestamp     DateTime @default(now())
  ipAddress     String?
  userAgent     String?
  referrer      String?
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  ${this.config.features?.multiTenancy ? 'tenantId String' : ''}
  
  @@index([eventType, timestamp])
  @@index([entityType, entityId])
  @@index([userId])
  ${this.config.features?.multiTenancy ? '@@index([tenantId])' : ''}
  @@map("analytics_events")
}

model BusinessMetric {
  id            String   @id @default(cuid())
  metricName    String   // 'revenue', 'users', 'conversions', etc.
  metricValue   Float
  period        String   // 'daily', 'weekly', 'monthly'
  periodStart   DateTime
  periodEnd     DateTime
  dimensions    ${this.getDatabaseType() === 'sqlite' ? 'String?' : 'Json?'} // Additional breakdown data
  ${this.config.features?.multiTenancy ? 'tenantId String' : ''}
  createdAt     DateTime @default(now())
  
  @@unique([metricName, period, periodStart, ${this.config.features?.multiTenancy ? 'tenantId' : 'id'}])
  @@index([metricName, periodStart])
  ${this.config.features?.multiTenancy ? '@@index([tenantId])' : ''}
  @@map("business_metrics")
}

model DataQualityCheck {
  id            String   @id @default(cuid())
  tableName     String
  checkType     String   // 'completeness', 'uniqueness', 'validity', 'consistency'
  checkRule     String   // Description of the rule
  passed        Boolean
  score         Float?   // Quality score 0-100
  details       ${this.getDatabaseType() === 'sqlite' ? 'String?' : 'Json?'}
  checkedAt     DateTime @default(now())
  ${this.config.features?.multiTenancy ? 'tenantId String' : ''}
  
  @@index([tableName, checkType])
  @@index([checkedAt])
  ${this.config.features?.multiTenancy ? '@@index([tenantId])' : ''}
  @@map("data_quality_checks")
}

model UserSession {
  id            String   @id @default(cuid())
  userId        String?
  sessionId     String   @unique
  startTime     DateTime @default(now())
  endTime       DateTime?
  duration      Int?     // Session duration in seconds
  pageViews     Int      @default(0)
  events        Int      @default(0)
  ipAddress     String?
  userAgent     String?
  country       String?
  city          String?
  device        String?
  browser       String?
  ${this.config.features?.multiTenancy ? 'tenantId String' : ''}
  
  @@index([userId])
  @@index([startTime])
  ${this.config.features?.multiTenancy ? '@@index([tenantId])' : ''}
  @@map("user_sessions")
}
`;

    // Append analytics models to schema
    const schemaPath = path.join(schemaDir, 'schema.prisma');
    const existingSchema = fs.readFileSync(schemaPath, 'utf8');
    fs.writeFileSync(schemaPath, existingSchema + analyticsModels);
    
    console.log('📊 Added analytics models to schema');
  }

  private async generateAuditSystem(schemaDir: string): Promise<void> {
    const auditModels = `
// Comprehensive Audit Trail System

model AuditLog {
  id            String   @id @default(cuid())
  tableName     String
  recordId      String
  action        String   // 'CREATE', 'UPDATE', 'DELETE', 'READ'
  userId        String?
  oldValues     ${this.getDatabaseType() === 'sqlite' ? 'String?' : 'Json?'}
  newValues     ${this.getDatabaseType() === 'sqlite' ? 'String?' : 'Json?'}
  changedFields String[] // Array of field names that changed
  ipAddress     String?
  userAgent     String?
  timestamp     DateTime @default(now())
  ${this.config.features?.multiTenancy ? 'tenantId String' : ''}
  
  @@index([tableName, recordId])
  @@index([userId])
  @@index([timestamp])
  @@index([action])
  ${this.config.features?.multiTenancy ? '@@index([tenantId])' : ''}
  @@map("audit_logs")
}

model SystemLog {
  id            String   @id @default(cuid())
  level         String   // 'ERROR', 'WARN', 'INFO', 'DEBUG'
  message       String
  source        String   // Service/component that generated the log
  context       ${this.getDatabaseType() === 'sqlite' ? 'String?' : 'Json?'}
  userId        String?
  requestId     String?
  timestamp     DateTime @default(now())
  ${this.config.features?.multiTenancy ? 'tenantId String?' : ''}
  
  @@index([level, timestamp])
  @@index([source])
  @@index([requestId])
  ${this.config.features?.multiTenancy ? '@@index([tenantId])' : ''}
  @@map("system_logs")
}

model SecurityEvent {
  id            String   @id @default(cuid())
  eventType     String   // 'login_attempt', 'permission_denied', 'suspicious_activity'
  severity      String   // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  userId        String?
  ipAddress     String?
  userAgent     String?
  details       ${this.getDatabaseType() === 'sqlite' ? 'String?' : 'Json?'}
  resolved      Boolean  @default(false)
  resolvedBy    String?
  resolvedAt    DateTime?
  timestamp     DateTime @default(now())
  ${this.config.features?.multiTenancy ? 'tenantId String?' : ''}
  
  @@index([eventType, timestamp])
  @@index([severity])
  @@index([userId])
  ${this.config.features?.multiTenancy ? '@@index([tenantId])' : ''}
  @@map("security_events")
}
`;

    // Append audit models to schema
    const schemaPath = path.join(schemaDir, 'schema.prisma');
    const existingSchema = fs.readFileSync(schemaPath, 'utf8');
    fs.writeFileSync(schemaPath, existingSchema + auditModels);
    
    // Generate audit trigger functions
    await this.generateAuditTriggers(schemaDir);
    
    console.log('🔍 Added comprehensive audit system');
  }

  private async generateAuditTriggers(schemaDir: string): Promise<void> {
    const migrationsDir = path.join(schemaDir, 'migrations');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const migrationDir = path.join(migrationsDir, `${timestamp}_audit_triggers`);
    fs.mkdirSync(migrationDir, { recursive: true });

    const auditTriggerSQL = `
-- Audit Trigger Functions (PostgreSQL)
${this.getDatabaseType() === 'postgresql' ? `
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (id, table_name, record_id, action, old_values, user_id, timestamp)
    VALUES (
      gen_random_uuid()::text,
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      current_setting('app.current_user_id', true),
      NOW()
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (id, table_name, record_id, action, old_values, new_values, user_id, timestamp)
    VALUES (
      gen_random_uuid()::text,
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      current_setting('app.current_user_id', true),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (id, table_name, record_id, action, new_values, user_id, timestamp)
    VALUES (
      gen_random_uuid()::text,
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      to_jsonb(NEW),
      current_setting('app.current_user_id', true),
      NOW()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for all entity tables
${this.config.database.entities.map(entity => {
  const tableName = this.toSnakeCase(entity.name);
  return `
CREATE TRIGGER ${tableName}_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "${tableName}"
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();`;
}).join('')}
` : '-- Audit triggers are only supported for PostgreSQL'}
`;

    fs.writeFileSync(
      path.join(migrationDir, 'migration.sql'),
      auditTriggerSQL
    );
  }

  private async generateBIViews(schemaDir: string): Promise<void> {
    const migrationsDir = path.join(schemaDir, 'migrations');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const migrationDir = path.join(migrationsDir, `${timestamp}_bi_views`);
    fs.mkdirSync(migrationDir, { recursive: true });

    const biViewsSQL = `
-- Business Intelligence Views

-- Daily Analytics Summary
CREATE VIEW daily_analytics AS
SELECT 
  DATE(timestamp) as date,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp), event_type
ORDER BY date DESC, event_count DESC;

-- User Engagement Metrics
CREATE VIEW user_engagement AS
SELECT 
  DATE(start_time) as date,
  COUNT(*) as total_sessions,
  AVG(duration) as avg_session_duration,
  AVG(page_views) as avg_page_views,
  SUM(CASE WHEN duration > 300 THEN 1 ELSE 0 END)::float / COUNT(*) as engagement_rate
FROM user_sessions
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(start_time)
ORDER BY date DESC;

-- Entity Growth Metrics
${this.config.database.entities.map(entity => {
  const tableName = this.toSnakeCase(entity.name);
  return `
CREATE VIEW ${tableName}_growth AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_records,
  SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as cumulative_records
FROM "${tableName}"
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;`;
}).join('')}

-- Data Quality Dashboard
CREATE VIEW data_quality_summary AS
SELECT 
  table_name,
  check_type,
  AVG(score) as avg_quality_score,
  COUNT(*) as total_checks,
  SUM(CASE WHEN passed THEN 1 ELSE 0 END)::float / COUNT(*) as pass_rate,
  MAX(checked_at) as last_check
FROM data_quality_checks
WHERE checked_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY table_name, check_type
ORDER BY avg_quality_score ASC;

-- Security Events Summary
CREATE VIEW security_dashboard AS
SELECT 
  DATE(timestamp) as date,
  event_type,
  severity,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as affected_users,
  SUM(CASE WHEN resolved THEN 0 ELSE 1 END) as unresolved_count
FROM security_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp), event_type, severity
ORDER BY date DESC, event_count DESC;
`;

    fs.writeFileSync(
      path.join(migrationDir, 'migration.sql'),
      biViewsSQL
    );
    
    console.log('📈 Generated Business Intelligence views');
  }

  private async generateDataTransformUtils(outputDir: string): Promise<void> {
    const utilsDir = path.join(outputDir, 'lib', 'analytics');
    fs.mkdirSync(utilsDir, { recursive: true });

    // Generate Analytics Service
    const analyticsService = `
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class AnalyticsService {
  static async trackEvent(data: {
    eventType: string
    entityType?: string
    entityId?: string
    userId?: string
    sessionId?: string
    properties?: any
    ${this.config.features?.multiTenancy ? 'tenantId?: string' : ''}
  }) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          ...data,
          properties: data.properties ? JSON.stringify(data.properties) : null,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  static async getDailyMetrics(days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    return await prisma.$queryRaw\`
      SELECT 
        DATE(timestamp) as date,
        event_type,
        COUNT(*) as count
      FROM analytics_events 
      WHERE timestamp >= \${startDate}
      GROUP BY DATE(timestamp), event_type
      ORDER BY date DESC
    \`
  }

  static async getUserEngagement(days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    return await prisma.$queryRaw\`
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as sessions,
        AVG(duration) as avg_duration,
        COUNT(DISTINCT user_id) as unique_users
      FROM user_sessions 
      WHERE start_time >= \${startDate}
      GROUP BY DATE(start_time)
      ORDER BY date DESC
    \`
  }

  static async recordBusinessMetric(data: {
    metricName: string
    metricValue: number
    period: 'daily' | 'weekly' | 'monthly'
    periodStart: Date
    periodEnd: Date
    dimensions?: any
    ${this.config.features?.multiTenancy ? 'tenantId?: string' : ''}
  }) {
    return await prisma.businessMetric.upsert({
      where: {
        metricName_period_periodStart${this.config.features?.multiTenancy ? '_tenantId' : ''}: {
          metricName: data.metricName,
          period: data.period,
          periodStart: data.periodStart,
          ${this.config.features?.multiTenancy ? 'tenantId: data.tenantId || "",' : ''}
        }
      },
      update: {
        metricValue: data.metricValue,
        dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null
      },
      create: {
        ...data,
        dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null
      }
    })
  }

  static async runDataQualityCheck(tableName: string, checkType: string, rule: string) {
    // This would contain actual data quality validation logic
    // For now, we'll create a placeholder implementation
    
    let passed = true
    let score = 100
    let details = {}
    
    try {
      // Example: Check for null values in required fields
      if (checkType === 'completeness') {
        // Implementation would go here
      }
      
      await prisma.dataQualityCheck.create({
        data: {
          tableName,
          checkType,
          checkRule: rule,
          passed,
          score,
          details: JSON.stringify(details),
          ${this.config.features?.multiTenancy ? 'tenantId: "default",' : ''}
        }
      })
    } catch (error) {
      console.error('Data quality check failed:', error)
    }
  }

  static async getDataQualitySummary() {
    return await prisma.$queryRaw\`
      SELECT 
        table_name,
        AVG(score) as avg_score,
        COUNT(*) as total_checks,
        SUM(CASE WHEN passed THEN 1 ELSE 0 END)::float / COUNT(*) as pass_rate
      FROM data_quality_checks
      WHERE checked_at >= NOW() - INTERVAL '7 days'
      GROUP BY table_name
      ORDER BY avg_score ASC
    \`
  }
}
`;

    fs.writeFileSync(path.join(utilsDir, 'AnalyticsService.ts'), analyticsService);

    // Generate Audit Service
    const auditService = `
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class AuditService {
  static async logSystemEvent(data: {
    level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'
    message: string
    source: string
    context?: any
    userId?: string
    requestId?: string
    ${this.config.features?.multiTenancy ? 'tenantId?: string' : ''}
  }) {
    try {
      await prisma.systemLog.create({
        data: {
          ...data,
          context: data.context ? JSON.stringify(data.context) : null
        }
      })
    } catch (error) {
      console.error('Failed to log system event:', error)
    }
  }

  static async logSecurityEvent(data: {
    eventType: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    userId?: string
    ipAddress?: string
    userAgent?: string
    details?: any
    ${this.config.features?.multiTenancy ? 'tenantId?: string' : ''}
  }) {
    try {
      await prisma.securityEvent.create({
        data: {
          ...data,
          details: data.details ? JSON.stringify(data.details) : null
        }
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  static async getAuditTrail(tableName: string, recordId: string) {
    return await prisma.auditLog.findMany({
      where: {
        tableName,
        recordId
      },
      orderBy: {
        timestamp: 'desc'
      }
    })
  }

  static async getSecurityAlerts(severity?: string) {
    return await prisma.securityEvent.findMany({
      where: {
        resolved: false,
        ...(severity && { severity })
      },
      orderBy: {
        timestamp: 'desc'
      }
    })
  }

  static async resolveSecurityEvent(id: string, resolvedBy: string) {
    return await prisma.securityEvent.update({
      where: { id },
      data: {
        resolved: true,
        resolvedBy,
        resolvedAt: new Date()
      }
    })
  }
}
`;

    fs.writeFileSync(path.join(utilsDir, 'AuditService.ts'), auditService);
    
    console.log('🛠️ Generated analytics and audit utilities');
  }

  // Utility methods
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