#!/usr/bin/env tsx

import { Command } from 'commander';
import { GenerateCommand } from './commands/generate';
import { DeployCommand } from './commands/deploy';
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
  .action(async (type, name, options) => {
    const generateCommand = new GenerateCommand();
    await generateCommand.execute(type, name, options);
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy applications')
  .argument('<target>', 'Target to deploy (vertical, all)')
  .option('-e, --environment <env>', 'Environment (development, staging, production)')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (target, options) => {
    const deployCommand = new DeployCommand();
    await deployCommand.execute(target, options);
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