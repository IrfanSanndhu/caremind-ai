import type { PdfExportAdapter } from '../../types/adapters.js';
import { createPuppeteerAdapter } from './puppeteer.adapter.js';

let _instance: PdfExportAdapter | null = null;

export function getPdfExportAdapter(): PdfExportAdapter {
  if (!_instance) {
    _instance = createPuppeteerAdapter();
  }
  return _instance;
}
