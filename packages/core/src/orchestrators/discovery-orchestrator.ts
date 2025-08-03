import { createDataDiscoveryService, DataDiscoveryConfig, DiscoveredDataSource } from '@opsai/integration';
import { createSchemaAnalyzer, SchemaAnalysisResult } from '@opsai/database';
import { createBusinessFlowEngine, BusinessFlowAnalysis } from '../engines/business-flow-engine';
import { createDynamicYAMLGenerator, DynamicYAMLConfig, GeneratedYAMLStructure } from '../generators/dynamic-yaml-generator';
import { createAdaptiveUIGenerator, AdaptiveUIConfig, GeneratedUIStructure } from '@opsai/ui';
import { createDataTransformationPipeline, TransformationResult } from '../transformers/data-transformation-pipeline';
import { AuthService } from '@opsai/auth';
import { prisma } from '@opsai/database';
import { discoveryContext } from '../context/discovery-context';

export interface DiscoveryOrchestrationConfig {
  tenantId: string;
  projectName: string;
  dataDiscovery: DataDiscoveryConfig;
  uiConfig: AdaptiveUIConfig;
  customizations?: {
    theme?: any;
    features?: any;
    integrations?: any;
    deployment?: any;
  };
}

export interface OrchestrationResult {
  discoveryId: string;
  discoveredSources: DiscoveredDataSource[];
  schemaAnalysis: SchemaAnalysisResult;
  businessFlows: BusinessFlowAnalysis;
  transformationResult: TransformationResult;
  yamlConfig: {
    content: string;
    structure: GeneratedYAMLStructure;
  };
  uiStructure: GeneratedUIStructure;
  generatedFiles: GeneratedFile[];
  deploymentInstructions: DeploymentInstructions;
  nextSteps: NextStep[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'typescript' | 'javascript' | 'css' | 'json' | 'yaml' | 'markdown' | 'prisma' | 'sql';
  category: 'schema' | 'api' | 'ui' | 'config' | 'docs' | 'tests' | 'deployment';
  description: string;
}

export interface DeploymentInstructions {
  prerequisites: Prerequisite[];
  environmentVariables: EnvVariable[];
  deploymentSteps: DeploymentStep[];
  postDeployment: PostDeploymentTask[];
  monitoring: MonitoringSetup[];
}

export interface Prerequisite {
  name: string;
  description: string;
  required: boolean;
  installCommand?: string;
  verificationCommand?: string;
}

export interface EnvVariable {
  name: string;
  description: string;
  required: boolean;
  example?: string;
  sensitive: boolean;
}

export interface DeploymentStep {
  order: number;
  title: string;
  description: string;
  command?: string;
  files?: string[];
  validation?: string;
}

export interface PostDeploymentTask {
  name: string;
  description: string;
  command?: string;
  manual?: boolean;
  critical: boolean;
}

export interface MonitoringSetup {
  type: 'health-check' | 'metrics' | 'logs' | 'alerts';
  name: string;
  endpoint?: string;
  configuration: any;
}

export interface NextStep {
  category: 'immediate' | 'short-term' | 'long-term';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  dependencies?: string[];
}

export class DiscoveryOrchestrator {
  private config: DiscoveryOrchestrationConfig;
  private authService: AuthService;

  constructor(config: DiscoveryOrchestrationConfig) {
    this.config = config;
    this.authService = new AuthService();
  }

