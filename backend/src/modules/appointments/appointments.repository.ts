import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import { sortAppointments } from './appointments.sort.js';

export async function createAppointment(
  prisma: PrismaClient,
  data: {
    id: string;
    orgId: string;
    patientId: string;
    doctorId: string;
    scheduledAt: Date;
    livekitRoomName: string;
  },
) {
  return prisma.appointment.create({ data });
}

export async function findAppointmentById(prisma: PrismaClient, id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: { patient: true, doctor: true },
  });
}

export async function listAppointments(
  prisma: PrismaClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: any,
  options: { skip: number; take: number; statusFilter?: string },
) {
  const rows = await prisma.appointment.findMany({
    where,
    include: { patient: true, doctor: true },
  });
  const sorted = sortAppointments(rows, options.statusFilter);
  return sorted.slice(options.skip, options.skip + options.take);
}

export async function countAppointments(
  prisma: PrismaClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: any,
) {
  return prisma.appointment.count({ where });
}

export async function updateAppointment(
  prisma: PrismaClient,
  id: string,
  data: Partial<{
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    scheduledAt: Date;
    consentStatus: 'pending' | 'accepted' | 'declined';
    consentTimestamp: Date;
    noRecording: boolean;
  }>,
) {
  return prisma.appointment.update({ where: { id }, data });
}

export async function findDoctorByUserId(prisma: PrismaClient, userId: string) {
  return prisma.doctor.findFirst({ where: { userId } });
}

export async function findPatientByUserId(prisma: PrismaClient, userId: string) {
  return prisma.patient.findFirst({ where: { userId } });
}
