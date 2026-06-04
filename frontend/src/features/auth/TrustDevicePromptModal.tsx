import { Monitor } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface TrustDevicePromptModalProps {
  open: boolean;
  loading?: boolean;
  onYes: () => void;
  onNo: () => void;
}

export function TrustDevicePromptModal({
  open,
  loading = false,
  onYes,
  onNo,
}: TrustDevicePromptModalProps) {
  return (
    <Modal
      open={open}
      onClose={onNo}
      dismissible={false}
      showCloseButton={false}
      size="sm"
      title="Trust this device?"
      description="You completed two-factor authentication. Choose whether to skip MFA on this browser for the next 30 days."
    >
      <div className="flex flex-col items-center text-center -mt-2 mb-2">
        <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
          <Monitor className="w-7 h-7 text-primary" />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-900">Yes</strong> — add this browser as a trusted device and skip MFA here for 30 days.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed mt-3">
          <strong className="text-slate-900">No</strong> — you will be asked for your MFA code again the next time you sign in on this browser.
        </p>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onNo}
          disabled={loading}
        >
          No, not this device
        </Button>
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={onYes}
          loading={loading}
        >
          Yes, trust this device
        </Button>
      </div>
    </Modal>
  );
}
