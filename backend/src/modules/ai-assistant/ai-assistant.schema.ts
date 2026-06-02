import { z } from 'zod';

export const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  appointmentId: z.string().uuid().optional(),
  // context field is accepted but ignored — resolved server-side
  context: z.enum(['global', 'patient', 'appointment']).optional(),
});

export type ChatInput = z.infer<typeof chatSchema>;
