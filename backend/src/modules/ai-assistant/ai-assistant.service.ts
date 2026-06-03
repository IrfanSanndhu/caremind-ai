import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import { getAiChatAdapter } from '../../adapters/ai/index.js';
import { getEmbeddingAdapter } from '../../adapters/embedding/index.js';
import { retrieveChunks } from '../../core/vector-retrieval.js';
import { auditLog } from '../../core/audit-logger.js';
import { ForbiddenError, NotFoundError } from '../../core/errors.js';
import { buildAssistantSystemPrompt } from '../../templates/prompts/ai-assistant.prompt.js';
import { isSafetyTrigger } from '../../templates/prompts/safety.prompt.js';
import type { AuthContext } from '../../types/auth.js';
import type { ChatInput } from './ai-assistant.schema.js';

async function resolvePatientId(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
): Promise<string | null> {
  if (auth.role === 'patient') {
    const patient = await tenantPrisma.patient.findFirst({ where: { userId: auth.userId } });
    return patient?.id ?? null;
  }
  return null;
}

export async function chat(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  input: ChatInput,
) {
  if (isSafetyTrigger(input.message)) {
    return {
      response: 'This sounds urgent. Please call emergency services (911) or go to your nearest emergency room immediately. Do not delay seeking professional help.',
      escalated: true,
    };
  }

  const patientId = await resolvePatientId(auth, tenantPrisma);

  let contextChunks: string[] = [];

  if (patientId) {
    const embedding = await getEmbeddingAdapter().embed(input.message);
    const chunks = await retrieveChunks({
      tenantPrisma,
      queryEmbedding: embedding,
      patientId,
      orgId: auth.orgId,
      appointmentId: input.appointmentId,
      topK: 5,
    });
    contextChunks = chunks.map((c) => c.content);
  }

  const systemPrompt = buildAssistantSystemPrompt(auth.role, {
    hasPatientContext: contextChunks.length > 0,
    contextChunks,
  });

  const aiAdapter = getAiChatAdapter();
  const response = await aiAdapter.chat({
    systemPrompt,
    messages: [{ role: 'user', content: input.message }],
    maxTokens: 1024,
    temperature: 0.3,
  });

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'AI_CHAT',
    resourceType: 'AiChat',
    resourceId: auth.userId,
    metadata: { contextChunkCount: contextChunks.length },
  });

  return { response, escalated: false };
}

export async function streamChat(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  input: ChatInput,
  onChunk: (chunk: string) => void,
) {
  if (isSafetyTrigger(input.message)) {
    onChunk('This sounds urgent. Please call emergency services (911) or go to your nearest emergency room immediately.');
    return;
  }

  const patientId = await resolvePatientId(auth, tenantPrisma);
  let contextChunks: string[] = [];

  if (patientId) {
    const embedding = await getEmbeddingAdapter().embed(input.message);
    const chunks = await retrieveChunks({
      tenantPrisma,
      queryEmbedding: embedding,
      patientId,
      orgId: auth.orgId,
      appointmentId: input.appointmentId,
      topK: 5,
    });
    contextChunks = chunks.map((c) => c.content);
  }

  const systemPrompt = buildAssistantSystemPrompt(auth.role, {
    hasPatientContext: contextChunks.length > 0,
    contextChunks,
  });

  const aiAdapter = getAiChatAdapter();
  await aiAdapter.streamChat({
    systemPrompt,
    messages: [{ role: 'user', content: input.message }],
    onChunk,
  });

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'AI_CHAT',
    resourceType: 'AiChatStream',
    resourceId: auth.userId,
  });
}

export async function doctorCopilot(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  patientId: string,
  question: string,
) {
  if (auth.role !== 'doctor' && auth.role !== 'admin') {
    throw new ForbiddenError('Doctor or admin role required');
  }

  const patient = await tenantPrisma.patient.findUnique({ where: { id: patientId } });
  if (!patient || patient.orgId !== auth.orgId) throw new NotFoundError('Patient not found');

  if (isSafetyTrigger(question)) {
    return {
      response: 'Safety trigger detected. Please evaluate the patient directly.',
      escalated: true,
    };
  }

  const embedding = await getEmbeddingAdapter().embed(question);
  const chunks = await retrieveChunks({
    tenantPrisma,
    queryEmbedding: embedding,
    patientId,
    orgId: auth.orgId,
    topK: 8,
  });

  if (chunks.length === 0) {
    return {
      response:
        "I couldn't find any records for this patient yet (no documents, transcripts, or approved notes have been ingested). Ask a general clinical question, or add patient data first (upload documents or complete an appointment so a transcript/outputs exist).",
      escalated: false,
    };
  }

  const contextChunks = chunks.map((c) => c.content);
  const systemPrompt = buildAssistantSystemPrompt('doctor', {
    hasPatientContext: contextChunks.length > 0,
    contextChunks,
  });

  const response = await getAiChatAdapter().chat({
    systemPrompt,
    messages: [{ role: 'user', content: question }],
    maxTokens: 2048,
    temperature: 0.2,
  });

  await auditLog({
    tenantPrisma,
    userId: auth.userId,
    orgId: auth.orgId,
    action: 'AI_CHAT',
    resourceType: 'Patient',
    resourceId: patientId,
    metadata: { type: 'doctor_copilot', chunkCount: chunks.length },
  });

  return { response, escalated: false };
}
