import { Router } from 'express';
import { asyncHandler } from '../../core/async-handler.js';
import * as service from './consultations.service.js';
import { v4 as uuidv4 } from 'uuid';

export const consultationRoutes = Router();

consultationRoutes.get(
  '/live-presence',
  asyncHandler(async (req, res) => {
    const result = await service.getLivePresence(req.auth, req.tenantPrisma);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

consultationRoutes.post(
  '/:appointmentId/join-token',
  asyncHandler(async (req, res) => {
    const result = await service.getJoinToken(req.auth, req.tenantPrisma, req.params['appointmentId']!);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

consultationRoutes.post(
  '/:appointmentId/recording/start',
  asyncHandler(async (req, res) => {
    const result = await service.startRecording(req.auth, req.tenantPrisma, req.params['appointmentId']!);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

consultationRoutes.post(
  '/:appointmentId/recording/stop',
  asyncHandler(async (req, res) => {
    const result = await service.stopRecording(req.auth, req.tenantPrisma, req.params['appointmentId']!);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

consultationRoutes.get(
  '/:appointmentId/transcript',
  asyncHandler(async (req, res) => {
    const result = await service.getTranscript(req.auth, req.tenantPrisma, req.params['appointmentId']!);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

consultationRoutes.get(
  '/:appointmentId/outputs',
  asyncHandler(async (req, res) => {
    const result = await service.getOutputs(req.auth, req.tenantPrisma, req.params['appointmentId']!);
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);
