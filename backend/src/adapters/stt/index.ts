import type { SttAdapter } from '../../types/adapters.js';
import { createDeepgramAdapter } from './deepgram.adapter.js';

let _instance: SttAdapter | null = null;

export function getSttAdapter(): SttAdapter {
  if (!_instance) {
    _instance = createDeepgramAdapter();
  }
  return _instance;
}
