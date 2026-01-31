# Create LWC Component Tool

## Overview
Creates Lightning Web Component bundles with HTML template, JavaScript controller, CSS styles, meta.xml configuration, and optional Apex controller.

## Tool Name
`create_lwc_component`

## Parameters

### Required
- **name** (string): Component name
  - Folder naming: kebab-case (e.g., `account-card`, `contact-list`)
  - JS class naming: camelCase (e.g., `AccountCard`, `ContactList`)
  
- **html** (string): HTML template content
  
- **javascript** (string): JavaScript controller content
  
- **meta_xml** (string): Component configuration (js-meta.xml)

### Optional
- **css** (string): CSS styles for the component
  
- **is_create_apex_controller** (boolean): Create backing Apex controller
  - Default: false
  
- **apex_controller_name** (string): Apex controller class name
  - Required if is_create_apex_controller = true
  - Example: `AccountCardController`
  
- **apex_controller_body** (string): Full Apex controller class body
  - Required if is_create_apex_controller = true
  
- **dry_run** (boolean): Preview without creating files
  - Default: false
  
- **overwrite** (boolean): Overwrite existing files
  - Default: false

## File Structure Created

### Basic LWC
```
force-app/main/default/lwc/{name}/
├── {name}.html
├── {name}.js
├── {name}.js-meta.xml
└── {name}.css (if provided)
```

### With Apex Controller
```
force-app/main/default/lwc/{name}/
├── {name}.html
├── {name}.js
├── {name}.js-meta.xml
├── {name}.css
force-app/main/default/classes/
├── {apex_controller_name}.cls
└── {apex_controller_name}.cls-meta.xml
```

## Example Usage

### Example 1: Basic Display Component
```json
{
  "name": "accountCard",
  "html": "<template>\n    <lightning-card title=\"Account Details\">\n        <div class=\"slds-p-around_medium\">\n            <p>{accountName}</p>\n        </div>\n    </lightning-card>\n</template>",
  "javascript": "import { LightningElement, api } from 'lwc';\n\nexport default class AccountCard extends LightningElement {\n    @api accountName;\n}",
  "meta_xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<LightningComponentBundle xmlns=\"http://soap.sforce.com/2006/04/metadata\">\n    <apiVersion>61.0</apiVersion>\n    <isExposed>true</isExposed>\n    <targets>\n        <target>lightning__RecordPage</target>\n    </targets>\n</LightningComponentBundle>",
  "css": ".account-card { padding: 10px; }"
}
```

### Example 2: Component with Apex Controller
```json
{
  "name": "contactList",
  "html": "<template>\n    <lightning-card title=\"Contacts\">\n        <template if:true={contacts}>\n            <template for:each={contacts} for:item=\"contact\">\n                <div key={contact.Id}>\n                    {contact.Name}\n                </div>\n            </template>\n        </template>\n    </lightning-card>\n</template>",
  "javascript": "import { LightningElement, wire } from 'lwc';\nimport getContacts from '@salesforce/apex/ContactListController.getContacts';\n\nexport default class ContactList extends LightningElement {\n    contacts;\n\n    @wire(getContacts)\n    wiredContacts({ error, data }) {\n        if (data) {\n            this.contacts = data;\n        }\n    }\n}",
  "meta_xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<LightningComponentBundle xmlns=\"http://soap.sforce.com/2006/04/metadata\">\n    <apiVersion>61.0</apiVersion>\n    <isExposed>true</isExposed>\n    <targets>\n        <target>lightning__AppPage</target>\n    </targets>\n</LightningComponentBundle>",
  "is_create_apex_controller": true,
  "apex_controller_name": "ContactListController",
  "apex_controller_body": "public with sharing class ContactListController {\n    @AuraEnabled(cacheable=true)\n    public static List<Contact> getContacts() {\n        return [SELECT Id, Name, Email FROM Contact LIMIT 10];\n    }\n}"
}
```

## Response Format

### Success
```json
{
  "status": "success",
  "message": "LWC component created successfully",
  "files_created": [
    "force-app/main/default/lwc/accountCard/accountCard.html",
    "force-app/main/default/lwc/accountCard/accountCard.js",
    "force-app/main/default/lwc/accountCard/accountCard.js-meta.xml",
    "force-app/main/default/lwc/accountCard/accountCard.css"
  ],
  "dry_run": false
}
```

## LWC Structure Guidelines

### HTML Template
- Use `<template>` as root element
- Use SLDS classes for styling
- Use `if:true`, `if:false` for conditional rendering
- Use `for:each`, `iterator` for lists

### JavaScript Controller
```javascript
import { LightningElement, api, track, wire } from 'lwc';

export default class ComponentName extends LightningElement {
    // Public properties (exposed to parent)
    @api publicProp;
    
    // Reactive properties
    @track trackedProp = [];
    
    // Wire service
    @wire(wireAdapter)
    wiredMethod({ error, data }) {
        // Handle response
    }
    
    // Event handlers
    handleClick(event) {
        // Handle click
    }
}
```

### Meta.xml Targets
Common targets:
- `lightning__AppPage` - Lightning App Builder
- `lightning__RecordPage` - Record pages
- `lightning__HomePage` - Home pages
- `lightning__Tab` - Custom tabs
- `lightningCommunity__Page` - Experience Cloud

### CSS Styling
- Scoped to component automatically
- Use `:host` for component container
- Import SLDS via `@salesforce/resourceUrl`

## Best Practices
1. **Naming**: Use kebab-case for folders, camelCase for JS classes
2. **API Version**: Use latest (currently 61.0)
3. **Wire Service**: Use `cacheable=true` for read-only Apex methods
4. **Error Handling**: Always handle wire service errors
5. **Security**: Use `with sharing` in Apex controllers
6. **Testing**: Create Jest tests for complex logic
7. **Accessibility**: Add ARIA labels and roles

## Common Patterns

### Data Display
- Purpose: Show records
- Pattern: Wire service + template iteration

### Form Input
- Purpose: Collect data
- Pattern: lightning-record-edit-form or custom inputs

### Modal/Popup
- Purpose: Display overlay content
- Pattern: lightning-modal + events

### Parent-Child Communication
- Purpose: Share data between components
- Pattern: @api properties + custom events