  /**
   * Execute the complete discovery and generation flow
   */
  async executeDiscoveryFlow(sourceConfigs: Array<{
    type: string;
    connectionConfig: any;
    credentials: any;
  }>): Promise<OrchestrationResult> {
    console.log('🚀 Starting discovery orchestration flow...');

    try {
      // Step 1: Authenticate and discover data sources
      console.log('📊 Step 1: Discovering data sources...');
      const discoveredSources = await this.discoverDataSources(sourceConfigs);

      // Step 2: Analyze schema and generate recommendations
      console.log('🔍 Step 2: Analyzing schema and generating recommendations...');
      const schemaAnalysis = await this.analyzeSchema(discoveredSources);

      // Step 3: Analyze business flows and patterns
      console.log('🔄 Step 3: Analyzing business flows and patterns...');
      const businessFlows = await this.analyzeBusinessFlows(discoveredSources, schemaAnalysis);

      // Step 4: Transform and enrich data
      console.log('🔀 Step 4: Transforming and enriching discovered data...');
      const transformationResult = await this.transformData(
        discoveredSources,
        schemaAnalysis,
        businessFlows
      );

      // Step 5: Generate dynamic YAML configuration
      console.log('⚙️ Step 5: Generating dynamic YAML configuration...');
      const yamlConfig = await this.generateYAMLConfiguration(
        discoveredSources, 
        schemaAnalysis, 
        businessFlows,
        transformationResult
      );

      // Step 6: Generate adaptive UI structure
      console.log('🎨 Step 6: Generating adaptive UI structure...');
      const uiStructure = await this.generateUIStructure(
        businessFlows,
        schemaAnalysis,
        yamlConfig.structure,
        transformationResult
      );

      // Step 7: Generate all files
      console.log('📁 Step 7: Generating application files...');
      const generatedFiles = await this.generateAllFiles(
        schemaAnalysis,
        businessFlows,
        yamlConfig,
        uiStructure,
        transformationResult
      );

      // Step 8: Generate deployment instructions
      console.log('🚀 Step 8: Generating deployment instructions...');
      const deploymentInstructions = await this.generateDeploymentInstructions(yamlConfig.structure);

      // Step 9: Generate next steps recommendations
      console.log('📋 Step 9: Generating next steps recommendations...');
      const nextSteps = await this.generateNextSteps(businessFlows, schemaAnalysis);

      // Step 10: Save discovery results to database
      console.log('💾 Step 10: Saving discovery results...');
      const discoveryId = await this.saveDiscoveryResults({
        discoveredSources,
        schemaAnalysis,
        businessFlows,
        transformationResult,
        yamlConfig,
        uiStructure
      });

      console.log('✅ Discovery orchestration completed successfully!');

      return {
        discoveryId,
        discoveredSources,
        schemaAnalysis,
        businessFlows,
        transformationResult,
        yamlConfig,
        uiStructure,
        generatedFiles,
        deploymentInstructions,
        nextSteps
      };

    } catch (error) {
      console.error('❌ Discovery orchestration failed:', error);
      throw new Error(`Discovery orchestration failed: ${error.message}`);
    }
  }

  /**
   * Step 1: Discover and authenticate data sources
   */
  private async discoverDataSources(sourceConfigs: Array<{
    type: string;
    connectionConfig: any;
    credentials: any;
  }>): Promise<DiscoveredDataSource[]> {
    const discoveryService = createDataDiscoveryService(this.config.dataDiscovery);
    const discoveredSources: DiscoveredDataSource[] = [];

    for (const sourceConfig of sourceConfigs) {
      console.log(`  🔐 Authenticating ${sourceConfig.type} source...`);
      
      // Authenticate the data source
      const authResult = await discoveryService.authenticateDataSource(sourceConfig);
      
      if (!authResult.success) {
        throw new Error(`Failed to authenticate ${sourceConfig.type}: ${authResult.error}`);
      }

      console.log(`  📈 Discovering ${sourceConfig.type} data structure...`);
      
      // Discover the data structure
      const discoveredSource = await discoveryService.discoverDataStructure(authResult.sourceId!);
      discoveredSources.push(discoveredSource);

      console.log(`  ✅ Successfully discovered ${discoveredSource.schema.tables.length} tables from ${sourceConfig.type}`);
    }

    return discoveredSources;
  }

