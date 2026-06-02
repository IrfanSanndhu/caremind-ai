import type { StorageAdapter } from '../../types/adapters.js';
import { createMinioAdapter } from './minio.adapter.js';

let _instance: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!_instance) {
    _instance = createMinioAdapter();
  }
  return _instance;
}
