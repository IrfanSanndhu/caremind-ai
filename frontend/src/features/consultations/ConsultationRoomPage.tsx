import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { ChevronRight, FileText, Brain, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Spinner } from '@/components/ui';
import { appointmentsApi, appointmentKeys } from '@/api/appointments.api';
import { consultationsApi, consultationKeys } from '@/api/consultations.api';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/types';
import { cn } from '@/utils/cn';
import { ConsultationVideoRoom } from './ConsultationVideoRoom';

function SidePanel({
  appointmentId,
  onClose,
}: {
  appointmentId: string;
  onClose: () => void;
}) {
  const { data: transcript } = useQuery({
    queryKey: consultationKeys.transcript(appointmentId),
    queryFn: () => consultationsApi.getTranscript(appointmentId),
    refetchInterval: 10000,
    retry: 1,
  });

  const [activeTab, setActiveTab] = useState<'transcript' | 'ai'>('transcript');

  return (
    <div className="w-full h-full bg-slate-950/95 backdrop-blur-xl border-l border-white/10 flex flex-col shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex gap-2">
          {(['transcript', 'ai'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {tab === 'ai' ? 'AI Outputs' : 'Transcript'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1"
          aria-label="Close side panel"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'transcript' && (
          transcript ? (
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
              {transcript.content}
            </pre>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Transcript will appear here once recording is processed.
              </p>
            </div>
          )
        )}
        {activeTab === 'ai' && (
          <div className="text-center py-8">
            <Brain className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">AI outputs will be available after the consultation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConsentGate({
  appointmentId,
  onAccepted,
}: {
  appointmentId: string;
  onAccepted: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await appointmentsApi.updateConsent(appointmentId, 'accepted');
      onAccepted();
    } catch {
      toast.error('Failed to update consent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center" padding="lg">
        <div className="w-16 h-16 rounded-full bg-warning-50 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-warning" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Recording Consent</h2>
        <p className="text-muted text-base mb-6 leading-relaxed">
          This consultation session will be recorded for AI-assisted clinical note generation.
          Your recording will be processed securely and used only for this appointment.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => window.history.back()}>
            Decline & Leave
          </Button>
          <Button className="flex-1" loading={loading} onClick={handleAccept}>
            Accept & Join
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function ConsultationRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const [token, setToken] = useState('');
  const [livekitUrl, setLivekitUrl] = useState('');
  const [consentGranted, setConsentGranted] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const { data: appointment } = useQuery({
    queryKey: appointmentKeys.detail(id!),
    queryFn: () => appointmentsApi.get(id!),
    enabled: !!id,
  });

  const isDoctor = role === UserRole.DOCTOR || role === UserRole.ADMIN;
  const needsConsent =
    role === UserRole.PATIENT && appointment?.consentStatus !== 'accepted' && !consentGranted;

  const fetchToken = useCallback(async () => {
    if (!id) return;
    setTokenLoading(true);
    setTokenError('');
    try {
      const res = await consultationsApi.getJoinToken(id);
      if (res.requiresConsent) {
        setTokenError('Recording consent is required before joining.');
        return;
      }
      setToken(res.token);
      setLivekitUrl(res.livekitUrl);
    } catch {
      setTokenError('Failed to join consultation. Please try again.');
    } finally {
      setTokenLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!needsConsent) fetchToken();
  }, [needsConsent, fetchToken]);

  if (needsConsent) {
    return <ConsentGate appointmentId={id!} onAccepted={() => { setConsentGranted(true); fetchToken(); }} />;
  }

  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="text-white mx-auto mb-4" />
          <p className="text-white/80">Connecting to consultation room…</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <Card className="max-w-sm w-full text-center" padding="lg">
          <AlertTriangle className="w-10 h-10 text-danger mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Failed</h2>
          <p className="text-muted text-sm mb-4">{tokenError}</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate(`/appointments/${id}`)}>
              Back
            </Button>
            <Button className="flex-1" onClick={fetchToken}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!token || !livekitUrl || !id) return null;

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner size="lg" className="text-white" />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-900 overflow-hidden">
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect
        video
        audio
        onDisconnected={() => navigate(`/appointments/${id}`)}
        className="h-full w-full flex flex-col"
      >
        {appointment && (
          <ConsultationVideoRoom
            appointment={appointment}
            isDoctor={isDoctor}
            sidePanelOpen={sidePanelOpen}
            onToggleSidePanel={() => setSidePanelOpen((o) => !o)}
          />
        )}
      </LiveKitRoom>
      {sidePanelOpen && (
        <div className="absolute inset-y-0 right-0 z-40 w-full max-w-sm shadow-2xl">
          <SidePanel appointmentId={id} onClose={() => setSidePanelOpen(false)} />
        </div>
      )}
    </div>
  );
}