  /**
   * Step 2: Analyze schema and generate recommendations
   */
  private async analyzeSchema(discoveredSources: DiscoveredDataSource[]): Promise<SchemaAnalysisResult> {
    const analyzer = createSchemaAnalyzer(this.config.tenantId);
    
    // For now, analyze the first source - in practice, we'd merge multiple sources
    const primarySource = discoveredSources[0];
    
    console.log(`  🔍 Analyzing schema with ${primarySource.schema.tables.length} tables...`);
    const analysis = await analyzer.analyzeDiscoveredSchema(primarySource.schema);
    
    console.log(`  ✅ Generated ${analysis.recommendedSchema.length} Prisma models`);
    console.log(`  ✅ Created ${analysis.migrations.length} migrations`);
    console.log(`  ✅ Identified ${analysis.indexRecommendations.length} index recommendations`);
    
    return analysis;
  }

  /**
   * Step 3: Analyze business flows and patterns
   */
  private async analyzeBusinessFlows(
    discoveredSources: DiscoveredDataSource[],
    schemaAnalysis: SchemaAnalysisResult
  ): Promise<BusinessFlowAnalysis> {
    const primarySource = discoveredSources[0];
    const flowEngine = createBusinessFlowEngine(primarySource.schema, schemaAnalysis.recommendedSchema);
    
    console.log(`  🔄 Analyzing business patterns...`);
    const analysis = await flowEngine.analyzeBusinessFlows();
    
    console.log(`  ✅ Identified ${analysis.identifiedPatterns.length} business patterns`);
    console.log(`  ✅ Generated ${analysis.recommendedFlows.length} business flows`);
    console.log(`  ✅ Created ${analysis.apiEndpoints.length} API endpoints`);
    console.log(`  ✅ Mapped ${analysis.userJourneys.length} user journeys`);
    
    return analysis;
  }

  /**
   * Step 4: Transform and enrich discovered data
   */
  private async transformData(
    discoveredSources: DiscoveredDataSource[],
    schemaAnalysis: SchemaAnalysisResult,
    businessFlows: BusinessFlowAnalysis
  ): Promise<TransformationResult> {
    const transformer = createDataTransformationPipeline({
      enableDataMapping: true,
      enableSchemaEnrichment: true,
      enableBusinessLogicExtraction: true,
      enableRelationshipInference: true,
      enableDataQualityChecks: true
    });

    console.log(`  🔀 Transforming and enriching data...`);
    const result = await transformer.transform(
      discoveredSources,
      schemaAnalysis,
      businessFlows
    );

    console.log(`  ✅ Enriched ${result.transformationMetrics.enrichedFields} fields`);
    console.log(`  ✅ Inferred ${result.transformationMetrics.inferredRelationships} relationships`);
    console.log(`  ✅ Extracted ${result.transformationMetrics.extractedRules} business rules`);
    console.log(`  ✅ Data quality score: ${result.transformationMetrics.qualityScore}%`);

    // Update discovery context with transformation results
    discoveryContext.updatePerformanceMetrics({
      transformationDuration: result.transformationMetrics.processingTime
    });

    return result;
  }

  /**
   * Step 5: Generate dynamic YAML configuration
   */
  private async generateYAMLConfiguration(
    discoveredSources: DiscoveredDataSource[],
    schemaAnalysis: SchemaAnalysisResult,
    businessFlows: BusinessFlowAnalysis,
    transformationResult: TransformationResult
  ): Promise<{ content: string; structure: GeneratedYAMLStructure }> {
    const yamlConfig: DynamicYAMLConfig = {
      tenantId: this.config.tenantId,
      projectName: this.config.projectName,
      discoveredSources,
      schemaAnalysis,
      businessFlows,
      customizations: this.config.customizations
    };

    const generator = createDynamicYAMLGenerator(yamlConfig);
    
    console.log(`  ⚙️ Generating YAML configuration...`);
    const result = await generator.generateYAMLConfig();
    
    console.log(`  ✅ Generated comprehensive YAML configuration`);
    console.log(`  ✅ Created ${result.structure.database.models.length} database models`);
    console.log(`  ✅ Defined ${result.structure.apis.endpoints.length} API endpoints`);
    console.log(`  ✅ Configured ${result.structure.workflows.workflows.length} workflows`);
    
    return result;
  }

