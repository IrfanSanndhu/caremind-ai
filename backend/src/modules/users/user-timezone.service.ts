import type { PrismaClient as TenantPrisma } from '../../../node_modules/.prisma/tenant-client/index.js';
import { getCentralPrisma } from '../../core/tenant-registry.js';
import { ForbiddenError, ValidationError } from '../../core/errors.js';
import { isValidTimeZone, normalizeTimeZone } from '../../lib/timezone.js';
import * as bookingRepo from '../booking/booking.repository.js';
import type { AuthContext } from '../../types/auth.js';

export async function getUserTimeZone(userId: string): Promise<string> {
  const user = await getCentralPrisma().user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return normalizeTimeZone(user?.timezone ?? 'UTC');
}

export async function getDoctorTimeZone(
  tenantPrisma: TenantPrisma,
  doctorId: string,
  orgId: string,
): Promise<string> {
  const doctor = await tenantPrisma.doctor.findFirst({
    where: { id: doctorId, orgId, deletedAt: null },
    select: { userId: true },
  });
  if (!doctor) return 'UTC';

  const userTz = await getUserTimeZone(doctor.userId);
  if (userTz !== 'UTC') return userTz;

  await bookingRepo.ensureDoctorBookingDefaults(tenantPrisma, doctorId, orgId);
  const settings = await bookingRepo.getBookingSettings(tenantPrisma, doctorId);
  return normalizeTimeZone(settings?.timezone ?? 'UTC');
}

export async function syncDoctorBookingTimeZone(
  tenantPrisma: TenantPrisma,
  doctorId: string,
  orgId: string,
  timeZone: string,
): Promise<void> {
  await bookingRepo.ensureDoctorBookingDefaults(tenantPrisma, doctorId, orgId);
  await bookingRepo.upsertBookingSettings(tenantPrisma, {
    doctorId,
    orgId,
    timezone: normalizeTimeZone(timeZone),
  });
}

/** One-time backfill: copy booking timezone to user profile when user is still UTC. */
export async function backfillUserTimeZoneFromBooking(
  tenantPrisma: TenantPrisma,
  userId: string,
  role: string,
): Promise<string> {
  const central = getCentralPrisma();
  const user = await central.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  if (!user) return 'UTC';

  const current = normalizeTimeZone(user.timezone);
  if (current !== 'UTC' || role !== 'doctor') return current;

  const doctor = await tenantPrisma.doctor.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true, orgId: true },
  });
  if (!doctor) return current;

  const settings = await bookingRepo.getBookingSettings(tenantPrisma, doctor.id);
  const bookingTz = settings?.timezone ? normalizeTimeZone(settings.timezone) : 'UTC';
  if (bookingTz === 'UTC') return current;

  await central.user.update({
    where: { id: userId },
    data: { timezone: bookingTz },
  });
  return bookingTz;
}

export async function updateMyTimeZone(
  auth: AuthContext,
  tenantPrisma: TenantPrisma,
  timeZone: string,
): Promise<{ timezone: string }> {
  if (auth.role !== 'admin' && auth.role !== 'doctor') {
    throw new ForbiddenError('Only admins and doctors can update timezone');
  }
  if (!isValidTimeZone(timeZone)) {
    throw new ValidationError('Invalid timezone. Use an IANA name such as Asia/Karachi');
  }

  const normalized = normalizeTimeZone(timeZone);
  const central = getCentralPrisma();
  await central.user.update({
    where: { id: auth.userId },
    data: { timezone: normalized },
  });

  if (auth.role === 'doctor') {
    const doctor = await tenantPrisma.doctor.findFirst({
      where: { userId: auth.userId, orgId: auth.orgId, deletedAt: null },
      select: { id: true },
    });
    if (doctor) {
      await syncDoctorBookingTimeZone(tenantPrisma, doctor.id, auth.orgId, normalized);
    }
  }

  return { timezone: normalized };
}
