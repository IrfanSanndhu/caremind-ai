import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

function slotDateKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function formatSlotTime(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
}

function parseDateKey(key: string): Date {
  return parseISO(key);
}

export function groupSlotsByDate(slots: string[], timeZone: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const slot of slots) {
    const key = slotDateKey(slot, timeZone);
    const list = map.get(key) ?? [];
    list.push(slot);
    map.set(key, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }
  return map;
}

interface BookingSlotCalendarProps {
  slots: string[];
  timeZone: string;
  selectedDate: string | null;
  selectedSlot: string | null;
  onSelectDate: (dateKey: string) => void;
  onSelectSlot: (slot: string) => void;
}

export function BookingSlotCalendar({
  slots,
  timeZone,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
}: BookingSlotCalendarProps) {
  const slotsByDate = useMemo(() => groupSlotsByDate(slots, timeZone), [slots, timeZone]);
  const availableDates = useMemo(
    () => Array.from(slotsByDate.keys()).sort(),
    [slotsByDate],
  );

  const firstAvailable = availableDates[0] ?? null;
  const [viewMonth, setViewMonth] = useState(() =>
    firstAvailable ? startOfMonth(parseDateKey(firstAvailable)) : startOfMonth(new Date()),
  );

  useEffect(() => {
    if (firstAvailable) {
      setViewMonth(startOfMonth(parseDateKey(firstAvailable)));
    }
  }, [firstAvailable]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const daySlots = selectedDate ? (slotsByDate.get(selectedDate) ?? []) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)] gap-0 lg:gap-0 border border-border rounded-xl overflow-hidden bg-white">
      {/* Calendar */}
      <div className="p-5 lg:border-r border-border">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className="p-2 rounded-md hover:bg-surface text-muted hover:text-slate-900 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base font-semibold text-slate-900">{format(viewMonth, 'MMMM yyyy')}</h3>
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-md hover:bg-surface text-muted hover:text-slate-900 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const hasSlots = slotsByDate.has(key);
            const isSelected = selectedDate === key;
            const inMonth = isSameMonth(day, viewMonth);

            return (
              <button
                key={key}
                type="button"
                disabled={!hasSlots}
                onClick={() => hasSlots && onSelectDate(key)}
                className={cn(
                  'aspect-square max-h-11 rounded-lg text-sm font-medium transition-all',
                  !inMonth && 'text-slate-300',
                  inMonth && !hasSlots && 'text-slate-300 cursor-not-allowed',
                  inMonth && hasSlots && !isSelected && 'text-slate-900 hover:bg-primary-50 hover:text-primary',
                  isSelected && 'bg-primary text-white shadow-sm hover:bg-primary-dark',
                  hasSlots && !isSelected && inMonth && 'ring-1 ring-primary/30 bg-primary-50/50',
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted mt-4">
          Highlighted dates have open slots within this doctor&apos;s booking window.
        </p>
      </div>

      {/* Time slots */}
      <div className="p-5 bg-surface/50 min-h-[280px] flex flex-col">
        {selectedDate ? (
          <>
            <p className="text-sm font-semibold text-slate-900 mb-1">
              {format(parseDateKey(selectedDate), 'EEEE, MMMM d')}
            </p>
            <p className="text-xs text-muted mb-4">{timeZone}</p>

            {daySlots.length === 0 ? (
              <p className="text-sm text-muted flex-1">No times on this day.</p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px] pr-1">
                {daySlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onSelectSlot(slot)}
                      className={cn(
                        'w-full py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors text-left',
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-800 border-border hover:border-primary hover:text-primary',
                      )}
                    >
                      {formatSlotTime(slot, timeZone)}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted text-center px-2">
            Select a highlighted date to see available times
          </div>
        )}
      </div>
    </div>
  );
}
