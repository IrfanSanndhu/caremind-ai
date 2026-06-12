import { Redis } from 'ioredis';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

let publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!publisher) {
    publisher = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  }
  return publisher;
}

export function notificationChannel(orgId: string, userId: string): string {
  return `caremind:notifications:${orgId}:${userId}`;
}

export type NotificationPushPayload = {
  type: 'notification';
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    resourceType: string | null;
    resourceId: string | null;
    metadata: unknown;
    readAt: string | null;
    createdAt: string;
  };
  unreadCount?: number;
};

export async function publishNotification(
  orgId: string,
  userId: string,
  payload: NotificationPushPayload,
): Promise<void> {
  try {
    await getPublisher().publish(notificationChannel(orgId, userId), JSON.stringify(payload));
  } catch (err) {
    logger.warn({ err, orgId, userId }, 'Failed to publish notification event');
  }
}

export async function disconnectNotificationPublisher(): Promise<void> {
  if (publisher) {
    await publisher.quit();
    publisher = null;
  }
}
