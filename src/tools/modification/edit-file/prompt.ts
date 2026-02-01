/**
 * Tool instruction for edit_file
 */

export const EDIT_FILE_PROMPT = `### edit_file
Edits an existing file.

**When to use:** Modifying existing code

**Parameters:**
- \`path\` (string) - File path
- \`mode\` (string) - "replace" (full overwrite) or "patch" (targeted changes)
- \`content\` (string, required if mode=replace) - New file content
- \`patch_instructions\` (string, required if mode=patch) - Human-readable instructions

**Example - Replace:**
\`\`\`xml
<tool_call>
<tool_name>edit_file</tool_name>
<path>force-app/main/default/classes/AccountService.cls</path>
<mode>replace</mode>
<content>public with sharing class AccountService {
    // updated implementation
}</content>
</tool_call>
\`\`\`

**Example - Patch:**
\`\`\`xml
<tool_call>
<tool_name>edit_file</tool_name>
<path>force-app/main/default/classes/AccountService.cls</path>
<mode>patch</mode>
<patch_instructions>Add a new method called getActiveAccounts() that queries for Active accounts</patch_instructions>
</tool_call>
\`\`\``;
