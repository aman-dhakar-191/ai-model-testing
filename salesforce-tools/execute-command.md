# Execute Command Tool

## Overview
Execute shell commands in the project directory. Useful for running npm scripts, git operations, Salesforce CLI commands, and other terminal operations.

## Tool Name
`execute_command`

## Parameters

### Required
- **command** (string): The shell command to execute
  - Examples: `npm install`, `git status`, `sfdx force:org:list`, `npm run test`

### Optional
- **cwd** (string): Working directory for the command
  - Defaults to project root if not specified
  - Example: `force-app/main/default`

## Return Values
```json
{
  "status": "success",
  "message": "Command executed successfully",
  "command": "npm install",
  "stdout": "added 123 packages in 5s",
  "stderr": "",
  "exit_code": 0
}
```

On error:
```json
{
  "status": "error",
  "message": "Command execution failed",
  "command": "invalid-command",
  "stdout": "",
  "stderr": "command not found: invalid-command",
  "exit_code": 127
}
```

## Common Use Cases

### 1. Install Dependencies
```json
{
  "command": "npm install"
}
```

### 2. Check Git Status
```json
{
  "command": "git status"
}
```

### 3. List Salesforce Orgs
```json
{
  "command": "sfdx force:org:list"
}
```

### 4. Run Tests
```json
{
  "command": "npm run test"
}
```

### 5. Check Node/npm Version
```json
{
  "command": "node --version && npm --version"
}
```

### 6. Create Git Branch
```json
{
  "command": "git checkout -b feature/new-apex-class"
}
```

### 7. Run Custom Scripts
```json
{
  "command": "npm run build"
}
```

## Best Practices

1. **Check Before Acting**: Use this to verify system state before making assumptions
2. **Verify Tools**: Check if required CLI tools are installed (`sfdx --version`)
3. **Git Operations**: Use for branch management, commits, and status checks
4. **Package Management**: Install dependencies, check versions, run scripts
5. **Timeout**: Commands timeout after 60 seconds - use for quick operations only

## Security Notes

- Commands run in a sandboxed project directory
- No sudo/admin privileges
- Timeout protection prevents hanging processes
- stderr and stdout are both captured for debugging

## Examples in Context

### Scenario: Creating a new feature
```json
// 1. Create new branch
{
  "command": "git checkout -b feature/account-service"
}

// 2. Verify Salesforce CLI is available
{
  "command": "sfdx --version"
}

// 3. After creating files, run tests
{
  "command": "npm run test:apex"
}
```

### Scenario: Project setup
```json
// 1. Install dependencies
{
  "command": "npm install"
}

// 2. Check Node version
{
  "command": "node --version"
}

// 3. List available orgs
{
  "command": "sfdx force:org:list"
}
```

## Error Handling

Always check the `exit_code` in the response:
- `0` = Success
- Non-zero = Error (check `stderr` for details)

The tool captures both stdout and stderr, so you can debug failed commands.
