type AppointmentStatus =
  | 'pending_approval'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

const STATUS_RANK: Record<AppointmentStatus, number> = {
  pending_approval: 0,
  in_progress: 1,
  scheduled: 2,
  completed: 3,
  cancelled: 4,
};

type SortableAppointment = {
  status: string;
  scheduledAt: Date;
};

function scheduledAtMs(appt: SortableAppointment): number {
  return appt.scheduledAt instanceof Date
    ? appt.scheduledAt.getTime()
    : new Date(appt.scheduledAt).getTime();
}

/** Upcoming first (asc); completed/cancelled most recent first (desc). */
function compareScheduledAt(a: SortableAppointment, b: SortableAppointment): number {
  const desc =
    a.status === 'completed' || a.status === 'cancelled';
  const diff = scheduledAtMs(a) - scheduledAtMs(b);
  return desc ? -diff : diff;
}

export function sortAppointments<T extends SortableAppointment>(
  items: T[],
  statusFilter?: string,
): T[] {
  const sorted = [...items];

  if (statusFilter && statusFilter !== 'all') {
    sorted.sort(compareScheduledAt);
    return sorted;
  }

  sorted.sort((a, b) => {
    const rankA = STATUS_RANK[a.status as AppointmentStatus] ?? 99;
    const rankB = STATUS_RANK[b.status as AppointmentStatus] ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return compareScheduledAt(a, b);
  });

  return sorted;
}
