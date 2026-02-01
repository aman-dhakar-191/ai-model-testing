# Tool Usage Guide - Complete Reference

This guide explains how to use tools effectively to accomplish Salesforce development tasks.

## 🎯 Tool Calling Format

You MUST use **pure XML format** for all tool calls:

```xml
<tool_call>
<tool_name>create_apex_class</tool_name>
<apex_class_name>AccountTriggerHandler</apex_class_name>
<type>class</type>
<body>public with sharing class AccountTriggerHandler {
    // implementation
}</body>
</tool_call>
```

### Critical Rules

1. **Write tool calls in RESPONSE CONTENT** (never in `<think>` blocks)
2. **Pure XML format** - All parameters as XML child elements
3. **No JSON** - No need to escape quotes or newlines
4. **One at a time** - Write one tool call, wait for result, then continue
5. **Always check first** - Use `list_files` before creating to avoid "file exists" errors

## 📋 Available Tools

### Discovery Tools

#### list_instructions
Lists all available instruction guides.

**When to use:** Beginning of any code generation task to see what standards are available

**Example:**
```xml
<tool_call>
<tool_name>list_instructions</tool_name>
</tool_call>
```

#### fetch_instruction
Fetches a specific instruction guide by ID.

**When to use:** After listing instructions, fetch relevant guides (Apex, LWC, PMD rules)

**Parameters:**
- `guide_id` (string) - ID from list_instructions (e.g., "apex-best-practices")

**Example:**
```xml
<tool_call>
<tool_name>fetch_instruction</tool_name>
<guide_id>apex-best-practices</guide_id>
</tool_call>
```

#### list_files
Lists files in a directory.

**When to use:** Before creating any file, to check if it already exists

**Parameters:**
- `directory` (string) - Path to list (e.g., "force-app/main/default/classes")

**Example:**
```xml
<tool_call>
<tool_name>list_files</tool_name>
<directory>force-app/main/default/classes</directory>
</tool_call>
```

#### read_file
Reads the contents of a file.

**When to use:** Before editing existing code, to understand current state

**Parameters:**
- `path` (string) - File path to read

**Example:**
```xml
<tool_call>
<tool_name>read_file</tool_name>
<path>force-app/main/default/classes/AccountService.cls</path>
</tool_call>
```

### Creation Tools

#### create_apex_class
Creates an Apex class, trigger, test, or other Apex component.

**When to use:** Creating new Apex code (class, trigger, batch, schedulable, test)

**Parameters:**
- `apex_class_name` (string) - PascalCase name (e.g., "AccountTriggerHandler")
- `type` (string) - "class" | "trigger" | "batch" | "schedulable" | "queueable" | "test" | "interface"
- `body` (string) - Full Apex code including declaration
- `is_create_test` (boolean, optional) - Create test class
- `test_body` (string, optional) - Test class body if is_create_test=true
- `trigger_object` (string, optional) - Object name for triggers (e.g., "Account")
- `overwrite` (boolean, optional) - Overwrite if exists

**Example - Apex Class:**
```xml
<tool_call>
<tool_name>create_apex_class</tool_name>
<apex_class_name>AccountTriggerHandler</apex_class_name>
<type>class</type>
<body>public with sharing class AccountTriggerHandler {
    public static void handleAfterInsert(List<Account> newAccounts) {
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
```

**Example - Trigger:**
```xml
<tool_call>
<tool_name>create_apex_class</tool_name>
<apex_class_name>AccountTrigger</apex_class_name>
<type>trigger</type>
<trigger_object>Account</trigger_object>
<body>trigger AccountTrigger on Account (after insert) {
    AccountTriggerHandler.handleAfterInsert(Trigger.new);
}</body>
</tool_call>
```

