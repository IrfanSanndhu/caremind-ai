import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight } from 'lucide-react';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { appointmentsApi, appointmentKeys } from '@/api/appointments.api';
import { formatDateTime } from '@/utils/formatDate';

export function AiOutputsPage() {
  const navigate = useNavigate();

  const { data: appointments, isLoading } = useQuery({
    queryKey: appointmentKeys.list({ pageSize: 50 }),
    queryFn: () => appointmentsApi.list({ pageSize: 50 }),
  });

  const items = appointments?.items ?? [];

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="AI Outputs"
        subtitle="Review AI-generated clinical notes per appointment"
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-6 w-64 mb-2" />
              <Skeleton className="h-4 w-40" />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Brain className="w-6 h-6" />}
          title="No appointments yet"
          description="AI outputs are generated after consultation recordings are processed. Complete a consultation first."
        />
      ) : (
        <div className="space-y-3">
          {items.map((appt) => (
            <Card key={appt.id} padding="md">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {appt.patient?.firstName} {appt.patient?.lastName}
                  </p>
                  <p className="text-sm text-muted">
                    Dr. {appt.doctor?.firstName} {appt.doctor?.lastName} · {formatDateTime(appt.scheduledAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  onClick={() => navigate(`/ai-outputs/${appt.id}`)}
                >
                  Review Outputs
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
