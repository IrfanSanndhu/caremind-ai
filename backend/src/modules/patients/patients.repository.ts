import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';

export async function listPatients(
  prisma: PrismaClient,
  orgId: string,
  doctorId: string | null,
  options: { skip: number; take: number },
) {
  return prisma.patient.findMany({
    where: {
      orgId,
      deletedAt: null,
      ...(doctorId ? { primaryDoctorId: doctorId } : {}),
    },
    skip: options.skip,
    take: options.take,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { appointments: true } },
    },
  });
}

export async function countPatients(prisma: PrismaClient, orgId: string, doctorId: string | null) {
  return prisma.patient.count({
    where: {
      orgId,
      deletedAt: null,
      ...(doctorId ? { primaryDoctorId: doctorId } : {}),
    },
  });
}

export async function findPatientById(prisma: PrismaClient, id: string) {
  return prisma.patient.findFirst({
    where: { id, deletedAt: null },
    include: {
      _count: { select: { appointments: true } },
    },
  });
}

export async function updatePatientPrimaryDoctor(
  prisma: PrismaClient,
  patientId: string,
  orgId: string,
  doctorId: string,
) {
  return prisma.patient.updateMany({
    where: { id: patientId, orgId, deletedAt: null },
    data: { primaryDoctorId: doctorId },
  });
}

export async function listPatientAppointments(
  prisma: PrismaClient,
  patientId: string,
  orgId: string,
  options: { skip: number; take: number },
) {
  return prisma.appointment.findMany({
    where: { patientId, orgId },
    skip: options.skip,
    take: options.take,
    orderBy: { scheduledAt: 'desc' },
    include: { doctor: true },
  });
}

export async function countPatientAppointments(
  prisma: PrismaClient,
  patientId: string,
  orgId: string,
) {
  return prisma.appointment.count({
    where: { patientId, orgId },
  });
}
