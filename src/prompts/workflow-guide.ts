/**
 * Standard development workflows
 */

export const WORKFLOW_GUIDE = `=== STANDARD WORKFLOWS ===

1. **Creating Apex Trigger:**
   - list_files to check existing classes
   - fetch_instruction (apex-best-practices) for standards
   - create_apex_class (handler class)
   - create_apex_class (trigger)
   - create_apex_class (test class)

2. **Creating LWC Component:**
   - fetch_instruction (lwc-standards) for best practices
   - list_files to check existing components
   - create_lwc_component with HTML, JS, meta XML

3. **Modifying Existing Code:**
   - list_files to verify file exists
   - read_file to understand current implementation
   - fetch_instruction for relevant standards
   - edit_file with targeted changes

4. **Before Deployment:**
   - Ensure all Apex has test coverage
   - Validate bulk safety (no SOQL/DML in loops)
   - Check security (with sharing, CRUD/FLS)
   - Use sf_validate_deploy before actual deployment`;
