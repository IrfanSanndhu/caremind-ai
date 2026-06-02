import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { getTenantPrisma } from '../../core/tenant-prisma.js';
import { ingestText } from '../../modules/knowledge-base/knowledge-base.service.js';
import type { EmbeddingJobData } from '../queue.js';

export function createEmbeddingWorker(): Worker {
  return new Worker<EmbeddingJobData>(
    'embedding',
    async (job) => {
      const { tenantDbUrl, orgId, patientId, text, documentId, appointmentId, documentType } = job.data;
      logger.info({ jobId: job.id, documentId, appointmentId }, 'Processing embedding job');

      const tenantPrisma = getTenantPrisma(tenantDbUrl);

      await ingestText({
        tenantPrisma,
        orgId,
        patientId,
        text,
        documentId,
        appointmentId,
        documentType,
      });

      logger.info({ jobId: job.id }, 'Embedding ingestion complete');
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 10,
    },
  );
}
