export interface OrgDisplayResult {
  username: string;
  orgId: string;
  instanceUrl: string;
  alias?: string;
  accessToken?: string;
}

export interface SalesforceOrg {
  alias?: string;
  username: string;
  orgId: string;
  instanceUrl: string;
  isDefaultUsername: boolean;
  isDefaultDevHubUsername: boolean;
}

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
  extension?: string;
}

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

export interface UpdateStatus {
  event: 'checking-for-update' | 'update-available' | 'update-not-available' | 'update-error' | 'download-progress' | 'update-downloaded';
  data?: any;
}

export interface ElectronAPI {
  salesforce: {
    executeTool: (toolName: string, argsJson: string) => Promise<string>;
    getWorkingDirectory: () => Promise<string>;
    getFileTree: (dirPath?: string) => Promise<string>;
    selectFolder: () => Promise<string | null>;
  };
  sfCli: {
    checkInstalled: () => Promise<boolean>;
    loginToOrg: (alias?: string) => Promise<string>;
    listOrgs: () => Promise<SalesforceOrg[]>;
    getCurrentOrg: () => Promise<OrgDisplayResult | null>;
    setDefaultOrg: (usernameOrAlias: string) => Promise<string>;
    logoutFromOrg: (usernameOrAlias: string) => Promise<string>;
    openOrg: (usernameOrAlias?: string) => Promise<string>;
    checkIfSalesforceProject: (directory: string) => Promise<boolean>;
    createProject: (projectName: string, template: 'standard' | 'empty' | 'analytics', targetDir?: string) => Promise<string>;
    validateDeploy: (sourcePath: string, targetOrg?: string, testLevel?: string, tests?: string[]) => Promise<string>;
    deployMetadata: (sourcePath: string, targetOrg?: string, testLevel?: string, tests?: string[], checkOnly?: boolean) => Promise<string>;
    quickDeploy: (jobId: string, targetOrg?: string) => Promise<string>;
    retrieveMetadata: (sourcePath: string, targetOrg?: string) => Promise<string>;
  };
  ollama: {
    listModels: () => Promise<string[]>;
  };
  db: {
    getChats: () => Promise<any[]>;
    getChat: (chatId: string) => Promise<any | null>;
    createChat: (chat: any) => Promise<void>;
    updateChat: (chatId: string, updates: any) => Promise<void>;
    deleteChat: (chatId: string) => Promise<void>;
    getMessages: (chatId: string) => Promise<any[]>;
    addMessage: (message: any) => Promise<void>;
    updateMessage: (messageId: string, content: string) => Promise<void>;
    getToolCalls: (messageId: string) => Promise<any[]>;
    addToolCall: (toolCall: any) => Promise<void>;
    getChatSettings: (chatId: string) => Promise<any | null>;
    saveChatSettings: (settings: any) => Promise<void>;
    getTodos: (chatId: string) => Promise<any[]>;
    saveTodos: (chatId: string, todos: any[]) => Promise<void>;
    getToolResults: () => Promise<any[]>;
    saveToolResult: (id: string, name: string, result: string) => Promise<void>;
    clearOldToolResults: () => Promise<void>;
    getInstructionsUsed: (chatId: string) => Promise<any[]>;
    addInstructionUsed: (chatId: string, instructionId: string) => Promise<void>;
    getAppSetting: (key: string) => Promise<string | null>;
    setAppSetting: (key: string, value: string) => Promise<void>;
    getStats: () => Promise<any>;
    vacuum: () => Promise<void>;
  };
  updater: {
    checkForUpdates: () => Promise<boolean>;
    downloadUpdate: () => Promise<void>;
    installUpdate: () => Promise<void>;
    getCurrentVersion: () => Promise<string>;
    getLatestRelease: () => Promise<UpdateInfo | null>;
    onUpdateStatus: (callback: (status: UpdateStatus) => void) => void;
  };
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
