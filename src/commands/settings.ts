import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { Settings, SettingsManager } from '../utils/settings-manager';

/**
 * Function to navigate directories and select a directory
 */
async function selectDirectory(startDir: string, message: string): Promise<string> {
  let currentDir = path.resolve(startDir);
  let selectedDir: string | null = null;
  
  while (selectedDir === null) {
    console.log(`\nCurrent directory: ${currentDir}`);
    
    try {
      // Get all directories in the current directory
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      
      // Add parent directory option if not in root
      const choices = [];
      const resolvedPath = path.resolve(currentDir);
      const parentPath = path.resolve(currentDir, '..');
      
      // Only add parent directory option if we're not at the root
      if (resolvedPath !== parentPath) {
        choices.push({
          name: '../ (Go up one directory)',
          value: '..'
        });
      }
      
      // Add option to select current directory
      choices.push({
        name: './ (Select current directory)',
        value: '.'
      });
      
      // Add all subdirectories
      const directories = items
        .filter(item => {
          // Skip hidden directories (starting with .)
          if (item.name.startsWith('.')) {
            return false;
          }
          
          return item.isDirectory();
        })
        .map(item => ({
          name: `${item.name}/`,
          value: item.name
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      choices.push(...directories);
      
      if (choices.length === 1 && choices[0].value === '.') {
        // If only the current directory option is available
        console.log('No subdirectories found in this location.');
      }
      
      const { selected } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selected',
          message,
          choices,
          pageSize: 15
        }
      ]);
      
      // Handle selection
      if (selected === '..') {
        // Go up one directory
        currentDir = path.resolve(currentDir, '..');
      } else if (selected === '.') {
        // Select current directory
        selectedDir = currentDir;
      } else {
        // Navigate into the selected directory
        currentDir = path.resolve(currentDir, selected);
      }
    } catch (error) {
      console.error(`Error reading directory ${currentDir}:`, error);
      // Go up one level if there's an error
      currentDir = path.resolve(currentDir, '..');
    }
  }
  
  return selectedDir;
}

export const settingsCommand = {
  name: 'settings',
  description: 'Update default settings for the CLI tool',
  action: async () => {
    try {
      const settingsManager = new SettingsManager();
      const currentSettings = settingsManager.getSettings();
      
      // Go directly to rembg settings
      await updateRembgSettings(settingsManager, currentSettings.rembg);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }
};

/**
 * Update rembg settings
 */
async function updateRembgSettings(
  settingsManager: SettingsManager,
  currentRembgSettings: Settings['rembg']
): Promise<void> {
  // Display current settings
  console.log('\nCurrent rembg settings:');
  console.log(`Flags: ${currentRembgSettings.flags.join(' ')}`);
  console.log(`Input directory: ${currentRembgSettings.inputDirectory}`);
  console.log(`Output directory: ${currentRembgSettings.outputDirectory}`);
  
  // Ask for flags
  const { flags } = await inquirer.prompt([
    {
      type: 'input',
      name: 'flags',
      message: 'Enter rembg flags (space-separated):',
      default: currentRembgSettings.flags.join(' '),
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Please enter at least one flag';
        }
        return true;
      }
    }
  ]);
  
  // Ask for input directory
  console.log('\nSelect input directory:');
  const inputDirectory = await selectDirectory(
    currentRembgSettings.inputDirectory,
    'Select input directory:'
  );
  
  // Ask for output directory
  console.log('\nSelect output directory:');
  const outputDirectory = await selectDirectory(
    currentRembgSettings.outputDirectory,
    'Select output directory:'
  );
  
  // Update settings
  const newRembgSettings: Settings['rembg'] = {
    flags: flags.split(' ').filter((flag: string) => flag.trim() !== ''),
    inputDirectory,
    outputDirectory
  };
  
  settingsManager.updateRembgSettings(newRembgSettings);
  console.log('\nSettings updated successfully!');
  
  // Ensure directories exist
  settingsManager.ensureInputDirectoryExists();
  settingsManager.ensureOutputDirectoryExists();
  console.log(`Input directory "${newRembgSettings.inputDirectory}" is ready.`);
  console.log(`Output directory "${newRembgSettings.outputDirectory}" is ready.`);
}
