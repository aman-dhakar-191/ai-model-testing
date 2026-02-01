# Update Todo List Tool

## Overview
Create and manage a task list to track progress during multi-step work. The todo list appears in the UI sidebar, giving users visibility into your workflow and progress.

## Tool Name
`update_todo_list`

## Parameters

### Required
- **todos** (array): Array of todo items, each with:
  - **id** (string): Unique identifier (can be sequential: "1", "2", "3")
  - **title** (string): Short task description (3-10 words)
  - **status** (enum): Task status
    - `pending`: Not started yet
    - `in-progress`: Currently working on this
    - `completed`: Finished successfully

## Return Values

Success:
```json
{
  "status": "success",
  "message": "Updated 5 todo items",
  "todos": [
    {
      "id": "1",
      "title": "Create Apex controller class",
      "status": "completed",
      "createdAt": 1704067200000
    },
    {
      "id": "2",
      "title": "Create test class with 75% coverage",
      "status": "in-progress",
      "createdAt": 1704067200000
    }
  ]
}
```

## When to Use

Use `update_todo_list` at the START of any multi-step work:
- Creating multiple Salesforce components
- Building a feature with dependencies (Apex + LWC + tests)
- Complex refactoring tasks
- Deployment workflows
- Project setup or scaffolding

**Do NOT use for**:
- Single-step tasks (e.g., "read one file")
- Trivial operations
- Pure information requests

## Best Practices

### 1. Create at Start of Work
```json
{
  "todos": [
    {
      "id": "1",
      "title": "Analyze requirements",
      "status": "in-progress"
    },
    {
      "id": "2",
      "title": "Create Apex service class",
      "status": "pending"
    },
    {
      "id": "3",
      "title": "Create test class",
      "status": "pending"
    },
    {
      "id": "4",
      "title": "Deploy and validate",
      "status": "pending"
    }
  ]
}
```

### 2. Update as You Progress
```json
{
  "todos": [
    {
      "id": "1",
      "title": "Analyze requirements",
      "status": "completed"
    },
    {
      "id": "2",
      "title": "Create Apex service class",
      "status": "completed"
    },
    {
      "id": "3",
      "title": "Create test class",
      "status": "in-progress"
    },
    {
      "id": "4",
      "title": "Deploy and validate",
      "status": "pending"
    }
  ]
}
```

### 3. Mark All Complete
```json
{
  "todos": [
    {
      "id": "1",
      "title": "Analyze requirements",
      "status": "completed"
    },
    {
      "id": "2",
      "title": "Create Apex service class",
      "status": "completed"
    },
    {
      "id": "3",
      "title": "Create test class",
      "status": "completed"
    },
    {
      "id": "4",
      "title": "Deploy and validate",
      "status": "completed"
    }
  ]
}
```

## Example Workflows

### Scenario: Creating LWC with Apex Controller
```json
// Initial todos
{
  "todos": [
    {"id": "1", "title": "Read project structure", "status": "in-progress"},
    {"id": "2", "title": "Create Apex controller", "status": "pending"},
    {"id": "3", "title": "Create Apex test class", "status": "pending"},
    {"id": "4", "title": "Create LWC component", "status": "pending"},
    {"id": "5", "title": "Deploy metadata", "status": "pending"}
  ]
}

// After reading files
{
  "todos": [
    {"id": "1", "title": "Read project structure", "status": "completed"},
    {"id": "2", "title": "Create Apex controller", "status": "in-progress"},
    {"id": "3", "title": "Create Apex test class", "status": "pending"},
    {"id": "4", "title": "Create LWC component", "status": "pending"},
    {"id": "5", "title": "Deploy metadata", "status": "pending"}
  ]
}

// Continue updating as each step completes...
```

### Scenario: Refactoring Existing Code
```json
{
  "todos": [
    {"id": "1", "title": "Read existing Apex class", "status": "completed"},
    {"id": "2", "title": "Identify code smells", "status": "completed"},
    {"id": "3", "title": "Extract helper methods", "status": "in-progress"},
    {"id": "4", "title": "Update test class", "status": "pending"},
    {"id": "5", "title": "Run tests and validate", "status": "pending"}
  ]
}
```

## UI Display

The todo list appears in the workspace panel sidebar:
- ⭕ **Pending**: Gray circle icon
- 🔄 **In Progress**: Blue refresh icon  
- ✅ **Completed**: Green checkmark (strikethrough text)

Users see your progress in real-time as you update the list.

## Important Notes

1. **Always include ALL todos**: Every call replaces the entire list
2. **One at a time**: Keep only ONE task "in-progress" at a time
3. **Update frequently**: Call after completing each major step
4. **Clear titles**: Use action verbs ("Create", "Deploy", "Test", "Read")
5. **Reasonable scope**: 3-8 tasks is ideal

## Error Handling

```json
// ❌ Missing required fields
{
  "status": "error",
  "message": "Each todo must have id, title, and status"
}

// ❌ Invalid status
{
  "status": "error",
  "message": "Invalid status: done. Must be one of: pending, in-progress, completed"
}

// ❌ Empty array
{
  "status": "error",
  "message": "Missing or invalid todos array"
}
```

## Integration with Other Tools

The todo list works alongside all other tools:

```json
// 1. Create todo list
update_todo_list: {"todos": [{"id": "1", "title": "Create class", "status": "in-progress"}]}

// 2. Use other tools
create_apex_class: {...}

// 3. Update todo list
update_todo_list: {"todos": [{"id": "1", "title": "Create class", "status": "completed"}]}
```

This provides users with clear visibility into your workflow and progress!
