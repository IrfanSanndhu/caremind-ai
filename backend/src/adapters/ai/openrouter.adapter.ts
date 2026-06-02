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

export function createOpenRouterAdapter(): AiChatAdapter {
  const client = new OpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: env.OPENROUTER_BASE_URL,
    defaultHeaders: {
      'HTTP-Referer': env.APP_URL,
      'X-Title': 'CareMind AI',
    },
  });

  return {
    async chat({ systemPrompt, messages, maxTokens = 4096, temperature = 0.3 }) {
      const completion = await client.chat.completions.create({
        model: env.OPENROUTER_MODEL,
        messages: buildMessages(systemPrompt, messages),
        max_tokens: maxTokens,
        temperature,
      });

      return completion.choices[0]?.message?.content ?? '';
    },

    async streamChat({ systemPrompt, messages, onChunk }) {
      const stream = await client.chat.completions.create({
        model: env.OPENROUTER_MODEL,
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
