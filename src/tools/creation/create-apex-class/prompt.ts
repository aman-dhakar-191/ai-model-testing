/**
 * Tool instruction for create_apex_class
 */

export const CREATE_APEX_CLASS_PROMPT = `### create_apex_class
Creates an Apex class, trigger, test, or other Apex component.

**When to use:** Creating new Apex code

**Parameters:**
- \`apex_class_name\` (string) - PascalCase name (e.g., "AccountTriggerHandler")
- \`type\` (string) - "class" | "trigger" | "batch" | "schedulable" | "queueable" | "test" | "interface"
- \`body\` (string) - Full Apex code including declaration
- \`is_create_test\` (boolean, optional) - Create test class
- \`test_body\` (string, optional) - Test class body
- \`trigger_object\` (string, optional) - Object name for triggers
- \`overwrite\` (boolean, optional) - Overwrite if exists

**Example:**
\`\`\`xml
<tool_call>
<tool_name>create_apex_class</tool_name>
<apex_class_name>AccountTriggerHandler</apex_class_name>
<type>class</type>
<body>public with sharing class AccountTriggerHandler {
    public static void handleAfterInsert(List<Account> newAccounts) {
        // Bulk-safe implementation
        List<Contact> contactsToInsert = new List<Contact>();
        for (Account acc : newAccounts) {
            contactsToInsert.add(new Contact(
                LastName = acc.Name,
                AccountId = acc.Id
            ));
        }
        if (!contactsToInsert.isEmpty()) {
            insert contactsToInsert;
        }
    }
}</body>
</tool_call>
\`\`\``;
