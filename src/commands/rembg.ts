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

      // Check if rembg is installed
      try {
        await execPromise('rembg --help');
      } catch (error) {
        console.error('Error: rembg tool is not installed or not in PATH.');
        console.log('Please install rembg using: pip install rembg');
        return;
      }

      // Ask for the input file
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'inputFile',
          message: 'Enter the path to the image file:',
          validate: (input: string) => {
            if (!input.trim()) {
              return 'Please enter a valid file path';
            }

            if (!fs.existsSync(input)) {
              return 'File does not exist';
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
