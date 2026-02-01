/**
 * Essential Apex coding rules (always enforced)
 */

export const APEX_CORE_RULES = `=== APEX MANDATORY RULES ===

1. **Sharing & Security:**
   - Use "with sharing" by default
   - Check CRUD/FLS permissions before DML
   - Sanitize user inputs in SOQL

2. **Bulk Safety (Governor Limits):**
   - NEVER put queries or DML inside loops
   - Process collections, not single records
   - Use maps for lookups instead of nested queries

3. **Test Coverage:**
   - EVERY Apex class MUST have a test class
   - Minimum 75% coverage required
   - Use @TestSetup for test data
   - Test bulk scenarios (200+ records)

4. **Naming Conventions:**
   - Classes: PascalCase (e.g., AccountTriggerHandler)
   - Methods: camelCase (e.g., handleAfterInsert)
   - Constants: UPPER_SNAKE_CASE
   - Test classes: OriginalNameTest

5. **Critical PMD Rules:**
   - AvoidSoqlInLoops: Query once, filter in memory
   - CyclomaticComplexity: Keep methods simple, max 10 branches
   - ExcessiveParameterList: Max 4 parameters per method`;
