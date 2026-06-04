import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { setAuthStoreGetter } from './api/client';
import { getAuthStoreSnapshot } from './stores/auth.store';
import { exposeTokenForSSE } from './api/ai.api';
import './index.css';

// Wire up auth store to axios interceptor
setAuthStoreGetter(() => {
  const state = getAuthStoreSnapshot();
  return {
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    setTokens: state.setTokens,
    clearAuth: state.clearAuth,
  };
});

// Restore SSE token from persisted store on startup
const initialToken = getAuthStoreSnapshot().accessToken;
if (initialToken) {
  exposeTokenForSSE(initialToken);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            background: '#0F172A',
            color: '#F8FAFC',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#F8FAFC' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#F8FAFC' },
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
