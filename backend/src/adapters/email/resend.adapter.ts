import { Resend } from 'resend';
import { env } from '../../config/env.js';
import type { EmailAdapter } from '../../types/adapters.js';
import { AppError } from '../../core/errors.js';

export function createResendAdapter(): EmailAdapter {
  const resend = new Resend(env.RESEND_API_KEY);

  return {
    async send({ to, subject, html, text }) {
      const { error } = await resend.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
        ...(text && { text }),
      });

      if (error) {
        throw new AppError(
          `Failed to send email: ${error.message}`,
          502,
          'EMAIL_SEND_ERROR',
        );
      }
    },
  };
}
