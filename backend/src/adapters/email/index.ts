import type { EmailAdapter } from '../../types/adapters.js';
import { env } from '../../config/env.js';
import { createResendAdapter } from './resend.adapter.js';
import { createSmtpAdapter } from './smtp.adapter.js';

let _instance: EmailAdapter | null = null;

export function getEmailAdapter(): EmailAdapter {
  if (!_instance) {
    _instance =
      env.EMAIL_PROVIDER === 'smtp' ? createSmtpAdapter() : createResendAdapter();
  }
  return _instance;
}
