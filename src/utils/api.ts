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

export async function sendMessage(
  messages: Message[],
  settings: ChatSettings,
  tools?: ToolDefinition[],
): Promise<ApiResponse> {
  if (!settings.apiKey) {
    throw new Error('Please enter your OpenRouter API key in the settings panel.');
  }

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

  const body: Record<string, unknown> = {
    model: settings.model,
    messages: apiMessages,
    temperature: settings.temperature,
  };

  if (tools && tools.length > 0) {
    body.tools = toolDefinitionsToApiFormat(tools);
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error?.error?.message || `API request failed with status ${response.status}`,
    );
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message;

  return {
    content: choice?.content || null,
    toolCalls: choice?.tool_calls || null,
  };
}
