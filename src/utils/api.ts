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
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error?.error?.message || `API request failed with status ${response.status}`,
    );
  }

  return response;
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

  const apiMessages = buildApiMessages(messages, settings);
  const body = buildRequestBody(apiMessages, settings, tools, false);
  const response = await fetchApi(body, settings.apiKey);
  const data = await response.json();
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
): Promise<ApiResponse> {
  if (!settings.apiKey) {
    throw new Error('Please enter your OpenRouter API key in the settings panel.');
  }

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

  if (toolCallMap.size > 0) {
    toolCalls = Array.from(toolCallMap.values());
  }

  return {
    content: fullContent || null,
    toolCalls: toolCalls.length > 0 ? toolCalls : null,
  };
}
