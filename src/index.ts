#!/usr/bin/env node

import { Command } from 'commander';
import { rembgCommand } from './commands/rembg';
import { settingsCommand } from './commands/settings';

const program = new Command();

program
  .name('renpy-helper')
  .description('CLI tool that offers helpful utilities for developing visual novels using Ren\'Py')
  .version('1.0.9'); // This should match the version in package.json

// Register commands
program
  .command(rembgCommand.name)
  .description(rembgCommand.description)
  .action(rembgCommand.action);

program
  .command(settingsCommand.name)
  .description(settingsCommand.description)
  .action(settingsCommand.action);

program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length === 2) {
  program.help();
}
