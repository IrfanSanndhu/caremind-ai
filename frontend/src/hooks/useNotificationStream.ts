import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { notificationKeys } from '@/api/notifications.api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export function useNotificationStream(): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    const url = `${BASE_URL}/api/notifications/stream?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type?: string };
        if (data.type === 'notification' || data.type === 'connected') {
          queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        }
      } catch {
        /* ignore malformed events */
      }
    };

    return () => {
      es.close();
    };
  }, [accessToken, queryClient]);
}
