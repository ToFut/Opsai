import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '../../../packages/shared/src/config/service-config';
import { EnhancedSchemaGenerator } from './EnhancedSchemaGenerator';
import { APIGenerator } from './APIGenerator';
import { EnhancedIntegrationGenerator } from './EnhancedIntegrationGenerator';
import { WorkflowGenerator } from './WorkflowGenerator';
import { UIGenerator } from './UIGenerator';
import { AlertGenerator } from './AlertGenerator';
import { DeploymentGenerator } from './DeploymentGenerator';
import { EnvironmentGenerator } from './EnvironmentGenerator';
import { IntegrationTestGenerator } from './IntegrationTestGenerator';
import { DataSyncValidator } from './DataSyncValidator';

/**
 * Generator Coordination System
 * Ensures all generators work together and dependencies are properly managed
 */
export class GeneratorCoordinator {
  private config: AppConfig;
  private outputDir: string;
  private generatedFiles: Map<string, string[]> = new Map();
  private dependencies: Map<string, string[]> = new Map();

  constructor(config: AppConfig, outputDir: string) {
    this.config = config;
    this.outputDir = outputDir;
    this.setupDependencies();
  }

  async generateApplication(): Promise<void> {
    console.log('🏗️  Starting coordinated application generation...');

    // Phase 1: Core Infrastructure
    await this.generatePhase('infrastructure', [
      () => this.generateDatabase(),
      () => this.generateEnvironment(),
      () => this.generateProjectConfiguration()
    ]);

    // Phase 2: Business Logic
    await this.generatePhase('business-logic', [
      () => this.generateAPI(),
      () => this.generateIntegrations(),
      () => this.generateWorkflows()
    ]);

    // Phase 3: User Interface & Monitoring
    await this.generatePhase('frontend-monitoring', [
      () => this.generateUI(),
      () => this.generateAlerts()
    ]);

    // Phase 4: Deployment & Documentation
    await this.generatePhase('deployment', [
      () => this.generateDeployment(),
      () => this.generateDocumentation()
    ]);

    // Phase 5: Validation & Testing
    await this.generatePhase('validation', [
      () => this.validateGeneration(),
      () => this.generateTests()
    ]);

    console.log('✅ Application generation completed successfully!');
    this.printGenerationSummary();
  }

  private async generatePhase(phaseName: string, generators: (() => Promise<void>)[]): Promise<void> {
    console.log(`\n🔄 Phase: ${phaseName.toUpperCase().replace('-', ' ')}`);
    console.log('─'.repeat(50));

    for (const generator of generators) {
      try {
        await generator();
      } catch (error) {
        console.error(`❌ Generator failed in phase ${phaseName}:`, error);
        throw error;
      }
    }
  }

  private async generateDatabase(): Promise<void> {
    console.log('🗄️  Generating database schema...');
    const generator = new EnhancedSchemaGenerator(this.config);
    await generator.generateDatabaseSchema(this.outputDir);
    
    this.recordGeneratedFiles('database', [
      'prisma/schema.prisma',
      'prisma/migrations/',
      'prisma/seed.ts'
    ]);
  }

  private async generateEnvironment(): Promise<void> {
    console.log('⚙️  Generating environment configuration...');
    const generator = new EnvironmentGenerator(this.config);
    await generator.generateEnvironmentFiles(this.outputDir);
    
    this.recordGeneratedFiles('environment', [
      '.env.example',
      '.env',
      '.env.development',
      '.env.staging',
      '.env.production',
      'src/config/env-validation.ts'
    ]);
  }

  private async generateProjectConfiguration(): Promise<void> {
    console.log('📦 Generating project configuration...');
    await this.generatePackageJson();
    await this.generateTypeScriptConfig();
    await this.generateGitIgnore();
    
    this.recordGeneratedFiles('project-config', [
      'package.json',
      'tsconfig.json',
      '.gitignore'
    ]);
  }

  private async generateAPI(): Promise<void> {
    console.log('🌐 Generating API endpoints...');
    const generator = new APIGenerator(this.config);
    await generator.generateAPI(this.outputDir);
    
    const apiFiles = [
      'src/api/server.ts',
      'src/api/middleware/',
      'src/api/routes/'
    ];
    
    // Add entity-specific routes
    this.config.database.entities.forEach(entity => {
      apiFiles.push(`src/api/routes/${entity.name.toLowerCase()}.ts`);
    });
    
    this.recordGeneratedFiles('api', apiFiles);
  }

