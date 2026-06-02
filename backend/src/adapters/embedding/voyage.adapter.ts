import { env } from '../../config/env.js';
import type { EmbeddingAdapter } from '../../types/adapters.js';
import { AppError } from '../../core/errors.js';

interface VoyageEmbedResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { total_tokens: number };
}

async function callVoyageApi(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: texts, model: env.VOYAGE_MODEL }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(
      `Voyage AI embedding failed: ${response.status} ${body}`,
      502,
      'EMBEDDING_ERROR',
    );
  }

  const data = (await response.json()) as VoyageEmbedResponse;
  return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export function createVoyageAdapter(): EmbeddingAdapter {
  return {
    async embed(text) {
      const results = await callVoyageApi([text]);
      return results[0]!;
    },

    async embedBatch(texts) {
      if (texts.length === 0) return [];
      // Voyage AI supports up to 128 texts per batch
      const BATCH_SIZE = 128;
      const results: number[][] = [];

      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const embeddings = await callVoyageApi(batch);
        results.push(...embeddings);
      }

      return results;
    },
  };
}
