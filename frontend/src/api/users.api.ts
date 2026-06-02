import { apiClient, unwrap } from './client';
import { listQueryParams, mapCentralUser, toPaginatedResponse } from './mappers';
import type { InviteUserRequest, PaginatedResponse, User } from '@/types';

export interface ListUsersParams {
  role?: 'admin' | 'doctor' | 'patient';
  page?: number;
  pageSize?: number;
}

interface BackendUsersPage {
  users: Array<{
    id: string;
    email: string;
    role: User['role'];
    mfaEnabled: boolean;
    createdAt: string;
    lastLoginAt?: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
}

export const usersApi = {
  list: async (params?: ListUsersParams): Promise<PaginatedResponse<User>> => {
    const res = await apiClient.get('/api/users', {
      params: listQueryParams(params as Record<string, string | number | undefined>),
    });
    const data = unwrap(res) as BackendUsersPage;
    return toPaginatedResponse(
      (data.users ?? []).map(mapCentralUser),
      data.total ?? 0,
      data.page ?? 1,
      data.limit ?? 20
    );
  },

  inviteDoctor: async (
    payload: Pick<InviteUserRequest, 'email' | 'firstName' | 'lastName' | 'specialty' | 'licenseNumber'>
  ): Promise<{ userId: string; doctorId: string }> => {
    const res = await apiClient.post('/api/users/invite-doctor', payload);
    return unwrap(res);
  },

  invitePatient: async (
    payload: Pick<InviteUserRequest, 'email' | 'firstName' | 'lastName' | 'dateOfBirth' | 'phone'>
  ): Promise<{ userId: string; patientId: string }> => {
    const res = await apiClient.post('/api/users/invite-patient', payload);
    return unwrap(res);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },
};

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: ListUsersParams) => [...userKeys.lists(), params] as const,
};
