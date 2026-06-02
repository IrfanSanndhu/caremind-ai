import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../../core/errors.js';

interface ValidateTargets {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(targets: ValidateTargets) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (targets.body) {
        req.body = targets.body.parse(req.body);
      }
      if (targets.params) {
        req.params = targets.params.parse(req.params) as Record<string, string>;
      }
      if (targets.query) {
        req.query = targets.query.parse(req.query) as Record<string, string>;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          new ValidationError('Request validation failed', err.issues),
        );
      } else {
        next(err);
      }
    }
  };
}
