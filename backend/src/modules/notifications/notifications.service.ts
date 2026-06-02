import type { PrismaClient } from '../../../node_modules/.prisma/tenant-client/index.js';
import { getEmailAdapter } from '../../adapters/email/index.js';
import { logger } from '../../config/logger.js';

export type NotificationType =
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'SUMMARY_READY'
  | 'INVITE_DOCTOR'
  | 'INVITE_PATIENT'
  | 'MFA_SETUP';

const EMAIL_TEMPLATES: Record<NotificationType, (payload: Record<string, string>) => { subject: string; html: string }> = {
  APPOINTMENT_CONFIRMED: (p) => ({
    subject: 'Appointment Confirmed — CareMind AI',
    html: `<p>Your appointment with ${p['doctorName'] ?? 'your doctor'} is confirmed for ${p['date'] ?? ''}.</p>`,
  }),
  APPOINTMENT_CANCELLED: (p) => ({
    subject: 'Appointment Cancelled — CareMind AI',
    html: `<p>Your appointment on ${p['date'] ?? ''} has been cancelled.</p>`,
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
};

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

  const notificationId = crypto.randomUUID();

  try {
    await tenantPrisma.notification.create({
      data: {
        id: notificationId,
        orgId,
        userId,
        channel: 'email',
        type,
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
