import type { ModelOption } from '../types';
import { SYSTEM_PROMPT } from '../prompts';

export const OPENROUTER_MODELS: ModelOption[] = [
  // TNG Tech
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera', provider: 'TNG Tech' },
  { id: 'tngtech/deepseek-r1t-chimera:free', name: 'DeepSeek R1T Chimera', provider: 'TNG Tech' },
  { id: 'tngtech/r1t-chimera:free', name: 'R1T Chimera', provider: 'TNG Tech' },
  // Arcee AI
  { id: 'arcee-ai/trinity-large-preview:free', name: 'Trinity Large Preview', provider: 'Arcee AI' },
  // Z.AI
  { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air', provider: 'Z.AI' },
  // DeepSeek
  { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 0528', provider: 'DeepSeek' },
  // NVIDIA
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron 3 Nano 30B A3B', provider: 'NVIDIA' },
  // Meta
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct', provider: 'Meta' },
  // Google
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', provider: 'Google' },
  // OpenAI
  { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B', provider: 'OpenAI' },
  { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B', provider: 'OpenAI' },
  // Qwen
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder', provider: 'Qwen' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free', name: 'Qwen3 Next 80b a3b Instruct', provider: 'Qwen' },
  // Upstage
  { id: 'upstage/solar-pro-3:free', name: 'Solar Pro 3', provider: 'Upstage' },
];

export const OLLAMA_MODELS: ModelOption[] = [
  // Recommended models for Salesforce development
  { id: 'llama3.1:8b-instruct-q4_K_M', name: 'Llama 3.1 8B Instruct (Recommended)', provider: 'Ollama' },
  { id: 'dolphin-llama3:8b', name: 'Dolphin Llama 3 8B', provider: 'Ollama' },
  { id: 'codellama:13b-instruct-q4_K_M', name: 'Code Llama 13B Instruct', provider: 'Ollama' },
  
  // Other common models
  { id: 'llama3.1:8b', name: 'Llama 3.1 8B', provider: 'Ollama' },
  { id: 'llama3.2:3b', name: 'Llama 3.2 3B', provider: 'Ollama' },
  { id: 'llama3.2:1b', name: 'Llama 3.2 1B', provider: 'Ollama' },
  { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B', provider: 'Ollama' },
  { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B', provider: 'Ollama' },
  { id: 'deepseek-r1:8b', name: 'DeepSeek R1 8B', provider: 'Ollama' },
  { id: 'mistral:7b', name: 'Mistral 7B', provider: 'Ollama' },
  { id: 'codellama:7b', name: 'Code Llama 7B', provider: 'Ollama' },
  { id: 'gemma2:9b', name: 'Gemma 2 9B', provider: 'Ollama' },
  { id: 'phi3:mini', name: 'Phi 3 Mini', provider: 'Ollama' },
];

export const AVAILABLE_MODELS: ModelOption[] = [...OPENROUTER_MODELS, ...OLLAMA_MODELS];

export const DEFAULT_SETTINGS = {
  model: 'tngtech/deepseek-r1t2-chimera:free',
  systemPrompt: SYSTEM_PROMPT,
  temperature: 0.7,
  apiKey: '',
  provider: 'openrouter' as const,
  ollamaBaseUrl: 'http://localhost:11434',
};
