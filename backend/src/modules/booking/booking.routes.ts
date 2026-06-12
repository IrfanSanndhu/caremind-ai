import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../../core/async-handler.js';
import { validate } from '../../lib/middleware/validate.middleware.js';
import { requireRole } from '../../lib/middleware/auth.middleware.js';
import * as service from './booking.service.js';
import {
  bookAppointmentSchema,
  listSlotsQuerySchema,
  updateAvailabilitySchema,
  updateBookingSettingsSchema,
} from './booking.schema.js';

export const bookingRoutes = Router();

bookingRoutes.get(
  '/doctors',
  requireRole('patient', 'admin', 'doctor'),
  asyncHandler(async (req, res) => {
    const result = await service.listBookableDoctors(req.auth, req.tenantPrisma);
    res.json({
      data: { doctors: result },
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

bookingRoutes.get(
  '/doctors/:doctorId/slots',
  requireRole('patient', 'admin'),
  validate({ query: listSlotsQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await service.listDoctorSlots(
      req.auth,
      req.tenantPrisma,
      req.params['doctorId']!,
    );
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

bookingRoutes.get(
  '/settings',
  requireRole('doctor'),
  asyncHandler(async (req, res) => {
    const result = await service.getMyBookingConfig(req.auth, req.tenantPrisma);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

bookingRoutes.patch(
  '/settings',
  requireRole('doctor'),
  validate({ body: updateBookingSettingsSchema }),
  asyncHandler(async (req, res) => {
    const result = await service.updateMyBookingSettings(req.auth, req.tenantPrisma, req.body);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

bookingRoutes.put(
  '/availability',
  requireRole('doctor'),
  validate({ body: updateAvailabilitySchema }),
  asyncHandler(async (req, res) => {
    const result = await service.updateMyAvailability(req.auth, req.tenantPrisma, req.body);
    res.json({
      data: { rules: result },
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

bookingRoutes.post(
  '/appointments',
  requireRole('patient'),
  validate({ body: bookAppointmentSchema }),
  asyncHandler(async (req, res) => {
    const result = await service.bookAppointment(req.auth, req.tenantPrisma, req.body);
    res.status(201).json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

bookingRoutes.post(
  '/appointments/:id/approve',
  requireRole('doctor'),
  asyncHandler(async (req, res) => {
    const result = await service.approveBookingRequest(
      req.auth,
      req.tenantPrisma,
      req.params['id']!,
    );
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

bookingRoutes.post(
  '/appointments/:id/reject',
  requireRole('doctor'),
  asyncHandler(async (req, res) => {
    const result = await service.rejectBookingRequest(
      req.auth,
      req.tenantPrisma,
      req.params['id']!,
    );
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);
