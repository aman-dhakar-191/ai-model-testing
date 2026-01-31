# Service Layer Architecture

This document describes the new modular service architecture implemented to improve scalability, maintainability, and testability.

## 📁 Structure

```
src/services/
├── EventBus.ts              # Pub/Sub event system
├── ErrorHandler.ts          # Centralized error handling
├── ToolRegistry.ts          # Dynamic tool registration
├── ToolMiddleware.ts        # Execution pipeline
├── ToolOrchestrator.ts      # Tool chain orchestration
├── ServiceInitializer.ts    # Service setup
├── MIGRATION_GUIDE.tsx      # Integration examples
└── index.ts                 # Public API exports
```

---

## 🏗️ Architecture Overview

### Before (Monolithic)
```
App.tsx (450 lines)
├── Tool execution logic (150 lines)
├── Error handling (scattered)
├── State management
└── UI rendering
```

### After (Modular)
```
App.tsx (reduced to ~250 lines)
├── UI logic only
└── Event subscriptions

Services Layer
├── ToolOrchestrator (business logic)
├── ToolRegistry (tool management)
├── ToolMiddleware (preprocessing)
├── ErrorHandler (error management)
└── EventBus (cross-component communication)
```

---

## 🔧 Core Services

### 1. EventBus
**Purpose:** Decoupled cross-component communication

**Features:**
- Type-safe event system
- Subscribe/unsubscribe pattern
- Automatic error handling in listeners
- Once-only subscriptions

**Usage:**
```typescript
import { eventBus, AppEvents } from './services/EventBus';

// Subscribe to events
const subscription = eventBus.on(AppEvents.TOOL_EXECUTION_START, (data) => {
  console.log('Tool started:', data.toolName);
});

// Emit events
eventBus.emit(AppEvents.TOOL_EXECUTION_SUCCESS, { toolName: 'create_apex_class' });

// Unsubscribe
subscription.unsubscribe();
```

**Available Events:**
- `TOOL_EXECUTION_START` - Tool execution begins
- `TOOL_EXECUTION_SUCCESS` - Tool executed successfully
- `TOOL_EXECUTION_ERROR` - Tool execution failed
- `TOOL_EXECUTION_COMPLETE` - Tool execution finished (success or failure)
- `CHAT_MESSAGE_SENT` - User sent a message
- `CHAT_MESSAGE_RECEIVED` - AI response received
- `ORG_CHANGED` - Salesforce org changed
- `ERROR_OCCURRED` - Error occurred anywhere in the app
- `SETTINGS_CHANGED` - Settings updated

---

### 2. ErrorHandler
**Purpose:** Consistent error handling and user-friendly messages

**Features:**
- Error severity levels (INFO, WARNING, ERROR, CRITICAL)
- Error logging with history
- Context-aware error messages
- Automatic event emission

**Usage:**
```typescript
import { errorHandler, ErrorSeverity } from './services/ErrorHandler';

// Handle generic error
errorHandler.handle(error, 'User action failed', ErrorSeverity.ERROR);

// Handle specific error types
errorHandler.handleToolError('create_apex_class', error, true);
errorHandler.handleApiError(error, true);
errorHandler.handleSfCliError('deploy', error);
errorHandler.handleFileSystemError('write', '/path/to/file', error);

// Get recent errors
const errors = errorHandler.getRecentErrors(10);
```

---

### 3. ToolRegistry
**Purpose:** Dynamic tool management with dependency injection

**Features:**
- Category-based tool organization
- Priority-based tool ordering
- Dynamic registration/unregistration
- Fast tool lookup (O(1))
- Tool execution with automatic error handling

**Usage:**
```typescript
import { toolRegistry } from './services/ToolRegistry';

// Register tools
toolRegistry.register(
  'custom',                    // Category name
  'Custom user tools',         // Description
  customTools,                 // ToolDefinition[]
  executeCustomTool,           // Executor function
  50                           // Priority (higher = first)
);

// Get all tools
const allTools = toolRegistry.getAllTools();

// Execute tool
const result = await toolRegistry.executeTool('create_apex_class', argsJson);

// Check if tool exists
if (toolRegistry.hasTool('my_tool')) {
  // ...
}

// Get stats
console.log(toolRegistry.getStats());
// { categoryCount: 4, toolCount: 25, categories: [...] }
```

