export const ESCALATION_TRIGGERS: string[] = [
  'chest pain',
  'chest tightness',
  'heart attack',
  'can\'t breathe',
  'breathing difficulty',
  'difficulty breathing',
  'shortness of breath',
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'self harm',
  'self-harm',
  'overdose',
  'took too many pills',
  'stroke',
  'face drooping',
  'arm weakness',
  'severe bleeding',
  'unconscious',
  'not breathing',
  'cardiac arrest',
  'anaphylaxis',
  'severe allergic reaction',
  'seizure',
];

export function isSafetyTrigger(message: string): boolean {
  const lower = message.toLowerCase();
  return ESCALATION_TRIGGERS.some((trigger) => lower.includes(trigger));
}
