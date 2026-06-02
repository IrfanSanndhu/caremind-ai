import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { getTenantPrisma } from '../../core/tenant-prisma.js';
import { getStorageAdapter } from '../../adapters/storage/index.js';
import { getSttAdapter } from '../../adapters/stt/index.js';
import { getAiChatAdapter } from '../../adapters/ai/index.js';
import { getEmailAdapter } from '../../adapters/email/index.js';
import { getCentralPrisma } from '../../core/tenant-registry.js';
import { buildSoapNotePrompt } from '../../templates/prompts/soap-note.prompt.js';
import { buildClinicalSummaryPrompt } from '../../templates/prompts/clinical-summary.prompt.js';
import { buildPatientSummaryPrompt } from '../../templates/prompts/patient-summary.prompt.js';
import { buildFollowUpPrompt } from '../../templates/prompts/follow-up.prompt.js';
import { v4 as uuidv4 } from 'uuid';
import type { TranscriptionJobData } from '../queue.js';

async function processTranscription(data: TranscriptionJobData): Promise<void> {
  const { tenantDbUrl, orgId, recordingId, appointmentId } = data;
  const tenantPrisma = getTenantPrisma(tenantDbUrl);
  const storage = getStorageAdapter();
  const stt = getSttAdapter();
  const ai = getAiChatAdapter();

  const recording = await tenantPrisma.consultationRecording.findUnique({
    where: { id: recordingId },
  });
  if (!recording) {
    logger.warn({ recordingId }, 'Recording not found');
    return;
  }

  await tenantPrisma.consultationRecording.update({
    where: { id: recordingId },
    data: { status: 'processing' },
  });

  try {
    const audioBuffer = await storage.download(recording.storageBucket, recording.storageKey);
    const transcript = await stt.transcribeFile({
      audioBuffer,
      mimeType: 'audio/mp4',
      enableDiarization: true,
    });

    const transcriptRecord = await tenantPrisma.transcript.create({
      data: {
        id: uuidv4(),
        appointmentId,
        orgId,
        fullText: transcript.fullText,
        segments: transcript.segments as object,
        durationSeconds: transcript.durationSeconds,
      },
    });

    // Verify consent before AI processing
    const appointment = await tenantPrisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    });

    if (!appointment || appointment.consentStatus !== 'accepted') {
      logger.warn({ appointmentId }, 'Consent not accepted — skipping AI generation');
      return;
    }

    const patientContext = `Patient: ${appointment.patient.firstName} ${appointment.patient.lastName}`;

    const [soapNote, clinicalSummary, patientSummary, followUp] = await Promise.all([
      ai.chat({ systemPrompt: buildSoapNotePrompt(transcript.fullText), messages: [], maxTokens: 2048 }),
      ai.chat({ systemPrompt: buildClinicalSummaryPrompt(transcript.fullText, patientContext), messages: [], maxTokens: 2048 }),
      ai.chat({ systemPrompt: buildPatientSummaryPrompt(transcript.fullText, ''), messages: [], maxTokens: 1024 }),
      ai.chat({ systemPrompt: buildFollowUpPrompt('', patientContext), messages: [], maxTokens: 1024 }),
    ]);

    const outputs = [
      { type: 'soap_note' as const, content: soapNote },
      { type: 'clinical_summary' as const, content: clinicalSummary },
      { type: 'patient_summary' as const, content: patientSummary },
      { type: 'follow_up_instructions' as const, content: followUp },
    ];

    await Promise.all(
      outputs.map((o) =>
        tenantPrisma.aiOutput.create({
          data: {
            id: uuidv4(),
            appointmentId,
            orgId,
            type: o.type,
            content: o.content,
            originalContent: o.content,
          },
        }),
      ),
    );

    await tenantPrisma.consultationRecording.update({
      where: { id: recordingId },
      data: { status: 'ready', durationSeconds: transcript.durationSeconds },
    });

    // Notify doctor
    const doctorUser = await getCentralPrisma().user.findUnique({
      where: { id: appointment.doctor.userId },
    });

    if (doctorUser) {
      getEmailAdapter()
        .send({
          to: doctorUser.email,
          subject: 'AI Outputs Ready for Review — CareMind AI',
          html: `<p>Dr. ${appointment.doctor.lastName}, the AI-generated outputs for your consultation on ${new Date(appointment.scheduledAt).toLocaleDateString()} are ready for your review.</p>`,
        })
        .catch(() => { /* non-blocking */ });
    }

    logger.info({ recordingId, transcriptId: transcriptRecord.id }, 'Transcription complete');
  } catch (err) {
    logger.error({ err, recordingId }, 'Transcription failed');
    await tenantPrisma.consultationRecording.update({
      where: { id: recordingId },
      data: { status: 'failed' },
    });
    throw err;
  }
}

export function createTranscriptionWorker(): Worker {
  return new Worker<TranscriptionJobData>(
    'transcription',
    async (job) => {
      logger.info({ jobId: job.id, recordingId: job.data.recordingId }, 'Processing transcription job');
      await processTranscription(job.data);
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 3,
    },
  );
}
