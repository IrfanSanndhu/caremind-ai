import { v4 as uuidv4 } from 'uuid';
import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import { getEmailAdapter } from '../../adapters/email/index.js';
import { logger } from '../../config/logger.js';
import type { AuthContext } from '../../types/auth.js';
import { NotFoundError } from '../../core/errors.js';
import * as repo from './notifications.repository.js';
import { publishNotification } from './notification.publisher.js';

export type NotificationType =
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'SUMMARY_READY'
  | 'INVITE_DOCTOR'
  | 'INVITE_PATIENT'
  | 'MFA_SETUP'
  | 'BOOKING_REQUEST'
  | 'BOOKING_SUBMITTED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_DECLINED'
  | 'APPOINTMENT_SCHEDULED'
  | 'CONSULTATION_JOINED'
  | 'CONSENT_RECORDED';

const EMAIL_TEMPLATES: Record<NotificationType, (payload: Record<string, string>) => { subject: string; html: string }> = {
  APPOINTMENT_CONFIRMED: (p) => ({
    subject: 'Appointment Confirmed — CareMind AI',
    html: `<p>Appointment confirmed between <strong>${p['patientName'] ?? 'the patient'}</strong> and <strong>${p['doctorName'] ?? 'your doctor'}</strong> for ${p['date'] ?? ''}.</p>`,
  }),
  APPOINTMENT_CANCELLED: (p) => ({
    subject: 'Appointment Cancelled — CareMind AI',
    html: `<p>The appointment between <strong>${p['patientName'] ?? 'the patient'}</strong> and <strong>${p['doctorName'] ?? 'the doctor'}</strong> on ${p['date'] ?? ''} has been cancelled.</p>`,
  }),
  SUMMARY_READY: (_p) => ({
    subject: 'Your Visit Summary Is Ready — CareMind AI',
    html: `<p>Your doctor has approved your visit summary. Log in to view it.</p>`,
  }),
  INVITE_DOCTOR: (p) => ({
    subject: 'Welcome to CareMind AI',
    html: `<p>Dr. ${p['name'] ?? ''}, you have been invited. Your temporary password: <strong>${p['tempPassword'] ?? ''}</strong></p>`,
  }),
  INVITE_PATIENT: (p) => ({
    subject: 'Welcome to CareMind AI',
    html: `<p>Hi ${p['name'] ?? ''}, you have been invited. Your temporary password: <strong>${p['tempPassword'] ?? ''}</strong></p>`,
  }),
  MFA_SETUP: (_p) => ({
    subject: 'MFA Enabled — CareMind AI',
    html: `<p>Multi-factor authentication has been enabled on your account.</p>`,
  }),
  BOOKING_REQUEST: () => ({
    subject: 'New appointment request — CareMind AI',
    html: '',
  }),
  BOOKING_SUBMITTED: () => ({
    subject: 'Appointment request submitted — CareMind AI',
    html: '',
  }),
  BOOKING_APPROVED: () => ({
    subject: 'Appointment confirmed — CareMind AI',
    html: '',
  }),
  BOOKING_DECLINED: () => ({
    subject: 'Appointment request declined — CareMind AI',
    html: '',
  }),
  APPOINTMENT_SCHEDULED: () => ({
    subject: 'Appointment Scheduled — CareMind AI',
    html: '',
  }),
  CONSULTATION_JOINED: (p) => ({
    subject: 'Participant joined consultation — CareMind AI',
    html: `<p><strong>${p['participantName'] ?? 'Someone'}</strong> joined the consultation for the appointment between <strong>${p['patientName'] ?? 'the patient'}</strong> and <strong>${p['doctorName'] ?? 'the doctor'}</strong> on ${p['date'] ?? ''}.</p>`,
  }),
  CONSENT_RECORDED: (p) => ({
    subject: 'Recording consent updated — CareMind AI',
    html: `<p><strong>${p['patientName'] ?? 'The patient'}</strong> ${p['consentStatus'] === 'accepted' ? 'accepted' : 'declined'} recording for the appointment with <strong>${p['doctorName'] ?? 'the doctor'}</strong> on ${p['date'] ?? ''}.</p>`,
  }),
};

export type NotifyUserParams = {
  tenantPrisma: PrismaClient;
  orgId: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  body: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  email?: { to: string; subject: string; html: string };
};

