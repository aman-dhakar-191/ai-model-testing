import type { Message, ChatSettings, ToolDefinition, ToolCall } from '../types';
import { toolDefinitionsToApiFormat } from './mockTools';
import { toolInstructionLoader } from './toolInstructions';

export interface ApiResponse {
  content: string | null;
  toolCalls: ToolCall[] | null;
}

// Custom error class to distinguish API errors from other errors
export class ApiError extends Error {
  statusCode?: number;
  
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Custom error class for network-related errors
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

interface ApiMessage {
  role: string;
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: ToolCall[];
}

async function getEnvironmentContext(tools?: ToolDefinition[]): Promise<string> {
  try {
    if (typeof window === 'undefined' || !window.electron?.salesforce) {
      return '';
    }

    const workingDir = await window.electron.salesforce.getWorkingDirectory();
    const fileTreeJson = await window.electron.salesforce.getFileTree();
    const fileTree = JSON.parse(fileTreeJson);
    
    // Get connected org info
    let orgInfo = 'Not connected';
    try {
      const currentOrg = await window.electron.sfCli.getCurrentOrg();
      if (currentOrg && currentOrg.username) {
        orgInfo = currentOrg.alias 
          ? `${currentOrg.alias} (${currentOrg.username})` 
          : currentOrg.username;
      }
    } catch (error) {
      // Org might not be connected, use default message
      orgInfo = 'Not connected';
    }
    
    // Create a simplified file structure for context (limit depth to avoid too much data)
    const simplifyFileTree = (items: any[], depth = 0, maxDepth = 3): string => {
      if (depth >= maxDepth || !items || items.length === 0) return '';
      
      return items
        .filter(item => {
          // Filter out node_modules, .git, and other common large directories
          const name = item.name || '';
          return !name.startsWith('.') && 
                 name !== 'node_modules' && 
                 name !== 'coverage' &&
                 name !== 'dist' &&
                 name !== 'build';
        })
        .map(item => {
          const indent = '  '.repeat(depth);
          const prefix = item.type === 'directory' ? '📁' : '📄';
          const line = `${indent}${prefix} ${item.name}`;
          
          if (item.type === 'directory' && item.children) {
            const children = simplifyFileTree(item.children, depth + 1, maxDepth);
            return children ? `${line}\n${children}` : line;
          }
          return line;
        })
        .join('\n');
    };

    const fileStructure = simplifyFileTree(fileTree);
    
    let context = `\n\n---\n**Environment Context:**\n- Working Directory: ${workingDir}\n- Connected Org: ${orgInfo}\n- Project Structure:\n${fileStructure}`;
    
    // Add available tools list
    if (tools && tools.length > 0) {
      context += `\n\n**Available Tools:**\n`;
      tools.forEach(tool => {
        context += `- ${tool.name}: ${tool.description}\n`;
      });
      context += `\n(Use these tools when needed to accomplish tasks)`;
    }
    
    context += `\n---\n`;
    
    return context;
  } catch (error) {
    console.error('Failed to get environment context:', error);
    return '';
  }
}

async function buildApiMessagesWithContext(messages: Message[], settings: ChatSettings, tools?: ToolDefinition[]): Promise<ApiMessage[]> {
  const apiMessages: ApiMessage[] = [];

  if (settings.systemPrompt) {
    apiMessages.push({ role: 'system', content: settings.systemPrompt });
  }

  const envContext = await getEnvironmentContext(tools);
  
  // Find the index of the last user message
  let lastUserMessageIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      lastUserMessageIndex = i;
      break;
    }
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
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
        tool_calls: msg.toolCalls.map(tc => ({
          ...tc,
          type: tc.type || 'function',
        })),
      });
    } else if (msg.role === 'user') {
      // Remove any existing context from previous user messages
      let content = msg.content;
      const contextMarker = '\n\n---\n**Environment Context:**';
      if (content.includes(contextMarker)) {
        content = content.split(contextMarker)[0].trim();
      }
      
      // Only add context to the LAST user message
      if (i === lastUserMessageIndex && envContext) {
        content = content + envContext;
      }
      
      apiMessages.push({ 
        role: msg.role, 
        content
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
  // Use OpenAI-compatible format for both Ollama and OpenRouter
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

async function buildRequestBodyWithInstructions(
  apiMessages: ApiMessage[],
  settings: ChatSettings,
  tools?: ToolDefinition[],
  stream?: boolean,
): Promise<Record<string, unknown>> {
  // Use OpenAI-compatible format for both Ollama and OpenRouter
  const body: Record<string, unknown> = {
    model: settings.model,
    messages: apiMessages,
    temperature: settings.temperature,
  };

  if (tools && tools.length > 0) {
    // Enrich tool descriptions with detailed instructions
    const enrichedTools = await toolInstructionLoader.enrichToolDefinitions(tools);
    body.tools = toolDefinitionsToApiFormat(enrichedTools);
  }

  if (stream) {
    body.stream = true;
  }

  return body;
}

async function fetchApi(
  body: Record<string, unknown>, 
  settings: ChatSettings, 
  signal?: AbortSignal
): Promise<Response> {
  const isOllama = settings.provider === 'ollama';
  const url = isOllama 
    ? `${settings.ollamaBaseUrl}/v1/chat/completions`
    : 'https://openrouter.ai/api/v1/chat/completions';
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (!isOllama) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const statusCode = response.status;
      let errorMessage = `API request failed with status ${statusCode}`;
      let parsedErrorResponse = null;
      
      try {
        const error = await response.json();
        parsedErrorResponse = error;
        
        // Check both error.error.message and error.message patterns
        // Validate that the message is a string to avoid capturing unexpected objects
        if (error?.error?.message && typeof error.error.message === 'string') {
          errorMessage = error.error.message;
        } else if (error?.message && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      } catch {
        // If we can't parse the error response, use status-specific messages
        switch (statusCode) {
          case 400:
            errorMessage = 'Bad Request: The request was invalid. Please check your input and try again.';
            break;
          case 401:
            errorMessage = isOllama 
              ? 'Unauthorized: Unable to connect to Ollama. Please ensure Ollama is running.'
              : 'Unauthorized: Invalid API key. Please check your OpenRouter API key in settings.';
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
            errorMessage = `API request failed with status ${statusCode}`;
        }
      }
      
      // Log error details for debugging (only in development)
      if (import.meta.env.DEV) {
        console.group('🚨 API Error Details');
        console.log('Status Code:', statusCode);
        console.log('Status Text:', response.statusText);
        // Log only pathname to avoid exposing query parameters
        try {
          console.log('Path:', new URL(response.url).pathname);
        } catch {
          // If URL parsing fails, log the URL as-is (it's already sanitized by browser)
          console.log('URL:', response.url);
        }
        if (parsedErrorResponse) {
          console.log('Response Body:', parsedErrorResponse);
        }
        console.error('Error Message:', errorMessage);
        console.groupEnd();
      }
      
      throw new ApiError(errorMessage, statusCode);
    }

    return response;
  } catch (error) {
    // If it's already an ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle Error objects
    if (error instanceof Error) {
      // Log network errors (only in development to avoid exposing stack traces)
      if (import.meta.env.DEV) {
        console.group('🚨 Network/Fetch Error');
        console.log('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        console.groupEnd();
      }
      
      // Check if it's a fetch-specific network error (TypeError is thrown by fetch on network failures)
      if (error instanceof TypeError) {
        throw new NetworkError('Network error: Failed to connect to the API. Please check your internet connection and try again.');
      }
      // For other errors, rethrow as-is
      throw error;
    } else {
      // Handle unexpected non-Error objects thrown as errors
      if (import.meta.env.DEV) {
        console.error('🚨 Unexpected error type:', typeof error, error);
      }
      throw new NetworkError('An unexpected error occurred while connecting to the API.');
    }
  }
}

// Non-streaming send (used for tool call rounds)
export async function sendMessage(
  messages: Message[],
  settings: ChatSettings,
  tools?: ToolDefinition[],
): Promise<ApiResponse> {
  if (settings.provider === 'openrouter' && !settings.apiKey) {
    throw new Error('Please enter your OpenRouter API key in the settings panel.');
  }

  const apiMessages = await buildApiMessagesWithContext(messages, settings, tools);
  const body = await buildRequestBodyWithInstructions(apiMessages, settings, tools, false);
  const response = await fetchApi(body, settings);
  const data = await response.json();
  
  // Both Ollama (with /v1/chat/completions) and OpenRouter use the same format
  const choice = data.choices?.[0]?.message;

  return {
    content: choice?.content || null,
    toolCalls: choice?.tool_calls || null,
  };
}

// Streaming send — calls onToken for each text chunk, returns final result
export async function sendMessageStreaming(
  messages: Message[],
  settings: ChatSettings,
  tools: ToolDefinition[] | undefined,
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<ApiResponse> {
  if (settings.provider === 'openrouter' && !settings.apiKey) {
    throw new Error('Please enter your OpenRouter API key in the settings panel.');
  }

  const apiMessages = await buildApiMessagesWithContext(messages, settings, tools);
  const hasTools = tools && tools.length > 0;
  const body = await buildRequestBodyWithInstructions(apiMessages, settings, tools, true);
  const response = await fetchApi(body, settings, signal);

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming not supported by the browser.');
  }

  const decoder = new TextDecoder();
  let fullContent = '';
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
        if (!trimmed) continue;
        
        // Both Ollama (with /v1/chat/completions) and OpenRouter use SSE format with data: prefix
        if (!trimmed.startsWith('data: ')) continue;
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
    // Don't wrap API errors or network errors - let them propagate as-is
    if (error instanceof ApiError || error instanceof NetworkError) {
      throw error;
    }
    
    // Handle Error objects
    if (error instanceof Error) {
      // Log streaming errors (only in development)
      if (import.meta.env.DEV) {
        console.group('🚨 Streaming Error');
        console.log('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        console.groupEnd();
      }
      
      throw new Error(`Streaming error: ${error.message}`);
    } else {
      // Handle unexpected non-Error objects thrown as errors
      if (import.meta.env.DEV) {
        console.error('🚨 Unexpected streaming error:', typeof error, error);
      }
      throw new Error('An error occurred while streaming the response.');
    }
  }

  const toolCalls = toolCallMap.size > 0 ? Array.from(toolCallMap.values()) : [];

  return {
    content: fullContent || null,
    toolCalls: toolCalls.length > 0 ? toolCalls : null,
  };
}
