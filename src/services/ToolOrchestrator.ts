/**
 * Tool Orchestrator Service
 * Manages complex tool execution chains with AI model interaction
 * Separates business logic from UI components
 */

import type { Message, ChatSettings, ToolDefinition, ToolCall } from '../types';
import { sendMessageStreaming } from '../utils/api';
import { toolRegistry } from './ToolRegistry';
import { toolMiddleware } from './ToolMiddleware';
import { eventBus, AppEvents } from './EventBus';
import { errorHandler } from './ErrorHandler';

export interface OrchestrationResult {
  messages: Message[];
  toolResults: Record<string, { name: string; result: string }>;
  fetchedInstructions: { guideId: string; title: string }[];
  error?: string;
}

export interface OrchestrationOptions {
  maxRounds?: number;
  onStreamToken?: (token: string) => void;
  signal?: AbortSignal;
}

class ToolOrchestrator {
  private defaultMaxRounds = 10;

  /**
   * Execute a complete tool chain with AI interaction
   */
  async executeChain(
    userMessage: Message,
    existingMessages: Message[],
    settings: ChatSettings,
    tools: ToolDefinition[],
    options: OrchestrationOptions = {},
  ): Promise<OrchestrationResult> {
    const {
      maxRounds = this.defaultMaxRounds,
      onStreamToken,
      signal,
    } = options;

    let allMessages = [...existingMessages, userMessage];
    const newMessages: Message[] = [];
    const newResults: Record<string, { name: string; result: string }> = {};
    const fetchedInstructions: { guideId: string; title: string }[] = [];

    let remainingRounds = maxRounds;

    try {
      eventBus.emit(AppEvents.CHAT_MESSAGE_SENT, userMessage);

      while (remainingRounds > 0) {
        remainingRounds--;

        // Check for abort signal
        if (signal?.aborted) {
          throw new Error('Operation aborted');
        }

        // Send message to AI
        const response = await sendMessageStreaming(
          allMessages,
          settings,
          tools,
          onStreamToken || (() => {}),
          signal,
        );

        // If AI returned tool calls, execute them
        if (response.toolCalls && response.toolCalls.length > 0) {
          const assistantMsg: Message = {
            id: this.generateId(),
            role: 'assistant',
            content: response.content || '',
            timestamp: Date.now(),
            model: settings.model,
            toolCalls: response.toolCalls,
          };

          newMessages.push(assistantMsg);
          allMessages = [...allMessages, assistantMsg];

          // Execute all tool calls
          for (const call of response.toolCalls) {
            const toolResult = await this.executeToolCall(call);
            
            newResults[call.id] = {
              name: call.function.name,
              result: toolResult,
            };

            // Track instruction fetches
            if (call.function.name === 'fetch_instruction') {
              this.trackInstructionFetch(toolResult, fetchedInstructions);
            }

            // Create tool message
            const toolMsg: Message = {
              id: this.generateId(),
              role: 'tool',
              content: toolResult,
              timestamp: Date.now(),
              toolCallId: call.id,
              toolName: call.function.name,
            };

            newMessages.push(toolMsg);
            allMessages = [...allMessages, toolMsg];
          }

          // Continue to next round
          continue;
        }

        // AI provided final response without tool calls
        const assistantMsg: Message = {
          id: this.generateId(),
          role: 'assistant',
          content: response.content || 'No response received.',
          timestamp: Date.now(),
          model: settings.model,
          instructionsUsed:
            fetchedInstructions.length > 0 ? fetchedInstructions : undefined,
        };

        newMessages.push(assistantMsg);
        eventBus.emit(AppEvents.CHAT_MESSAGE_RECEIVED, assistantMsg);
        
        // Break the loop
        break;
      }

      if (remainingRounds === 0) {
        console.warn(
          `Tool execution reached max rounds (${maxRounds}). Stopping.`,
        );
      }

      return {
        messages: newMessages,
        toolResults: newResults,
        fetchedInstructions,
      };
    } catch (error) {
      const appError = errorHandler.handleApiError(
        error instanceof Error ? error : String(error),
        true,
      );

      return {
        messages: newMessages,
        toolResults: newResults,
        fetchedInstructions,
        error: appError.message,
      };
    }
  }

  /**
   * Execute a single tool call
   */
  private async executeToolCall(call: ToolCall): Promise<string> {
    const { name, arguments: argsJson } = call.function;

    try {
      // Use registry to execute (goes through middleware)
      const result = await toolMiddleware.execute(
        name,
        argsJson,
        () => toolRegistry.executeTool(name, argsJson),
      );

      return result.result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      
      errorHandler.handleToolError(name, errorMessage, false);

      return JSON.stringify({
        status: 'error',
        message: errorMessage,
      });
    }
  }

  /**
   * Track instruction guide fetches
   */
  private trackInstructionFetch(
    result: string,
    collection: { guideId: string; title: string }[],
  ): void {
    try {
      const parsed = JSON.parse(result);
      if (parsed.title && parsed.guide_id) {
        collection.push({
          guideId: parsed.guide_id,
          title: parsed.title,
        });
      }
    } catch {
      // Ignore parse errors
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Set default max rounds
   */
  setDefaultMaxRounds(rounds: number): void {
    this.defaultMaxRounds = Math.max(1, Math.min(rounds, 50));
  }

  /**
   * Get default max rounds
   */
  getDefaultMaxRounds(): number {
    return this.defaultMaxRounds;
  }
}

// Singleton instance
export const toolOrchestrator = new ToolOrchestrator();
