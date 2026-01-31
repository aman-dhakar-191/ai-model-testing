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
  send: (channel: string, data: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
