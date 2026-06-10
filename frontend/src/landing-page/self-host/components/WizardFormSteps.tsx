import { ExternalLink } from 'lucide-react';
import { Input, Select } from '@/components/ui';
import { LLM_PROVIDERS } from '../self-host-content';
import type { SelfHostFormValues } from '../self-host-env';
import { PrerequisitesGrid } from './PrerequisitesGrid';

interface StepProps {
  values: SelfHostFormValues;
  onChange: <K extends keyof SelfHostFormValues>(key: K, value: SelfHostFormValues[K]) => void;
}

export function PrereqsStep() {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Gather these before you install</h2>
      <p className="text-muted mb-6">
        The installer will prompt for each value interactively. Use this checklist to prepare,
        or fill the wizard steps ahead of time and export a reference .env.
      </p>
      <PrerequisitesGrid />
    </div>
  );
}

export function DomainStep({ values, onChange }: StepProps) {
  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Domain & TLS</h2>
        <p className="text-muted text-sm">
          Create an A record pointing to your server&apos;s public IP before running the installer.
        </p>
      </div>
      <Input
        label="Domain"
        placeholder="caremind.clinic.example.com"
        value={values.domain}
        onChange={(e) => onChange('domain', e.target.value)}
        required
      />
      <Input
        label="Let's Encrypt email"
        type="email"
        placeholder="admin@clinic.example.com"
        value={values.acmeEmail}
        onChange={(e) => onChange('acmeEmail', e.target.value)}
        helperText="Used for TLS certificate expiry notifications"
        required
      />
    </div>
  );
}

export function DatabaseStep({ values, onChange }: StepProps) {
  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Database & MinIO</h2>
        <p className="text-muted text-sm">
          PostgreSQL and MinIO run in Docker. Leave passwords blank to auto-generate on the server.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Central DB user"
          value={values.centralDbUser}
          onChange={(e) => onChange('centralDbUser', e.target.value)}
        />
        <Input
          label="Central DB password"
          type="password"
          placeholder="Auto-generate on server"
          value={values.centralDbPassword}
          onChange={(e) => onChange('centralDbPassword', e.target.value)}
        />
        <Input
          label="Tenant DB user"
          value={values.tenantDbUser}
          onChange={(e) => onChange('tenantDbUser', e.target.value)}
        />
        <Input
          label="Tenant DB password"
          type="password"
          placeholder="Auto-generate on server"
          value={values.tenantDbPassword}
          onChange={(e) => onChange('tenantDbPassword', e.target.value)}
        />
        <Input
          label="MinIO access key"
          value={values.minioAccessKey}
          onChange={(e) => onChange('minioAccessKey', e.target.value)}
        />
        <Input
          label="MinIO secret key"
          type="password"
          placeholder="Auto-generate on server"
          value={values.minioSecretKey}
          onChange={(e) => onChange('minioSecretKey', e.target.value)}
        />
      </div>
    </div>
  );
}

export function LlmStep({ values, onChange }: StepProps) {
  const provider = LLM_PROVIDERS.find((p) => p.id === values.llmProvider);

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">AI / LLM provider</h2>
        <p className="text-muted text-sm">Choose your provider, then enter your API key and model.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {LLM_PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              onChange('llmProvider', p.id);
              onChange('llmModel', p.defaultModel);
            }}
            className={`text-left rounded-xl border p-4 transition-all ${
              values.llmProvider === p.id
                ? 'border-primary bg-primary-50 ring-2 ring-primary/20'
                : 'border-border bg-white hover:border-primary/40'
            }`}
          >
            <p className="font-semibold text-slate-900">{p.name}</p>
            <p className="text-sm text-muted mt-1">{p.description}</p>
          </button>
        ))}
      </div>

      {provider && (
        <a
          href={provider.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Get API key from {provider.name}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      <Input
        label="API key"
        type="password"
        placeholder={provider?.keyHint}
        value={values.llmApiKey}
        onChange={(e) => onChange('llmApiKey', e.target.value)}
        required
      />
      <Input
        label="Model"
        value={values.llmModel}
        onChange={(e) => onChange('llmModel', e.target.value)}
        helperText={`Default for ${provider?.name}: ${provider?.defaultModel}`}
        required
      />
    </div>
  );
}

export function IntegrationsStep({ values, onChange }: StepProps) {
  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Embeddings, STT & video</h2>
        <p className="text-muted text-sm">Required for document search, transcription, and video visits.</p>
      </div>
      <Input
        label="Voyage AI API key"
        type="password"
        placeholder="pa-..."
        value={values.voyageApiKey}
        onChange={(e) => onChange('voyageApiKey', e.target.value)}
        required
      />
      <Input
        label="Deepgram API key"
        type="password"
        value={values.deepgramApiKey}
        onChange={(e) => onChange('deepgramApiKey', e.target.value)}
        required
      />
      <Input
        label="LiveKit URL"
        placeholder="wss://your-project.livekit.cloud"
        value={values.livekitUrl}
        onChange={(e) => onChange('livekitUrl', e.target.value)}
        required
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="LiveKit API key"
          type="password"
          value={values.livekitApiKey}
          onChange={(e) => onChange('livekitApiKey', e.target.value)}
          required
        />
        <Input
          label="LiveKit API secret"
          type="password"
          value={values.livekitApiSecret}
          onChange={(e) => onChange('livekitApiSecret', e.target.value)}
          required
        />
      </div>
    </div>
  );
}

export function EmailStep({ values, onChange }: StepProps) {
  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Email delivery</h2>
        <p className="text-muted text-sm">Used for user invites, notifications, and password resets.</p>
      </div>

      <Select
        label="Provider"
        value={values.emailProvider}
        onChange={(e) => onChange('emailProvider', e.target.value as 'resend' | 'smtp')}
        options={[
          { value: 'resend', label: 'Resend (recommended)' },
          { value: 'smtp', label: 'SMTP' },
        ]}
      />

      <Input
        label="From email"
        type="email"
        placeholder="noreply@your-domain.com"
        value={values.emailFrom}
        onChange={(e) => onChange('emailFrom', e.target.value)}
        required
      />

      {values.emailProvider === 'resend' ? (
        <Input
          label="Resend API key"
          type="password"
          placeholder="re_..."
          value={values.resendApiKey}
          onChange={(e) => onChange('resendApiKey', e.target.value)}
          required
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="SMTP host"
            placeholder="smtp.example.com"
            value={values.smtpHost}
            onChange={(e) => onChange('smtpHost', e.target.value)}
            required
          />
          <Input
            label="SMTP port"
            value={values.smtpPort}
            onChange={(e) => onChange('smtpPort', e.target.value)}
            required
          />
          <Select
            label="TLS / SSL"
            value={values.smtpSecure ? 'true' : 'false'}
            onChange={(e) => onChange('smtpSecure', e.target.value === 'true')}
            options={[
              { value: 'false', label: 'No (STARTTLS on 587)' },
              { value: 'true', label: 'Yes (port 465)' },
            ]}
            containerClassName="sm:col-span-2"
          />
        </div>
      )}
    </div>
  );
}
