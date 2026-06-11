import type { PrismaClient as TenantPrisma } from '../../../node_modules/.prisma/tenant-client/index.js';
import type { AuditLog } from '../../../node_modules/.prisma/tenant-client/index.js';
import { getCentralPrisma } from '../../core/tenant-registry.js';

function adminDisplayName(email: string): string {
  const local = email.split('@')[0] ?? '';
  if (!local) return 'Administrator';
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ACTION_VERBS: Record<string, string> = {
  READ_RECORD: 'Viewed',
  WRITE_NOTE: 'Created or updated',
  APPROVE_OUTPUT: 'Approved',
  REJECT_OUTPUT: 'Rejected',
  EDIT_OUTPUT: 'Edited',
  RETRY_AI_GENERATION: 'Retried AI generation for',
  UPLOAD_DOCUMENT: 'Uploaded',
  DELETE_DOCUMENT: 'Deleted',
  JOIN_CONSULTATION: 'Joined consultation for',
  START_RECORDING: 'Started recording for',
  STOP_RECORDING: 'Stopped recording for',
  RECORD_CONSENT: 'Recorded consent on',
  INVITE_USER: 'Invited',
  RESEND_LOGIN: 'Resent login details to',
  DELETE_USER: 'Removed',
  REGISTER_ORG: 'Registered organization',
  LOGIN: 'Signed in',
  LOGOUT: 'Signed out',
  SETUP_MFA: 'Started MFA setup',
  VERIFY_MFA: 'Verified MFA',
  AI_CHAT: 'Used AI assistant',
  EXPORT_PDF: 'Exported PDF for',
  VIEW_AUDIT_LOG: 'Viewed audit logs',
};

export function formatAuditSummary(
  action: string,
  resourceType: string,
  metadata?: Record<string, unknown> | null,
): string {
  const verb = ACTION_VERBS[action] ?? action.replace(/_/g, ' ').toLowerCase();
  const resource = resourceType.replace(/([a-z])([A-Z])/g, '$1 $2');
  const parts: string[] = [`${verb} ${resource}`];

  if (metadata && typeof metadata === 'object') {
    if (metadata.consentStatus != null) {
      parts.push(`(consent: ${String(metadata.consentStatus)})`);
    }
    if (metadata.status != null) {
      parts.push(`(status: ${String(metadata.status)})`);
    }
    if (metadata.type != null) {
      parts.push(`(${String(metadata.type)})`);
    }
    if (metadata.reprocess === true) {
      parts.push('(reprocess)');
    }
    if (metadata.contextChunkCount != null) {
      parts.push(`(${String(metadata.contextChunkCount)} context chunks)`);
    }
    if (metadata.chunkCount != null) {
      parts.push(`(${String(metadata.chunkCount)} chunks)`);
    }
  }

  return parts.join(' ');
}

export type EnrichedAuditLog = AuditLog & {
  userEmail: string;
  userName: string;
  userRole: string;
  summary: string;
};

export async function enrichAuditLogs(
  orgId: string,
  tenantPrisma: TenantPrisma,
  logs: AuditLog[],
): Promise<EnrichedAuditLog[]> {
  if (logs.length === 0) return [];

  const userIds = [...new Set(logs.map((l) => l.userId))];
  const central = getCentralPrisma();

  const [users, doctors, patients] = await Promise.all([
    central.user.findMany({
      where: { orgId, id: { in: userIds } },
      select: { id: true, email: true, role: true },
    }),
    tenantPrisma.doctor.findMany({
      where: { orgId, userId: { in: userIds }, deletedAt: null },
      select: { userId: true, firstName: true, lastName: true },
    }),
    tenantPrisma.patient.findMany({
      where: { orgId, userId: { in: userIds }, deletedAt: null },
      select: { userId: true, firstName: true, lastName: true },
    }),
  ]);

  const userById = new Map(users.map((u) => [u.id, u]));
  const doctorNameByUser = new Map(
    doctors.map((d) => [d.userId, `${d.firstName} ${d.lastName}`.trim()]),
  );
  const patientNameByUser = new Map(
    patients.map((p) => [p.userId, `${p.firstName} ${p.lastName}`.trim()]),
  );

  return logs.map((log) => {
    const user = userById.get(log.userId);
    const email = user?.email ?? 'Unknown user';
    const role = user?.role ?? 'unknown';
    let userName = email;
    if (user?.role === 'doctor') {
      const n = doctorNameByUser.get(log.userId);
      userName = n ? `Dr. ${n}` : email;
    } else if (user?.role === 'patient') {
      userName = patientNameByUser.get(log.userId) ?? email;
    } else if (user?.role === 'admin') {
      userName = adminDisplayName(email);
    }

    const metadata =
      log.metadata && typeof log.metadata === 'object' && !Array.isArray(log.metadata)
        ? (log.metadata as Record<string, unknown>)
        : null;

    return {
      ...log,
      userEmail: email,
      userName,
      userRole: role,
      summary: formatAuditSummary(log.action, log.resourceType, metadata),
    };
  });
}