  /**
   * Step 6: Generate adaptive UI structure
   */
  private async generateUIStructure(
    businessFlows: BusinessFlowAnalysis,
    schemaAnalysis: SchemaAnalysisResult,
    yamlStructure: GeneratedYAMLStructure,
    transformationResult: TransformationResult
  ): Promise<GeneratedUIStructure> {
    const uiGenerator = createAdaptiveUIGenerator(
      this.config.uiConfig,
      businessFlows,
      schemaAnalysis.recommendedSchema,
      yamlStructure
    );
    
    console.log(`  🎨 Generating adaptive UI structure...`);
    const uiStructure = await uiGenerator.generateUI();
    
    console.log(`  ✅ Generated ${uiStructure.pages.length} pages`);
    console.log(`  ✅ Created ${uiStructure.components.length} components`);
    console.log(`  ✅ Built ${uiStructure.forms.length} forms`);
    console.log(`  ✅ Designed ${uiStructure.tables.length} tables`);
    console.log(`  ✅ Configured ${uiStructure.dashboards.length} dashboards`);
    
    return uiStructure;
  }

  /**
   * Step 7: Generate all application files
   */
  private async generateAllFiles(
    schemaAnalysis: SchemaAnalysisResult,
    businessFlows: BusinessFlowAnalysis,
    yamlConfig: { content: string; structure: GeneratedYAMLStructure },
    uiStructure: GeneratedUIStructure,
    transformationResult: TransformationResult
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate main configuration file
    files.push({
      path: 'opsai-config.yaml',
      content: yamlConfig.content,
      type: 'yaml',
      category: 'config',
      description: 'Main OPSAI configuration file with complete application setup'
    });

    // Generate Prisma schema
    const prismaSchema = this.generatePrismaSchemaContent(schemaAnalysis);
    files.push({
      path: 'prisma/schema.prisma',
      content: prismaSchema,
      type: 'prisma',
      category: 'schema',
      description: 'Prisma database schema with models, relations, and indexes'
    });

    // Generate migrations
    for (const migration of schemaAnalysis.migrations) {
      files.push({
        path: `prisma/migrations/${migration.id}/migration.sql`,
        content: migration.sql,
        type: 'sql',
        category: 'schema',
        description: migration.description
      });
    }

    // Generate API routes
    for (const endpoint of businessFlows.apiEndpoints) {
      const routeContent = this.generateAPIRouteContent(endpoint, yamlConfig.structure);
      files.push({
        path: `app/api${endpoint.path}/route.ts`,
        content: routeContent,
        type: 'typescript',
        category: 'api',
        description: `API route for ${endpoint.description}`
      });
    }

    // Generate UI pages
    for (const page of uiStructure.pages) {
      files.push({
        path: `app${page.path === '/' ? '' : page.path}/page.tsx`,
        content: page.code.tsx,
        type: 'typescript',
        category: 'ui',
        description: `${page.title} page component`
      });

      if (page.code.css) {
        files.push({
          path: `app${page.path === '/' ? '' : page.path}/page.module.css`,
          content: page.code.css,
          type: 'css',
          category: 'ui',
          description: `Styles for ${page.title} page`
        });
      }
    }

    // Generate UI components
    for (const component of uiStructure.components) {
      files.push({
        path: `components/${component.name}.tsx`,
        content: component.code.tsx,
        type: 'typescript',
        category: 'ui',
        description: `${component.name} component`
      });

      if (component.code.css) {
        files.push({
          path: `components/${component.name}.module.css`,
          content: component.code.css,
          type: 'css',
          category: 'ui',
          description: `Styles for ${component.name} component`
        });
      }
    }

    // Generate package.json
    const packageJson = this.generatePackageJsonContent(yamlConfig.structure);
    files.push({
      path: 'package.json',
      content: packageJson,
      type: 'json',
      category: 'config',
      description: 'Package configuration with dependencies and scripts'
    });

    // Generate environment configuration
    const envExample = this.generateEnvExampleContent(yamlConfig.structure);
    files.push({
      path: '.env.example',
      content: envExample,
      type: 'config',
      category: 'config',
      description: 'Environment variables template'
    });

    // Generate README
    const readme = this.generateReadmeContent(yamlConfig.structure, businessFlows);
    files.push({
      path: 'README.md',
      content: readme,
      type: 'markdown',
      category: 'docs',
      description: 'Project documentation and setup instructions'
    });

    // Generate deployment files
    if (yamlConfig.structure.deployment.platform === 'vercel') {
      files.push({
        path: 'vercel.json',
        content: this.generateVercelConfig(yamlConfig.structure),
        type: 'json',
        category: 'deployment',
        description: 'Vercel deployment configuration'
      });
    }

    // Generate Docker files if needed
    if (yamlConfig.structure.deployment.environment === 'production') {
      files.push({
        path: 'Dockerfile',
        content: this.generateDockerfile(yamlConfig.structure),
        type: 'config',
        category: 'deployment',
        description: 'Docker container configuration'
      });

      files.push({
        path: 'docker-compose.yml',
        content: this.generateDockerCompose(yamlConfig.structure),
        type: 'yaml',
        category: 'deployment',
        description: 'Docker Compose configuration for local development'
      });
    }

    console.log(`  ✅ Generated ${files.length} files across ${new Set(files.map(f => f.category)).size} categories`);

    return files;
  }

