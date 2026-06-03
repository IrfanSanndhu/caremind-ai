import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import { ForbiddenError, NotFoundError } from '../../core/errors.js';
import type { AuthContext } from '../../types/auth.js';

export async function resolvePatientIdForRetrieval(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId?: string,
): Promise<string | null> {
  if (auth.role === 'patient') {
    const patient = await tenantPrisma.patient.findFirst({ where: { userId: auth.userId } });
    return patient?.id ?? null;
  }

  if (!appointmentId) return null;

  const appointment = await tenantPrisma.appointment.findFirst({
    where: { id: appointmentId, orgId: auth.orgId },
  });
  if (!appointment) return null;

  if (auth.role === 'doctor') {
    const doctor = await tenantPrisma.doctor.findFirst({
      where: { userId: auth.userId, orgId: auth.orgId, deletedAt: null },
    });
    if (!doctor || appointment.doctorId !== doctor.id) {
      throw new ForbiddenError('Access denied for this appointment');
    }
  }

  return appointment.patientId;
}

export async function assertPatientAccess(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  patientId: string,
): Promise<void> {
  const patient = await tenantPrisma.patient.findFirst({
    where: { id: patientId, orgId: auth.orgId, deletedAt: null },
  });
  if (!patient) throw new NotFoundError('Patient not found');

  if (auth.role === 'doctor') {
    const doctor = await tenantPrisma.doctor.findFirst({
      where: { userId: auth.userId, orgId: auth.orgId, deletedAt: null },
    });
    if (!doctor) throw new ForbiddenError('Doctor profile not found');

    const linked = await tenantPrisma.appointment.findFirst({
      where: {
        orgId: auth.orgId,
        patientId,
        doctorId: doctor.id,
      },
    });
    const isPrimary = patient.primaryDoctorId === doctor.id;
    if (!linked && !isPrimary) {
      throw new ForbiddenError('Access denied for this patient');
    }
  }
}
