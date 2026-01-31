# Create Apex Class Tool

## Overview
Creates Salesforce Apex class files with proper metadata. Supports multiple types including classes, triggers, batch jobs, schedulable classes, queueable classes, interfaces, and test classes.

## Tool Name
`create_apex_class`

## Parameters

### Required
- **apex_class_name** (string): PascalCase class name
  - Examples: `AccountService`, `ContactTriggerHandler`, `OpportunityBatch`
  - Naming convention: PascalCase
  - Test classes should be suffixed with `Test`

- **type** (enum): Type of Apex component
  - Options: `class`, `trigger`, `batch`, `schedulable`, `queueable`, `test`, `interface`
  
- **body** (string): Full Apex class or trigger body including the class declaration

### Optional
- **is_create_test** (boolean): Whether to also generate a test class
  - Default: false
  
- **test_body** (string): Full Apex test class body (required if is_create_test = true)

- **trigger_object** (string): Salesforce object name for triggers
  - Example: `Account`, `Contact`, `Opportunity`
  - Required only if type = `trigger`

- **dry_run** (boolean): If true, returns what would be created without writing files
  - Default: false
  
- **overwrite** (boolean): Whether to overwrite existing files
  - Default: false

## File Structure Created

### Standard Class
```
force-app/main/default/classes/
├── {apex_class_name}.cls
└── {apex_class_name}.cls-meta.xml
```

### With Test Class
```
force-app/main/default/classes/
├── {apex_class_name}.cls
├── {apex_class_name}.cls-meta.xml
├── {apex_class_name}Test.cls
└── {apex_class_name}Test.cls-meta.xml
```

## Example Usage

### Example 1: Simple Class
```json
{
  "apex_class_name": "AccountService",
  "type": "class",
  "body": "public class AccountService {\n    public static List<Account> getActiveAccounts() {\n        return [SELECT Id, Name FROM Account WHERE IsActive__c = true];\n    }\n}"
}
```

### Example 2: Batch Class with Test
```json
{
  "apex_class_name": "AccountCleanupBatch",
  "type": "batch",
  "body": "public class AccountCleanupBatch implements Database.Batchable<SObject> {\n    public Database.QueryLocator start(Database.BatchableContext bc) {\n        return Database.getQueryLocator('SELECT Id FROM Account WHERE LastActivityDate < LAST_N_DAYS:365');\n    }\n    \n    public void execute(Database.BatchableContext bc, List<Account> scope) {\n        delete scope;\n    }\n    \n    public void finish(Database.BatchableContext bc) {\n        System.debug('Batch completed');\n    }\n}",
  "is_create_test": true,
  "test_body": "@IsTest\nprivate class AccountCleanupBatchTest {\n    @IsTest\n    static void testBatchExecution() {\n        // Test implementation\n    }\n}"
}
```

### Example 3: Trigger
```json
{
  "apex_class_name": "AccountTrigger",
  "type": "trigger",
  "trigger_object": "Account",
  "body": "trigger AccountTrigger on Account (before insert, before update) {\n    AccountTriggerHandler.handle();\n}"
}
```

### Example 4: Dry Run
```json
{
  "apex_class_name": "ContactService",
  "type": "class",
  "body": "public class ContactService { }",
  "dry_run": true
}
```

## Response Format

### Success
```json
{
  "status": "success",
  "message": "Apex class created successfully",
  "files_created": [
    "force-app/main/default/classes/AccountService.cls",
    "force-app/main/default/classes/AccountService.cls-meta.xml"
  ],
  "dry_run": false
}
```

### Partial Success (some files failed)
```json
{
  "status": "partial",
  "message": "Apex class created with some errors",
  "files_created": [
    "force-app/main/default/classes/AccountService.cls"
  ],
  "errors": [
    "File already exists: force-app/main/default/classes/AccountService.cls-meta.xml"
  ],
  "dry_run": false
}
```

### Error
```json
{
  "status": "error",
  "message": "Failed to create Apex class: [error details]"
}
```

## Metadata File
The tool automatically generates the `.cls-meta.xml` file with:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>61.0</apiVersion>
    <status>Active</status>
</ApexClass>
```

## Best Practices
1. **Use dry_run first** to preview what will be created
2. **Follow naming conventions**: PascalCase for class names
3. **Test classes**: Always create with `Test` suffix
4. **Trigger handlers**: Create separate handler classes for trigger logic
5. **Batch classes**: Implement proper error handling in execute method
6. **Set overwrite carefully**: Use `overwrite: true` only when you're sure

## Common Patterns

### Service Class
- Name: `{Object}Service`
- Purpose: Business logic and queries
- Example: `AccountService`, `OpportunityService`

### Trigger Handler
- Name: `{Object}TriggerHandler`
- Purpose: Handle trigger logic
- Example: `AccountTriggerHandler`, `ContactTriggerHandler`

### Batch Class
- Name: `{Purpose}Batch`
- Purpose: Bulk processing
- Example: `DataCleanupBatch`, `ReportGenerationBatch`

### Utility Class
- Name: `{Purpose}Utility` or `{Purpose}Helper`
- Purpose: Shared helper methods
- Example: `DateUtility`, `ValidationHelper`