**Example - Test Class:**
```xml
<tool_call>
<tool_name>create_apex_class</tool_name>
<apex_class_name>AccountTriggerHandlerTest</apex_class_name>
<type>test</type>
<body>@isTest
private class AccountTriggerHandlerTest {
    @TestSetup
    static void setup() {
        // Test data setup
    }
    
    @isTest
    static void testAfterInsert() {
        Test.startTest();
        Account acc = new Account(Name = 'Test Account');
        insert acc;
        Test.stopTest();
        
        List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
        System.assertEquals(1, contacts.size(), 'One contact should be created');
    }
}</body>
</tool_call>
```

#### create_lwc_component
Creates a Lightning Web Component bundle.

**Parameters:**
- `name` (string) - kebab-case name (e.g., "account-card")
- `html` (string) - HTML template
- `javascript` (string) - JavaScript controller
- `css` (string, optional) - CSS styles
- `meta_xml` (string) - js-meta.xml configuration
- `is_create_apex_controller` (boolean, optional) - Create Apex controller
- `apex_controller_name` (string, optional) - Apex controller class name
- `apex_controller_body` (string, optional) - Apex controller code

**Example:**
```xml
<tool_call>
<tool_name>create_lwc_component</tool_name>
<name>accountCard</name>
<html><template>
    <lightning-card title="Account Details">
        <p>{accountName}</p>
    </lightning-card>
</template></html>
<javascript>import { LightningElement, api } from 'lwc';

export default class AccountCard extends LightningElement {
    @api accountName;
}</javascript>
<meta_xml><?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>60.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AppPage</target>
    </targets>
</LightningComponentBundle></meta_xml>
</tool_call>
```

#### create_aura_component
Creates an Aura component bundle.

**Parameters:**
- `name` (string) - PascalCase name
- `component` (string) - Component markup
- `controller` (string) - Controller JS
- `helper` (string) - Helper JS
- `design` (string, optional) - Design resource
- `renderer` (string, optional) - Custom renderer

#### create_visualforce_page
Creates a Visualforce page.

**Arguments:**
- `page_name` (string) - PascalCase name
- `markup` (string) - VF markup
- `controller_name` (string, optional) - Custom controller
- `controller_body` (string, optional) - Controller code

#### write_file
Writes any file (metadata, config, documentation).

**Parameters:**
- `path` (string) - File path relative to project root
- `content` (string) - File content
- `overwrite` (boolean, optional) - Overwrite if exists

**Example:**
```xml
<tool_call>
<tool_name>write_file</tool_name>
<path>force-app/main/default/package.xml</path>
<content><?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <version>60.0</version>
</Package></content>
</tool_call>
```

### Modification Tools

#### edit_file
Edits an existing file.

**Parameters:**
- `path` (string) - File path
- `mode` (string) - "replace" (full overwrite) or "patch" (targeted changes)
- `content` (string, required if mode=replace) - New file content
- `patch_instructions` (string, required if mode=patch) - Human-readable instructions

**Example - Replace:**
```xml
<tool_call>
<tool_name>edit_file</tool_name>
<path>force-app/main/default/classes/AccountService.cls</path>
<mode>replace</mode>
<content>public with sharing class AccountService {
    // updated implementation
}</content>
</tool_call>
```

**Example - Patch:**
```xml
<tool_call>
<tool_name>edit_file</tool_name>
<path>force-app/main/default/classes/AccountService.cls</path>
<mode>patch</mode>
<patch_instructions>Add a new method called getActiveAccounts() that queries for Active accounts</patch_instructions>
</tool_call>
```

### Utility Tools

#### update_todo_list
Updates the task list for tracking progress.

**Parameters:**
- `todos` (array) - Array of todo objects with id, title, status
  - `status`: "pending" | "in-progress" | "completed"

**Example:**
```xml
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
    <todo>
        <id>3</id>
        <title>Create test class</title>
        <status>pending</status>
    </todo>
</todos>
</tool_call>
```

#### execute_command
Runs shell commands.

**Parameters:**
- `command` (string) - Shell command
- `cwd` (string, optional) - Working directory

