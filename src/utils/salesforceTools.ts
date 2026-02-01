import type { ToolDefinition } from '../types';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import https from 'node:https';
import http from 'node:http';
import {
  writeFile,
  readFile,
  listDirectory,
  resolveProjectPath,
  generateApexMetaXml,
  generateLWCMetaXml,
  generateVFPageMetaXml,
  fileExists,
} from './fileOperations';

const execAsync = promisify(exec);

/**
 * Salesforce Development Tools
 * Provides tools for creating Apex classes, LWC/Aura components, VF pages, and file operations
 */

export const SALESFORCE_TOOLS: ToolDefinition[] = [
  {
    id: 'sf-create-apex-class',
    name: 'create_apex_class',
    description: 'Creates a Salesforce Apex class file. Supports class, trigger, batch, schedulable, queueable, interface, and test types. Naming convention (not enforced): PascalCase. Test classes should be suffixed with \'Test\'.',
    instructionFile: 'create-apex-class.md',
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
    instructionFile: 'create-lwc-component.md',
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
      is_exposed: {
        type: 'boolean',
        description: 'Whether the component should be exposed (isExposed=true in meta.xml). Set to true for components that need to be added to Lightning pages.',
      },
      css: {
        type: 'string',
        description: 'CSS styles (optional)',
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
    required: ['name', 'html', 'javascript'],
  },
  {
    id: 'sf-create-aura',
    name: 'create_aura_component',
    description: 'Creates an Aura component bundle (cmp, controller, helper, and optional design/renderer). Naming convention (not enforced): PascalCase.',
    instructionFile: 'create-aura-component.md',
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
    instructionFile: 'create-visualforce-page.md',
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
    instructionFile: 'file-operations.md',
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
    instructionFile: 'file-operations.md',
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
    instructionFile: 'file-operations.md',
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
    instructionFile: 'file-operations.md',
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
    instructionFile: 'update-todo-list.md',
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
    description: 'Execute shell commands in the project directory. Useful for running npm scripts, git operations, Salesforce CLI commands, and other terminal operations.',
    instructionFile: 'execute-command.md',
    parameters: {
      command: {
        type: 'string',
        description: 'The shell command to execute (e.g., npm install, git status, sfdx force:org:list)',
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the command (defaults to project root if not specified)',
      },
    },
    required: ['command'],
  },
  {
    id: 'sf-web-fetch',
    name: 'web_fetch',
    description: 'Fetch content from web URLs. Useful for reading external documentation, calling APIs, or retrieving data from external resources.',
    instructionFile: 'web-fetch.md',
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
        description: 'HTTP headers as key-value pairs',
      },
      body: {
        type: 'string',
        description: 'Request body for POST/PUT requests',
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
 * Execute Salesforce development tool
 */
export async function executeSalesforceTool(toolName: string, argsJson: string): Promise<string> {
  try {
    const args = JSON.parse(argsJson);
    const isDryRun = args.dry_run === true;
    const overwrite = args.overwrite === true;

    switch (toolName) {
      case 'create_apex_class':
        return await createApexClass(args, isDryRun, overwrite);

      case 'create_lwc_component':
        return await createLWCComponent(args, isDryRun, overwrite);

      case 'create_aura_component':
        return await createAuraComponent(args, isDryRun, overwrite);

      case 'create_visualforce_page':
        return await createVisualforcePage(args, isDryRun, overwrite);

      case 'write_file':
        return await writeFileHandler(args, isDryRun, overwrite);

      case 'edit_file':
        return await editFileHandler(args, isDryRun);

      case 'read_file':
        return await readFileHandler(args);

      case 'list_files':
        return await listFilesHandler(args);

      case 'update_todo_list':
        return updateTodoListHandler(args);

      case 'execute_command':
        return await executeCommandHandler(args);

      case 'web_fetch':
        return await webFetchHandler(args);

      default:
        return JSON.stringify({
          status: 'error',
          message: `Unknown Salesforce tool: ${toolName}`,
        });
    }
  } catch (error) {
    return JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to execute Salesforce tool',
    });
  }
}

// Implementation functions for each tool

async function createApexClass(args: any, isDryRun: boolean, overwrite: boolean): Promise<string> {
  const filesCreated: string[] = [];
  const errors: string[] = [];

  const classPath = resolveProjectPath(`force-app/main/default/classes/${args.apex_class_name}.cls`);
  const metaPath = resolveProjectPath(`force-app/main/default/classes/${args.apex_class_name}.cls-meta.xml`);

  if (!isDryRun) {
    // Write main class file
    const classResult = writeFile(classPath, args.body, overwrite);
    if (classResult.success) {
      filesCreated.push(classPath);
    } else {
      errors.push(classResult.message);
    }

    // Write meta.xml
    const metaResult = writeFile(metaPath, generateApexMetaXml(), overwrite);
    if (metaResult.success) {
      filesCreated.push(metaPath);
    } else {
      errors.push(metaResult.message);
    }

    // Create test class if requested
    if (args.is_create_test && args.test_body) {
      const testPath = resolveProjectPath(`force-app/main/default/classes/${args.apex_class_name}Test.cls`);
      const testMetaPath = resolveProjectPath(
        `force-app/main/default/classes/${args.apex_class_name}Test.cls-meta.xml`
      );

      const testResult = writeFile(testPath, args.test_body, overwrite);
      if (testResult.success) {
        filesCreated.push(testPath);
      } else {
        errors.push(testResult.message);
      }

      const testMetaResult = writeFile(testMetaPath, generateApexMetaXml(), overwrite);
      if (testMetaResult.success) {
        filesCreated.push(testMetaPath);
      } else {
        errors.push(testMetaResult.message);
      }
    }
  }

  return JSON.stringify({
    status: errors.length === 0 ? 'success' : 'partial',
    message:
      isDryRun
        ? 'DRY RUN - Would create Apex class'
        : errors.length === 0
          ? 'Apex class created successfully'
          : 'Apex class created with some errors',
    files_created: isDryRun
      ? [
          `force-app/main/default/classes/${args.apex_class_name}.cls`,
          `force-app/main/default/classes/${args.apex_class_name}.cls-meta.xml`,
          ...(args.is_create_test
            ? [
                `force-app/main/default/classes/${args.apex_class_name}Test.cls`,
                `force-app/main/default/classes/${args.apex_class_name}Test.cls-meta.xml`,
              ]
            : []),
        ]
      : filesCreated,
    errors: errors.length > 0 ? errors : undefined,
    dry_run: isDryRun,
  });
}

async function createLWCComponent(args: any, isDryRun: boolean, overwrite: boolean): Promise<string> {
  const filesCreated: string[] = [];
  const errors: string[] = [];

  const lwcDir = resolveProjectPath(`force-app/main/default/lwc/${args.name}`);

  if (!isDryRun) {
    // Create LWC files
    const htmlPath = path.join(lwcDir, `${args.name}.html`);
    const jsPath = path.join(lwcDir, `${args.name}.js`);
    const metaPath = path.join(lwcDir, `${args.name}.js-meta.xml`);

    const htmlResult = writeFile(htmlPath, args.html, overwrite);
    if (htmlResult.success) filesCreated.push(htmlPath);
    else errors.push(htmlResult.message);

    const jsResult = writeFile(jsPath, args.javascript, overwrite);
    if (jsResult.success) filesCreated.push(jsPath);
    else errors.push(jsResult.message);

    // Generate meta.xml using template
    const metaXml = generateLWCMetaXml(args.name, args.is_exposed || false);
    const metaResult = writeFile(metaPath, metaXml, overwrite);
    if (metaResult.success) filesCreated.push(metaPath);
    else errors.push(metaResult.message);

    // Create CSS if provided
    if (args.css) {
      const cssPath = path.join(lwcDir, `${args.name}.css`);
      const cssResult = writeFile(cssPath, args.css, overwrite);
      if (cssResult.success) filesCreated.push(cssPath);
      else errors.push(cssResult.message);
    }

    // Create Apex controller if requested
    if (args.is_create_apex_controller && args.apex_controller_name && args.apex_controller_body) {
      const apexPath = resolveProjectPath(`force-app/main/default/classes/${args.apex_controller_name}.cls`);
      const apexMetaPath = resolveProjectPath(
        `force-app/main/default/classes/${args.apex_controller_name}.cls-meta.xml`
      );

      const apexResult = writeFile(apexPath, args.apex_controller_body, overwrite);
      if (apexResult.success) filesCreated.push(apexPath);
      else errors.push(apexResult.message);

      const apexMetaResult = writeFile(apexMetaPath, generateApexMetaXml(), overwrite);
      if (apexMetaResult.success) filesCreated.push(apexMetaPath);
      else errors.push(apexMetaResult.message);
    }
  }

  return JSON.stringify({
    status: errors.length === 0 ? 'success' : 'partial',
    message:
      isDryRun
        ? 'DRY RUN - Would create LWC component'
        : errors.length === 0
          ? 'LWC component created successfully'
          : 'LWC component created with some errors',
    files_created: isDryRun
      ? [
          `force-app/main/default/lwc/${args.name}/${args.name}.html`,
          `force-app/main/default/lwc/${args.name}/${args.name}.js`,
          `force-app/main/default/lwc/${args.name}/${args.name}.js-meta.xml`,
          ...(args.css ? [`force-app/main/default/lwc/${args.name}/${args.name}.css`] : []),
          ...(args.is_create_apex_controller
            ? [
                `force-app/main/default/classes/${args.apex_controller_name}.cls`,
                `force-app/main/default/classes/${args.apex_controller_name}.cls-meta.xml`,
              ]
            : []),
        ]
      : filesCreated,
    errors: errors.length > 0 ? errors : undefined,
    dry_run: isDryRun,
  });
}

async function createAuraComponent(args: any, isDryRun: boolean, overwrite: boolean): Promise<string> {
  const filesCreated: string[] = [];
  const errors: string[] = [];

  const auraDir = resolveProjectPath(`force-app/main/default/aura/${args.name}`);

  if (!isDryRun) {
    const cmpPath = path.join(auraDir, `${args.name}.cmp`);
    const controllerPath = path.join(auraDir, `${args.name}Controller.js`);
    const helperPath = path.join(auraDir, `${args.name}Helper.js`);

    const cmpResult = writeFile(cmpPath, args.component, overwrite);
    if (cmpResult.success) filesCreated.push(cmpPath);
    else errors.push(cmpResult.message);

    const controllerResult = writeFile(controllerPath, args.controller, overwrite);
    if (controllerResult.success) filesCreated.push(controllerPath);
    else errors.push(controllerResult.message);

    const helperResult = writeFile(helperPath, args.helper, overwrite);
    if (helperResult.success) filesCreated.push(helperPath);
    else errors.push(helperResult.message);

    if (args.design) {
      const designPath = path.join(auraDir, `${args.name}.design`);
      const designResult = writeFile(designPath, args.design, overwrite);
      if (designResult.success) filesCreated.push(designPath);
      else errors.push(designResult.message);
    }

    if (args.renderer) {
      const rendererPath = path.join(auraDir, `${args.name}Renderer.js`);
      const rendererResult = writeFile(rendererPath, args.renderer, overwrite);
      if (rendererResult.success) filesCreated.push(rendererPath);
      else errors.push(rendererResult.message);
    }
  }

  return JSON.stringify({
    status: errors.length === 0 ? 'success' : 'partial',
    message:
      isDryRun
        ? 'DRY RUN - Would create Aura component'
        : errors.length === 0
          ? 'Aura component created successfully'
          : 'Aura component created with some errors',
    files_created: isDryRun
      ? [
          `force-app/main/default/aura/${args.name}/${args.name}.cmp`,
          `force-app/main/default/aura/${args.name}/${args.name}Controller.js`,
          `force-app/main/default/aura/${args.name}/${args.name}Helper.js`,
          ...(args.design ? [`force-app/main/default/aura/${args.name}/${args.name}.design`] : []),
          ...(args.renderer ? [`force-app/main/default/aura/${args.name}/${args.name}Renderer.js`] : []),
        ]
      : filesCreated,
    errors: errors.length > 0 ? errors : undefined,
    dry_run: isDryRun,
  });
}

async function createVisualforcePage(args: any, isDryRun: boolean, overwrite: boolean): Promise<string> {
  const filesCreated: string[] = [];
  const errors: string[] = [];

  const pagePath = resolveProjectPath(`force-app/main/default/pages/${args.page_name}.page`);
  const metaPath = resolveProjectPath(`force-app/main/default/pages/${args.page_name}.page-meta.xml`);

  if (!isDryRun) {
    const pageResult = writeFile(pagePath, args.markup, overwrite);
    if (pageResult.success) filesCreated.push(pagePath);
    else errors.push(pageResult.message);

    const metaResult = writeFile(metaPath, generateVFPageMetaXml(args.page_name), overwrite);
    if (metaResult.success) filesCreated.push(metaPath);
    else errors.push(metaResult.message);

    if (args.controller_name && args.controller_body) {
      const controllerPath = resolveProjectPath(`force-app/main/default/classes/${args.controller_name}.cls`);
      const controllerMetaPath = resolveProjectPath(
        `force-app/main/default/classes/${args.controller_name}.cls-meta.xml`
      );

      const controllerResult = writeFile(controllerPath, args.controller_body, overwrite);
      if (controllerResult.success) filesCreated.push(controllerPath);
      else errors.push(controllerResult.message);

      const controllerMetaResult = writeFile(controllerMetaPath, generateApexMetaXml(), overwrite);
      if (controllerMetaResult.success) filesCreated.push(controllerMetaPath);
      else errors.push(controllerMetaResult.message);
    }
  }

  return JSON.stringify({
    status: errors.length === 0 ? 'success' : 'partial',
    message:
      isDryRun
        ? 'DRY RUN - Would create Visualforce page'
        : errors.length === 0
          ? 'Visualforce page created successfully'
          : 'Visualforce page created with some errors',
    files_created: isDryRun
      ? [
          `force-app/main/default/pages/${args.page_name}.page`,
          `force-app/main/default/pages/${args.page_name}.page-meta.xml`,
          ...(args.controller_name
            ? [
                `force-app/main/default/classes/${args.controller_name}.cls`,
                `force-app/main/default/classes/${args.controller_name}.cls-meta.xml`,
              ]
            : []),
        ]
      : filesCreated,
    errors: errors.length > 0 ? errors : undefined,
    dry_run: isDryRun,
  });
}

async function writeFileHandler(args: any, isDryRun: boolean, overwrite: boolean): Promise<string> {
  const pathArg = args.path || args.file_path;
  
  if (!pathArg) {
    return JSON.stringify({
      status: 'error',
      message: 'Missing required parameter: path',
    });
  }
  
  if (!args.content) {
    return JSON.stringify({
      status: 'error',
      message: 'Missing required parameter: content',
    });
  }

  if (isDryRun) {
    return JSON.stringify({
      status: 'success',
      message: `DRY RUN - Would write file: ${pathArg}`,
      file: pathArg,
      files_created: [pathArg],
      dry_run: true,
    });
  }

  const filePath = resolveProjectPath(pathArg);
  const result = writeFile(filePath, args.content, overwrite);

  return JSON.stringify({
    status: result.success ? 'success' : 'error',
    message: result.success ? `File written successfully: ${pathArg}` : result.message,
    file: pathArg,
    files_created: result.success ? [filePath] : [],
    dry_run: false,
  });
}

async function editFileHandler(args: any, isDryRun: boolean): Promise<string> {
  // Handle both 'path' and 'file_path' parameter names for compatibility
  const pathArg = args.path || args.file_path;
  
  if (!pathArg) {
    return JSON.stringify({
      status: 'error',
      message: 'Missing required parameter: path',
    });
  }
  
  const filePath = resolveProjectPath(pathArg);

  if (!fileExists(filePath)) {
    return JSON.stringify({
      status: 'error',
      message: `File not found: ${pathArg}`,
      file: pathArg,
    });
  }

  if (args.mode === 'replace') {
    if (!args.content) {
      return JSON.stringify({
        status: 'error',
        message: 'Content is required for replace mode',
        file: pathArg,
      });
    }

    if (isDryRun) {
      return JSON.stringify({
        status: 'success',
        message: `DRY RUN - Would edit file: ${pathArg}`,
        file: pathArg,
        mode: args.mode,
        dry_run: true,
      });
    }

    const result = writeFile(filePath, args.content, true);
    return JSON.stringify({
      status: result.success ? 'success' : 'error',
      message: result.success ? `File edited successfully: ${pathArg}` : result.message,
      file: pathArg,
      mode: args.mode,
      files_modified: result.success ? [filePath] : [],
      dry_run: false,
    });
  } else if (args.mode === 'patch') {
    return JSON.stringify({
      status: 'info',
      message: 'Patch mode requires manual implementation based on patch_instructions',
      file: pathArg,
      patch_instructions: args.patch_instructions,
      note: 'Please read the file first and provide the full new content in replace mode',
    });
  }

  return JSON.stringify({
    status: 'error',
    message: 'Invalid mode. Use "replace" or "patch"',
    file: pathArg,
  });
}

async function readFileHandler(args: any): Promise<string> {
  const pathArg = args.path || args.file_path;
  
  if (!pathArg) {
    return JSON.stringify({
      status: 'error',
      message: 'Missing required parameter: path',
    });
  }
  
  const filePath = resolveProjectPath(pathArg);
  const result = readFile(filePath);

  if (result.error) {
    return JSON.stringify({
      status: 'error',
      message: result.error,
      file: pathArg,
    });
  }

  return JSON.stringify({
    status: 'success',
    message: `File read successfully: ${args.path}`,
    file: args.path,
    content: result.content,
    size: result.content?.length || 0,
  });
}

async function listFilesHandler(args: any): Promise<string> {
  const dirPath = resolveProjectPath(args.directory);
  const result = listDirectory(dirPath);

  if (result.error) {
    // Provide helpful suggestions for common Salesforce paths
    let suggestion = '';
    const dir = args.directory.toLowerCase();
    if (dir === 'classes' || dir.endsWith('/classes') || dir.endsWith('\\classes')) {
      suggestion = ' Did you mean "force-app/main/default/classes"?';
    } else if (dir === 'lwc' || dir.endsWith('/lwc') || dir.endsWith('\\lwc')) {
      suggestion = ' Did you mean "force-app/main/default/lwc"?';
    } else if (dir === 'triggers' || dir.endsWith('/triggers') || dir.endsWith('\\triggers')) {
      suggestion = ' Did you mean "force-app/main/default/triggers"?';
    }
    
    return JSON.stringify({
      status: 'error',
      message: result.error + suggestion,
      directory: args.directory,
    });
  }

  return JSON.stringify({
    status: 'success',
    message: `Listed ${result.files?.length || 0} items in: ${args.directory}`,
    directory: args.directory,
    files: result.files,
    count: result.files?.length || 0,
  });
}

function updateTodoListHandler(args: any): string {
  if (!args.todos || !Array.isArray(args.todos)) {
    return JSON.stringify({
      status: 'error',
      message: 'Missing or invalid todos array',
    });
  }

  // Validate todo items
  const validStatuses = ['pending', 'in-progress', 'completed'];
  for (const todo of args.todos) {
    if (!todo.id || !todo.title || !todo.status) {
      return JSON.stringify({
        status: 'error',
        message: 'Each todo must have id, title, and status',
      });
    }
    if (!validStatuses.includes(todo.status)) {
      return JSON.stringify({
        status: 'error',
        message: `Invalid status: ${todo.status}. Must be one of: ${validStatuses.join(', ')}`,
      });
    }
  }

  // The actual update will be handled by the App component
  // This just validates and returns the data
  return JSON.stringify({
    status: 'success',
    message: `Updated ${args.todos.length} todo items`,
    todos: args.todos.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      createdAt: t.createdAt || Date.now(),
    })),
  });
}

