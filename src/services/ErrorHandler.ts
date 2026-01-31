/**
 * Centralized Error Handling Service
 * Provides consistent error handling and user-friendly messages
 */

import { eventBus, AppEvents } from './EventBus';

export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type ErrorSeverityType = typeof ErrorSeverity[keyof typeof ErrorSeverity];

export interface AppError {
  id: string;
  message: string;
  severity: ErrorSeverityType;
  timestamp: number;
  context?: string;
  details?: any;
  originalError?: Error;
  recoverable: boolean;
  retryable: boolean;
}

class ErrorHandler {
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  /**
   * Handle an error with context
   */
  handle(
    error: Error | string,
    context?: string,
    severity: ErrorSeverityType = ErrorSeverity.ERROR,
    recoverable = true,
    retryable = false,
  ): AppError {
    const appError: AppError = {
      id: crypto.randomUUID(),
      message: this.extractMessage(error),
      severity,
      timestamp: Date.now(),
      context,
      originalError: error instanceof Error ? error : undefined,
      recoverable,
      retryable,
    };

    // Add to log
    this.errorLog.push(appError);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Emit error event
    eventBus.emit(AppEvents.ERROR_OCCURRED, appError);

    // Log to console
    console.error(`[${severity.toUpperCase()}] ${context || 'Error'}:`, error);

    return appError;
  }

  /**
   * Handle tool execution errors
   */
  handleToolError(toolName: string, error: Error | string, retryable = true): AppError {
    return this.handle(
      error,
      `Tool execution failed: ${toolName}`,
      ErrorSeverity.ERROR,
      true,
      retryable,
    );
  }

  /**
   * Handle API errors
   */
  handleApiError(error: Error | string, retryable = true): AppError {
    const message = this.extractMessage(error);
    const isNetworkError = message.includes('network') || message.includes('fetch');
    
    return this.handle(
      error,
      'API request failed',
      ErrorSeverity.ERROR,
      true,
      retryable && isNetworkError,
    );
  }

  /**
   * Handle Salesforce CLI errors
   */
  handleSfCliError(operation: string, error: Error | string): AppError {
    return this.handle(
      error,
      `Salesforce CLI: ${operation}`,
      ErrorSeverity.WARNING,
      true,
      true,
    );
  }

  /**
   * Handle file system errors
   */
  handleFileSystemError(operation: string, path: string, error: Error | string): AppError {
    return this.handle(
      error,
      `File system operation failed: ${operation} at ${path}`,
      ErrorSeverity.ERROR,
      false,
      false,
    );
  }

  /**
   * Extract user-friendly message from error
   */
  private extractMessage(error: Error | string): string {
    if (typeof error === 'string') return error;
    
    // Handle abort errors
    if (error.name === 'AbortError') {
      return 'Operation was cancelled';
    }

    // Handle network errors
    if (error.message.includes('fetch')) {
      return 'Network error: Unable to connect to the server';
    }

    // Handle API errors
    if (error.message.includes('API request failed')) {
      return error.message;
    }

    return error.message || 'An unexpected error occurred';
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10): AppError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearLog(): void {
    this.errorLog = [];
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverityType): AppError[] {
    return this.errorLog.filter((e) => e.severity === severity);
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();