---

### 4. ToolMiddleware
**Purpose:** Execution pipeline for preprocessing, validation, and monitoring

**Features:**
- Middleware chain pattern
- Built-in middleware for common tasks
- Custom middleware support
- Performance monitoring
- Automatic error handling
- Retry logic
- Timeout protection

**Usage:**
```typescript
import { 
  toolMiddleware, 
  loggingMiddleware, 
  eventMiddleware, 
  retryMiddleware 
} from './services/ToolMiddleware';

// Register middleware (order matters!)
toolMiddleware.use(loggingMiddleware);
toolMiddleware.use(eventMiddleware);
toolMiddleware.use(retryMiddleware(3, 1000)); // 3 retries, 1s delay

// Execute with middleware
const result = await toolMiddleware.execute(
  'create_apex_class',
  argsJson,
  () => actualExecutor(name, args)
);

// Custom middleware
const customMiddleware = async (context, next) => {
  console.log('Before:', context.toolName);
  const result = await next();
  console.log('After:', context.toolName);
  return result;
};

toolMiddleware.use(customMiddleware);
```

**Built-in Middleware:**
- `loggingMiddleware` - Console logging
- `eventMiddleware` - Event emission
- `validationMiddleware` - Input validation
- `errorHandlingMiddleware` - Error handling
- `performanceMiddleware` - Performance monitoring
- `retryMiddleware(retries, delay)` - Retry on failure
- `timeoutMiddleware(ms)` - Timeout protection

---

### 5. ToolOrchestrator
**Purpose:** Manage complex tool execution chains with AI interaction

**Features:**
- Multi-round tool execution
- Automatic message threading
- Instruction tracking
- Abort signal support
- Streaming support
- Clean separation from UI

**Usage:**
```typescript
import { toolOrchestrator } from './services/ToolOrchestrator';

const result = await toolOrchestrator.executeChain(
  userMessage,              // User's message
  existingMessages,         // Message history
  settings,                 // Chat settings
  allTools,                 // Available tools
  {
    maxRounds: 10,          // Max tool execution rounds
    onStreamToken: (token) => setStreaming(token),
    signal: abortSignal     // AbortSignal for cancellation
  }
);

// Result contains:
// - messages: New messages added
// - toolResults: Tool execution results
// - fetchedInstructions: Instruction guides fetched
// - error: Error message if failed
```

---

## 🚀 Getting Started

### 1. Initialize Services

In your `App.tsx`:

```typescript
import { initializeServices } from './services/ServiceInitializer';

function App() {
  useEffect(() => {
    // Initialize all services once
    initializeServices();
    
    return () => {
      // Cleanup
      eventBus.clear();
      toolRegistry.clear();
    };
  }, []);
  
  // ... rest of your app
}
```

### 2. Register Custom Tools

```typescript
import { registerCustomTools } from './services/ServiceInitializer';

// When custom tools change
useEffect(() => {
  const executor = async (name: string, args: string) => {
    // Your execution logic
    return JSON.stringify({ result: 'done' });
  };
  
  registerCustomTools(customTools, executor);
}, [customTools]);
```

### 3. Send Messages with Orchestrator

```typescript
const handleSendMessage = async (content: string) => {
  const userMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    timestamp: Date.now(),
  };
  
  const result = await toolOrchestrator.executeChain(
    userMessage,
    activeChat.messages,
    activeChat.settings,
    toolRegistry.getAllTools(), // Get all registered tools
    {
      maxRounds: 10,
      onStreamToken: setStreamingContent,
      signal: abortController.signal,
    }
  );
  
  // Update UI with result.messages
};
```

### 4. Subscribe to Events

```typescript
useEffect(() => {
  const subscription = eventBus.on(AppEvents.TOOL_EXECUTION_START, (data) => {
    setExecutingTool(data.toolName);
  });
  
  return () => subscription.unsubscribe();
}, []);
```

