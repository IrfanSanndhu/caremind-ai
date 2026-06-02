import { apiClient, unwrap } from './client';
import { mapAiOutput } from './mappers';
import type { AiOutput } from '@/types';

export const aiOutputsApi = {
  getByAppointment: async (appointmentId: string): Promise<AiOutput[]> => {
    const res = await apiClient.get(`/api/ai-outputs/appointment/${appointmentId}`);
    const raw = unwrap(res) as Record<string, unknown>[];
    return (raw ?? []).map(mapAiOutput);
  },

  approve: async (id: string, editedContent?: string): Promise<AiOutput> => {
    const res = await apiClient.patch(`/api/ai-outputs/${id}/approve`, {
      ...(editedContent ? { editedContent } : {}),
    });
    return mapAiOutput(unwrap(res) as Record<string, unknown>);
  },

  reject: async (id: string): Promise<AiOutput> => {
    const res = await apiClient.patch(`/api/ai-outputs/${id}/reject`);
    return mapAiOutput(unwrap(res) as Record<string, unknown>);
  },

  getHistory: async (id: string): Promise<{
    id: string;
    type: AiOutput['type'];
    originalContent: string;
    currentContent: string;
    status: AiOutput['status'];
    reviewedAt?: string;
  }> => {
    const res = await apiClient.get(`/api/ai-outputs/${id}/history`);
    const raw = unwrap(res) as {
      id: string;
      type: AiOutput['type'];
      originalContent: string;
      currentContent: string;
      status: AiOutput['status'];
      reviewedAt?: string | null;
    };
    return {
      ...raw,
      reviewedAt: raw.reviewedAt ?? undefined,
    };
  },
};

export const aiOutputKeys = {
  all: ['ai-outputs'] as const,
  byAppointment: (appointmentId: string) => [...aiOutputKeys.all, 'appointment', appointmentId] as const,
  history: (id: string) => [...aiOutputKeys.all, 'history', id] as const,
};
