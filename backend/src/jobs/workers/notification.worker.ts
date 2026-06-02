import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { getTenantPrisma } from '../../core/tenant-prisma.js';
import { sendNotification } from '../../modules/notifications/notifications.service.js';
import type { NotificationJobData } from '../queue.js';
import type { NotificationType } from '../../modules/notifications/notifications.service.js';

export function createNotificationWorker(): Worker {
  return new Worker<NotificationJobData>(
    'notification',
    async (job) => {
      const { tenantDbUrl, orgId, userId, userEmail, userPhone, type, payload } = job.data;
      logger.info({ jobId: job.id, type, userId }, 'Processing notification job');

      const tenantPrisma = getTenantPrisma(tenantDbUrl);

      await sendNotification({
        tenantPrisma,
        orgId,
        userId,
        userEmail,
        userPhone,
        type: type as NotificationType,
        payload,
      });
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 20,
    },
  );
}
