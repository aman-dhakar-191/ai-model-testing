/**
 * MIGRATION GUIDE: Using the New Service Layer
 * 
 * This file demonstrates how to refactor App.tsx to use the new modular service architecture.
 * The new architecture provides:
 * - Better separation of concerns
 * - Dependency injection
 * - Event-driven communication
 * - Middleware pipeline for tool execution
 * - Centralized error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { toolRegistry } from './ToolRegistry';
import { toolOrchestrator } from './ToolOrchestrator';
import { eventBus, AppEvents } from './EventBus';
import { errorHandler, ErrorSeverity } from './ErrorHandler';
import { initializeServices, updateCustomTools } from './ServiceInitializer';
import type { Chat, Message, ToolDefinition } from '../types';

/**
 * EXAMPLE: How to initialize services in your app
 */
export function useServiceInitialization() {
  useEffect(() => {
    // Initialize services once on app mount
    initializeServices();

    // Cleanup on unmount
    return () => {
      eventBus.clear();
      toolRegistry.clear();
    };
  }, []);
}

/**
 * EXAMPLE: How to use the EventBus for cross-component communication
 */
export function useToolExecutionEvents() {
  const [executingTool, setExecutingTool] = useState<string | null>(null);

  useEffect(() => {
    const startSub = eventBus.on(AppEvents.TOOL_EXECUTION_START, (data: any) => {
      setExecutingTool(data.toolName);
      console.log('Tool started:', data.toolName);
    });

    const completeSub = eventBus.on(AppEvents.TOOL_EXECUTION_COMPLETE, (data: any) => {
      setExecutingTool(null);
      console.log('Tool completed:', data.toolName, 'Success:', data.success);
    });

    return () => {
      startSub.unsubscribe();
      completeSub.unsubscribe();
    };
  }, []);

  return executingTool;
}

/**
 * EXAMPLE: How to use the ErrorHandler
 */
export function useErrorHandling() {
  const [lastError, setLastError] = useState<any>(null);

  useEffect(() => {
    const errorSub = eventBus.on(AppEvents.ERROR_OCCURRED, (error: any) => {
      setLastError(error);
      
      // Show user-friendly error notification
      if (error.severity === ErrorSeverity.CRITICAL) {
        alert(`Critical Error: ${error.message}`);
      }
    });

    return () => errorSub.unsubscribe();
  }, []);

  return lastError;
}

/**
 * EXAMPLE: How to register custom tools dynamically
 */
export function useCustomTools(tools: ToolDefinition[]) {
  useEffect(() => {
    const executor = async (_name: string, _args: string) => {
      // Your custom tool execution logic here
      return JSON.stringify({ result: 'Custom tool executed' });
    };

    updateCustomTools(tools, executor);
  }, [tools]);
}

/**
 * EXAMPLE: How to send messages using the new ToolOrchestrator
 * 
 * BEFORE (in App.tsx - ~150 lines of complex logic):
 * - Manual tool execution loop
 * - Nested try-catch blocks
 * - Mixed concerns (UI + business logic)
 * 
 * AFTER (using ToolOrchestrator - ~10 lines):
 */
export async function sendMessageWithOrchestrator(
  content: string,
  activeChat: Chat,
  onStreamToken: (token: string) => void,
  abortSignal: AbortSignal,
) {
  const userMessage: Message = {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    timestamp: Date.now(),
  };

  try {
    // Get all registered tools from the registry
    const allTools = toolRegistry.getAllTools();

    // Execute the entire chain with one call
    const result = await toolOrchestrator.executeChain(
      userMessage,
      activeChat.messages,
      activeChat.settings,
      allTools,
      {
        maxRounds: 10,
        onStreamToken,
        signal: abortSignal,
      },
    );

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      messages: result.messages,
      toolResults: result.toolResults,
      fetchedInstructions: result.fetchedInstructions,
    };
  } catch (error) {
    errorHandler.handleApiError(
      error instanceof Error ? error : String(error),
      true,
    );
    throw error;
  }
}

/**
 * EXAMPLE: Complete App Component refactor
 */
export function ExampleRefactoredApp() {
  // Initialize services
  useServiceInitialization();
  
  // Subscribe to tool execution events
  const executingTool = useToolExecutionEvents();
  
  // Subscribe to errors
  const lastError = useErrorHandling();
  
  // State management (same as before)
  const [_chats, _setChats] = useState<Chat[]>([]);
  const [_loading, setLoading] = useState(false);
  const [_streamingContent, setStreamingContent] = useState('');

  /**
   * Send message handler - MUCH SIMPLER NOW
   */
  const _handleSendMessage = useCallback(async (content: string, activeChat: Chat) => {
    setLoading(true);
    setStreamingContent('');
    
    const abortController = new AbortController();

    try {
      const _result = await sendMessageWithOrchestrator(
        content,
        activeChat,
        (token) => setStreamingContent((prev) => prev + token),
        abortController.signal,
      );

      // Update chat with new messages
      // ... (same as before)
      
    } catch (error) {
      // Error already handled by errorHandler
      console.error('Message send failed:', error);
    } finally {
      setLoading(false);
      setStreamingContent('');
    }
  }, []);

  return (
    <div>
      {executingTool && <div>Executing: {executingTool}</div>}
      {lastError && <div>Error: {lastError.message}</div>}
      {/* Rest of your UI */}
    </div>
  );
}

/**
 * MIGRATION CHECKLIST:
 * 
 * 1. ✅ Add initializeServices() in App.tsx useEffect
 * 2. ✅ Replace manual tool execution with toolOrchestrator.executeChain()
 * 3. ✅ Replace custom error handling with errorHandler
 * 4. ✅ Add event subscriptions for cross-component communication
 * 5. ✅ Use toolRegistry.getAllTools() instead of manual array concatenation
 * 6. ✅ Update custom tool registration to use registerCustomTools()
 * 7. ✅ Remove ~150 lines of tool execution logic from App.tsx
 * 
 * BENEFITS:
 * - App.tsx reduces from ~450 lines to ~250 lines
 * - Business logic separated from UI
 * - Testable service layer
 * - Reusable across components
 * - Type-safe event system
 * - Consistent error handling
 * - Performance monitoring built-in
 * - Easy to extend with new middleware
 */
