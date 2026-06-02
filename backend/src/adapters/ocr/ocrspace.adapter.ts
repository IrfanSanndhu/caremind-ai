import { env } from '../../config/env.js';
import type { OcrAdapter } from '../../types/adapters.js';
import { AppError } from '../../core/errors.js';

interface OcrSpaceResponse {
  ParsedResults?: Array<{ ParsedText: string; TextOverlay?: unknown }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string | string[];
  ProcessingTimeInMilliseconds: string;
}

export function createOcrSpaceAdapter(): OcrAdapter {
  return {
    async extractText({ imageBuffer, mimeType }) {
      const base64 = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      const formData = new URLSearchParams();
      formData.append('base64Image', dataUrl);
      formData.append('apikey', env.OCRSPACE_API_KEY);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (response.status === 429) {
        throw new AppError('OCR.Space rate limit exceeded', 429, 'OCR_RATE_LIMIT');
      }

      if (!response.ok) {
        throw new AppError(
          `OCR.Space request failed: ${response.status}`,
          502,
          'OCR_ERROR',
        );
      }

      const data = (await response.json()) as OcrSpaceResponse;

      if (data.IsErroredOnProcessing) {
        const msg = Array.isArray(data.ErrorMessage)
          ? data.ErrorMessage.join('; ')
          : (data.ErrorMessage ?? 'Unknown OCR error');
        throw new AppError(`OCR processing failed: ${msg}`, 502, 'OCR_PROCESSING_ERROR');
      }

      const text =
        data.ParsedResults?.map((r) => r.ParsedText).join('\n').trim() ?? '';

      return { text };
    },
  };
}
