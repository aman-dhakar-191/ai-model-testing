import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Salesforce file operations
  salesforce: {
    executeTool: (toolName: string, argsJson: string) => 
      ipcRenderer.invoke('sf-execute-tool', toolName, argsJson),
    getWorkingDirectory: () => ipcRenderer.invoke('sf-get-working-directory'),
    setWorkingDirectory: (directory: string) => ipcRenderer.invoke('sf-set-working-directory', directory),
    getFileTree: (dirPath?: string) => ipcRenderer.invoke('sf-get-file-tree', dirPath),
    selectFolder: () => ipcRenderer.invoke('sf-select-folder'),
  },
  
  // Salesforce CLI operations
  sfCli: {
    checkInstalled: () => ipcRenderer.invoke('sf-cli-check'),
    loginToOrg: (alias?: string) => ipcRenderer.invoke('sf-org-login', alias),
    listOrgs: () => ipcRenderer.invoke('sf-org-list'),
    getCurrentOrg: () => ipcRenderer.invoke('sf-org-current'),
    setDefaultOrg: (usernameOrAlias: string) => ipcRenderer.invoke('sf-org-set-default', usernameOrAlias),
    logoutFromOrg: (usernameOrAlias: string) => ipcRenderer.invoke('sf-org-logout', usernameOrAlias),
    openOrg: (usernameOrAlias?: string) => ipcRenderer.invoke('sf-org-open', usernameOrAlias),
    checkIfSalesforceProject: (directory: string) => ipcRenderer.invoke('sf-project-check', directory),
    createProject: (projectName: string, template: 'standard' | 'empty' | 'analytics', targetDir?: string) => 
      ipcRenderer.invoke('sf-project-create', projectName, template, targetDir),
    validateDeploy: (sourcePath: string, targetOrg?: string, testLevel?: string, tests?: string[]) =>
      ipcRenderer.invoke('sf-deploy-validate', sourcePath, targetOrg, testLevel, tests),
    deployMetadata: (sourcePath: string, targetOrg?: string, testLevel?: string, tests?: string[], checkOnly?: boolean) =>
      ipcRenderer.invoke('sf-deploy-metadata', sourcePath, targetOrg, testLevel, tests, checkOnly),
    quickDeploy: (jobId: string, targetOrg?: string) =>
      ipcRenderer.invoke('sf-deploy-quick', jobId, targetOrg),
    retrieveMetadata: (sourcePath: string, targetOrg?: string) =>
      ipcRenderer.invoke('sf-retrieve-metadata', sourcePath, targetOrg),
  },
  
  // Ollama operations
  ollama: {
    listModels: () => ipcRenderer.invoke('ollama-list-models'),
  },
  
  // Database operations
  db: {
    getChats: () => ipcRenderer.invoke('db-get-chats'),
    getChat: (chatId: string) => ipcRenderer.invoke('db-get-chat', chatId),
    createChat: (chat: any) => ipcRenderer.invoke('db-create-chat', chat),
    updateChat: (chatId: string, updates: any) => ipcRenderer.invoke('db-update-chat', chatId, updates),
    deleteChat: (chatId: string) => ipcRenderer.invoke('db-delete-chat', chatId),
    getMessages: (chatId: string) => ipcRenderer.invoke('db-get-messages', chatId),
    addMessage: (message: any) => ipcRenderer.invoke('db-add-message', message),
    updateMessage: (messageId: string, content: string) => ipcRenderer.invoke('db-update-message', messageId, content),
    getToolCalls: (messageId: string) => ipcRenderer.invoke('db-get-tool-calls', messageId),
    addToolCall: (toolCall: any) => ipcRenderer.invoke('db-add-tool-call', toolCall),
    getChatSettings: (chatId: string) => ipcRenderer.invoke('db-get-chat-settings', chatId),
    saveChatSettings: (settings: any) => ipcRenderer.invoke('db-save-chat-settings', settings),
    getTodos: (chatId: string) => ipcRenderer.invoke('db-get-todos', chatId),
    saveTodos: (chatId: string, todos: any[]) => ipcRenderer.invoke('db-save-todos', chatId, todos),
    getToolResults: () => ipcRenderer.invoke('db-get-tool-results'),
    saveToolResult: (id: string, name: string, result: string) => ipcRenderer.invoke('db-save-tool-result', id, name, result),
    clearOldToolResults: () => ipcRenderer.invoke('db-clear-old-tool-results'),
    getInstructionsUsed: (chatId: string) => ipcRenderer.invoke('db-get-instructions-used', chatId),
    addInstructionUsed: (chatId: string, instructionId: string) => ipcRenderer.invoke('db-add-instruction-used', chatId, instructionId),
    getAppSetting: (key: string) => ipcRenderer.invoke('db-get-app-setting', key),
    setAppSetting: (key: string, value: string) => ipcRenderer.invoke('db-set-app-setting', key, value),
    getStats: () => ipcRenderer.invoke('db-get-stats'),
    vacuum: () => ipcRenderer.invoke('db-vacuum'),
  },
  
  // Example: Send message to main process
  send: (channel: string, data: unknown) => {
    // Whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Example: Receive message from main process
  receive: (channel: string, func: (...args: unknown[]) => void) => {
    const validChannels = ['fromMain', 'main-process-message'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});

