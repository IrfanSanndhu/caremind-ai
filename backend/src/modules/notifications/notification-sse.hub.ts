import type { Response } from 'express';
import { Redis } from 'ioredis';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { notificationChannel } from './notification.publisher.js';

type ConnectionKey = string;

function connectionKey(orgId: string, userId: string): ConnectionKey {
  return `${orgId}:${userId}`;
}

const connections = new Map<ConnectionKey, Set<Response>>();
let subscriber: Redis | null = null;

function writeSse(res: Response, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function addSseConnection(orgId: string, userId: string, res: Response): void {
  const key = connectionKey(orgId, userId);
  let set = connections.get(key);
  if (!set) {
    set = new Set();
    connections.set(key, set);
  }
  set.add(res);

  res.on('close', () => {
    set?.delete(res);
    if (set && set.size === 0) {
      connections.delete(key);
    }
  });
}

function pushToLocalConnections(orgId: string, userId: string, payload: unknown): void {
  const set = connections.get(connectionKey(orgId, userId));
  if (!set?.size) return;

  for (const res of set) {
    try {
      writeSse(res, payload);
    } catch (err) {
      logger.warn({ err, orgId, userId }, 'Failed to write SSE notification');
    }
  }
}

export async function initNotificationSubscriber(): Promise<void> {
  if (subscriber) return;

  subscriber = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  await subscriber.psubscribe('caremind:notifications:*');

  subscriber.on('pmessage', (_pattern: string, channel: string, message: string) => {
    try {
      const parts = channel.split(':');
      const orgId = parts[2];
      const userId = parts[3];
      if (!orgId || !userId) return;

      const payload = JSON.parse(message) as unknown;
      pushToLocalConnections(orgId, userId, payload);
    } catch (err) {
      logger.warn({ err }, 'Failed to handle notification pub/sub message');
    }
  });

  logger.info('Notification SSE subscriber started');
}

export async function disconnectNotificationSubscriber(): Promise<void> {
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
  connections.clear();
}

export function sendHeartbeat(res: Response): void {
  res.write(': heartbeat\n\n');
}

export { notificationChannel };
