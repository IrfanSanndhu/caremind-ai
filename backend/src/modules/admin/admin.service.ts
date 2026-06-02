import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import { getCentralPrisma } from '../../core/tenant-registry.js';
import { auditLog } from '../../core/audit-logger.js';
import type { AuthContext } from '../../types/auth.js';
import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function getDashboard(auth: AuthContext, tenantPrisma: PrismaClient) {
  const central = getCentralPrisma();

  const [totalUsers, doctors, patients, appointments, documents] = await Promise.all([
    central.user.count({ where: { orgId: auth.orgId, deletedAt: null } }),
    tenantPrisma.doctor.count({ where: { orgId: auth.orgId } }),
    tenantPrisma.patient.count({ where: { orgId: auth.orgId } }),
    tenantPrisma.appointment.count({ where: { orgId: auth.orgId } }),
    tenantPrisma.document.count({ where: { orgId: auth.orgId } }),
  ]);

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'READ_RECORD',
    resourceType: 'Dashboard',
    resourceId: auth.orgId,
  });

  return { totalUsers, doctors, patients, appointments, documents };
}

export async function getAuditLogs(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  query: z.infer<typeof auditLogQuerySchema>,
) {
  const { page, limit, userId, action, resourceType, from, to } = query;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { orgId: auth.orgId };
  if (userId) where['userId'] = userId;
  if (action) where['action'] = action;
  if (resourceType) where['resourceType'] = resourceType;
  if (from || to) {
    where['createdAt'] = {};
    if (from) where['createdAt']['gte'] = new Date(from);
    if (to) where['createdAt']['lte'] = new Date(to);
  }

  const [logs, total] = await Promise.all([
    tenantPrisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    tenantPrisma.auditLog.count({ where }),
  ]);

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'VIEW_AUDIT_LOG',
    resourceType: 'AuditLog',
    resourceId: auth.orgId,
  });

  return { logs, total, page, limit };
}

export async function getRecentActivity(auth: AuthContext, tenantPrisma: PrismaClient) {
  const recentLogs = await tenantPrisma.auditLog.findMany({
    where: { orgId: auth.orgId },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });
  return recentLogs;
}
