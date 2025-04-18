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

      // Function to navigate to a directory and then select files
      const selectFiles = async (): Promise<string[]> => {
        // Start from the input directory in settings
        let currentDir = path.resolve(rembgSettings.inputDirectory);
        let inSelectionMode = true;

        // First, navigate to the desired directory
        while (!inSelectionMode) {
          console.log(`\nCurrent directory: ${currentDir}`);

          // Get all files and directories in the current directory
          const dirItems = getFilesAndDirs(currentDir);

          if (dirItems.length === 0) {
            console.log('No files or directories found in this location.');
            // If empty directory, automatically go up one level
            currentDir = path.resolve(currentDir, '..');
            continue;
          }

          // Filter out directories and files
          const directories = dirItems.filter(item => item.isDirectory);
          const files = dirItems.filter(item => !item.isDirectory);

          // If there are files in this directory, offer to enter selection mode
          const hasFiles = files.length > 0;

          const { selected } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selected',
              message: 'Navigate to a directory or select files:',
              choices: [
                ...directories,
                new inquirer.Separator('---'),
                {
                  name: hasFiles ? 'Select files in this directory' : 'No files in this directory',
                  value: 'select',
                  disabled: !hasFiles
                }
              ],
              pageSize: 15
            }
          ]);

          if (selected === 'select') {
            // Enter file selection mode
            if (hasFiles) {
              inSelectionMode = true;
            }
          } else if (selected === '..') {
            // Go up one directory
            currentDir = path.resolve(currentDir, '..');
          } else {
            // Navigate into the selected directory
            currentDir = path.join(currentDir, selected);
          }
        }

        // Now in file selection mode - get all image files in the current directory
        const files = getFilesAndDirs(currentDir)
          .filter(item => !item.isDirectory)
          .map(file => ({
            name: file.name,
            value: path.join(currentDir, file.value)
          }));

        if (files.length === 0) {
          console.log('No files found in this directory.');
          return [];
        }

        // Show checkbox selection for files
        const { selectedFiles: selectedPaths } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedFiles',
            message: 'Select files with SPACE, then press ENTER to process:',
            choices: files,
            pageSize: 15
          }
        ]);

        // Return the selected file paths
        return selectedPaths;
      };

      // Check if rembg is installed

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

      try {
        await execPromise('rembg --help');
      } catch (error) {
        console.error('Error: rembg tool is not installed or not in PATH.');
        console.log('Please install rembg using: pip install rembg');
        return;
      }


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
