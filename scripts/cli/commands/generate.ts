import * as fs from 'fs';
import * as path from 'path';
import { ConfigParser } from '../generators/ConfigParser';
import { SchemaGenerator } from '../generators/SchemaGenerator';
import { APIGenerator } from '../generators/APIGenerator';
import { IntegrationGenerator } from '../generators/IntegrationGenerator';
import { WorkflowGenerator } from '../generators/WorkflowGenerator';
import { DeploymentGenerator } from '../generators/DeploymentGenerator';
import { AppTemplateGenerator } from '../templates/AppTemplateGenerator';

export class GenerateCommand {
  async execute(type: string, name: string, options: any): Promise<void> {
    console.log(`🚀 Generating ${type}: ${name}`);
    
    switch (type) {
      case 'vertical':
        await this.generateVertical(name, options);
        break;
      case 'integration':
        await this.generateIntegration(name, options);
        break;
      case 'workflow':
        await this.generateWorkflow(name, options);
        break;
      case 'config':
        await this.generateSampleConfig(name, options);
        break;
      case 'template':
        await this.generateFromTemplate(name, options);
        break;
      case 'list-templates':
        await this.listTemplates();
        break;
      default:
        console.error(`❌ Unknown generation type: ${type}`);
        console.log(`Available types: vertical, integration, workflow, config, template, list-templates`);
        process.exit(1);
    }
  }

