import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, Video } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Button, Card, Input, Select, Modal, ModalFooter,
  Pagination, EmptyState, Skeleton,
} from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppointmentStatusBadge } from '@/components/shared/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { appointmentsApi, appointmentKeys } from '@/api/appointments.api';
import { getApiErrorMessage } from '@/api/errors';
import { useAuthStore } from '@/stores/auth.store';
import { AppointmentStatus, UserRole } from '@/types';
import { formatDateTime } from '@/utils/formatDate';
import { cn } from '@/utils/cn';

const createSchema = z.object({
  patientId: z.string().min(1, 'Select a patient'),
  doctorId: z.string().min(1, 'Select a doctor'),
  scheduledAt: z.string().min(1, 'Select date and time'),
});
type CreateFormValues = z.infer<typeof createSchema>;

const STATUS_TABS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: AppointmentStatus.SCHEDULED },
  { label: 'In Progress', value: AppointmentStatus.IN_PROGRESS },
  { label: 'Completed', value: AppointmentStatus.COMPLETED },
  { label: 'Cancelled', value: AppointmentStatus.CANCELLED },
];

export function AppointmentsPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const params = {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    pageSize: 10,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => appointmentsApi.list(params),
    retry: 1,
  });

  const searchLower = search.trim().toLowerCase();
  const visibleItems = useMemo(() => {
    const items = data?.items ?? [];
    if (!searchLower) return items;
    return items.filter((appt) => {
      const patient = `${appt.patient?.firstName ?? ''} ${appt.patient?.lastName ?? ''}`.toLowerCase();
      const doctor = `${appt.doctor?.firstName ?? ''} ${appt.doctor?.lastName ?? ''}`.toLowerCase();
      return patient.includes(searchLower) || doctor.includes(searchLower);
    });
  }, [data?.items, searchLower]);

  const participantOptions = useMemo(() => {
    const doctors = new Map<string, string>();
    const patients = new Map<string, string>();
    for (const appt of data?.items ?? []) {
      if (appt.doctor) {
        doctors.set(
          appt.doctorId,
          `Dr. ${appt.doctor.firstName} ${appt.doctor.lastName}`
        );
      }
      if (appt.patient) {
        patients.set(
          appt.patientId,
          `${appt.patient.firstName} ${appt.patient.lastName}`
        );
      }
    }
    return {
      doctors: Array.from(doctors, ([value, label]) => ({ value, label })),
      patients: Array.from(patients, ([value, label]) => ({ value, label })),
    };
  }, [data?.items]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
  });

  const createMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      toast.success('Appointment scheduled!');
      setCreateOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
    onError: () => toast.error('Failed to schedule appointment'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (params: { id: string; status: AppointmentStatus }) =>
      appointmentsApi.updateStatus(params.id, params.status),
    onSuccess: () => {
      toast.success('Appointment updated');
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
    onError: () => toast.error('Failed to update appointment'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
    onError: () => toast.error('Failed to cancel appointment'),
  });

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Appointments"
        subtitle="Manage and view all appointments"
        action={
          role !== UserRole.PATIENT && (
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Schedule Appointment
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-white border border-border rounded-lg p-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap min-h-[36px]',
                statusFilter === tab.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-slate-700 hover:bg-surface'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search appointments..."
            leadingIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {isError && (
        <Card className="border-danger/30 bg-danger/5">
          <p className="text-sm text-danger">
            {getApiErrorMessage(error, 'Failed to load appointments')}
          </p>
        </Card>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Patient</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Doctor</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Date & Time</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : isError ? null : visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12">
                      <EmptyState
                        icon={<Calendar className="w-6 h-6" />}
                        title="No appointments found"
                        description="Try adjusting your filters or schedule a new appointment."
                      />
                    </td>
                  </tr>
                ) : (
                  visibleItems.map((appt) => (
                    <tr
                      key={appt.id}
                      className="hover:bg-surface cursor-pointer transition-colors"
                      onClick={() => navigate(`/appointments/${appt.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={`${appt.patient?.firstName} ${appt.patient?.lastName}`} size="xs" />
                          <span className="font-medium text-slate-900">
                            {appt.patient?.firstName} {appt.patient?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDateTime(appt.scheduledAt)}
                      </td>
                      <td className="px-4 py-3">
                        <AppointmentStatusBadge status={appt.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(appt.status === 'scheduled' || appt.status === 'in_progress') && (
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<Video className="w-3.5 h-3.5" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/appointments/${appt.id}/consultation`);
                              }}
                            >
                              Join
                            </Button>
                          )}

                          {(role === UserRole.DOCTOR || role === UserRole.ADMIN) && appt.status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatusMutation.mutate({ id: appt.id, status: AppointmentStatus.IN_PROGRESS });
                              }}
                            >
                              Start
                            </Button>
                          )}

                          {(role === UserRole.DOCTOR || role === UserRole.ADMIN) && appt.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatusMutation.mutate({ id: appt.id, status: AppointmentStatus.COMPLETED });
                              }}
                            >
                              Complete
                            </Button>
                          )}

                          {(role === UserRole.DOCTOR || role === UserRole.ADMIN) &&
                            appt.status !== 'cancelled' &&
                            appt.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelMutation.mutate(appt.id);
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </Card>
          ))
        ) : isError ? null : visibleItems.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-6 h-6" />}
            title="No appointments found"
            description="Try adjusting your filters or schedule a new appointment."
          />
        ) : visibleItems.map((appt) => (
          <Card
            key={appt.id}
            className="cursor-pointer hover:shadow-elevated transition-shadow"
            onClick={() => navigate(`/appointments/${appt.id}`)}
          >
            <div className="flex items-start gap-3">
              <Avatar name={`${appt.patient?.firstName} ${appt.patient?.lastName}`} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">
                  {appt.patient?.firstName} {appt.patient?.lastName}
                </p>
                <p className="text-sm text-muted">Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}</p>
                <p className="text-sm text-muted mt-1">{formatDateTime(appt.scheduledAt)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <AppointmentStatusBadge status={appt.status} />
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {(appt.status === 'scheduled' || appt.status === 'in_progress') && (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Video className="w-3.5 h-3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/appointments/${appt.id}/consultation`);
                      }}
                    >
                      Join
                    </Button>
                  )}

                  {(role === UserRole.DOCTOR || role === UserRole.ADMIN) && appt.status === 'scheduled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatusMutation.mutate({ id: appt.id, status: AppointmentStatus.IN_PROGRESS });
                      }}
                    >
                      Start
                    </Button>
                  )}

                  {(role === UserRole.DOCTOR || role === UserRole.ADMIN) && appt.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatusMutation.mutate({ id: appt.id, status: AppointmentStatus.COMPLETED });
                      }}
                    >
                      Complete
                    </Button>
                  )}

                  {(role === UserRole.DOCTOR || role === UserRole.ADMIN) &&
                    appt.status !== 'cancelled' &&
                    appt.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelMutation.mutate(appt.id);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title="Schedule Appointment">
        <form
          onSubmit={handleSubmit((d) =>
            createMutation.mutate({
              ...d,
              scheduledAt: new Date(d.scheduledAt).toISOString(),
            })
          )}
          className="space-y-4"
        >
          {participantOptions.patients.length === 0 || participantOptions.doctors.length === 0 ? (
            <p className="text-sm text-muted bg-surface rounded-md p-3">
              Invite doctors and patients, then schedule once at least one appointment exists to
              populate participant lists. New appointments need tenant doctor and patient profile IDs.
            </p>
          ) : null}
          <Select
            label="Patient"
            placeholder="Select patient"
            options={participantOptions.patients}
            error={errors.patientId?.message}
            required
            {...register('patientId')}
          />
          <Select
            label="Doctor"
            placeholder="Select doctor"
            options={participantOptions.doctors}
            error={errors.doctorId?.message}
            required
            {...register('doctorId')}
          />
          <Input
            label="Date & Time"
            type="datetime-local"
            error={errors.scheduledAt?.message}
            required
            {...register('scheduledAt')}
          />
          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => { setCreateOpen(false); reset(); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={
                participantOptions.patients.length === 0 ||
                participantOptions.doctors.length === 0
              }
            >
              Schedule
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
