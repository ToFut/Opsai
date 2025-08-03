import { GMILevelUIGenerator, GMILevelApplication } from './gmi-level-ui-generator';
import { SupabaseBackendGenerator, SupabaseBackendConfig, GeneratedBackend } from './supabase-backend-generator';
import { PrismaSchemaModel } from '@opsai/database/src/analyzers/schema-analyzer';
import { BusinessFlow } from '@opsai/core/src/engines/business-flow-engine';
import { BusinessContext } from './intelligent-ui-generator';
import { Logger } from '@opsai/shared';

export interface FullStackApplication {
  id: string;
  name: string;
  description: string;
  
  // Frontend (UI)
  frontend: GMILevelApplication;
  
  // Backend (Supabase + API)
  backend: GeneratedBackend;
  
  // Database
  database: {
    prismaSchema: string;
    supabaseMigrations: string[];
    seedData: string;
    rlsPolicies: string[];
  };
  
  // Configuration
  configuration: {
    environment: Record<string, string>;
    deployment: DeploymentConfig;
    monitoring: MonitoringConfig;
    security: SecurityConfig;
  };
  
  // Documentation
  documentation: {
    readme: string;
    apiDocs: string;
    userGuide: string;
    deploymentGuide: string;
  };
  
  // Metadata
  metadata: {
    generatedAt: Date;
    version: string;
    sophisticationLevel: 'enterprise-fullstack';
    estimatedValue: string;
    techStack: string[];
  };
}

export interface DeploymentConfig {
  platform: 'vercel' | 'netlify' | 'aws' | 'railway';
  database: 'supabase';
  cdn: 'cloudflare' | 'aws-cloudfront';
  monitoring: 'supabase' | 'datadog' | 'newrelic';
  analytics: 'vercel-analytics' | 'google-analytics';
}

export interface MonitoringConfig {
  errorTracking: boolean;
  performanceMonitoring: boolean;
  uptime: boolean;
  logs: boolean;
  metrics: boolean;
}

export interface SecurityConfig {
  rls: boolean;
  auth: boolean;
  apiKeys: boolean;
  cors: boolean;
  rateLimiting: boolean;
  encryption: boolean;
}

export class FullStackGenerator {
  private uiGenerator: GMILevelUIGenerator;
  private backendGenerator: SupabaseBackendGenerator;
  private logger: Logger;

  constructor(supabaseConfig: SupabaseBackendConfig) {
    this.uiGenerator = new GMILevelUIGenerator();
    this.backendGenerator = new SupabaseBackendGenerator(supabaseConfig);
    this.logger = new Logger('FullStackGenerator');
  }

  async generateCompleteApplication(
    businessContext: BusinessContext,
    schema: PrismaSchemaModel[],
    flows: BusinessFlow[],
    options?: {
      deploymentPlatform?: string;
      includeDemoData?: boolean;
      enableMonitoring?: boolean;
      customDomain?: string;
    }
  ): Promise<FullStackApplication> {
    this.logger.info('Generating complete full-stack application', {
      industry: businessContext.industry,
      entities: schema.length,
      flows: flows.length,
      options
    });

    // Generate frontend (UI)
    this.logger.info('Generating frontend...');
    const frontend = await this.uiGenerator.generateGMILevelApplication(
      businessContext,
      schema,
      flows
    );

    // Generate backend (API + Services)
    this.logger.info('Generating backend...');
    const backend = await this.backendGenerator.generateCompleteBackend(
      businessContext,
      schema
    );

    // Generate database components
    this.logger.info('Generating database...');
    const database = await this.generateDatabaseComponents(schema, businessContext);

    // Generate configuration
    this.logger.info('Generating configuration...');
    const configuration = this.generateConfiguration(businessContext, options);

    // Generate documentation
    this.logger.info('Generating documentation...');
    const documentation = await this.generateDocumentation(
      businessContext,
      schema,
      frontend,
      backend
    );

    // Generate metadata
    const metadata = this.generateMetadata(businessContext, schema.length, flows.length);

    const application: FullStackApplication = {
      id: `fullstack-${businessContext.industry}-${Date.now()}`,
      name: `${businessContext.industry} Enterprise Platform`,
      description: `Complete enterprise SaaS platform for ${businessContext.industry} with AI-powered features`,
      frontend,
      backend,
      database,
      configuration,
      documentation,
      metadata
    };

    this.logger.info('Full-stack application generated successfully', {
      id: application.id,
      components: frontend.components.length,
      apiRoutes: Object.keys(backend.apiRoutes).length
    });

    return application;
  }

