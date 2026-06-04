import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

/** Log out, clear all client session data, and return to login. */
export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);
}
