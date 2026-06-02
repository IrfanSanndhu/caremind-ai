import axios from 'axios';
import type { ApiErrorBody } from '@/types';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    if (error.response?.status === 401) return 'Invalid email or password';
    if (!error.response) {
      return 'Cannot reach the API. Check that the backend is running and VITE_API_BASE_URL is correct.';
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
