import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, ShieldCheck } from 'lucide-react';
import { Button, Card, Input, Pagination, EmptyState, Skeleton } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { adminApi, adminKeys } from '@/api/admin.api';
import { AuditLogTableRow } from './AuditLogTableRow';
import toast from 'react-hot-toast';

const ACTION_FILTER_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'INVITE_USER', label: 'Invite user' },
  { value: 'DELETE_USER', label: 'Delete user' },
  { value: 'JOIN_CONSULTATION', label: 'Join consultation' },
  { value: 'START_RECORDING', label: 'Start recording' },
  { value: 'STOP_RECORDING', label: 'Stop recording' },
  { value: 'RECORD_CONSENT', label: 'Record consent' },
  { value: 'APPROVE_OUTPUT', label: 'Approve AI output' },
  { value: 'REJECT_OUTPUT', label: 'Reject AI output' },
  { value: 'UPLOAD_DOCUMENT', label: 'Upload document' },
  { value: 'DELETE_DOCUMENT', label: 'Delete document' },
  { value: 'AI_CHAT', label: 'AI chat' },
  { value: 'EXPORT_PDF', label: 'Export PDF' },
  { value: 'VIEW_AUDIT_LOG', label: 'View audit log' },
];

export function AuditLogsPage() {
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const params = {
    action: action || undefined,
    resourceType: resourceType || undefined,
    from: fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined,
    to: toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined,
    page,
    pageSize: 20,
  };

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.auditLogsList(params),
    queryFn: () => adminApi.listAuditLogs(params),
    retry: 1,
  });

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Audit Logs"
        subtitle="Who did what in your organization — PHI access and clinical actions"
        action={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => toast.success('Export feature coming soon')}
          >
            Export
          </Button>
        }
      />

      <Card padding="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Action</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 rounded-md border border-border text-sm bg-white"
            >
              {ACTION_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Resource type"
            placeholder="Resource type (e.g. Appointment)"
            value={resourceType}
            onChange={(e) => { setResourceType(e.target.value); setPage(1); }}
          />
          <Input
            label="From date"
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          />
          <Input
            label="To date"
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          />
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-3 font-semibold text-slate-700">User</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  <span className="inline-flex items-center gap-1">
                    <Search className="w-3.5 h-3.5 text-muted" />
                    Activity
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Resource</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 hidden lg:table-cell">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (data?.items ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <EmptyState
                      icon={<ShieldCheck className="w-6 h-6" />}
                      title="No audit logs found"
                      description="Activity appears here when users view records, run consultations, manage documents, or review AI outputs."
                    />
                  </td>
                </tr>
              ) : (
                (data?.items ?? []).map((log) => (
                  <AuditLogTableRow key={log.id} log={log} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {data && data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
