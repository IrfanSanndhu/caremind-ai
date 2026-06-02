export function buildFollowUpPrompt(
  soapNote: string,
  patientHistory: string,
): string {
  return `You are a clinical documentation assistant. Generate clear follow-up instructions based on the consultation.

${soapNote ? `SOAP Note:\n${soapNote}\n\n` : ''}${patientHistory ? `Patient Context:\n${patientHistory}\n\n` : ''}Generate a numbered list of follow-up instructions covering:
1. Medications (if any were discussed)
2. Tests or investigations ordered
3. Lifestyle modifications recommended
4. Warning signs to watch for (when to seek immediate care)
5. Next appointment or referral

Rules:
- Use simple, actionable language
- Be specific about timing where mentioned (e.g., "take twice daily")
- Do NOT add instructions not discussed in the consultation
- Flag any urgent items with "URGENT:" prefix`;
}
