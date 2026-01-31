# Salesforce Project Structure Guide

## Standard SFDX Project Layout
```
force-app/
  main/
    default/
      classes/           # Apex classes and triggers
      lwc/               # Lightning Web Components
      aura/              # Aura components (legacy)
      pages/             # Visualforce pages
      objects/            # Custom object definitions
      layouts/            # Page layouts
      flows/              # Flows and process builders
      permissionsets/     # Permission sets
      profiles/           # Profiles
      triggers/           # Apex triggers
      staticresources/    # Static resources (JS, CSS, images)
      tabs/               # Custom tabs
      applications/       # Custom apps
```

## Class Organization
Organize Apex classes by pattern:
```
classes/
  # Service layer — business logic
  AccountService.cls
  ContactService.cls

  # Trigger handlers
  AccountTriggerHandler.cls
  ContactTriggerHandler.cls

  # Controllers (for LWC/VF)
  AccountController.cls
  ContactController.cls

  # Batch/Schedulable/Queueable
  DataCleanupBatch.cls
  DailyReportSchedulable.cls
  EmailQueueable.cls

  # Utilities
  StringUtils.cls
  DateUtils.cls
  SObjectUtils.cls

  # Selectors (SOQL layer)
  AccountSelector.cls
  ContactSelector.cls

  # Domain layer
  Accounts.cls (domain class)

  # Test classes
  AccountServiceTest.cls
  AccountTriggerHandlerTest.cls
  AccountControllerTest.cls
```

## Separation of Concerns
Follow the **Service-Domain-Selector** pattern:
1. **Selector** — All SOQL queries in one place per object
2. **Domain** — Object-specific validation and behavior
3. **Service** — Business logic orchestration
4. **Trigger Handler** — Delegates to service/domain layer

## Naming Conventions Summary
| Type | Convention | Example |
|------|-----------|---------|
| Apex class | PascalCase | `AccountService` |
| Apex test | PascalCase + Test | `AccountServiceTest` |
| Trigger | ObjectTrigger | `AccountTrigger` |
| LWC | camelCase | `contactList` |
| Aura | PascalCase | `ContactManager` |
| VF Page | PascalCase | `AccountOverview` |
| Custom Object | PascalCase + __c | `Invoice__c` |
| Custom Field | PascalCase + __c | `Total_Amount__c` |

## Package.xml
Always maintain a `package.xml` for deployments:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>*</members>
        <name>ApexClass</name>
    </types>
    <types>
        <members>*</members>
        <name>ApexTrigger</name>
    </types>
    <types>
        <members>*</members>
        <name>LightningComponentBundle</name>
    </types>
    <version>59.0</version>
</Package>
```
