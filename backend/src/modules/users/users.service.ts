import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getCentralPrisma } from '../../core/tenant-registry.js';
import type { PrismaClient as TenantPrisma } from '../../../node_modules/.prisma/tenant-client/index.js';
import * as repo from './users.repository.js';
import { getEmailAdapter } from '../../adapters/email/index.js';
import { auditLog } from '../../core/audit-logger.js';
import { ConflictError, ForbiddenError } from '../../core/errors.js';
import type { AuthContext } from '../../types/auth.js';
import type { InviteDoctorInput, InvitePatientInput } from './users.schema.js';

const BCRYPT_ROUNDS = 12;

function generateTempPassword(): string {
  return crypto.randomBytes(16).toString('base64url');
}

export async function inviteDoctor(
  auth: AuthContext,
  tenantPrisma: TenantPrisma,
  input: InviteDoctorInput,
) {
  const central = getCentralPrisma();
  const existing = await central.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError(`User with email '${input.email}' already exists`);

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
  const userId = uuidv4();
  const doctorId = uuidv4();

  await central.user.create({
    data: { id: userId, email: input.email, passwordHash, role: 'doctor', orgId: auth.orgId },
  });

  await repo.createDoctorProfile(tenantPrisma, {
    id: doctorId,
    userId,
    orgId: auth.orgId,
    firstName: input.firstName,
    lastName: input.lastName,
    specialty: input.specialty,
    licenseNumber: input.licenseNumber,
  });

  const email = getEmailAdapter();
  await email.send({
    to: input.email,
    subject: 'You have been invited to CareMind AI',
    html: `<p>Welcome Dr. ${input.firstName} ${input.lastName}. Your temporary password is: <strong>${tempPassword}</strong>. Please log in and change it.</p>`,
  }).catch(() => { /* non-blocking */ });

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'INVITE_USER',
    resourceType: 'Doctor',
    resourceId: doctorId,
  });

  return { userId, doctorId };
}

export async function invitePatient(
  auth: AuthContext,
  tenantPrisma: TenantPrisma,
  input: InvitePatientInput,
) {
  if (auth.role === 'doctor') {
    const doctor = await repo.findDoctorByUserId(tenantPrisma, auth.userId);
    if (!doctor) {
      throw new ForbiddenError('Doctor profile not found for this account');
    }
  }

  const central = getCentralPrisma();
  const existing = await central.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError(`User with email '${input.email}' already exists`);

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
  const userId = uuidv4();
  const patientId = uuidv4();

  await central.user.create({
    data: { id: userId, email: input.email, passwordHash, role: 'patient', orgId: auth.orgId },
  });

  await repo.createPatientProfile(tenantPrisma, {
    id: patientId,
    userId,
    orgId: auth.orgId,
    firstName: input.firstName,
    lastName: input.lastName,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
    phone: input.phone,
  });

  const email = getEmailAdapter();
  await email.send({
    to: input.email,
    subject: 'Welcome to CareMind AI',
    html: `<p>Welcome ${input.firstName}. Your temporary password is: <strong>${tempPassword}</strong>.</p>`,
  }).catch(() => { /* non-blocking */ });

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'INVITE_USER',
    resourceType: 'Patient',
    resourceId: patientId,
  });

  return { userId, patientId };
}

export async function listUsers(orgId: string, options: { page: number; limit: number; role?: string }) {
  const central = getCentralPrisma();
  const skip = (options.page - 1) * options.limit;
  const [users, total] = await Promise.all([
    repo.listCentralUsers(central, orgId, { skip, take: options.limit, role: options.role }),
    repo.countCentralUsers(central, orgId, options.role),
  ]);
  return { users, total, page: options.page, limit: options.limit };
}

export async function deleteUser(
  auth: AuthContext,
  tenantPrisma: TenantPrisma,
  targetUserId: string,
) {
  const central = getCentralPrisma();
  await repo.softDeleteUser(central, targetUserId);

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'DELETE_USER',
    resourceType: 'User',
    resourceId: targetUserId,
  });
}
