import type { ToolDefinition } from '../types';

/**
 * Salesforce tool definitions (renderer-safe, no Node.js imports)
 */

export const SALESFORCE_TOOLS: ToolDefinition[] = [
  {
    id: 'sf-create-apex-class',
    name: 'create_apex_class',
    description: 'Creates a Salesforce Apex class file. Supports class, trigger, batch, schedulable, queueable, interface, and test types. Naming convention (not enforced): PascalCase. Test classes should be suffixed with \'Test\'.',
    parameters: {
      apex_class_name: {
        type: 'string',
        description: 'PascalCase class name (e.g. AccountService, ContactTriggerHandler)',
      },
      type: {
        type: 'string',
        description: 'Type of Apex component',
        enum: ['class', 'trigger', 'batch', 'schedulable', 'queueable', 'test', 'interface'],
      },
      body: {
        type: 'string',
        description: 'Full Apex class or trigger body including declaration',
      },
      is_create_test: {
        type: 'boolean',
        description: 'Whether to also generate a test class for this component',
      },
      test_body: {
        type: 'string',
        description: 'Full Apex test class body (required if is_create_test = true)',
      },
      trigger_object: {
        type: 'string',
        description: 'Salesforce object name for trigger (e.g. Account). Required if type = trigger.',
      },
      dry_run: {
        type: 'boolean',
        description: 'If true, do not write files, only return what would be created',
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing files if they already exist',
      },
    },
    required: ['apex_class_name', 'type', 'body'],
  },
  {
    id: 'sf-create-lwc',
    name: 'create_lwc_component',
    description: 'Creates a Lightning Web Component bundle (HTML, JS, CSS, meta.xml, and optional Apex controller). Naming convention (not enforced): folder kebab-case, JS camelCase.',
    parameters: {
      name: {
        type: 'string',
        description: 'Component name (folder should be kebab-case, JS class camelCase; e.g. accountCard)',
      },
      html: {
        type: 'string',
        description: 'HTML template content',
      },
      javascript: {
        type: 'string',
        description: 'JavaScript controller content',
      },
      css: {
        type: 'string',
        description: 'CSS styles (optional)',
      },
      meta_xml: {
        type: 'string',
        description: 'js-meta.xml configuration',
      },
      is_create_apex_controller: {
        type: 'boolean',
        description: 'Whether to create a backing Apex controller',
      },
      apex_controller_name: {
        type: 'string',
        description: 'Name of Apex controller class (required if is_create_apex_controller = true)',
      },
      apex_controller_body: {
        type: 'string',
        description: 'Full Apex controller class body (required if is_create_apex_controller = true)',
      },
      dry_run: {
        type: 'boolean',
        description: 'If true, do not write files, only return what would be created',
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing files if they already exist',
      },
    },
    required: ['name', 'html', 'javascript', 'meta_xml'],
  },
  {
    id: 'sf-create-aura',
    name: 'create_aura_component',
    description: 'Creates an Aura component bundle (cmp, controller, helper, and optional design/renderer). Naming convention (not enforced): PascalCase.',
    parameters: {
      name: {
        type: 'string',
        description: 'PascalCase component name (e.g. AccountManager)',
      },
      component: {
        type: 'string',
        description: 'Component markup (.cmp content)',
      },
      controller: {
        type: 'string',
        description: 'Client-side controller JS',
      },
      helper: {
        type: 'string',
        description: 'Helper JS',
      },
      design: {
        type: 'string',
        description: 'Design resource for App Builder (optional)',
      },
      renderer: {
        type: 'string',
        description: 'Custom renderer JS (optional)',
      },
      dry_run: {
        type: 'boolean',
        description: 'If true, do not write files, only return what would be created',
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing files if they already exist',
      },
    },
    required: ['name', 'component', 'controller', 'helper'],
  },
  {
    id: 'sf-create-vf-page',
    name: 'create_visualforce_page',
    description: 'Creates a Visualforce page with an optional Apex controller. Naming convention (not enforced): PascalCase.',
    parameters: {
      page_name: {
        type: 'string',
        description: 'Visualforce page name (e.g. AccountOverview)',
      },
      markup: {
        type: 'string',
        description: 'Full Visualforce page markup',
      },
      controller_name: {
        type: 'string',
        description: 'Name of the custom Apex controller (optional)',
      },
      controller_body: {
        type: 'string',
        description: 'Apex controller class body (optional)',
      },
      extensions: {
        type: 'array',
        description: 'Apex extensions used by the page (optional)',
      },
      dry_run: {
        type: 'boolean',
        description: 'If true, do not write files, only return what would be created',
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing files if they already exist',
      },
    },
    required: ['page_name', 'markup'],
  },
  {
    id: 'sf-write-file',
    name: 'write_file',
    description: 'Writes content to a file at the given path. Use for metadata, configs, package.xml, docs, or any non-component file.',
    parameters: {
      path: {
        type: 'string',
        description: 'File path relative to project root',
      },
      content: {
        type: 'string',
        description: 'Full file content to write',
      },
      dry_run: {
        type: 'boolean',
        description: 'If true, do not write files, only return what would be created',
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing files if they already exist',
      },
    },
    required: ['path', 'content'],
  },
  {
    id: 'sf-edit-file',
    name: 'edit_file',
    description: 'Edits an existing file. Must be used after read_file unless intentionally replacing the full file.',
    parameters: {
      path: {
        type: 'string',
        description: 'File path relative to project root',
      },
      mode: {
        type: 'string',
        description: 'Edit mode: replace overwrites entire file, patch applies targeted changes',
        enum: ['replace', 'patch'],
      },
      content: {
        type: 'string',
        description: 'Full new file content (required if mode = replace)',
      },
      patch_instructions: {
        type: 'string',
        description: 'Human-readable patch instructions (required if mode = patch)',
      },
      dry_run: {
        type: 'boolean',
        description: 'If true, do not write changes, only return the diff',
      },
    },
    required: ['path', 'mode'],
  },
  {
    id: 'sf-read-file',
    name: 'read_file',
    description: 'Reads the contents of an existing file. Use before modifying to understand current state.',
    parameters: {
      path: {
        type: 'string',
        description: 'File path to read',
      },
    },
    required: ['path'],
  },
  {
    id: 'sf-list-files',
    name: 'list_files',
    description: 'Lists all files in a given directory. Use to understand project structure before making changes.',
    parameters: {
      directory: {
        type: 'string',
        description: 'Directory path to list',
      },
    },
    required: ['directory'],
  },
  {
    id: 'sf-update-todo',
    name: 'update_todo_list',
    description: 'Updates the todo list for the current chat. Use this to track tasks, progress, and next steps.',
    parameters: {
      todos: {
        type: 'array',
        description: 'Array of todo items with id, title, and status',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the todo item',
            },
            title: {
              type: 'string',
              description: 'Title/description of the todo item',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in-progress', 'completed'],
              description: 'Current status of the todo item',
            },
          },
          required: ['id', 'title', 'status'],
        },
      },
    },
    required: ['todos'],
  },
  {
    id: 'sf-execute-command',
    name: 'execute_command',
    description: 'Execute a shell command in the project directory. Use for running scripts, npm commands, git operations, etc. Returns stdout and stderr.',
    parameters: {
      command: {
        type: 'string',
        description: 'The shell command to execute (e.g., "npm install", "git status")',
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the command (optional, defaults to project root)',
      },
    },
    required: ['command'],
  },
  {
    id: 'sf-web-fetch',
    name: 'web_fetch',
    description: 'Fetch content from a web URL. Useful for reading documentation, APIs, or external resources.',
    parameters: {
      url: {
        type: 'string',
        description: 'The URL to fetch (must be http or https)',
      },
      method: {
        type: 'string',
        description: 'HTTP method to use',
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      headers: {
        type: 'object',
        description: 'Optional HTTP headers as key-value pairs',
      },
      body: {
        type: 'string',
        description: 'Request body (for POST/PUT)',
      },
    },
    required: ['url'],
  },
];

/**
 * Check if a tool name is a Salesforce tool
 */
export function isSalesforceTool(toolName: string): boolean {
  return SALESFORCE_TOOLS.some((tool) => tool.name === toolName);
}

/**
 * Execute Salesforce tool via IPC to main process
 */
export async function executeSalesforceTool(toolName: string, argsJson: string): Promise<string> {
  try {
    // Check if electron API is available
    if (typeof window !== 'undefined' && (window as any).electron?.salesforce?.executeTool) {
      // Call main process via IPC for actual file operations
      return await (window as any).electron.salesforce.executeTool(toolName, argsJson);
    }
    
    // Fallback for non-Electron environments or if IPC not available
    return JSON.stringify({
      status: 'error',
      message: 'Electron IPC not available. This feature requires running in Electron.',
    });
  } catch (error) {
    return JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to execute Salesforce tool',
    });
  }
}
