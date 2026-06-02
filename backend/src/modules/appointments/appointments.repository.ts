import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';

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
  options: { skip: number; take: number },
) {
  return prisma.appointment.findMany({
    where,
    skip: options.skip,
    take: options.take,
    orderBy: { scheduledAt: 'desc' },
    include: { patient: true, doctor: true },
  });
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
