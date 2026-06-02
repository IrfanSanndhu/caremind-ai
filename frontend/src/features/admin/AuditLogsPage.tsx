import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, ShieldCheck } from 'lucide-react';
import { Button, Card, Input, Pagination, EmptyState, Skeleton, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { adminApi, adminKeys } from '@/api/admin.api';
import { formatDateTime } from '@/utils';
import toast from 'react-hot-toast';

export function AuditLogsPage() {
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const params = {
    userId: userId || undefined,
    action: action || undefined,
    resourceType: resourceType || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    page,
    pageSize: 20,
  };

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.auditLogsList(params),
    queryFn: () => adminApi.listAuditLogs(params),
    retry: 1,
  });

  const handleExport = () => {
    toast.success('Export feature coming soon');
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Audit Logs"
        subtitle="Track all system activity and access"
        action={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExport}
          >
            Export
          </Button>
        }
      />

      {/* Filters */}
      <Card padding="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input
            placeholder="Filter by action..."
            leadingIcon={<Search className="w-4 h-4" />}
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
          />
          <Input
            placeholder="Filter by resource type..."
            value={resourceType}
            onChange={(e) => { setResourceType(e.target.value); setPage(1); }}
          />
          <Input
            placeholder="Filter by user ID..."
            value={userId}
            onChange={(e) => { setUserId(e.target.value); setPage(1); }}
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

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-3 font-semibold text-slate-700">User</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Action</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Resource</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 hidden lg:table-cell">Resource ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 hidden md:table-cell">IP Address</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (data?.items ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon={<ShieldCheck className="w-6 h-6" />}
                      title="No audit logs found"
                      description="Audit logs will appear here as users interact with the system."
                    />
                  </td>
                </tr>
              ) : (
                (data?.items ?? []).map((log) => (
                  <tr key={log.id} className="hover:bg-surface/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={log.user?.email ?? log.userId} size="xs" />
                        <span className="text-slate-700 text-xs font-mono truncate max-w-[100px]">
                          {log.user?.email ?? log.userId.slice(0, 8) + '…'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="primary" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{log.resourceType}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden lg:table-cell">
                      {log.resourceId ? log.resourceId.slice(0, 12) + '…' : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted text-xs hidden md:table-cell">
                      {log.ipAddress ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
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
