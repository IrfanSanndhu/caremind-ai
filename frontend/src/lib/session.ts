import { exposeTokenForSSE } from '@/api/ai.api';
import { useConsultationSessionStore } from '@/stores/consultation-session.store';
import { queryClient } from './query-client';

export const AUTH_STORAGE_KEY = 'caremind_auth';

/** Drop all React Query cache so the next user never sees stale API data. */
export function clearReactQueryCache(): void {
  void queryClient.cancelQueries();
  queryClient.clear();
}

export function clearPersistedAuth(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* private mode / blocked storage */
  }
}

export function resetInMemorySessionState(): void {
  exposeTokenForSSE('');
  useConsultationSessionStore.getState().endSession();
  delete (window as unknown as { __caremind_token?: string }).__caremind_token;
}

/** Full client-side session wipe (call before or after auth store reset). */
export function resetClientSession(): void {
  clearReactQueryCache();
  resetInMemorySessionState();
  clearPersistedAuth();
}
