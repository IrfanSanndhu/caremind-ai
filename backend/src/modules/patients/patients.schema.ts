import { z } from 'zod';

export const patientGenderSchema = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);

export const listPatientsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const listPatientSessionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type ListPatientsQuery = z.infer<typeof listPatientsSchema>;
export type ListPatientSessionsQuery = z.infer<typeof listPatientSessionsSchema>;
