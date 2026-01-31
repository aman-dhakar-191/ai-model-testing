/**
 * Tool Execution Middleware/Pipeline
 * Enables preprocessing, validation, logging, and post-processing of tool calls
 */

import { eventBus, AppEvents } from './EventBus';
import { errorHandler } from './ErrorHandler';

export interface ToolContext {
  toolName: string;
  args: any;
  argsJson: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  result: string;
  duration: number;
  error?: string;
}

export type MiddlewareFunction = (
  context: ToolContext,
  next: () => Promise<string>,
) => Promise<string>;

class ToolMiddleware {
  private middlewares: MiddlewareFunction[] = [];

  /**
   * Add middleware to the pipeline
   */
  use(middleware: MiddlewareFunction): void {
    this.middlewares.push(middleware);
  }

  /**
   * Remove middleware from the pipeline
   */
  remove(middleware: MiddlewareFunction): boolean {
    const index = this.middlewares.indexOf(middleware);
    if (index > -1) {
      this.middlewares.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Execute tool through middleware pipeline
   */
  async execute(
    toolName: string,
    argsJson: string,
    executor: () => Promise<string>,
  ): Promise<ToolResult> {
    const startTime = Date.now();
    
    const context: ToolContext = {
      toolName,
      args: this.safeParseJson(argsJson),
      argsJson,
      timestamp: startTime,
    };

    try {
      // Build the middleware chain
      let index = 0;
      const runNext = async (): Promise<string> => {
        if (index < this.middlewares.length) {
          const middleware = this.middlewares[index++];
          return await middleware(context, runNext);
        }
        // Final executor
        return await executor();
      };

      const result = await runNext();
      const duration = Date.now() - startTime;

      return {
        success: true,
        result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        result: JSON.stringify({ error: errorMessage }),
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Clear all middlewares
   */
  clear(): void {
    this.middlewares = [];
  }

  /**
   * Get middleware count
   */
  count(): number {
    return this.middlewares.length;
  }

  private safeParseJson(json: string): any {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  }
}

// Singleton instance
export const toolMiddleware = new ToolMiddleware();

// ============================================================================
// Built-in Middleware Functions
// ============================================================================

/**
 * Logging middleware
 */
export const loggingMiddleware: MiddlewareFunction = async (context, next) => {
  console.log(`[Tool] Executing: ${context.toolName}`, context.args);
  const startTime = Date.now();
  
  try {
    const result = await next();
    const duration = Date.now() - startTime;
    console.log(`[Tool] Success: ${context.toolName} (${duration}ms)`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Tool] Failed: ${context.toolName} (${duration}ms)`, error);
    throw error;
  }
};

/**
 * Event emission middleware
 */
export const eventMiddleware: MiddlewareFunction = async (context, next) => {
  eventBus.emit(AppEvents.TOOL_EXECUTION_START, {
    toolName: context.toolName,
    args: context.args,
    timestamp: context.timestamp,
  });

  try {
    const result = await next();
    
    eventBus.emit(AppEvents.TOOL_EXECUTION_SUCCESS, {
      toolName: context.toolName,
      result,
      timestamp: Date.now(),
    });

    eventBus.emit(AppEvents.TOOL_EXECUTION_COMPLETE, {
      toolName: context.toolName,
      success: true,
    });

    return result;
  } catch (error) {
    eventBus.emit(AppEvents.TOOL_EXECUTION_ERROR, {
      toolName: context.toolName,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    });

    eventBus.emit(AppEvents.TOOL_EXECUTION_COMPLETE, {
      toolName: context.toolName,
      success: false,
    });

    throw error;
  }
};

/**
 * Validation middleware
 */
export const validationMiddleware: MiddlewareFunction = async (context, next) => {
  // Validate tool name
  if (!context.toolName || typeof context.toolName !== 'string') {
    throw new Error('Invalid tool name');
  }

  // Validate args JSON
  if (typeof context.argsJson !== 'string') {
    throw new Error('Invalid args format');
  }

  return await next();
};

/**
 * Error handling middleware
 */
export const errorHandlingMiddleware: MiddlewareFunction = async (context, next) => {
  try {
    return await next();
  } catch (error) {
    const appError = errorHandler.handleToolError(
      context.toolName,
      error instanceof Error ? error : String(error),
      true,
    );

    // Return formatted error
    return JSON.stringify({
      error: appError.message,
      context: appError.context,
      retryable: appError.retryable,
      errorId: appError.id,
    });
  }
};

/**
 * Performance monitoring middleware
 */
export const performanceMiddleware: MiddlewareFunction = async (context, next) => {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize;

  try {
    const result = await next();
    
    const duration = performance.now() - startTime;
    const endMemory = (performance as any).memory?.usedJSHeapSize;
    const memoryDelta = startMemory ? endMemory - startMemory : 0;

    if (duration > 1000) {
      console.warn(
        `[Performance] Slow tool execution: ${context.toolName} took ${duration.toFixed(2)}ms`,
      );
    }

    if (memoryDelta > 10 * 1024 * 1024) {
      console.warn(
        `[Performance] High memory usage: ${context.toolName} used ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Retry middleware (for retryable errors)
 */
export const retryMiddleware = (maxRetries = 3, delayMs = 1000): MiddlewareFunction => {
  return async (context, next) => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await next();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.log(
            `[Retry] Attempt ${attempt + 1}/${maxRetries} failed for ${context.toolName}. Retrying in ${delayMs}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    
    throw lastError;
  };
};

/**
 * Timeout middleware
 */
export const timeoutMiddleware = (timeoutMs = 30000): MiddlewareFunction => {
  return async (_context, next) => {
    return await Promise.race([
      next(),
      new Promise<string>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Tool execution timeout after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  };
};
