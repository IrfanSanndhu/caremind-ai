import { logger } from '../../config/logger.js';
import { getTenantPrisma } from '../../core/tenant-prisma.js';
import { getCentralPrisma } from '../../core/tenant-registry.js';
import { deleteStaleNotifications } from './notifications.repository.js';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export async function runNotificationCleanupForAllTenants(): Promise<void> {
  const orgs = await getCentralPrisma().organization.findMany({
    select: { id: true, dbUrl: true },
  });

  let totalDeleted = 0;
  for (const org of orgs) {
    try {
      const tenantPrisma = getTenantPrisma(org.dbUrl);
      const result = await deleteStaleNotifications(tenantPrisma);
      totalDeleted += result.count;
    } catch (err) {
      logger.warn({ err, orgId: org.id }, 'Notification retention cleanup failed for tenant');
    }
  }

  if (totalDeleted > 0) {
    logger.info({ totalDeleted }, 'Pruned stale in-app notifications');
  }
}

export function startNotificationCleanupScheduler(): void {
  if (cleanupTimer) return;

  void runNotificationCleanupForAllTenants();

  cleanupTimer = setInterval(() => {
    void runNotificationCleanupForAllTenants();
  }, CLEANUP_INTERVAL_MS);
}

export function stopNotificationCleanupScheduler(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
