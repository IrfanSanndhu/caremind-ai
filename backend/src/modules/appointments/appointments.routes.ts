import { Router } from 'express';
import { asyncHandler } from '../../core/async-handler.js';
import { validate } from '../../lib/middleware/validate.middleware.js';
import * as service from './appointments.service.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  consentSchema,
  listAppointmentsSchema,
} from './appointments.schema.js';
import { v4 as uuidv4 } from 'uuid';

export const appointmentRoutes = Router();

appointmentRoutes.post(
  '/',
  validate({ body: createAppointmentSchema }),
  asyncHandler(async (req, res) => {
    const result = await service.createAppointment(req.auth, req.tenantPrisma, req.body);
    res.status(201).json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

appointmentRoutes.get(
  '/',
  validate({ query: listAppointmentsSchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as { page?: string; limit?: string; status?: string };
    const result = await service.listAppointments(req.auth, req.tenantPrisma, {
      page: Number(q.page) || 1,
      limit: Number(q.limit) || 20,
      status: q.status,
    });
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

appointmentRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await service.getAppointment(req.auth, req.tenantPrisma, req.params['id']!);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

appointmentRoutes.patch(
  '/:id',
  validate({ body: updateAppointmentSchema }),
  asyncHandler(async (req, res) => {
    const result = await service.updateAppointment(req.auth, req.tenantPrisma, req.params['id']!, req.body);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

appointmentRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await service.updateAppointment(req.auth, req.tenantPrisma, req.params['id']!, { status: 'cancelled' });
    res.json({
      data: { success: true },
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

appointmentRoutes.post(
  '/:id/consent',
  validate({ body: consentSchema }),
  asyncHandler(async (req, res) => {
    const result = await service.recordConsent(req.auth, req.tenantPrisma, req.params['id']!, req.body);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);
