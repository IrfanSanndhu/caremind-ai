import { v4 as uuidv4 } from 'uuid';
import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import * as repo from './appointments.repository.js';
import { auditLog } from '../../core/audit-logger.js';
import { getCentralPrisma } from '../../core/tenant-registry.js';
import { ForbiddenError, NotFoundError } from '../../core/errors.js';
import { notifyUserWithTemplate } from '../notifications/notifications.service.js';
import { formatAppointmentScheduledAt } from '../notifications/appointment-datetime.js';
import {
  appointmentNamePayload,
  appointmentScheduledMessage,
  appointmentCancelledMessage,
  formatDoctorName,
  formatPatientName,
} from '../notifications/appointment-names.js';
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

  const appointmentFull = await repo.findAppointmentById(tenantPrisma, appointmentId);
  const scheduledAt = new Date(input.scheduledAt);
  const dateStr = await formatAppointmentScheduledAt(
    tenantPrisma,
    input.doctorId,
    orgId,
    scheduledAt,
  );
  const central = getCentralPrisma();
  const patientName = appointmentFull?.patient
    ? formatPatientName(appointmentFull.patient)
    : 'the patient';
  const doctorName = appointmentFull?.doctor
    ? formatDoctorName(appointmentFull.doctor)
    : 'the doctor';
  const namesPayload = appointmentNamePayload(patientName, doctorName, dateStr);
  const scheduledBody = appointmentScheduledMessage(patientName, doctorName, dateStr);

  if (appointmentFull?.patient) {
    const patientUser = await central.user.findUnique({
      where: { id: appointmentFull.patient.userId },
    });
    if (patientUser) {
      await notifyUserWithTemplate({
        tenantPrisma,
        orgId,
        userId: appointmentFull.patient.userId,
        userEmail: patientUser.email,
        type: 'APPOINTMENT_SCHEDULED',
        title: 'Appointment scheduled',
        body: scheduledBody,
        payload: namesPayload,
        resourceType: 'Appointment',
        resourceId: appointmentId,
      });
    }
  }

  if (appointmentFull?.doctor) {
    const doctorUser = await central.user.findUnique({
      where: { id: appointmentFull.doctor.userId },
    });
    if (doctorUser) {
      await notifyUserWithTemplate({
        tenantPrisma,
        orgId,
        userId: appointmentFull.doctor.userId,
        userEmail: doctorUser.email,
        type: 'APPOINTMENT_SCHEDULED',
        title: 'New appointment scheduled',
        body: scheduledBody,
        payload: namesPayload,
        resourceType: 'Appointment',
        resourceId: appointmentId,
      });
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

  const updated = await repo.updateAppointment(tenantPrisma, appointmentId, {
    ...(input.status && { status: input.status }),
    ...(input.scheduledAt && { scheduledAt: new Date(input.scheduledAt) }),
  });

  if (input.status === 'cancelled') {
    await notifyAppointmentCancelled(tenantPrisma, auth.orgId, appointment, auth.userId);
  }

  return updated;
}

async function notifyAppointmentCancelled(
  tenantPrisma: PrismaClient,
  orgId: string,
  appointment: NonNullable<Awaited<ReturnType<typeof repo.findAppointmentById>>>,
  actorUserId: string,
) {
  const dateStr = await formatAppointmentScheduledAt(
    tenantPrisma,
    appointment.doctorId,
    orgId,
    appointment.scheduledAt,
  );
  const central = getCentralPrisma();
  const patientName = appointment.patient
    ? formatPatientName(appointment.patient)
    : 'the patient';
  const doctorName = appointment.doctor
    ? formatDoctorName(appointment.doctor)
    : 'the doctor';
  const namesPayload = appointmentNamePayload(patientName, doctorName, dateStr);
  const cancelBody = appointmentCancelledMessage(patientName, doctorName, dateStr);
  const targets: { userId: string }[] = [];

  if (appointment.patient && appointment.patient.userId !== actorUserId) {
    targets.push({ userId: appointment.patient.userId });
  }
  if (appointment.doctor && appointment.doctor.userId !== actorUserId) {
    targets.push({ userId: appointment.doctor.userId });
  }

  await Promise.all(
    targets.map(async (t) => {
      const user = await central.user.findUnique({ where: { id: t.userId } });
      if (!user) return;
      await notifyUserWithTemplate({
        tenantPrisma,
        orgId,
        userId: t.userId,
        userEmail: user.email,
        type: 'APPOINTMENT_CANCELLED',
        title: 'Appointment cancelled',
        body: cancelBody,
        payload: namesPayload,
        resourceType: 'Appointment',
        resourceId: appointment.id,
      });
    }),
  );
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

  if (appointment.doctor) {
    const central = getCentralPrisma();
    const doctorUser = await central.user.findUnique({
      where: { id: appointment.doctor.userId },
    });
    const patientName = formatPatientName(patient);
    const doctorName = formatDoctorName(appointment.doctor);
    const dateStr = await formatAppointmentScheduledAt(
      tenantPrisma,
      appointment.doctorId,
      auth.orgId,
      appointment.scheduledAt,
    );
    if (doctorUser) {
      await notifyUserWithTemplate({
        tenantPrisma,
        orgId: auth.orgId,
        userId: appointment.doctor.userId,
        userEmail: doctorUser.email,
        type: 'CONSENT_RECORDED',
        title: 'Recording consent updated',
        body: `${patientName} ${input.consentStatus === 'accepted' ? 'accepted' : 'declined'} recording for the appointment with ${doctorName} on ${dateStr}.`,
        payload: {
          ...appointmentNamePayload(patientName, doctorName),
          consentStatus: input.consentStatus,
          date: dateStr,
        },
        resourceType: 'Appointment',
        resourceId: appointmentId,
      });
    }
  }

  return updated;
}
