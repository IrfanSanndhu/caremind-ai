import type { Request, Response, NextFunction } from 'express';
import { getTenantById } from '../../core/tenant-registry.js';
import { getTenantPrisma } from '../../core/tenant-prisma.js';
import { TenantError } from '../../core/errors.js';
import type { TenantContext } from '../../types/tenant.js';
import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';

declare global {
  namespace Express {
    interface Request {
      tenantPrisma: PrismaClient;
      tenantContext: TenantContext;
    }
  }
}

export async function resolveTenant(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orgId = req.auth.orgId;
    const record = await getTenantById(orgId);

    if (!record) {
      return next(new TenantError(`Organization ${orgId} not found`));
    }

    req.tenantContext = {
      tenantId: orgId,
      dbUrl: record.dbUrl,
    };

    req.tenantPrisma = getTenantPrisma(record.dbUrl);

    // Set RLS context for this request's org
    await req.tenantPrisma.$executeRawUnsafe(
      `SET "app.current_org_id" = '${orgId.replace(/'/g, "''")}'`,
    );

    next();
  } catch (err) {
    next(err);
  }
}
