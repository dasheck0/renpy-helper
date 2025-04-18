# Renpy Helper
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
1. Prompt you to enter the path to an image file
2. Process the image using the rembg tool with your configured settings
3. Save the output to your configured output directory with "_clean" added to the filename

### Settings Management

```bash
# Update tool settings
renpy-helper settings
```

This command allows you to configure:
- rembg command flags (default: `-a -m isnet-general-use`)
- Output directory for processed files (default: `./output`)


## API
<!-- section: API -->

### Commands

- `renpy-helper rembg`: Remove backgrounds from images using the rembg tool
- `renpy-helper settings`: Configure tool settings

### Settings File

Settings are stored in a `.renpy-helper-settings.json` file in the current directory. The file structure is:

```json
{
  "rembg": {
    "flags": ["-a", "-m", "isnet-general-use"],
    "outputDirectory": "./output"
  }
}
```


## Installation
<!-- section: Installation -->

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Python with rembg installed (`pip install rembg`)

### Global Installation

```bash
# Install globally from npm
npm install -g dasheck0-renpy-helper

# Or install from source
git clone https://github.com/dasheck0/dasheck0-renpy-helper.git
cd dasheck0-renpy-helper
npm install
npm run build
npm link
```


## Contributing
<!-- section: Contributing -->

### Development

```bash
# Clone the repository
git clone https://github.com/dasheck0/dasheck0-renpy-helper.git
cd dasheck0-renpy-helper

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build
```

### Adding New Commands

1. Create a new file in the `src/commands` directory
2. Export a command object with `name`, `description`, and `action` properties
3. Import and register the command in `src/index.ts`

Bug reports and pull requests are welcome on GitHub at https://github.com/dasheck0/dasheck0-renpy-helper. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the Contributor Covenant code of conduct.

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