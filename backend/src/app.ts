import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { httpLogger } from './config/logger.js';
import { env } from './config/env.js';
import { errorHandler } from './core/errors.js';
import { authenticate } from './lib/middleware/auth.middleware.js';
import { resolveTenant } from './lib/middleware/tenant.middleware.js';
import { requireRole } from './lib/middleware/auth.middleware.js';
import { apiRateLimiter } from './lib/middleware/rate-limit.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { appointmentRoutes } from './modules/appointments/appointments.routes.js';
import { consultationRoutes } from './modules/consultations/consultations.routes.js';
import { documentRoutes } from './modules/documents/documents.routes.js';
import { aiAssistantRoutes } from './modules/ai-assistant/ai-assistant.routes.js';
import { aiOutputRoutes } from './modules/ai-outputs/ai-outputs.routes.js';
import { pdfExportRoutes } from './modules/pdf-export/pdf-export.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { v4 as uuidv4 } from 'uuid';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(httpLogger);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Health check — no auth required
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes (no JWT required)
  app.use('/api/auth', authRoutes);

  // Protected routes — JWT + tenant resolution
  const tenantMiddleware = [authenticate, apiRateLimiter, resolveTenant];

  app.use('/api/users', ...tenantMiddleware, usersRoutes);
  app.use('/api/appointments', ...tenantMiddleware, appointmentRoutes);
  app.use('/api/consultations', ...tenantMiddleware, consultationRoutes);
  app.use('/api/documents', ...tenantMiddleware, documentRoutes);
  app.use('/api/ai', ...tenantMiddleware, aiAssistantRoutes);
  app.use('/api/ai-outputs', ...tenantMiddleware, aiOutputRoutes);
  app.use('/api/pdf-export', ...tenantMiddleware, pdfExportRoutes);
  app.use(
    '/api/admin',
    ...tenantMiddleware,
    requireRole('admin'),
    adminRoutes,
  );

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  });

  app.use(errorHandler);

  return app;
}
