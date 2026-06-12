import { Radio } from 'lucide-react';
import type { LiveParticipant } from '@/api/consultations.api';

interface InCallBadgeProps {
  participants?: LiveParticipant[];
  compact?: boolean;
}

export function InCallBadge({ participants = [], compact = false }: InCallBadgeProps) {
  if (participants.length === 0) return null;

  if (compact) {
    const label =
      participants.length === 1
        ? participants[0].name
        : `${participants.length} in call`;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap flex-shrink-0">
        <Radio className="w-3 h-3 animate-pulse flex-shrink-0" />
        {label}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {participants.map((p) => (
        <span
          key={p.identity}
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"
        >
          <Radio className="w-3 h-3 animate-pulse" />
          {p.name}
          {p.role && (
            <span className="text-muted font-normal capitalize">({p.role})</span>
          )}
        </span>
      ))}
    </div>
  );
}
