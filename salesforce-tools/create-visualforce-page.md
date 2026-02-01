# Create Visualforce Page Tool

## Overview
Creates Visualforce pages with optional custom Apex controllers and meta.xml configuration.

## Tool Name
`create_visualforce_page`

## Parameters

### Required
- **page_name** (string): PascalCase page name
  - Example: `AccountOverview`, `ContactDetail`, `CustomReport`
  
- **markup** (string): Full Visualforce page markup including `<apex:page>` tags

### Optional
- **controller_name** (string): Name of custom Apex controller
  - Example: `AccountOverviewController`
  
- **controller_body** (string): Full Apex controller class body
  - Required if controller_name is provided
  
- **extensions** (array): Apex extension classes
  - Example: `["AccountExtension", "UtilityExtension"]`
  
- **dry_run** (boolean): Preview without creating files
  - Default: false
  
- **overwrite** (boolean): Overwrite existing files
  - Default: false

## File Structure Created

### Page Only
```
force-app/main/default/pages/
├── {page_name}.page
└── {page_name}.page-meta.xml
```

### Page with Controller
```
force-app/main/default/pages/
├── {page_name}.page
├── {page_name}.page-meta.xml
force-app/main/default/classes/
├── {controller_name}.cls
└── {controller_name}.cls-meta.xml
```

## Example Usage

### Example 1: Simple Display Page
```json
{
  "page_name": "AccountList",
  "markup": "<apex:page>\n    <apex:pageBlock title=\"Accounts\">\n        <apex:pageBlockTable value=\"{!accounts}\" var=\"acc\">\n            <apex:column value=\"{!acc.Name}\"/>\n            <apex:column value=\"{!acc.Industry}\"/>\n        </apex:pageBlockTable>\n    </apex:pageBlock>\n</apex:page>"
}
```

### Example 2: Page with Custom Controller
```json
{
  "page_name": "AccountDashboard",
  "markup": "<apex:page controller=\"AccountDashboardController\">\n    <apex:form>\n        <apex:pageBlock title=\"Account Dashboard\">\n            <apex:pageBlockSection>\n                <apex:outputText value=\"Total Accounts: {!totalAccounts}\"/>\n            </apex:pageBlockSection>\n            <apex:pageBlockTable value=\"{!topAccounts}\" var=\"acc\">\n                <apex:column value=\"{!acc.Name}\"/>\n                <apex:column value=\"{!acc.AnnualRevenue}\"/>\n            </apex:pageBlockTable>\n        </apex:pageBlock>\n    </apex:form>\n</apex:page>",
  "controller_name": "AccountDashboardController",
  "controller_body": "public class AccountDashboardController {\n    public Integer totalAccounts { get; set; }\n    public List<Account> topAccounts { get; set; }\n    \n    public AccountDashboardController() {\n        totalAccounts = [SELECT COUNT() FROM Account];\n        topAccounts = [SELECT Id, Name, AnnualRevenue \n                      FROM Account \n                      ORDER BY AnnualRevenue DESC \n                      LIMIT 10];\n    }\n}"
}
```

### Example 3: Standard Controller with Extensions
```json
{
  "page_name": "AccountDetail",
  "markup": "<apex:page standardController=\"Account\" extensions=\"AccountExtension\">\n    <apex:pageBlock title=\"Account Details\">\n        <apex:pageBlockSection>\n            <apex:outputField value=\"{!Account.Name}\"/>\n            <apex:outputField value=\"{!Account.Industry}\"/>\n            <apex:outputText value=\"Custom Field: {!customValue}\"/>\n        </apex:pageBlockSection>\n    </apex:pageBlock>\n</apex:page>",
  "extensions": ["AccountExtension"]
}
```

## Return Values

### Success Response
```json
{
  "status": "success",
  "message": "Visualforce page created successfully",
  "files_created": [
    "force-app/main/default/pages/AccountDashboard.page",
    "force-app/main/default/pages/AccountDashboard.page-meta.xml",
    "force-app/main/default/classes/AccountDashboardController.cls",
    "force-app/main/default/classes/AccountDashboardController.cls-meta.xml"
  ],
  "dry_run": false
}
```

### Dry Run Response
```json
{
  "status": "success",
  "message": "DRY RUN - Would create Visualforce page",
  "files_created": [
    "force-app/main/default/pages/AccountDashboard.page",
    "force-app/main/default/pages/AccountDashboard.page-meta.xml"
  ],
  "dry_run": true
}
```

## Best Practices

1. **Controller Types**
   - **Standard Controller**: Use for single object CRUD operations
   - **Custom Controller**: Use for complex business logic
   - **Controller Extensions**: Extend standard controllers with custom methods

2. **Naming Convention**
   - Pages: PascalCase (e.g., `AccountOverview`)
   - Controllers: Match page name + "Controller" suffix

3. **Security**
   - Use `with sharing` in controllers to enforce sharing rules
   - Validate user input in controller methods
   - Use field-level security checks

4. **Performance**
   - Minimize view state size
   - Use transient variables when possible
   - Implement pagination for large datasets
   - Use lazy loading for expensive operations

5. **Modern Alternatives**
   - Consider Lightning Web Components for new features
   - Use Visualforce for:
     - PDF generation
     - Complex custom rendering
     - Legacy system integration
     - Email templates

## Common Visualforce Components

### Display Components
- `<apex:outputText>` - Display text
- `<apex:outputField>` - Display field with formatting
- `<apex:pageBlock>` - Standard Salesforce styling
- `<apex:pageBlockTable>` - Data table

### Input Components
- `<apex:inputField>` - Input with type awareness
- `<apex:inputText>` - Text input
- `<apex:commandButton>` - Action button
- `<apex:actionSupport>` - AJAX actions

### Action Components
- `<apex:commandButton>` - Submit button
- `<apex:commandLink>` - Action link
- `<apex:actionFunction>` - JavaScript callable action

## Controller Patterns

### Standard Controller
```apex
// No custom controller needed, use standardController attribute
<apex:page standardController="Account">
```

### Custom Controller
```apex
public class MyController {
    public String myProperty { get; set; }
    
    public MyController() {
        // Constructor
    }
    
    public PageReference doAction() {
        // Action method
        return null;
    }
}
```

### Controller Extension
```apex
public class MyExtension {
    private final Account acct;
    
    public MyExtension(ApexPages.StandardController stdController) {
        this.acct = (Account)stdController.getRecord();
    }
    
    public String getCustomValue() {
        return 'Custom: ' + acct.Name;
    }
}
```

## Workflow

1. **Plan Page Structure**
   - Identify data requirements
   - Choose controller type
   - Design layout

2. **Use Dry Run**
   ```json
   { "page_name": "MyPage", "dry_run": true, ... }
   ```

3. **Create Page**
   ```json
   { "page_name": "MyPage", ... }
   ```

4. **Test**
   - Preview in browser
   - Test all actions
   - Verify security

5. **Deploy**
   - Add to permission sets
   - Update navigation

## Notes

- Visualforce pages have a 15 MB view state limit
- Use `transient` keyword for variables not needed in view state
- PDF rendering uses a subset of Visualforce components
- Mobile optimization requires responsive design techniques
