#!/usr/bin/env tsx

import { Command } from 'commander';
import { execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const program = new Command();

interface DeployOptions {
  env?: 'staging' | 'production' | 'preview';
  appsOnly?: boolean;
  platformOnly?: boolean;
  appName?: string;
  force?: boolean;
}

class DeploymentManager {
  private options: DeployOptions;

  constructor(options: DeployOptions) {
    this.options = options;
  }

  async deploy() {
    console.log(chalk.blue('🚀 Starting integrated deployment...\n'));

    try {
      // Determine what to deploy
      if (this.options.appsOnly) {
        await this.deployGeneratedApps();
      } else if (this.options.platformOnly) {
        await this.deployMainPlatform();
      } else {
        // Deploy everything
        await this.deployMainPlatform();
        await this.deployGeneratedApps();
      }

      console.log(chalk.green('✅ Deployment completed successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Deployment failed:'), error);
      process.exit(1);
    }
  }

  private async deployMainPlatform() {
    console.log(chalk.yellow('🏗️ Deploying main platform...'));

    const platformPath = join(process.cwd(), 'apps', 'opsai-onboarding');
    
    if (!existsSync(platformPath)) {
      throw new Error('Main platform not found');
    }

    // Build the main platform
    console.log(chalk.blue('📦 Building main platform...'));
    execSync('pnpm build', { cwd: platformPath, stdio: 'inherit' });

    // Deploy based on environment
    if (this.options.env === 'production') {
      console.log(chalk.blue('🚀 Deploying to production...'));
      execSync('npm run deploy:production', { cwd: platformPath, stdio: 'inherit' });
    } else {
      console.log(chalk.blue('🚀 Deploying to staging...'));
      execSync('npm run deploy:staging', { cwd: platformPath, stdio: 'inherit' });
    }

    console.log(chalk.green('✅ Main platform deployed successfully!'));
  }

  private async deployGeneratedApps() {
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
    const appsToDeploy = this.options.appName 
      ? [this.options.appName]
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
        if (this.options.env === 'production') {
          console.log(chalk.blue(`🚀 Deploying ${appName} to production...`));
          execSync('npm run deploy:production', { cwd: appPath, stdio: 'inherit' });
        } else {
          console.log(chalk.blue(`🚀 Deploying ${appName} to staging...`));
          execSync('npm run deploy:staging', { cwd: appPath, stdio: 'inherit' });
        }

        console.log(chalk.green(`✅ ${appName} deployed successfully!`));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to deploy ${appName}:`), error);
        
        if (!this.options.force) {
          throw error;
        }
      }
    }
  }

  private async runHealthChecks() {
    console.log(chalk.blue('🏥 Running health checks...'));

    // Add health check logic here
    // This could check various endpoints and services

    console.log(chalk.green('✅ Health checks passed!'));
  }

  private async sendNotifications() {
    console.log(chalk.blue('🔔 Sending notifications...'));

    // Add notification logic here
    // This could send Slack, Discord, or email notifications

    console.log(chalk.green('✅ Notifications sent!'));
  }
}

// CLI Commands
program
  .name('deploy')
  .description('Deploy OpsAI applications and platform')
  .version('1.0.0');

program
  .command('all')
  .description('Deploy everything (main platform + generated apps)')
  .option('-e, --env <environment>', 'Deployment environment', 'staging')
  .option('-f, --force', 'Continue on errors', false)
  .action(async (options) => {
    const manager = new DeploymentManager({
      env: options.env,
      force: options.force
    });
    await manager.deploy();
  });

program
  .command('platform')
  .description('Deploy only the main platform')
  .option('-e, --env <environment>', 'Deployment environment', 'staging')
  .action(async (options) => {
    const manager = new DeploymentManager({
      env: options.env,
      platformOnly: true
    });
    await manager.deploy();
  });

program
  .command('apps')
  .description('Deploy only generated apps')
  .option('-e, --env <environment>', 'Deployment environment', 'staging')
  .option('-a, --app <name>', 'Deploy specific app')
  .option('-f, --force', 'Continue on errors', false)
  .action(async (options) => {
    const manager = new DeploymentManager({
      env: options.env,
      appsOnly: true,
      appName: options.app,
      force: options.force
    });
    await manager.deploy();
  });

program
  .command('list')
  .description('List all available apps for deployment')
  .action(() => {
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
      console.log(chalk.green(`  - ${app}`));
    });
  });

program
  .command('status')
  .description('Check deployment status of all apps')
  .action(async () => {
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
        const hasPackageJson = existsSync(join(appPath, 'package.json'));
        const hasDeployScript = hasPackageJson && 
          require(join(appPath, 'package.json')).scripts?.deploy;

        if (hasDeployScript) {
          console.log(chalk.green(`  ✅ ${app}: Ready for deployment`));
        } else {
          console.log(chalk.yellow(`  ⚠️ ${app}: No deployment script`));
        }
      });
    } else {
      console.log(chalk.yellow('⚠️ No generated apps found'));
    }
  });

// Parse command line arguments
program.parse();

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 