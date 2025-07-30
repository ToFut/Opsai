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

    // Generate Prisma schema
    await this.generatePrismaSchema(schemaDir);
    
    // Generate database migrations
    await this.generateMigrations(schemaDir);
    
    // Generate seed data
    await this.generateSeedData(schemaDir);

    console.log('✅ Enhanced database schema generated');
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

    // Add User model for authentication
    if (this.config.features?.authentication) {
      models += this.buildUserModel(databaseType);
    }

    // Add entity models
    models += this.config.database.entities.map(entity => 
      this.buildPrismaModel(entity, databaseType)
    ).join('\n\n');

    return generator + models;
  }

  private getDatabaseType(): string {
    const provider = this.config.services.database.provider;
    switch (provider) {
      case 'core-managed':
      case 'user-postgresql':
        return 'postgresql';
      case 'user-mysql':
        return 'mysql';
      case 'user-sqlite':
        return 'sqlite';
      default:
        return 'postgresql'; // Default fallback
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

    // Handle required/optional fields
    if (!field.required && !prismaType.includes('?') && !prismaType.includes('[]')) {
      prismaType += '?';
    }

    // Handle primary key
    if (field.primary || (fieldName === 'id' && field.unique)) {
      attributes.push('@id @default(cuid())');
    } else if (field.unique) {
      attributes.push('@unique');
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

    // Handle enum validation
    if (field.validation?.enum) {
      // For enums, we'll need to define them separately, but for now use string with validation
      // This is a simplification - ideally we'd generate proper Prisma enums
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
    const relatedModel = this.toPascalCase(relationship.model);
    const fieldName = relationship.foreignKey || this.toCamelCase(relationship.model);

    switch (relationship.type) {
      case 'hasMany':
        return `${this.toCamelCase(relationship.model)}s ${relatedModel}[]`;
      
      case 'belongsTo':
        const foreignKeyField = relationship.foreignKey || `${this.toCamelCase(relationship.model)}Id`;
        return `${foreignKeyField} String\n  ${this.toCamelCase(relationship.model)} ${relatedModel} @relation(fields: [${foreignKeyField}], references: [id])`;
      
      case 'hasOne':
        return `${this.toCamelCase(relationship.model)} ${relatedModel}?`;
      
      case 'manyToMany':
        return `${this.toCamelCase(relationship.model)}s ${relatedModel}[]`;
      
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