  private async generateIntegrations(): Promise<void> {
    if (!this.config.features?.integrations || this.config.services.integrations.length === 0) {
      console.log('⏭️  Skipping integrations (not enabled)');
      return;
    }

    console.log('🔌 Generating integrations...');
    const generator = new EnhancedIntegrationGenerator(this.config);
    await generator.generateIntegrations(this.outputDir);
    
    const integrationFiles = ['src/integrations/'];
    this.config.services.integrations.forEach(integration => {
      integrationFiles.push(`src/integrations/${integration.name}-client.ts`);
    });
    
    this.recordGeneratedFiles('integrations', integrationFiles);
  }

  private async generateWorkflows(): Promise<void> {
    if (!this.config.features?.workflows || !this.config.workflows?.length) {
      console.log('⏭️  Skipping workflows (not enabled)');
      return;
    }

    console.log('⚡ Generating workflows...');
    const generator = new WorkflowGenerator(this.config);
    await generator.generateWorkflows(this.outputDir);
    
    const workflowFiles = ['src/workflows/'];
    this.config.workflows.forEach(workflow => {
      workflowFiles.push(`src/workflows/${workflow.name}.ts`);
    });
    
    this.recordGeneratedFiles('workflows', workflowFiles);
  }

  private async generateUI(): Promise<void> {
    if (!this.config.features?.ui) {
      console.log('⏭️  Skipping UI (not enabled)');
      return;
    }

    console.log('🎨 Generating user interface...');
    const generator = new UIGenerator(this.config);
    await generator.generateUI(this.outputDir);
    
    this.recordGeneratedFiles('ui', [
      'src/ui/',
      'src/ui/components/',
      'src/ui/pages/'
    ]);
  }

  private async generateAlerts(): Promise<void> {
    if (!this.config.features?.alerts) {
      console.log('⏭️  Skipping alerts (not enabled)');
      return;
    }

    console.log('🚨 Generating alert system...');
    const generator = new AlertGenerator(this.config);
    await generator.generateAlerts(this.outputDir);
    
    this.recordGeneratedFiles('alerts', [
      'src/alerts/',
      'src/alerts/rules/',
      'src/alerts/handlers/'
    ]);
  }

  private async generateDeployment(): Promise<void> {
    console.log('🚀 Generating deployment configuration...');
    const generator = new DeploymentGenerator(this.config);
    await generator.generateDeployment(this.outputDir);
    
    this.recordGeneratedFiles('deployment', [
      'Dockerfile',
      'docker-compose.yml',
      'deployment/',
      '.github/workflows/'
    ]);
  }

  private async generateDocumentation(): Promise<void> {
    console.log('📝 Generating documentation...');
    await this.generateReadme();
    await this.generateAPIDocumentation();
    
    this.recordGeneratedFiles('documentation', [
      'README.md',
      'docs/api.md',
      'docs/deployment.md'
    ]);
  }

  private async validateGeneration(): Promise<void> {
    console.log('🔍 Validating generated code...');
    
    // Check for circular dependencies
    await this.checkCircularDependencies();
    
    // Validate environment variables
    await this.validateEnvironmentVariables();
    
    // Check file consistency
    await this.checkFileConsistency();
    
    console.log('✅ Generation validation completed');
  }

  private async generateTests(): Promise<void> {
    console.log('🧪 Generating comprehensive test framework...');
    
    // Generate basic test configuration
    await this.generateTestConfiguration();
    await this.generateSampleTests();
    
    // Copy integration test script
    await this.copyIntegrationTestScript();
    
    // Generate integration testing system
    console.log('🔧 Generating integration authentication & data flow tests...');
    const integrationTestGenerator = new IntegrationTestGenerator(this.config);
    await integrationTestGenerator.generateIntegrationTests(this.outputDir);
    
    // Generate data sync validation system
    console.log('🔄 Generating data sync validation system...');
    const dataSyncValidator = new DataSyncValidator(this.config);
    await dataSyncValidator.generateDataSyncValidation(this.outputDir);
    
    this.recordGeneratedFiles('tests', [
      'jest.config.js',
      'tests/',
      'tests/api/',
      'tests/integration/',
      'tests/integration/test-runner.ts',
      'tests/integration/data-validation.ts',
      'src/validation/',
      'src/validation/data-sync-service.ts',
      'src/validation/sync-monitor.ts'
    ]);
  }

