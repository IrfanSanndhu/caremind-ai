import type { AiChatAdapter } from '../../types/adapters.js';
import { createLlmAdapter } from './llm.factory.js';

let _instance: AiChatAdapter | null = null;

export function getAiChatAdapter(): AiChatAdapter {
  if (!_instance) {
    _instance = createLlmAdapter();
  }
  return _instance;
}
