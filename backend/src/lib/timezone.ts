/** Validate IANA timezone identifier. */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone?.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timeZone.trim() });
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZone(timeZone: string, fallback = 'UTC'): string {
  const trimmed = timeZone.trim();
  if (isValidTimeZone(trimmed)) return trimmed;
  return isValidTimeZone(fallback) ? fallback : 'UTC';
}
