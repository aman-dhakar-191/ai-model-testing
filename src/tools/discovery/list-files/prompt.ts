/**
 * Tool instruction for list_files
 */

export const LIST_FILES_PROMPT = `### list_files
Lists all files in a directory.

**When to use:** ALWAYS use before creating files to avoid conflicts

**Parameters:**
- \`directory\` (string) - Relative path (e.g., "force-app/main/default/classes")

**Example:**
\`\`\`xml
<tool_call>
<tool_name>list_files</tool_name>
<directory>force-app/main/default/classes</directory>
</tool_call>
\`\`\``;
