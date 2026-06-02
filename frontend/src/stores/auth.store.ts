import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { exposeTokenForSSE } from '@/api/ai.api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  orgId: string | null;
}

interface AuthActions {
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  role: null,
  orgId: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,

      login: (user, accessToken, refreshToken) => {
        exposeTokenForSSE(accessToken);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          role: user.role,
          orgId: user.orgId,
        });
      },

      logout: () => {
        exposeTokenForSSE('');
        set(initialState);
      },

      setTokens: (accessToken, refreshToken) => {
        exposeTokenForSSE(accessToken);
        set({ accessToken, refreshToken });
      },

      clearAuth: () => {
        exposeTokenForSSE('');
        set(initialState);
      },

      setUser: (user) => {
        set({ user, role: user.role, orgId: user.orgId });
      },
    }),
    {
      name: 'caremind_auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        orgId: state.orgId,
      }),
    }
  )
);

export function getAuthStoreSnapshot() {
  return useAuthStore.getState();
}