  /**
   * Step 7: Generate deployment instructions
   */
  private async generateDeploymentInstructions(
    yamlStructure: GeneratedYAMLStructure
  ): Promise<DeploymentInstructions> {
    return {
      prerequisites: [
        {
          name: 'Node.js',
          description: 'Node.js 18 or later',
          required: true,
          installCommand: 'Visit https://nodejs.org',
          verificationCommand: 'node --version'
        },
        {
          name: 'pnpm',
          description: 'Fast, disk space efficient package manager',
          required: true,
          installCommand: 'npm install -g pnpm',
          verificationCommand: 'pnpm --version'
        },
        {
          name: 'Database',
          description: 'PostgreSQL database (local or hosted)',
          required: true,
          installCommand: 'Setup PostgreSQL or use a hosted service like Supabase'
        }
      ],
      environmentVariables: this.generateEnvironmentVariables(yamlStructure),
      deploymentSteps: [
        {
          order: 1,
          title: 'Install Dependencies',
          description: 'Install all project dependencies',
          command: 'pnpm install'
        },
        {
          order: 2,
          title: 'Setup Environment',
          description: 'Copy and configure environment variables',
          command: 'cp .env.example .env.local',
          files: ['.env.local']
        },
        {
          order: 3,
          title: 'Setup Database',
          description: 'Run database migrations',
          command: 'pnpm prisma migrate deploy && pnpm prisma generate'
        },
        {
          order: 4,
          title: 'Build Application',
          description: 'Build the Next.js application',
          command: 'pnpm build'
        },
        {
          order: 5,
          title: 'Start Application',
          description: 'Start the production server',
          command: 'pnpm start'
        }
      ],
      postDeployment: [
        {
          name: 'Setup Authentication',
          description: 'Configure Supabase authentication settings',
          manual: true,
          critical: true
        },
        {
          name: 'Configure Webhooks',
          description: 'Setup webhook endpoints for integrations',
          manual: true,
          critical: false
        },
        {
          name: 'Test Core Functionality',
          description: 'Verify all core features work correctly',
          manual: true,
          critical: true
        }
      ],
      monitoring: [
        {
          type: 'health-check',
          name: 'Application Health',
          endpoint: '/api/health',
          configuration: { interval: '1m', timeout: '10s' }
        },
        {
          type: 'metrics',
          name: 'Performance Metrics',
          configuration: { provider: 'vercel', dashboard: true }
        }
      ]
    };
  }

