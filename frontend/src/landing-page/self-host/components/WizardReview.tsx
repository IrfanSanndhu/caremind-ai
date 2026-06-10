import { useState } from 'react';
import { Check, Copy, Download, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';
import { INSTALL_COMMAND } from '../self-host-content';
import { generateEnvPreview, type SelfHostFormValues } from '../self-host-env';

interface WizardReviewProps {
  values: SelfHostFormValues;
}

export function WizardReview({ values }: WizardReviewProps) {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const envPreview = generateEnvPreview(values);

  const copyText = async (text: string, type: 'cmd' | 'env') => {
    await navigator.clipboard.writeText(text);
    if (type === 'cmd') {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } else {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    }
    toast.success('Copied to clipboard');
  };

  const downloadEnv = () => {
    const blob = new Blob([envPreview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'caremind.env.preview';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded .env preview');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Ready to install</h2>
        <p className="text-muted text-sm">
          SSH into your server and run one command. No git clone — config lands in{' '}
          <code className="text-sm bg-surface px-1 rounded">/opt/caremind-ai</code>, app images pull
          from Docker Hub (<code className="text-sm bg-surface px-1 rounded">divescale/caremind-*</code>
          ), and your secrets go in <code className="text-sm bg-surface px-1 rounded">.env</code>.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-slate-900 text-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800/80">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Install on your server
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-300 hover:text-white hover:bg-white/10"
            onClick={() => copyText(INSTALL_COMMAND, 'cmd')}
            leftIcon={copiedCmd ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copiedCmd ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <pre className="p-4 text-sm overflow-x-auto font-mono text-emerald-300">
{`# SSH into your server, then run (root required — no git clone):
${INSTALL_COMMAND}`}
        </pre>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary-50/50 p-5">
        <h3 className="font-semibold text-slate-900 mb-3">After installation</h3>
        <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
          <li>Open <strong>https://{values.domain || 'your-domain'}</strong></li>
          <li>Register your first organization at <strong>/register</strong></li>
          <li>Each org gets an isolated tenant database automatically</li>
          <li>Edit <strong>.env</strong> anytime and restart with Docker Compose</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
          <span className="text-sm font-medium text-slate-700">Configuration preview (.env)</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyText(envPreview, 'env')}
              leftIcon={copiedEnv ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copiedEnv ? 'Copied' : 'Copy'}
            </Button>
            <Button size="sm" onClick={downloadEnv} leftIcon={<Download className="w-4 h-4" />}>
              Download
            </Button>
          </div>
        </div>
        <pre className="p-4 text-xs overflow-x-auto max-h-72 bg-white text-slate-600 font-mono">
          {envPreview}
        </pre>
      </div>
    </div>
  );
}
