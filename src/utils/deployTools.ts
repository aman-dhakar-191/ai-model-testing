import type { ToolDefinition } from '../types';

/**
 * Salesforce Deploy and Retrieve Tools
 * These tools allow metadata deployment, validation, and retrieval operations
 */

export const DEPLOY_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'sf_validate_deploy',
      description: 'Validate metadata deployment without actually deploying (dry run). Use this to check if deployment will succeed before actual deployment.',
      parameters: {
        type: 'object',
        properties: {
          source_path: {
            type: 'string',
            description: 'Path to the source directory containing metadata to validate (e.g., "force-app/main/default")',
          },
          target_org: {
            type: 'string',
            description: 'Username or alias of target org. If omitted, uses default org.',
          },
          test_level: {
            type: 'string',
            enum: ['NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'],
            description: 'Test level for validation. Default: NoTestRun',
          },
          tests: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of test class names to run (only if test_level is RunSpecifiedTests)',
          },
        },
        required: ['source_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sf_deploy_metadata',
      description: 'Deploy metadata to Salesforce org. Can optionally run as validation-only (check-only mode).',
      parameters: {
        type: 'object',
        properties: {
          source_path: {
            type: 'string',
            description: 'Path to the source directory containing metadata to deploy (e.g., "force-app/main/default")',
          },
          target_org: {
            type: 'string',
            description: 'Username or alias of target org. If omitted, uses default org.',
          },
          test_level: {
            type: 'string',
            enum: ['NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'],
            description: 'Test level for deployment. Default: NoTestRun. Use RunLocalTests for production deployments.',
          },
          tests: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of test class names to run (only if test_level is RunSpecifiedTests)',
          },
          check_only: {
            type: 'boolean',
            description: 'If true, performs validation-only deployment (dry run). Default: false',
          },
        },
        required: ['source_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sf_quick_deploy',
      description: 'Quick deploy using a recent validation (job ID from a successful validation within the last 10 days). This skips running tests again.',
      parameters: {
        type: 'object',
        properties: {
          job_id: {
            type: 'string',
            description: 'Job ID from a recent successful validation',
          },
          target_org: {
            type: 'string',
            description: 'Username or alias of target org. If omitted, uses default org.',
          },
        },
        required: ['job_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sf_retrieve_metadata',
      description: 'Retrieve metadata from Salesforce org to local project.',
      parameters: {
        type: 'object',
        properties: {
          source_path: {
            type: 'string',
            description: 'Path to the source directory where metadata will be retrieved (e.g., "force-app/main/default")',
          },
          target_org: {
            type: 'string',
            description: 'Username or alias of target org. If omitted, uses default org.',
          },
        },
        required: ['source_path'],
      },
    },
  },
];

/**
 * Execute a deploy/retrieve tool
 */
export async function executeDeployTool(toolName: string, argsJson: string): Promise<string> {
  const args = JSON.parse(argsJson);

  switch (toolName) {
    case 'sf_validate_deploy':
      return await window.electron.sfCli.validateDeploy(
        args.source_path,
        args.target_org,
        args.test_level || 'NoTestRun',
        args.tests
      );

    case 'sf_deploy_metadata':
      return await window.electron.sfCli.deployMetadata(
        args.source_path,
        args.target_org,
        args.test_level || 'NoTestRun',
        args.tests,
        args.check_only || false
      );

    case 'sf_quick_deploy':
      return await window.electron.sfCli.quickDeploy(
        args.job_id,
        args.target_org
      );

    case 'sf_retrieve_metadata':
      return await window.electron.sfCli.retrieveMetadata(
        args.source_path,
        args.target_org
      );

    default:
      return JSON.stringify({
        status: 'error',
        message: `Unknown deploy tool: ${toolName}`,
      });
  }
}

/**
 * Check if a tool is a deploy tool
 */
export function isDeployTool(toolName: string): boolean {
  return [
    'sf_validate_deploy',
    'sf_deploy_metadata',
    'sf_quick_deploy',
    'sf_retrieve_metadata',
  ].includes(toolName);
}
