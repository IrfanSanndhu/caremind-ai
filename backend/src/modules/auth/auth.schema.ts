import { z } from 'zod';

export const registerOrgSchema = z.object({
  orgName: z.string().min(2).max(100),
  orgSlug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const mfaVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
  tempToken: z.string().min(1),
});

export const mfaSetupVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
});

export type RegisterOrgInput = z.infer<typeof registerOrgSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
