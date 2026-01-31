# Tool Type Error Fix Documentation

## Problem Statement

When using the Z.AI GLM-4.5-air model (and potentially other models) through OpenRouter, users were encountering the following error:

```json
{
  "error": {
    "code": "1214",
    "message": "Tool type cannot be empty"
  }
}
```

## Root Cause

The issue occurred in multi-turn conversations with tool usage:

1. **Initial Request**: Tools are correctly sent with `type: "function"` in the request
2. **Model Response**: The model responds with tool calls but doesn't include a `type` field in each tool call
3. **Subsequent Request**: When the conversation continues, assistant messages with tool calls are sent back to the API
4. **Error**: The provider expects each tool call to have a `type` field, but our code was forwarding them without this field

### Example

**What we were sending (incorrect):**
```json
{
  "role": "assistant",
  "content": "",
  "tool_calls": [
    {
      "id": "call_123",
      "function": {
        "name": "list_instructions",
        "arguments": "{}"
      }
      // Missing "type": "function"
    }
  ]
}
```

**What we needed to send (correct):**
```json
{
  "role": "assistant",
  "content": "",
  "tool_calls": [
    {
      "id": "call_123",
      "type": "function",
      "function": {
        "name": "list_instructions",
        "arguments": "{}"
      }
    }
  ]
}
```

## Solution

### Changes Made

1. **Updated Type Definition** (`src/types/index.ts`):
   - Added optional `type?: string` field to the `ToolCall` interface
   - This allows storing the type when present but doesn't break existing data

2. **Updated API Message Builder** (`src/utils/api.ts`):
   - Modified the `buildApiMessages` function to ensure tool calls include `type: "function"`
   - Used `.map()` to transform each tool call, adding the type field if missing
   - Preserves any existing type value if already present

### Code Changes

```typescript
// Before
tool_calls: msg.toolCalls,

// After
tool_calls: msg.toolCalls.map(tc => ({
  ...tc,
  type: tc.type || 'function',
})),
```

## Testing

- ✅ Linter passes: `npm run lint`
- ✅ Build succeeds: `npm run build`
- ⚠️ Manual testing required with actual API key to verify error is resolved

## Impact

- **Backward Compatible**: Existing tool calls without a type field will automatically get `type: "function"` added
- **Forward Compatible**: If models start returning tool calls with a type field, we preserve it
- **No Breaking Changes**: The change is purely additive and doesn't affect the rest of the codebase

## Related Files

- `src/types/index.ts` - Type definitions
- `src/utils/api.ts` - API communication logic
- `src/utils/mockTools.ts` - Tool formatting (already had type field in definitions)

## Additional Notes

This fix specifically addresses the Z.AI provider requirements but follows the OpenAI API specification which requires tool calls to have a `type` field. This makes our implementation more compliant with the standard specification.
