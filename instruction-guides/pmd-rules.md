# Salesforce PMD Rules Guide

## What is PMD?
PMD is a static code analysis tool that scans Apex code for potential issues including bugs, security vulnerabilities, and style violations. Salesforce enforces PMD rules in code reviews and CI/CD pipelines.

## Critical Rules (Must Fix)

### ApexCRUDViolation
Enforce CRUD/FLS checks before DML operations.
```apex
// BAD
insert accounts;

// GOOD
if (Schema.sObjectType.Account.isCreateable()) {
    insert accounts;
}
```

### ApexSOQLInjection
Never use unescaped user input in dynamic SOQL.
```apex
// BAD
String query = 'SELECT Id FROM Account WHERE Name = \'' + userInput + '\'';

// GOOD
String query = 'SELECT Id FROM Account WHERE Name = :sanitizedInput';
```

### AvoidDmlStatementsInLoops
Never place DML inside loops.
```apex
// BAD
for (Account acc : accounts) {
    update acc;
}

// GOOD
update accounts;
```

### AvoidSoqlInLoops
Never place SOQL inside loops.
```apex
// BAD
for (Account acc : accounts) {
    List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
}

// GOOD
Map<Id, List<Contact>> contactsByAccount = new Map<Id, List<Contact>>();
for (Contact c : [SELECT Id, AccountId FROM Contact WHERE AccountId IN :accountIds]) {
    if (!contactsByAccount.containsKey(c.AccountId)) {
        contactsByAccount.put(c.AccountId, new List<Contact>());
    }
    contactsByAccount.get(c.AccountId).add(c);
}
```

## High Priority Rules

### ApexUnitTestClassShouldHaveAsserts
Every test method must contain at least one assertion.

### ApexUnitTestShouldNotUseSeeAllDataTrue
Never use `@isTest(seeAllData=true)` — create your own test data.

### CyclomaticComplexity
Keep method complexity below 10. Break complex methods into smaller helpers.

### ExcessiveParameterList
Methods should have fewer than 4 parameters. Use wrapper classes instead.

### NcssMethodCount
Methods should not exceed 40 statements. Refactor long methods.

## Medium Priority Rules

### IfStmtsMustUseBraces / WhileLoopsMustUseBraces / ForLoopsMustUseBraces
Always use braces, even for single-line blocks.

### LocalVariableNamingConventions
Use camelCase for local variables. No underscores or Hungarian notation.

### MethodNamingConventions
Methods must be camelCase. No underscores except in test methods.

### UnusedLocalVariable
Remove any declared but unused variables.

### EmptyCatchBlock
Never silently swallow exceptions. At minimum, log the error.

## Suppressing Rules
Use `@SuppressWarnings` only when justified with a comment:
```apex
@SuppressWarnings('PMD.ApexCRUDViolation') // System context - internal batch job
public class DataCleanupBatch implements Database.Batchable<SObject> { }
```

## CI/CD Integration
Run PMD in your deployment pipeline:
```bash
pmd check -d force-app -R rulesets/apex/quickstart.xml -f text
```
