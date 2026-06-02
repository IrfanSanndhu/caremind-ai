import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';

export async function createDocument(
  prisma: PrismaClient,
  data: {
    id: string;
    orgId: string;
    patientId: string;
    uploadedBy: string;
    fileName: string;
    mimeType: string;
    storageBucket: string;
    storageKey: string;
    documentType?: string;
  },
) {
  return prisma.document.create({ data });
}

export async function findDocumentById(prisma: PrismaClient, id: string) {
  return prisma.document.findUnique({ where: { id } });
}

export async function listDocuments(
  prisma: PrismaClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: any,
  options: { skip: number; take: number },
) {
  return prisma.document.findMany({
    where,
    skip: options.skip,
    take: options.take,
    orderBy: { createdAt: 'desc' },
  });
}

export async function countDocuments(
  prisma: PrismaClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: any,
) {
  return prisma.document.count({ where });
}

export async function updateDocumentStatus(
  prisma: PrismaClient,
  id: string,
  data: { processingStatus?: 'pending' | 'processing' | 'ready' | 'failed'; extractedText?: string },
) {
  return prisma.document.update({ where: { id }, data });
}

export async function deleteDocument(prisma: PrismaClient, id: string) {
  return prisma.document.delete({ where: { id } });
}

export async function findPatientByUserId(prisma: PrismaClient, userId: string) {
  return prisma.patient.findFirst({ where: { userId } });
}
