import inquirer from 'inquirer';
import { Settings, SettingsManager } from '../utils/settings-manager';

export const settingsCommand = {
  name: 'settings',
  description: 'Update default settings for the CLI tool',
  action: async () => {
    try {
      const settingsManager = new SettingsManager();
      const currentSettings = settingsManager.getSettings();

      // Ask which settings to update
      const { settingType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'settingType',
          message: 'Which settings would you like to update?',
          choices: [
            { name: 'rembg command settings', value: 'rembg' },
            { name: 'Back to main menu', value: 'back' }
          ]
        }
      ]);

      if (settingType === 'back') {
        return;
      }

      if (settingType === 'rembg') {
        await updateRembgSettings(settingsManager, currentSettings.rembg);
      }
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
  console.log(`Output directory: ${currentRembgSettings.outputDirectory}`);

  // Ask for new settings
  const answers = await inquirer.prompt([
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
    },
    {
      type: 'input',
      name: 'outputDirectory',
      message: 'Enter output directory:',
      default: currentRembgSettings.outputDirectory,
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Please enter a valid directory path';
        }
        return true;
      }
    }
  ]);

  // Update settings
  const newRembgSettings: Settings['rembg'] = {
    flags: answers.flags.split(' ').filter((flag: string) => flag.trim() !== ''),
    outputDirectory: answers.outputDirectory
  };

  settingsManager.updateRembgSettings(newRembgSettings);
  console.log('\nSettings updated successfully!');

  // Ensure output directory exists
  settingsManager.ensureOutputDirectoryExists();
  console.log(`Output directory "${newRembgSettings.outputDirectory}" is ready.`);
}
