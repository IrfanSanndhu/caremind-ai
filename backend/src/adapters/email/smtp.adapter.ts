import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import type { EmailAdapter } from '../../types/adapters.js';
import { AppError } from '../../core/errors.js';

export function createSmtpAdapter(): EmailAdapter {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ignoreTLS: !env.SMTP_SECURE,
    tls: env.SMTP_SECURE ? undefined : { rejectUnauthorized: false },
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
