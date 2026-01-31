# Service Layer - Quick Reference

## 🚀 Quick Start

```typescript
import { 
  initializeServices,
  toolRegistry, 
  toolOrchestrator, 
  eventBus, 
  errorHandler,
  AppEvents 
} from './services';

// 1. Initialize services (once, in App.tsx)
useEffect(() => {
  initializeServices();
}, []);

// 2. Send message with orchestrator
const result = await toolOrchestrator.executeChain(
  userMessage, 
  messages, 
  settings, 
  toolRegistry.getAllTools(),
  { maxRounds: 10, onStreamToken, signal }
);

// 3. Subscribe to events
useEffect(() => {
  const sub = eventBus.on(AppEvents.TOOL_EXECUTION_START, handler);
  return () => sub.unsubscribe();
}, []);

// 4. Handle errors
try {
  // ... code
} catch (error) {
  errorHandler.handle(error, 'Context', ErrorSeverity.ERROR);
}
```

---

## 📦 Service Imports

```typescript
// Single import for everything
import { 
  // Services
  eventBus,
  errorHandler,
  toolRegistry,
  toolMiddleware,
  toolOrchestrator,
  
  // Functions
  initializeServices,
  registerCustomTools,
  
  // Types
  AppEvents,
  ErrorSeverity,
  ToolCategory,
  ToolContext,
  
  // Middlewares
  loggingMiddleware,
  eventMiddleware,
  performanceMiddleware,
} from './services';
```

---

## 🎯 Common Tasks

### Register Custom Tools
```typescript
import { registerCustomTools } from './services';

const executor = async (name: string, args: string) => {
  return JSON.stringify({ result: 'done' });
};

registerCustomTools(myTools, executor);
```

### Execute Tool
```typescript
const result = await toolRegistry.executeTool('create_apex_class', argsJson);
```

### Emit Event
```typescript
eventBus.emit(AppEvents.TOOL_EXECUTION_SUCCESS, { toolName, result });
```

### Subscribe to Event
```typescript
const subscription = eventBus.on(AppEvents.ERROR_OCCURRED, (error) => {
  console.error('Error:', error.message);
});
// Later: subscription.unsubscribe();
```

### Handle Error
```typescript
errorHandler.handleToolError('my_tool', error, retryable);
errorHandler.handleApiError(error, retryable);
errorHandler.handleSfCliError('operation', error);
```

### Add Middleware
```typescript
const myMiddleware = async (context, next) => {
  console.log('Before:', context.toolName);
  const result = await next();
  console.log('After:', context.toolName);
  return result;
};

toolMiddleware.use(myMiddleware);
```

---

## 📊 Available Events

```typescript
enum AppEvents {
  // Tool Events
  TOOL_EXECUTION_START = 'tool:execution:start',
  TOOL_EXECUTION_SUCCESS = 'tool:execution:success',
  TOOL_EXECUTION_ERROR = 'tool:execution:error',
  TOOL_EXECUTION_COMPLETE = 'tool:execution:complete',
  
  // Chat Events
  CHAT_MESSAGE_SENT = 'chat:message:sent',
  CHAT_MESSAGE_RECEIVED = 'chat:message:received',
  CHAT_CREATED = 'chat:created',
  CHAT_DELETED = 'chat:deleted',
  CHAT_SELECTED = 'chat:selected',
  
  // Org Events
  ORG_CHANGED = 'org:changed',
  ORG_LOGIN = 'org:login',
  ORG_LOGOUT = 'org:logout',
  
  // System Events
  WORKING_DIR_CHANGED = 'workingDir:changed',
  PROJECT_SETUP_REQUIRED = 'project:setup:required',
  ERROR_OCCURRED = 'error:occurred',
  SETTINGS_CHANGED = 'settings:changed',
}
```

---

## 🛠️ API Reference

### EventBus
```typescript
eventBus.on(event, callback)          // Subscribe
eventBus.once(event, callback)        // Subscribe once
eventBus.off(event, callback)         // Unsubscribe
eventBus.emit(event, data)            // Emit event
eventBus.clear(event?)                // Clear subscribers
eventBus.listenerCount(event)         // Get count
```

### ErrorHandler
```typescript
errorHandler.handle(error, context, severity, recoverable, retryable)
errorHandler.handleToolError(toolName, error, retryable)
errorHandler.handleApiError(error, retryable)
errorHandler.handleSfCliError(operation, error)
errorHandler.handleFileSystemError(operation, path, error)
errorHandler.getRecentErrors(limit)
errorHandler.clearLog()
```

### ToolRegistry
```typescript
toolRegistry.register(category, description, tools, executor, priority)
toolRegistry.unregister(category)
toolRegistry.getAllTools()
toolRegistry.getToolsByCategory(category)
toolRegistry.hasTool(toolName)
toolRegistry.getTool(toolName)
toolRegistry.executeTool(toolName, argsJson)
toolRegistry.getStats()
toolRegistry.clear()
```

### ToolMiddleware
```typescript
toolMiddleware.use(middleware)
toolMiddleware.remove(middleware)
toolMiddleware.execute(toolName, argsJson, executor)
toolMiddleware.clear()
toolMiddleware.count()
```

### ToolOrchestrator
```typescript
toolOrchestrator.executeChain(userMessage, messages, settings, tools, options)
toolOrchestrator.setDefaultMaxRounds(rounds)
toolOrchestrator.getDefaultMaxRounds()
```

---

## 🎨 Built-in Middlewares

```typescript
import {
  loggingMiddleware,          // Console logging
  eventMiddleware,            // Event emission
  validationMiddleware,       // Input validation
  errorHandlingMiddleware,    // Error handling
  performanceMiddleware,      // Performance monitoring
  retryMiddleware(3, 1000),  // Retry logic
  timeoutMiddleware(30000),  // Timeout protection
} from './services/ToolMiddleware';

toolMiddleware.use(validationMiddleware);
toolMiddleware.use(retryMiddleware(3, 1000));
```

---

## 📖 Full Documentation

- [Complete Guide](src/services/README.md) - Full documentation
- [Migration Guide](src/services/MIGRATION_GUIDE.tsx) - Integration examples
- [Architecture Summary](ARCHITECTURE_IMPROVEMENTS.md) - Improvements overview

---

## ⚡ Performance Tips

1. **Initialize once** - Call `initializeServices()` only once
2. **Unsubscribe** - Always unsubscribe in cleanup
3. **Use middleware** - Add caching/optimization middleware
4. **Monitor performance** - Use `performanceMiddleware`
5. **Set timeouts** - Use `timeoutMiddleware` for long operations

---

## 🐛 Common Issues

**Q: Tool not found**  
A: Ensure `initializeServices()` is called before using tools

**Q: Events not firing**  
A: Check event name matches AppEvents enum

**Q: Memory leak**  
A: Unsubscribe from events in component cleanup

**Q: Middleware not running**  
A: Check middleware order and registration

---

## ✅ Checklist

- [ ] Call `initializeServices()` in App.tsx
- [ ] Subscribe to events with cleanup
- [ ] Use `toolOrchestrator` for message handling
- [ ] Use `errorHandler` for error handling
- [ ] Register custom tools if needed
- [ ] Add custom middleware if needed

---

**Version:** 1.0.0  
**Last Updated:** February 1, 2026
