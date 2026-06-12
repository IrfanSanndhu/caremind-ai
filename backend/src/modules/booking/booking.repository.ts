import { v4 as uuidv4 } from 'uuid';
import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import { DEFAULT_AVAILABILITY_RULES } from './slots.js';

export async function findDoctorByUserId(prisma: PrismaClient, userId: string) {
  return prisma.doctor.findFirst({ where: { userId, deletedAt: null } });
}

export async function findDoctorById(prisma: PrismaClient, doctorId: string, orgId: string) {
  return prisma.doctor.findFirst({ where: { id: doctorId, orgId, deletedAt: null } });
}

export async function listOrgDoctors(prisma: PrismaClient, orgId: string) {
  return prisma.doctor.findMany({
    where: { orgId, deletedAt: null },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
}

export async function getBookingSettings(prisma: PrismaClient, doctorId: string) {
  return prisma.doctorBookingSettings.findUnique({ where: { doctorId } });
}

export async function upsertBookingSettings(
  prisma: PrismaClient,
  data: {
    doctorId: string;
    orgId: string;
    slotDurationMinutes?: 'thirty' | 'sixty';
    minLeadTimeHours?: number;
    maxAdvanceDays?: number;
    timezone?: string;
  },
) {
  return prisma.doctorBookingSettings.upsert({
    where: { doctorId: data.doctorId },
    create: {
      doctorId: data.doctorId,
      orgId: data.orgId,
      slotDurationMinutes: data.slotDurationMinutes ?? 'thirty',
      minLeadTimeHours: data.minLeadTimeHours ?? 2,
      maxAdvanceDays: data.maxAdvanceDays ?? 30,
      timezone: data.timezone ?? 'UTC',
    },
    update: {
      ...(data.slotDurationMinutes !== undefined && {
        slotDurationMinutes: data.slotDurationMinutes,
      }),
      ...(data.minLeadTimeHours !== undefined && { minLeadTimeHours: data.minLeadTimeHours }),
      ...(data.maxAdvanceDays !== undefined && { maxAdvanceDays: data.maxAdvanceDays }),
      ...(data.timezone !== undefined && { timezone: data.timezone }),
    },
  });
}

export async function listAvailabilityRules(prisma: PrismaClient, doctorId: string) {
  return prisma.doctorAvailabilityRule.findMany({
    where: { doctorId },
    orderBy: { dayOfWeek: 'asc' },
  });
}

export async function replaceAvailabilityRules(
  prisma: PrismaClient,
  doctorId: string,
  orgId: string,
  rules: { dayOfWeek: number; startTime: string; endTime: string }[],
) {
  await prisma.doctorAvailabilityRule.deleteMany({ where: { doctorId } });
  if (rules.length === 0) return [];
  await prisma.doctorAvailabilityRule.createMany({
    data: rules.map((r) => ({
      id: uuidv4(),
      doctorId,
      orgId,
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
    })),
  });
  return listAvailabilityRules(prisma, doctorId);
}

export async function ensureDoctorBookingDefaults(
  prisma: PrismaClient,
  doctorId: string,
  orgId: string,
) {
  const settings = await getBookingSettings(prisma, doctorId);
  if (!settings) {
    await upsertBookingSettings(prisma, { doctorId, orgId });
  }
  const rules = await listAvailabilityRules(prisma, doctorId);
  if (rules.length === 0) {
    await replaceAvailabilityRules(prisma, doctorId, orgId, DEFAULT_AVAILABILITY_RULES);
  }
}

export async function listDoctorAppointmentsForSlots(
  prisma: PrismaClient,
  doctorId: string,
  from: Date,
  to: Date,
) {
  return prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: from, lte: to },
      status: { in: ['pending_approval', 'scheduled', 'in_progress'] },
    },
    select: { scheduledAt: true, status: true },
  });
}

export async function findPatientByUserId(prisma: PrismaClient, userId: string) {
  return prisma.patient.findFirst({ where: { userId, deletedAt: null } });
}
