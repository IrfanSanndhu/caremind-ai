import { Router } from 'express';
import { asyncHandler } from '../../core/async-handler.js';
import { validate } from '../../lib/middleware/validate.middleware.js';
import { requireRole } from '../../lib/middleware/auth.middleware.js';
import * as service from './ai-assistant.service.js';
import { chatSchema } from './ai-assistant.schema.js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const aiAssistantRoutes = Router();

aiAssistantRoutes.post(
  '/chat',
  validate({ body: chatSchema }),
  asyncHandler(async (req, res) => {
    const result = await service.chat(req.auth, req.tenantPrisma, req.body);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

aiAssistantRoutes.post(
  '/chat/stream',
  validate({ body: chatSchema }),
  asyncHandler(async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    await service.streamChat(req.auth, req.tenantPrisma, req.body, (chunk) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
  }),
);

aiAssistantRoutes.get(
  '/doctor-copilot/:patientId',
  requireRole('doctor', 'admin'),
  validate({
    query: z.object({ q: z.string().min(1).max(4000) }),
  }),
  asyncHandler(async (req, res) => {
    const { q } = req.query as { q: string };
    const result = await service.doctorCopilot(
      req.auth,
      req.tenantPrisma,
      req.params['patientId']!,
      q,
    );
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);
