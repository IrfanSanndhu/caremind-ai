import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../core/async-handler.js';
import { validate } from '../../lib/middleware/validate.middleware.js';
import { uploadRateLimiter } from '../../lib/middleware/rate-limit.middleware.js';
import * as service from './documents.service.js';
import { listDocumentsSchema, uploadDocumentSchema } from './documents.schema.js';
import { v4 as uuidv4 } from 'uuid';

export const documentRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

documentRoutes.post(
  '/upload',
  uploadRateLimiter,
  upload.single('file'),
  validate({ body: uploadDocumentSchema }),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No file provided' } });
      return;
    }
    const result = await service.uploadDocument(req.auth, req.tenantPrisma, req.file, req.body);
    res.status(201).json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

documentRoutes.get(
  '/',
  validate({ query: listDocumentsSchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as { page?: string; limit?: string; patientId?: string };
    const result = await service.listDocuments(req.auth, req.tenantPrisma, {
      page: Number(q.page) || 1,
      limit: Number(q.limit) || 20,
      patientId: q.patientId,
    });
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

documentRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await service.getDocument(req.auth, req.tenantPrisma, req.params['id']!);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

documentRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await service.deleteDocument(req.auth, req.tenantPrisma, req.params['id']!);
    res.json({
      data: { success: true },
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);
