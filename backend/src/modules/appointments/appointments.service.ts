import { v4 as uuidv4 } from 'uuid';
import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import * as repo from './appointments.repository.js';
import { auditLog } from '../../core/audit-logger.js';
import { getEmailAdapter } from '../../adapters/email/index.js';
import { ForbiddenError, NotFoundError } from '../../core/errors.js';
import type { AuthContext } from '../../types/auth.js';
import type { CreateAppointmentInput, UpdateAppointmentInput, ConsentInput } from './appointments.schema.js';

export async function createAppointment(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  input: CreateAppointmentInput,
) {
  const orgId = auth.orgId;
  const appointmentId = uuidv4();
  const livekitRoomName = `${orgId}_${appointmentId}`;

  const appointment = await repo.createAppointment(tenantPrisma, {
    id: appointmentId,
    orgId,
    patientId: input.patientId,
    doctorId: input.doctorId,
    scheduledAt: new Date(input.scheduledAt),
    livekitRoomName,
  });

  const patient = await tenantPrisma.patient.findUnique({
    where: { id: input.patientId },
    include: {},
  });

  if (patient) {
    const centralUser = await import('../../core/tenant-registry.js').then(
      (m) => m.getCentralPrisma().user.findUnique({ where: { id: patient.userId } }),
    );

    if (centralUser) {
      getEmailAdapter()
        .send({
          to: centralUser.email,
          subject: 'Appointment Confirmed — CareMind AI',
          html: `<p>Your appointment has been scheduled for ${new Date(input.scheduledAt).toLocaleString()}.</p>`,
        })
        .catch(() => { /* non-blocking */ });
    }
  }

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId,
    action: 'WRITE_NOTE',
    resourceType: 'Appointment',
    resourceId: appointmentId,
  });

  return appointment;
}

export async function listAppointments(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  options: { page: number; limit: number; status?: string; patientId?: string; doctorId?: string },
) {
  const { role, orgId } = auth;
  const skip = (options.page - 1) * options.limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { orgId };

  if (options.status) where['status'] = options.status;

  if (role === 'patient') {
    const patient = await repo.findPatientByUserId(tenantPrisma, auth.userId);
    if (patient) where['patientId'] = patient.id;
    if (options.doctorId) where['doctorId'] = options.doctorId;
  } else if (role === 'doctor') {
    const doctor = await repo.findDoctorByUserId(tenantPrisma, auth.userId);
    if (doctor) where['doctorId'] = doctor.id;
    if (options.patientId) where['patientId'] = options.patientId;
  } else {
    if (options.patientId) where['patientId'] = options.patientId;
    if (options.doctorId) where['doctorId'] = options.doctorId;
  }

  const [appointments, total] = await Promise.all([
    repo.listAppointments(tenantPrisma, where, {
      skip,
      take: options.limit,
      statusFilter: options.status,
    }),
    repo.countAppointments(tenantPrisma, where),
  ]);

  return { appointments, total, page: options.page, limit: options.limit };
}

export async function getAppointment(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId: string,
) {
  const appointment = await repo.findAppointmentById(tenantPrisma, appointmentId);
  if (!appointment || appointment.orgId !== auth.orgId) throw new NotFoundError('Appointment not found');

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'READ_RECORD',
    resourceType: 'Appointment',
    resourceId: appointmentId,
  });

  return appointment;
}

export async function updateAppointment(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId: string,
  input: UpdateAppointmentInput,
) {
  const appointment = await repo.findAppointmentById(tenantPrisma, appointmentId);
  if (!appointment || appointment.orgId !== auth.orgId) throw new NotFoundError('Appointment not found');

  return repo.updateAppointment(tenantPrisma, appointmentId, {
    ...(input.status && { status: input.status }),
    ...(input.scheduledAt && { scheduledAt: new Date(input.scheduledAt) }),
  });
}

export async function recordConsent(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId: string,
  input: ConsentInput,
) {
  const patient = await repo.findPatientByUserId(tenantPrisma, auth.userId);
  if (!patient) throw new ForbiddenError('Only patients can record consent');

  const appointment = await repo.findAppointmentById(tenantPrisma, appointmentId);
  if (!appointment) throw new NotFoundError('Appointment not found');
  if (appointment.patientId !== patient.id) throw new ForbiddenError('Not your appointment');

  const updated = await repo.updateAppointment(tenantPrisma, appointmentId, {
    consentStatus: input.consentStatus,
    consentTimestamp: new Date(),
    noRecording: input.consentStatus === 'declined',
  });

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'RECORD_CONSENT',
    resourceType: 'Appointment',
    resourceId: appointmentId,
    metadata: { consentStatus: input.consentStatus },
  });

  return updated;
}
