import type { Prisma } from '../../../node_modules/.prisma/tenant-client/index.js';
import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';

export async function createInAppNotification(
  prisma: PrismaClient,
  data: {
    id: string;
    orgId: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return prisma.notification.create({
    data: {
      id: data.id,
      orgId: data.orgId,
      userId: data.userId,
      channel: 'in_app',
      type: data.type,
      title: data.title,
      body: data.body,
      status: 'sent',
      sentAt: new Date(),
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export const NOTIFICATION_PAGE_SIZE = 30;
export const NOTIFICATION_RETENTION_DAYS = 30;

export async function listNotifications(
  prisma: PrismaClient,
  orgId: string,
  userId: string,
  options: { limit: number; page: number; unreadOnly?: boolean },
) {
  const skip = (options.page - 1) * options.limit;
  const rows = await prisma.notification.findMany({
    where: {
      orgId,
      userId,
      channel: 'in_app',
      ...(options.unreadOnly ? { readAt: null } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take: options.limit + 1,
  });

  const hasMore = rows.length > options.limit;
  return {
    items: rows.slice(0, options.limit),
    hasMore,
  };
}

export async function deleteStaleNotifications(
  prisma: PrismaClient,
  olderThanDays: number = NOTIFICATION_RETENTION_DAYS,
) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);
  return prisma.notification.deleteMany({
    where: {
      channel: 'in_app',
      createdAt: { lt: cutoff },
    },
  });
}

export async function countUnread(
  prisma: PrismaClient,
  orgId: string,
  userId: string,
) {
  return prisma.notification.count({
    where: {
      orgId,
      userId,
      channel: 'in_app',
      readAt: null,
    },
  });
}

export async function markRead(
  prisma: PrismaClient,
  orgId: string,
  userId: string,
  notificationId: string,
) {
  return prisma.notification.updateMany({
    where: { id: notificationId, orgId, userId, channel: 'in_app' },
    data: { readAt: new Date() },
  });
}

export async function markUnread(
  prisma: PrismaClient,
  orgId: string,
  userId: string,
  notificationId: string,
) {
  return prisma.notification.updateMany({
    where: { id: notificationId, orgId, userId, channel: 'in_app' },
    data: { readAt: null },
  });
}

export async function markAllRead(
  prisma: PrismaClient,
  orgId: string,
  userId: string,
) {
  return prisma.notification.updateMany({
    where: { orgId, userId, channel: 'in_app', readAt: null },
    data: { readAt: new Date() },
  });
}
