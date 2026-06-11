import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import type { EmailAdapter } from '../../types/adapters.js';
import { AppError } from '../../core/errors.js';

function isLocalSmtpHost(host: string | undefined): boolean {
  if (!host) return false;
  const normalized = host.trim().toLowerCase();
  return normalized === 'localhost' || normalized === 'mailhog' || normalized === '127.0.0.1';
}

export function createSmtpAdapter(): EmailAdapter {
  const smtpUser = env.SMTP_USER?.trim();
  const smtpPassword = env.SMTP_PASSWORD?.trim();
  const auth =
    smtpUser && smtpPassword ? { user: smtpUser, pass: smtpPassword } : undefined;
  const local = isLocalSmtpHost(env.SMTP_HOST);

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth,
    ...(env.SMTP_SECURE
      ? {}
      : local
        ? { ignoreTLS: true, tls: { rejectUnauthorized: false } }
        : { requireTLS: true }),
  });

  return {
    async send({ to, subject, html, text }) {
      try {
        await transporter.sendMail({
          from: env.EMAIL_FROM,
          to,
          subject,
          html,
          ...(text && { text }),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new AppError(`Failed to send email via SMTP: ${message}`, 502, 'EMAIL_SEND_ERROR');
      }
    },
  };
}
