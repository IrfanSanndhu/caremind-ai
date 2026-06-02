import type { AiChatAdapter } from '../../types/adapters.js';
import { createOpenRouterAdapter } from './openrouter.adapter.js';

let _instance: AiChatAdapter | null = null;

export function getAiChatAdapter(): AiChatAdapter {
  if (!_instance) {
    _instance = createOpenRouterAdapter();
  }
  return _instance;
}
