# Update Service Documentation

This document provides comprehensive information about the update service implementation for the Salesforce Dev Tool application.

## Overview

The update service automatically checks for new releases from GitHub and provides users with the ability to update the application seamlessly. It uses `electron-updater` to manage the update process and integrates with GitHub Releases.

## Features

- **Automatic Update Checking**: Checks for updates every 6 hours (configurable)
- **Manual Update Check**: Users can manually check for updates via the UI
- **Download Progress**: Shows real-time download progress with a progress bar
- **Background Updates**: Downloads updates in the background without interrupting workflow
- **User Control**: Users can choose to download/install updates or postpone them
- **Release Notes**: Displays release notes from GitHub when an update is available
- **GitHub Release Integration**: Fetches release information directly from GitHub

## Architecture

### Components

1. **UpdateService** (`electron/updateService.ts`)
   - Main service class handling all update logic
   - Manages electron-updater configuration
   - Provides methods for checking, downloading, and installing updates
   - Fetches release information from GitHub API

2. **IPC Handlers** (`electron/main.ts`)
   - `update-check`: Check for available updates
   - `update-download`: Download the available update
   - `update-install`: Install update and restart the application
   - `update-get-version`: Get the current application version
   - `update-get-latest-release`: Get latest release info from GitHub

3. **UI Component** (`src/components/UpdateNotification.tsx`)
   - Displays update notifications to users
   - Shows download progress
   - Provides buttons for user actions (Download, Install, Later, Dismiss)
   - Handles different update states (checking, available, downloading, downloaded)

4. **Preload API** (`electron/preload.ts`)
   - Exposes update methods to the renderer process
   - Provides type-safe interface for UI components

## How It Works

### Update Check Flow

1. **Initialization**: When the app starts (in production mode), the UpdateService initializes
2. **Auto-Check**: Starts checking for updates every 6 hours automatically
3. **Manual Check**: Users can click "Check for Updates" button to check manually
4. **Update Detection**: Compares current version with latest GitHub release
5. **Notification**: If an update is available, displays a notification with release info

### Download and Install Flow

1. **User Action**: User clicks "Download" button in the update notification
2. **Download**: electron-updater downloads the update in the background
3. **Progress**: UI shows a progress bar with percentage
4. **Completion**: When download completes, shows "Update Downloaded" notification
5. **Installation**: User clicks "Restart & Install" to quit and install the update
6. **Auto-Install**: Update is automatically installed when the app quits

### GitHub Integration

The service fetches release information from:
```
https://api.github.com/repos/aman-dhakar-191/ai-model-testing/releases/latest
```

This provides:
- Version number (tag_name)
- Release date (published_at)
- Release notes (body)

## Configuration

### electron-builder Configuration

The `package.json` includes the publish configuration:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "aman-dhakar-191",
      "repo": "ai-model-testing"
    }
  }
}
```

### Update Check Interval

The default interval is 6 hours, but can be changed in `electron/main.ts`:

```typescript
updateService.startAutoUpdateCheck(6); // Check every 6 hours
```

## Development vs Production

- **Development**: Update checks are disabled to avoid interfering with development
- **Production**: Update checks run automatically in packaged applications

The check is controlled by:
```typescript
if (app.isPackaged) {
  updateService.startAutoUpdateCheck(6);
}
```

## GitHub Actions Integration

The CI/CD workflow (`.github/workflows/ci-and-release.yaml`) automatically:
1. Builds the application for Windows, macOS, and Linux
2. Creates a GitHub release with the version from `package.json`
3. Uploads build artifacts to the release
4. Generates release notes from commit messages

When a new version is pushed:
1. Increment the version in `package.json`
2. Push to main branch
3. GitHub Actions creates the release
4. electron-updater detects the new release
5. Users get notified about the update

## User Experience

### Manual Update Check

Users can manually check for updates in **two ways**:

1. **Settings Panel** (Primary):
   - Open Settings (⚙️ icon in top-right)
   - Scroll to "Application Updates" section at the bottom
   - Click "Check for Updates" button
   - Visual feedback with spinning icon while checking
   - Status messages appear below the button:
     - "You are already running the latest version!" (no update)
     - "Update available! Check the notification." (update found)
     - Error messages if check fails
   - Current version displayed in the section header
   
2. **Floating Button** (Secondary):
   - Located in bottom-right corner
   - Appears when no update notification is shown
   - One-click to check for updates

### Update Available
When an update is available, users see:
- A notification in the bottom-right corner
- Current version and new version
- Release notes (scrollable if long)
- "Download" and "Later" buttons

### Downloading
While downloading:
- Progress bar showing percentage
- Cannot be dismissed until complete

### Update Downloaded
When ready to install:
- "Restart & Install" button to apply update
- "Later" button to postpone installation
- Update will install when app quits (if auto-install is enabled)

### No Updates
When manually checking and no updates are available:
- Brief message: "You are already running the latest version!"
- Message auto-dismisses after 3-5 seconds
- Displayed in Settings Panel (primary) or as error notification (secondary)

## Error Handling

The service handles various error scenarios:
- Network errors when checking for updates
- Download failures
- Installation errors
- Invalid release information

Errors are displayed to users in the notification UI.

## Security Considerations

1. **HTTPS**: All communications with GitHub use HTTPS
2. **Code Signing**: Applications should be code-signed for auto-update to work properly
3. **Validation**: electron-updater validates the downloaded update before installation

## Testing

### Testing Update Flow

1. **Prepare a Test Release**:
   - Increment version in `package.json` (e.g., 1.0.1 -> 1.0.2)
   - Push to main branch
   - GitHub Actions will create a release

2. **Test the Old Version**:
   - Build and run version 1.0.1
   - Click "Check for Updates"
   - Should detect version 1.0.2

3. **Test Download**:
   - Click "Download" in the notification
   - Verify progress bar shows correctly

4. **Test Installation**:
   - Click "Restart & Install"
   - App should restart with new version

### Manual Testing

```bash
# Build for your platform
npm run electron:build

# Run the built application
# Check for updates functionality
```

## Troubleshooting

### Updates Not Detected

1. Check if running in production mode (`app.isPackaged`)
2. Verify GitHub release exists with proper assets
3. Check console logs for errors
4. Ensure version in release is higher than current

### Download Fails

1. Check network connectivity
2. Verify GitHub release has correct assets for platform
3. Check electron-updater logs

### Update Doesn't Install

1. Verify app has write permissions
2. On macOS/Linux, check if app is in Applications folder
3. Review installation logs

## Future Enhancements

Potential improvements:
- [ ] Add option to disable auto-updates
- [ ] Support for beta/preview releases
- [ ] Update history/changelog viewer
- [ ] Bandwidth throttling for downloads
- [ ] Delta updates for smaller downloads
- [ ] Rollback mechanism for failed updates
- [ ] Custom update server support

## References

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
- [Electron Builder Configuration](https://www.electron.build/configuration/configuration)
