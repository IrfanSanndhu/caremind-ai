import { useMutation } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';
import { getApiErrorMessage } from '@/api/errors';
import { usersApi } from '@/api/users.api';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types';
import { cn } from '@/utils/cn';

export function canResendLoginDetails(
  currentRole: UserRole | null | undefined,
  targetRole: UserRole,
): boolean {
  if (!currentRole || targetRole === 'admin') return false;
  if (currentRole === 'admin') return targetRole === 'doctor' || targetRole === 'patient';
  if (currentRole === 'doctor') return targetRole === 'patient';
  return false;
}

interface ResendLoginDetailsButtonProps {
  userId: string;
  userLabel: string;
  targetRole: UserRole;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md';
  className?: string;
}

export function ResendLoginDetailsButton({
  userId,
  userLabel,
  targetRole,
  variant = 'icon',
  size = 'sm',
  className,
}: ResendLoginDetailsButtonProps) {
  const currentRole = useAuthStore((s) => s.role);

  const mutation = useMutation({
    mutationFn: () => usersApi.resendLoginDetails(userId),
    onSuccess: () => {
      toast.success(`Login details sent to ${userLabel}`);
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Failed to resend login details'));
    },
  });

  if (!canResendLoginDetails(currentRole, targetRole)) {
    return null;
  }

  if (variant === 'button') {
    return (
      <Button
        size={size}
        variant="secondary"
        leftIcon={<Mail className="w-4 h-4" />}
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
        className={className}
      >
        Resend login details
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={cn(
        'p-2 rounded-md border border-secondary-200 bg-secondary-50 text-secondary-600',
        'hover:bg-secondary-100 hover:text-secondary-700 hover:border-secondary-500/40',
        'transition-colors disabled:opacity-50',
        className
      )}
      aria-label={`Resend login details to ${userLabel}`}
      title="Resend login details"
    >
      <Mail className="w-4 h-4" />
    </button>
  );
}
