import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, Clock, X } from 'lucide-react';
import { Button, Card, CardHeader, EmptyState, Skeleton } from '@/components/ui';
import { bookingApi } from '@/api/booking.api';
import { appointmentKeys } from '@/api/appointments.api';
import { dashboardKeys } from '@/api/dashboard.api';
import { getApiErrorMessage } from '@/api/errors';
import type { Appointment } from '@/types';
import { formatDateTime } from '@/utils/formatDate';

interface PendingRequestsPanelProps {
  items: Appointment[];
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

export function PendingRequestsPanel({
  items,
  loading = false,
  compact = false,
  className,
}: PendingRequestsPanelProps) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.doctor });
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.patient });
  };

  const approveMutation = useMutation({
    mutationFn: bookingApi.approveRequest,
    onSuccess: () => {
      toast.success('Appointment approved');
      invalidate();
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Failed to approve')),
  });

  const rejectMutation = useMutation({
    mutationFn: bookingApi.rejectRequest,
    onSuccess: () => {
      toast.success('Request declined');
      invalidate();
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Failed to decline')),
  });

  const content = loading ? (
    <Skeleton className={compact ? 'h-20 w-full' : 'h-32 w-full'} />
  ) : items.length === 0 ? (
    <EmptyState
      icon={<Clock className="w-6 h-6" />}
      title="No pending requests"
      description="New patient bookings will appear here for your approval."
    />
  ) : (
    <div className="space-y-3">
      {items.map((appt) => (
        <div
          key={appt.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-warning/30 bg-warning-50/40"
        >
          <div>
            <p className="font-semibold text-slate-900">
              {appt.patient?.firstName} {appt.patient?.lastName}
            </p>
            <p className="text-sm text-muted">{formatDateTime(appt.scheduledAt)}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              leftIcon={<Check className="w-4 h-4" />}
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate(appt.id)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<X className="w-4 h-4" />}
              loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate(appt.id)}
            >
              Decline
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader
        title="Pending requests"
        subtitle="Approve or decline patient booking requests"
      />
      <div className="pt-0">{content}</div>
    </Card>
  );
}
