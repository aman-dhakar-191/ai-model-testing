/**
 * Tool instruction for write_file
 */

export const WRITE_FILE_PROMPT = `### write_file
Writes any file (metadata, config, documentation).

**When to use:** Creating non-Apex/LWC files like package.xml, README, config files

**Parameters:**
- \`path\` (string) - File path relative to project root
- \`content\` (string) - File content
- \`overwrite\` (boolean, optional) - Overwrite if exists

**Example:**
\`\`\`xml
<tool_call>
<tool_name>write_file</tool_name>
<path>force-app/main/default/package.xml</path>
<content><?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <version>60.0</version>
</Package></content>
</tool_call>
\`\`\``;
