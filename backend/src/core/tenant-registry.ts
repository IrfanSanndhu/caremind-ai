import { PrismaClient } from '../lib/prisma/central.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { TenantError, NotFoundError } from './errors.js';
import type { TenantRecord } from '../types/tenant.js';
import { execSync } from 'child_process';
import { runTenantMigrations } from './run-tenant-migrations.js';

// ─── Central Prisma singleton ───────────────────────────────────────────────

let _centralPrisma: PrismaClient | null = null;

export function getCentralPrisma(): PrismaClient {
  if (!_centralPrisma) {
    _centralPrisma = new PrismaClient({
      datasources: { db: { url: env.CENTRAL_DATABASE_URL } },
      log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return _centralPrisma;
}

// ─── In-memory LRU cache ────────────────────────────────────────────────────

interface CacheEntry {
  record: TenantRecord;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_SIZE = 500;

function cacheGet(orgId: string): TenantRecord | null {
  const entry = cache.get(orgId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(orgId);
    return null;
  }
  return entry.record;
}

function cacheSet(orgId: string, record: TenantRecord): void {
  if (cache.size >= CACHE_MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(orgId, { record, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function getTenantById(orgId: string): Promise<TenantRecord | null> {
  const cached = cacheGet(orgId);
  if (cached) return cached;

  const prisma = getCentralPrisma();
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return null;

  const record: TenantRecord = {
    id: org.id,
    name: org.name,
    slug: org.slug,
    dbUrl: org.dbUrl,
    plan: org.plan,
    createdAt: org.createdAt,
  };
  cacheSet(orgId, record);
  return record;
}

export async function getTenantDbUrl(orgId: string): Promise<string> {
  const record = await getTenantById(orgId);
  if (!record) throw new NotFoundError(`Organization ${orgId} not found`);
  return record.dbUrl;
}

/** Database name is prefix + org UUID (hyphens → underscores). Never uses org name or slug. */
export function buildTenantDbName(orgId: string): string {
  return `${env.TENANT_DB_NAME_PREFIX}${orgId.replace(/-/g, '_')}`;
}

export function buildTenantDbUrl(orgId: string): string {
  const dbName = buildTenantDbName(orgId);
  return (
    `postgresql://${env.TENANT_DB_USER}:${env.TENANT_DB_PASSWORD}` +
    `@${env.TENANT_DB_HOST}:${env.TENANT_DB_PORT}/${dbName}`
  );
}

export async function createTenantDatabase(
  orgId: string,
  _orgSlug: string,
): Promise<string> {
  const dbUrl = buildTenantDbUrl(orgId);
  const dbName = buildTenantDbName(orgId);

  try {
    const adminUrl =
      `postgresql://${env.TENANT_DB_USER}:${env.TENANT_DB_PASSWORD}` +
      `@${env.TENANT_DB_HOST}:${env.TENANT_DB_PORT}/postgres`;

    execSync(
      `psql "${adminUrl}" -c "CREATE DATABASE \\"${dbName}\\" TEMPLATE template0 ENCODING 'UTF8';"`,
      { stdio: 'pipe' },
    );
    logger.info({ orgId, dbName }, 'Tenant database created');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('already exists')) {
      throw new TenantError(`Failed to create tenant database: ${message}`);
    }
    logger.info({ orgId, dbName }, 'Tenant database already exists');
  }

  runTenantMigrations(dbUrl);
  logger.info({ orgId }, 'Tenant migrations applied');

  return dbUrl;
}

export function invalidateTenantCache(orgId: string): void {
  cache.delete(orgId);
}
