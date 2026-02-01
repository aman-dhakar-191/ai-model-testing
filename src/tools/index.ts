/**
 * Combines all tool prompts into a complete tool reference
 */

// Discovery tools
import { LIST_INSTRUCTIONS_PROMPT } from './discovery/list-instructions/prompt';
import { FETCH_INSTRUCTION_PROMPT } from './discovery/fetch-instruction/prompt';
import { LIST_FILES_PROMPT } from './discovery/list-files/prompt';
import { READ_FILE_PROMPT } from './discovery/read-file/prompt';

// Creation tools
import { CREATE_APEX_CLASS_PROMPT } from './creation/create-apex-class/prompt';
import { CREATE_LWC_COMPONENT_PROMPT } from './creation/create-lwc-component/prompt';
import { WRITE_FILE_PROMPT } from './creation/write-file/prompt';

// Modification tools
import { EDIT_FILE_PROMPT } from './modification/edit-file/prompt';

// Utility tools
import { UPDATE_TODO_LIST_PROMPT } from './utility/update-todo-list/prompt';
import { EXECUTE_COMMAND_PROMPT } from './utility/execute-command/prompt';
import { WEB_FETCH_PROMPT } from './utility/web-fetch/prompt';

// Deployment tools
import { DEPLOYMENT_TOOLS_PROMPT } from './deployment/prompt';

export const ALL_TOOLS_REFERENCE = `
=== COMPLETE TOOL REFERENCE ===

## Discovery Tools

${LIST_INSTRUCTIONS_PROMPT}

${FETCH_INSTRUCTION_PROMPT}

${LIST_FILES_PROMPT}

${READ_FILE_PROMPT}

## Creation Tools

${CREATE_APEX_CLASS_PROMPT}

${CREATE_LWC_COMPONENT_PROMPT}

${WRITE_FILE_PROMPT}

## Modification Tools

${EDIT_FILE_PROMPT}

## Utility Tools

${UPDATE_TODO_LIST_PROMPT}

${EXECUTE_COMMAND_PROMPT}

${WEB_FETCH_PROMPT}

## Deployment Tools

${DEPLOYMENT_TOOLS_PROMPT}

## Best Practices

1. **Always list before creating** - Prevents "file exists" errors
2. **Fetch standards first** - Use fetch_instruction for coding guidelines
3. **Use full paths** - Always "force-app/main/default/classes/", never shortcuts
4. **Pure XML format** - No JSON, no need to escape quotes or newlines
5. **Sequential calls** - One tool at a time, wait for result
6. **Update todos** - Track progress for multi-step tasks
7. **Create tests** - Every Apex class needs test coverage
8. **Bulk operations** - Process lists, not single records
9. **Security** - Use "with sharing", check CRUD/FLS
10. **Read before edit** - Understand existing code before modifying
`;
