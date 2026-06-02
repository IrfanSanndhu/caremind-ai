import { apiClient, unwrap } from './client';
import {
  listQueryParams,
  mapAuditLog,
  mapDashboardStats,
  toPaginatedResponse,
} from './mappers';
import type { AuditLog, DashboardStats, PaginatedResponse } from '@/types';

export interface ListAuditLogsParams {
  userId?: string;
  action?: string;
  resourceType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

interface BackendAuditLogsPage {
  logs: Array<{
    id: string;
    orgId: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    createdAt: string;
    metadata?: unknown;
  }>;
  total: number;
  page: number;
  limit: number;
}

export const adminApi = {
  /** GET /api/admin/dashboard */
  getDashboard: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/api/admin/dashboard');
    const raw = unwrap(res) as {
      totalUsers: number;
      doctors: number;
      patients: number;
      appointments: number;
      documents: number;
    };
    return mapDashboardStats(raw);
  },

  /** GET /api/admin/activity — recent audit log entries */
  getRecentActivity: async (): Promise<AuditLog[]> => {
    const res = await apiClient.get('/api/admin/activity');
    const raw = unwrap(res) as BackendAuditLogsPage['logs'];
    return (raw ?? []).map(mapAuditLog);
  },

  /** GET /api/admin/audit-logs */
  listAuditLogs: async (params?: ListAuditLogsParams): Promise<PaginatedResponse<AuditLog>> => {
    const res = await apiClient.get('/api/admin/audit-logs', {
      params: listQueryParams(params as Record<string, string | number | undefined>),
    });
    const data = unwrap(res) as BackendAuditLogsPage;
    return toPaginatedResponse(
      (data.logs ?? []).map(mapAuditLog),
      data.total ?? 0,
      data.page ?? 1,
      data.limit ?? 20
    );
  },
};

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  activity: ['admin', 'activity'] as const,
  auditLogs: ['admin', 'audit-logs'] as const,
  auditLogsList: (params?: ListAuditLogsParams) => ['admin', 'audit-logs', 'list', params] as const,
};