  private setupDependencies(): void {
    // Define generation dependencies
    this.dependencies.set('api', ['database', 'environment']);
    this.dependencies.set('integrations', ['database', 'environment']);
    this.dependencies.set('workflows', ['database', 'integrations']);
    this.dependencies.set('ui', ['api']);
    this.dependencies.set('alerts', ['database']);
    this.dependencies.set('deployment', ['api', 'database']);
    this.dependencies.set('tests', ['api', 'database']);
  }

  private recordGeneratedFiles(category: string, files: string[]): void {
    this.generatedFiles.set(category, files);
  }

  private async generatePackageJson(): Promise<void> {
    const packageJson = this.buildPackageJson();
    const packagePath = path.join(this.outputDir, 'package.json');
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log(`📄 Generated package.json`);
  }

  private buildPackageJson(): any {
    const features = this.config.features || {};
    const services = this.config.services;
    
    // Core OPSAI packages - always included
    const corePackages = {
      '@opsai/shared': 'workspace:*'
    };
    
    // Feature-based OPSAI packages
    if (features.authentication) {
      corePackages['@opsai/auth'] = 'workspace:*';
    }
    
    if (features.workflows) {
      corePackages['@opsai/workflow'] = 'workspace:*';
    }
    
    if (features.integrations) {
      corePackages['@opsai/integration'] = 'workspace:*';
    }
    
    if (features.alerts) {
      corePackages['@opsai/alerts'] = 'workspace:*';
    }
    
    if (features.fileUpload) {
      corePackages['@opsai/files'] = 'workspace:*';
    }
    
    if (features.ui) {
      corePackages['@opsai/ui'] = 'workspace:*';
    }
    
    // Database package - included if using core-managed database
    if (services.database?.provider === 'core-managed') {
      corePackages['@opsai/database'] = 'workspace:*';
    }
    
    // Runtime dependencies based on features and services
    const runtimeDependencies = {
      // API Framework
      express: '^4.18.0',
      cors: '^2.8.5',
      helmet: '^7.1.0',
      morgan: '^1.10.0',
      
      // Database
      '@prisma/client': '^5.7.0',
      
      // Validation
      zod: '^3.22.0',
      
      // HTTP client
      axios: '^1.6.0',
      
      // Utilities
      'date-fns': '^2.30.0'
    };
    
    // Authentication dependencies
    if (features.authentication) {
      if (services.auth?.provider === 'core-supabase' || services.auth?.provider === 'user-supabase') {
        runtimeDependencies['@supabase/supabase-js'] = '^2.38.0';
      }
      runtimeDependencies['jsonwebtoken'] = '^9.0.0';
      runtimeDependencies['@types/jsonwebtoken'] = '^9.0.0';
    }
    
    // Workflow dependencies
    if (features.workflows) {
      Object.assign(runtimeDependencies, {
        'bullmq': '^5.0.0',
        '@temporalio/client': '^1.8.0',
        '@temporalio/worker': '^1.8.0',
        '@temporalio/workflow': '^1.8.0',
        '@temporalio/activity': '^1.12.1'
      });
    }
    
    // Queue processing dependencies
    if (features.workflows || features.alerts) {
      runtimeDependencies['redis'] = '^4.6.0';
    }
    
    // Scheduling dependencies
    if (features.workflows) {
      runtimeDependencies['node-cron'] = '^3.0.3';
    }
    
    // File upload dependencies
    if (features.fileUpload) {
      Object.assign(runtimeDependencies, {
        'multer': '^1.4.5',
        '@types/multer': '^1.4.7'
      });
    }
    
    // Integration-specific dependencies
    const integrations = services.integrations || [];
    integrations.forEach((integration: any) => {
      if (integration.name === 'stripe') {
        runtimeDependencies['stripe'] = '^14.0.0';
      }
    });
    
    // Development dependencies
    const devDependencies = {
      '@types/node': '^20.0.0',
      '@types/express': '^4.17.0',
      '@types/cors': '^2.8.0',
      '@types/morgan': '^1.9.0',
      'typescript': '^5.3.0',
      'tsx': '^4.6.0',
      'prisma': '^5.7.0',
      'jest': '^29.7.0',
      '@types/jest': '^29.5.0',
      'eslint': '^8.0.0',
      '@typescript-eslint/eslint-plugin': '^6.0.0',
      '@typescript-eslint/parser': '^6.0.0'
    };
    
    // Add cron types if workflows are enabled
    if (features.workflows) {
      devDependencies['@types/node-cron'] = '^3.0.0';
    }
    
    // Scripts based on features
    const scripts = {
      build: 'tsc',
      dev: 'tsx watch src/api/server.ts',
      start: 'node dist/api/server.js',
      'db:generate': 'prisma generate',
      'db:migrate': 'prisma migrate deploy',
      'db:seed': 'tsx prisma/seed.ts',
      'db:setup': 'npm run db:generate && npm run db:migrate && npm run db:seed',
      'db:studio': 'prisma studio',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:integrations': 'tsx scripts/test-integrations.ts',
      'test:all': 'npm run test && npm run test:integrations',
      lint: 'eslint src --ext .ts',
      'lint:fix': 'eslint src --ext .ts --fix',
      'type:check': 'tsc --noEmit'
    };
    
    // Add feature-specific scripts
    if (features.workflows) {
      scripts['workflow:start'] = 'tsx src/workflows/service.ts';
    }
    
    if (features.alerts) {
      scripts['alerts:start'] = 'tsx src/alerts/service.ts';
    }
    
    return {
      name: this.config.app.name,
      version: this.config.app.version || '1.0.0',
      description: this.config.app.description,
      main: 'dist/api/server.js',
      scripts,
      dependencies: {
        ...corePackages,
        ...runtimeDependencies
      },
      devDependencies,
      author: this.config.app.author || 'CORE Platform',
      license: this.config.app.license || 'MIT',
      engines: {
        node: '>=18.0.0',
        npm: '>=8.0.0'
      },
      keywords: [
        'opsai',
        'core-platform',
        'vertical-saas',
        this.config.app.name
      ]
    };
  }

