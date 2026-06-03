import { z } from 'zod';

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  patientId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const consentSchema = z.object({
  consentStatus: z.enum(['accepted', 'declined']),
});

const optionalUuid = z
  .union([z.string().uuid(), z.literal('')])
  .optional()
  .transform((v) => (v ? v : undefined));

export const listAppointmentsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  patientId: optionalUuid,
  doctorId: optionalUuid,
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ConsentInput = z.infer<typeof consentSchema>;
