import type { ModelOption } from '../types';

export const AVAILABLE_MODELS: ModelOption[] = [
  // Google
  { id: 'google/gemini-2.5-pro-exp-03-25:free', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', provider: 'Google' },
  // Meta
  { id: 'meta-llama/llama-4-maverick:free', name: 'Llama 4 Maverick', provider: 'Meta' },
  { id: 'meta-llama/llama-4-scout:free', name: 'Llama 4 Scout', provider: 'Meta' },
  // DeepSeek
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-r1-zero:free', name: 'DeepSeek R1 Zero', provider: 'DeepSeek' },
  // Mistral
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1 24B', provider: 'Mistral' },
  // NVIDIA
  { id: 'nvidia/llama-3.1-nemotron-nano-8b-v1:free', name: 'Nemotron Nano 8B', provider: 'NVIDIA' },
  // Qwen
  { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen3 235B', provider: 'Qwen' },
  { id: 'qwen/qwen2.5-vl-3b-instruct:free', name: 'Qwen 2.5 VL 3B', provider: 'Qwen' },
  // Nous Research
  { id: 'nousresearch/deephermes-3-llama-3-8b-preview:free', name: 'DeepHermes 3 8B', provider: 'Nous Research' },
  // Moonshot
  { id: 'moonshotai/kimi-vl-a3b-thinking:free', name: 'Kimi VL A3B Thinking', provider: 'Moonshot' },
];

export const DEFAULT_SETTINGS = {
  model: 'google/gemini-2.5-pro-exp-03-25:free',
  systemPrompt: '',
  temperature: 0.7,
  apiKey: '',
};
