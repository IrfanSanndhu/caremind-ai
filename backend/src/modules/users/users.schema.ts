import { z } from 'zod';
import { patientGenderSchema } from '../patients/patients.schema.js';

export const inviteDoctorSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  specialty: z.string().max(100).optional(),
  licenseNumber: z.string().max(100).optional(),
});

export const invitePatientSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  doctorId: z.string().uuid().optional(),
  gender: patientGenderSchema,
  dateOfBirth: z.string().optional(),
  phone: z.string().max(20).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  specialty: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

export const listUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.enum(['patient', 'doctor', 'admin']).optional(),
  doctorId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
});

export type InviteDoctorInput = z.infer<typeof inviteDoctorSchema>;
export type InvitePatientInput = z.infer<typeof invitePatientSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersSchema>;
