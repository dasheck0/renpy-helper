import { exec } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';
import AutocompletePrompt from 'inquirer-autocomplete-prompt';
import path from 'path';
import util from 'util';
import { SettingsManager } from '../utils/settings-manager';

// Register the autocomplete prompt
inquirer.registerPrompt('autocomplete', AutocompletePrompt);

const execPromise = util.promisify(exec);

export const rembgCommand = {
  name: 'rembg',
  description: 'Remove background from an image using rembg tool',
  action: async () => {
    try {
      // Initialize settings manager
      const settingsManager = new SettingsManager();
      const rembgSettings = settingsManager.getRembgSettings();

      // Check if rembg is installed
      try {
        await execPromise('rembg --help');
      } catch (error) {
        console.error('Error: rembg tool is not installed or not in PATH.');
        console.log('Please install rembg using: pip install rembg');
        return;
      }

      // Common image file extensions
      const imageExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'
      ];

      // Helper function to check if a file is an image
      const isImageFile = (filePath: string): boolean => {
        const ext = path.extname(filePath).toLowerCase();
        return imageExtensions.includes(ext);
      };

      // Helper function to search for files
      const searchFiles = async (input = '') => {
        input = input || '.';

        // Get the directory and base name from the input
        let searchDir = path.dirname(input === '' ? '.' : input);
        const searchBase = path.basename(input);

        // If the input ends with a separator, we're searching in that directory
        if (input.endsWith(path.sep)) {
          searchDir = input;
        }

        // Make sure the search directory exists
        if (!fs.existsSync(searchDir)) {
          return [];
        }

        try {
          // Get all files and directories in the search directory
          const files = fs.readdirSync(searchDir, { withFileTypes: true });

          // Filter and format the results
          return files
            .filter(file => {
              // Include if name matches search and is either a directory or an image file
              if (!file.name.toLowerCase().includes(searchBase.toLowerCase())) {
                return false;
              }

              if (file.isDirectory()) {
                return true;
              }

              return isImageFile(file.name);
            })
            .map(file => {
              const filePath = path.join(searchDir, file.name);
              // Add a trailing slash for directories
              return file.isDirectory() ? `${filePath}${path.sep}` : filePath;
            })
            .sort((a, b) => {
              // Sort directories first, then files
              const aIsDir = a.endsWith(path.sep);
              const bIsDir = b.endsWith(path.sep);
              if (aIsDir && !bIsDir) return -1;
              if (!aIsDir && bIsDir) return 1;
              return a.localeCompare(b);
            });
        } catch (error) {
          console.error('Error reading directory:', error);
          return [];
        }
      };

      // Ask for the input file with autocomplete
      // @ts-ignore - Type definitions for autocomplete prompt are not perfect
      const answers = await inquirer.prompt([
        {
          type: 'autocomplete',
          name: 'inputFile',
          message: 'Enter the path to the image file:',
          source: async (_: any, input: string) => {
            return searchFiles(input);
          },
          validate: (input: string) => {
            if (!input.trim()) {
              return 'Please enter a valid file path';
            }

            if (!fs.existsSync(input)) {
              return 'File does not exist';
            }

            // Check if it's a file (not a directory)
            if (fs.statSync(input).isDirectory()) {
              return 'Please select a file, not a directory';
            }

            // Check if it's an image file
            if (!isImageFile(input)) {
              return 'Please select an image file';
            }

            return true;
          }
        }
      ]);

      const inputFile = answers.inputFile;
      const parsedPath = path.parse(inputFile);

      // Ensure output directory exists
      const outputDir = settingsManager.ensureOutputDirectoryExists();

      // Create output file path
      const outputFile = path.join(
        outputDir,
        `${parsedPath.name}_clean${parsedPath.ext}`
      );

      console.log(`Processing ${inputFile}...`);
      console.log(`Output will be saved as ${outputFile}`);

      // Execute rembg command with the settings parameters
      const flags = rembgSettings.flags.join(' ');
      const { stderr } = await execPromise(
        `rembg ${flags} "${inputFile}" "${outputFile}"`
      );

      if (stderr) {
        console.error('Error:', stderr);
        return;
      }

      console.log(`Background removed successfully! Output saved to: ${outputFile}`);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }
};
