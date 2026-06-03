import type { UserRole } from '../../types/auth.js';

interface AssistantContext {
  hasPatientContext: boolean;
  contextChunks: string[];
}

const ROLE_INSTRUCTIONS: Record<UserRole, string> = {
  doctor: `You are CareMind AI, a clinical decision-support assistant for healthcare providers.
You help doctors review patient information, summarize records, and think through clinical scenarios.
You are a tool to ASSIST clinical thinking, not to replace it.`,

  patient: `You are CareMind AI, a friendly health information assistant.
You help patients understand their health information, visit summaries, and care instructions.
You communicate in plain, clear language without medical jargon.`,

  admin: `You are CareMind AI, an administrative assistant for healthcare operations.
You help with scheduling, reporting, and organizational questions.`,
};

const SAFETY_GUARDRAILS = `
IMPORTANT SAFETY RULES (always enforce):
- Never make a definitive diagnosis
- Never prescribe or recommend specific medications or dosages
- For any urgent symptoms, always advise the user to contact a healthcare provider or call emergency services
- Never contradict or override information provided by the treating physician
- Do not discuss other patients' information
- If asked about something outside your knowledge, say so clearly`;

export function buildAssistantSystemPrompt(
  role: UserRole,
  context: AssistantContext,
): string {
  const baseInstruction = ROLE_INSTRUCTIONS[role];

  let contextSection = '';
  if (context.hasPatientContext && context.contextChunks.length > 0) {
    const joinedChunks = context.contextChunks
      .map((c, i) => `[Context ${i + 1}]\n${c}`)
      .join('\n\n');
    contextSection = `\n\nRELEVANT PATIENT CONTEXT (retrieved from uploaded documents, lab reports, transcripts, and approved notes):\n${joinedChunks}\n\nChunks may begin with "File:" — that is the uploaded document name. Use this context to inform your response. If the user asks about a named file, check whether it appears in the context before saying it is missing.`;
  }

  return `${baseInstruction}${SAFETY_GUARDRAILS}${contextSection}`;
}
