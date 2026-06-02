import type { OcrAdapter } from '../../types/adapters.js';
import { createOcrSpaceAdapter } from './ocrspace.adapter.js';

let _instance: OcrAdapter | null = null;

export function getOcrAdapter(): OcrAdapter {
  if (!_instance) {
    _instance = createOcrSpaceAdapter();
  }
  return _instance;
}
