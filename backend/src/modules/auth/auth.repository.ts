import type { PrismaClient as CentralPrisma } from '../../../node_modules/.prisma/central-client/index.js';
import type { UserRole } from '../../types/auth.js';

export async function findUserByEmail(prisma: CentralPrisma, email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });
}

export async function findUserById(prisma: CentralPrisma, id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findOrgBySlug(prisma: CentralPrisma, slug: string) {
  return prisma.organization.findUnique({ where: { slug } });
}

export async function createOrg(
  prisma: CentralPrisma,
  data: { id: string; name: string; slug: string; dbUrl: string },
) {
  return prisma.organization.create({ data });
}

export async function createUser(
  prisma: CentralPrisma,
  data: {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    orgId: string;
  },
) {
  return prisma.user.create({ data: { ...data, role: data.role } });
}

export async function saveRefreshToken(
  prisma: CentralPrisma,
  data: { id: string; userId: string; tokenHash: string; expiresAt: Date },
) {
  return prisma.refreshToken.create({ data });
}

export async function findRefreshToken(prisma: CentralPrisma, tokenHash: string) {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
}

export async function revokeRefreshToken(prisma: CentralPrisma, id: string) {
  return prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserRefreshTokens(
  prisma: CentralPrisma,
  userId: string,
) {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function updateUserMfa(
  prisma: CentralPrisma,
  userId: string,
  data: { mfaEnabled: boolean; mfaSecret?: string | null },
) {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function updateLastLogin(prisma: CentralPrisma, userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}
