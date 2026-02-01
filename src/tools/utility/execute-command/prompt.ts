/**
 * Tool instruction for execute_command
 */

export const EXECUTE_COMMAND_PROMPT = `### execute_command
Runs shell commands.

**When to use:** Running Salesforce CLI or other commands

**Parameters:**
- \`command\` (string) - Shell command
- \`cwd\` (string, optional) - Working directory

**Example:**
\`\`\`xml
<tool_call>
<tool_name>execute_command</tool_name>
<command>sf org list</command>
</tool_call>
\`\`\``;
