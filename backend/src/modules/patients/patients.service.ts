import { getCentralPrisma } from '../../core/tenant-registry.js';
import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import { auditLog } from '../../core/audit-logger.js';
import { ForbiddenError, NotFoundError } from '../../core/errors.js';
import type { AuthContext } from '../../types/auth.js';
import * as repo from './patients.repository.js';
import type {
  ListPatientsQuery,
  ListPatientSessionsQuery,
  ReassignPrimaryDoctorInput,
} from './patients.schema.js';

async function emailsByUserIds(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const central = getCentralPrisma();
  const users = await central.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });
  return new Map(users.map((u) => [u.id, u.email]));
}

export async function listPatients(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  query: ListPatientsQuery,
) {
  let doctorId: string | null = null;
  if (auth.role === 'doctor') {
    const doctor = await tenantPrisma.doctor.findFirst({ where: { userId: auth.userId } });
    if (doctor) doctorId = doctor.id;
  } else if (auth.role === 'admin' && query.doctorId) {
    const doctor = await tenantPrisma.doctor.findFirst({
      where: { id: query.doctorId, orgId: auth.orgId },
    });
    if (doctor) doctorId = doctor.id;
  }

  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    repo.listPatients(tenantPrisma, auth.orgId, doctorId, { skip, take: query.limit }),
    repo.countPatients(tenantPrisma, auth.orgId, doctorId),
  ]);

  const emailMap = await emailsByUserIds(rows.map((p) => p.userId));

  const patients = rows.map((p) => ({
    id: p.id,
    userId: p.userId,
    orgId: p.orgId,
    firstName: p.firstName,
    lastName: p.lastName,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth?.toISOString() ?? null,
    phone: p.phone,
    email: emailMap.get(p.userId) ?? '',
    sessionCount: p._count.appointments,
    createdAt: p.createdAt.toISOString(),
  }));

  return { patients, total, page: query.page, limit: query.limit };
}

export async function reassignPrimaryDoctor(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  patientId: string,
  input: ReassignPrimaryDoctorInput,
) {
  if (auth.role !== 'admin') {
    throw new ForbiddenError('Only admins can reassign patients');
  }

  const patient = await repo.findPatientById(tenantPrisma, patientId);
  if (!patient || patient.orgId !== auth.orgId) {
    throw new NotFoundError('Patient not found');
  }

  const doctor = await tenantPrisma.doctor.findFirst({
    where: { id: input.doctorId, orgId: auth.orgId, deletedAt: null },
  });
  if (!doctor) {
    throw new NotFoundError('Doctor not found');
  }

  await repo.updatePatientPrimaryDoctor(tenantPrisma, patientId, auth.orgId, input.doctorId);

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'WRITE_NOTE',
    resourceType: 'Patient',
    resourceId: patientId,
    metadata: { primaryDoctorId: input.doctorId },
  });

  return {
    patientId,
    primaryDoctorId: input.doctorId,
    primaryDoctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`.trim(),
  };
}

export async function getPatient(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  patientId: string,
) {
  const patient = await repo.findPatientById(tenantPrisma, patientId);
  if (!patient || patient.orgId !== auth.orgId) {
    throw new NotFoundError('Patient not found');
  }

  const central = getCentralPrisma();
  const user = await central.user.findUnique({
    where: { id: patient.userId },
    select: { email: true },
  });

  return {
    id: patient.id,
    userId: patient.userId,
    orgId: patient.orgId,
    firstName: patient.firstName,
    lastName: patient.lastName,
    gender: patient.gender,
    dateOfBirth: patient.dateOfBirth?.toISOString() ?? null,
    phone: patient.phone,
    email: user?.email ?? '',
    sessionCount: patient._count.appointments,
    createdAt: patient.createdAt.toISOString(),
  };
}

export async function listPatientSessions(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  patientId: string,
  query: ListPatientSessionsQuery,
) {
  const patient = await repo.findPatientById(tenantPrisma, patientId);
  if (!patient || patient.orgId !== auth.orgId) {
    throw new NotFoundError('Patient not found');
  }

  const skip = (query.page - 1) * query.limit;
  const [sessions, total] = await Promise.all([
    repo.listPatientAppointments(tenantPrisma, patientId, auth.orgId, {
      skip,
      take: query.limit,
    }),
    repo.countPatientAppointments(tenantPrisma, patientId, auth.orgId),
  ]);

  return {
    sessions: sessions.map((a) => ({
      id: a.id,
      scheduledAt: a.scheduledAt.toISOString(),
      status: a.status,
      consentStatus: a.consentStatus,
      doctor: a.doctor
        ? {
            id: a.doctor.id,
            firstName: a.doctor.firstName,
            lastName: a.doctor.lastName,
          }
        : null,
    })),
    total,
    page: query.page,
    limit: query.limit,
  };
}
