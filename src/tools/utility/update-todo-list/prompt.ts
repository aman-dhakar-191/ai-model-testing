/**
 * Tool instruction for update_todo_list
 */

export const UPDATE_TODO_LIST_PROMPT = `### update_todo_list
Updates the task list for tracking progress.

**When to use:** Multi-step tasks to show progress

**Parameters:**
- \`todos\` (array) - Array of todo objects with id, title, status
  - \`status\`: "pending" | "in-progress" | "completed"

**Example:**
\`\`\`xml
<tool_call>
<tool_name>update_todo_list</tool_name>
<todos>
    <todo>
        <id>1</id>
        <title>Create trigger handler</title>
        <status>completed</status>
    </todo>
    <todo>
        <id>2</id>
        <title>Create trigger</title>
        <status>in-progress</status>
    </todo>
</todos>
</tool_call>
\`\`\``;
