import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import * as repo from './documents.repository.js';
import { getStorageAdapter } from '../../adapters/storage/index.js';
import { documentQueue } from '../../jobs/queue.js';
import { auditLog } from '../../core/audit-logger.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../core/errors.js';
import type { AuthContext } from '../../types/auth.js';
import { ALLOWED_MIME_TYPES, type UploadDocumentInput } from './documents.schema.js';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export async function uploadDocument(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  file: Express.Multer.File,
  input: UploadDocumentInput,
) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError('File size exceeds 20MB limit');
  }

  const detectedMime = file.mimetype as string;
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(detectedMime)) {
    throw new ValidationError(`Unsupported file type: ${detectedMime}`);
  }

  const orgSlug = auth.orgId.replace(/-/g, '').slice(0, 12);
  const bucket = `${orgSlug}-documents`;
  const ext = path.extname(file.originalname) || '';
  const documentId = uuidv4();
  const storageKey = `${input.patientId}/${documentId}${ext}`;

  const storage = getStorageAdapter();
  await storage.upload({
    bucket,
    key: storageKey,
    body: file.buffer,
    contentType: detectedMime,
    metadata: {
      orgId: auth.orgId,
      patientId: input.patientId,
      uploadedBy: auth.userId,
    },
  });

  const document = await repo.createDocument(tenantPrisma, {
    id: documentId,
    orgId: auth.orgId,
    patientId: input.patientId,
    uploadedBy: auth.userId,
    fileName: file.originalname,
    mimeType: detectedMime,
    storageBucket: bucket,
    storageKey,
    documentType: input.documentType,
  });

  await documentQueue.add('document.process', {
    tenantDbUrl: '',
    orgId: auth.orgId,
    documentId,
  });

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'UPLOAD_DOCUMENT',
    resourceType: 'Document',
    resourceId: documentId,
  });

  return document;
}

export async function listDocuments(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  options: { page: number; limit: number; patientId?: string },
) {
  const skip = (options.page - 1) * options.limit;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { orgId: auth.orgId };

  if (auth.role === 'patient') {
    const patient = await repo.findPatientByUserId(tenantPrisma, auth.userId);
    if (patient) where['patientId'] = patient.id;
  } else if (options.patientId) {
    where['patientId'] = options.patientId;
  }

  const [documents, total] = await Promise.all([
    repo.listDocuments(tenantPrisma, where, { skip, take: options.limit }),
    repo.countDocuments(tenantPrisma, where),
  ]);

  return { documents, total, page: options.page, limit: options.limit };
}

export async function getDocument(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  documentId: string,
) {
  const document = await repo.findDocumentById(tenantPrisma, documentId);
  if (!document || document.orgId !== auth.orgId) throw new NotFoundError('Document not found');

  if (auth.role === 'patient') {
    const patient = await repo.findPatientByUserId(tenantPrisma, auth.userId);
    if (!patient || document.patientId !== patient.id) {
      throw new ForbiddenError('Access denied');
    }
  }

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'READ_RECORD',
    resourceType: 'Document',
    resourceId: documentId,
  });

  return document;
}

export async function deleteDocument(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  documentId: string,
) {
  const document = await repo.findDocumentById(tenantPrisma, documentId);
  if (!document || document.orgId !== auth.orgId) throw new NotFoundError('Document not found');

  const storage = getStorageAdapter();
  await storage.delete(document.storageBucket, document.storageKey);
  await repo.deleteDocument(tenantPrisma, documentId);

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'DELETE_DOCUMENT',
    resourceType: 'Document',
    resourceId: documentId,
  });
}
