export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
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
