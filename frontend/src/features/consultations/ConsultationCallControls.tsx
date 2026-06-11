import { useState } from 'react';
import { useDisconnectButton, useMediaDeviceSelect } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { PhoneOff, Settings, Check } from 'lucide-react';
import { Modal } from '@/components/ui';
import { cn } from '@/utils/cn';
import { ConsultationMediaControl } from './ConsultationMediaControl';

function DeviceList({
  kind,
  title,
}: {
  kind: MediaDeviceKind;
  title: string;
}) {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({
    kind,
    requestPermissions: true,
  });

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <ul className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {devices.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted">No devices available</li>
        ) : (
          devices.map((device) => {
            const active = device.deviceId === activeDeviceId;
            return (
              <li key={device.deviceId}>
                <button
                  type="button"
                  onClick={() => void setActiveMediaDevice(device.deviceId)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors',
                    active ? 'bg-primary-50 text-primary' : 'hover:bg-surface text-slate-800'
                  )}
                >
                  <span className="flex-1 truncate">{device.label || 'Unknown device'}</span>
                  {active && <Check className="w-4 h-4 shrink-0" />}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export function ConsultationCallControls() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { buttonProps: leaveProps } = useDisconnectButton({});

  return (
    <>
      <div className="shrink-0 z-30 px-4 sm:px-6 pb-8 pt-3">
        <div
          className={cn(
            'mx-auto max-w-md flex items-center justify-center gap-3 sm:gap-4',
            'rounded-[2rem] px-4 sm:px-6 py-3.5',
            'bg-slate-900/75 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/40'
          )}
        >
          <ConsultationMediaControl
            source={Track.Source.Microphone}
            deviceKind="audioinput"
            label="Microphone"
          />
          <ConsultationMediaControl
            source={Track.Source.Camera}
            deviceKind="videoinput"
            label="Camera"
          />
          <button
            type="button"
            aria-label="Audio and video settings"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 text-white hover:bg-white/15 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Leave call"
            {...leaveProps}
            className="flex items-center justify-center w-14 h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-colors ml-1"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Call settings"
        description="Choose your microphone, camera, and speaker for this consultation."
        size="md"
        overlayClassName="z-[310]"
      >
        <div className="space-y-6">
          <DeviceList kind="audioinput" title="Microphone" />
          <DeviceList kind="videoinput" title="Camera" />
          <DeviceList kind="audiooutput" title="Speaker" />
        </div>
      </Modal>
    </>
  );
}