  private async generateDatabaseComponents(
    schema: PrismaSchemaModel[],
    context: BusinessContext
  ) {
    // Generate Prisma schema for Supabase
    const prismaSchema = this.generatePrismaSchema(schema, context);
    
    // Generate Supabase migrations
    const supabaseMigrations = this.generateSupabaseMigrations(schema, context);
    
    // Generate seed data
    const seedData = await this.generateSeedData(schema, context);
    
    // Generate RLS policies
    const rlsPolicies = this.generateRLSPolicies(schema, context);

    return {
      prismaSchema,
      supabaseMigrations,
      seedData,
      rlsPolicies
    };
  }

  private generatePrismaSchema(schema: PrismaSchemaModel[], context: BusinessContext): string {
    return `// Generated Prisma Schema for Supabase
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Core tenant model for multi-tenancy
model Tenant {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  plan        String   @default("free")
  isActive    Boolean  @default(true)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations to all tenant-scoped entities
  users       User[]
  ${schema.map(model => `  ${model.name.toLowerCase()}s  ${model.name}[]`).join('\n  ')}

  @@map("tenants")
}

// Enhanced user model with role-based access
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  firstName   String?
  lastName    String?
  role        String    @default("user")
  permissions Json?
  metadata    Json?
  tenantId    String
  isActive    Boolean   @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Activity tracking
  activities  Activity[]

  @@index([tenantId])
  @@index([email])
  @@map("users")
}

// Activity logging for audit trail
model Activity {
  id          String   @id @default(cuid())
  type        String
  entity      String?
  entityId    String?
  description String
  metadata    Json?
  userId      String?
  tenantId    String
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id])

  @@index([tenantId, createdAt])
  @@index([userId])
  @@index([entity, entityId])
  @@map("activities")
}

${schema.map(model => this.generateModelDefinition(model, context)).join('\n\n')}

// AI Insights storage
model AIInsight {
  id          String   @id @default(cuid())
  type        String
  entity      String?
  entityId    String?
  title       String
  description String
  confidence  Float
  impact      String
  urgency     String
  metadata    Json?
  tenantId    String
  createdAt   DateTime @default(now())
  expiresAt   DateTime?

  @@index([tenantId, createdAt])
  @@index([entity, entityId])
  @@map("ai_insights")
}

// Real-time notifications
model Notification {
  id          String   @id @default(cuid())
  type        String
  title       String
  message     String
  data        Json?
  userId      String?
  tenantId    String
  read        Boolean  @default(false)
  readAt      DateTime?
  createdAt   DateTime @default(now())

  @@index([userId, read])
  @@index([tenantId, createdAt])
  @@map("notifications")
}`;
  }

  private generateModelDefinition(model: PrismaSchemaModel, context: BusinessContext): string {
    const fields = model.fields.map(field => {
      let fieldDef = `  ${field.name}`;
      
      // Add type
      if (field.isList) {
        fieldDef += `    ${field.type}[]`;
      } else {
        fieldDef += `    ${field.type}`;
      }
      
      // Add modifiers
      if (!field.isOptional && field.kind === 'scalar') {
        // Required fields
      } else {
        fieldDef += '?';
      }
      
      // Add default values
      if (field.default) {
        if (field.type === 'String') {
          fieldDef += ` @default("${field.default}")`;
        } else if (field.type === 'DateTime') {
          fieldDef += ` @default(now())`;
        } else if (field.type === 'Boolean') {
          fieldDef += ` @default(${field.default})`;
        } else {
          fieldDef += ` @default(${field.default})`;
        }
      }
      
      // Add special attributes
      if (field.name === 'id') {
        fieldDef += ` @id @default(cuid())`;
      }
      if (field.isUnique) {
        fieldDef += ` @unique`;
      }
      
      return fieldDef;
    }).join('\n');

    return `model ${model.name} {
${fields}
  tenantId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("${model.name.toLowerCase()}s")
}`;
  }

  private generateSupabaseMigrations(schema: PrismaSchemaModel[], context: BusinessContext): string[] {
    const migrations: string[] = [];

    // Base migration with RLS setup
    migrations.push(`-- Migration: Setup RLS and base tables
-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenants (users can only see their own tenant)
CREATE POLICY "Users can only see their own tenant" ON tenants
  FOR ALL USING (id = auth.jwt() ->> 'tenant_id');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user',
  permissions JSONB,
  metadata JSONB,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users
CREATE POLICY "Users can only see users in their tenant" ON users
  FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Create indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);`);

    // Generate migration for each business entity
    schema.forEach(model => {
      migrations.push(this.generateEntityMigration(model, context));
    });

    return migrations;
  }

