import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * File system operations helper module
 * Provides safe file and directory operations for Salesforce development
 */

export interface FileOperationResult {
  success: boolean;
  message: string;
  path?: string;
}

/**
 * Ensures a directory exists, creating it recursively if needed
 */
export function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Checks if a file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Writes content to a file
 * @param filePath - Absolute path to the file
 * @param content - Content to write
 * @param overwrite - Whether to overwrite if file exists
 * @returns Result object with success status and message
 */
export function writeFile(
  filePath: string,
  content: string,
  overwrite: boolean
): FileOperationResult {
  try {
    if (!overwrite && fileExists(filePath)) {
      return {
        success: false,
        message: `File already exists: ${filePath}`,
        path: filePath,
      };
    }

    ensureDirectoryExists(filePath);
    fs.writeFileSync(filePath, content, 'utf8');

    return {
      success: true,
      message: `File written: ${filePath}`,
      path: filePath,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      path: filePath,
    };
  }
}

/**
 * Reads content from a file
 * @param filePath - Absolute path to the file
 * @returns File content or null if error
 */
export function readFile(filePath: string): { content: string | null; error?: string } {
  try {
    if (!fileExists(filePath)) {
      return { content: null, error: `File not found: ${filePath}` };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return { content };
  } catch (error) {
    return {
      content: null,
      error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Lists files and directories in a given directory
 * @param dirPath - Absolute path to the directory
 * @returns Array of file/directory info or error
 */
export function listDirectory(dirPath: string): {
  files: Array<{ name: string; type: 'file' | 'directory'; path: string }> | null;
  error?: string;
} {
  try {
    if (!fs.existsSync(dirPath)) {
      return { files: null, error: `Directory not found: ${dirPath}` };
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = entries.map((dirent: fs.Dirent) => ({
      name: dirent.name,
      type: (dirent.isDirectory() ? 'directory' : 'file') as 'file' | 'directory',
      path: path.join(dirPath, dirent.name),
    }));

    return { files };
  } catch (error) {
    return {
      files: null,
      error: `Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Generates Apex class metadata XML
 */
export function generateApexMetaXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>61.0</apiVersion>
    <status>Active</status>
</ApexClass>`;
}

/**
 * Generates Visualforce page metadata XML
 */
export function generateVFPageMetaXml(pageName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ApexPage xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>61.0</apiVersion>
    <label>${pageName}</label>
</ApexPage>`;
}

/**
 * Resolves a relative path to absolute based on current working directory
 */
export function resolveProjectPath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
  extension?: string;
}

/**
 * Recursively list files and directories in a tree structure
 * @param dirPath - Directory path to list
 * @param maxDepth - Maximum depth to traverse (default: 5)
 * @param currentDepth - Current recursion depth
 * @returns Array of file tree items
 */
export function listFilesRecursive(
  dirPath: string,
  maxDepth: number = 5,
  currentDepth: number = 0
): FileTreeItem[] {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const items: FileTreeItem[] = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    // Filter out hidden files and common ignore directories
    const ignorePatterns = [
      'node_modules',
      '.git',
      '.sfdx',
      'dist',
      'dist-electron',
      'build',
      '.vscode',
      'coverage',
      '__tests__',
      '.sf',
    ];

    for (const entry of entries) {
      // Skip hidden files and ignored directories
      if (entry.name.startsWith('.') || ignorePatterns.includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);

      if (entry.isDirectory()) {
        const children = listFilesRecursive(fullPath, maxDepth, currentDepth + 1);
        items.push({
          name: entry.name,
          path: relativePath,
          type: 'directory',
          children: children.length > 0 ? children : undefined,
        });
      } else if (entry.isFile()) {
        const extension = path.extname(entry.name).toLowerCase();
        items.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          extension,
        });
      }
    }

    // Sort: directories first, then files, both alphabetically
    return items.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });
  } catch (error) {
    console.error(`Error listing directory ${dirPath}:`, error);
    return [];
  }
}
