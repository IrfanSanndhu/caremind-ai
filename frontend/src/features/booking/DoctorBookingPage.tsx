import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Button,
  Card,
  CardHeader,
  Input,
  Select,
  Skeleton,
} from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { bookingApi, bookingKeys, type AvailabilityRule, type SlotDuration } from '@/api/booking.api';
import { appointmentsApi, appointmentKeys } from '@/api/appointments.api';
import { getApiErrorMessage } from '@/api/errors';
import { AppointmentStatus } from '@/types';
import { cn } from '@/utils/cn';
import { PendingRequestsPanel } from './PendingRequestsPanel';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type DayRule = {
  enabled: boolean;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

function rulesToDayState(rules: AvailabilityRule[]): DayRule[] {
  const byDay = new Map(rules.map((r) => [r.dayOfWeek, r]));
  return DAY_LABELS.map((_, dayOfWeek) => {
    const rule = byDay.get(dayOfWeek);
    return {
      enabled: Boolean(rule),
      dayOfWeek,
      startTime: rule?.startTime ?? '09:00',
      endTime: rule?.endTime ?? '17:00',
    };
  });
}

export function DoctorBookingPage() {
  const queryClient = useQueryClient();
  const [slotDuration, setSlotDuration] = useState<SlotDuration>('thirty');
  const [minLeadTimeHours, setMinLeadTimeHours] = useState(2);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);
  const [dayRules, setDayRules] = useState<DayRule[]>(rulesToDayState([]));

  const configQuery = useQuery({
    queryKey: bookingKeys.config(),
    queryFn: bookingApi.getMyConfig,
  });

  const pendingQuery = useQuery({
    queryKey: appointmentKeys.list({ status: AppointmentStatus.PENDING_APPROVAL, pageSize: 50 }),
    queryFn: () =>
      appointmentsApi.list({ status: AppointmentStatus.PENDING_APPROVAL, pageSize: 50 }),
  });

  useEffect(() => {
    if (!configQuery.data) return;
    const { settings, rules } = configQuery.data;
    setSlotDuration(settings.slotDurationMinutes);
    setMinLeadTimeHours(settings.minLeadTimeHours);
    setMaxAdvanceDays(settings.maxAdvanceDays);
    setDayRules(rulesToDayState(rules));
  }, [configQuery.data]);

  const settingsMutation = useMutation({
    mutationFn: () =>
      bookingApi.updateSettings({
        slotDurationMinutes: slotDuration,
        minLeadTimeHours,
        maxAdvanceDays,
      }),
    onSuccess: () => {
      toast.success('Booking settings saved');
      void queryClient.invalidateQueries({ queryKey: bookingKeys.config() });
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to save settings')),
  });

  const availabilityMutation = useMutation({
    mutationFn: () => {
      const rules = dayRules
        .filter((d) => d.enabled)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
        }));
      if (rules.length === 0) {
        throw new Error('Enable at least one day');
      }
      return bookingApi.updateAvailability(rules);
    },
    onSuccess: () => {
      toast.success('Availability updated');
      void queryClient.invalidateQueries({ queryKey: bookingKeys.config() });
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Failed to update availability')),
  });

  const pendingItems = pendingQuery.data?.items ?? [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Book Appointment"
        subtitle="Manage your availability and review patient booking requests"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left — pending requests */}
        <div className="lg:sticky lg:top-6">
          <PendingRequestsPanel
            items={pendingItems}
            loading={pendingQuery.isLoading}
          />
        </div>

        {/* Right — settings + availability */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Booking settings"
              subtitle="Control slot length and how far ahead patients can book"
            />
            {configQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-4 pt-0">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select
                    label="Session length"
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value as SlotDuration)}
                    options={[
                      { value: 'thirty', label: '30 minutes' },
                      { value: 'sixty', label: '1 hour' },
                    ]}
                  />
                  <Input
                    label="Minimum notice (hours)"
                    type="number"
                    min={0}
                    max={168}
                    value={minLeadTimeHours}
                    onChange={(e) => setMinLeadTimeHours(Number(e.target.value))}
                    helperText="How long before a slot closes for booking"
                  />
                  <Input
                    label="Maximum advance booking (days)"
                    type="number"
                    min={1}
                    max={365}
                    value={maxAdvanceDays}
                    onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                    helperText="How far in the future patients can book"
                  />
                </div>
                <Button
                  onClick={() => settingsMutation.mutate()}
                  loading={settingsMutation.isPending}
                >
                  Save settings
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Weekly availability"
              subtitle="Set the hours patients can book each day"
            />
            {configQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="space-y-3 pt-0">
                {dayRules.map((day, index) => (
                  <div
                    key={day.dayOfWeek}
                    className={cn(
                      'flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border',
                      day.enabled ? 'border-primary/30 bg-primary-50/30' : 'border-border',
                    )}
                  >
                    <label className="flex items-center gap-2 min-w-[120px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(e) => {
                          const next = [...dayRules];
                          next[index] = { ...day, enabled: e.target.checked };
                          setDayRules(next);
                        }}
                        className="rounded border-border text-primary focus:ring-primary/30"
                      />
                      <span className="text-sm font-medium text-slate-900">
                        {DAY_LABELS[day.dayOfWeek]}
                      </span>
                    </label>
                    {day.enabled && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => {
                            const next = [...dayRules];
                            next[index] = { ...day, startTime: e.target.value };
                            setDayRules(next);
                          }}
                        />
                        <span className="text-muted text-sm">to</span>
                        <Input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => {
                            const next = [...dayRules];
                            next[index] = { ...day, endTime: e.target.value };
                            setDayRules(next);
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  onClick={() => availabilityMutation.mutate()}
                  loading={availabilityMutation.isPending}
                >
                  Save availability
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
