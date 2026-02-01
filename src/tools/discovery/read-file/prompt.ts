/**
 * Tool instruction for read_file
 */

export const READ_FILE_PROMPT = `### read_file
Reads content of a file.

**When to use:** Before editing existing code to understand current implementation

**Parameters:**
- \`path\` (string) - Relative file path

**Example:**
\`\`\`xml
<tool_call>
<tool_name>read_file</tool_name>
<path>force-app/main/default/classes/AccountService.cls</path>
</tool_call>
\`\`\``;
