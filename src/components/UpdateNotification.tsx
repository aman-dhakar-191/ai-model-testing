import { useState, useEffect } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import type { UpdateStatus, UpdateInfo } from '../electron';

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Get current version
    if (window.electron?.updater) {
      window.electron.updater.getCurrentVersion().then(setCurrentVersion).catch(console.error);

      // Listen for update status events
      window.electron.updater.onUpdateStatus((status: UpdateStatus) => {
        switch (status.event) {
          case 'update-available':
            setUpdateAvailable(true);
            setUpdateInfo(status.data);
            setDismissed(false);
            break;
          case 'update-not-available':
            setUpdateAvailable(false);
            break;
          case 'download-progress':
            setDownloading(true);
            setDownloadProgress(Math.round(status.data.percent));
            break;
          case 'update-downloaded':
            setDownloading(false);
            setUpdateDownloaded(true);
            break;
          case 'update-error':
            setError(status.data.message);
            setDownloading(false);
            break;
        }
      });
    }
  }, []);

  const handleCheckForUpdates = async () => {
    if (!window.electron?.updater) return;
    
    setError(null);
    try {
      const hasUpdate = await window.electron.updater.checkForUpdates();
      if (!hasUpdate) {
        // Show a brief message if no updates are available
        setError('You are already running the latest version!');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
    }
  };

  const handleDownload = async () => {
    if (!window.electron?.updater) return;
    
    setError(null);
    try {
      await window.electron.updater.downloadUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download update');
      setDownloading(false);
    }
  };

  const handleInstall = async () => {
    if (!window.electron?.updater) return;
    
    try {
      await window.electron.updater.installUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install update');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!window.electron?.updater) {
    return null; // Not running in Electron or updater not available
  }

  if (dismissed || (!updateAvailable && !error)) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleCheckForUpdates}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
          title="Check for updates"
        >
          <RefreshCw size={16} />
          <span className="text-sm">Check for Updates</span>
        </button>
      </div>
    );
  }

  if (updateDownloaded) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 max-w-sm border-2 border-green-500">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
            Update Downloaded
          </h3>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          Version {updateInfo?.version} is ready to install. The app will restart to complete the installation.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Restart & Install
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    );
  }

  if (downloading) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 max-w-sm border-2 border-blue-500">
        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
          Downloading Update
        </h3>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all"
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {downloadProgress}% complete
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 max-w-sm border-2 border-yellow-500">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
            Update Status
          </h3>
          <button
            onClick={() => setError(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 max-w-sm border-2 border-purple-500">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
          Update Available
        </h3>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
        Version <strong>{updateInfo?.version}</strong> is available (current: {currentVersion})
      </p>
      {updateInfo?.releaseNotes && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 rounded">
          {updateInfo.releaseNotes}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Download size={16} />
          Download
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}
