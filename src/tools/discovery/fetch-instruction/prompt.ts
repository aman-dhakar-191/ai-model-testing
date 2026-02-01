/**
 * Tool instruction for fetch_instruction
 */

export const FETCH_INSTRUCTION_PROMPT = `### fetch_instruction
Fetches a specific instruction guide by name.

**When to use:** Before writing Apex/LWC code to get coding standards and best practices

**Parameters:**
- \`guide_name\` (string) - Name from list_instructions (e.g., "apex-best-practices", "lwc-standards")

**Example:**
\`\`\`xml
<tool_call>
<tool_name>fetch_instruction</tool_name>
<guide_name>apex-best-practices</guide_name>
</tool_call>
\`\`\``;
