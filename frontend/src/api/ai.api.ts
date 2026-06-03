import { apiClient, unwrap } from './client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export interface ChatRequest {
  message: string;
  appointmentId?: string;
  patientId?: string;
  isDoctorCopilot?: boolean;
}

export interface ChatResponse {
  message: string;
  escalated: boolean;
  sessionId?: string;
}

export interface StreamChunk {
  chunk?: string;
  done?: boolean;
  escalated?: boolean;
  error?: string;
}

export const aiApi = {
  chat: async (payload: ChatRequest): Promise<ChatResponse> => {
    const res = await apiClient.post('/api/ai/chat', payload);
    return unwrap(res);
  },

  /** GET /api/ai/doctor-copilot/:patientId?q=... */
  doctorCopilot: async (
    params: { patientId: string; q: string },
    signal?: AbortSignal,
  ): Promise<{ response: string; escalated: boolean }> => {
    const res = await apiClient.get(`/api/ai/doctor-copilot/${params.patientId}`, {
      params: { q: params.q },
      signal,
    });
    return unwrap(res);
  },

  streamChat: (
    payload: ChatRequest,
    onChunk: (chunk: string) => void,
    onDone: (escalated: boolean) => void,
    onError: (error: string) => void,
    signal?: AbortSignal,
    onAbort?: () => void,
  ): void => {
    const params = new URLSearchParams();
    if (payload.appointmentId) params.set('appointmentId', payload.appointmentId);
    if (payload.patientId) params.set('patientId', payload.patientId);
    if (payload.isDoctorCopilot) params.set('isDoctorCopilot', 'true');

    fetch(`${BASE_URL}/api/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(window as unknown as { __caremind_token?: string }).__caremind_token ?? ''}`,
      },
      body: JSON.stringify(payload),
      signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let escalated = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr) as StreamChunk;
              if (parsed.error) {
                onError(parsed.error);
                return;
              }
              if (parsed.escalated) escalated = true;
              if (parsed.chunk) onChunk(parsed.chunk);
              if (parsed.done) {
                onDone(escalated);
                return;
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        onDone(escalated);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') {
          onAbort?.();
          return;
        }
        if (err instanceof Error) {
          onError(err.message);
        } else {
          onError('Request failed');
        }
      });
  },
};

export const aiKeys = {
  all: ['ai'] as const,
};

// Expose token globally for SSE fetch requests
export function exposeTokenForSSE(token: string): void {
  (window as unknown as { __caremind_token?: string }).__caremind_token = token;
}
