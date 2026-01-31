export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  model?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  toolName?: string;
  instructionsUsed?: { guideId: string; title: string }[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  settings: ChatSettings;
}

export interface ChatSettings {
  model: string;
  systemPrompt: string;
  temperature: number;
  apiKey: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  required: string[];
}

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}
