import { YamlConfig, AppConfig, GenerationOptions } from '../types'
import { TemplateEngine } from '../engines/template-engine'
import { FileUtils } from '../utils/file-utils'
import { Logger } from '../utils/logger'
import * as path from 'path'
import * as fs from 'fs/promises'

export class AppGenerator {
  private templateEngine: TemplateEngine
  private fileUtils: FileUtils
  private logger: Logger

  constructor() {
    this.templateEngine = new TemplateEngine()
    this.fileUtils = new FileUtils()
    this.logger = new Logger('AppGenerator')
  }

  /**
   * Generate a complete application from YAML configuration
   */
  async generate(
    config: YamlConfig, 
    appName: string, 
    options: GenerationOptions
  ): Promise<{ success: boolean; outputDir: string; appUrl?: string }> {
    try {
      this.logger.info(`Generating application: ${appName}`)
      
      // Create output directory
      const outputDir = path.resolve(options.outputDir)
      await this.fileUtils.ensureDir(outputDir)

      // Generate application structure
      await this.generateAppStructure(config, appName, outputDir)
      
      // Generate database schema
      await this.generateDatabaseSchema(config, outputDir)
      
      // Generate API routes
      await this.generateAPIRoutes(config, outputDir)
      
      // Generate UI components
      await this.generateUIComponents(config, outputDir)
      
      // Generate authentication system
      await this.generateAuthSystem(config, outputDir)
      
      // Generate package.json
      await this.generatePackageJson(config, appName, outputDir)
      
      // Generate configuration files
      await this.generateConfigFiles(config, outputDir)
      
      // Generate README
      await this.generateREADME(config, appName, outputDir)

      this.logger.info(`Application generation completed: ${outputDir}`)
      
      return {
        success: true,
        outputDir,
        appUrl: options.startApp ? `http://localhost:${options.port || 3000}` : undefined
      }
    } catch (error) {
      this.logger.error('Application generation failed', error)
      throw new Error(`Application generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate basic application structure
   */
  private async generateAppStructure(config: YamlConfig, appName: string, outputDir: string): Promise<void> {
    this.logger.info('Generating application structure...')
    
    const dirs = [
      'app',
      'components',
      'lib',
      'prisma',
      'public',
      'styles',
      'types'
    ]

    for (const dir of dirs) {
      await this.fileUtils.ensureDir(path.join(outputDir, dir))
    }

    // Generate app layout
    const layoutContent = this.templateEngine.render('app-layout', {
      appName,
      businessName: config.business.name,
      description: config.vertical.description
    })
    await fs.writeFile(path.join(outputDir, 'app', 'layout.tsx'), layoutContent)

    // Generate main page
    const mainPageContent = this.templateEngine.render('main-page', {
      appName,
      businessName: config.business.name,
      models: config.database.models
    })
    await fs.writeFile(path.join(outputDir, 'app', 'page.tsx'), mainPageContent)
  }

  /**
   * Generate database schema
   */
  private async generateDatabaseSchema(config: YamlConfig, outputDir: string): Promise<void> {
    this.logger.info('Generating database schema...')
    
    const schemaContent = this.templateEngine.render('prisma-schema', {
      models: config.database.models,
      businessType: config.vertical.industry
    })
    
    await fs.writeFile(path.join(outputDir, 'prisma', 'schema.prisma'), schemaContent)
  }

  /**
   * Generate API routes
   */
  private async generateAPIRoutes(config: YamlConfig, outputDir: string): Promise<void> {
    this.logger.info('Generating API routes...')
    
    const apiDir = path.join(outputDir, 'app', 'api')
    await this.fileUtils.ensureDir(apiDir)

    // Generate routes for each model
    for (const model of config.database.models) {
      const modelApiDir = path.join(apiDir, model.name.toLowerCase() + 's')
      await this.fileUtils.ensureDir(modelApiDir)
      
      const routeContent = this.templateEngine.render('api-route', {
        modelName: model.name,
        fields: model.fields
      })
      
      await fs.writeFile(path.join(modelApiDir, 'route.ts'), routeContent)
    }
  }

  /**
   * Generate UI components
   */
  private async generateUIComponents(config: YamlConfig, outputDir: string): Promise<void> {
    this.logger.info('Generating UI components...')
    
    const componentsDir = path.join(outputDir, 'components')
    
    // Generate data table component
    const dataTableContent = this.templateEngine.render('data-table', {
      models: config.database.models
    })
    await fs.writeFile(path.join(componentsDir, 'data-table.tsx'), dataTableContent)
    
    // Generate form components
    for (const model of config.database.models) {
      const formContent = this.templateEngine.render('model-form', {
        modelName: model.name,
        fields: model.fields
      })
      await fs.writeFile(path.join(componentsDir, `${model.name.toLowerCase()}-form.tsx`), formContent)
    }
  }

  /**
   * Generate authentication system
   */
  private async generateAuthSystem(config: YamlConfig, outputDir: string): Promise<void> {
    this.logger.info('Generating authentication system...')
    
    const authDir = path.join(outputDir, 'app', 'auth')
    await this.fileUtils.ensureDir(authDir)
    
    // Generate login page
    const loginContent = this.templateEngine.render('login-page', {
      appName: config.business.name
    })
    await fs.writeFile(path.join(authDir, 'login', 'page.tsx'), loginContent)
    
    // Generate middleware
    const middlewareContent = this.templateEngine.render('auth-middleware', {})
    await fs.writeFile(path.join(outputDir, 'middleware.ts'), middlewareContent)
  }

  /**
   * Generate package.json
   */
  private async generatePackageJson(config: YamlConfig, appName: string, outputDir: string): Promise<void> {
    this.logger.info('Generating package.json...')
    
    const packageJson = {
      name: appName.toLowerCase().replace(/\s+/g, '-'),
      version: "1.0.0",
      private: true,
      scripts: {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint",
        "db:generate": "prisma generate",
        "db:push": "prisma db push"
      },
      dependencies: {
        "next": "^14.0.0",
        "react": "^18.0.0",
        "react-dom": "^18.0.0",
        "@prisma/client": "^5.0.0",
        "lucide-react": "^0.263.0",
        "tailwindcss": "^3.3.0",
        "autoprefixer": "^10.4.14",
        "postcss": "^8.4.24"
      },
      devDependencies: {
        "typescript": "^5.0.0",
        "@types/node": "^20.0.0",
        "@types/react": "^18.0.0",
        "@types/react-dom": "^18.0.0",
        "prisma": "^5.0.0",
        "eslint": "^8.0.0",
        "eslint-config-next": "^14.0.0"
      }
    }
    
    await fs.writeFile(
      path.join(outputDir, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    )
  }

  /**
   * Generate configuration files
   */
  private async generateConfigFiles(config: YamlConfig, outputDir: string): Promise<void> {
    this.logger.info('Generating configuration files...')
    
    // Generate tsconfig.json
    const tsconfigContent = this.templateEngine.render('tsconfig', {})
    await fs.writeFile(path.join(outputDir, 'tsconfig.json'), tsconfigContent)
    
    // Generate tailwind.config.js
    const tailwindContent = this.templateEngine.render('tailwind-config', {})
    await fs.writeFile(path.join(outputDir, 'tailwind.config.js'), tailwindContent)
    
    // Generate .env.example
    const envContent = this.templateEngine.render('env-example', {
      appName: config.business.name
    })
    await fs.writeFile(path.join(outputDir, '.env.example'), envContent)
  }

  /**
   * Generate README
   */
  private async generateREADME(config: YamlConfig, appName: string, outputDir: string): Promise<void> {
    this.logger.info('Generating README...')
    
    const readmeContent = this.templateEngine.render('readme', {
      appName,
      businessName: config.business.name,
      description: config.vertical.description,
      models: config.database.models
    })
    
    await fs.writeFile(path.join(outputDir, 'README.md'), readmeContent)
  }
} 