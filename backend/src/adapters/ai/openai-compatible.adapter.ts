import OpenAI from 'openai';
import { env } from '../../config/env.js';
import type { AiChatAdapter, ChatMessage } from '../../types/adapters.js';

function buildMessages(
  systemPrompt: string,
  messages: ChatMessage[],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];
}

export function createOpenAiCompatibleAdapter(params: {
  apiKey: string;
  model: string;
  baseURL: string;
  extraHeaders?: Record<string, string>;
}): AiChatAdapter {
  const client = new OpenAI({
    apiKey: params.apiKey,
    baseURL: params.baseURL,
    defaultHeaders: params.extraHeaders,
  });

  return {
    async chat({ systemPrompt, messages, maxTokens = 4096, temperature = 0.3 }) {
      const completion = await client.chat.completions.create({
        model: params.model,
        messages: buildMessages(systemPrompt, messages),
        max_tokens: maxTokens,
        temperature,
      });

      return completion.choices[0]?.message?.content ?? '';
    },

    async streamChat({ systemPrompt, messages, onChunk }) {
      const stream = await client.chat.completions.create({
        model: params.model,
        messages: buildMessages(systemPrompt, messages),
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) onChunk(content);
      }
    },
  };
}

/** @deprecated Use createOpenAiCompatibleAdapter via getAiChatAdapter */
export function createOpenRouterAdapter(): AiChatAdapter {
  return createOpenAiCompatibleAdapter({
    apiKey: env.LLM_API_KEY,
    model: env.LLM_MODEL,
    baseURL: env.LLM_BASE_URL ?? 'https://openrouter.ai/api/v1',
    extraHeaders: {
      'HTTP-Referer': env.APP_URL,
      'X-Title': 'CareMind AI',
    },
  });
}