  private generateEntityMigration(model: PrismaSchemaModel, context: BusinessContext): string {
    const tableName = model.name.toLowerCase() + 's';
    
    return `-- Migration: Create ${model.name} table
CREATE TABLE IF NOT EXISTS ${tableName} (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ${model.fields.map(field => this.generateColumnDefinition(field, context)).join(',\n  ')},
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "${model.name} tenant isolation" ON ${tableName}
  FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Create indexes
CREATE INDEX idx_${tableName}_tenant_id ON ${tableName}(tenant_id);
CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_${tableName}_updated_at BEFORE UPDATE ON ${tableName}
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;
  }

  private generateColumnDefinition(field: any, context: BusinessContext): string {
    let colType = 'TEXT';
    
    switch (field.type) {
      case 'String': colType = 'TEXT'; break;
      case 'Int': colType = 'INTEGER'; break;
      case 'Float': colType = 'DECIMAL'; break;
      case 'Boolean': colType = 'BOOLEAN'; break;
      case 'DateTime': colType = 'TIMESTAMP WITH TIME ZONE'; break;
      case 'Json': colType = 'JSONB'; break;
      default: colType = 'TEXT';
    }
    
    let definition = `${field.name} ${colType}`;
    
    if (!field.isOptional && field.kind === 'scalar') {
      definition += ' NOT NULL';
    }
    
    if (field.default) {
      if (field.type === 'String') {
        definition += ` DEFAULT '${field.default}'`;
      } else if (field.type === 'DateTime') {
        definition += ` DEFAULT now()`;
      } else {
        definition += ` DEFAULT ${field.default}`;
      }
    }
    
    return definition;
  }

  private async generateSeedData(schema: PrismaSchemaModel[], context: BusinessContext): Promise<string> {
    return `-- Seed data for ${context.industry} platform
-- Demo tenant
INSERT INTO tenants (id, name, slug, plan, is_active) VALUES
  ('demo-tenant-id', 'Demo Company', 'demo-company', 'enterprise', true);

-- Demo users
INSERT INTO users (id, email, first_name, last_name, role, tenant_id, is_active) VALUES
  ('admin-user-id', 'admin@demo.com', 'Admin', 'User', 'admin', 'demo-tenant-id', true),
  ('manager-user-id', 'manager@demo.com', 'Manager', 'User', 'manager', 'demo-tenant-id', true),
  ('user-user-id', 'user@demo.com', 'Regular', 'User', 'user', 'demo-tenant-id', true);

${schema.map(model => this.generateModelSeedData(model, context)).join('\n\n')}`;
  }

  private generateModelSeedData(model: PrismaSchemaModel, context: BusinessContext): string {
    const tableName = model.name.toLowerCase() + 's';
    
    // Generate sample data based on industry and entity type
    const sampleData = this.generateSampleDataForEntity(model.name, context);
    
    return `-- Sample ${model.name} data
INSERT INTO ${tableName} (${sampleData.columns.join(', ')}, tenant_id) VALUES
${sampleData.rows.map(row => `  (${row.join(', ')}, 'demo-tenant-id')`).join(',\n')};`;
  }

  private generateSampleDataForEntity(entityName: string, context: BusinessContext): any {
    // This would generate realistic sample data based on the entity type and industry
    return {
      columns: ['id', 'name', 'status'],
      rows: [
        [`'sample-${entityName.toLowerCase()}-1'`, `'Sample ${entityName} 1'`, `'active'`],
        [`'sample-${entityName.toLowerCase()}-2'`, `'Sample ${entityName} 2'`, `'active'`]
      ]
    };
  }

  private generateRLSPolicies(schema: PrismaSchemaModel[], context: BusinessContext): string[] {
    const policies: string[] = [];
    
    // Generate comprehensive RLS policies for each entity
    schema.forEach(model => {
      const tableName = model.name.toLowerCase() + 's';
      
      policies.push(`-- RLS Policies for ${model.name}
-- Basic tenant isolation
CREATE POLICY "${model.name}_tenant_isolation" ON ${tableName}
  FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Role-based access for admins
CREATE POLICY "${model.name}_admin_access" ON ${tableName}
  FOR ALL USING (
    tenant_id = auth.jwt() ->> 'tenant_id' AND
    auth.jwt() ->> 'role' = 'admin'
  );

-- Manager access (read/write for their department)
CREATE POLICY "${model.name}_manager_access" ON ${tableName}
  FOR ALL USING (
    tenant_id = auth.jwt() ->> 'tenant_id' AND
    (auth.jwt() ->> 'role' = 'manager' OR auth.jwt() ->> 'role' = 'admin')
  );

-- User access (read-only for most entities)
CREATE POLICY "${model.name}_user_read" ON ${tableName}
  FOR SELECT USING (
    tenant_id = auth.jwt() ->> 'tenant_id'
  );`);
    });
    
    return policies;
  }

  private generateConfiguration(
    context: BusinessContext,
    options?: any
  ) {
    return {
      environment: {
        'NEXT_PUBLIC_SUPABASE_URL': 'your_supabase_url',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'your_supabase_anon_key',
        'SUPABASE_SERVICE_ROLE_KEY': 'your_supabase_service_role_key',
        'DATABASE_URL': 'postgresql://postgres:[password]@db.[project_id].supabase.co:5432/postgres',
        'NEXTAUTH_URL': 'http://localhost:3000',
        'NEXTAUTH_SECRET': 'your_nextauth_secret',
        'OPENAI_API_KEY': 'your_openai_api_key',
        'NEXT_PUBLIC_APP_NAME': `${context.industry} Platform`,
        'NEXT_PUBLIC_APP_DESCRIPTION': `Enterprise ${context.industry} platform with AI`
      },
      deployment: {
        platform: options?.deploymentPlatform || 'vercel',
        database: 'supabase',
        cdn: 'vercel',
        monitoring: 'supabase',
        analytics: 'vercel-analytics'
      } as DeploymentConfig,
      monitoring: {
        errorTracking: true,
        performanceMonitoring: true,
        uptime: true,
        logs: true,
        metrics: true
      } as MonitoringConfig,
      security: {
        rls: true,
        auth: true,
        apiKeys: true,
        cors: true,
        rateLimiting: true,
        encryption: true
      } as SecurityConfig
    };
  }

  private async generateDocumentation(
    context: BusinessContext,
    schema: PrismaSchemaModel[],
    frontend: GMILevelApplication,
    backend: GeneratedBackend
  ) {
    return {
      readme: `# ${context.industry} Enterprise Platform

A complete enterprise SaaS platform built with Next.js, Supabase, and AI-powered features.

## Features

- 🤖 AI-Powered Assistant
- 📊 Real-time Analytics
- 👥 Multi-role Access Control
- 🔐 Row-Level Security
- 📱 Mobile Responsive
- ⚡ Real-time Collaboration

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase, PostgreSQL, Edge Functions
- **AI**: OpenAI GPT-4, Custom AI Services
- **Real-time**: WebSockets, Server-Sent Events
- **Deployment**: Vercel, Supabase

## Quick Start

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Set up environment variables
4. Run migrations: \`npm run db:migrate\`
5. Start development: \`npm run dev\`

## Generated Components

${frontend.components.map(comp => `- ${comp.name}: ${comp.type}`).join('\n')}

## API Routes

${Object.keys(backend.apiRoutes).map(route => `- ${route}`).join('\n')}

## Business Logic

This platform includes industry-specific business logic for ${context.industry}:

${context.userRoles.map(role => `- ${role.name}: ${role.permissions.join(', ')}`).join('\n')}
`,

      apiDocs: `# API Documentation

## Authentication

All API endpoints require authentication via Supabase Auth.

## Endpoints

${Object.entries(backend.apiRoutes).map(([route, code]) => 
  `### ${route.replace(/\[([^\]]+)\]/g, '{$1}')}\n\nGenerated endpoint with business logic.\n`
).join('\n')}`,

      userGuide: `# User Guide

