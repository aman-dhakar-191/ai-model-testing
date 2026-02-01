# Modular System Prompt Architecture

## Overview

The system prompt is now **modular** and **compiled from TypeScript files**. This makes it easier to maintain, test, and update specific sections without touching a monolithic prompt.

## Structure

### src/prompts/ - Core System Prompt
Contains the essential instructions that are **always loaded** for the AI to function:

```
src/prompts/
├── base-instructions.ts     # Role, thinking guide, response style
├── apex-core-rules.ts       # Mandatory Apex rules (security, governor limits)
├── tool-calling-format.ts   # XML tool calling format and rules
├── workflow-guide.ts        # Standard development workflows
└── index.ts                 # Combines all sections into SYSTEM_PROMPT
```

**Usage:**
```typescript
import { SYSTEM_PROMPT } from './prompts';
```

### src/tools/ - Tool Instructions
Each tool has its own folder with a `prompt.ts` file containing its instruction:

```
src/tools/
├── discovery/
│   ├── list-instructions/prompt.ts
│   ├── fetch-instruction/prompt.ts
│   ├── list-files/prompt.ts
│   └── read-file/prompt.ts
├── creation/
│   ├── create-apex-class/prompt.ts
│   ├── create-lwc-component/prompt.ts
│   └── write-file/prompt.ts
├── modification/
│   └── edit-file/prompt.ts
├── utility/
│   ├── update-todo-list/prompt.ts
│   ├── execute-command/prompt.ts
│   └── web-fetch/prompt.ts
├── deployment/
│   └── prompt.ts
└── index.ts                 # Combines all tools into ALL_TOOLS_REFERENCE
```

**Benefits:**
- Each tool's instruction is isolated and easy to modify
- Can be unit tested independently
- Future: Could auto-generate from tool implementations
- Clear organization by category

### instruction-guides/ - Task-Specific Guides
These are **fetched dynamically** using the `fetch_instruction` tool when needed:

```
instruction-guides/
├── apex-best-practices.md
├── lwc-standards.md
├── pmd-rules.md
├── project-structure.md
├── fetch-instruction-guide.md
└── index.json              # Catalog of available guides
```

**When to use:**
- Before writing Apex code → fetch `apex-best-practices`
- Before creating LWC → fetch `lwc-standards`
- For code review → fetch `pmd-rules`
- Understanding project layout → fetch `project-structure`

## Key Principles

### ✅ System Prompt (Always Loaded)
- Core AI behavior and capabilities
- Tool calling format
- Essential Apex rules (security, governor limits)
- Standard workflows

### ✅ Task-Specific Guides (Fetch Dynamically)
- Detailed coding standards
- Best practices and patterns
- Project-specific conventions
- Fetched only when relevant to current task

## Adding New Content

### Adding a New Tool
1. Create folder: `src/tools/{category}/{tool-name}/`
2. Create `prompt.ts` with tool instruction
3. Export from category index or create new category
4. Import in `src/tools/index.ts`

### Adding a New Prompt Section
1. Create `src/prompts/new-section.ts`
2. Export a const with the prompt text
3. Import and add to `src/prompts/index.ts`

### Adding a New Task-Specific Guide
1. Create `instruction-guides/new-guide.md`
2. Add entry to `instruction-guides/index.json`
3. AI can now fetch it using `fetch_instruction` tool

## Migration from Old System

### Before (Monolithic)
```typescript
// constants.ts - 200+ lines of mixed content
export const DEFAULT_SETTINGS = {
  systemPrompt: `Long string with everything mixed together...`
}

// tool-usage-guide.md - Duplicated in both places
// instruction-guides/tool-usage-guide.md
```

### After (Modular)
```typescript
// src/prompts/index.ts
import { BASE_INSTRUCTIONS } from './base-instructions';
import { TOOL_CALLING_FORMAT } from './tool-calling-format';
import { ALL_TOOLS_REFERENCE } from '../tools';
// ... compose sections

// constants.ts - Just imports
import { SYSTEM_PROMPT } from '../prompts';
export const DEFAULT_SETTINGS = {
  systemPrompt: SYSTEM_PROMPT,
  // ...
}
```

## Benefits

1. **Maintainability**: Each section can be edited independently
2. **Type Safety**: TypeScript ensures valid imports and exports
3. **Testability**: Individual sections can be tested
4. **Clarity**: Clear separation of concerns
5. **DRY**: Single source of truth for each instruction
6. **Scalability**: Easy to add new tools and sections
7. **Version Control**: Meaningful diffs for specific changes

## Files Removed

- `src/utils/loadSystemPrompt.ts` - No longer needed (static imports)
- `instruction-guides/tool-usage-guide.md` - Moved to `src/tools/**/prompt.ts`
