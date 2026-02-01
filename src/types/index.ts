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
  todos?: TodoItem[];
}

export interface TodoItem {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: number;
}

export interface ChatSettings {
  model: string;
  systemPrompt: string;
  temperature: number;
  apiKey: string;
  provider: 'openrouter' | 'ollama';
  ollamaBaseUrl: string;
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
  items?: any;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  required: string[];
  instructionFile?: string; // Optional: filename of detailed markdown instructions
}

export interface ToolCall {
  id: string;
  type?: string;
  function: {
    name: string;
    arguments: string;
  };
}
