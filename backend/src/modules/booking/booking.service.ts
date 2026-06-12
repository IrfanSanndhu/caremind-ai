import { v4 as uuidv4 } from 'uuid';
import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import * as repo from './booking.repository.js';
import * as apptRepo from '../appointments/appointments.repository.js';
import { generateAvailableSlots } from './slots.js';
import { auditLog } from '../../core/audit-logger.js';
import { getCentralPrisma } from '../../core/tenant-registry.js';
import { notifyUserWithTemplate } from '../notifications/notifications.service.js';
import { formatAppointmentScheduledAt } from '../notifications/appointment-datetime.js';
import {
  appointmentNamePayload,
  appointmentRequestMessage,
  appointmentRequestSubmittedMessage,
  appointmentConfirmedMessage,
  appointmentDeclinedMessage,
  formatDoctorName,
  formatPatientName,
} from '../notifications/appointment-names.js';
import { getUserTimeZone, syncDoctorBookingTimeZone } from '../users/user-timezone.service.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../core/errors.js';
import type { AuthContext } from '../../types/auth.js';
import type {
  BookAppointmentInput,
  UpdateAvailabilityInput,
  UpdateBookingSettingsInput,
} from './booking.schema.js';

async function getDoctorOrThrow(auth: AuthContext, tenantPrisma: PrismaClient) {
  const doctor = await repo.findDoctorByUserId(tenantPrisma, auth.userId);
  if (!doctor || doctor.orgId !== auth.orgId) {
    throw new ForbiddenError('Doctor profile required');
  }
  return doctor;
}

async function loadDoctorBookingContext(tenantPrisma: PrismaClient, doctorId: string, orgId: string) {
  await repo.ensureDoctorBookingDefaults(tenantPrisma, doctorId, orgId);
  const doctor = await repo.findDoctorById(tenantPrisma, doctorId, orgId);
  if (doctor) {
    const userTz = await getUserTimeZone(doctor.userId);
    await syncDoctorBookingTimeZone(tenantPrisma, doctorId, orgId, userTz);
  }
  const [settings, rules] = await Promise.all([
    repo.getBookingSettings(tenantPrisma, doctorId),
    repo.listAvailabilityRules(tenantPrisma, doctorId),
  ]);
  if (!settings) throw new NotFoundError('Booking settings not found');
  return { settings, rules };
}

export async function getMyBookingConfig(auth: AuthContext, tenantPrisma: PrismaClient) {
  const doctor = await getDoctorOrThrow(auth, tenantPrisma);
  const { settings, rules } = await loadDoctorBookingContext(tenantPrisma, doctor.id, auth.orgId);
  return { settings, rules };
}

export async function updateMyBookingSettings(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  input: UpdateBookingSettingsInput,
) {
  const doctor = await getDoctorOrThrow(auth, tenantPrisma);
  await repo.ensureDoctorBookingDefaults(tenantPrisma, doctor.id, auth.orgId);
  const settings = await repo.upsertBookingSettings(tenantPrisma, {
    doctorId: doctor.id,
    orgId: auth.orgId,
    ...input,
  });
  return settings;
}

export async function updateMyAvailability(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  input: UpdateAvailabilityInput,
) {
  const doctor = await getDoctorOrThrow(auth, tenantPrisma);
  await repo.ensureDoctorBookingDefaults(tenantPrisma, doctor.id, auth.orgId);
  const rules = await repo.replaceAvailabilityRules(
    tenantPrisma,
    doctor.id,
    auth.orgId,
    input.rules,
  );
  return rules;
}

export async function listBookableDoctors(auth: AuthContext, tenantPrisma: PrismaClient) {
  const doctors = await repo.listOrgDoctors(tenantPrisma, auth.orgId);
  return doctors.map((d) => ({
    id: d.id,
    firstName: d.firstName,
    lastName: d.lastName,
    specialty: d.specialty,
    fullName: `Dr. ${d.firstName} ${d.lastName}`,
  }));
}

