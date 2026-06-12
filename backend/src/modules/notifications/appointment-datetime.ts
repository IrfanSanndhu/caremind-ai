import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import { formatInTimeZone } from '../../lib/format-datetime.js';
import { getDoctorTimeZone } from '../users/user-timezone.service.js';

export async function formatAppointmentScheduledAt(
  tenantPrisma: PrismaClient,
  doctorId: string,
  orgId: string,
  scheduledAt: Date,
): Promise<string> {
  const timeZone = await getDoctorTimeZone(tenantPrisma, doctorId, orgId);
  return formatInTimeZone(scheduledAt, timeZone);
}
