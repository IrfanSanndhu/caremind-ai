import { z } from 'zod';

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format');

export const updateBookingSettingsSchema = z.object({
  slotDurationMinutes: z.enum(['thirty', 'sixty']).optional(),
  minLeadTimeHours: z.coerce.number().int().min(0).max(168).optional(),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365).optional(),
  timezone: z.string().min(1).max(64).optional(),
});

export const availabilityRuleSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: timeString,
  endTime: timeString,
}).refine((r) => r.startTime < r.endTime, { message: 'endTime must be after startTime' });

export const updateAvailabilitySchema = z.object({
  rules: z.array(availabilityRuleSchema).min(1).max(7),
});

export const listSlotsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
});

export type UpdateBookingSettingsInput = z.infer<typeof updateBookingSettingsSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
