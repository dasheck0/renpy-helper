#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to execute shell commands
function exec(command) {
  try {
    return execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    process.exit(1);
  }
}

// Helper function to read package.json
function readPackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson;
}

// Helper function to write package.json
function writePackageJson(packageJson) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

// Helper function to update version
function updateVersion(currentVersion, releaseType) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (releaseType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// Main release function
async function release() {
  // Check if git flow is installed
  try {
    execSync('git flow version', { stdio: 'ignore' });
  } catch (error) {
    console.error('Error: git flow is not installed. Please install git flow first.');
    console.error('See https://github.com/nvie/gitflow/wiki/Installation for installation instructions.');
    process.exit(1);
  }

  // Check if git is clean
  try {
    execSync('git diff-index --quiet HEAD --');
  } catch (error) {
    console.error('Error: Working directory is not clean. Please commit or stash your changes first.');
    process.exit(1);
  }

  // Check if we're on develop branch
  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    if (currentBranch !== 'develop') {
      console.error('Error: You must be on the develop branch to create a release.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error checking current branch.');
    process.exit(1);
  }

  // Pull latest changes
  console.log('Pulling latest changes from develop...');
  exec('git pull origin develop');

  // Ask for release type
  rl.question('What type of release? (patch/minor/major) [patch]: ', (releaseType) => {
    releaseType = releaseType.trim().toLowerCase() || 'patch';

    if (!['patch', 'minor', 'major'].includes(releaseType)) {
      console.error('Invalid release type. Must be one of: patch, minor, major');
      rl.close();
      process.exit(1);
    }

    // Get current version and calculate new version
    const packageJson = readPackageJson();
    const currentVersion = packageJson.version;
    const newVersion = updateVersion(currentVersion, releaseType);

    // Start git flow release
    console.log(`Starting git flow release for version ${newVersion}...`);
    exec(`git flow release start ${newVersion}`);

    // Update version in package.json
    console.log(`Updating version from ${currentVersion} to ${newVersion}...`);
    packageJson.version = newVersion;
    writePackageJson(packageJson);

    // Commit version bump
    console.log('Committing version bump...');
    exec('git add package.json');
    exec(`git commit -m "chore: bump version to ${newVersion}"`);

    // Finish git flow release with a tag
    const tagName = `v${newVersion}`;
    console.log(`Finishing release and creating tag: ${tagName}...`);

    // Use -t to specify a custom tag name (with 'v' prefix)
    // Note: This will open an editor for commit messages
    exec(`git flow release finish -t "${tagName}" ${newVersion}`);

    console.log(`\nRelease ${newVersion} created successfully!`);
    console.log(`\nTo complete the release and trigger the npm_publish workflow, run:`);
    console.log(`  git push origin master develop ${tagName}`);

    rl.close();
  });
}

// Run the release process
release();
