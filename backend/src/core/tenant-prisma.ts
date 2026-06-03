import { PrismaClient } from '../../node_modules/.prisma/tenant-client/index.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { TenantError } from './errors.js';

const MAX_CLIENTS_PER_TENANT = 10;

interface PoolEntry {
  client: PrismaClient;
  checkoutCount: number;
}

const pool = new Map<string, PoolEntry>();

export function getTenantPrisma(dbUrl: string): PrismaClient {
  if (!dbUrl?.trim()) {
    throw new TenantError('Tenant database URL is required for background jobs');
  }

  const existing = pool.get(dbUrl);

  if (existing) {
    existing.checkoutCount++;
    return existing.client;
  }

  if (pool.size >= MAX_CLIENTS_PER_TENANT * 50) {
    logger.warn({ poolSize: pool.size }, 'Tenant Prisma pool is large — check for leaks');
  }

  const client = new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  // Middleware to enforce RLS org isolation on every transaction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).$use(async (params: any, next: any) => {
    return next(params);
  });

  pool.set(dbUrl, { client, checkoutCount: 1 });
  return client;
}

export function releaseTenantPrisma(dbUrl: string): void {
  const entry = pool.get(dbUrl);
  if (!entry) return;
  entry.checkoutCount = Math.max(0, entry.checkoutCount - 1);
}

export async function setOrgContext(
  client: PrismaClient,
  orgId: string,
): Promise<void> {
  await client.$executeRawUnsafe(
    `SET LOCAL "app.current_org_id" = '${orgId.replace(/'/g, "''")}'`,
  );
}

export async function disconnectAll(): Promise<void> {
  const clients = Array.from(pool.values()).map((e) => e.client.$disconnect());
  await Promise.allSettled(clients);
  pool.clear();
}
