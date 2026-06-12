export type AvailabilityRule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type BookingSettings = {
  slotDurationMinutes: 'thirty' | 'sixty';
  minLeadTimeHours: number;
  maxAdvanceDays: number;
  timezone: string;
};

export type BookedSlot = {
  scheduledAt: Date;
  status: string;
};

const SLOT_MINUTES: Record<'thirty' | 'sixty', number> = {
  thirty: 30,
  sixty: 60,
};

const ACTIVE_STATUSES = new Set(['pending_approval', 'scheduled', 'in_progress']);

function parseTimeParts(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour: hour ?? 0, minute: minute ?? 0 };
}

/** Convert wall-clock time in IANA timezone to UTC Date. */
export function zonedTimeToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  let guess = Date.UTC(year, month - 1, day, hour, minute);
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      dtf
        .formatToParts(new Date(guess))
        .filter((p) => p.type !== 'literal')
        .map((p) => [p.type, p.value]),
    );
    const asUtc = Date.UTC(
      Number(parts['year']),
      Number(parts['month']) - 1,
      Number(parts['day']),
      Number(parts['hour']),
      Number(parts['minute']),
      Number(parts['second'] ?? 0),
    );
    guess += Date.UTC(year, month - 1, day, hour, minute) - asUtc;
  }
  return new Date(guess);
}

function dayOfWeekInTimezone(date: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

function ymdInTimezone(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts['year']),
    month: Number(parts['month']),
    day: Number(parts['day']),
  };
}

function addDaysUtc(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  bookedStart: Date,
  bookedDurationMs: number,
): boolean {
  const bookedEnd = new Date(bookedStart.getTime() + bookedDurationMs);
  return slotStart < bookedEnd && slotEnd > bookedStart;
}

export function generateAvailableSlots(
  rules: AvailabilityRule[],
  settings: BookingSettings,
  booked: BookedSlot[],
  now: Date = new Date(),
): string[] {
  const durationMs = SLOT_MINUTES[settings.slotDurationMinutes] * 60 * 1000;
  const minStart = new Date(now.getTime() + settings.minLeadTimeHours * 60 * 60 * 1000);
  const maxEnd = addDaysUtc(now, settings.maxAdvanceDays);

  const rulesByDay = new Map(rules.map((r) => [r.dayOfWeek, r]));
  const slots: string[] = [];

  for (let cursor = new Date(now); cursor <= maxEnd; cursor = addDaysUtc(cursor, 1)) {
    const dow = dayOfWeekInTimezone(cursor, settings.timezone);
    const rule = rulesByDay.get(dow);
    if (!rule) continue;

    const { year, month, day } = ymdInTimezone(cursor, settings.timezone);
    const start = parseTimeParts(rule.startTime);
    const end = parseTimeParts(rule.endTime);

    let slotStart = zonedTimeToUtc(
      settings.timezone,
      year,
      month,
      day,
      start.hour,
      start.minute,
    );
    const dayEnd = zonedTimeToUtc(settings.timezone, year, month, day, end.hour, end.minute);

    while (slotStart.getTime() + durationMs <= dayEnd.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + durationMs);

      if (slotStart >= minStart && slotStart <= maxEnd) {
        const taken = booked.some((b) => {
          if (!ACTIVE_STATUSES.has(b.status)) return false;
          return overlaps(slotStart, slotEnd, b.scheduledAt, durationMs);
        });
        if (!taken) {
          slots.push(slotStart.toISOString());
        }
      }

      slotStart = new Date(slotStart.getTime() + durationMs);
    }
  }

  return slots;
}

export function slotDurationMs(slotDuration: 'thirty' | 'sixty'): number {
  return SLOT_MINUTES[slotDuration] * 60 * 1000;
}

export const DEFAULT_AVAILABILITY_RULES: AvailabilityRule[] = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
  { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
  { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
  { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
  { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
];
