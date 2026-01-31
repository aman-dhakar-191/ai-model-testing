# Fetch Instruction Tool Guide

## Overview
The `fetch_instruction` tool lets the AI dynamically load instruction guides from the repository at runtime. This enables context-aware code generation — the AI reads the relevant standards before writing code.

## Available Tools

### `list_instructions`
Lists all available instruction guides from the repository.

**Parameters:** None

**Returns:**
```json
{
  "available_guides": [
    {
      "id": "apex-best-practices",
      "title": "Apex Best Practices",
      "description": "Governor limits, trigger framework, security..."
    }
  ],
  "usage": "Call fetch_instruction with a guide_id to load the full guide content."
}
```

### `fetch_instruction`
Fetches the full content of a specific guide by its ID.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guide_id` | string | Yes | The ID of the guide to fetch |

**Returns:**
```json
{
  "guide_id": "apex-best-practices",
  "title": "Apex Best Practices",
  "content": "# Apex Best Practices\n\n## Governor Limits\n..."
}
```

## How the AI Uses These Tools

### Automatic Flow
1. User sends a request (e.g., "Create an Apex trigger for Account")
2. AI calls `list_instructions` to see what guides are available
3. AI decides which guides are relevant to the task
4. AI calls `fetch_instruction` for each relevant guide
5. AI reads the guide content and applies the standards
6. The final response message shows an "Instructions Used" block listing which guides were loaded

### Example Interaction
```
User: "Create a batch Apex class to clean up old records"

AI thinks: This needs Apex code. Let me check available guidelines.
AI calls: list_instructions()
AI calls: fetch_instruction(guide_id="apex-best-practices")
AI calls: fetch_instruction(guide_id="pmd-rules")
AI response: [Instructions Used: Apex Best Practices, PMD Rules]
             Here's your batch class following all the standards...
```

## Adding New Guides

### Step 1: Create the Guide File
Create a new `.md` file in the `instruction-guides/` directory:
```
instruction-guides/my-new-guide.md
```

### Step 2: Update the Index
Add an entry to `instruction-guides/index.json`:
```json
{
  "id": "my-new-guide",
  "filename": "my-new-guide.md",
  "title": "My New Guide",
  "description": "Short description of what this guide covers"
}
```

### Step 3: Commit and Push
Push to the `main` branch. The tool fetches from:
```
https://raw.githubusercontent.com/aman-dhakar-191/ai-model-testing/main/instruction-guides/
```

## System Prompt Integration

To make the AI always check for relevant instructions before starting a task, add this to your system prompt:

```
Before starting any code generation task:
1. Call list_instructions to see available guides
2. Fetch all guides relevant to the current request
3. Apply the standards from the fetched guides in your code
4. If no guides are relevant, proceed without fetching
```

## Tips
- Guides are **cached in memory** during a session — repeated fetches of the same guide are instant
- The AI only fetches guides it deems relevant — it won't load all guides for every request
- The "Instructions Used" block appears at the top of the assistant's final response
- These tools are **always available** — they're built-in alongside any user-defined tools
- You can have both instruction tools and custom tools (e.g., `create_apex_class`) active simultaneously
