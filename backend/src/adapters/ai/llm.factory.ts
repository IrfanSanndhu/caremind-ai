import { env } from '../../config/env.js';
import type { AiChatAdapter } from '../../types/adapters.js';
import { createAnthropicAdapter } from './anthropic.adapter.js';
import { createOpenAiCompatibleAdapter } from './openai-compatible.adapter.js';

export function createLlmAdapter(): AiChatAdapter {
  const { LLM_PROVIDER, LLM_API_KEY, LLM_MODEL, LLM_BASE_URL, APP_URL } = env;

  switch (LLM_PROVIDER) {
    case 'anthropic':
      return createAnthropicAdapter({ apiKey: LLM_API_KEY, model: LLM_MODEL });

    case 'openai':
      return createOpenAiCompatibleAdapter({
        apiKey: LLM_API_KEY,
        model: LLM_MODEL,
        baseURL: LLM_BASE_URL ?? 'https://api.openai.com/v1',
      });

    case 'google':
      return createOpenAiCompatibleAdapter({
        apiKey: LLM_API_KEY,
        model: LLM_MODEL,
        baseURL: LLM_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });

    case 'openrouter':
    default:
      return createOpenAiCompatibleAdapter({
        apiKey: LLM_API_KEY,
        model: LLM_MODEL,
        baseURL: LLM_BASE_URL ?? 'https://openrouter.ai/api/v1',
        extraHeaders: {
          'HTTP-Referer': APP_URL,
          'X-Title': 'CareMind AI',
        },
      });
  }
}
