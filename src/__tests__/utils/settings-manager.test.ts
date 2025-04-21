import fs from 'fs';
import path from 'path';
import { DEFAULT_SETTINGS, Settings, SettingsManager } from '../../utils/settings-manager';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

// Mock console.error to avoid cluttering test output
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('SettingsManager', () => {
  const settingsFileName = '.renpy-helper-settings.json';
  const mockCwd = '/mock/cwd';
  const settingsFilePath = path.join(mockCwd, settingsFileName);

  // Mock process.cwd() to return a consistent path
  const originalCwd = process.cwd;

  beforeEach(() => {
    jest.clearAllMocks();
    process.cwd = jest.fn().mockReturnValue(mockCwd);

    // Mock path.join to return predictable paths
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    // Reset mocked fs state
    (fs.existsSync as jest.Mock).mockReset();
    (fs.readFileSync as jest.Mock).mockReset();
    (fs.writeFileSync as jest.Mock).mockReset();
    (fs.mkdirSync as jest.Mock).mockReset();

    // Set default values for DEFAULT_SETTINGS
    DEFAULT_SETTINGS.rembg.inputDirectory = './new-input';
    DEFAULT_SETTINGS.rembg.outputDirectory = './new-output';
  });

  afterEach(() => {
    // Restore original process.cwd
    process.cwd = originalCwd;
  });

  describe('initialization', () => {
    test('should initialize with default settings when no file exists', () => {
      // Mock file doesn't exist
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const settingsManager = new SettingsManager();
      const settings = settingsManager.getSettings();

      // Should have default settings
      expect(settings).toEqual(DEFAULT_SETTINGS);
      // Should have checked if settings file exists
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('.renpy-helper-settings.json'));
    });

    test('should load settings from file when it exists', () => {
      const customSettings: Settings = {
        rembg: {
          flags: ['-a', '-b', 'custom-model'],
          inputDirectory: './custom-input',
          outputDirectory: './custom-output'
        }
      };

      // Mock file exists and has content
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(customSettings));

      const settingsManager = new SettingsManager();
      const settings = settingsManager.getSettings();

      // Should have loaded custom settings
      expect(settings).toEqual(customSettings);
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('.renpy-helper-settings.json'), 'utf-8');
    });

    test('should merge loaded settings with defaults', () => {
      // Partial settings with only some properties
      const partialSettings = {
        rembg: {
          flags: ['-custom']
        }
      };

      // Expected merged result
      const expectedSettings: Settings = {
        rembg: {
          flags: ['-custom'],
          inputDirectory: DEFAULT_SETTINGS.rembg.inputDirectory,
          outputDirectory: DEFAULT_SETTINGS.rembg.outputDirectory
        }
      };

      // Mock file exists and has partial content
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(partialSettings));

      const settingsManager = new SettingsManager();
      const settings = settingsManager.getSettings();

      // Should have merged settings
      expect(settings).toEqual(expectedSettings);
    });

    test('should handle malformed settings file', () => {
      // Mock file exists but has invalid content
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('not valid json');

      const settingsManager = new SettingsManager();
      const settings = settingsManager.getSettings();

      // Should fall back to default settings
      expect(settings).toEqual(DEFAULT_SETTINGS);
      // Should have logged an error
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('saving settings', () => {
    test('should save settings to file', () => {
      // Mock fs.writeFileSync
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const settingsManager = new SettingsManager();
      settingsManager.saveSettings();

      // Should have called writeFileSync with the correct arguments
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.renpy-helper-settings.json'),
        expect.any(String),
        'utf-8'
      );
    });

    test('should handle errors when saving settings', () => {
      // Mock fs.writeFileSync to throw an error
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const settingsManager = new SettingsManager();
      settingsManager.saveSettings();

      // Should have logged an error
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updating settings', () => {
    test('should update settings correctly', () => {
      // Mock fs.writeFileSync
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const settingsManager = new SettingsManager();
      const newSettings: Partial<Settings> = {
        rembg: {
          flags: ['-new', '-flags'],
          inputDirectory: './new-input',
          outputDirectory: './new-output'
        }
      };

      settingsManager.updateSettings(newSettings);
      const updatedSettings = settingsManager.getSettings();

      // Settings should be updated
      expect(updatedSettings).toEqual(newSettings);
      // Settings should be saved to file
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.renpy-helper-settings.json'),
        expect.any(String),
        'utf-8'
      );
    });

    test('should update rembg settings', () => {
      // Mock fs.writeFileSync
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const settingsManager = new SettingsManager();
      const rembgSettings: Partial<Settings['rembg']> = {
        flags: ['-new', '-flags'],
        outputDirectory: './new-output'
      };

      // Expected merged settings
      const expectedSettings = {
        rembg: {
          flags: rembgSettings.flags,
          inputDirectory: DEFAULT_SETTINGS.rembg.inputDirectory,
          outputDirectory: rembgSettings.outputDirectory
        }
      };

      settingsManager.updateRembgSettings(rembgSettings);
      const updatedSettings = settingsManager.getRembgSettings();

      // Only specified settings should be updated
      expect(updatedSettings.flags).toEqual(rembgSettings.flags);
      expect(updatedSettings.outputDirectory).toEqual(rembgSettings.outputDirectory);
      // Unspecified settings should remain default
      expect(updatedSettings.inputDirectory).toEqual(DEFAULT_SETTINGS.rembg.inputDirectory);
      // Should have saved the settings
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.renpy-helper-settings.json'),
        expect.any(String),
        'utf-8'
      );
    });
  });

  describe('directory management', () => {
    test('should ensure output directory exists', () => {
      // Mock directory doesn't exist, then exists after creation
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

      const settingsManager = new SettingsManager();
      const outputDir = settingsManager.ensureOutputDirectoryExists();

      // Should have checked if directory exists
      expect(fs.existsSync).toHaveBeenCalled();
      // Should have created the directory
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      // Should return the default output directory
      expect(outputDir).toEqual(DEFAULT_SETTINGS.rembg.outputDirectory);
    });

    test('should ensure input directory exists', () => {
      // Mock directory doesn't exist, then exists after creation
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

      const settingsManager = new SettingsManager();
      const inputDir = settingsManager.ensureInputDirectoryExists();

      // Should have checked if directory exists
      expect(fs.existsSync).toHaveBeenCalled();
      // Should have created the directory
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      // Should return the default input directory
      expect(inputDir).toEqual(DEFAULT_SETTINGS.rembg.inputDirectory);
    });

    test('should ensure custom directory exists', () => {
      const customDir = './custom/nested/directory';

      // Mock directory doesn't exist, then exists after creation
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

      const settingsManager = new SettingsManager();
      const outputDir = settingsManager.ensureOutputDirectoryExists(customDir);

      // Should have checked if directory exists
      expect(fs.existsSync).toHaveBeenCalled();
      // Should have created the directory
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      // Should return the custom directory
      expect(outputDir).toEqual(customDir);
    });
  });
});