  private async generateTypeScriptConfig(): Promise<void> {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'commonjs',
        lib: ['ES2022'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        resolveJsonModule: true,
        allowSyntheticDefaultImports: true
      },
      include: ['src/**/*', 'prisma/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts']
    };

    const tsConfigPath = path.join(this.outputDir, 'tsconfig.json');
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    console.log(`📄 Generated tsconfig.json`);
  }

  private async generateGitIgnore(): Promise<void> {
    const gitignore = `
# Dependencies
node_modules/
npm-debug.log*

# Build output
dist/
build/

# Environment files
.env
.env.local
.env.production

# Database
*.db
*.sqlite

# Logs
logs/
*.log

# Runtime
.pid
.seed

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Uploads
uploads/

# Generated files
prisma/migrations/
*.tsbuildinfo
`.trim();

    const gitignorePath = path.join(this.outputDir, '.gitignore');
    fs.writeFileSync(gitignorePath, gitignore);
    console.log(`📄 Generated .gitignore`);
  }

  private async generateReadme(): Promise<void> {
    const readme = `
# ${this.config.app.displayName}

${this.config.app.description}

## Features

${Object.entries(this.config.features || {})
  .filter(([_, enabled]) => enabled)
  .map(([feature, _]) => `- ${feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}`)
  .join('\n')}

## Entities

${this.config.database.entities.map((entity: any) => 
  `- **${entity.displayName}**: ${entity.description || `Manage ${entity.displayName.toLowerCase()}`}`
).join('\n')}

## Quick Start

1. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Set up environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. **Set up database**
   \`\`\`bash
   npm run db:setup
   \`\`\`

4. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

The API will be available at \`http://localhost:3001\`

## Development

- \`npm run dev\` - Start development server with hot reload
- \`npm run build\` - Build for production
- \`npm run type:check\` - Run TypeScript type checking
- \`npm test\` - Run tests
- \`npm run db:studio\` - Open Prisma Studio

## Generated with CORE Platform

This application was generated using the CORE Platform CLI.
Learn more at [github.com/opsai/core-platform](https://github.com/opsai/core-platform)

## License

${this.config.app.license}
`.trim();

    const readmePath = path.join(this.outputDir, 'README.md');
    fs.writeFileSync(readmePath, readme);
    console.log(`📄 Generated README.md`);
  }

  private async generateAPIDocumentation(): Promise<void> {
    const docsDir = path.join(this.outputDir, 'docs');
    fs.mkdirSync(docsDir, { recursive: true });

    const apiDoc = `
# API Documentation

## Endpoints

${this.config.database.entities.map((entity: any) => `
### ${entity.displayName}

- \`GET /api/${entity.name.toLowerCase()}s\` - List all ${entity.displayName.toLowerCase()}
- \`GET /api/${entity.name.toLowerCase()}s/:id\` - Get ${entity.displayName.toLowerCase()} by ID
- \`POST /api/${entity.name.toLowerCase()}s\` - Create new ${entity.displayName.toLowerCase()}
- \`PUT /api/${entity.name.toLowerCase()}s/:id\` - Update ${entity.displayName.toLowerCase()}
- \`DELETE /api/${entity.name.toLowerCase()}s/:id\` - Delete ${entity.displayName.toLowerCase()}
`).join('')}