## Getting Started

Welcome to your ${context.industry} platform! This guide will help you get started.

## Roles and Permissions

${context.userRoles.map(role => 
  `### ${role.name}\n- ${role.permissions.join('\n- ')}\n`
).join('\n')}

## AI Assistant

The platform includes an AI assistant that can help you with:
- Data analysis and insights
- Workflow automation
- Business recommendations
- Real-time support
`,

      deploymentGuide: `# Deployment Guide

## Supabase Setup

1. Create a new Supabase project
2. Run the generated migrations
3. Set up Row Level Security policies
4. Configure authentication providers

## Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables
3. Deploy!

## Environment Variables

\`\`\`env
${Object.entries(this.generateConfiguration(context).environment)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')}
\`\`\`
`
    };
  }

  private generateMetadata(
    context: BusinessContext,
    entityCount: number,
    flowCount: number
  ) {
    return {
      generatedAt: new Date(),
      version: '1.0.0',
      sophisticationLevel: 'enterprise-fullstack' as const,
      estimatedValue: `$${(entityCount * 10000 + flowCount * 5000).toLocaleString()}`,
      techStack: [
        'Next.js 14',
        'React 18',
        'TypeScript',
        'Supabase',
        'PostgreSQL',
        'Tailwind CSS',
        'OpenAI GPT-4',
        'WebSockets',
        'Vercel',
        'Prisma'
      ]
    };
  }
}

export default FullStackGenerator;