  /**
   * Step 8: Generate next steps recommendations
   */
  private async generateNextSteps(
    businessFlows: BusinessFlowAnalysis,
    schemaAnalysis: SchemaAnalysisResult
  ): Promise<NextStep[]> {
    const steps: NextStep[] = [
      {
        category: 'immediate',
        title: 'Deploy and Test Application',
        description: 'Deploy the generated application and test all core functionality',
        priority: 'high',
        effort: 'medium'
      },
      {
        category: 'immediate',
        title: 'Configure Authentication',
        description: 'Set up user authentication and authorization rules',
        priority: 'high',
        effort: 'low'
      },
      {
        category: 'immediate',
        title: 'Setup Data Integrations',
        description: 'Configure and test all data source integrations',
        priority: 'high',
        effort: 'medium'
      },
      {
        category: 'short-term',
        title: 'Customize UI Theme',
        description: 'Customize the visual design to match your brand',
        priority: 'medium',
        effort: 'low'
      },
      {
        category: 'short-term',
        title: 'Implement Advanced Workflows',
        description: 'Add complex business workflows and automation',
        priority: 'medium',
        effort: 'high'
      },
      {
        category: 'short-term',
        title: 'Setup Monitoring',
        description: 'Configure comprehensive monitoring and alerting',
        priority: 'medium',
        effort: 'medium'
      },
      {
        category: 'long-term',
        title: 'Add Mobile Application',
        description: 'Develop mobile apps for iOS and Android',
        priority: 'low',
        effort: 'high'
      },
      {
        category: 'long-term',
        title: 'Implement AI Features',
        description: 'Add AI-powered insights and automation',
        priority: 'low',
        effort: 'high'
      }
    ];

    // Add automation opportunities as next steps
    for (const opportunity of businessFlows.automationOpportunities) {
      steps.push({
        category: 'short-term',
        title: `Automate ${opportunity.name}`,
        description: opportunity.description,
        priority: opportunity.complexity === 'low' ? 'high' : 'medium',
        effort: opportunity.complexity as any
      });
    }

    return steps;
  }

  /**
   * Step 10: Save discovery results to database
   */
  private async saveDiscoveryResults(results: {
    discoveredSources: DiscoveredDataSource[];
    schemaAnalysis: SchemaAnalysisResult;
    businessFlows: BusinessFlowAnalysis;
    transformationResult: TransformationResult;
    yamlConfig: { content: string; structure: GeneratedYAMLStructure };
    uiStructure: GeneratedUIStructure;
  }): Promise<string> {
    const discovery = await prisma.discoverySession.create({
      data: {
        tenantId: this.config.tenantId,
        projectName: this.config.projectName,
        discoveredSources: results.discoveredSources as any,
        schemaAnalysis: results.schemaAnalysis as any,
        businessFlows: results.businessFlows as any,
        yamlConfig: results.yamlConfig.content,
        uiStructure: results.uiStructure as any,
        status: 'completed',
        completedAt: new Date()
      }
    });

    return discovery.id;
  }

