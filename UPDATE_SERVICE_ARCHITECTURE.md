# Update Service Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GitHub Releases (Cloud)                            │
│                                                                              │
│  Repository: aman-dhakar-191/ai-model-testing                              │
│  API: https://api.github.com/repos/.../releases/latest                     │
│  Assets: Windows .exe, macOS .dmg/.zip, Linux .AppImage/.tar.gz           │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ HTTPS
                                   │ GET /releases/latest
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                    MAIN PROCESS (Electron - Node.js)                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  UpdateService (updateService.ts)                              │        │
│  │                                                                 │        │
│  │  • electron-updater integration                                │        │
│  │  • checkForUpdates() - Compare versions                        │        │
│  │  • downloadUpdate() - Download in background                   │        │
│  │  • quitAndInstall() - Install and restart                      │        │
│  │  • getLatestReleaseInfo() - Fetch from GitHub API              │        │
│  │  • startAutoUpdateCheck() - 6-hour timer                       │        │
│  │                                                                 │        │
│  │  Events:                                                        │        │
│  │  • checking-for-update                                          │        │
│  │  • update-available (version, release notes)                    │        │
│  │  • update-not-available                                         │        │
│  │  • download-progress (percent, bytes)                           │        │
│  │  • update-downloaded                                            │        │
│  │  • error                                                        │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                            │                                                 │
│                            │ Events                                          │
│                            │                                                 │
│  ┌────────────────────────▼────────────────────────────────────────┐       │
│  │  IPC Handlers (main.ts)                                          │       │
│  │                                                                   │       │
│  │  • update-check          → checkForUpdates()                     │       │
│  │  • update-download       → downloadUpdate()                      │       │
│  │  • update-install        → quitAndInstall()                      │       │
│  │  • update-get-version    → getCurrentVersion()                   │       │
│  │  • update-get-latest-release → getLatestReleaseInfo()            │       │
│  │                                                                   │       │
│  │  Events to Renderer:                                             │       │
│  │  • update-status (event, data)                                   │       │
│  └───────────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ IPC
                                   │ Context Bridge
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                    PRELOAD (preload.ts)                                      │
│                                                                              │
│  window.electron.updater = {                                                │
│    checkForUpdates()      → IPC invoke('update-check')                     │
│    downloadUpdate()       → IPC invoke('update-download')                  │
│    installUpdate()        → IPC invoke('update-install')                   │
│    getCurrentVersion()    → IPC invoke('update-get-version')               │
│    getLatestRelease()     → IPC invoke('update-get-latest-release')        │
│    onUpdateStatus(callback) → IPC on('update-status', callback)            │
│  }                                                                           │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ Type-safe API
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────┐
│                 RENDERER PROCESS (React - Browser)                           │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  UpdateNotification Component                                   │        │
│  │  (src/components/UpdateNotification.tsx)                        │        │
│  │                                                                  │        │
│  │  State Management:                                               │        │
│  │  • updateAvailable      (boolean)                                │        │
│  │  • updateInfo           (version, date, notes)                   │        │
│  │  • downloading          (boolean)                                │        │
│  │  • downloadProgress     (0-100)                                  │        │
│  │  • updateDownloaded     (boolean)                                │        │
│  │  • error                (string | null)                          │        │
│  │                                                                  │        │
│  │  UI States:                                                      │        │
│  │  ┌──────────────────────────────────────────────────┐          │        │
│  │  │ 1. No Notification                                │          │        │
│  │  │    [Check for Updates] button                     │          │        │
│  │  └──────────────────────────────────────────────────┘          │        │
│  │  ┌──────────────────────────────────────────────────┐          │        │
│  │  │ 2. Update Available                               │          │        │
│  │  │    Version X.X.X available                        │          │        │
│  │  │    Release Notes (scrollable)                     │          │        │
│  │  │    [Download]  [Later]  [X]                       │          │        │
│  │  └──────────────────────────────────────────────────┘          │        │
│  │  ┌──────────────────────────────────────────────────┐          │        │
│  │  │ 3. Downloading                                    │          │        │
│  │  │    Progress: 45%                                  │          │        │
│  │  │    [████████████░░░░░░░░░░░░░░░]                 │          │        │
│  │  └──────────────────────────────────────────────────┘          │        │
│  │  ┌──────────────────────────────────────────────────┐          │        │
│  │  │ 4. Update Downloaded                              │          │        │
│  │  │    Ready to install                               │          │        │
│  │  │    [Restart & Install]  [Later]  [X]             │          │        │
│  │  └──────────────────────────────────────────────────┘          │        │
│  │                                                                  │        │
│  │  User Actions:                                                   │        │
│  │  • Click "Check for Updates" → window.electron.updater         │        │
│  │                                 .checkForUpdates()              │        │
│  │  • Click "Download"           → window.electron.updater         │        │
│  │                                 .downloadUpdate()               │        │
│  │  • Click "Restart & Install"  → window.electron.updater         │        │
│  │                                 .installUpdate()                │        │
│  │  • Listen for status changes  → window.electron.updater         │        │
│  │                                 .onUpdateStatus(callback)       │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │  App Component (src/App.tsx)                                    │        │
│  │                                                                  │        │
│  │  <div className="app">                                          │        │
│  │    {/* Main app content */}                                     │        │
│  │    <UpdateNotification />  ← Always rendered                    │        │
│  │  </div>                                                          │        │
│  └────────────────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

                              UPDATE FLOW TIMELINE

═══════════════════════════════════════════════════════════════════════════════

