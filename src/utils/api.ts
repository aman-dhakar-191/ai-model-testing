import type { Message, ChatSettings } from '../types';

export async function sendMessage(
  messages: Message[],
  settings: ChatSettings,
): Promise<string> {
  if (!settings.apiKey) {
    throw new Error('Please enter your OpenRouter API key in the settings panel.');
  }

  const apiMessages = [];

  if (settings.systemPrompt) {
    apiMessages.push({ role: 'system' as const, content: settings.systemPrompt });
  }

  for (const msg of messages) {
    if (msg.role !== 'system') {
      apiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: apiMessages,
      temperature: settings.temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error?.error?.message || `API request failed with status ${response.status}`,
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response received.';
}
