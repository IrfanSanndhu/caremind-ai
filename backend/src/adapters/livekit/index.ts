import type { LiveKitAdapter } from '../../types/adapters.js';
import { createLiveKitAdapter } from './livekit.adapter.js';

let _instance: LiveKitAdapter | null = null;

export function getLiveKitAdapter(): LiveKitAdapter {
  if (!_instance) {
    _instance = createLiveKitAdapter();
  }
  return _instance;
}
