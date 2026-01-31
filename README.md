# AI Model Testing Desktop App

A standalone Electron desktop application for testing AI models using the OpenRouter API. This tool allows you to experiment with different models, system prompts, and temperature settings while maintaining a chat history.

## Features

- 🤖 **Multiple AI Models**: Test various models from OpenAI, Google, Anthropic, and Meta
- 💬 **Chat Interface**: Interactive chat-based testing with conversation history
- ⚙️ **Customizable Settings**: Configure system prompts and temperature
- 💾 **Local Storage**: Chat history saved locally
- 📤 **Export Options**: Export chat history as JSON or Markdown
- 🎨 **Modern UI**: Clean, responsive design with gradient styling
- 🖥️ **Desktop App**: Native desktop application for Windows, macOS, and Linux

## Getting Started

### Prerequisites

- Node.js 22+
- An [OpenRouter](https://openrouter.ai/) API key

### Installation

```bash
npm install
```

### Development

To run the Electron app in development mode:

```bash
npm run dev
```

Then in another terminal, start Electron:

```bash
npm run electron:dev
```

### Building for Production

Build the Electron app for your current platform:

```bash
npm run electron:build
```

Build for specific platforms:

```bash
# Windows
npm run electron:build:win

# macOS
npm run electron:build:mac

# Linux
npm run electron:build:linux
```

The built application will be in the `release/{version}` directory.

### Linting

```bash
npm run lint
```

### Usage

1. Launch the desktop application
2. Enter your OpenRouter API key in the settings panel
3. Select an AI model from the dropdown
4. Optionally configure a system prompt and temperature
5. Start chatting and testing model responses
6. Export your chat history as JSON or Markdown

## GitHub Actions

This project uses GitHub Actions to automatically build and release the Electron app:

- **Workflow**: `.github/workflows/electron-release.yml`
- **Trigger**: Push a tag starting with `v` (e.g., `v1.0.0`) or manually trigger the workflow
- **Platforms**: Builds for Windows, macOS, and Linux
- **Artifacts**: Automatically creates a GitHub release with downloadable installers

To create a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Download

Download the latest release from the [Releases](https://github.com/aman-dhakar-191/ai-model-testing/releases) page.