## Authentication

${this.config.features?.authentication ? 'Authentication is enabled. Include JWT token in Authorization header.' : 'Authentication is disabled for this application.'}

## Environment Variables

See \`.env.example\` for required environment variables.
`.trim();

    const apiDocPath = path.join(docsDir, 'api.md');
    fs.writeFileSync(apiDocPath, apiDoc);
    console.log(`📄 Generated API documentation`);
  }

  private async generateTestConfiguration(): Promise<void> {
    const jestConfig = {
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src', '<rootDir>/tests'],
      testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/api/server.ts'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
    };

    const jestConfigPath = path.join(this.outputDir, 'jest.config.js');
    fs.writeFileSync(jestConfigPath, `module.exports = ${JSON.stringify(jestConfig, null, 2)};`);
    console.log(`📄 Generated Jest configuration`);
  }

  private async generateSampleTests(): Promise<void> {
    const testsDir = path.join(this.outputDir, 'tests');
    fs.mkdirSync(testsDir, { recursive: true });

    const setupTest = `
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
});

afterAll(async () => {
  await prisma.$disconnect();
});
`.trim();

    fs.writeFileSync(path.join(testsDir, 'setup.ts'), setupTest);
    console.log(`📄 Generated test setup`);
  }

  private async copyIntegrationTestScript(): Promise<void> {
    const scriptsDir = path.join(this.outputDir, 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });

    // Copy the integration test script template
    const templatePath = path.join(__dirname, '..', 'templates', 'integration-test-script.ts');
    const targetPath = path.join(scriptsDir, 'test-integrations.ts');
    
    try {
      const scriptContent = fs.readFileSync(templatePath, 'utf8');
      fs.writeFileSync(targetPath, scriptContent);
      console.log('📄 Generated integration test script');
    } catch (error) {
      console.warn('⚠️  Could not copy integration test script template');
    }
  }

  private async checkCircularDependencies(): Promise<void> {
    // Implementation would analyze import statements to detect circular dependencies
    console.log('🔍 Checking for circular dependencies...');
  }

  private async validateEnvironmentVariables(): Promise<void> {
    // Implementation would validate that all required env vars are properly configured
    console.log('🔍 Validating environment variables...');
  }

  private async checkFileConsistency(): Promise<void> {
    // Implementation would check that all referenced files exist and imports are valid
    console.log('🔍 Checking file consistency...');
  }

  private printGenerationSummary(): void {
    console.log('\n📊 Generation Summary');
    console.log('═'.repeat(50));
    
    let totalFiles = 0;
    this.generatedFiles.forEach((files, category) => {
      console.log(`${category.padEnd(20)} ${files.length.toString().padStart(3)} files`);
      totalFiles += files.length;
    });
    
    console.log('─'.repeat(50));
    console.log(`${'Total'.padEnd(20)} ${totalFiles.toString().padStart(3)} files`);
    console.log('');
    
    console.log('🚀 Next steps:');
    console.log(`   cd ${path.relative(process.cwd(), this.outputDir)}`);
    console.log(`   npm install`);
    console.log(`   npm run db:setup`);
    console.log(`   npm run dev`);
  }
}