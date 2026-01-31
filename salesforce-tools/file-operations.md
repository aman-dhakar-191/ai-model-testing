# File Operations Tools Guide

## Overview
Three essential file operation tools for reading, writing, and editing files in your Salesforce project.

---

## read_file Tool

### Purpose
Reads the contents of existing files. Use before editing to understand current state.

### Parameters
- **path** (string, required): File path relative to project root
  - Example: `force-app/main/default/classes/AccountService.cls`

### Example
```json
{
  "path": "force-app/main/default/classes/AccountService.cls"
}
```

### Response
```json
{
  "status": "success",
  "message": "File read successfully",
  "file": "force-app/main/default/classes/AccountService.cls",
  "content": "public class AccountService { ... }",
  "size": 1234
}
```

---

## write_file Tool

### Purpose
Writes content to any file path. Use for metadata, configs, package.xml, documentation, or any non-component file.

### Parameters
- **path** (string, required): File path relative to project root
- **content** (string, required): Full file content to write
- **dry_run** (boolean, optional): Preview without writing
- **overwrite** (boolean, optional): Overwrite if exists (default: false)

### Example 1: Create package.xml
```json
{
  "path": "manifest/package.xml",
  "content": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Package xmlns=\"http://soap.sforce.com/2006/04/metadata\">\n    <types>\n        <members>*</members>\n        <name>ApexClass</name>\n    </types>\n    <version>61.0</version>\n</Package>"
}
```

### Example 2: Create README
```json
{
  "path": "README.md",
  "content": "# Salesforce Project\n\nThis project contains...",
  "overwrite": true
}
```

### Response
```json
{
  "status": "success",
  "message": "File written successfully: manifest/package.xml",
  "file": "manifest/package.xml",
  "files_created": ["manifest/package.xml"],
  "dry_run": false
}
```

---

## edit_file Tool

### Purpose
Edits existing files using two modes: replace (full overwrite) or patch (targeted changes).

### Parameters
- **path** (string, required): File path to edit
- **mode** (enum, required): `replace` or `patch`
- **content** (string): Required for replace mode
- **patch_instructions** (string): Required for patch mode
- **dry_run** (boolean, optional): Preview changes

### Mode: replace
Completely overwrites the file with new content. Use when you have the full new file.

**Example:**
```json
{
  "path": "force-app/main/default/classes/AccountService.cls",
  "mode": "replace",
  "content": "public class AccountService {\n    // New implementation\n}"
}
```

### Mode: patch
Applies targeted changes. For this mode, the tool returns instructions for you to read the file first and provide the full replacement.

**Example:**
```json
{
  "path": "sfdx-project.json",
  "mode": "patch",
  "patch_instructions": "Add a new package directory for common utilities"
}
```

**Patch Response:**
```json
{
  "status": "info",
  "message": "Patch mode requires manual implementation",
  "file": "sfdx-project.json",
  "patch_instructions": "Add a new package directory...",
  "note": "Please read the file first and provide the full new content in replace mode"
}
```

### Workflow for Editing
1. **Read** the file first using `read_file`
2. **Modify** the content as needed
3. **Write** back using `edit_file` with `mode: replace`

### Response
```json
{
  "status": "success",
  "message": "File edited successfully",
  "file": "force-app/main/default/classes/AccountService.cls",
  "mode": "replace",
  "files_modified": ["force-app/main/default/classes/AccountService.cls"]
}
```

---

## list_files Tool

### Purpose
Lists all files and directories in a given path. Use to understand project structure before making changes.

### Parameters
- **directory** (string, required): Directory path to list
  - Example: `force-app/main/default/classes`

### Example
```json
{
  "directory": "force-app/main/default/classes"
}
```

### Response
```json
{
  "status": "success",
  "message": "Listed 15 items in: force-app/main/default/classes",
  "directory": "force-app/main/default/classes",
  "files": [
    {
      "name": "AccountService.cls",
      "type": "file",
      "path": "force-app/main/default/classes/AccountService.cls"
    },
    {
      "name": "AccountService.cls-meta.xml",
      "type": "file",
      "path": "force-app/main/default/classes/AccountService.cls-meta.xml"
    },
    {
      "name": "utils",
      "type": "directory",
      "path": "force-app/main/default/classes/utils"
    }
  ],
  "count": 15
}
```

---

## Common Use Cases

### 1. Creating Configuration Files
```
write_file → Create sfdx-project.json, .forceignore, etc.
```

### 2. Updating Existing Class
```
read_file → Get current content
edit_file (replace) → Write updated content
```

### 3. Exploring Project Structure
```
list_files → See what's in a directory
read_file → Read specific files of interest
```

### 4. Creating Documentation
```
write_file → Create README.md, CHANGELOG.md, etc.
```

### 5. Managing Metadata
```
write_file → Create package.xml, destructiveChanges.xml
```

## Best Practices

1. **Always read before edit**: Use `read_file` before `edit_file` to avoid data loss
2. **Use dry_run**: Preview changes before applying them
3. **Backup important files**: Use `overwrite: false` for safety
4. **Check existence**: Use `list_files` to verify paths exist
5. **Handle errors**: Check response status before proceeding

## Error Handling

### File Not Found
```json
{
  "status": "error",
  "message": "File not found: path/to/file.cls",
  "file": "path/to/file.cls"
}
```

### Directory Not Found
```json
{
  "status": "error",
  "message": "Directory not found: invalid/path",
  "directory": "invalid/path"
}
```

### File Already Exists
```json
{
  "status": "error",
  "message": "File already exists: path/to/file.cls",
  "file": "path/to/file.cls"
}
```

Use `overwrite: true` to override this behavior.
