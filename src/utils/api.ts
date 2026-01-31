import type { Message, ChatSettings, ToolDefinition, ToolCall } from '../types';
import { toolDefinitionsToApiFormat } from './mockTools';

export interface ApiResponse {
  content: string | null;
  toolCalls: ToolCall[] | null;
}

interface ApiMessage {
  role: string;
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: ToolCall[];
}

function buildApiMessages(messages: Message[], settings: ChatSettings): ApiMessage[] {
  const apiMessages: ApiMessage[] = [];

  if (settings.systemPrompt) {
    apiMessages.push({ role: 'system', content: settings.systemPrompt });
  }

  for (const msg of messages) {
    if (msg.role === 'system') continue;

    if (msg.role === 'tool') {
      apiMessages.push({
        role: 'tool',
        content: msg.content,
        tool_call_id: msg.toolCallId,
        name: msg.toolName,
      });
    } else if (msg.role === 'assistant' && msg.toolCalls?.length) {
      apiMessages.push({
        role: 'assistant',
        content: msg.content || '',
        tool_calls: msg.toolCalls,
      });
    } else {
      apiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  return apiMessages;
}

function buildRequestBody(
  apiMessages: ApiMessage[],
  settings: ChatSettings,
  tools?: ToolDefinition[],
  stream?: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: settings.model,
    messages: apiMessages,
    temperature: settings.temperature,
  };

  if (tools && tools.length > 0) {
    body.tools = toolDefinitionsToApiFormat(tools);
  }

  if (stream) {
    body.stream = true;
  }

  return body;
}

async function fetchApi(body: Record<string, unknown>, apiKey: string): Promise<Response> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      
      try {
        const error = await response.json();
        if (error?.error?.message) {
          errorMessage = error.error.message;
        }
      } catch {
        // If we can't parse the error response, use status-specific messages
        switch (response.status) {
          case 400:
            errorMessage = 'Bad Request: The request was invalid. Please check your input and try again.';
            break;
          case 401:
            errorMessage = 'Unauthorized: Invalid API key. Please check your OpenRouter API key in settings.';
            break;
          case 404:
            errorMessage = 'Not Found: The requested resource was not found.';
            break;
          case 429:
            errorMessage = 'Too Many Requests: Rate limit exceeded. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = 'Internal Server Error: The server encountered an error. Please try again later.';
            break;
          case 503:
            errorMessage = 'Service Unavailable: The service is temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = `API request failed with status ${response.status}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    // Handle network errors and other exceptions
    if (error instanceof Error) {
      // If it's already an Error with a message we set, rethrow it
      if (error.message.includes('API request failed') || 
          error.message.includes('Bad Request') ||
          error.message.includes('Unauthorized') ||
          error.message.includes('Not Found') ||
          error.message.includes('Too Many Requests') ||
          error.message.includes('Internal Server Error') ||
          error.message.includes('Service Unavailable')) {
        throw error;
      }
      // Network error or fetch failed
      throw new Error(`Network error: ${error.message}. Please check your internet connection and try again.`);
    }
    throw new Error('An unexpected error occurred while connecting to the API.');
  }
}

// Non-streaming send (used for tool call rounds)
export async function sendMessage(
  messages: Message[],
  settings: ChatSettings,
  tools?: ToolDefinition[],
): Promise<ApiResponse> {
  if (!settings.apiKey) {
    throw new Error('Please enter your OpenRouter API key in the settings panel.');
  }

  try {
    const apiMessages = buildApiMessages(messages, settings);
    const body = buildRequestBody(apiMessages, settings, tools, false);
    const response = await fetchApi(body, settings.apiKey);
    const data = await response.json();
    const choice = data.choices?.[0]?.message;

    return {
      content: choice?.content || null,
      toolCalls: choice?.tool_calls || null,
    };
  } catch (error) {
    // Re-throw with context if it's not already a user-friendly error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to send message. Please try again.');
  }
}

// Streaming send — calls onToken for each text chunk, returns final result
export async function sendMessageStreaming(
  messages: Message[],
  settings: ChatSettings,
  tools: ToolDefinition[] | undefined,
  onToken: (token: string) => void,
): Promise<ApiResponse> {
  if (!settings.apiKey) {
    throw new Error('Please enter your OpenRouter API key in the settings panel.');
  }

  try {
    const apiMessages = buildApiMessages(messages, settings);
    const hasTools = tools && tools.length > 0;
    const body = buildRequestBody(apiMessages, settings, tools, true);
    const response = await fetchApi(body, settings.apiKey);

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming not supported by the browser.');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let toolCalls: ToolCall[] = [];
    // Track incremental tool call argument building
    const toolCallMap = new Map<number, { id: string; function: { name: string; arguments: string } }>();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            if (!delta) continue;

            // Text content
            if (delta.content) {
              fullContent += delta.content;
              onToken(delta.content);
            }

            // Tool calls (streamed incrementally)
            if (hasTools && delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallMap.has(idx)) {
                  toolCallMap.set(idx, {
                    id: tc.id ?? `call_${idx}`,
                    function: { name: tc.function?.name ?? '', arguments: '' },
                  });
                }
                const entry = toolCallMap.get(idx)!;
                if (tc.id) entry.id = tc.id;
                if (tc.function?.name) entry.function.name = tc.function.name;
                if (tc.function?.arguments) entry.function.arguments += tc.function.arguments;
              }
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } catch (error) {
      // Handle streaming errors
      if (error instanceof Error) {
        throw new Error(`Streaming error: ${error.message}`);
      }
      throw new Error('An error occurred while streaming the response.');
    }

    if (toolCallMap.size > 0) {
      toolCalls = Array.from(toolCallMap.values());
    }

    return {
      content: fullContent || null,
      toolCalls: toolCalls.length > 0 ? toolCalls : null,
    };
  } catch (error) {
    // Re-throw with context if it's not already a user-friendly error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to send streaming message. Please try again.');
  }
}
