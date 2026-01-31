import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const execAsync = promisify(exec);

export interface SalesforceOrg {
  alias?: string;
  username: string;
  orgId: string;
  instanceUrl: string;
  isDefaultUsername: boolean;
  isDefaultDevHubUsername: boolean;
}

export interface OrgDisplayResult {
  username: string;
  orgId: string;
  instanceUrl: string;
  alias?: string;
  accessToken?: string;
}

/**
 * Execute a Salesforce CLI command
 */
async function executeSfCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    const result = await execAsync(command, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    return result;
  } catch (error: any) {
    throw new Error(`SF CLI Error: ${error.message}\nStderr: ${error.stderr}`);
  }
}

/**
 * Login to Salesforce org using web-based authentication
 */
export async function loginToOrg(alias?: string): Promise<string> {
  const aliasFlag = alias ? `--alias ${alias}` : '';
  const command = `sf org login web ${aliasFlag} --json`;
  
  const { stdout } = await executeSfCommand(command);
  const result = JSON.parse(stdout);
  
  if (result.status === 0) {
    return `Successfully logged in to org${alias ? ` with alias '${alias}'` : ''}`;
  } else {
    throw new Error(result.message || 'Failed to login to org');
  }
}

/**
 * List all authenticated orgs
 */
export async function listOrgs(): Promise<SalesforceOrg[]> {
  const command = 'sf org list --json';
  
  try {
    const { stdout } = await executeSfCommand(command);
    const result = JSON.parse(stdout);
    
    if (result.status === 0 && result.result) {
      const nonScratchOrgs = result.result.nonScratchOrgs || [];
      const scratchOrgs = result.result.scratchOrgs || [];
      return [...nonScratchOrgs, ...scratchOrgs];
    }
    return [];
  } catch (error: any) {
    // If no orgs are authenticated, return empty array
    if (error.message.includes('No authenticated orgs')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get current default org information
 */
export async function getCurrentOrg(): Promise<OrgDisplayResult | null> {
  try {
    const command = 'sf org display --json';
    const { stdout } = await executeSfCommand(command);
    const result = JSON.parse(stdout);
    
    if (result.status === 0 && result.result) {
      return {
        username: result.result.username,
        orgId: result.result.id,
        instanceUrl: result.result.instanceUrl,
        alias: result.result.alias,
        accessToken: result.result.accessToken,
      };
    }
    return null;
  } catch (error: any) {
    // No default org set
    if (error.message.includes('No default org') || error.message.includes('No org configuration')) {
      return null;
    }
    throw error;
  }
}

/**
 * Set default org by username or alias
 */
export async function setDefaultOrg(usernameOrAlias: string): Promise<string> {
  const command = `sf config set target-org=${usernameOrAlias} --global`;
  
  await executeSfCommand(command);
  return `Successfully set '${usernameOrAlias}' as default org`;
}

/**
 * Logout from a specific org
 */
export async function logoutFromOrg(usernameOrAlias: string): Promise<string> {
  const command = `sf org logout --target-org ${usernameOrAlias} --no-prompt --json`;
  
  const { stdout } = await executeSfCommand(command);
  const result = JSON.parse(stdout);
  
  if (result.status === 0) {
    return `Successfully logged out from '${usernameOrAlias}'`;
  } else {
    throw new Error(result.message || 'Failed to logout from org');
  }
}

/**
 * Open org in browser
 */
export async function openOrg(usernameOrAlias?: string): Promise<string> {
  const targetFlag = usernameOrAlias ? `--target-org ${usernameOrAlias}` : '';
  const command = `sf org open ${targetFlag} --json`;
  
  const { stdout } = await executeSfCommand(command);
  const result = JSON.parse(stdout);
  
  if (result.status === 0) {
    return `Successfully opened org in browser`;
  } else {
    throw new Error(result.message || 'Failed to open org');
  }
}

/**
 * Check if Salesforce CLI is installed
 */
export async function checkSfCliInstalled(): Promise<boolean> {
  try {
    await execAsync('sf --version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if current directory is a Salesforce project
 */
export function checkIfSalesforceProject(directory: string): boolean {
  const sfdxProjectPath = join(directory, 'sfdx-project.json');
  return existsSync(sfdxProjectPath);
}

/**
 * Create a new Salesforce project
 */
export async function createProject(
  projectName: string,
  template: 'standard' | 'empty' | 'analytics' = 'standard',
  targetDir?: string
): Promise<string> {
  const outputFlag = targetDir ? `--output-dir "${targetDir}"` : '';
  const command = `sf project generate --name "${projectName}" --template ${template} ${outputFlag} --json`;
  
  const { stdout } = await executeSfCommand(command);
  const result = JSON.parse(stdout);
  
  if (result.status === 0) {
    return `Successfully created Salesforce project '${projectName}'`;
  } else {
    throw new Error(result.message || 'Failed to create project');
  }
}

/**
 * Deploy metadata to org (dry run / validation)
 */
export async function validateDeploy(
  sourcePath: string,
  targetOrg?: string,
  testLevel: 'NoTestRun' | 'RunSpecifiedTests' | 'RunLocalTests' | 'RunAllTestsInOrg' = 'NoTestRun',
  tests?: string[]
): Promise<{ success: boolean; message: string; details?: any }> {
  const targetFlag = targetOrg ? `--target-org ${targetOrg}` : '';
  const testLevelFlag = `--test-level ${testLevel}`;
  const testsFlag = tests && tests.length > 0 ? `--tests ${tests.join(',')}` : '';
  
  const command = `sf project deploy start --source-dir "${sourcePath}" ${targetFlag} ${testLevelFlag} ${testsFlag} --dry-run --json`;
  
  try {
    const { stdout } = await executeSfCommand(command);
    const result = JSON.parse(stdout);
    
    if (result.status === 0) {
      return {
        success: true,
        message: 'Validation successful! Metadata can be deployed.',
        details: result.result,
      };
    } else {
      return {
        success: false,
        message: result.message || 'Validation failed',
        details: result,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Validation error: ${error.message}`,
    };
  }
}

/**
 * Deploy metadata to org
 */
export async function deployMetadata(
  sourcePath: string,
  targetOrg?: string,
  testLevel: 'NoTestRun' | 'RunSpecifiedTests' | 'RunLocalTests' | 'RunAllTestsInOrg' = 'NoTestRun',
  tests?: string[],
  checkOnly: boolean = false
): Promise<{ success: boolean; message: string; deployId?: string; details?: any }> {
  const targetFlag = targetOrg ? `--target-org ${targetOrg}` : '';
  const testLevelFlag = `--test-level ${testLevel}`;
  const testsFlag = tests && tests.length > 0 ? `--tests ${tests.join(',')}` : '';
  const checkOnlyFlag = checkOnly ? '--dry-run' : '';
  
  const command = `sf project deploy start --source-dir "${sourcePath}" ${targetFlag} ${testLevelFlag} ${testsFlag} ${checkOnlyFlag} --json`;
  
  try {
    const { stdout } = await executeSfCommand(command);
    const result = JSON.parse(stdout);
    
    if (result.status === 0) {
      return {
        success: true,
        message: checkOnly ? 'Validation completed successfully!' : 'Deployment completed successfully!',
        deployId: result.result?.id,
        details: result.result,
      };
    } else {
      return {
        success: false,
        message: result.message || 'Deployment failed',
        details: result,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Deployment error: ${error.message}`,
    };
  }
}

/**
 * Deploy quick action (using recent validation)
 */
export async function quickDeploy(
  jobId: string,
  targetOrg?: string
): Promise<{ success: boolean; message: string; details?: any }> {
  const targetFlag = targetOrg ? `--target-org ${targetOrg}` : '';
  const command = `sf project deploy quick --job-id ${jobId} ${targetFlag} --json`;
  
  try {
    const { stdout } = await executeSfCommand(command);
    const result = JSON.parse(stdout);
    
    if (result.status === 0) {
      return {
        success: true,
        message: 'Quick deploy completed successfully!',
        details: result.result,
      };
    } else {
      return {
        success: false,
        message: result.message || 'Quick deploy failed',
        details: result,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Quick deploy error: ${error.message}`,
    };
  }
}

/**
 * Retrieve metadata from org
 */
export async function retrieveMetadata(
  sourcePath: string,
  targetOrg?: string
): Promise<{ success: boolean; message: string; details?: any }> {
  const targetFlag = targetOrg ? `--target-org ${targetOrg}` : '';
  const command = `sf project retrieve start --source-dir "${sourcePath}" ${targetFlag} --json`;
  
  try {
    const { stdout } = await executeSfCommand(command);
    const result = JSON.parse(stdout);
    
    if (result.status === 0) {
      return {
        success: true,
        message: 'Metadata retrieved successfully!',
        details: result.result,
      };
    } else {
      return {
        success: false,
        message: result.message || 'Retrieve failed',
        details: result,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Retrieve error: ${error.message}`,
    };
  }
}
