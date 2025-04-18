import fs from 'fs';
import path from 'path';

// Define the settings interface
export interface Settings {
  rembg: {
    flags: string[];
    inputDirectory: string;
    outputDirectory: string;
  };
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  rembg: {
    flags: ['-a', '-m', 'isnet-general-use'],
    inputDirectory: '.',
    outputDirectory: './output',
  },
};

// Settings file name
const SETTINGS_FILE = '.renpy-helper-settings.json';

/**
 * Settings manager class to handle reading and writing settings
 */
export class SettingsManager {
  private settings: Settings;
  private settingsFilePath: string;

  constructor() {
    this.settingsFilePath = path.join(process.cwd(), SETTINGS_FILE);
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from the settings file or use defaults
   */
  private loadSettings(): Settings {
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const fileContent = fs.readFileSync(this.settingsFilePath, 'utf-8');
        const loadedSettings = JSON.parse(fileContent) as Partial<Settings>;

        // Merge with default settings to ensure all properties exist
        return this.mergeWithDefaults(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }

    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Merge loaded settings with defaults to ensure all properties exist
   */
  private mergeWithDefaults(loadedSettings: Partial<Settings>): Settings {
    const mergedSettings: Settings = { ...DEFAULT_SETTINGS };

    if (loadedSettings.rembg) {
      if (loadedSettings.rembg.flags) {
        mergedSettings.rembg.flags = loadedSettings.rembg.flags;
      }

      if (loadedSettings.rembg.inputDirectory) {
        mergedSettings.rembg.inputDirectory = loadedSettings.rembg.inputDirectory;
      }

      if (loadedSettings.rembg.outputDirectory) {
        mergedSettings.rembg.outputDirectory = loadedSettings.rembg.outputDirectory;
      }
    }

    return mergedSettings;
  }

  /**
   * Save settings to the settings file
   */
  public saveSettings(): void {
    try {
      fs.writeFileSync(
        this.settingsFilePath,
        JSON.stringify(this.settings, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Get all settings
   */
  public getSettings(): Settings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: Partial<Settings>): void {
    this.settings = this.mergeWithDefaults(newSettings);
    this.saveSettings();
  }

  /**
   * Get rembg settings
   */
  public getRembgSettings(): Settings['rembg'] {
    return { ...this.settings.rembg };
  }

  /**
   * Update rembg settings
   */
  public updateRembgSettings(rembgSettings: Partial<Settings['rembg']>): void {
    this.settings.rembg = {
      ...this.settings.rembg,
      ...rembgSettings,
    };
    this.saveSettings();
  }

  /**
   * Ensure output directory exists
   */
  public ensureOutputDirectoryExists(directory: string = this.settings.rembg.outputDirectory): string {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    return directory;
  }

  /**
   * Ensure input directory exists
   */
  public ensureInputDirectoryExists(directory: string = this.settings.rembg.inputDirectory): string {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    return directory;
  }
}