**Example:**
```xml
<tool_call>
<tool_name>execute_command</tool_name>
<command>sf org list</command>
</tool_call>
```

#### web_fetch
Fetches content from a URL.

**Arguments:**
- `url` (string) - URL to fetch
- `method` (string, optional) - "GET" | "POST" | "PUT" | "DELETE"
- `headers` (object, optional) - HTTP headers
- `body` (string, optional) - Request body

### Deployment Tools

#### sf_validate_deploy
Validates deployment without deploying.

**Arguments:**
- `source_path` (string) - Path to deploy (e.g., "force-app/main/default")
- `target_org` (string, optional) - Org username/alias
- `test_level` (string, optional) - "NoTestRun" | "RunSpecifiedTests" | "RunLocalTests" | "RunAllTestsInOrg"
- `tests` (array, optional) - Test class names if test_level=RunSpecifiedTests

#### sf_deploy_metadata
Deploys metadata to org.

**Arguments:** Same as sf_validate_deploy, plus:
- `check_only` (boolean, optional) - Validation-only if true

#### sf_quick_deploy
Quick deploy using validation job ID.

**Arguments:**
- `job_id` (string) - Job ID from recent validation
- `target_org` (string, optional) - Org username/alias

#### sf_retrieve_metadata
Retrieves metadata from org.

**Arguments:**
- `source_path` (string) - Where to save retrieved metadata
- `target_org` (string, optional) - Org username/alias

## 🔄 Standard Workflows

### Workflow 1: Create Apex Trigger with Handler

```
1. list_instructions → discover available guides
2. fetch_instruction (apex-best-practices) → get standards
3. list_files (force-app/main/default/classes) → check existing
4. create_apex_class (handler class)
5. create_apex_class (trigger)
6. create_apex_class (test class)
7. update_todo_list → mark complete
```

### Workflow 2: Create LWC Component

```
1. fetch_instruction (lwc-standards) → get LWC best practices
2. list_files (force-app/main/default/lwc) → check existing
3. create_lwc_component → create component bundle
4. If needed: create_apex_class (Apex controller)
```

### Workflow 3: Modify Existing Code

```
1. list_files → verify file exists
2. read_file → understand current code
3. fetch_instruction (pmd-rules) → check standards
4. edit_file (mode=patch) → make targeted changes
```

### Workflow 4: Deploy Changes

```
1. sf_validate_deploy → dry run check
2. Review validation results
3. sf_deploy_metadata → actual deployment
4. Or: sf_quick_deploy (job_id) → skip test re-run
```

## 🚨 Error Handling

### "File already exists"
```xml
<tool_call>
<tool_name>list_files</tool_name>
<directory>force-app/main/default/classes</directory>
</tool_call>

<!-- If file exists, use edit_file instead of create_apex_class -->
<tool_call>
<tool_name>edit_file</tool_name>
<path>force-app/main/default/classes/AccountService.cls</path>
<mode>replace</mode>
<content>public with sharing class AccountService {
    // new implementation
}</content>
</tool_call>
```

### "File not found"
```xml
<!-- Verify path with list_files -->
<tool_call>
<tool_name>list_files</tool_name>
<directory>force-app/main/default</directory>
</tool_call>
```

## 📝 Best Practices

1. **Always list before creating** - Prevents "file exists" errors
2. **Fetch standards first** - Use fetch_instruction for coding guidelines
3. **Use full paths** - Never shortcuts like "classes/", always "force-app/main/default/classes/"
4. **Pure XML format** - No JSON, no need to escape quotes or newlines in code
5. **Sequential calls** - One tool at a time, wait for result
6. **Update todos** - Track progress for multi-step tasks
7. **Create tests** - Every Apex class needs test coverage
8. **Bulk operations** - Process lists, not single records (governor limits)
9. **Security** - Use "with sharing", check CRUD/FLS
10. **Read before edit** - Understand existing code before modifying
