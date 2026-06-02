import { Activity } from 'lucide-react';
import { Spinner } from '@/components/ui';

export function LoadingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-slate-900">CareMind AI</span>
      </div>
      <Spinner size="md" className="text-primary" />
    </div>
  );
}
