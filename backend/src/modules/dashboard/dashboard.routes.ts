import { Router } from 'express';
import { asyncHandler } from '../../core/async-handler.js';
import { requireRole } from '../../lib/middleware/auth.middleware.js';
import * as service from './dashboard.service.js';
import { v4 as uuidv4 } from 'uuid';

export const dashboardRoutes = Router();

dashboardRoutes.get(
  '/doctor',
  requireRole('doctor'),
  asyncHandler(async (req, res) => {
    const result = await service.getDoctorDashboard(req.auth, req.tenantPrisma);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

dashboardRoutes.get(
  '/patient',
  requireRole('patient'),
  asyncHandler(async (req, res) => {
    const result = await service.getPatientDashboard(req.auth, req.tenantPrisma);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);
