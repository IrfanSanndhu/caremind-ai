import { v4 as uuidv4 } from 'uuid';
import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import * as repo from './consultations.repository.js';
import { env } from '../../config/env.js';
import { getCentralPrisma } from '../../core/tenant-registry.js';
import { getLiveKitAdapter } from '../../adapters/livekit/index.js';
import { transcriptionQueue } from '../../jobs/queue.js';
import { auditLog } from '../../core/audit-logger.js';
import { ForbiddenError, NotFoundError } from '../../core/errors.js';
import type { AuthContext } from '../../types/auth.js';

type AppointmentWithProfiles = NonNullable<
  Awaited<ReturnType<typeof repo.findAppointmentById>>
>;

async function resolveParticipantDisplayName(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointment: AppointmentWithProfiles,
): Promise<string> {
  if (auth.role === 'patient') {
    const patient =
      appointment.patient ??
      (await repo.findPatientByUserId(tenantPrisma, auth.userId));
    if (patient) return `${patient.firstName} ${patient.lastName}`.trim();
  }

  if (auth.role === 'doctor') {
    const doctor =
      appointment.doctor ??
      (await repo.findDoctorByUserId(tenantPrisma, auth.userId));
    if (doctor) return `Dr. ${doctor.firstName} ${doctor.lastName}`.trim();
  }

  const centralUser = await getCentralPrisma().user.findUnique({
    where: { id: auth.userId },
    select: { email: true },
  });
  if (centralUser?.email) {
    const local = centralUser.email.split('@')[0] ?? 'Admin';
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  return 'Admin';
}

export async function getJoinToken(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId: string,
) {
  const appointment = await repo.findAppointmentById(tenantPrisma, appointmentId);
  if (!appointment || appointment.orgId !== auth.orgId) {
    throw new NotFoundError('Appointment not found');
  }

  if (auth.role === 'patient') {
    const patient = await repo.findPatientByUserId(tenantPrisma, auth.userId);
    if (!patient || appointment.patientId !== patient.id) {
      throw new ForbiddenError('Not your appointment');
    }

    if (appointment.consentStatus === 'pending') {
      return { requiresConsent: true };
    }
  } else if (auth.role === 'doctor') {
    const doctor = await repo.findDoctorByUserId(tenantPrisma, auth.userId);
    if (!doctor || appointment.doctorId !== doctor.id) {
      throw new ForbiddenError('Not your appointment');
    }
  }

  const livekit = getLiveKitAdapter();
  const roomName = appointment.livekitRoomName ?? `${auth.orgId}_${appointmentId}`;

  const displayName = await resolveParticipantDisplayName(auth, tenantPrisma, appointment);

  const token = await livekit.createRoomToken({
    roomName,
    participantIdentity: auth.userId,
    participantName: displayName,
    canPublish: true,
    canSubscribe: true,
    metadata: JSON.stringify({
      role: auth.role,
      orgId: auth.orgId,
      displayName,
    }),
  });

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'JOIN_CONSULTATION',
    resourceType: 'Appointment',
    resourceId: appointmentId,
  });

  return { token, roomName, livekitUrl: env.LIVEKIT_URL };
}

export async function startRecording(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId: string,
) {
  const appointment = await repo.findAppointmentById(tenantPrisma, appointmentId);
  if (!appointment || appointment.orgId !== auth.orgId) throw new NotFoundError('Appointment not found');

  if (appointment.consentStatus !== 'accepted') {
    throw new ForbiddenError('Recording requires patient consent');
  }

  if (appointment.noRecording) {
    throw new ForbiddenError('Patient has declined recording');
  }

  const orgSlug = auth.orgId.replace(/-/g, '').slice(0, 12);
  const bucket = `${orgSlug}-recordings`;
  const storageKey = `${appointmentId}/${uuidv4()}.mp4`;

  const recording = await repo.createRecording(tenantPrisma, {
    id: uuidv4(),
    appointmentId,
    orgId: auth.orgId,
    storageBucket: bucket,
    storageKey,
  });

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'START_RECORDING',
    resourceType: 'ConsultationRecording',
    resourceId: recording.id,
  });

  return { recordingId: recording.id, storageBucket: bucket, storageKey };
}

export async function stopRecording(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId: string,
) {
  const recording = await repo.findRecordingByAppointment(tenantPrisma, appointmentId);
  if (!recording || recording.orgId !== auth.orgId) throw new NotFoundError('Recording not found');

  await repo.updateRecordingStatus(tenantPrisma, recording.id, 'uploaded');

  await transcriptionQueue.add('consultation.transcribe', {
    tenantDbUrl: '',
    orgId: auth.orgId,
    recordingId: recording.id,
    appointmentId,
  });

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'STOP_RECORDING',
    resourceType: 'ConsultationRecording',
    resourceId: recording.id,
  });

  return { recordingId: recording.id, status: 'processing' };
}

export async function getTranscript(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId: string,
) {
  const appointment = await repo.findAppointmentById(tenantPrisma, appointmentId);
  if (!appointment || appointment.orgId !== auth.orgId) throw new NotFoundError('Appointment not found');

  const transcript = await repo.findTranscriptByAppointment(tenantPrisma, appointmentId);
  if (!transcript) throw new NotFoundError('Transcript not ready yet');

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'READ_RECORD',
    resourceType: 'Transcript',
    resourceId: transcript.id,
  });

  return transcript;
}

export async function getOutputs(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId: string,
) {
  const appointment = await repo.findAppointmentById(tenantPrisma, appointmentId);
  if (!appointment || appointment.orgId !== auth.orgId) throw new NotFoundError('Appointment not found');

  return repo.listAiOutputsByAppointment(tenantPrisma, appointmentId);
}
