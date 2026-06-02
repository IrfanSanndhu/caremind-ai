import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Edit3, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, CardHeader, Textarea, Modal, Skeleton } from '@/components/ui';
import { AiOutputStatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/layout/PageHeader';
import { aiOutputsApi, aiOutputKeys } from '@/api/aiOutputs.api';
import type { AiOutput, AiOutputType } from '@/types';
import { AiOutputType as AiOutputTypeEnum } from '@/types';
import { formatDate } from '@/utils';

const TYPE_LABELS: Record<AiOutputType, string> = {
  soap_note: 'SOAP Note',
  clinical_summary: 'Clinical Summary',
  patient_summary: 'Patient Summary',
  followup_instructions: 'Follow-up Instructions',
};

const TYPE_ORDER: AiOutputType[] = [
  AiOutputTypeEnum.SOAP_NOTE,
  AiOutputTypeEnum.CLINICAL_SUMMARY,
  AiOutputTypeEnum.PATIENT_SUMMARY,
  AiOutputTypeEnum.FOLLOWUP_INSTRUCTIONS,
];

interface OutputCardProps {
  output: AiOutput;
  onRefresh: () => void;
}

function OutputCard({ output, onRefresh }: OutputCardProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(output.currentContent);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: history } = useQuery({
    queryKey: aiOutputKeys.history(output.id),
    queryFn: () => aiOutputsApi.getHistory(output.id),
    enabled: historyOpen,
  });

  const approveMutation = useMutation({
    mutationFn: (editedContent?: string) => aiOutputsApi.approve(output.id, editedContent),
    onSuccess: () => {
      toast.success('Output approved');
      setEditing(false);
      onRefresh();
      queryClient.invalidateQueries({ queryKey: aiOutputKeys.all });
    },
    onError: () => toast.error('Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => aiOutputsApi.reject(output.id),
    onSuccess: () => {
      toast.success('Output rejected');
      onRefresh();
      queryClient.invalidateQueries({ queryKey: aiOutputKeys.all });
    },
    onError: () => toast.error('Failed to reject'),
  });

  const isDirty = editContent !== output.currentContent;
  const actionLoading = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Card>
      <CardHeader
        title={TYPE_LABELS[output.type]}
        action={
          <div className="flex items-center gap-2">
            <AiOutputStatusBadge status={output.status} />
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="p-1.5 text-muted hover:text-slate-700 hover:bg-surface rounded-md transition-colors"
              aria-label="View history"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setEditing(false); setEditContent(output.currentContent); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!isDirty}
              loading={actionLoading}
              onClick={() => approveMutation.mutate(editContent)}
            >
              Save & Approve
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="prose prose-sm max-w-none mb-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {output.currentContent}
            </p>
          </div>

          {output.status === 'pending_review' && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                className="border-success text-success-700 hover:bg-success-50"
                leftIcon={<Check className="w-3.5 h-3.5" />}
                loading={actionLoading}
                onClick={() => approveMutation.mutate(undefined)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-danger text-danger hover:bg-danger-50"
                leftIcon={<X className="w-3.5 h-3.5" />}
                loading={actionLoading}
                onClick={() => rejectMutation.mutate()}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            </div>
          )}

          {(output.status === 'approved' || output.status === 'edited') && (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => setEditing(true)}
              className="mt-3"
            >
              Edit
            </Button>
          )}
        </div>
      )}

      {/* History Modal */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Edit History" size="lg">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">Original (AI Generated)</h3>
            <div className="bg-surface rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
              {history?.originalContent ?? output.originalContent}
            </div>
          </div>
          {(history?.currentContent ?? output.currentContent) !== (history?.originalContent ?? output.originalContent) && (
            <div>
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">Current</h3>
              <div className="bg-success-50 border border-success-100 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
                {history?.currentContent ?? output.currentContent}
              </div>
            </div>
          )}
          {history?.reviewedAt && (
            <p className="text-sm text-muted">
              Reviewed on {formatDate(history.reviewedAt)}
            </p>
          )}
        </div>
      </Modal>
    </Card>
  );
}

interface AiOutputDetailPageProps {
  appointmentId?: string;
  embedded?: boolean;
}

export function AiOutputDetailPage({ appointmentId: propAppointmentId, embedded = false }: AiOutputDetailPageProps) {
  const params = useParams<{ appointmentId: string }>();
  const appointmentId = propAppointmentId ?? params.appointmentId!;

  const { data: outputs, isLoading, refetch } = useQuery({
    queryKey: aiOutputKeys.byAppointment(appointmentId),
    queryFn: () => aiOutputsApi.getByAppointment(appointmentId),
    enabled: !!appointmentId,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!outputs || outputs.length === 0) {
    return (
      <Card>
        <div className="text-center py-10">
          <p className="text-muted">No AI outputs generated for this appointment yet.</p>
          <p className="text-sm text-muted mt-1">Outputs are generated after the consultation transcript is processed.</p>
        </div>
      </Card>
    );
  }

  const sortedOutputs = [...outputs].sort((a, b) => {
    return TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
  });

  return (
    <div className={embedded ? 'space-y-4' : 'p-6 space-y-6'}>
      {!embedded && (
        <PageHeader
          title="AI Outputs"
          subtitle={`${outputs.length} outputs for this appointment`}
        />
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {sortedOutputs.map((output) => (
          <OutputCard key={output.id} output={output} onRefresh={refetch} />
        ))}
      </div>
    </div>
  );
}
