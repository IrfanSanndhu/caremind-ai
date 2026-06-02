import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Try again in 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.auth?.userId ?? req.ip ?? 'unknown',
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.auth,
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.auth?.userId ?? req.ip ?? 'unknown',
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Upload limit reached. Try again in an hour.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
