import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import * as repo from './ai-outputs.repository.js';
import { embeddingQueue } from '../../jobs/queue.js';
import { getEmailAdapter } from '../../adapters/email/index.js';
import { getCentralPrisma } from '../../core/tenant-registry.js';
import { auditLog } from '../../core/audit-logger.js';
import { ForbiddenError, NotFoundError } from '../../core/errors.js';
import type { AuthContext } from '../../types/auth.js';
import { z } from 'zod';

export const approveOutputSchema = z.object({
  editedContent: z.string().optional(),
});

export const rejectOutputSchema = z.object({
  reason: z.string().optional(),
});

export async function listOutputsForAppointment(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  appointmentId: string,
) {
  const appointment = await repo.findAppointmentById(tenantPrisma, appointmentId);
  if (!appointment || appointment.orgId !== auth.orgId) throw new NotFoundError('Appointment not found');

  return repo.listAiOutputsByAppointment(tenantPrisma, appointmentId);
}

export async function approveOutput(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  outputId: string,
  editedContent?: string,
) {
  if (auth.role !== 'doctor') throw new ForbiddenError('Doctor role required');

  const doctor = await repo.findDoctorByUserId(tenantPrisma, auth.userId);
  if (!doctor) throw new NotFoundError('Doctor profile not found');

  const output = await repo.findAiOutputById(tenantPrisma, outputId);
  if (!output || output.orgId !== auth.orgId) throw new NotFoundError('AI output not found');

  const appointment = await repo.findAppointmentById(tenantPrisma, output.appointmentId);
  if (!appointment || appointment.doctorId !== doctor.id) {
    throw new ForbiddenError('Not assigned to this appointment');
  }

  const newContent = editedContent ?? output.content;
  const status = editedContent ? 'edited' : 'approved';

  const updated = await repo.updateAiOutput(tenantPrisma, outputId, {
    content: newContent,
    status: status as 'approved' | 'edited',
    reviewedByDoctorId: doctor.id,
    reviewedAt: new Date(),
  });

  // Enqueue embedding for approved content
  await embeddingQueue.add('knowledge-base.ingest', {
    tenantDbUrl: '',
    orgId: auth.orgId,
    patientId: appointment.patientId,
    text: newContent,
    appointmentId: output.appointmentId,
    documentType: output.type,
  });

  // Notify patient that summary is ready
  const patientUser = await getCentralPrisma().user.findUnique({
    where: { id: appointment.patient.userId },
  });

  if (patientUser && output.type === 'patient_summary') {
    getEmailAdapter()
      .send({
        to: patientUser.email,
        subject: 'Your Visit Summary Is Ready — CareMind AI',
        html: '<p>Your doctor has reviewed and approved your visit summary. Log in to view it.</p>',
      })
      .catch(() => { /* non-blocking */ });
  }

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'APPROVE_OUTPUT',
    resourceType: 'AiOutput',
    resourceId: outputId,
    metadata: { status },
  });

  return updated;
}

export async function rejectOutput(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  outputId: string,
) {
  if (auth.role !== 'doctor') throw new ForbiddenError('Doctor role required');

  const doctor = await repo.findDoctorByUserId(tenantPrisma, auth.userId);
  if (!doctor) throw new NotFoundError('Doctor profile not found');

  const output = await repo.findAiOutputById(tenantPrisma, outputId);
  if (!output || output.orgId !== auth.orgId) throw new NotFoundError('AI output not found');

  const appointment = await repo.findAppointmentById(tenantPrisma, output.appointmentId);
  if (!appointment || appointment.doctorId !== doctor.id) {
    throw new ForbiddenError('Not assigned to this appointment');
  }

  const updated = await repo.updateAiOutput(tenantPrisma, outputId, {
    status: 'rejected',
    reviewedByDoctorId: doctor.id,
    reviewedAt: new Date(),
  });

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'REJECT_OUTPUT',
    resourceType: 'AiOutput',
    resourceId: outputId,
  });

  return updated;
}

export async function getOutputHistory(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  outputId: string,
) {
  const output = await repo.findAiOutputById(tenantPrisma, outputId);
  if (!output || output.orgId !== auth.orgId) throw new NotFoundError('AI output not found');

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'READ_RECORD',
    resourceType: 'AiOutput',
    resourceId: outputId,
  });

  return {
    id: output.id,
    type: output.type,
    originalContent: output.originalContent,
    currentContent: output.content,
    status: output.status,
    reviewedAt: output.reviewedAt,
    reviewedByDoctorId: output.reviewedByDoctorId,
  };
}
