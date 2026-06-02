import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { UploadCloud, X, FileText, Image } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatFileSize } from '@/utils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  className?: string;
  error?: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-primary" />;
  return <FileText className="w-5 h-5 text-primary" />;
}

export function FileUpload({
  onFilesSelected,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMB = 20,
  multiple = false,
  className,
  error,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState('');

  const validate = (incoming: File[]): File[] => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    const valid: File[] = [];
    for (const f of incoming) {
      if (f.size > maxBytes) {
        setValidationError(`File "${f.name}" exceeds ${maxSizeMB}MB limit.`);
        return valid;
      }
      valid.push(f);
    }
    setValidationError('');
    return valid;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    const valid = validate(multiple ? dropped : [dropped[0]].filter(Boolean));
    if (valid.length) {
      setFiles(valid);
      onFilesSelected(valid);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const valid = validate(multiple ? selected : [selected[0]].filter(Boolean));
    if (valid.length) {
      setFiles(valid);
      onFilesSelected(valid);
    }
  };

  const removeFile = (idx: number) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    onFilesSelected(next);
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        aria-label="Upload files"
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
          dragging
            ? 'border-primary bg-primary-50'
            : 'border-border hover:border-primary/50 hover:bg-surface'
        )}
      >
        <UploadCloud className={cn('w-10 h-10 mx-auto mb-3', dragging ? 'text-primary' : 'text-muted')} />
        <p className="text-base font-medium text-slate-700">
          Drop files here or <span className="text-primary">browse</span>
        </p>
        <p className="text-sm text-muted mt-1">
          {accept.replace(/\./g, '').toUpperCase()} — max {maxSizeMB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="sr-only"
          aria-hidden="true"
        />
      </div>

      {(validationError || error) && (
        <p className="text-sm text-danger">{validationError || error}</p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-3 p-3 bg-surface rounded-md border border-border"
            >
              {getFileIcon(f.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{f.name}</p>
                <p className="text-xs text-muted">{formatFileSize(f.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="p-1 text-muted hover:text-danger transition-colors rounded"
                aria-label={`Remove ${f.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
