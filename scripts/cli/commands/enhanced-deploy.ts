import { execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

interface DeployOptions {
  env?: 'staging' | 'production' | 'preview';
  app?: string;
  force?: boolean;
  appsOnly?: boolean;
  platformOnly?: boolean;
}

export class EnhancedDeployCommand {
  async execute(command: string, options: DeployOptions): Promise<void> {
    console.log(chalk.blue('🚀 Enhanced Deployment System\n'));

    try {
      switch (command) {
        case 'all':
          await this.deployAll(options);
          break;
        case 'platform':
          await this.deployMainPlatform(options);
          break;
        case 'apps':
          await this.deployGeneratedApps(options);
          break;
        case 'list':
          this.listApps();
          break;
        case 'status':
          await this.checkStatus();
          break;
        default:
          // If no command specified, determine based on options
          if (options.appsOnly) {
            await this.deployGeneratedApps(options);
          } else if (options.platformOnly) {
            await this.deployMainPlatform(options);
          } else {
            await this.deployAll(options);
          }
      }

      console.log(chalk.green('✅ Enhanced deployment completed successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Enhanced deployment failed:'), error);
      process.exit(1);
    }
  }

  private async deployAll(options: DeployOptions): Promise<void> {
    console.log(chalk.yellow('🏗️ Deploying everything (platform + apps)...'));
    
    await this.deployMainPlatform(options);
    await this.deployGeneratedApps(options);
  }

  private async deployMainPlatform(options: DeployOptions): Promise<void> {
    console.log(chalk.yellow('🏗️ Deploying main platform...'));

    const platformPath = join(process.cwd(), 'apps', 'opsai-onboarding');
    
    if (!existsSync(platformPath)) {
      throw new Error('Main platform not found at apps/opsai-onboarding');
    }

    // Build the main platform
    console.log(chalk.blue('📦 Building main platform...'));
    execSync('pnpm build', { cwd: platformPath, stdio: 'inherit' });

    // Deploy based on environment
    if (options.env === 'production') {
      console.log(chalk.blue('🚀 Deploying main platform to production...'));
      this.deployToProduction(platformPath);
    } else {
      console.log(chalk.blue('🚀 Deploying main platform to staging...'));
      this.deployToStaging(platformPath);
    }

    console.log(chalk.green('✅ Main platform deployed successfully!'));
  }

  private async deployGeneratedApps(options: DeployOptions): Promise<void> {
    console.log(chalk.yellow('🚀 Deploying generated apps...'));

    const generatedAppsPath = join(process.cwd(), 'apps', 'opsai-onboarding', 'generated-apps');
    
    if (!existsSync(generatedAppsPath)) {
      console.log(chalk.yellow('⚠️ No generated apps found'));
      return;
    }

    const apps = readdirSync(generatedAppsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (apps.length === 0) {
      console.log(chalk.yellow('⚠️ No generated apps found'));
      return;
    }

    console.log(chalk.blue(`📦 Found ${apps.length} generated apps`));

    // Deploy specific app or all apps
    const appsToDeploy = options.app 
      ? [options.app]
      : apps;

    for (const appName of appsToDeploy) {
      const appPath = join(generatedAppsPath, appName);
      
      if (!existsSync(appPath)) {
        console.log(chalk.red(`❌ App ${appName} not found`));
        continue;
      }

      try {
        console.log(chalk.blue(`🚀 Deploying ${appName}...`));
        
        // Check if app has deployment scripts
        const packageJsonPath = join(appPath, 'package.json');
        if (!existsSync(packageJsonPath)) {
          console.log(chalk.yellow(`⚠️ No package.json found for ${appName}`));
          continue;
        }

        // Install dependencies
        console.log(chalk.blue(`📦 Installing dependencies for ${appName}...`));
        execSync('npm ci', { cwd: appPath, stdio: 'inherit' });

        // Build app
        console.log(chalk.blue(`🏗️ Building ${appName}...`));
        execSync('npm run build', { cwd: appPath, stdio: 'inherit' });

        // Deploy app
        if (options.env === 'production') {
          console.log(chalk.blue(`🚀 Deploying ${appName} to production...`));
          this.deployAppToProduction(appPath);
        } else {
          console.log(chalk.blue(`🚀 Deploying ${appName} to staging...`));
          this.deployAppToStaging(appPath);
        }

        console.log(chalk.green(`✅ ${appName} deployed successfully!`));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to deploy ${appName}:`), error);
        
        if (!options.force) {
          throw error;
        }
      }
    }
  }

  private deployToStaging(platformPath: string): void {
    try {
      // Deploy to Vercel staging
      if (this.hasVercelConfig(platformPath)) {
        console.log(chalk.blue('🚀 Deploying to Vercel (staging)...'));
        execSync('npx vercel --yes', { cwd: platformPath, stdio: 'inherit' });
      }

      // Deploy to Railway staging
      if (this.hasRailwayConfig(platformPath)) {
        console.log(chalk.blue('🚂 Deploying to Railway (staging)...'));
        execSync('npx railway up', { cwd: platformPath, stdio: 'inherit' });
      }

      // Deploy to Docker Compose for local staging
      if (this.hasDockerCompose(platformPath)) {
        console.log(chalk.blue('🐳 Deploying with Docker Compose (staging)...'));
        execSync('docker-compose up -d', { cwd: platformPath, stdio: 'inherit' });
      }
    } catch (error) {
      console.error(chalk.red('❌ Staging deployment failed:'), error);
      throw error;
    }
  }

  private deployToProduction(platformPath: string): void {
    try {
      // Deploy to Vercel production
      if (this.hasVercelConfig(platformPath)) {
        console.log(chalk.blue('🚀 Deploying to Vercel (production)...'));
        execSync('npx vercel --prod --yes', { cwd: platformPath, stdio: 'inherit' });
      }

      // Deploy to Railway production
      if (this.hasRailwayConfig(platformPath)) {
        console.log(chalk.blue('🚂 Deploying to Railway (production)...'));
        execSync('npx railway up --environment=production', { cwd: platformPath, stdio: 'inherit' });
      }

      // Deploy to Kubernetes
      if (this.hasKubernetesConfig(platformPath)) {
        console.log(chalk.blue('☸️ Deploying to Kubernetes (production)...'));
        execSync('kubectl apply -f k8s/', { cwd: platformPath, stdio: 'inherit' });
      }
    } catch (error) {
      console.error(chalk.red('❌ Production deployment failed:'), error);
      throw error;
    }
  }

  private deployAppToStaging(appPath: string): void {
    try {
      // Check for deployment scripts
      const packageJson = require(join(appPath, 'package.json'));
      
      if (packageJson.scripts?.['deploy:staging']) {
        execSync('npm run deploy:staging', { cwd: appPath, stdio: 'inherit' });
      } else if (packageJson.scripts?.deploy) {
        execSync('npm run deploy', { cwd: appPath, stdio: 'inherit' });
      } else {
        // Default deployment methods
        if (this.hasVercelConfig(appPath)) {
          execSync('npx vercel --yes', { cwd: appPath, stdio: 'inherit' });
        } else if (this.hasDockerCompose(appPath)) {
          execSync('docker-compose up -d', { cwd: appPath, stdio: 'inherit' });
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ App staging deployment failed:'), error);
      throw error;
    }
  }

  private deployAppToProduction(appPath: string): void {
    try {
      // Check for deployment scripts
      const packageJson = require(join(appPath, 'package.json'));
      
      if (packageJson.scripts?.['deploy:production']) {
        execSync('npm run deploy:production', { cwd: appPath, stdio: 'inherit' });
      } else if (packageJson.scripts?.deploy) {
        execSync('npm run deploy', { cwd: appPath, stdio: 'inherit' });
      } else {
        // Default deployment methods
        if (this.hasVercelConfig(appPath)) {
          execSync('npx vercel --prod --yes', { cwd: appPath, stdio: 'inherit' });
        } else if (this.hasKubernetesConfig(appPath)) {
          execSync('kubectl apply -f k8s/', { cwd: appPath, stdio: 'inherit' });
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ App production deployment failed:'), error);
      throw error;
    }
  }

  private listApps(): void {
    const generatedAppsPath = join(process.cwd(), 'apps', 'opsai-onboarding', 'generated-apps');
    
    if (!existsSync(generatedAppsPath)) {
      console.log(chalk.yellow('No generated apps found'));
      return;
    }

    const apps = readdirSync(generatedAppsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log(chalk.blue('📦 Available apps for deployment:'));
    apps.forEach(app => {
      const appPath = join(generatedAppsPath, app);
      const hasDeployScript = this.hasDeploymentScript(appPath);
      const status = hasDeployScript ? chalk.green('✅ Ready') : chalk.yellow('⚠️ No deploy script');
      console.log(`  - ${app} ${status}`);
    });
  }

  private async checkStatus(): Promise<void> {
    console.log(chalk.blue('📊 Checking deployment status...'));

    // Check main platform
    const platformPath = join(process.cwd(), 'apps', 'opsai-onboarding');
    if (existsSync(platformPath)) {
      console.log(chalk.green('✅ Main platform: Ready for deployment'));
    } else {
      console.log(chalk.red('❌ Main platform: Not found'));
    }

    // Check generated apps
    const generatedAppsPath = join(process.cwd(), 'apps', 'opsai-onboarding', 'generated-apps');
    if (existsSync(generatedAppsPath)) {
      const apps = readdirSync(generatedAppsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      console.log(chalk.blue(`📦 Generated apps (${apps.length}):`));
      apps.forEach(app => {
        const appPath = join(generatedAppsPath, app);
        const hasDeployScript = this.hasDeploymentScript(appPath);
        const status = hasDeployScript ? chalk.green('✅ Ready') : chalk.yellow('⚠️ No deploy script');
        console.log(`  - ${app}: ${status}`);
      });
    } else {
      console.log(chalk.yellow('⚠️ No generated apps found'));
    }

    // Check services
    console.log(chalk.blue('🔧 Services:'));
    try {
      execSync('docker-compose ps', { stdio: 'pipe' });
      console.log(chalk.green('✅ Docker services: Running'));
    } catch {
      console.log(chalk.yellow('⚠️ Docker services: Not running'));
    }
  }

  private hasVercelConfig(path: string): boolean {
    return existsSync(join(path, 'vercel.json')) || existsSync(join(path, '.vercel'));
  }

  private hasRailwayConfig(path: string): boolean {
    return existsSync(join(path, 'railway.json')) || existsSync(join(path, '.railway'));
  }

  private hasDockerCompose(path: string): boolean {
    return existsSync(join(path, 'docker-compose.yml')) || existsSync(join(path, 'docker-compose.yaml'));
  }

  private hasKubernetesConfig(path: string): boolean {
    return existsSync(join(path, 'k8s')) || existsSync(join(path, 'kubernetes'));
  }

  private hasDeploymentScript(path: string): boolean {
    const packageJsonPath = join(path, 'package.json');
    if (!existsSync(packageJsonPath)) return false;
    
    try {
      const packageJson = require(packageJsonPath);
      return !!(packageJson.scripts?.deploy || 
                packageJson.scripts?.['deploy:staging'] || 
                packageJson.scripts?.['deploy:production']);
    } catch {
      return false;
    }
  }
} 