import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import { sortAppointments } from '../appointments/appointments.sort.js';
import * as apptRepo from '../appointments/appointments.repository.js';
import { ForbiddenError } from '../../core/errors.js';
import type { AuthContext } from '../../types/auth.js';

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function getDoctorDashboard(auth: AuthContext, tenantPrisma: PrismaClient) {
  if (auth.role !== 'doctor') {
    throw new ForbiddenError('Doctor role required');
  }

  const doctor = await apptRepo.findDoctorByUserId(tenantPrisma, auth.userId);
  if (!doctor) {
    throw new ForbiddenError('Doctor profile not found');
  }

  const now = new Date();
  const dayStart = startOfLocalDay(now);
  const dayEnd = endOfLocalDay(now);

  const baseWhere = { orgId: auth.orgId, doctorId: doctor.id };
  const activeStatuses = ['scheduled', 'in_progress'] as const;

  const [todayAppointments, pendingAiReviews, totalScheduled, activeRows] = await Promise.all([
    tenantPrisma.appointment.count({
      where: {
        ...baseWhere,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { not: 'cancelled' },
      },
    }),
    tenantPrisma.aiOutput.count({
      where: {
        orgId: auth.orgId,
        status: 'pending_review',
        appointment: { doctorId: doctor.id },
      },
    }),
    tenantPrisma.appointment.count({
      where: { ...baseWhere, status: { in: [...activeStatuses] } },
    }),
    tenantPrisma.appointment.findMany({
      where: { ...baseWhere, status: { in: [...activeStatuses] } },
      include: { patient: true, doctor: true },
    }),
  ]);

  const sorted = sortAppointments(activeRows);
  const inProgressAppointments = sorted.filter((a) => a.status === 'in_progress');
  const scheduledAppointments = sorted.filter((a) => a.status === 'scheduled');

  return {
    stats: {
      todayAppointments,
      pendingAiReviews,
      totalScheduled,
      inProgressCount: inProgressAppointments.length,
    },
    inProgressAppointments,
    upcomingAppointments: [...inProgressAppointments, ...scheduledAppointments],
  };
}

export async function getPatientDashboard(auth: AuthContext, tenantPrisma: PrismaClient) {
  if (auth.role !== 'patient') {
    throw new ForbiddenError('Patient role required');
  }

  const patient = await apptRepo.findPatientByUserId(tenantPrisma, auth.userId);
  if (!patient) {
    throw new ForbiddenError('Patient profile not found');
  }

  const now = new Date();
  const dayStart = startOfLocalDay(now);
  const dayEnd = endOfLocalDay(now);

  const baseWhere = { orgId: auth.orgId, patientId: patient.id };
  const activeStatuses = ['scheduled', 'in_progress'] as const;

  const [todayAppointments, totalScheduled, activeRows] = await Promise.all([
    tenantPrisma.appointment.count({
      where: {
        ...baseWhere,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { not: 'cancelled' },
      },
    }),
    tenantPrisma.appointment.count({
      where: { ...baseWhere, status: { in: [...activeStatuses] } },
    }),
    tenantPrisma.appointment.findMany({
      where: { ...baseWhere, status: { in: [...activeStatuses] } },
      include: { patient: true, doctor: true },
    }),
  ]);

  const sorted = sortAppointments(activeRows);
  const inProgressAppointments = sorted.filter((a) => a.status === 'in_progress');
  const scheduledAppointments = sorted.filter((a) => a.status === 'scheduled');

  return {
    stats: {
      todayAppointments,
      totalScheduled,
      inProgressCount: inProgressAppointments.length,
    },
    inProgressAppointments,
    upcomingAppointments: [...inProgressAppointments, ...scheduledAppointments],
  };
}