export async function listDoctorSlots(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  doctorId: string,
) {
  const doctor = await repo.findDoctorById(tenantPrisma, doctorId, auth.orgId);
  if (!doctor) throw new NotFoundError('Doctor not found');

  const { settings, rules } = await loadDoctorBookingContext(tenantPrisma, doctorId, auth.orgId);
  const now = new Date();
  const to = new Date(now.getTime() + settings.maxAdvanceDays * 24 * 60 * 60 * 1000);

  const booked = await repo.listDoctorAppointmentsForSlots(tenantPrisma, doctorId, now, to);

  const slots = generateAvailableSlots(
    rules.map((r) => ({
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
    })),
    {
      slotDurationMinutes: settings.slotDurationMinutes,
      minLeadTimeHours: settings.minLeadTimeHours,
      maxAdvanceDays: settings.maxAdvanceDays,
      timezone: settings.timezone,
    },
    booked,
    now,
  );

  return {
    doctorId,
    slotDurationMinutes: settings.slotDurationMinutes,
    timezone: settings.timezone,
    slots,
  };
}

export async function bookAppointment(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  input: BookAppointmentInput,
) {
  if (auth.role !== 'patient') {
    throw new ForbiddenError('Only patients can book appointments through this flow');
  }

  const patient = await repo.findPatientByUserId(tenantPrisma, auth.userId);
  if (!patient) throw new ForbiddenError('Patient profile not found');

  const doctor = await repo.findDoctorById(tenantPrisma, input.doctorId, auth.orgId);
  if (!doctor) throw new NotFoundError('Doctor not found');

  const scheduledAt = new Date(input.scheduledAt);
  const { settings, rules } = await loadDoctorBookingContext(tenantPrisma, doctor.id, auth.orgId);

  const booked = await repo.listDoctorAppointmentsForSlots(
    tenantPrisma,
    doctor.id,
    new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000),
    new Date(scheduledAt.getTime() + 24 * 60 * 60 * 1000),
  );

  const available = generateAvailableSlots(
    rules.map((r) => ({
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
    })),
    {
      slotDurationMinutes: settings.slotDurationMinutes,
      minLeadTimeHours: settings.minLeadTimeHours,
      maxAdvanceDays: settings.maxAdvanceDays,
      timezone: settings.timezone,
    },
    booked,
  );

  const targetMs = scheduledAt.getTime();
  const stillAvailable = available.some((s) => new Date(s).getTime() === targetMs);
  if (!stillAvailable) {
    throw new ValidationError('Selected time slot is no longer available');
  }

  const appointmentId = uuidv4();
  const livekitRoomName = `${auth.orgId}_${appointmentId}`;

  const appointment = await apptRepo.createAppointment(tenantPrisma, {
    id: appointmentId,
    orgId: auth.orgId,
    patientId: patient.id,
    doctorId: doctor.id,
    scheduledAt,
    livekitRoomName,
    status: 'pending_approval',
  });

  const central = getCentralPrisma();
  const doctorUser = await central.user.findUnique({ where: { id: doctor.userId } });
  const patientName = formatPatientName(patient);
  const doctorName = formatDoctorName(doctor);
  const dateStr = await formatAppointmentScheduledAt(
    tenantPrisma,
    doctor.id,
    auth.orgId,
    scheduledAt,
  );
  const namesPayload = appointmentNamePayload(patientName, doctorName, dateStr);

  if (doctorUser) {
    await notifyUserWithTemplate({
      tenantPrisma,
      orgId: auth.orgId,
      userId: doctor.userId,
      userEmail: doctorUser.email,
      type: 'BOOKING_REQUEST',
      title: 'New appointment request',
      body: `${appointmentRequestMessage(patientName, doctorName, dateStr)} Please review in CareMind.`,
      payload: namesPayload,
      resourceType: 'Appointment',
      resourceId: appointmentId,
      metadata: { scheduledAt: scheduledAt.toISOString(), timeZone: settings.timezone },
    });
  }

  const patientUser = await central.user.findUnique({ where: { id: patient.userId } });
  if (patientUser) {
    await notifyUserWithTemplate({
      tenantPrisma,
      orgId: auth.orgId,
      userId: patient.userId,
      userEmail: patientUser.email,
      type: 'BOOKING_SUBMITTED',
      title: 'Appointment request submitted',
      body: appointmentRequestSubmittedMessage(patientName, doctorName, dateStr),
      payload: namesPayload,
      resourceType: 'Appointment',
      resourceId: appointmentId,
      metadata: { scheduledAt: scheduledAt.toISOString(), timeZone: settings.timezone },
    });
  }

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'BOOK_APPOINTMENT',
    resourceType: 'Appointment',
    resourceId: appointmentId,
    metadata: { status: 'pending_approval' },
  });

  return appointment;
}

