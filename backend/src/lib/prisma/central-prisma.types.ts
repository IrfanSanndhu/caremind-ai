/**
 * Model types for the central Prisma schema.
 * Kept separate so the IDE resolves types from the generated client .d.ts directly.
 */
export type {
  TrustedDevice,
  User,
  RefreshToken,
  Organization,
} from '../../../node_modules/.prisma/central-client/index.js';

export type { PrismaClient as CentralPrismaClient } from '../../../node_modules/.prisma/central-client/index.js';