function serializeNotification(n: {
  id: string;
  type: string;
  title: string;
  body: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    resourceType: n.resourceType,
    resourceId: n.resourceId,
    metadata: n.metadata,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function notifyUser(params: NotifyUserParams): Promise<void> {
  const {
    tenantPrisma,
    orgId,
    userId,
    type,
    title,
    body,
    resourceType,
    resourceId,
    metadata,
    email,
  } = params;

  const id = uuidv4();
  const notification = await repo.createInAppNotification(tenantPrisma, {
    id,
    orgId,
    userId,
    type,
    title,
    body,
    resourceType,
    resourceId,
    metadata,
  });

  const unreadCount = await repo.countUnread(tenantPrisma, orgId, userId);

  await publishNotification(orgId, userId, {
    type: 'notification',
    notification: serializeNotification(notification),
    unreadCount,
  });

  if (email) {
    getEmailAdapter()
      .send({ to: email.to, subject: email.subject, html: email.html })
      .catch((err) => logger.warn({ err, userId, type }, 'Failed to send notification email'));
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function notifyUserWithTemplate(params: {
  tenantPrisma: PrismaClient;
  orgId: string;
  userId: string;
  userEmail?: string;
  type: NotificationType;
  title: string;
  body: string;
  payload?: Record<string, string>;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const template = EMAIL_TEMPLATES[params.type];
  const { subject } = template(params.payload ?? {});

  await notifyUser({
    tenantPrisma: params.tenantPrisma,
    orgId: params.orgId,
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    metadata: params.metadata,
    email: params.userEmail
      ? {
          to: params.userEmail,
          subject,
          html: `<p>${escapeHtml(params.body)}</p>`,
        }
      : undefined,
  });
}

export async function sendNotification(params: {
  tenantPrisma: PrismaClient;
  orgId: string;
  userId: string;
  userEmail: string;
  userPhone?: string;
  type: NotificationType;
  payload: Record<string, string>;
}): Promise<void> {
  const { tenantPrisma, orgId, userId, userEmail, type, payload } = params;

  const templateFn = EMAIL_TEMPLATES[type];
  const { subject, html } = templateFn(payload);

  const notificationId = uuidv4();

  try {
    await tenantPrisma.notification.create({
      data: {
        id: notificationId,
        orgId,
        userId,
        channel: 'email',
        type,
        title: subject,
        body: html,
        status: 'pending',
      },
    });

    const email = getEmailAdapter();
    await email.send({ to: userEmail, subject, html });

    await tenantPrisma.notification.update({
      where: { id: notificationId },
      data: { status: 'sent', sentAt: new Date() },
    });
  } catch (err) {
    logger.warn({ err, type, userId }, 'Failed to send notification');

    await tenantPrisma.notification.update({
      where: { id: notificationId },
      data: { status: 'failed' },
    }).catch(() => { /* already logged */ });
  }
}

export async function listUserNotifications(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  options: { limit: number; page: number; unreadOnly?: boolean },
) {
  void repo.deleteStaleNotifications(tenantPrisma).catch(() => {
    /* non-blocking retention cleanup */
  });

  const { items, hasMore } = await repo.listNotifications(
    tenantPrisma,
    auth.orgId,
    auth.userId,
    options,
  );
  const unreadCount = await repo.countUnread(tenantPrisma, auth.orgId, auth.userId);
  const page = options.page;
  return {
    notifications: items.map(serializeNotification),
    unreadCount,
    hasMore,
    page,
    nextPage: hasMore ? page + 1 : null,
    limit: options.limit,
  };
}

export async function getUnreadCount(auth: AuthContext, tenantPrisma: PrismaClient) {
  return repo.countUnread(tenantPrisma, auth.orgId, auth.userId);
}

export async function markNotificationRead(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  notificationId: string,
) {
  const result = await repo.markRead(tenantPrisma, auth.orgId, auth.userId, notificationId);
  if (result.count === 0) throw new NotFoundError('Notification not found');
}

export async function markNotificationUnread(
  auth: AuthContext,
  tenantPrisma: PrismaClient,
  notificationId: string,
) {
  const result = await repo.markUnread(tenantPrisma, auth.orgId, auth.userId, notificationId);
  if (result.count === 0) throw new NotFoundError('Notification not found');
}

export async function markAllNotificationsRead(auth: AuthContext, tenantPrisma: PrismaClient) {
  await repo.markAllRead(tenantPrisma, auth.orgId, auth.userId);
}
