import type { PrismaClient } from '../../node_modules/.prisma/tenant-client/index.js';
import type { VectorChunk } from '../types/adapters.js';

export async function retrieveChunks(params: {
  tenantPrisma: PrismaClient;
  queryEmbedding: number[];
  patientId: string;
  orgId: string;
  documentTypes?: string[];
  appointmentId?: string;
  topK?: number;
}): Promise<VectorChunk[]> {
  const {
    tenantPrisma,
    queryEmbedding,
    patientId,
    orgId,
    documentTypes,
    appointmentId,
    topK = 5,
  } = params;

  const embeddingLiteral = `'[${queryEmbedding.join(',')}]'::vector`;

  const typeFilter =
    documentTypes && documentTypes.length > 0
      ? `AND "documentType" = ANY(ARRAY[${documentTypes.map((t) => `'${t}'`).join(',')}])`
      : '';

  // Appointment context: prefer that visit's records plus patient-wide ingested data (null appointmentId)
  const appointmentFilter = appointmentId
    ? `AND ("appointmentId" = '${appointmentId}' OR "appointmentId" IS NULL)`
    : '';

  const rows = await tenantPrisma.$queryRawUnsafe<
    Array<{
      id: string;
      content: string;
      metadata: Record<string, unknown>;
      documentType: string;
      documentId: string | null;
      appointmentId: string | null;
    }>
  >(
    `SELECT id, content, metadata, "documentType", "documentId", "appointmentId"
     FROM vector_chunks
     WHERE "patientId" = $1
       AND "orgId" = $2
       ${typeFilter}
       ${appointmentFilter}
     ORDER BY embedding <=> ${embeddingLiteral}
     LIMIT $3`,
    patientId,
    orgId,
    topK,
  );

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    metadata: row.metadata,
    documentType: row.documentType,
    documentId: row.documentId ?? undefined,
    appointmentId: row.appointmentId ?? undefined,
  }));
}
