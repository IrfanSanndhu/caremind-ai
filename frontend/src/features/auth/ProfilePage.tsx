import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, ShieldCheck, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, CardHeader, Input, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export function ProfilePage() {
  const { user } = useAuthStore();
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [setupStep, setSetupStep] = useState<'qr' | 'verify'>('qr');

  const currentUser = user;

  const setupMfaMutation = useMutation({
    mutationFn: authApi.setupMfa,
    onSuccess: () => setSetupStep('verify'),
  });

  const enableMfaMutation = useMutation({
    mutationFn: (code: string) => authApi.enableMfa(code),
    onSuccess: async () => {
      toast.success('MFA enabled successfully!');
      setMfaSetupOpen(false);
      setMfaCode('');
      setSetupStep('qr');
      const current = useAuthStore.getState().user;
      if (current) {
        useAuthStore.getState().setUser({ ...current, mfaEnabled: true });
      }
    },
    onError: () => toast.error('Invalid code, please try again'),
  });

  const handleSetupMfa = () => {
    setMfaSetupOpen(true);
    setupMfaMutation.mutate();
  };

  const handleEnableMfa = () => {
    if (mfaCode.length === 6) {
      enableMfaMutation.mutate(mfaCode);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Profile" subtitle="Manage your account and security settings" />

      {/* User Info */}
      <Card className="mb-6">
        <CardHeader title="Account Information" />
        <div className="flex items-center gap-4">
          <Avatar name={currentUser?.name ?? currentUser?.email} size="xl" />
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              {currentUser?.name ?? 'Not set'}
            </h3>
            <p className="text-muted">{currentUser?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="primary" className="capitalize">{currentUser?.role}</Badge>
              {currentUser?.mfaEnabled && (
                <Badge variant="success">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  MFA Active
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* MFA Card */}
      <Card className="mb-6">
        <CardHeader
          title="Two-Factor Authentication"
          subtitle={
            currentUser?.mfaEnabled
              ? 'Your account is protected with MFA.'
              : 'Add an extra layer of security to your account.'
          }
          action={
            currentUser?.mfaEnabled ? (
              <Badge variant="success">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="gray">
                <Shield className="w-3.5 h-3.5 mr-1" />
                Disabled
              </Badge>
            )
          }
        />

        {!currentUser?.mfaEnabled && (
          <>
            {!mfaSetupOpen ? (
              <Button
                variant="outline"
                leftIcon={<Shield className="w-4 h-4" />}
                onClick={handleSetupMfa}
                loading={setupMfaMutation.isPending}
              >
                Enable Two-Factor Auth
              </Button>
            ) : (
              <div className="space-y-4">
                {setupStep === 'qr' && setupMfaMutation.data && (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-sm text-muted text-center">
                      Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy)
                    </p>
                    <div className="p-4 bg-white border border-border rounded-lg shadow-card">
                      <QRCodeSVG
                        value={setupMfaMutation.data.otpAuthUrl}
                        size={200}
                        level="M"
                      />
                    </div>
                    <p className="text-xs text-muted text-center max-w-xs">
                      Can't scan? Enter this code manually:{' '}
                      <code className="font-mono bg-surface px-1 py-0.5 rounded">
                        {setupMfaMutation.data.secret}
                      </code>
                    </p>
                    <Button onClick={() => setSetupStep('verify')}>
                      I've scanned the code
                    </Button>
                  </div>
                )}

                {setupStep === 'verify' && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted">
                      Enter the 6-digit code from your authenticator to verify and enable MFA:
                    </p>
                    <div className="flex gap-3 items-end">
                      <Input
                        label="Verification Code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        containerClassName="flex-1"
                      />
                      <Button
                        onClick={handleEnableMfa}
                        loading={enableMfaMutation.isPending}
                        disabled={mfaCode.length !== 6}
                      >
                        Verify
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMfaSetupOpen(false); setMfaCode(''); setSetupStep('qr'); }}
                      className="text-sm text-muted hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {currentUser?.mfaEnabled && (
          <div className="flex items-center gap-2 text-sm text-success-700 bg-success-50 rounded-md p-3">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            Two-factor authentication is active and protecting your account.
          </div>
        )}
      </Card>

      {/* Change Password Card — UI only */}
      <Card>
        <CardHeader
          title="Change Password"
          subtitle="Update your password (coming soon)"
          action={<Key className="w-5 h-5 text-muted" />}
        />
        <div className="space-y-3">
          <Input label="Current Password" type="password" placeholder="••••••••" disabled />
          <Input label="New Password" type="password" placeholder="••••••••" disabled />
          <Input label="Confirm New Password" type="password" placeholder="••••••••" disabled />
          <Button variant="outline" disabled>
            Update Password
          </Button>
        </div>
        <p className="text-xs text-muted mt-3">
          Password change will be available in a future release.
        </p>
      </Card>
    </div>
  );
}
