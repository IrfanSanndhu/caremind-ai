import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';

export async function findAiOutputById(prisma: PrismaClient, id: string) {
  return prisma.aiOutput.findUnique({ where: { id } });
}

export async function listAiOutputsByAppointment(prisma: PrismaClient, appointmentId: string) {
  return prisma.aiOutput.findMany({
    where: { appointmentId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function updateAiOutput(
  prisma: PrismaClient,
  id: string,
  data: {
    content?: string;
    status: 'approved' | 'rejected' | 'edited';
    reviewedByDoctorId: string;
    reviewedAt: Date;
  },
) {
  return prisma.aiOutput.update({ where: { id }, data });
}

export async function findDoctorByUserId(prisma: PrismaClient, userId: string) {
  return prisma.doctor.findFirst({ where: { userId } });
}

export async function findAppointmentById(prisma: PrismaClient, id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: { patient: true },
  });
}
