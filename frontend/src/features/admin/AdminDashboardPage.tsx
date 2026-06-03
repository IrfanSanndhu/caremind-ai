import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, FileText, TrendingUp, TrendingDown,
  Activity, ChevronRight, ShieldCheck,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button, Card, CardHeader, Skeleton, Badge } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/layout/PageHeader';
import { adminApi, adminKeys } from '@/api/admin.api';
import { AppointmentStatus } from '@/types';
import { formatRelative } from '@/utils';
import { getAuditLogDisplayName, getAuditLogSummary } from '@/utils/audit-log-labels';

const PIE_COLORS = {
  scheduled: '#0EA5E9',
  in_progress: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
};

const MOCK_AREA = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    appointments: Math.floor(Math.random() * 15) + 3,
  };
});

function StatCard({ label, value, icon, change, loading }: {
  label: string;
  value?: number;
  icon: React.ReactNode;
  change?: { value: number; positive: boolean };
  loading?: boolean;
}) {
  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${change.positive ? 'text-success-600' : 'text-danger'}`}>
            {change.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {change.value}%
          </div>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-16 mb-1" />
      ) : (
        <p className="text-3xl font-bold text-slate-900">{(value ?? 0).toLocaleString()}</p>
      )}
      <p className="text-sm text-muted mt-0.5">{label}</p>
    </Card>
  );
}

export function AdminDashboardPage() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: adminApi.getDashboard,
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery({
    queryKey: adminKeys.activity,
    queryFn: adminApi.getRecentActivity,
  });

  const pieData = [
    { name: 'Scheduled', value: Math.floor(Math.random() * 30) + 10, status: AppointmentStatus.SCHEDULED },
    { name: 'In Progress', value: Math.floor(Math.random() * 5) + 1, status: AppointmentStatus.IN_PROGRESS },
    { name: 'Completed', value: Math.floor(Math.random() * 50) + 20, status: AppointmentStatus.COMPLETED },
    { name: 'Cancelled', value: Math.floor(Math.random() * 10) + 2, status: AppointmentStatus.CANCELLED },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Admin Panel"
        subtitle="Organization-wide overview and analytics"
        action={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ShieldCheck className="w-4 h-4" />}
            onClick={() => navigate('/admin/audit-logs')}
          >
            Audit Logs
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users" value={stats?.totalUsers} icon={<Users className="w-5 h-5" />} loading={isLoading} />
        <StatCard label="Doctors" value={stats?.totalDoctors} icon={<Activity className="w-5 h-5" />} loading={isLoading} />
        <StatCard label="Patients" value={stats?.totalPatients} icon={<Users className="w-5 h-5" />} loading={isLoading} />
        <StatCard label="Appointments" value={stats?.totalAppointments} icon={<Calendar className="w-5 h-5" />} loading={isLoading} />
        <StatCard label="Documents" value={stats?.totalDocuments} icon={<FileText className="w-5 h-5" />} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Appointments Over Time" subtitle="Sample chart — backend chart API not available yet" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MOCK_AREA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="appointments"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  fill="url(#colorAppointments)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <CardHeader title="Status Distribution" subtitle="Sample data" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={PIE_COLORS[entry.status as keyof typeof PIE_COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PIE_COLORS[entry.status as keyof typeof PIE_COLORS] }}
                />
                <span className="text-xs text-muted">{entry.name}</span>
                <span className="text-xs font-semibold text-slate-900 ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent Activity"
          action={
            <Button size="sm" variant="ghost" onClick={() => navigate('/admin/audit-logs')}>
              View all <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          }
        />
        <div className="divide-y divide-border">
          {activityLoading ? (
            <div className="py-8 flex justify-center">
              <Skeleton className="h-4 w-48" />
            </div>
          ) : activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No recent activity</p>
          ) : (
            activity.slice(0, 8).map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-3">
                <Avatar name={getAuditLogDisplayName(log)} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {getAuditLogDisplayName(log)}
                  </p>
                  <p className="text-sm text-slate-700 leading-snug mt-0.5">
                    {getAuditLogSummary(log)}
                  </p>
                  <Badge variant="gray" className="mt-1 font-mono text-[10px]">
                    {log.action}
                  </Badge>
                </div>
                <span className="text-xs text-muted whitespace-nowrap flex-shrink-0">
                  {formatRelative(log.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