---

## 📊 Benefits

### Code Quality
- ✅ **Reduced Complexity**: App.tsx from 450 → ~250 lines
- ✅ **Single Responsibility**: Each service has one job
- ✅ **Testability**: Services are independently testable
- ✅ **Reusability**: Services can be used across components

### Performance
- ✅ **Monitoring**: Built-in performance tracking
- ✅ **Optimization**: Middleware can cache/optimize
- ✅ **Memory**: Better resource management

### Developer Experience
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Debugging**: Clear execution flow
- ✅ **Error Messages**: Context-aware errors
- ✅ **Logging**: Structured logging

### Scalability
- ✅ **Add Tools**: Just register new categories
- ✅ **Add Middleware**: Plug in new preprocessing
- ✅ **Add Events**: Define new event types
- ✅ **Add Services**: Easy to extend

---

## 🔄 Migration Path

### Phase 1: Setup (0 breaking changes)
1. Add service files to `src/services/`
2. Initialize services in App.tsx
3. Services run alongside existing code

### Phase 2: Gradual Adoption (incremental)
1. Replace error handling with `errorHandler`
2. Subscribe to events in components
3. Use `toolRegistry.getAllTools()` instead of manual arrays

### Phase 3: Full Integration (complete)
1. Replace tool execution logic with `toolOrchestrator`
2. Remove duplicated code from App.tsx
3. Move business logic to services

---

## 🧪 Testing

Each service is independently testable:

```typescript
import { toolRegistry } from './services/ToolRegistry';

describe('ToolRegistry', () => {
  beforeEach(() => {
    toolRegistry.clear();
  });
  
  it('should register tools', () => {
    toolRegistry.register('test', 'Test tools', [...], executor);
    expect(toolRegistry.getToolCount()).toBe(5);
  });
  
  it('should execute tools', async () => {
    // ...
  });
});
```

---

## 📚 API Reference

See individual service files for detailed API documentation:
- [EventBus.ts](EventBus.ts) - Event system API
- [ErrorHandler.ts](ErrorHandler.ts) - Error handling API
- [ToolRegistry.ts](ToolRegistry.ts) - Tool management API
- [ToolMiddleware.ts](ToolMiddleware.ts) - Middleware API
- [ToolOrchestrator.ts](ToolOrchestrator.ts) - Orchestration API

---

## 🎯 Best Practices

1. **Always initialize services** before using them
2. **Unsubscribe from events** in cleanup functions
3. **Use error handler** instead of try-catch everywhere
4. **Emit events** for important state changes
5. **Register middleware** in logical order
6. **Use toolOrchestrator** for complex chains
7. **Type-safe events** with AppEvents enum
8. **Monitor performance** with built-in middleware

---

## 🐛 Troubleshooting

### Services not initialized
**Error:** "Tool not found in registry"  
**Solution:** Call `initializeServices()` in App.tsx useEffect

### Events not firing
**Error:** Events don't trigger handlers  
**Solution:** Subscribe before emitting; check event name matches AppEvents enum

### Tools not executing
**Error:** Tool execution fails silently  
**Solution:** Check middleware order; ensure error handling middleware is registered

### Memory leaks
**Error:** Components not cleaning up  
**Solution:** Unsubscribe from events in cleanup; clear services on unmount

---

## 🚀 Future Enhancements

- [ ] Persistent event logging
- [ ] Performance metrics dashboard
- [ ] Tool execution analytics
- [ ] Remote tool loading
- [ ] Plugin system for third-party tools
- [ ] WebWorker integration for heavy tools
- [ ] Distributed tool execution
- [ ] Tool versioning

---

## 📖 Additional Resources

- [MIGRATION_GUIDE.tsx](MIGRATION_GUIDE.tsx) - Step-by-step integration examples
- [../types/index.ts](../types/index.ts) - Type definitions
- Main documentation in project README

---

**Version:** 1.0.0  
**Last Updated:** February 1, 2026  
**Status:** ✅ Production Ready
