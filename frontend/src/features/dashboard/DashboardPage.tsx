import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  FileCheck,
  TrendingUp,
  Clock,
  Plus,
  ChevronRight,
  Video,
  FileText,
  BrainCircuit,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button, Card, CardHeader, Skeleton } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppointmentStatusBadge } from '@/components/shared/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { adminApi, adminKeys } from '@/api/admin.api';
import { appointmentsApi, appointmentKeys } from '@/api/appointments.api';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/types';
import { formatDateTime, formatRelative } from '@/utils/formatDate';

// ─── Mock chart data (used when API unavailable) ─────────────────────────────
const MOCK_CHART = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short' }),
    count: Math.floor(Math.random() * 10) + 2,
  };
});

function StatCard({ label, value, icon, trend, loading }: {
  label: string;
  value?: number;
  icon: React.ReactNode;
  trend?: string;
  loading?: boolean;
}) {
  return (
    <Card padding="md">
      <div className="flex items-center justify-between">
        <div>
          {loading ? (
            <Skeleton className="h-8 w-16 mb-1" />
          ) : (
            <p className="text-3xl font-bold text-slate-900">{value ?? 0}</p>
          )}
          <p className="text-sm text-muted mt-0.5">{label}</p>
          {trend && <p className="text-xs text-success-600 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{trend}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: adminApi.getDashboard,
  });

  const { data: activity = [] } = useQuery({
    queryKey: adminKeys.activity,
    queryFn: adminApi.getRecentActivity,
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of your organization"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/users')}>
              <Plus className="w-4 h-4 mr-1" /> Invite User
            </Button>
            <Button size="sm" onClick={() => navigate('/appointments')}>
              <Plus className="w-4 h-4 mr-1" /> New Appointment
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users" value={stats?.totalUsers} icon={<Users className="w-5 h-5" />} loading={statsLoading} />
        <StatCard label="Doctors" value={stats?.totalDoctors} icon={<Users className="w-5 h-5" />} loading={statsLoading} />
        <StatCard label="Patients" value={stats?.totalPatients} icon={<Users className="w-5 h-5" />} loading={statsLoading} />
        <StatCard label="Appointments" value={stats?.totalAppointments} icon={<Calendar className="w-5 h-5" />} loading={statsLoading} />
        <StatCard label="Documents" value={stats?.totalDocuments} icon={<FileText className="w-5 h-5" />} loading={statsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Appointments (Last 7 Days)" subtitle="Sample chart" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_CHART} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader
            title="Recent Activity"
            action={
              <Button size="sm" variant="ghost" onClick={() => navigate('/admin/audit-logs')}>
                View all <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            }
          />
          <div className="space-y-3">
            {activity.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">No recent activity</p>
            ) : (
              activity.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-center gap-3">
                  <Avatar name={log.userId} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      <span className="font-medium">{log.action}</span> — {log.resourceType}
                    </p>
                    <p className="text-xs text-muted">{formatRelative(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function DoctorDashboard() {
  const navigate = useNavigate();

  const { data: appointments, isLoading } = useQuery({
    queryKey: appointmentKeys.list({ status: 'scheduled' }),
    queryFn: () => appointmentsApi.list({ status: 'scheduled', pageSize: 10 }),
    retry: 1,
  });


  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Your schedule and tasks for today"
        action={
          <Button onClick={() => navigate('/appointments')}>
            <Plus className="w-4 h-4 mr-1" /> Schedule Appointment
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Today's Appointments" value={appointments?.items.filter(a => {
          const d = new Date(a.scheduledAt);
          const today = new Date();
          return d.toDateString() === today.toDateString();
        }).length ?? 0} icon={<Calendar className="w-5 h-5" />} loading={isLoading} />
        <StatCard label="Pending AI Reviews" value={0} icon={<FileCheck className="w-5 h-5" />} />
        <StatCard label="Total Scheduled" value={appointments?.total ?? 0} icon={<Clock className="w-5 h-5" />} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Upcoming Appointments"
              action={
                <Button size="sm" variant="ghost" onClick={() => navigate('/appointments')}>
                  View all <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              }
            />
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))
              ) : appointments?.items.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No upcoming appointments</p>
              ) : (
                appointments?.items.slice(0, 5).map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface cursor-pointer transition-colors"
                    onClick={() => navigate(`/appointments/${appt.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/appointments/${appt.id}`); }}
                  >
                    <Avatar name={`${appt.patient?.firstName} ${appt.patient?.lastName}`} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {appt.patient?.firstName} {appt.patient?.lastName}
                      </p>
                      <p className="text-xs text-muted">{formatDateTime(appt.scheduledAt)}</p>
                    </div>
                    <AppointmentStatusBadge status={appt.status} />
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Video className="w-3.5 h-3.5" />}
                      onClick={(e) => { e.stopPropagation(); navigate(`/appointments/${appt.id}/consultation`); }}
                    >
                      Join
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Pending AI Reviews" />
            <p className="text-sm text-muted mb-4">
              Review AI outputs from each appointment&apos;s detail page.
            </p>
            <Button variant="outline" className="w-full" size="sm" onClick={() => navigate('/appointments')}>
              <FileCheck className="w-4 h-4 mr-1" /> View Appointments
            </Button>
          </Card>

          <Card>
            <CardHeader title="Quick Actions" />
            <div className="space-y-2">
              {[
                { label: 'AI Assistant', icon: <BrainCircuit className="w-4 h-4" />, to: '/ai-assistant' },
                { label: 'View Documents', icon: <FileText className="w-4 h-4" />, to: '/documents' },
                { label: 'AI Outputs', icon: <FileCheck className="w-4 h-4" />, to: '/ai-outputs' },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.to)}
                  className="w-full flex items-center gap-2 p-2.5 rounded-md text-sm text-slate-700 hover:bg-surface transition-colors text-left"
                >
                  <span className="text-primary">{action.icon}</span>
                  {action.label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-muted" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PatientDashboard() {
  const navigate = useNavigate();

  const { data: appointments, isLoading } = useQuery({
    queryKey: appointmentKeys.list({ status: 'scheduled' }),
    queryFn: () => appointmentsApi.list({ status: 'scheduled', pageSize: 5 }),
    retry: 1,
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Dashboard" subtitle="Your health at a glance" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Upcoming Appointments"
          value={appointments?.total ?? 0}
          icon={<Calendar className="w-5 h-5" />}
          loading={isLoading}
        />
        <Card padding="md" className="cursor-pointer hover:shadow-elevated transition-shadow" onClick={() => navigate('/documents')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900">📄</p>
              <p className="text-sm text-muted mt-0.5">My Documents</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-secondary-50 flex items-center justify-center text-secondary">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>
        <Card padding="md" className="cursor-pointer hover:shadow-elevated transition-shadow" onClick={() => navigate('/ai-assistant')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-slate-900">Ask AI</p>
              <p className="text-sm text-muted mt-0.5">Health questions</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary">
              <BrainCircuit className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Upcoming Appointments"
          action={
            <Button size="sm" variant="ghost" onClick={() => navigate('/appointments')}>
              View all <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          }
        />
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
          ) : appointments?.items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted text-sm mb-3">No upcoming appointments</p>
              <Button size="sm" onClick={() => navigate('/appointments')}>
                <Plus className="w-4 h-4 mr-1" /> View Appointments
              </Button>
            </div>
          ) : (
            appointments?.items.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface cursor-pointer transition-colors"
                onClick={() => navigate(`/appointments/${appt.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/appointments/${appt.id}`); }}
              >
                <Avatar name={`Dr. ${appt.doctor?.lastName}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                  </p>
                  <p className="text-xs text-muted">{formatDateTime(appt.scheduledAt)}</p>
                </div>
                <AppointmentStatusBadge status={appt.status} />
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

export function DashboardPage() {
  const { role } = useAuthStore();

  if (role === UserRole.ADMIN) return <AdminDashboard />;
  if (role === UserRole.DOCTOR) return <DoctorDashboard />;
  return <PatientDashboard />;
}
