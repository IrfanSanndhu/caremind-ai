import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AuthError, ForbiddenError } from '../../core/errors.js';
import type { JwtPayload, AuthContext, UserRole } from '../../types/auth.js';

declare global {
  namespace Express {
    interface Request {
      auth: AuthContext;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AuthError('Missing or malformed Authorization header'));
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.auth = {
      userId: payload.sub,
      orgId: payload.orgId,
      role: payload.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthError('Access token expired'));
    }
    next(new AuthError('Invalid access token'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!roles.includes(req.auth.role)) {
      return next(
        new ForbiddenError(
          `Role '${req.auth.role}' is not permitted. Required: ${roles.join(' | ')}`,
        ),
      );
    }
    next();
  };
}

export function requireMfa(req: Request, _res: Response, next: NextFunction): void {
  const mfaVerified = req.headers['x-mfa-verified'];
  if (!mfaVerified || mfaVerified !== 'true') {
    return next(new ForbiddenError('MFA verification required for this action'));
  }
  next();
}

export function issueAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function issueRefreshToken(
  userId: string,
  expiresIn: string | number = env.REFRESH_TOKEN_EXPIRES_IN,
): string {
  return jwt.sign({ sub: userId }, env.REFRESH_TOKEN_SECRET, {
    expiresIn,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): { sub: string } {
  try {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as { sub: string };
  } catch {
    throw new AuthError('Invalid or expired refresh token');
  }
}
