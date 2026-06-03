import { Prisma } from '../../../node_modules/.prisma/tenant-client/index.js';
import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';

export const documentListArgs = Prisma.validator<Prisma.DocumentDefaultArgs>()({
  include: {
    appointment: { select: { id: true, scheduledAt: true } },
  },
});

export type DocumentListRow = Prisma.DocumentGetPayload<typeof documentListArgs>;

export async function createDocument(
  prisma: PrismaClient,
  data: {
    id: string;
    orgId: string;
    patientId: string;
    uploadedBy: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    storageBucket: string;
    storageKey: string;
    documentType?: string;
    appointmentId?: string | null;
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
): Promise<DocumentListRow[]> {
  return prisma.document.findMany({
    where,
    skip: options.skip,
    take: options.take,
    orderBy: { createdAt: 'desc' },
    ...documentListArgs,
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