export async function approveBookingRequest(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId: string,
) {
  const doctor = await getDoctorOrThrow(auth, tenantPrisma);
  const appointment = await apptRepo.findAppointmentById(tenantPrisma, appointmentId);
  if (!appointment || appointment.orgId !== auth.orgId) {
    throw new NotFoundError('Appointment not found');
  }
  if (appointment.doctorId !== doctor.id) {
    throw new ForbiddenError('Not your appointment request');
  }
  if (appointment.status !== 'pending_approval') {
    throw new ValidationError('Appointment is not pending approval');
  }

  const updated = await apptRepo.updateAppointment(tenantPrisma, appointmentId, {
    status: 'scheduled',
  });

  const central = getCentralPrisma();
  const patient = appointment.patient;
  const doctorName = formatDoctorName(doctor);
  const patientName = patient ? formatPatientName(patient) : 'the patient';
  const dateStr = await formatAppointmentScheduledAt(
    tenantPrisma,
    doctor.id,
    auth.orgId,
    appointment.scheduledAt,
  );
  if (patient) {
    const patientUser = await central.user.findUnique({ where: { id: patient.userId } });
    if (patientUser) {
      await notifyUserWithTemplate({
        tenantPrisma,
        orgId: auth.orgId,
        userId: patient.userId,
        userEmail: patientUser.email,
        type: 'BOOKING_APPROVED',
        title: 'Appointment confirmed',
        body: appointmentConfirmedMessage(patientName, doctorName, dateStr),
        payload: appointmentNamePayload(patientName, doctorName, dateStr),
        resourceType: 'Appointment',
        resourceId: appointmentId,
        metadata: { scheduledAt: appointment.scheduledAt.toISOString() },
      });
    }
  }

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'APPROVE_APPOINTMENT',
    resourceType: 'Appointment',
    resourceId: appointmentId,
  });

  return updated;
}

export async function rejectBookingRequest(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId: string,
) {
  const doctor = await getDoctorOrThrow(auth, tenantPrisma);
  const appointment = await apptRepo.findAppointmentById(tenantPrisma, appointmentId);
  if (!appointment || appointment.orgId !== auth.orgId) {
    throw new NotFoundError('Appointment not found');
  }
  if (appointment.doctorId !== doctor.id) {
    throw new ForbiddenError('Not your appointment request');
  }
  if (appointment.status !== 'pending_approval') {
    throw new ValidationError('Appointment is not pending approval');
  }

  const updated = await apptRepo.updateAppointment(tenantPrisma, appointmentId, {
    status: 'cancelled',
  });

  const central = getCentralPrisma();
  const patient = appointment.patient;
  const doctorName = formatDoctorName(doctor);
  const patientName = patient ? formatPatientName(patient) : 'the patient';
  const dateStr = await formatAppointmentScheduledAt(
    tenantPrisma,
    doctor.id,
    auth.orgId,
    appointment.scheduledAt,
  );
  if (patient) {
    const patientUser = await central.user.findUnique({ where: { id: patient.userId } });
    if (patientUser) {
      await notifyUserWithTemplate({
        tenantPrisma,
        orgId: auth.orgId,
        userId: patient.userId,
        userEmail: patientUser.email,
        type: 'BOOKING_DECLINED',
        title: 'Appointment request declined',
        body: appointmentDeclinedMessage(patientName, doctorName, dateStr),
        payload: appointmentNamePayload(patientName, doctorName, dateStr),
        resourceType: 'Appointment',
        resourceId: appointmentId,
        metadata: { scheduledAt: appointment.scheduledAt.toISOString() },
      });
    }
  }

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'REJECT_APPOINTMENT',
    resourceType: 'Appointment',
    resourceId: appointmentId,
  });

  return updated;
}
