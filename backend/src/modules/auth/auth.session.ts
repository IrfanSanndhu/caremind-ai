/** Refresh session length when "Remember me" is checked at login. */
export const REMEMBER_ME_REFRESH_SECONDS = 5 * 24 * 60 * 60;

/** Refresh session length when "Remember me" is unchecked. */
export const SHORT_SESSION_REFRESH_SECONDS = 9 * 60 * 60;

/** Trusted device MFA skip window. */
export const TRUSTED_DEVICE_DAYS = 30;

export function refreshExpiresAt(rememberMe: boolean): Date {
  const seconds = rememberMe ? REMEMBER_ME_REFRESH_SECONDS : SHORT_SESSION_REFRESH_SECONDS;
  return new Date(Date.now() + seconds * 1000);
}

export function refreshJwtExpiresIn(rememberMe: boolean): string {
  return rememberMe ? '5d' : '9h';
}

/** Seconds until `expiresAt` (for refresh rotation). */
export function refreshJwtExpiresInFromDate(expiresAt: Date): number {
  return Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
}

export function trustedDeviceExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + TRUSTED_DEVICE_DAYS);
  return d;
}
