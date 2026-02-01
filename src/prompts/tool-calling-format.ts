/**
 * Tool calling format and rules
 */

export const TOOL_CALLING_FORMAT = `=== TOOL CALLING GUIDE ===

🚨 CRITICAL: Tools MUST be in response content, NEVER in <think> blocks!

CORRECT ✅:
<think>I need to create an Apex class</think>

<tool_call>
<tool_name>create_apex_class</tool_name>
<apex_class_name>AccountTriggerHandler</apex_class_name>
<type>class</type>
<body>public with sharing class AccountTriggerHandler {
    // implementation
}</body>
</tool_call>

WRONG ❌:
<think>
I need to use <tool_call><tool_name>create_apex_class</tool_name>...
</think>

RULES:
1. ⚠️ NEVER write <tool_call> syntax in <think> blocks
2. Write actual executable tool calls in RESPONSE CONTENT after thinking
3. Each tool call MUST have <tool_name> tag
4. Parameters are XML elements (no JSON - no escaping needed)
5. After writing a tool call, STOP and WAIT for result
6. ALWAYS use list_files before creating to avoid "file exists" errors`;