  // Helper methods for file generation
  private generatePrismaSchemaContent(schemaAnalysis: SchemaAnalysisResult): string {
    // This would use the actual schema analyzer's generatePrismaSchemaFile method
    let content = `// This is your Prisma schema file
// Generated by OPSAI Discovery Engine

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

    // Add models (simplified - would use actual generator)
    for (const model of schemaAnalysis.recommendedSchema) {
      content += `model ${model.name} {\n`;
      for (const field of model.fields.slice(0, 5)) { // Simplified
        content += `  ${field.name} ${field.type}${field.isOptional ? '?' : ''}\n`;
      }
      content += `  @@map("${model.tableName}")\n}\n\n`;
    }

    return content;
  }

  private generateAPIRouteContent(endpoint: any, yamlStructure: GeneratedYAMLStructure): string {
    return `// Generated API route for ${endpoint.description}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function ${endpoint.method}(request: NextRequest) {
  try {
    // Implementation would be generated based on endpoint configuration
    return NextResponse.json({ message: 'Success' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}`;
  }

  private generatePackageJsonContent(yamlStructure: GeneratedYAMLStructure): string {
    const packageJson = {
      name: this.config.projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: `Generated application for ${yamlStructure.vertical.domain}`,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        'db:generate': 'prisma generate',
        'db:migrate': 'prisma migrate dev',
        'db:deploy': 'prisma migrate deploy'
      },
      dependencies: {
        'next': '^14.0.0',
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
        '@prisma/client': '^5.0.0',
        'tailwindcss': '^3.3.0'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        '@types/node': '^20.0.0',
        '@types/react': '^18.0.0',
        'prisma': '^5.0.0'
      }
    };

    return JSON.stringify(packageJson, null, 2);
  }

  private generateEnvExampleContent(yamlStructure: GeneratedYAMLStructure): string {
    return `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Authentication
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Integrations
AIRBYTE_API_KEY="your-airbyte-api-key"
AIRBYTE_WORKSPACE_ID="your-airbyte-workspace-id"`;
  }

  private generateReadmeContent(
    yamlStructure: GeneratedYAMLStructure, 
    businessFlows: BusinessFlowAnalysis
  ): string {
    return `# ${this.config.projectName}

Generated ${yamlStructure.vertical.domain} management system with comprehensive business workflows.

## Features

${businessFlows.identifiedPatterns.map(pattern => `- ${pattern.description}`).join('\n')}

## Quick Start

1. \`pnpm install\`
2. \`cp .env.example .env.local\`
3. \`pnpm db:migrate\`
4. \`pnpm dev\`

## Generated Structure

- **${yamlStructure.database.models.length} Database Models**: Complete data schema with relationships
- **${yamlStructure.apis.endpoints.length} API Endpoints**: RESTful API with authentication
- **${yamlStructure.ui.pages.length} UI Pages**: Responsive web interface
- **${yamlStructure.workflows.workflows.length} Business Workflows**: Automated business processes

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (recommended)

## Documentation

Generated by OPSAI Discovery Engine - visit [docs](./docs) for detailed information.`;
  }

  private generateVercelConfig(yamlStructure: GeneratedYAMLStructure): string {
    return JSON.stringify({
      framework: 'nextjs',
      buildCommand: 'pnpm build',
      devCommand: 'pnpm dev',
      installCommand: 'pnpm install',
      env: {
        DATABASE_URL: '@database-url',
        SUPABASE_URL: '@supabase-url',
        SUPABASE_ANON_KEY: '@supabase-anon-key'
      }
    }, null, 2);
  }

  private generateDockerfile(yamlStructure: GeneratedYAMLStructure): string {
    return `FROM node:18-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY . .
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["pnpm", "start"]`;
  }

  private generateDockerCompose(yamlStructure: GeneratedYAMLStructure): string {
    return `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/app
    depends_on:
      - db
      
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:`;
  }

  private generateEnvironmentVariables(yamlStructure: GeneratedYAMLStructure): EnvVariable[] {
    return [
      {
        name: 'DATABASE_URL',
        description: 'PostgreSQL database connection string',
        required: true,
        example: 'postgresql://user:password@localhost:5432/database',
        sensitive: true
      },
      {
        name: 'SUPABASE_URL',
        description: 'Supabase project URL',
        required: true,
        example: 'https://your-project.supabase.co',
        sensitive: false
      },
      {
        name: 'SUPABASE_ANON_KEY',
        description: 'Supabase anonymous key',
        required: true,
        sensitive: true
      },
      {
        name: 'NEXT_PUBLIC_APP_URL',
        description: 'Application base URL',
        required: true,
        example: 'https://your-app.vercel.app',
        sensitive: false
      }
    ];
  }
}

// Factory function
export function createDiscoveryOrchestrator(config: DiscoveryOrchestrationConfig): DiscoveryOrchestrator {
  return new DiscoveryOrchestrator(config);
}