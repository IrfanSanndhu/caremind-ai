import type { User, UserRole } from '@/types';

interface AccessTokenPayload {
  sub: string;
  orgId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export function decodeAccessTokenPayload(accessToken: string): AccessTokenPayload {
  const parts = accessToken.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid access token');
  }
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const json = atob(padded);
  const payload = JSON.parse(json) as AccessTokenPayload;
  if (!payload.sub || !payload.orgId || !payload.role) {
    throw new Error('Access token is missing required claims');
  }
  return payload;
}

export function userFromAccessToken(accessToken: string, email: string): User {
  const payload = decodeAccessTokenPayload(accessToken);
  return {
    id: payload.sub,
    email,
    role: payload.role,
    orgId: payload.orgId,
  };
}
