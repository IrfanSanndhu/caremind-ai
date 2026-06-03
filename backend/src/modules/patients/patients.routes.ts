import { Router } from 'express';
import { asyncHandler } from '../../core/async-handler.js';
import { validate } from '../../lib/middleware/validate.middleware.js';
import { requireRole } from '../../lib/middleware/auth.middleware.js';
import * as service from './patients.service.js';
import { listPatientsSchema, listPatientSessionsSchema } from './patients.schema.js';
import { v4 as uuidv4 } from 'uuid';

export const patientsRoutes = Router();

patientsRoutes.use(requireRole('admin', 'doctor'));

patientsRoutes.get(
  '/',
  validate({ query: listPatientsSchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as { page: string; limit: string };
    const result = await service.listPatients(req.auth, req.tenantPrisma, {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
    });
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

patientsRoutes.get(
  '/:patientId/sessions',
  validate({ query: listPatientSessionsSchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as { page: string; limit: string };
    const result = await service.listPatientSessions(
      req.auth,
      req.tenantPrisma,
      req.params['patientId']!,
      {
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20,
      },
    );
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

patientsRoutes.get(
  '/:patientId',
  asyncHandler(async (req, res) => {
    const result = await service.getPatient(
      req.auth,
      req.tenantPrisma,
      req.params['patientId']!,
    );
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);
