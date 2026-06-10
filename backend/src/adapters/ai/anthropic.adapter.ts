import type { AiChatAdapter, ChatMessage } from '../../types/adapters.js';

type AnthropicMessage = { role: 'user' | 'assistant'; content: string };

function toAnthropicMessages(messages: ChatMessage[]): AnthropicMessage[] {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
}

async function callAnthropic(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  stream: boolean;
  onChunk?: (chunk: string) => void;
}): Promise<string> {
  const body: Record<string, unknown> = {
    model: params.model,
    max_tokens: params.maxTokens,
    temperature: params.temperature,
    system: params.systemPrompt,
    messages: toAnthropicMessages(params.messages),
    stream: params.stream,
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }

  if (!params.stream) {
    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    return data.content?.find((c) => c.type === 'text')?.text ?? '';
  }

  if (!response.body || !params.onChunk) {
    return '';
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;

      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: { type?: string; text?: string };
        };
        if (event.type === 'content_block_delta' && event.delta?.text) {
          fullText += event.delta.text;
          params.onChunk(event.delta.text);
        }
      } catch {
        // ignore malformed SSE chunks
      }
    }
  }

  return fullText;
}

export function createAnthropicAdapter(params: {
  apiKey: string;
  model: string;
}): AiChatAdapter {
  return {
    async chat({ systemPrompt, messages, maxTokens = 4096, temperature = 0.3 }) {
      return callAnthropic({
        apiKey: params.apiKey,
        model: params.model,
        systemPrompt,
        messages,
        maxTokens,
        temperature,
        stream: false,
      });
    },

    async streamChat({ systemPrompt, messages, onChunk }) {
      await callAnthropic({
        apiKey: params.apiKey,
        model: params.model,
        systemPrompt,
        messages,
        maxTokens: 4096,
        temperature: 0.3,
        stream: true,
        onChunk,
      });
    },
  };
}
