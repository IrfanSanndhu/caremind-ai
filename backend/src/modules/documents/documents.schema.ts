import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  patientId: z.string().uuid(),
  documentType: z.string().max(100).optional(),
});

export const listDocumentsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  patientId: z.string().uuid().optional(),
});

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
