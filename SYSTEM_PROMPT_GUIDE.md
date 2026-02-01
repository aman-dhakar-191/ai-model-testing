# System Prompt Guide

## Overview

The system prompt is the foundational instruction set given to the AI model. It should contain **usage guides** that teach the AI how to use the tool system, NOT the actual coding standards (those are fetched via `fetch_instruction` tool).

## What SHOULD be in System Prompt

### ✅ 1. Thinking Mode Guide
- How to use `<think>` tags
- When to think (only for complex tasks)
- Keep thinking brief (4-5 sentences max)
- Structure: Task → Approach → Tools needed

### ✅ 2. Core Coding Standards (Brief Summary)
- Governor limits reminder
- Trigger pattern (one per object, delegate to handler)
- Security basics (with sharing, CRUD/FLS)
- Naming conventions
- Testing requirements (75% coverage minimum)
- Critical PMD rules

### ✅ 3. Tool Calling Guide
- XML format: `<tool_call><tool_name>...</tool_name><arguments>{...}</arguments></tool_call>`
- Write tool calls in response content, NOT in thinking blocks
- Arguments must be valid JSON
- Sequential workflow: Check → Read → Create/Modify
- Always use `list_files` before creating
- Handle errors properly

### ✅ 4. Fetch Instruction Guide
- Use `list_instructions` to discover available guides
- Use `fetch_instruction` to load full guide content
- When to fetch (before generating Apex, LWC, Aura code)
- Apply fetched standards in generated code

### ✅ 5. Available Tools Reference
- Quick list of tool names and purposes
- Required paths for Salesforce (force-app/main/default/...)
- Workflow examples

## What should NOT be in System Prompt

### ❌ Full Instruction Guides Content
These should be fetched dynamically using `fetch_instruction`:
- **apex-best-practices.md** - Detailed Apex coding standards
- **pmd-rules.md** - Complete PMD rule list
- **lwc-standards.md** - LWC best practices
- **project-structure.md** - Project organization

**Why?**
- Keeps system prompt concise (better performance, lower token usage)
- Guides can be updated without changing system prompt
- AI only loads guides relevant to current task
- User can add custom guides without modifying core prompt

## Current Implementation

The system prompt is defined in [src/utils/constants.ts](../src/utils/constants.ts) as `DEFAULT_SETTINGS.systemPrompt`.

It contains:
1. **THINKING MODE GUIDE** - Lines 51-63
2. **APEX CODING STANDARDS (Brief)** - Lines 65-101
3. **TOOL CALLING GUIDE** - Lines 103-150
4. **WORKFLOW** - Lines 217-224
5. **ERROR HANDLING** - Lines 226-230
6. **CODE STANDARDS** - Lines 232-237

## UI Guides (Settings Panel)

The Settings panel shows three collapsible guides to help users understand the system:

### 1. Tool Calling Guide ([ToolGuide.tsx](../src/components/ToolGuide.tsx))
- Shows XML format with examples
- Lists available tools
- Best practices for tool usage
- Displayed in Settings → Tool Calling Guide

### 2. Thinking Mode Guide ([ThinkingGuide.tsx](../src/components/ThinkingGuide.tsx))
- Explains `<think>` tags
- Provides system prompt templates users can copy
- Shows examples of good vs bad thinking
- Displayed in Settings → Thinking Mode Guide

### 3. Fetch Instruction Guide ([FetchInstructionGuide.tsx](../src/components/FetchInstructionGuide.tsx))
- Explains instruction guides concept
- Shows how to use `list_instructions` and `fetch_instruction` tools
- Lists available guides
- Instructions for adding new guides
- Displayed in Settings → Instruction Guides

**Important:** These UI guides are for **user reference only**. The AI receives equivalent content through the system prompt in constants.ts.

## Workflow Example

### User Request: "Create an Account trigger that creates a Contact"

1. **AI thinks** (in `<think>` tags):
   ```
   Task: Create Account trigger with Contact creation
   Approach: Check existing triggers, fetch Apex standards, create handler class
   Tools: list_files, fetch_instruction, create_apex_class
   ```

2. **AI checks files**:
   ```xml
   <tool_call>
   <tool_name>list_files</tool_name>
   <arguments>{"path": "force-app/main/default/triggers"}</arguments>
   </tool_call>
   ```

3. **AI fetches standards**:
   ```xml
   <tool_call>
   <tool_name>fetch_instruction</tool_name>
   <arguments>{"guideId": "apex-best-practices"}</arguments>
   </tool_call>
   ```

4. **AI creates code** (following fetched standards):
   ```xml
   <tool_call>
   <tool_name>create_apex_class</tool_name>
   <arguments>{
     "className": "AccountTriggerHandler",
     "content": "public with sharing class AccountTriggerHandler {...}"
   }</arguments>
   </tool_call>
   ```

## Maintaining the System Prompt

### When to Update System Prompt
- Tool calling format changes
- New critical tool is added
- Workflow best practices change
- Thinking guidelines need adjustment

### When to Update Instruction Guides
- Apex/LWC coding standards evolve
- PMD rules change
- Project-specific standards added
- Framework-specific best practices

### Testing Changes
1. Update [src/utils/constants.ts](../src/utils/constants.ts)
2. Restart the app
3. Create new chat (new chats use updated prompt)
4. Test tool calling, thinking, and instruction fetching
5. Verify AI follows the updated guidelines

## Summary

| Content Type | Location | Purpose |
|--------------|----------|---------|
| System Prompt | `src/utils/constants.ts` | Core AI behavior, tool usage, brief standards |
| Instruction Guides | `instruction-guides/*.md` | Detailed coding standards (fetched on demand) |
| UI Guides | `src/components/*Guide.tsx` | User reference/documentation |

**Key Principle:** System prompt teaches **how to use tools**. Instruction guides provide **what standards to follow**.