async function executeCommandHandler(args: any): Promise<string> {
  if (!args.command) {
    return JSON.stringify({
      status: 'error',
      message: 'Missing command parameter',
    });
  }

  try {
    const cwd = args.cwd ? resolveProjectPath(args.cwd) : resolveProjectPath('');
    const { stdout, stderr } = await execAsync(args.command, { cwd, timeout: 60000 });

    return JSON.stringify({
      status: 'success',
      message: 'Command executed successfully',
      command: args.command,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exit_code: 0,
    });
  } catch (error: any) {
    return JSON.stringify({
      status: 'error',
      message: error.message || 'Command execution failed',
      command: args.command,
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || '',
      exit_code: error.code || 1,
    });
  }
}

async function webFetchHandler(args: any): Promise<string> {
  if (!args.url) {
    return JSON.stringify({
      status: 'error',
      message: 'Missing url parameter',
    });
  }

  const url = new URL(args.url);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  return new Promise((resolve) => {
    const method = args.method || 'GET';
    const options = {
      method,
      headers: args.headers || {},
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.stringify({
          status: 'success',
          message: `Fetched ${url.toString()}`,
          url: args.url,
          status_code: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 10000), // Limit to 10KB
          body_length: data.length,
        }));
      });
    });

    req.on('error', (error) => {
      resolve(JSON.stringify({
        status: 'error',
        message: error.message,
        url: args.url,
      }));
    });

    if (args.body && (method === 'POST' || method === 'PUT')) {
      req.write(args.body);
    }

    req.end();
  });
}
