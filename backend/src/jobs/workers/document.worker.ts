import { createRequire } from 'node:module';
import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { getTenantPrisma } from '../../core/tenant-prisma.js';
import { getStorageAdapter } from '../../adapters/storage/index.js';
import { getOcrAdapter } from '../../adapters/ocr/index.js';
import { embeddingQueue } from '../queue.js';
import type { DocumentJobData } from '../queue.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text as string;
  } catch {
    return '';
  }
}

async function processDocument(data: DocumentJobData): Promise<void> {
  const { tenantDbUrl, orgId, documentId } = data;
  const tenantPrisma = getTenantPrisma(tenantDbUrl);
  const storage = getStorageAdapter();
  const ocr = getOcrAdapter();

  const document = await tenantPrisma.document.findUnique({ where: { id: documentId } });
  if (!document) {
    logger.warn({ documentId }, 'Document not found for processing');
    return;
  }

  await tenantPrisma.document.update({
    where: { id: documentId },
    data: { processingStatus: 'processing' },
  });

  try {
    const buffer = await storage.download(document.storageBucket, document.storageKey);
    let extractedText = '';

    if (document.mimeType === 'application/pdf') {
      const pdfText = await extractTextFromPdf(buffer);

      if (pdfText.trim().length < 100) {
        const ocrResult = await ocr.extractText({
          imageBuffer: buffer,
          mimeType: 'application/pdf',
        });
        extractedText = ocrResult.text;
      } else {
        extractedText = pdfText;
      }
    } else if (document.mimeType === 'image/jpeg' || document.mimeType === 'image/png') {
      const mimeType = document.mimeType as 'image/jpeg' | 'image/png';
      const ocrResult = await ocr.extractText({ imageBuffer: buffer, mimeType });
      extractedText = ocrResult.text;
    }

    await tenantPrisma.document.update({
      where: { id: documentId },
      data: { extractedText, processingStatus: 'ready' },
    });

    if (extractedText.trim()) {
      await embeddingQueue.add('knowledge-base.ingest', {
        tenantDbUrl,
        orgId,
        patientId: document.patientId,
        text: extractedText,
        documentId,
        documentType: document.documentType ?? 'document',
      });
    }

    logger.info({ documentId }, 'Document processed successfully');
  } catch (err) {
    logger.error({ err, documentId }, 'Document processing failed');
    await tenantPrisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'failed' },
    });
    throw err;
  }
}

export function createDocumentWorker(): Worker {
  return new Worker<DocumentJobData>(
    'document',
    async (job) => {
      logger.info({ jobId: job.id, documentId: job.data.documentId }, 'Processing document job');
      await processDocument(job.data);
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 5,
    },
  );
}
