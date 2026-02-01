# Create Aura Component Tool

## Overview
Creates Aura component bundles with .cmp markup, controller, helper, and optional design and renderer files.

## Tool Name
`create_aura_component`

## Parameters

### Required
- **name** (string): PascalCase component name
  - Example: `AccountManager`, `ContactList`, `OpportunityCard`
  
- **component** (string): Component markup (.cmp content)
  
- **controller** (string): Client-side controller JavaScript
  
- **helper** (string): Helper JavaScript

### Optional
- **design** (string): Design resource for App Builder configuration
  
- **renderer** (string): Custom renderer JavaScript (rarely needed)
  
- **dry_run** (boolean): Preview without creating files
  - Default: false
  
- **overwrite** (boolean): Overwrite existing files
  - Default: false

## File Structure Created

### Basic Bundle
```
force-app/main/default/aura/{name}/
├── {name}.cmp
├── {name}Controller.js
└── {name}Helper.js
```

### With Design Resource
```
force-app/main/default/aura/{name}/
├── {name}.cmp
├── {name}Controller.js
├── {name}Helper.js
└── {name}.design
```

## Example Usage

### Example 1: Simple Display Component
```json
{
  "name": "AccountCard",
  "component": "<aura:component>\n    <aura:attribute name=\"accountName\" type=\"String\"/>\n    <div class=\"slds-card\">\n        <div class=\"slds-card__body\">\n            <p>{!v.accountName}</p>\n        </div>\n    </div>\n</aura:component>",
  "controller": "({\n    doInit: function(component, event, helper) {\n        // Initialize component\n    }\n})",
  "helper": "({\n    // Helper functions\n})"
}
```

### Example 2: Component with Design for App Builder
```json
{
  "name": "RecordViewer",
  "component": "<aura:component implements=\"flexipage:availableForRecordHome\" access=\"global\">\n    <aura:attribute name=\"recordId\" type=\"String\"/>\n    <div>\n        Record ID: {!v.recordId}\n    </div>\n</aura:component>",
  "controller": "({\n    doInit: function(component, event, helper) {\n        var recordId = component.get('v.recordId');\n        console.log('Record ID:', recordId);\n    }\n})",
  "helper": "({\n    fetchRecordData: function(component, recordId) {\n        // Helper logic\n    }\n})",
  "design": "<design:component>\n    <design:attribute name=\"recordId\" label=\"Record ID\" />\n</design:component>"
}
```

## Return Values

### Success Response
```json
{
  "status": "success",
  "message": "Aura component created successfully",
  "files_created": [
    "force-app/main/default/aura/AccountCard/AccountCard.cmp",
    "force-app/main/default/aura/AccountCard/AccountCardController.js",
    "force-app/main/default/aura/AccountCard/AccountCardHelper.js"
  ],
  "dry_run": false
}
```

### Dry Run Response
```json
{
  "status": "success",
  "message": "DRY RUN - Would create Aura component",
  "files_created": [
    "force-app/main/default/aura/AccountCard/AccountCard.cmp",
    "force-app/main/default/aura/AccountCard/AccountCardController.js",
    "force-app/main/default/aura/AccountCard/AccountCardHelper.js"
  ],
  "dry_run": true
}
```

## Best Practices

1. **Naming Convention**
   - Use PascalCase for component names
   - Component folder matches component name

2. **Component Structure**
   - Keep components focused and reusable
   - Use attributes for configuration
   - Implement proper interfaces for App Builder

3. **Controller vs Helper**
   - Controller: Handle user interactions, component lifecycle
   - Helper: Reusable logic, server calls, data processing

4. **Design Resources**
   - Required for App Builder configuration
   - Define configurable attributes
   - Add proper labels and descriptions

5. **Performance**
   - Minimize DOM manipulation
   - Use proper event handling
   - Avoid memory leaks in component destroy

## Common Interfaces

- `flexipage:availableForRecordHome` - Record pages
- `flexipage:availableForAllPageTypes` - Any page
- `force:hasRecordId` - Automatic recordId injection
- `force:appHostable` - Lightning App Builder

## Workflow

1. **Design First**
   ```json
   { "name": "MyComponent", "dry_run": true, ... }
   ```

2. **Review Structure**
   - Check files that would be created
   - Verify naming conventions

3. **Create Component**
   ```json
   { "name": "MyComponent", ... }
   ```

4. **Test Thoroughly**
   - Unit tests
   - Integration tests
   - UI testing

## Notes

- Aura components are being superseded by Lightning Web Components (LWC)
- Consider using LWC for new development
- Aura still useful for certain features (e.g., quick actions with multiple components)
- All Aura components automatically get a unique auradefinitionid
