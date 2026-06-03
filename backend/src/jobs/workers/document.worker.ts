import { createRequire } from 'node:module';
import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { getTenantPrisma } from '../../core/tenant-prisma.js';
import { getStorageAdapter } from '../../adapters/storage/index.js';
import { getOcrAdapter } from '../../adapters/ocr/index.js';
import { ingestText } from '../../modules/knowledge-base/knowledge-base.service.js';
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
    } else if (
      document.mimeType === 'image/jpeg' ||
      document.mimeType === 'image/jpg' ||
      document.mimeType === 'image/png'
    ) {
      const ocrMime: 'image/jpeg' | 'image/png' =
        document.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
      const ocrResult = await ocr.extractText({ imageBuffer: buffer, mimeType: ocrMime });
      extractedText = ocrResult.text;
    }

    if (!extractedText.trim()) {
      await tenantPrisma.document.update({
        where: { id: documentId },
        data: { extractedText: null, processingStatus: 'failed' },
      });
      logger.warn(
        { documentId, mimeType: document.mimeType, fileName: document.fileName, appointmentId: document.appointmentId },
        'No text extracted from document — not vectorized',
      );
      return;
    }

    const header = [
      `File: ${document.fileName}`,
      document.documentType ? `Document type: ${document.documentType}` : null,
      document.appointmentId ? `Linked to appointment: ${document.appointmentId}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const textForIngest = `${header}\n\n${extractedText.trim()}`;

    await ingestText({
      tenantPrisma,
      orgId,
      patientId: document.patientId,
      text: textForIngest,
      documentId,
      appointmentId: document.appointmentId ?? undefined,
      documentType: document.documentType ?? 'document',
      fileName: document.fileName,
    });

    await tenantPrisma.document.update({
      where: { id: documentId },
      data: { extractedText: textForIngest, processingStatus: 'ready' },
    });

    logger.info(
      { documentId, appointmentId: document.appointmentId, fileName: document.fileName },
      'Document processed and vectorized',
    );
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
