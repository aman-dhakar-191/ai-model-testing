import type { ModelOption } from '../types';

export const AVAILABLE_MODELS: ModelOption[] = [
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
  // Qwen
  { id: 'qwen/qwen3-coder-480b-a35b:free', name: 'Qwen3 Coder 480B A35B', provider: 'Qwen' },
  // Upstage
  { id: 'upstage/solar-pro-3:free', name: 'Solar Pro 3', provider: 'Upstage' },
];

export const DEFAULT_SETTINGS = {
  model: 'tngtech/deepseek-r1t2-chimera:free',
  systemPrompt: '',
  temperature: 0.7,
  apiKey: '',
};
