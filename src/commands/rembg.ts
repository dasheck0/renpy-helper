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
        let selectedFiles: string[] = [];
        let done = false;

        // Keep track of selected files in each directory
        const selectedFilesMap = new Map<string, Set<string>>();

        while (!done) {
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

          // Get the set of selected files in the current directory
          const selectedInCurrentDir = selectedFilesMap.get(currentDir) || new Set<string>();

          // If there are files in this directory, show the checkbox selection
          if (files.length > 0) {
            // Create checkbox choices for files
            const fileChoices = files.map(file => ({
              name: `${selectedInCurrentDir.has(file.value) ? '(o)' : '( )'} ${file.name}`,
              value: file.value,
              short: file.name
            }));

            // Add a confirm selection option
            const confirmOption = {
              name: `--- ${selectedFiles.length > 0 ? 'Confirm selection' : 'No files selected (select with SPACE)'} ---`,
              value: 'confirm'
            };

            // Add a parent directory option
            const parentOption = {
              name: '../ (Go up one directory)',
              value: '..'
            };

            // Prompt for file selection
            const { selectedItems } = await inquirer.prompt([
              {
                type: 'checkbox',
                name: 'selectedItems',
                message: 'Select files with SPACE, navigate with arrow keys, confirm with ENTER:',
                choices: [
                  new inquirer.Separator('--- Navigation ---'),
                  parentOption,
                  confirmOption,
                  new inquirer.Separator('--- Files ---'),
                  ...fileChoices
                ],
                pageSize: 15,
                default: Array.from(selectedInCurrentDir)
              }
            ]);

            // Check if the user wants to navigate up
            if (selectedItems.includes('..')) {
              // Go up one directory
              currentDir = path.resolve(currentDir, '..');
              continue;
            }

            // Check if the user wants to confirm the selection
            if (selectedItems.includes('confirm')) {
              // Remove the confirm option from the selection
              const actualFiles = selectedItems.filter((item: string) => item !== 'confirm' && item !== '..');

              // Update the selected files in the current directory
              selectedFilesMap.set(currentDir, new Set(actualFiles));

              // If there are selected files, we're done
              if (selectedFiles.length > 0) {
                done = true;
              } else {
                console.log('\nNo files selected. Please select at least one file or navigate to another directory.');
              }
              continue;
            }

            // Update the selected files in the current directory
            selectedFilesMap.set(currentDir, new Set(selectedItems.filter((item: string) => item !== '..')));

            // Update the overall selected files list
            selectedFiles = [];
            for (const [dir, files] of selectedFilesMap.entries()) {
              for (const file of files) {
                selectedFiles.push(path.join(dir, file));
              }
            }

            // Show the current selection
            if (selectedFiles.length > 0) {
              console.log('\nCurrently selected files:');
              selectedFiles.forEach((file, index) => {
                console.log(`${index + 1}. ${file}`);
              });
            }

            continue;
          }

          // If there are only directories, show a list selection
          const { selected } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selected',
              message: selectedFiles.length > 0
                ? `Navigate to a directory (${selectedFiles.length} files selected):`
                : 'Navigate to a directory:',
              choices: [
                ...directories,
                new inquirer.Separator('---'),
                {
                  name: selectedFiles.length > 0 ? 'Confirm selection' : 'No files selected',
                  value: 'confirm'
                }
              ],
              pageSize: 15
            }
          ]);

          // Handle directory navigation or confirmation
          if (selected === 'confirm') {
            if (selectedFiles.length > 0) {
              done = true;
            } else {
              console.log('\nNo files selected. Please navigate to a directory with files.');
            }
          } else if (selected === '..') {
            // Go up one directory
            currentDir = path.resolve(currentDir, '..');
          } else {
            // Navigate into the selected directory
            currentDir = path.join(currentDir, selected);
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
