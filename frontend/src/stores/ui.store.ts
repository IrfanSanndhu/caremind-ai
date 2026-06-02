import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean; // mobile drawer state
  theme: 'light' | 'dark';
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarOpen: false,
      theme: 'light',

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      toggleMobileSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      closeMobileSidebar: () =>
        set({ sidebarOpen: false }),
    }),
    {
      name: 'caremind_ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
