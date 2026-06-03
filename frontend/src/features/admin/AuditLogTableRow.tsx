import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import type { AuditLog } from '@/types';
import {
  getAuditActionBadgeVariant,
  getAuditLogDisplayName,
  getAuditLogSummary,
} from '@/utils/audit-log-labels';
import { formatDateTime } from '@/utils';

export function AuditLogTableRow({ log }: { log: AuditLog }) {
  const displayName = getAuditLogDisplayName(log);
  const email = log.userEmail ?? log.user?.email;
  const role = log.userRole ?? log.user?.role;

  return (
    <tr className="hover:bg-surface/60 transition-colors align-top">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 min-w-[140px]">
          <Avatar name={displayName} size="xs" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
            {email && (
              <p className="text-xs text-muted truncate max-w-[180px]">{email}</p>
            )}
            {role && (
              <Badge variant="gray" className="mt-1 capitalize text-[10px] px-1.5 py-0">
                {role}
              </Badge>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 max-w-md">
        <p className="text-sm text-slate-800 leading-snug">{getAuditLogSummary(log)}</p>
        <Badge variant={getAuditActionBadgeVariant(log.action)} className="mt-1.5 font-mono text-[10px]">
          {log.action}
        </Badge>
      </td>
      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{log.resourceType}</td>
      <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden lg:table-cell max-w-[120px] truncate">
        {log.resourceId ?? '—'}
      </td>
      <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
        {formatDateTime(log.createdAt)}
      </td>
    </tr>
  );
}