App Startup (Production)
    │
    ├─→ Initialize UpdateService
    │       │
    │       ├─→ Configure electron-updater
    │       ├─→ Set up event listeners
    │       └─→ Start auto-check (6 hours)
    │
    └─→ Create Main Window
            │
            └─→ Load UI with UpdateNotification

─────────────────────── Automatic Check (Every 6 Hours) ───────────────────────

    UpdateService.checkForUpdates()
            │
            ├─→ electron-updater.checkForUpdates()
            │       │
            │       └─→ GET https://api.github.com/repos/.../releases/latest
            │               │
            │               └─→ Compare versions
            │
            ├─→ [If new version available]
            │       │
            │       └─→ Send 'update-available' event
            │               │
            │               └─→ UpdateNotification shows notification
            │
            └─→ [If no update]
                    │
                    └─→ Send 'update-not-available' event

────────────────────────── User Clicks Download ───────────────────────────────

    User clicks "Download" button
            │
            └─→ window.electron.updater.downloadUpdate()
                    │
                    └─→ IPC invoke('update-download')
                            │
                            └─→ UpdateService.downloadUpdate()
                                    │
                                    ├─→ electron-updater.downloadUpdate()
                                    │       │
                                    │       ├─→ Download from GitHub
                                    │       ├─→ Send 'download-progress' events
                                    │       │       │
                                    │       │       └─→ UpdateNotification updates progress bar
                                    │       │
                                    │       └─→ Send 'update-downloaded' event
                                    │               │
                                    │               └─→ UpdateNotification shows "Ready"
                                    │
                                    └─→ [Download complete]

────────────────────── User Clicks Restart & Install ──────────────────────────

    User clicks "Restart & Install" button
            │
            └─→ window.electron.updater.installUpdate()
                    │
                    └─→ IPC invoke('update-install')
                            │
                            └─→ UpdateService.quitAndInstall()
                                    │
                                    ├─→ electron-updater.quitAndInstall()
                                    │       │
                                    │       ├─→ Quit application
                                    │       ├─→ Install update
                                    │       └─→ Restart application
                                    │
                                    └─→ [App restarts with new version]

═══════════════════════════════════════════════════════════════════════════════

                            CONFIGURATION FILES

═══════════════════════════════════════════════════════════════════════════════

package.json
    │
    ├─→ "version": "1.0.1"  ← Current version
    │
    ├─→ "dependencies": {
    │       "electron-updater": "^x.x.x",
    │       "electron-log": "^x.x.x"
    │   }
    │
    └─→ "build": {
            "publish": {
                "provider": "github",
                "owner": "aman-dhakar-191",
                "repo": "ai-model-testing"
            }
        }

═══════════════════════════════════════════════════════════════════════════════

                            CI/CD WORKFLOW

═══════════════════════════════════════════════════════════════════════════════

.github/workflows/ci-and-release.yaml

Developer pushes to main
    │
    └─→ GitHub Actions Triggered
            │
            ├─→ Build for Windows
            ├─→ Build for macOS
            ├─→ Build for Linux
            │
            ├─→ Create GitHub Release
            │       │
            │       ├─→ Tag: v{version}
            │       ├─→ Name: Release v{version}
            │       └─→ Generate release notes
            │
            └─→ Upload Build Artifacts
                    │
                    ├─→ Windows: .exe, .zip
                    ├─→ macOS: .dmg, .zip
                    └─→ Linux: .AppImage, .tar.gz

═══════════════════════════════════════════════════════════════════════════════

                        SECURITY & QUALITY

═══════════════════════════════════════════════════════════════════════════════

✅ HTTPS only for GitHub API
✅ electron-updater validates downloads
✅ User must approve installation
✅ CodeQL security scan passed (0 vulnerabilities)
✅ TypeScript type safety
✅ Error handling at all levels
✅ Graceful degradation
✅ Production-only auto-check

═══════════════════════════════════════════════════════════════════════════════
```

## Key Components

### 1. UpdateService (Main Process)
- **Role**: Orchestrates the entire update process
- **Tech**: electron-updater, electron-log
- **Features**: Auto-check, manual check, download, install

### 2. IPC Bridge
- **Role**: Secure communication between processes
- **Tech**: Electron IPC, contextBridge
- **Security**: Type-safe, whitelisted channels

### 3. UpdateNotification (Renderer)
- **Role**: User interface for updates
- **Tech**: React, TypeScript
- **Features**: Multiple states, progress tracking, release notes

### 4. GitHub Integration
- **Role**: Release distribution
- **Tech**: GitHub Releases API, GitHub Actions
- **Automation**: Auto-build, auto-release, auto-distribute

## Data Flow

1. **Check**: Main → GitHub API → Main → IPC → Renderer
2. **Download**: Renderer → IPC → Main → GitHub → Main → IPC → Renderer (progress)
3. **Install**: Renderer → IPC → Main → electron-updater → System

## Update States

```
IDLE → CHECKING → UPDATE_AVAILABLE → DOWNLOADING → DOWNLOADED → INSTALLING → RESTARTED
  ↓       ↓            ↓                 ↓             ↓            ↓
  └───────┴────────────┴─────────────────┴─────────────┴────────────┘
                     ERROR (handled at any stage)
```

## User Experience

- **Minimal Interruption**: Updates happen in background
- **Full Control**: User decides when to download and install
- **Clear Communication**: Release notes and progress visible
- **Graceful**: Can postpone or dismiss updates
- **Reliable**: Auto-retry and error handling
