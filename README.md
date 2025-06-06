# Renpy Helper

[![npm version](https://img.shields.io/npm/v/@dasheck0/renpy-helper.svg)](https://www.npmjs.com/package/@dasheck0/renpy-helper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Node.js CI](https://github.com/dasheck0/renpy-helper/actions/workflows/npm_publish.yml/badge.svg)](https://github.com/dasheck0/renpy-helper/actions/workflows/npm_publish.yml)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/dasheck0/renpy-helper)

<!-- section: Introduction -->

Renpy Helper is a CLI tool that offers helpful utilities for developing visual novels using Ren'Py. It provides a collection of commands to streamline common tasks in the visual novel development workflow.

Currently, it includes:
- Background removal from images using the rembg tool
- Settings management for customizing tool behavior


## Usage
<!-- section: Usage -->

### Background Removal (rembg)

```bash
# Run the background removal tool
renpy-helper rembg
```

This command will:
1. Allow you to navigate to a directory containing image files
2. Let you select multiple image files using checkbox selection (space to select, enter to confirm)
3. Process each selected image using the rembg tool with your configured settings
4. Save the outputs to your configured output directory with "_clean" added to each filename

### Settings Management

```bash
# Update tool settings
renpy-helper settings
```

This command allows you to configure:
- rembg command flags (default: `-a -m isnet-general-use`)
- Input directory for source files (default: `.`)
- Output directory for processed files (default: `./output`)

Both input and output directories can be selected through an interactive directory navigation interface.


## API
<!-- section: API -->

### Commands

- `renpy-helper rembg`: Remove backgrounds from images using the rembg tool
- `renpy-helper settings`: Configure tool settings

### Package Information

- Package name: `@dasheck0/renpy-helper`
- Binary name: `renpy-helper`

### Settings File

Settings are stored in a `.renpy-helper-settings.json` file in the current directory. The file structure is:

```json
{
  "rembg": {
    "flags": ["-a", "-m", "isnet-general-use"],
    "inputDirectory": ".",
    "outputDirectory": "./output"
  }
}
```


## Installation
<!-- section: Installation -->

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Python with rembg installed (`pip install rembg`)

### Global Installation

```bash
# Install globally from npm
npm install -g @dasheck0/renpy-helper

# Or install from source
git clone https://github.com/dasheck0/renpy-helper.git
cd renpy-helper
npm install
npm run build
npm link
```


## Contributing
<!-- section: Contributing -->

### Development

```bash
# Clone the repository
git clone https://github.com/dasheck0/renpy-helper.git
cd renpy-helper

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build

# Run tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Adding New Commands

1. Create a new file in the `src/commands` directory
2. Export a command object with `name`, `description`, and `action` properties
3. Import and register the command in `src/index.ts`

### Testing

This project uses Jest for testing. Tests are located in the `src/__tests__` directory, mirroring the structure of the source code.

- Unit tests are written for utility functions and classes
- Each component has its own test file
- Mock-fs is used to simulate file system operations without touching the actual file system

To add new tests:

1. Create a new test file in the appropriate directory under `src/__tests__`
2. Use Jest's `describe` and `test` functions to organize your tests
3. Mock external dependencies as needed
4. Run tests with `npm test`

### Release Process

This project follows the git flow workflow for releases. To create a new release:

```bash
# Make sure you're on the develop branch with all changes committed
git checkout develop

# Run the release script
npm run release
```

The script will:
1. Ask for the release type (patch, minor, or major)
2. Update the version in package.json
3. Create a release branch using git flow
4. Commit the version bump
5. Finish the release with a tag starting with 'v'
6. Provide instructions for pushing to trigger the npm publish workflow

### Continuous Integration

This project uses GitHub Actions for continuous integration:

- **npm_publish.yml**: Automatically publishes the package to npm and GitHub Packages when a new version tag (v*) is pushed
  - Runs the test suite to ensure code quality
  - Builds the project to verify compilation
  - Publishes to npm registry and GitHub Packages
  - Requires NPM_TOKEN secret to be set in the repository

The CI pipeline ensures that all tests pass before publishing a new version, maintaining code quality and reliability.

Bug reports and pull requests are welcome on GitHub at https://github.com/dasheck0/renpy-helper. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the Contributor Covenant code of conduct.

## License
<!-- section: License -->
```
MIT License Copyright (c) 2025 Stefan Neidig

Permission is hereby granted, free
of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice
(including the next paragraph) shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```