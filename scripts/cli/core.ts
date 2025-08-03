#!/usr/bin/env tsx

import { Command } from 'commander';
import chalk from 'chalk';
import { GenerateCommand } from './commands/generate';
import { DeployCommand } from './commands/deploy';
import { EnhancedDeployCommand } from './commands/enhanced-deploy';
import { TestCommand } from './commands/test';
import { BackupCommand } from './commands/backup';

const program = new Command();

program
  .name('opsai')
  .description('CORE Platform CLI - Business Application Generator')
  .version('1.0.0');

// Generate command
program
  .command('generate')
  .description('Generate vertical applications')
  .argument('<type>', 'Type of generation (vertical, integration, workflow, template, config, list-templates)')
  .argument('[name]', 'Name of the item to generate')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-o, --output <path>', 'Output directory')
  .option('-n, --name <name>', 'Application name (for templates)')
  .option('--test-integrations', 'Test integrations during generation')
  .action(async (type, name, options) => {
    const generateCommand = new GenerateCommand();
    await generateCommand.execute(type, name, options);
  });

// Deploy command (legacy)
program
  .command('deploy')
  .description('Deploy applications (legacy)')
  .argument('<target>', 'Target to deploy (vertical, all)')
  .option('-e, --environment <env>', 'Environment (development, staging, production)')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (target, options) => {
    const deployCommand = new DeployCommand();
    await deployCommand.execute(target, options);
  });

// Enhanced Deploy command
program
  .command('deploy-enhanced')
  .description('Enhanced deployment with multi-platform support')
  .argument('[command]', 'Deployment command (all, platform, apps, list, status)')
  .option('-e, --env <environment>', 'Deployment environment (staging, production, preview)', 'staging')
  .option('-a, --app <name>', 'Specific app to deploy')
  .option('-f, --force', 'Continue on errors', false)
  .option('--apps-only', 'Deploy only generated apps')
  .option('--platform-only', 'Deploy only main platform')
  .action(async (command, options) => {
    const enhancedDeployCommand = new EnhancedDeployCommand();
    await enhancedDeployCommand.execute(command, options);
  });

// Test command
program  
  .command('test')
  .description('Run tests')
  .argument('[type]', 'Type of tests (unit, integration, e2e)')
  .option('-p, --package <name>', 'Package to test')
  .option('-v, --vertical <name>', 'Vertical to test')
  .action(async (type, options) => {
    const testCommand = new TestCommand();
    await testCommand.execute(type, options);
  });



// Database commands
program
  .command('db')
  .description('Database operations')
  .argument('<operation>', 'Operation (migrate, seed, backup, restore)')
  .option('-v, --vertical <name>', 'Vertical name')
  .option('-d, --data <path>', 'Data file path')
  .option('-b, --backup <path>', 'Backup file path')
  .action(async (operation, options) => {
    const backupCommand = new BackupCommand();
    await backupCommand.execute(operation, options);
  });

// Development commands
program
  .command('dev')
  .description('Development utilities')
  .argument('<command>', 'Command (setup, reset, seed)')
  .action(async (command) => {
    switch (command) {
      case 'setup':
        console.log('Setting up development environment...');
        // Implementation for dev setup
        break;
      case 'reset':
        console.log('Resetting development environment...');
        // Implementation for dev reset
        break;
      case 'seed':
        console.log('Seeding development data...');
        // Implementation for dev seed
        break;
      default:
        console.error(`Unknown dev command: ${command}`);
        process.exit(1);
    }
  });

// Monitoring commands
program
  .command('logs')
  .description('View application logs')
  .option('-v, --vertical <name>', 'Vertical name')
  .option('-t, --tail', 'Follow logs')
  .option('-f, --follow', 'Follow logs (alias for --tail)')
  .action(async (options) => {
    console.log('Viewing logs...');
    // Implementation for logs
  });

// Help command for deployment
program
  .command('deploy-help')
  .description('Show deployment help and examples')
  .action(() => {
    console.log(chalk.blue('🚀 Deployment Commands Help\n'));
    
    console.log(chalk.yellow('📋 Available Commands:\n'));
    
    console.log(chalk.green('Legacy Commands (Original):'));
    console.log('  pnpm deploy vertical <name> --environment=production');
    console.log('  pnpm deploy all --environment=staging\n');
    
    console.log(chalk.green('Enhanced Commands (New):'));
    console.log('  pnpm deploy:enhanced:staging          # Deploy everything to staging');
    console.log('  pnpm deploy:enhanced:production       # Deploy everything to production');
    console.log('  pnpm deploy:enhanced:apps             # Deploy only generated apps');
    console.log('  pnpm deploy:enhanced:platform         # Deploy only main platform');
    console.log('  pnpm deploy:enhanced:list             # List all available apps');
    console.log('  pnpm deploy:enhanced:status           # Check deployment status\n');
    
    console.log(chalk.green('Direct CLI Commands:'));
    console.log('  pnpm cli deploy-enhanced all --env=staging');
    console.log('  pnpm cli deploy-enhanced apps --env=production');
    console.log('  pnpm cli deploy-enhanced platform --env=staging');
    console.log('  pnpm cli deploy-enhanced list');
    console.log('  pnpm cli deploy-enhanced status\n');
    
    console.log(chalk.yellow('🎯 Examples:\n'));
    
    console.log(chalk.cyan('Deploy specific app to staging:'));
    console.log('  pnpm cli deploy-enhanced apps --app=b2c-marketplace-1753994588864 --env=staging\n');
    
    console.log(chalk.cyan('Deploy main platform to production:'));
    console.log('  pnpm cli deploy-enhanced platform --env=production\n');
    
    console.log(chalk.cyan('Deploy everything with force flag:'));
    console.log('  pnpm cli deploy-enhanced all --env=production --force\n');
    
    console.log(chalk.yellow('🔧 Supported Platforms:'));
    console.log('  ✅ Vercel (Frontend hosting)');
    console.log('  ✅ Railway (Full-stack hosting)');
    console.log('  ✅ Docker Compose (Local development)');
    console.log('  ✅ Kubernetes (Enterprise deployment)\n');
    
    console.log(chalk.yellow('🌍 Environments:'));
    console.log('  ✅ staging');
    console.log('  ✅ production');
    console.log('  ✅ preview\n');
  });

program
  .command('status')
  .description('Check application status')
  .option('-a, --all-verticals', 'Check all verticals')
  .option('-v, --vertical <name>', 'Vertical name')
  .action(async (options) => {
    console.log('Checking status...');
    // Implementation for status
  });

program
  .command('metrics')
  .description('View application metrics')
  .option('-v, --vertical <name>', 'Vertical name')
  .option('-t, --timerange <range>', 'Time range (e.g., 24h, 7d)')
  .action(async (options) => {
    console.log('Viewing metrics...');
    // Implementation for metrics
  });

program.parse(); 