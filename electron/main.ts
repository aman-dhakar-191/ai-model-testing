import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeSalesforceTool } from '../src/utils/salesforceTools';
import { listFilesRecursive } from '../src/utils/fileOperations';
import {
  loginToOrg,
  listOrgs,
  getCurrentOrg,
  setDefaultOrg,
  logoutFromOrg,
  openOrg,
  checkSfCliInstalled,
  checkIfSalesforceProject,
  createProject,
  validateDeploy,
  deployMetadata,
  quickDeploy,
  retrieveMetadata,
} from '../src/utils/sfCliOperations';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for Salesforce tools
ipcMain.handle('sf-execute-tool', async (_event, toolName: string, argsJson: string) => {
  try {
    return await executeSalesforceTool(toolName, argsJson);
  } catch (error) {
    return JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

ipcMain.handle('sf-get-working-directory', () => {
  return process.cwd();
});

ipcMain.handle('sf-get-file-tree', async (_event, dirPath?: string) => {
  try {
    const targetPath = dirPath || process.cwd();
    const fileTree = listFilesRecursive(targetPath);
    return JSON.stringify(fileTree);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to get file tree');
  }
});

ipcMain.handle('sf-select-folder', async () => {
  const { dialog } = await import('electron');
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Salesforce Project Folder',
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    process.chdir(selectedPath);
    return selectedPath;
  }
  
  return null;
});

// IPC handlers for Salesforce CLI operations
ipcMain.handle('sf-cli-check', async () => {
  try {
    return await checkSfCliInstalled();
  } catch (error) {
    return false;
  }
});

ipcMain.handle('sf-org-login', async (_event, alias?: string) => {
  try {
    return await loginToOrg(alias);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to login to org');
  }
});

ipcMain.handle('sf-org-list', async () => {
  try {
    return await listOrgs();
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to list orgs');
  }
});

ipcMain.handle('sf-org-current', async () => {
  try {
    return await getCurrentOrg();
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to get current org');
  }
});

ipcMain.handle('sf-org-set-default', async (_event, usernameOrAlias: string) => {
  try {
    return await setDefaultOrg(usernameOrAlias);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to set default org');
  }
});

ipcMain.handle('sf-org-logout', async (_event, usernameOrAlias: string) => {
  try {
    return await logoutFromOrg(usernameOrAlias);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to logout from org');
  }
});

ipcMain.handle('sf-org-open', async (_event, usernameOrAlias?: string) => {
  try {
    return await openOrg(usernameOrAlias);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to open org');
  }
});

ipcMain.handle('sf-project-check', async (_event, directory: string) => {
  try {
    return checkIfSalesforceProject(directory);
  } catch (error) {
    return false;
  }
});

ipcMain.handle('sf-project-create', async (_event, projectName: string, template: 'standard' | 'empty' | 'analytics', targetDir?: string) => {
  try {
    return await createProject(projectName, template, targetDir);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to create project');
  }
});

ipcMain.handle('sf-deploy-validate', async (_event, sourcePath: string, targetOrg?: string, testLevel?: string, tests?: string[]) => {
  try {
    const result = await validateDeploy(sourcePath, targetOrg, testLevel as any, tests);
    return JSON.stringify(result);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to validate deployment');
  }
});

ipcMain.handle('sf-deploy-metadata', async (_event, sourcePath: string, targetOrg?: string, testLevel?: string, tests?: string[], checkOnly?: boolean) => {
  try {
    const result = await deployMetadata(sourcePath, targetOrg, testLevel as any, tests, checkOnly);
    return JSON.stringify(result);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to deploy metadata');
  }
});

ipcMain.handle('sf-deploy-quick', async (_event, jobId: string, targetOrg?: string) => {
  try {
    const result = await quickDeploy(jobId, targetOrg);
    return JSON.stringify(result);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to quick deploy');
  }
});

ipcMain.handle('sf-retrieve-metadata', async (_event, sourcePath: string, targetOrg?: string) => {
  try {
    const result = await retrieveMetadata(sourcePath, targetOrg);
    return JSON.stringify(result);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to retrieve metadata');
  }
});

app.whenReady().then(createWindow);
