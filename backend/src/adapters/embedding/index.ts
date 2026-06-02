import type { EmbeddingAdapter } from '../../types/adapters.js';
import { createVoyageAdapter } from './voyage.adapter.js';

let _instance: EmbeddingAdapter | null = null;

export function getEmbeddingAdapter(): EmbeddingAdapter {
  if (!_instance) {
    _instance = createVoyageAdapter();
  }
  return _instance;
}
