# Apex Best Practices

## Governor Limits
- Never perform SOQL queries inside loops
- Never perform DML operations inside loops
- Bulkify all trigger handlers — process `List<SObject>` not single records
- Stay within 100 SOQL queries, 150 DML statements per transaction
- Limit heap size to 6MB (sync) / 12MB (async)

## Trigger Framework
- One trigger per object, delegating to a handler class
- Use `before` triggers for field validation/defaulting
- Use `after` triggers for related record operations
- Always check `Trigger.isInsert`, `Trigger.isUpdate`, etc.

```apex
trigger AccountTrigger on Account (before insert, before update, after insert, after update) {
    AccountTriggerHandler handler = new AccountTriggerHandler();
    if (Trigger.isBefore && Trigger.isInsert) handler.beforeInsert(Trigger.new);
    if (Trigger.isBefore && Trigger.isUpdate) handler.beforeUpdate(Trigger.new, Trigger.oldMap);
    if (Trigger.isAfter && Trigger.isInsert) handler.afterInsert(Trigger.new);
    if (Trigger.isAfter && Trigger.isUpdate) handler.afterUpdate(Trigger.new, Trigger.oldMap);
}
```

## Security
- Always use `with sharing` unless explicitly needed otherwise
- Enforce CRUD/FLS checks: `Schema.sObjectType.Account.isAccessible()`
- Use `stripInaccessible()` for field-level security
- Never hardcode IDs or credentials

## Naming Conventions
- Classes: PascalCase (`AccountService`, `ContactTriggerHandler`)
- Methods: camelCase (`getActiveAccounts`, `validateInput`)
- Constants: UPPER_SNAKE (`MAX_RETRY_COUNT`)
- Test classes: `<ClassName>Test` (`AccountServiceTest`)

## Error Handling
- Use custom exceptions for business logic errors
- Log errors to a custom object or platform event
- Never swallow exceptions silently

## Test Classes
- Minimum 75% coverage, aim for 90%+
- Test positive, negative, and bulk scenarios
- Use `@TestSetup` for shared test data
- Use `System.assertEquals` with meaningful messages
- Never use `seeAllData=true`

```apex
@isTest
private class AccountServiceTest {
    @TestSetup
    static void setup() {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 200; i++) {
            accounts.add(new Account(Name = 'Test Account ' + i));
        }
        insert accounts;
    }

    @isTest
    static void testBulkUpdate() {
        List<Account> accounts = [SELECT Id, Name FROM Account];
        Test.startTest();
        AccountService.updateAccounts(accounts);
        Test.stopTest();
        // Assert results
    }
}
```
