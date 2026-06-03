import type { Prisma, PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import { sortAppointments } from '../appointments/appointments.sort.js';

function patientScopeForDoctor(doctorId: string | null): Prisma.PatientWhereInput {
  if (!doctorId) return {};
  return {
    OR: [
      { primaryDoctorId: doctorId },
      { appointments: { some: { doctorId } } },
    ],
  };
}

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
      ...patientScopeForDoctor(doctorId),
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
      ...patientScopeForDoctor(doctorId),
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
  const rows = await prisma.appointment.findMany({
    where: { patientId, orgId },
    include: { doctor: true },
  });
  const sorted = sortAppointments(rows);
  return sorted.slice(options.skip, options.skip + options.take);
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
