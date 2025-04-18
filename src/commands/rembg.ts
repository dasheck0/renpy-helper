import { exec } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import util from 'util';
import { SettingsManager } from '../utils/settings-manager';

const execPromise = util.promisify(exec);

export const rembgCommand = {
  name: 'rembg',
  description: 'Remove background from an image using rembg tool',
  action: async () => {
    try {
      // Initialize settings manager
      const settingsManager = new SettingsManager();
      const rembgSettings = settingsManager.getRembgSettings();


      // Common image file extensions
      const imageExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'
      ];

      // Helper function to check if a file is an image
      const isImageFile = (filePath: string): boolean => {
        const ext = path.extname(filePath).toLowerCase();
        return imageExtensions.includes(ext);
      };

      // Function to get files and directories in a given directory
      const getFilesAndDirs = (dirPath: string) => {
        try {
          // Get all files and directories in the given directory
          const items = fs.readdirSync(dirPath, { withFileTypes: true });

          // Add parent directory option if not in root
          const result = [];
          const resolvedPath = path.resolve(dirPath);
          const parentPath = path.resolve(dirPath, '..');

          // Only add parent directory option if we're not at the root
          if (resolvedPath !== parentPath) {
            result.push({
              name: '../ (Go up one directory)',
              value: '..',
              isDirectory: true
            });
          }

          // Filter and format the results
          const filteredItems = items
            .filter(item => {
              // Skip hidden files (starting with .)
              if (item.name.startsWith('.')) {
                return false;
              }

              // Include directories and image files
              if (item.isDirectory()) {
                return true;
              }

              return isImageFile(item.name);
            })
            .map(item => ({
              name: item.isDirectory() ? `${item.name}/` : item.name,
              value: item.name,
              isDirectory: item.isDirectory()
            }))
            .sort((a, b) => {
              // Sort directories first, then files
              if (a.isDirectory && !b.isDirectory) return -1;
              if (!a.isDirectory && b.isDirectory) return 1;
              return a.name.localeCompare(b.name);
            });

          return [...result, ...filteredItems];
        } catch (error) {
          console.error(`Error reading directory ${dirPath}:`, error);
          return [];
        }
      };

      // Function to navigate directories and select multiple files
      const selectFiles = async (): Promise<string[]> => {
        // Start from the input directory in settings
        let currentDir = path.resolve(rembgSettings.inputDirectory);
        const selectedFiles: string[] = [];
        let done = false;

        while (!done) {
          // Show currently selected files
          if (selectedFiles.length > 0) {
            console.log('\nCurrently selected files:');
            selectedFiles.forEach((file, index) => {
              console.log(`${index + 1}. ${file}`);
            });
          }

          console.log(`\nCurrent directory: ${currentDir}`);

          const choices = getFilesAndDirs(currentDir);

          if (choices.length === 0) {
            console.log('No files or directories found in this location.');
            // If empty directory, automatically go up one level
            currentDir = path.resolve(currentDir, '..');
            continue;
          }

          // Add a 'Done selecting' option if at least one file is selected
          const promptChoices = [...choices];
          if (selectedFiles.length > 0) {
            promptChoices.unshift({
              name: '✓ Done selecting files',
              value: 'done',
              isDirectory: false
            });
          }

          const { selected } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selected',
              message: selectedFiles.length > 0
                ? 'Select more files or directories (or choose Done):'
                : 'Select a file or directory:',
              choices: promptChoices,
              pageSize: 15
            }
          ]);

          // Handle selection
          if (selected === 'done') {
            // Finish selection
            done = true;
          } else if (selected === '..') {
            // Go up one directory
            currentDir = path.resolve(currentDir, '..');
          } else {
            const selectedPath = path.join(currentDir, selected);
            const stats = fs.statSync(selectedPath);

            if (stats.isDirectory()) {
              // Navigate into the directory
              currentDir = selectedPath;
            } else {
              // Add file to selected files
              selectedFiles.push(selectedPath);
              console.log(`Added: ${selectedPath}`);
            }
          }
        }

        return selectedFiles;
      };

      // Check if rembg is installed
      try {
        await execPromise('rembg --help');
      } catch (error) {
        console.error('Error: rembg tool is not installed or not in PATH.');
        console.log('Please install rembg using: pip install rembg');
        return;
      }

      // Select files using the directory navigation
      const inputFiles = await selectFiles();

      if (inputFiles.length === 0) {
        console.log('No files selected. Exiting.');
        return;
      }

      // Ensure output directory exists
      const outputDir = settingsManager.ensureOutputDirectoryExists();

      // Get the flags for the rembg command
      const flags = rembgSettings.flags.join(' ');

      // Process each selected file
      console.log('\nProcessing selected files:');
      for (const inputFile of inputFiles) {
        const parsedPath = path.parse(inputFile);

        // Create output file path
        const outputFile = path.join(
          outputDir,
          `${parsedPath.name}_clean${parsedPath.ext}`
        );

        console.log(`\nProcessing ${inputFile}...`);
        console.log(`Output will be saved as ${outputFile}`);

        try {
          // Execute rembg command with the settings parameters
          const { stderr } = await execPromise(
            `rembg ${flags} "${inputFile}" "${outputFile}"`
          );

          if (stderr) {
            console.error(`Error processing ${inputFile}:`, stderr);
            continue;
          }

          console.log(`Background removed successfully! Output saved to: ${outputFile}`);
        } catch (error) {
          console.error(`Error processing ${inputFile}:`, error);
        }
      }

      console.log('\nAll files processed.');
      console.log(`Total files processed: ${inputFiles.length}`);
      console.log(`Output directory: ${outputDir}`);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }
};
