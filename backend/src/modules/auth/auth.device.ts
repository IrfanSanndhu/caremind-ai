import crypto from 'crypto';

export function hashDeviceId(deviceId: string): string {
  return crypto.createHash('sha256').update(deviceId).digest('hex');
}

/** Human-readable label from User-Agent (best-effort). */
export function deviceNameFromUserAgent(userAgent: string | undefined): string {
  if (!userAgent?.trim()) return 'Unknown device';

  const ua = userAgent;

  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) return 'Android phone';
  if (/Android/i.test(ua)) return 'Android tablet';
  if (/Macintosh|Mac OS X/i.test(ua)) {
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Mac · Chrome';
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Mac · Safari';
    if (/Firefox/i.test(ua)) return 'Mac · Firefox';
    if (/Edg/i.test(ua)) return 'Mac · Edge';
    return 'Mac';
  }
  if (/Windows/i.test(ua)) {
    if (/Edg/i.test(ua)) return 'Windows · Edge';
    if (/Chrome/i.test(ua)) return 'Windows · Chrome';
    if (/Firefox/i.test(ua)) return 'Windows · Firefox';
    return 'Windows PC';
  }
  if (/Linux/i.test(ua)) return 'Linux';

  return 'Web browser';
}
