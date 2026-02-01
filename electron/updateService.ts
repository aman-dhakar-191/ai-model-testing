import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';
import log from 'electron-log';

// Configure electron-log
log.transports.file.level = 'info';
autoUpdater.logger = log;

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

export class UpdateService {
  private mainWindow: BrowserWindow | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  constructor() {
    this.setupAutoUpdater();
  }

  setMainWindow(window: BrowserWindow | null) {
    this.mainWindow = window;
  }

  private setupAutoUpdater() {
    // Configure auto-updater
    autoUpdater.autoDownload = false; // Don't download automatically
    autoUpdater.autoInstallOnAppQuit = true; // Install when app quits

    // Listen to update events
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.sendStatusToWindow('checking-for-update');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.sendStatusToWindow('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.sendStatusToWindow('update-not-available', {
        version: info.version,
      });
    });

    autoUpdater.on('error', (error) => {
      log.error('Error in auto-updater:', error);
      this.sendStatusToWindow('update-error', {
        message: error.message,
      });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      log.info('Download progress:', progressObj);
      this.sendStatusToWindow('download-progress', {
        bytesPerSecond: progressObj.bytesPerSecond,
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.sendStatusToWindow('update-downloaded', {
        version: info.version,
      });
    });
  }

  private sendStatusToWindow(event: string, data?: any) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('update-status', { event, data });
    }
  }

  /**
   * Check for updates manually
   */
  async checkForUpdates(): Promise<boolean> {
    if (this.isChecking) {
      log.info('Update check already in progress');
      return false;
    }

    try {
      this.isChecking = true;
      const result = await autoUpdater.checkForUpdates();
      return result !== null && result.updateInfo.version !== autoUpdater.currentVersion.version;
    } catch (error) {
      log.error('Error checking for updates:', error);
      return false;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Download the available update
   */
  async downloadUpdate(): Promise<void> {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('Error downloading update:', error);
      throw error;
    }
  }

  /**
   * Install the downloaded update and restart the app
   */
  quitAndInstall(): void {
    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (error) {
      log.error('Error installing update:', error);
      throw error;
    }
  }

  /**
   * Start automatic update checking (every 6 hours)
   */
  startAutoUpdateCheck(intervalHours: number = 6): void {
    if (this.updateCheckInterval) {
      return; // Already started
    }

    // Check immediately
    this.checkForUpdates();

    // Then check periodically
    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);

    log.info(`Auto-update check started (interval: ${intervalHours} hours)`);
  }

  /**
   * Stop automatic update checking
   */
  stopAutoUpdateCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
      log.info('Auto-update check stopped');
    }
  }

  /**
   * Get the current version
   */
  getCurrentVersion(): string {
    return autoUpdater.currentVersion.version;
  }

  /**
   * Fetch release information from GitHub
   */
  async getLatestReleaseInfo(): Promise<UpdateInfo | null> {
    try {
      const response = await fetch(
        'https://api.github.com/repos/aman-dhakar-191/ai-model-testing/releases/latest'
      );
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        version: data.tag_name.replace(/^v/, ''), // Remove 'v' prefix
        releaseDate: data.published_at,
        releaseNotes: data.body,
      };
    } catch (error) {
      log.error('Error fetching release info from GitHub:', error);
      return null;
    }
  }
}