  private async generateVertical(name: string, options: any): Promise<void> {
    try {
      console.log(`🏗️  Generating vertical application: ${name}`);
      
      if (!options.config) {
        console.error('❌ Configuration file is required. Use --config flag');
        console.log('💡 Generate a sample config first: opsai generate config sample-config');
        process.exit(1);
      }

      // Parse configuration
      console.log('📖 Parsing configuration...');
      const configParser = new ConfigParser();
      const config = await configParser.parseConfig(options.config);
      
      // Validate configuration
      const validation = configParser.validateConfig(config);
      if (!validation.valid) {
        console.error('❌ Configuration validation failed:');
        validation.errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
      }

      // Create output directory
      const outputDir = options.output || path.join(process.cwd(), 'apps', `${name}-saas`);
      console.log(`📁 Creating application at: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
      
      // Generate database schema
      console.log('🗄️  Generating database schema...');
      const schemaGenerator = new SchemaGenerator(config);
      await schemaGenerator.generateDatabaseSchema(outputDir);
      
      // Generate API endpoints
      console.log('🌐 Generating API endpoints...');
      const apiGenerator = new APIGenerator(config);
      await apiGenerator.generateAPI(outputDir);
      
      // Generate integrations
      console.log('🔌 Generating integrations...');
      const integrationGenerator = new IntegrationGenerator(config);
      await integrationGenerator.generateIntegrations(outputDir);
      
      // Generate workflows
      console.log('⚡ Generating workflows...');
      const workflowGenerator = new WorkflowGenerator(config);
      await workflowGenerator.generateWorkflows(outputDir);
      
      // Generate deployment configuration
      console.log('🚀 Generating deployment configuration...');
      const deploymentGenerator = new DeploymentGenerator(config);
      await deploymentGenerator.generateDeployment(outputDir);
      
      // Generate package.json and other config files
      console.log('📦 Generating application configuration...');
      await this.generateAppConfig(outputDir, config);
      
      // Generate Docker configuration
      console.log('🐳 Generating Docker configuration...');
      await this.generateDockerConfig(outputDir, config);
      
      // Generate environment files
      console.log('⚙️  Generating environment configuration...');
      await this.generateEnvironmentConfig(outputDir, config);
      
      // Generate README
      console.log('📝 Generating documentation...');
      await this.generateReadme(outputDir, config);
      
      console.log(`\n✅ Generated ${name} vertical successfully!`);
      console.log(`📁 Location: ${outputDir}`);
      console.log(`\n🚀 Next steps:`);
      console.log(`   cd ${path.relative(process.cwd(), outputDir)}`);
      console.log(`   npm install`);
      console.log(`   npm run db:setup`);
      console.log(`   npm run dev`);
      
    } catch (error) {
      console.error('❌ Generation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async generateSampleConfig(name: string, options: any): Promise<void> {
    console.log(`📄 Generating sample configuration: ${name}`);
    
    const configParser = new ConfigParser();
    const sampleConfig = configParser.generateSampleConfig();
    
    const outputPath = options.output || `${name}.yaml`;
    await configParser.saveConfig(sampleConfig, outputPath);
    
    console.log(`✅ Sample configuration generated!`);
    console.log(`📝 Edit the configuration file and then run:`);
    console.log(`   opsai generate vertical ${name} --config ${outputPath}`);
  }

  private async generateIntegration(name: string, options: any): Promise<void> {
    console.log(`🔌 Generating integration: ${name}`);
    // Implementation for standalone integration generation
    console.log('⚠️  Standalone integration generation not yet implemented');
    console.log('💡 Integrations are generated as part of vertical applications');
  }

  private async generateWorkflow(name: string, options: any): Promise<void> {
    console.log(`⚡ Generating workflow: ${name}`);
    // Implementation for standalone workflow generation
    console.log('⚠️  Standalone workflow generation not yet implemented');
    console.log('💡 Workflows are generated as part of vertical applications');
  }

  private async generateFromTemplate(templateName: string, options: any): Promise<void> {
    try {
      console.log(`📋 Generating application from template: ${templateName}`);
      
      const templateGenerator = new AppTemplateGenerator();
      const template = templateGenerator.getTemplate(templateName);
      
      if (!template) {
        console.error(`❌ Template '${templateName}' not found`);
        console.log(`\n📋 Available templates:`);
        templateGenerator.listTemplates().forEach(t => {
          console.log(`   ${t.name} - ${t.displayName}`);
        });
        process.exit(1);
      }

      const appName = options.name || `${templateName}-app`;
      const outputDir = options.output || path.join(process.cwd(), 'templates');
      
      // Generate template config
      await templateGenerator.generateFromTemplate(templateName, appName, outputDir);
      
      console.log(`\n✅ Generated ${template.displayName} template!`);
      console.log(`📋 Template: ${template.displayName}`);
      console.log(`📝 Description: ${template.description}`);
      console.log(`\n🎯 Features:`);
      template.features.forEach(feature => console.log(`   • ${feature}`));
      
      console.log(`\n🚀 Next steps:`);
      console.log(`   # Generate the actual application:`);
      console.log(`   opsai generate vertical ${appName} --config ${outputDir}/${appName}-config.yaml`);
      
    } catch (error) {
      console.error('❌ Template generation failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private async listTemplates(): Promise<void> {
    console.log(`📋 Available Application Templates:\n`);
    
    const templateGenerator = new AppTemplateGenerator();
    const templates = templateGenerator.listTemplates();
    
    const categories = [...new Set(templates.map(t => t.category))];
    
    categories.forEach(category => {
      console.log(`\n🏷️  ${category.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      templates
        .filter(t => t.category === category)
        .forEach(template => {
          console.log(`📦 ${template.name.padEnd(20)} - ${template.displayName}`);
          console.log(`   ${template.description}`);
          console.log(`   Features: ${template.features.slice(0, 3).join(', ')}${template.features.length > 3 ? '...' : ''}`);
          console.log('');
        });
    });
    
    console.log(`💡 Usage:`);
    console.log(`   opsai generate template <template-name> --name <your-app-name>`);
    console.log(`   opsai generate vertical <app-name> --config <generated-config.yaml>`);
  }

  private async generateAppConfig(outputDir: string, config: any): Promise<void> {
    const packageJson = {
      name: config.app.name,
      version: config.app.version,
      description: config.app.description,
      main: "dist/api/server.js",
      scripts: {
        "build": "tsc",
        "dev": "tsx watch src/api/server.ts",
        "start": "node dist/api/server.js",
        "db:generate": "prisma generate",
        "db:migrate": "prisma migrate deploy",
        "db:seed": "tsx prisma/seed.ts",
        "db:setup": "npm run db:generate && npm run db:migrate && npm run db:seed",
        "db:studio": "prisma studio",
        "test": "jest",
        "test:watch": "jest --watch",
        "lint": "eslint src --ext .ts",
        "lint:fix": "eslint src --ext .ts --fix"
      },
      dependencies: {
        "express": "^4.18.0",
        "cors": "^2.8.5",
        "helmet": "^7.1.0",
        "morgan": "^1.10.0",
        "@prisma/client": "^5.7.0",
        "zod": "^3.22.0",
        ...(config.features?.authentication && {
          "jsonwebtoken": "^9.0.0",
          "@types/jsonwebtoken": "^9.0.0"
        }),
        ...(config.integrations && config.integrations.length > 0 && {
          "axios": "^1.6.0"
        }),
        ...(config.workflows && config.workflows.length > 0 && {
          "node-cron": "^3.0.3"
        })
      },
      devDependencies: {
        "@types/node": "^20.0.0",
        "@types/express": "^4.17.0",
        "@types/cors": "^2.8.0",
        "@types/morgan": "^1.9.0",
        "typescript": "^5.3.0",
        "tsx": "^4.6.0",
        "prisma": "^5.7.0",
        ...(config.workflows && config.workflows.length > 0 && {
          "@types/node-cron": "^3.0.0"
        }),
        "jest": "^29.7.0",
        "@types/jest": "^29.5.0",
        "eslint": "^8.0.0",
        "@typescript-eslint/eslint-plugin": "^6.0.0",
        "@typescript-eslint/parser": "^6.0.0"
      },
      author: config.app.author,
      license: config.app.license
    };

    fs.writeFileSync(
      path.join(outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Generate TypeScript config
    const tsConfig = {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        lib: ["ES2020"],
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist", "**/*.test.ts"]
    };

    fs.writeFileSync(
      path.join(outputDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }

  private async generateDockerConfig(outputDir: string, config: any): Promise<void> {
    const dockerfile = `
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Generate Prisma client
RUN npm run db:generate

EXPOSE 3000

CMD ["npm", "start"]
`;

    const dockerCompose = `
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/${config.app.name}
      - JWT_SECRET=your-jwt-secret-change-in-production
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${config.app.name}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
`;

    fs.writeFileSync(path.join(outputDir, 'Dockerfile'), dockerfile.trim());
    fs.writeFileSync(path.join(outputDir, 'docker-compose.yml'), dockerCompose.trim());
  }

  private async generateEnvironmentConfig(outputDir: string, config: any): Promise<void> {
    const envExample = `
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/${config.app.name}"

# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET="your-jwt-secret-change-in-production"

# Redis (for queues and caching)
REDIS_URL="redis://localhost:6379"

# File Upload (if enabled)
${config.features?.fileUpload ? `
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"
` : ''}

# External APIs
${config.integrations?.map((integration: any) => 
  `${integration.name.toUpperCase()}_API_KEY="your-${integration.name}-api-key"`
).join('\n') || ''}
`.trim();

    fs.writeFileSync(path.join(outputDir, '.env.example'), envExample);
    
    // Create .env file (copy of example for development)
    fs.writeFileSync(path.join(outputDir, '.env'), envExample);
    
    // Create .gitignore
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
`;

    fs.writeFileSync(path.join(outputDir, '.gitignore'), gitignore.trim());
  }

  private async generateReadme(outputDir: string, config: any): Promise<void> {
    const readme = `
# ${config.app.displayName}

${config.app.description}

## Features

${Object.entries(config.features || {})
  .filter(([_, enabled]) => enabled)
  .map(([feature, _]) => `- ${feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}`)
  .join('\n')}

## Entities

${config.database.entities.map((entity: any) => 
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

The API will be available at \`http://localhost:3000\`

## API Endpoints

${config.database.entities.map((entity: any) => `
### ${entity.displayName}

- \`GET /api/${entity.name}s\` - List all ${entity.displayName.toLowerCase()}
- \`GET /api/${entity.name}s/:id\` - Get ${entity.displayName.toLowerCase()} by ID
- \`POST /api/${entity.name}s\` - Create new ${entity.displayName.toLowerCase()}
- \`PUT /api/${entity.name}s/:id\` - Update ${entity.displayName.toLowerCase()}
- \`DELETE /api/${entity.name}s/:id\` - Delete ${entity.displayName.toLowerCase()}
`).join('')}

## Development

- \`npm run dev\` - Start development server with hot reload
- \`npm run build\` - Build for production
- \`npm test\` - Run tests
- \`npm run db:studio\` - Open Prisma Studio

## Deployment

### Using Docker

\`\`\`bash
docker-compose up -d
\`\`\`

### Manual Deployment

1. Build the application:
   \`\`\`bash
   npm run build
   \`\`\`

2. Set up production database and run migrations:
   \`\`\`bash
   npm run db:migrate
   \`\`\`

3. Start the server:
   \`\`\`bash
   npm start
   \`\`\`

## Generated with CORE Platform

This application was generated using the CORE Platform CLI. 
Learn more at [github.com/opsai/core-platform](https://github.com/opsai/core-platform)

## License

${config.app.license}
`.trim();

    fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  }
} 