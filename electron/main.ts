import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
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
import { DatabaseService } from './database';
import { UpdateService } from './updateService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store the last working directory
const CONFIG_DIR = path.join(os.homedir(), '.salesforce-dev-tool');
const LAST_DIR_FILE = path.join(CONFIG_DIR, 'last-working-directory.txt');

// Helper functions for working directory persistence
function saveLastWorkingDirectory(directory: string) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(LAST_DIR_FILE, directory, 'utf-8');
  } catch (error) {
    console.error('Failed to save last working directory:', error);
  }
}

function loadLastWorkingDirectory(): string | null {
  try {
    if (fs.existsSync(LAST_DIR_FILE)) {
      const savedDir = fs.readFileSync(LAST_DIR_FILE, 'utf-8').trim();
      // Check if the directory still exists
      if (savedDir && fs.existsSync(savedDir)) {
        return savedDir;
      }
    }
  } catch (error) {
    console.error('Failed to load last working directory:', error);
  }
  return null;
}

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
let database: DatabaseService;
let updateService: UpdateService;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const DIST = process.env.DIST!;
const VITE_PUBLIC = process.env.VITE_PUBLIC!;

// Restore last working directory on startup
const lastWorkingDir = loadLastWorkingDirectory();
if (lastWorkingDir) {
  try {
    process.chdir(lastWorkingDir);
    console.log('Restored working directory:', lastWorkingDir);
  } catch (error) {
    console.error('Failed to restore working directory:', error);
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(VITE_PUBLIC, 'vite.svg'),
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
    win.loadFile(path.join(DIST, 'index.html'));
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

ipcMain.handle('sf-set-working-directory', async (_event, directory: string) => {
  try {
    if (fs.existsSync(directory)) {
      process.chdir(directory);
      saveLastWorkingDirectory(directory);
      return directory;
    } else {
      throw new Error('Directory does not exist');
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to set working directory');
  }
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
    saveLastWorkingDirectory(selectedPath);
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

// IPC handler for Ollama models
ipcMain.handle('ollama-list-models', async () => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync('ollama list');
    const lines = stdout.trim().split('\n');
    
    // Skip header line and parse model names
    const models = lines.slice(1)
      .map(line => {
        const match = line.match(/^(\S+)/);
        return match ? match[1] : null;
      })
      .filter((name): name is string => name !== null);
    
    return models;
  } catch (error) {
    console.error('Failed to list Ollama models:', error);
    return [];
  }
});

app.whenReady().then(() => {
  try {
    // Initialize database
    database = new DatabaseService();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
  }
  
  // Initialize update service
  try {
    updateService = new UpdateService();
    console.log('Update service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize update service:', error);
  }
  
  createWindow();
  
  // Set main window for update service and start auto-check
  if (win && updateService) {
    updateService.setMainWindow(win);
    // Only check for updates in production
    if (app.isPackaged) {
      updateService.startAutoUpdateCheck(6); // Check every 6 hours
    }
  }
});

// Database IPC Handlers
ipcMain.handle('db-get-chats', async () => {
  return database.getAllChats();
});

ipcMain.handle('db-get-chat', async (_event, chatId: string) => {
  return database.getChat(chatId);
});

ipcMain.handle('db-create-chat', async (_event, chat: any) => {
  database.createChat(chat);
});

ipcMain.handle('db-update-chat', async (_event, chatId: string, updates: any) => {
  database.updateChat(chatId, updates);
});

ipcMain.handle('db-delete-chat', async (_event, chatId: string) => {
  database.deleteChat(chatId);
});

ipcMain.handle('db-get-messages', async (_event, chatId: string) => {
  return database.getMessages(chatId);
});

ipcMain.handle('db-add-message', async (_event, message: any) => {
  database.addMessage(message);
});

ipcMain.handle('db-update-message', async (_event, messageId: string, content: string) => {
  database.updateMessage(messageId, content);
});

ipcMain.handle('db-get-tool-calls', async (_event, messageId: string) => {
  return database.getToolCalls(messageId);
});

ipcMain.handle('db-add-tool-call', async (_event, toolCall: any) => {
  database.addToolCall(toolCall);
});

ipcMain.handle('db-get-chat-settings', async (_event, chatId: string) => {
  return database.getChatSettings(chatId);
});

ipcMain.handle('db-save-chat-settings', async (_event, settings: any) => {
  database.saveChatSettings(settings);
});

ipcMain.handle('db-get-todos', async (_event, chatId: string) => {
  return database.getTodos(chatId);
});

ipcMain.handle('db-save-todos', async (_event, chatId: string, todos: any[]) => {
  database.saveTodos(chatId, todos);
});

ipcMain.handle('db-get-tool-results', async () => {
  return database.getToolResults();
});

ipcMain.handle('db-save-tool-result', async (_event, id: string, name: string, result: string) => {
  database.saveToolResult(id, name, result);
});

ipcMain.handle('db-clear-old-tool-results', async () => {
  database.clearOldToolResults();
});

ipcMain.handle('db-get-instructions-used', async (_event, chatId: string) => {
  return database.getInstructionsUsed(chatId);
});

ipcMain.handle('db-add-instruction-used', async (_event, chatId: string, instructionId: string) => {
  database.addInstructionUsed(chatId, instructionId);
});

ipcMain.handle('db-get-app-setting', async (_event, key: string) => {
  return database.getAppSetting(key);
});

ipcMain.handle('db-set-app-setting', async (_event, key: string, value: string) => {
  database.setAppSetting(key, value);
});

ipcMain.handle('db-get-stats', async () => {
  return database.getStats();
});

ipcMain.handle('db-vacuum', async () => {
  database.vacuum();
});

// IPC handlers for Update Service
ipcMain.handle('update-check', async () => {
  try {
    if (!updateService) {
      throw new Error('Update service not initialized');
    }
    return await updateService.checkForUpdates();
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to check for updates');
  }
});

ipcMain.handle('update-download', async () => {
  try {
    if (!updateService) {
      throw new Error('Update service not initialized');
    }
    await updateService.downloadUpdate();
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to download update');
  }
});

ipcMain.handle('update-install', async () => {
  try {
    if (!updateService) {
      throw new Error('Update service not initialized');
    }
    updateService.quitAndInstall();
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to install update');
  }
});

ipcMain.handle('update-get-version', async () => {
  try {
    if (!updateService) {
      throw new Error('Update service not initialized');
    }
    return updateService.getCurrentVersion();
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to get version');
  }
});

ipcMain.handle('update-get-latest-release', async () => {
  try {
    if (!updateService) {
      throw new Error('Update service not initialized');
    }
    return await updateService.getLatestReleaseInfo();
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to get latest release info');
  }
});
