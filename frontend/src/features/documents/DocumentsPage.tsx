import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FileText, Image, Eye, Trash2, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Button, Card, Input, Select, Modal, ModalFooter,
  Pagination, EmptyState, Skeleton, FileUpload,
} from '@/components/ui';
import { DocumentStatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/layout/PageHeader';
import { documentsApi, documentKeys } from '@/api/documents.api';
import { appointmentsApi, appointmentKeys } from '@/api/appointments.api';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/types';
import { formatDate, formatFileSize } from '@/utils';

const uploadSchema = z.object({
  patientId: z.string().min(1, 'Select a patient'),
  documentType: z.string().optional(),
});
type UploadFormValues = z.infer<typeof uploadSchema>;

function DocumentCard({
  doc,
  onView,
  onDelete,
  canDelete,
}: {
  doc: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
    createdAt: string;
    documentType?: string;
    patient?: { firstName: string; lastName: string };
  };
  onView: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const isImage = doc.fileType.startsWith('image/');

  return (
    <Card padding="md" className="flex items-start gap-3 hover:shadow-elevated transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
        {isImage ? (
          <Image className="w-5 h-5 text-primary" />
        ) : (
          <FileText className="w-5 h-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate text-sm">{doc.fileName}</p>
        {doc.patient && (
          <p className="text-xs text-muted mt-0.5">
            {doc.patient.firstName} {doc.patient.lastName}
          </p>
        )}
        {doc.documentType && (
          <p className="text-xs text-muted">{doc.documentType}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <DocumentStatusBadge status={doc.processingStatus} />
          <span className="text-xs text-muted">{formatFileSize(doc.fileSize)}</span>
          <span className="text-xs text-muted">{formatDate(doc.createdAt)}</span>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {doc.processingStatus === 'ready' && (
          <button
            type="button"
            onClick={() => onView()}
            className="p-2 text-muted hover:text-primary hover:bg-primary-50 rounded-md transition-colors"
            aria-label={`View ${doc.fileName}`}
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-2 text-muted hover:text-danger hover:bg-danger-50 rounded-md transition-colors"
            aria-label={`Delete ${doc.fileName}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </Card>
  );
}

export function DocumentsPage() {
  const { role } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canUpload = role !== UserRole.PATIENT;

  const { data, isLoading } = useQuery({
    queryKey: documentKeys.list({ page, pageSize: 12 }),
    queryFn: () => documentsApi.list({ page, pageSize: 12 }),
  });

  const { data: appointments } = useQuery({
    queryKey: appointmentKeys.list({ pageSize: 100 }),
    queryFn: () => appointmentsApi.list({ pageSize: 100 }),
    enabled: canUpload,
  });

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (d) =>
        d.fileName.toLowerCase().includes(q) ||
        (d.documentType?.toLowerCase().includes(q) ?? false)
    );
  }, [data?.items, search]);

  const patientOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const appt of appointments?.items ?? []) {
      if (appt.patient) {
        map.set(appt.patientId, `${appt.patient.firstName} ${appt.patient.lastName}`);
      }
    }
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [appointments?.items]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
  });

  const uploadMutation = useMutation({
    mutationFn: (values: UploadFormValues) => documentsApi.upload({
      file: selectedFiles[0],
      patientId: values.patientId,
      documentType: values.documentType,
    }),
    onSuccess: () => {
      toast.success('Document uploaded!');
      setUploadOpen(false);
      setSelectedFiles([]);
      reset();
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
    onError: () => toast.error('Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      toast.success('Document deleted');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
    onError: () => toast.error('Delete failed'),
  });

  const handleView = () => {
    toast.error('Document preview is not available yet (no signed-URL endpoint on backend).');
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Documents"
        subtitle="Manage patient records and uploads"
        action={
          canUpload && (
            <Button onClick={() => setUploadOpen(true)} leftIcon={<Upload className="w-4 h-4" />}>
              Upload Document
            </Button>
          )
        }
      />

      <div className="flex gap-3">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search documents..."
            leadingIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="md">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No documents found"
          description="Upload patient records, reports, or other documents."
          action={
            canUpload && (
              <Button onClick={() => setUploadOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Upload Document
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onView={handleView}
              onDelete={() => setDeleteId(doc.id)}
              canDelete={role === UserRole.ADMIN || role === UserRole.DOCTOR}
            />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      {/* Upload Modal */}
      <Modal open={uploadOpen} onClose={() => { setUploadOpen(false); reset(); setSelectedFiles([]); }} title="Upload Document">
        <form onSubmit={handleSubmit((v) => {
          if (!selectedFiles.length) { toast.error('Please select a file'); return; }
          uploadMutation.mutate(v);
        })} className="space-y-4">
          <FileUpload
            onFilesSelected={setSelectedFiles}
            accept=".pdf,.jpg,.jpeg,.png"
            maxSizeMB={20}
          />
          <Select
            label="Patient"
            placeholder="Select patient"
            options={patientOptions}
            error={errors.patientId?.message}
            required
            {...register('patientId')}
          />
          <Input
            label="Document Type"
            placeholder="e.g. Lab Report, X-Ray, Prescription"
            {...register('documentType')}
          />
          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => { setUploadOpen(false); reset(); setSelectedFiles([]); }}>
              Cancel
            </Button>
            <Button type="submit" loading={uploadMutation.isPending} disabled={!selectedFiles.length}>
              Upload
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Document" size="sm">
        <p className="text-slate-700">Are you sure you want to delete this document? This cannot be undone.</p>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
