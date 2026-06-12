import { Router } from 'express';
import { asyncHandler } from '../../core/async-handler.js';
import { v4 as uuidv4 } from 'uuid';
import * as service from './notifications.service.js';
import { addSseConnection, sendHeartbeat } from './notification-sse.hub.js';

export const notificationsRoutes = Router();

notificationsRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 30, 30);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const unreadOnly = req.query.unreadOnly === 'true';
    const result = await service.listUserNotifications(
      req.auth,
      req.tenantPrisma,
      { limit, page, unreadOnly },
    );
    res.json({
      data: result,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

notificationsRoutes.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const count = await service.getUnreadCount(req.auth, req.tenantPrisma);
    res.json({
      data: { count },
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

notificationsRoutes.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await service.markNotificationRead(req.auth, req.tenantPrisma, req.params['id']!);
    const count = await service.getUnreadCount(req.auth, req.tenantPrisma);
    res.json({
      data: { success: true, unreadCount: count },
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

notificationsRoutes.patch(
  '/:id/unread',
  asyncHandler(async (req, res) => {
    await service.markNotificationUnread(req.auth, req.tenantPrisma, req.params['id']!);
    const count = await service.getUnreadCount(req.auth, req.tenantPrisma);
    res.json({
      data: { success: true, unreadCount: count },
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

notificationsRoutes.post(
  '/mark-all-read',
  asyncHandler(async (req, res) => {
    await service.markAllNotificationsRead(req.auth, req.tenantPrisma);
    res.json({
      data: { success: true, unreadCount: 0 },
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() },
    });
  }),
);

notificationsRoutes.get(
  '/stream',
  asyncHandler(async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const { orgId, userId } = req.auth;
    addSseConnection(orgId, userId, res);

    const unreadCount = await service.getUnreadCount(req.auth, req.tenantPrisma);
    res.write(`data: ${JSON.stringify({ type: 'connected', unreadCount })}\n\n`);

    const heartbeat = setInterval(() => sendHeartbeat(res), 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
    });
  }),
);
