import type { PrismaClient as CentralPrisma } from '../../../node_modules/.prisma/central-client/index.js';
import type { PrismaClient as TenantPrisma } from '../../../node_modules/.prisma/tenant-client/index.js';

export async function createDoctorProfile(
  tenantPrisma: TenantPrisma,
  data: {
    id: string;
    userId: string;
    orgId: string;
    firstName: string;
    lastName: string;
    specialty?: string;
    licenseNumber?: string;
  },
) {
  return tenantPrisma.doctor.create({ data });
}

export async function createPatientProfile(
  tenantPrisma: TenantPrisma,
  data: {
    id: string;
    userId: string;
    orgId: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    phone?: string;
  },
) {
  return tenantPrisma.patient.create({ data });
}

export async function listCentralUsers(
  centralPrisma: CentralPrisma,
  orgId: string,
  options: { skip: number; take: number; role?: string },
) {
  return centralPrisma.user.findMany({
    where: {
      orgId,
      deletedAt: null,
      ...(options.role && { role: options.role as 'patient' | 'doctor' | 'admin' }),
    },
    skip: options.skip,
    take: options.take,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      mfaEnabled: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

export async function countCentralUsers(
  centralPrisma: CentralPrisma,
  orgId: string,
  role?: string,
) {
  return centralPrisma.user.count({
    where: {
      orgId,
      deletedAt: null,
      ...(role && { role: role as 'patient' | 'doctor' | 'admin' }),
    },
  });
}

export async function softDeleteUser(centralPrisma: CentralPrisma, userId: string) {
  return centralPrisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });
}

export async function findDoctorByUserId(tenantPrisma: TenantPrisma, userId: string) {
  return tenantPrisma.doctor.findFirst({ where: { userId } });
}

export async function findPatientByUserId(tenantPrisma: TenantPrisma, userId: string) {
  return tenantPrisma.patient.findFirst({ where: { userId } });
}
