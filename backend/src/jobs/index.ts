import { logger } from '../config/logger.js';
import { createDocumentWorker } from './workers/document.worker.js';
import { createTranscriptionWorker } from './workers/transcription.worker.js';
import { createEmbeddingWorker } from './workers/embedding.worker.js';
import { createNotificationWorker } from './workers/notification.worker.js';
import type { Worker } from 'bullmq';

let workers: Worker[] = [];

export async function startWorkers(): Promise<void> {
  workers = [
    createDocumentWorker(),
    createTranscriptionWorker(),
    createEmbeddingWorker(),
    createNotificationWorker(),
  ];

  for (const worker of workers) {
    worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, queue: worker.name, err }, 'Job failed');
    });
    worker.on('error', (err) => {
      logger.error({ queue: worker.name, err }, 'Worker error');
    });
  }

  logger.info(`${workers.length} BullMQ workers started`);
}

export async function stopWorkers(): Promise<void> {
  await Promise.allSettled(workers.map((w) => w.close()));
  logger.info('All workers stopped');
}
